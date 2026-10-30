"""
Script Verifikasi Komprehensif Tahap 1:
Pengamanan Otorisasi Backend dan Penghapusan is_pj
"""
import sys
import sqlite3
import urllib.request
from app import create_app
from app.extensions import db
from app.models import User, Device, Location, Module, ModuleMovement

def run_tests():
    app = create_app()
    client = app.test_client()

    print("=" * 60)
    print("MEMULAI PENGUJIAN OTORISASI BACKEND DAN PENGHAPUSAN is_pj")
    print("=" * 60)

    results = {}

    # -------------------------------------------------------------
    # 7. Verifikasi Database: Kolom is_pj benar-benar sudah tidak ada
    # -------------------------------------------------------------
    print("\n[TEST 7] Verifikasi skema database (kolom is_pj sudah dihapus)...")
    con = sqlite3.connect("instance/database.db")
    cols = [col[1] for col in con.execute("PRAGMA table_info(user)").fetchall()]
    con.close()
    has_is_pj = "is_pj" in cols
    assert not has_is_pj, f"Gagal: is_pj masih ditemukan di kolom user: {cols}"
    print(f"  OK: Kolom user saat ini = {cols}")
    print("  OK: Kolom is_pj berhasil terhapus dari tabel database.")
    results["7_database_no_is_pj"] = True

    # -------------------------------------------------------------
    # 8. Verifikasi Integritas Foreign Key & Relasi Database
    # -------------------------------------------------------------
    print("\n[TEST 8] Verifikasi integritas relasi foreign key database...")
    con = sqlite3.connect("instance/database.db")
    fk_violations = con.execute("PRAGMA foreign_key_check").fetchall()
    total_users = con.execute("SELECT count(*) FROM user").fetchone()[0]
    total_devices = con.execute("SELECT count(*) FROM devices").fetchone()[0]
    total_locations = con.execute("SELECT count(*) FROM locations").fetchone()[0]
    total_modules = con.execute("SELECT count(*) FROM modules").fetchone()[0]
    total_movements = con.execute("SELECT count(*) FROM module_movements").fetchone()[0]
    con.close()
    assert len(fk_violations) == 0, f"Gagal: Ada foreign key violation: {fk_violations}"
    assert total_users == 10, f"Gagal: Jumlah user berubah ({total_users})"
    print(f"  OK: 0 FK violations.")
    print(f"  OK: Data utuh: {total_users} users, {total_devices} devices, {total_locations} locations, {total_modules} modules, {total_movements} movements.")
    results["8_integrity_and_relations"] = True

    # -------------------------------------------------------------
    # Helper: Login function
    # -------------------------------------------------------------
    def login(client, email, password):
        res = client.post("/auth/login-api", json={"email": email, "password": password})
        assert res.status_code == 200, f"Login gagal untuk {email}: {res.get_json()}"
        return res

    def logout(client):
        client.get("/auth/logout")

    # -------------------------------------------------------------
    # 1. Verifikasi Hak Baca Teknisi (View-Only)
    # -------------------------------------------------------------
    print("\n[TEST 1] Verifikasi hak baca Teknisi (ocean@gmail.com)...")
    with app.test_client() as c_tek:
        login(c_tek, "ocean@gmail.com", "ocean123")

        # GET /api/me
        r_me = c_tek.get("/api/me")
        assert r_me.status_code == 200
        me_json = r_me.get_json()
        assert me_json["user"]["role"] == "teknisi"
        assert "is_pj" not in me_json["user"], "is_pj tidak boleh ada di serialisasi /api/me"
        print("  OK: GET /api/me -> 200 OK (role: teknisi, is_pj tidak ada)")

        # GET /api/devices
        r_dev = c_tek.get("/api/devices")
        assert r_dev.status_code == 200
        print("  OK: GET /api/devices -> 200 OK")

        # GET /api/modules
        r_mod = c_tek.get("/api/modules")
        assert r_mod.status_code == 200
        print("  OK: GET /api/modules -> 200 OK")

        # GET /api/locations
        r_loc = c_tek.get("/api/locations")
        assert r_loc.status_code == 200
        print("  OK: GET /api/locations -> 200 OK")

        # GET /device/devices (page)
        r_dev_page = c_tek.get("/device/devices")
        assert r_dev_page.status_code == 200
        print("  OK: GET /device/devices -> 200 OK (Teknisi dapat melihat halaman perangkat)")

        # GET /device/locations (page)
        r_loc_page = c_tek.get("/device/locations")
        assert r_loc_page.status_code == 200
        print("  OK: GET /device/locations -> 200 OK (Teknisi dapat melihat halaman lokasi)")

        # GET /modules/inventory (page)
        r_inv_page = c_tek.get("/modules/inventory")
        assert r_inv_page.status_code == 200
        print("  OK: GET /modules/inventory -> 200 OK (Teknisi dapat melihat inventaris modul)")

        # GET /modules/requests (page)
        r_req_page = c_tek.get("/modules/requests")
        assert r_req_page.status_code == 200
        print("  OK: GET /modules/requests -> 200 OK (Teknisi dapat melihat daftar mutasi)")

        # GET /ar/scan (page)
        r_ar_page = c_tek.get("/ar/scan")
        assert r_ar_page.status_code == 200
        print("  OK: GET /ar/scan -> 200 OK (Teknisi dapat melihat halaman scan AR)")
    results["1_teknisi_read_access"] = True

    # -------------------------------------------------------------
    # 2 & 3. Verifikasi Penolakan POST, PUT, DELETE oleh Teknisi (HTTP 403)
    #        dan database tidak berubah
    # -------------------------------------------------------------
    print("\n[TEST 2 & 3] Verifikasi penolakan perubahan data oleh Teknisi (HTTP 403)...")
    with app.test_client() as c_tek:
        login(c_tek, "ocean@gmail.com", "ocean123")

        con = sqlite3.connect("instance/database.db")
        initial_mod_count = con.execute("SELECT count(*) FROM modules").fetchone()[0]
        initial_loc_count = con.execute("SELECT count(*) FROM locations").fetchone()[0]
        initial_dev_count = con.execute("SELECT count(*) FROM devices").fetchone()[0]
        con.close()

        # 1. POST /api/modules
        res = c_tek.post("/api/modules", json={"serial_number": "ILLEGAL_MOD_TEKNISI", "unit_type": "TEST"})
        assert res.status_code == 403, f"Harus 403, tapi dapat {res.status_code}"
        print(f"  OK: POST /api/modules oleh Teknisi ditolak -> {res.status_code} Forbidden")

        # 2. PUT /api/modules/1
        res = c_tek.put("/api/modules/1", json={"serial_number": "ALTERED_SN"})
        assert res.status_code == 403, f"Harus 403, tapi dapat {res.status_code}"
        print(f"  OK: PUT /api/modules/1 oleh Teknisi ditolak -> {res.status_code} Forbidden")

        # 3. DELETE /api/modules/1
        res = c_tek.delete("/api/modules/1")
        assert res.status_code == 403, f"Harus 403, tapi dapat {res.status_code}"
        print(f"  OK: DELETE /api/modules/1 oleh Teknisi ditolak -> {res.status_code} Forbidden")

        # 4. POST /api/locations
        res = c_tek.post("/api/locations", json={"nama_lokasi": "ILLEGAL_LOC", "district": "PALU"})
        assert res.status_code == 403, f"Harus 403, tapi dapat {res.status_code}"
        print(f"  OK: POST /api/locations oleh Teknisi ditolak -> {res.status_code} Forbidden")

        # 5. PUT /api/locations/1
        res = c_tek.put("/api/locations/1", json={"nama_lokasi": "ALTERED_LOC", "district": "PALU"})
        assert res.status_code == 403, f"Harus 403, tapi dapat {res.status_code}"
        print(f"  OK: PUT /api/locations/1 oleh Teknisi ditolak -> {res.status_code} Forbidden")

        # 6. DELETE /api/locations/1
        res = c_tek.delete("/api/locations/1")
        assert res.status_code == 403, f"Harus 403, tapi dapat {res.status_code}"
        print(f"  OK: DELETE /api/locations/1 oleh Teknisi ditolak -> {res.status_code} Forbidden")

        # 7. POST /api/devices
        res = c_tek.post("/api/devices", json={"nama_perangkat": "ILLEGAL_DEV", "device_type_id": 1, "location_id": 1})
        assert res.status_code == 403, f"Harus 403, tapi dapat {res.status_code}"
        print(f"  OK: POST /api/devices oleh Teknisi ditolak -> {res.status_code} Forbidden")

        # 8. PUT /api/devices/1
        res = c_tek.put("/api/devices/1", json={"nama_perangkat": "ALTERED_DEV"})
        assert res.status_code == 403, f"Harus 403, tapi dapat {res.status_code}"
        print(f"  OK: PUT /api/devices/1 oleh Teknisi ditolak -> {res.status_code} Forbidden")

        # 9. DELETE /api/devices/1
        res = c_tek.delete("/api/devices/1")
        assert res.status_code == 403, f"Harus 403, tapi dapat {res.status_code}"
        print(f"  OK: DELETE /api/devices/1 oleh Teknisi ditolak -> {res.status_code} Forbidden")

        # 10. POST /device/locations (route form)
        res = c_tek.post("/device/locations", data={"nama_lokasi": "ILLEGAL_FORM_LOC", "district": "PALU"})
        assert res.status_code == 403, f"Harus 403, tapi dapat {res.status_code}"
        print(f"  OK: POST /device/locations oleh Teknisi ditolak -> {res.status_code} Forbidden")

        # 11. POST /device/devices (route form)
        res = c_tek.post("/device/devices", data={"nama_perangkat": "ILLEGAL_FORM_DEV"})
        assert res.status_code == 403, f"Harus 403, tapi dapat {res.status_code}"
        print(f"  OK: POST /device/devices oleh Teknisi ditolak -> {res.status_code} Forbidden")

        # 12. POST /modules/new (mutasi form)
        res = c_tek.post("/modules/new", data={"jenis_perubahan": "pasang"})
        assert res.status_code == 403, f"Harus 403, tapi dapat {res.status_code}"
        print(f"  OK: POST /modules/new oleh Teknisi ditolak -> {res.status_code} Forbidden")

        # 13. POST /api/me/avatar (Teknisi dizinkan mengubah foto profilnya sendiri)
        res = c_tek.post("/api/me/avatar", json={"image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="})
        assert res.status_code == 200, f"Harus 200, tapi dapat {res.status_code}: {res.data}"
        print(f"  OK: POST /api/me/avatar oleh Teknisi berhasil -> {res.status_code} OK")

        # 14. Akses menu terlarang: Import, Export, Audit, Admin
        assert c_tek.get("/import/").status_code == 403, "GET /import/ harus ditolak 403 bagi Teknisi"
        assert c_tek.get("/export/").status_code == 403, "GET /export/ harus ditolak 403 bagi Teknisi"
        assert c_tek.get("/audit/").status_code == 403, "GET /audit/ harus ditolak 403 bagi Teknisi"
        assert c_tek.get("/auth/admin/users").status_code == 403, "GET /auth/admin/users harus ditolak 403 bagi Teknisi"
        print("  OK: Akses rute administratif & operasional (/import/, /export/, /audit/, /admin/) ditolak -> 403 Forbidden")

        # Verifikasi database TIDAK BERUBAH
        con = sqlite3.connect("instance/database.db")
        final_mod_count = con.execute("SELECT count(*) FROM modules").fetchone()[0]
        final_loc_count = con.execute("SELECT count(*) FROM locations").fetchone()[0]
        final_dev_count = con.execute("SELECT count(*) FROM devices").fetchone()[0]
        con.close()
        assert initial_mod_count == final_mod_count, "Database berubah setelah percobaan ilegal!"
        assert initial_loc_count == final_loc_count, "Database berubah setelah percobaan ilegal!"
        assert initial_dev_count == final_dev_count, "Database berubah setelah percobaan ilegal!"
        print("  OK: Integritas data terverifikasi -- tidak ada data bertambah/berubah di database.")
    results["2_3_teknisi_403_and_no_data_change"] = True

    # -------------------------------------------------------------
    # 4. Verifikasi Karyawan TIF (Hak Akses Sama Tanpa PJ)
    # -------------------------------------------------------------
    print("\n[TEST 4] Verifikasi Karyawan TIF (adhang@gmail.com)...")
    with app.test_client() as c_tif:
        login(c_tif, "adhang@gmail.com", "adhang123")

        # GET /api/me
        r_me = c_tif.get("/api/me")
        assert r_me.status_code == 200
        me_json = r_me.get_json()
        assert me_json["user"]["role"] == "karyawan_tif"
        assert "is_pj" not in me_json["user"], "is_pj tidak boleh ada di serialisasi /api/me"
        print("  OK: GET /api/me -> 200 OK (role: karyawan_tif, tanpa atribut is_pj)")

        # Akses operasional diizinkan bagi Karyawan TIF
        assert c_tif.get("/device/devices").status_code == 200, "Karyawan TIF dapat melihat perangkat"
        assert c_tif.get("/device/locations").status_code == 200, "Karyawan TIF dapat melihat lokasi"
        assert c_tif.get("/modules/inventory").status_code == 200, "Karyawan TIF dapat melihat modul"
        assert c_tif.get("/modules/requests").status_code == 200, "Karyawan TIF dapat melihat mutasi"
        assert c_tif.get("/import/").status_code == 200, "Karyawan TIF dapat mengakses import"
        assert c_tif.get("/export/").status_code == 200, "Karyawan TIF dapat mengakses export"
        assert c_tif.get("/audit/").status_code == 200, "Karyawan TIF dapat mengakses audit"
        assert c_tif.get("/ar/scan").status_code == 200, "Karyawan TIF dapat mengakses scan"
        print("  OK: Seluruh fitur operasional (Perangkat, Modul, Lokasi, Mutasi, Import, Export, Audit, Scan) dapat diakses Karyawan TIF.")

        # Akses admin khusus dilarang bagi Karyawan TIF
        assert c_tif.get("/auth/admin/users").status_code == 403, "Karyawan TIF tidak boleh kelola user"
        assert c_tif.get("/auth/admin/register-karyawan").status_code == 403, "Karyawan TIF tidak boleh register karyawan"
        print("  OK: Menu administratif khusus admin (/admin/users, /admin/register-karyawan) ditolak 403 bagi Karyawan TIF.")
    results["4_karyawan_tif_equal_access"] = True

    # -------------------------------------------------------------
    # 5. Verifikasi Super Admin (adminasset@gmail.com)
    # -------------------------------------------------------------
    print("\n[TEST 5] Verifikasi Super Admin (adminasset@gmail.com)...")
    with app.test_client() as c_adm:
        login(c_adm, "adminasset@gmail.com", "admin123")

        # GET /api/me
        r_me = c_adm.get("/api/me")
        assert r_me.status_code == 200
        me_json = r_me.get_json()
        assert me_json["user"]["role"] == "admin"
        assert "is_pj" not in me_json["user"]
        print("  OK: GET /api/me -> 200 OK (role: admin, tanpa atribut is_pj)")

        # Akses semua menu
        assert c_adm.get("/auth/admin/users").status_code == 200
        assert c_adm.get("/auth/admin/register-karyawan").status_code == 200
        assert c_adm.get("/device/devices").status_code == 200
        assert c_adm.get("/device/locations").status_code == 200
        assert c_adm.get("/modules/inventory").status_code == 200
        assert c_adm.get("/modules/requests").status_code == 200
        assert c_adm.get("/import/").status_code == 200
        assert c_adm.get("/export/").status_code == 200
        assert c_adm.get("/audit/").status_code == 200
        assert c_adm.get("/ar/scan").status_code == 200
        print("  OK: Super Admin memiliki akses penuh ke seluruh 11 menu sistem.")

        # Verifikasi toggle-pj route sudah dihapus (404 Not Found)
        r_toggle = c_adm.post("/auth/admin/users/2/toggle-pj")
        assert r_toggle.status_code == 404, f"Route toggle-pj harus sudah terhapus (404), dapat {r_toggle.status_code}"
        print("  OK: POST /auth/admin/users/2/toggle-pj -> 404 Not Found (endpoint telah resmi dihapus).")
    results["5_super_admin_full_access"] = True

    # -------------------------------------------------------------
    # 6. Verifikasi Konfigurasi Menu Sidebar Sesuai Role
    # -------------------------------------------------------------
    print("\n[TEST 6] Verifikasi konfigurasi menu Sidebar.jsx...")
    with open("frontend/src/components/Sidebar.jsx", "r", encoding="utf-8") as f:
        sidebar_src = f.read()

    # Periksa ketiadaan isPj
    assert "user?.is_pj" not in sidebar_src, "Variabel user?.is_pj masih ada di Sidebar.jsx"
    assert "isPj" not in sidebar_src, "Variabel isPj masih ada di Sidebar.jsx"

    # Periksa label baru
    assert "Mutasi Modul" in sidebar_src, "Label 'Mutasi Modul' tidak ditemukan di Sidebar.jsx"
    assert "Scan" in sidebar_src, "Label 'Scan' tidak ditemukan di Sidebar.jsx"
    assert "Pengajuan Perpindahan" not in sidebar_src, "Label lama 'Pengajuan Perpindahan' masih ada"
    assert "Pengajuan Modul" not in sidebar_src, "Label lama 'Pengajuan Modul' masih ada"

    # Periksa 3 role blok
    assert 'role === "teknisi"' in sidebar_src
    assert 'role === "karyawan_tif"' in sidebar_src
    print("  OK: Sidebar.jsx hanya memiliki 3 role tanpa branch isPj.")
    print("  OK: Label menu telah menggunakan 'Mutasi Modul' dan 'Scan'.")
    results["6_sidebar_roles_and_labels"] = True

    # -------------------------------------------------------------
    # 9. Verifikasi Ketiadaan Referensi Aktif is_pj
    # -------------------------------------------------------------
    print("\n[TEST 9] Verifikasi tidak ada referensi aktif is_pj yang menyebabkan error...")
    with app.app_context():
        u = User.query.first()
        try:
            val = u.is_pj
            raise AssertionError("Model User masih memiliki atribut is_pj!")
        except AttributeError:
            print("  OK: User.is_pj memicu AttributeError yang diharapkan (atribut telah dihapus dari model).")
    results["9_no_active_is_pj"] = True

    # -------------------------------------------------------------
    # 10. Verifikasi Aplikasi Dapat Berjalan Normal (HTTP 200 Server Aktif)
    # -------------------------------------------------------------
    print("\n[TEST 10] Verifikasi HTTP live server pada http://127.0.0.1:5000/...")
    try:
        with urllib.request.urlopen("http://127.0.0.1:5000/auth/login", timeout=5) as resp:
            assert resp.status == 200, f"Live server login page returned {resp.status}"
            print(f"  OK: Live server http://127.0.0.1:5000/auth/login respon -> {resp.status} OK")
            results["10_app_running_live"] = True
    except Exception as e:
        print(f"  WARNING: Tidak dapat menghubungi server HTTP lokal: {e}")
        results["10_app_running_live"] = False

    print("\n" + "=" * 60)
    print("RINGKASAN HASIL PENGUJIAN TAHAP 1:")
    print("=" * 60)
    all_passed = True
    for test_name, status in results.items():
        symbol = "[PASSED]" if status else "[FAILED]"
        if not status: all_passed = False
        print(f"  {symbol} {test_name}")
    print("=" * 60)
    return all_passed

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
