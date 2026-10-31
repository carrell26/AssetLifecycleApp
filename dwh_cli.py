"""
================================================================================
DATA WAREHOUSE & BUSINESS INTELLIGENCE CLI TOOL
Mata Kuliah: Gudang Data / Data Warehouse (F09252042 - 3 SKS)
================================================================================
Alat bantu interaktif terminal untuk:
1. Menjalankan pipeline ETL (Extract, Transform, Load) secara background/manual.
2. Menampilkan audit kualitas data & SHA-256 batch integrity hash.
3. Menjalankan query analisis OLAP (Roll-up, Drill-down, Slice/Dice, Pivot).
4. Menampilkan struktur Skema Bintang (Star Schema).

Penggunaan:
  python dwh_cli.py run-etl
  python dwh_cli.py olap-report
  python dwh_cli.py schema
  python dwh_cli.py status
================================================================================
"""
import sys
import argparse
from app import create_app
from app.modules.warehouse.etl import run_etl_pipeline
from app.modules.warehouse.olap import (
    get_warehouse_overview,
    olap_query_movements,
    olap_query_requests,
    olap_pivot_table
)
from app.modules.warehouse.models import (
    DimDate,
    DimDevice,
    DimModule,
    DimLocation,
    DimUser,
    FactModuleMovement,
    FactRequestFulfillment,
    DwhEtlLog
)


def cmd_run_etl(app):
    print("\n" + "=" * 75)
    print(" [1/3] MEMULAI SIKLUS PIPELINE ETL (EXTRACT - TRANSFORM - LOAD)")
    print("=" * 75)
    with app.app_context():
        print(" -> Menjalankan proses ekstraksi dari tabel operasional (OLTP)...")
        print(" -> Menjalankan data cleansing & aturan validasi kualitas data...")
        print(" -> Menghitung durasi pemakaian modul & pembuatan surrogate key...")
        print(" -> Memuat data ke tabel dimensi & fakta Skema Bintang...")

        res = run_etl_pipeline()

        if res.get("success"):
            print("\n" + "-" * 75)
            print(" [STATUS]: SUKSES (SUCCESS)")
            print(f" -> Waktu Eksekusi       : {res['duration_seconds']} detik")
            print(f" -> Rekaman Diekstrak    : {res['records_extracted']} baris data mentah")
            print(f" -> Fakta Dimuat ke DWH  : {res['records_loaded']} baris fakta analitik")
            print(f" -> Isu Cleansing/Anomali: {res['quality_issues_count']} catatan")
            print(f" -> SHA-256 Batch Hash   : {res['integrity_hash']}")
            print("-" * 75)
            print(" Data Warehouse berhasil disinkronisasikan secara sempurna!\n")
        else:
            print("\n [STATUS]: GAGAL (FAILED)")
            print(f" Error: {res.get('error')}\n")


def cmd_olap_report(app):
    print("\n" + "=" * 80)
    print(" LAPORAN OPERASI QUERY OLAP (MULTIDIMENSIONAL ANALYTICS REPORT)")
    print("=" * 80)

    with app.app_context():
        # 1. Overview Metrik
        overview = get_warehouse_overview()
        kpi = overview["kpi"]
        print("\n--- [A. EXECUTIVE KPI & DATA MART SUMMARY] ---")
        print(f" * Total Fakta Analitik di DWH : {kpi['total_facts_recorded']}")
        print(f" * Total Mutasi Modul Fisik    : {kpi['total_movements']}")
        print(f" * Total Permohonan Modul      : {kpi['total_requests']}")
        print(f" * Rata-rata Umur Modul di Rak : {kpi['avg_module_lifespan_days']} hari")
        print(f" * Rata-rata Respon SLA Request: {kpi['avg_request_lead_time_hours']} jam")
        print(f" * Rasio Persetujuan (SLA)     : {kpi['request_acceptance_rate']}%")

        # 2. OLAP Roll-up / Drill-down (Waktu)
        print("\n--- [B. OPERASI OLAP: ROLL-UP / DRILL-DOWN WAKTU (DATA MART 1)] ---")
        movements_month = olap_query_movements(granularity="month")
        series = movements_month.get("series", [])
        if series:
            print(f"{'Periode Waktu':<15} | {'Pasang':<8} | {'Pindah':<8} | {'Lepas':<8} | {'Total':<8} | {'Rata2 Umur (Hari)':<18}")
            print("-" * 78)
            for item in series:
                print(f"{item['period']:<15} | {item['pasang']:<8} | {item['pindah']:<8} | {item['lepas']:<8} | {item['total_movements']:<8} | {item['avg_duration']:<18}")
        else:
            print(" (Belum ada rekaman fakta pergerakan modul)")

        # 3. OLAP Pivot Table (Cross-Tabulation)
        print("\n--- [C. OPERASI OLAP: MATRIKS PIVOT (TIPE MODUL X TIPE PERANGKAT)] ---")
        pivot = olap_pivot_table()
        col_headers = pivot.get("column_headers", [])
        rows = pivot.get("rows", [])
        if rows and col_headers:
            header_str = f"{'Tipe Modul (Row)':<20} | " + " | ".join(f"{c:<10}" for c in col_headers) + " | Total"
            print(header_str)
            print("-" * len(header_str))
            for r in rows:
                row_str = f"{r['module_type']:<20} | " + " | ".join(f"{r.get(c, 0):<10}" for c in col_headers) + f" | {r['_total']}"
                print(row_str)
        else:
            print(" (Belum ada data silang modul dan perangkat)")

        # 4. Status Integritas Terakhir
        last_etl = overview.get("last_etl", {})
        print("\n--- [D. VALIDASI INTEGRITAS DATA (DATA INTEGRITY AUDIT)] ---")
        print(f" * Status ETL Terakhir : {last_etl.get('status')}")
        print(f" * Timestamp           : {last_etl.get('run_timestamp')}")
        print(f" * SHA-256 Batch Hash  : {last_etl.get('integrity_hash')}")
        print("=" * 80 + "\n")


def cmd_schema(app):
    print("\n" + "=" * 75)
    print(" STRUKTUR SKEMA BINTANG (KIMBALL STAR SCHEMA ARCHITECTURE)")
    print("=" * 75)
    with app.app_context():
        print("""
 [PUSAT FAKTA 1] : dwh_fact_module_movement
   - Grain       : 1 record = 1 kejadian perpindahan/instalasi modul
   - PK          : fact_movement_id
   - Foreign Keys:
       * date_key         --> dwh_dim_date (Surrogate Key YYYYMMDD)
       * module_key       --> dwh_dim_module (Surrogate Key)
       * to_device_key    --> dwh_dim_device (Surrogate Key)
       * location_key     --> dwh_dim_location (Surrogate Key)
       * user_key         --> dwh_dim_user (Surrogate Key)
   - Ukuran/Fakta: durasi_terpasang_hari (Semi-additive), movement_count (Additive)

 [PUSAT FAKTA 2] : dwh_fact_request_fulfillment
   - Grain       : 1 record = 1 pengajuan permohonan modul
   - PK          : fact_request_id
   - Foreign Keys: request_date_key, approval_date_key, module_key, requester_user_key
   - Ukuran/Fakta: lead_time_jam (Additive SLA measure), is_approved

 [TABEL DIMENSI] :
   1. dwh_dim_date     : date_key, full_date, day_name, month_name, quarter, year
   2. dwh_dim_device   : device_key, original_device_id, nama_perangkat, tipe, total_slots
   3. dwh_dim_module   : module_key, original_module_id, serial_number, tipe_modul, kondisi
   4. dwh_dim_location : location_key, original_location_id, nama_lokasi
   5. dwh_dim_user     : user_key, original_user_id, username, nama_lengkap, role, divisi

 [LOG & INTEGRITAS]:
   * dwh_etl_log       : run_timestamp, status, records_loaded, SHA-256 integrity_hash
        """)
        print("=" * 75 + "\n")


def cmd_status(app):
    with app.app_context():
        overview = get_warehouse_overview()
        dims = overview["dimensions"]
        kpi = overview["kpi"]
        last = overview["last_etl"]
        print("\n" + "=" * 60)
        print(" STATUS DATA WAREHOUSE (DI BALIK LAYAR / BACKEND)")
        print("=" * 60)
        print(f" Tabel Dimensi Waktu      : {dims['dates']} baris")
        print(f" Tabel Dimensi Perangkat  : {dims['devices']} baris")
        print(f" Tabel Dimensi Modul      : {dims['modules']} baris")
        print(f" Tabel Dimensi Lokasi     : {dims['locations']} baris")
        print(f" Tabel Dimensi Pengguna   : {dims['users']} baris")
        print("-" * 60)
        print(f" Tabel Fakta Mutasi       : {kpi['total_movements']} baris")
        print(f" Tabel Fakta Permohonan   : {kpi['total_requests']} baris")
        print("-" * 60)
        print(f" Status Pipeline Terakhir : {last['status']} ({last['run_timestamp']})")
        print(f" SHA-256 Batch Hash       : {last['integrity_hash']}")
        print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Data Warehouse CLI Tool")
    parser.add_argument(
        "action",
        choices=["run-etl", "olap-report", "schema", "status"],
        help="Aksi yang ingin dijalankan: run-etl, olap-report, schema, status"
    )

    args = parser.parse_args()
    app = create_app()

    if args.action == "run-etl":
        cmd_run_etl(app)
    elif args.action == "olap-report":
        cmd_olap_report(app)
    elif args.action == "schema":
        cmd_schema(app)
    elif args.action == "status":
        cmd_status(app)


if __name__ == "__main__":
    main()
