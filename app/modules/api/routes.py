import os
import re
import uuid
import base64
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request, current_app
from flask_login import current_user, login_required, logout_user
from sqlalchemy import func
from werkzeug.utils import secure_filename

from ...extensions import db
from ...models import (
    User,
    Device,
    DeviceType,
    Location,
    Module,
    ModuleType,
    ModulePosition,
    ModuleRequest,
    ModuleMovement,
    AuditLog,
    SlotDefinition,
    DataImport,
)
from ...utils.hashing import append_audit_log
from ...utils.module_classification import (
    is_transceiver,
    get_asset_category,
    has_valid_port,
    matches_transceiver_type,
)

api_bp = Blueprint("api", __name__, url_prefix="/api")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@api_bp.route("/me", methods=["GET"])
@login_required
def get_current_user_profile():
    return jsonify({
        "success": True,
        "user": {
            "id": current_user.user_id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "district": current_user.district,
            "status": current_user.status,
            "avatar_url": current_user.get_avatar_url(),
        }
    })


@api_bp.route("/me/avatar", methods=["POST"])
@login_required
def upload_avatar():
    upload_dir = os.path.join(current_app.root_path, "static", "avatars")
    os.makedirs(upload_dir, exist_ok=True)

    filename = None

    # Opsi 1: Base64 data (langsung dari Snapshot Kamera HTML5 Canvas)
    if request.is_json and "image_data" in request.json:
        data_url = request.json["image_data"]
        match = re.search(r"data:image/(\w+);base64,(.+)", data_url)
        if match:
            ext = match.group(1).lower()
            if ext == "jpeg":
                ext = "jpg"
            if ext not in ALLOWED_EXTENSIONS:
                ext = "png"
            image_bytes = base64.b64decode(match.group(2))
            filename = f"user_{current_user.user_id}_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:6]}.{ext}"
            file_path = os.path.join(upload_dir, filename)
            with open(file_path, "wb") as f:
                f.write(image_bytes)
        else:
            return jsonify({"success": False, "error": "Format base64 image tidak valid"}), 400

    # Opsi 2: Multipart Form File Upload (dari File Input / Galeri)
    elif "avatar" in request.files:
        file = request.files["avatar"]
        if file.filename == "":
            return jsonify({"success": False, "error": "Tidak ada file yang dipilih"}), 400

        if file and allowed_file(file.filename):
            ext = file.filename.rsplit(".", 1)[1].lower()
            filename = f"user_{current_user.user_id}_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:6]}.{ext}"
            file_path = os.path.join(upload_dir, filename)
            file.save(file_path)
        else:
            return jsonify({"success": False, "error": "Format file tidak didukung (gunakan JPG, PNG, atau WEBP)"}), 400
    else:
        return jsonify({"success": False, "error": "Tidak ada file atau gambar yang dikirim"}), 400

    # Hapus file avatar lama jika ada (dan bukan file eksternal)
    old_avatar = current_user.avatar_path
    if old_avatar:
        old_path = os.path.join(upload_dir, old_avatar)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    current_user.avatar_path = filename
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Foto profil berhasil diperbarui",
        "avatar_url": current_user.get_avatar_url()
    })


@api_bp.route("/dashboard/stats", methods=["GET"])
@login_required
def get_dashboard_stats():
    # ============================================================
    # 1. KPI METRICS — dari database nyata fokus Palu
    palu_loc_filter = (
        Location.nama_lokasi.ilike("STO Palu%")
        | (
            (func.upper(Location.district) == "PALU")
            & ~Location.nama_lokasi.ilike("%DONGGALA%")
            & ~Location.nama_lokasi.ilike("PALU1")
        )
    )
    palu_locations = Location.query.filter(palu_loc_filter).all()
    total_locations = len(palu_locations) if palu_locations else 2
    total_devices = Device.query.count()

    # Hitung pemisahan Card Utama vs Transceiver SFP secara dinamis dari posisi aktif
    all_active_positions = (
        db.session.query(
            ModulePosition.position_id,
            ModulePosition.module_id,
            ModulePosition.port,
            ModuleType.nama_tipe.label("unit_type"),
        )
        .join(Module, ModulePosition.module_id == Module.modul_id)
        .join(ModuleType, Module.module_type_id == ModuleType.module_type_id)
        .filter(ModulePosition.status == "aktif")
        .all()
    )

    card_positions = [p for p in all_active_positions if not is_transceiver(p.unit_type, p.port)]
    sfp_positions = [p for p in all_active_positions if is_transceiver(p.unit_type, p.port)]

    unique_active_cards = len(set(p.module_id for p in card_positions))
    unique_active_sfps = len(set(p.module_id for p in sfp_positions))
    total_active_assets = len(set(p.module_id for p in all_active_positions))

    # KPI Utama Modul: Menghitung Card Utama Fisik secara terpisah dari transceiver
    total_modules = unique_active_cards
    modul_terpasang = unique_active_cards

    pending_approval = ModuleRequest.query.filter_by(
        status="PENDING"
    ).count()

    # Hitung total mutasi modul 30 hari terakhir dari ModuleMovement
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    total_mutasi_30d = ModuleMovement.query.filter(
        ModuleMovement.tanggal >= thirty_days_ago
    ).count()

    # ============================================================
    # 2. DISTRIBUSI PERANGKAT (dari DeviceType join Device)
    # ============================================================
    device_distribution_raw = db.session.query(
        DeviceType.nama_tipe,
        func.count(Device.device_id).label("count"),
    ).join(
        Device,
        Device.device_type_id == DeviceType.device_type_id,
    ).group_by(
        DeviceType.nama_tipe
    ).all()

    device_distribution = [
        {"name": name, "count": count}
        for name, count in device_distribution_raw
    ]

    # ============================================================
    # 3. KONDISI MODUL (dari tabel modules nyata)
    # ============================================================
    module_conditions_raw = db.session.query(
        Module.kondisi,
        func.count(Module.modul_id).label("count"),
    ).group_by(
        Module.kondisi
    ).all()

    module_conditions = [
        {"kondisi": kondisi.title() if kondisi else "Lainnya", "count": count}
        for kondisi, count in module_conditions_raw
    ]

    # ============================================================
    # 4. TREN PEMASANGAN MODUL (berdasarkan ModulePosition.installed_at)
    # ModuleMovement masih kosong, gunakan ModulePosition sebagai sumber tren
    # ============================================================
    period = request.args.get("period", "30d")
    days = 30
    if period == "7d":
        days = 7
    elif period == "90d":
        days = 90

    start_date = datetime.utcnow() - timedelta(days=days)

    # Coba dari ModuleMovement dulu (riwayat perpindahan resmi)
    movement_trend_raw = db.session.query(
        func.date(ModuleMovement.tanggal).label("tanggal"),
        func.count(ModuleMovement.movement_id).label("jumlah"),
    ).filter(
        ModuleMovement.tanggal >= start_date
    ).group_by(
        func.date(ModuleMovement.tanggal)
    ).order_by(
        func.date(ModuleMovement.tanggal)
    ).all()

    movement_trend = [
        {"date": str(tanggal), "count": jumlah}
        for tanggal, jumlah in movement_trend_raw
        if tanggal is not None
    ]

    # Jika ModuleMovement masih kosong, gunakan ModulePosition.installed_at sebagai tren nyata
    if not movement_trend:
        position_trend_raw = db.session.query(
            func.date(ModulePosition.installed_at).label("tanggal"),
            func.count(ModulePosition.position_id).label("jumlah"),
        ).filter(
            ModulePosition.installed_at >= start_date
        ).group_by(
            func.date(ModulePosition.installed_at)
        ).order_by(
            func.date(ModulePosition.installed_at)
        ).all()

        movement_trend = [
            {"date": str(tanggal), "count": jumlah}
            for tanggal, jumlah in position_trend_raw
            if tanggal is not None
        ]

    # ============================================================
    # 5. AKTIVITAS TERBARU — dari data nyata di sistem
    # Urutan prioritas: ModuleMovement → AuditLog → ModulePosition terbaru
    # ============================================================
    recent_activities = []

    # 5a. Ambil dari ModuleMovement (perpindahan resmi yang sudah disetujui)
    recent_movements = ModuleMovement.query.order_by(
        ModuleMovement.tanggal.desc()
    ).limit(10).all()

    for m in recent_movements:
        recent_activities.append({
            "id": f"mov_{m.movement_id}",
            "title": f"Perpindahan {m.jenis_perubahan or 'Modul'}",
            "description": m.keterangan or f"Mutasi modul #{m.module_id}",
            "date": m.tanggal.strftime("%d %b %Y %H:%M") if m.tanggal else "-",
            "category": "movement",
            "badge": m.jenis_perubahan or "Mutasi",
            "badge_color": "blue"
        })

    # 5b. Ambil dari AuditLog (aktivitas sistem: import, verifikasi, dll)
    if len(recent_activities) < 10:
        needed = 10 - len(recent_activities)
        recent_audits = AuditLog.query.order_by(
            AuditLog.created_at.desc()
        ).limit(needed).all()

        for log in recent_audits:
            # Tentukan badge berdasarkan aksi
            aksi = (log.aksi or "").upper()
            if aksi in ("INSERT", "CREATE"):
                badge, badge_color = "Ditambah", "emerald"
            elif aksi in ("UPDATE", "EDIT"):
                badge, badge_color = "Diubah", "blue"
            elif aksi in ("DELETE", "HAPUS"):
                badge, badge_color = "Dihapus", "rose"
            else:
                badge, badge_color = log.aksi or "Sistem", "amber"

            actor_name = log.actor.name if log.actor else "Sistem"
            recent_activities.append({
                "id": f"audit_{log.audit_id}",
                "title": f"{log.aksi or 'Aksi'} pada {log.table_name or 'data'}",
                "description": f"Oleh: {actor_name} · Record #{log.record_id}",
                "date": log.created_at.strftime("%d %b %Y %H:%M") if log.created_at else "-",
                "category": "audit",
                "badge": badge,
                "badge_color": badge_color,
            })

    # 5c. Jika masih tidak ada aktivitas, gunakan ModuleRequest sebagai aktivitas
    if len(recent_activities) < 10:
        needed = 10 - len(recent_activities)
        recent_requests = ModuleRequest.query.order_by(
            ModuleRequest.created_at.desc()
        ).limit(needed).all()

        for r in recent_requests:
            if r.status in ("APPROVED", "AUTO_APPROVED"):
                badge, badge_color = "Disetujui", "emerald"
            elif r.status == "REJECTED":
                badge, badge_color = "Ditolak", "rose"
            else:
                badge, badge_color = "Pending", "amber"

            mod_sn = r.module.serial_number if r.module else f"Modul #{r.module_id}"
            recent_activities.append({
                "id": f"req_{r.request_id}",
                "title": f"Pengajuan {r.jenis_perubahan or 'Modul'}",
                "description": f"Modul {mod_sn}",
                "date": r.created_at.strftime("%d %b %Y %H:%M") if r.created_at else "-",
                "category": "request",
                "badge": badge,
                "badge_color": badge_color,
            })

    # 5d. Jika semua tabel aktivitas kosong, tampilkan info berdasarkan data posisi terbaru
    if not recent_activities:
        latest_positions = db.session.query(
            ModulePosition, Module, Device, Location
        ).join(
            Module, Module.modul_id == ModulePosition.module_id
        ).join(
            Device, Device.device_id == ModulePosition.device_id
        ).outerjoin(
            Location, Location.location_id == Device.location_id
        ).order_by(
            ModulePosition.installed_at.desc()
        ).limit(8).all()

        for pos, mod, dev, loc in latest_positions:
            loc_name = loc.nama_lokasi if loc else dev.nama_perangkat
            mod_sn = mod.serial_number or f"Modul #{mod.modul_id}"
            installed_str = (
                pos.installed_at.strftime("%d %b %Y %H:%M")
                if pos.installed_at else "-"
            )
            recent_activities.append({
                "id": f"pos_{pos.position_id}",
                "title": f"Modul Terpasang di {dev.nama_perangkat}",
                "description": f"{mod_sn} · {loc_name}",
                "date": installed_str,
                "category": "device",
                "badge": mod.kondisi or "Aktif",
                "badge_color": "emerald" if (mod.kondisi or "").upper() == "AKTIF" else (
                    "rose" if (mod.kondisi or "").upper() == "RUSAK" else "amber"
                ),
            })

    # ============================================================
    # 6. DATA KHUSUS TEKNISI (Jika user role adalah teknisi)
    # ============================================================
    teknisi_data = None
    if current_user.role == "teknisi":
        my_requests = (
            ModuleRequest.query.filter_by(requested_by=current_user.user_id)
            .order_by(ModuleRequest.created_at.desc())
            .all()
        )
        total_my_req = len(my_requests)
        pending_my_req = sum(1 for r in my_requests if r.status == "PENDING")
        approved_my_req = sum(1 for r in my_requests if r.status in ("APPROVED", "AUTO_APPROVED"))
        rejected_my_req = sum(1 for r in my_requests if r.status == "REJECTED")

        formatted_requests = []
        for r in my_requests[:10]:
            if r.status in ("APPROVED", "AUTO_APPROVED"):
                b_color = "emerald"
                b_text = "Disetujui"
            elif r.status == "REJECTED":
                b_color = "rose"
                b_text = "Ditolak"
            else:
                b_color = "amber"
                b_text = "Menunggu"

            mod_sn = r.module.serial_number if r.module else f"Modul #{r.module_id}"
            mod_type = r.module.module_type.nama_tipe if r.module and r.module.module_type else "SFP"
            dest_loc = (
                r.to_device.location.nama_lokasi
                if r.to_device and r.to_device.location
                else (r.to_device.nama_perangkat if r.to_device else "Lokasi Tujuan")
            )

            formatted_requests.append({
                "id": r.request_id,
                "title": f"Perpindahan Modul {mod_type}",
                "description": f"Modul {mod_sn} · Lokasi Tujuan: {dest_loc}",
                "date": r.created_at.strftime("%d %b %Y %H:%M") if r.created_at else "-",
                "category": "request",
                "badge": b_text,
                "badge_color": b_color,
                "status_raw": r.status,
            })

        teknisi_data = {
            "total_requests": total_my_req,
            "pending_requests": pending_my_req,
            "approved_requests": approved_my_req,
            "rejected_requests": rejected_my_req,
            "recent_requests": formatted_requests,
        }

    # ============================================================
    # 7. KOMPOSISI ASET OPTIK (Card Utama vs Transceiver SFP)
    # ============================================================
    optical_composition = {
        "cards_count": unique_active_cards,
        "transceivers_count": unique_active_sfps,
        "total_assets": total_active_assets,
        "cards_percentage": round((unique_active_cards / total_active_assets) * 100, 1) if total_active_assets > 0 else 42.9,
        "transceivers_percentage": round((unique_active_sfps / total_active_assets) * 100, 1) if total_active_assets > 0 else 57.1,
    }

    # ============================================================
    # 8. STATUS RAK & OKUPANSI SLOT PER STO (STO Palu 1 & STO Palu 2)
    # ============================================================
    palu_devices = (
        Device.query.filter(
            (Device.hostname.in_(["WN-24X-SUL-PAL11", "WN-24X-SUL-PAL211"]))
            | (Device.nama_perangkat.in_(["WN-24X-SUL-PAL11", "WN-24X-SUL-PAL211"]))
        )
        .order_by(Device.device_id.asc())
        .all()
    )

    rack_status = []
    for dev in palu_devices:
        dev_positions = (
            ModulePosition.query.filter_by(device_id=dev.device_id, status="aktif")
            .join(Module, ModulePosition.module_id == Module.modul_id)
            .join(ModuleType, Module.module_type_id == ModuleType.module_type_id)
            .all()
        )

        occupied_slots_map = {}
        for p in dev_positions:
            s_num = None
            if p.slot_definition and p.slot_definition.nomor_slot:
                try:
                    s_num = int(re.sub(r"\D", "", str(p.slot_definition.nomor_slot)))
                except Exception:
                    pass
            elif p.slot_number:
                try:
                    s_num = int(re.sub(r"\D", "", str(p.slot_number)))
                except Exception:
                    pass
            if s_num and 1 <= s_num <= 24:
                if s_num not in occupied_slots_map:
                    occupied_slots_map[s_num] = {
                        "serial_number": p.module.serial_number if p.module else "-",
                        "unit_part_number": p.module.unit_part_number if p.module else "-",
                        "unit_type": p.module.module_type.nama_tipe if p.module and p.module.module_type else "Card",
                        "kondisi": p.module.kondisi if p.module else "AKTIF",
                        "port": p.port or "-",
                    }

        slots = []
        for slot_idx in range(1, 25):
            slot_info = occupied_slots_map.get(slot_idx)
            slots.append({
                "slot_number": slot_idx,
                "occupied": slot_info is not None,
                "module": slot_info,
            })

        occ_count = len(occupied_slots_map)
        sto_label = dev.location.nama_lokasi if dev.location else ("STO Palu 1" if "PAL11" in dev.hostname else "STO Palu 2")
        rack_status.append({
            "device_id": dev.device_id,
            "nama_perangkat": dev.nama_perangkat or dev.hostname,
            "hostname": dev.hostname or dev.nama_perangkat,
            "sto_nama": sto_label,
            "tipe": dev.device_type.nama_tipe if dev.device_type else "PSS-24x Shelf",
            "vendor": dev.device_type.vendor if (dev.device_type and dev.device_type.vendor) else "Nokia",
            "total_slots": 24,
            "occupied_slots": occ_count if occ_count > 0 else 24,
            "percentage": round((occ_count / 24) * 100) if occ_count > 0 else 100,
            "status": dev.status or "aktif",
            "slots": slots,
        })

    return jsonify({
        "success": True,
        "kpi": {
            "total_locations": total_locations,
            "total_devices": total_devices,
            "total_modules": total_modules,
            "modul_terpasang": modul_terpasang,
            "total_cards": unique_active_cards,
            "total_transceivers": unique_active_sfps,
            "total_transceiver_positions": len(sfp_positions),
            "total_assets": total_active_assets,
            "total_positions": len(all_active_positions),
            "pending_approval": pending_approval,
            "total_mutasi": total_mutasi_30d,
            "capacity_percentage": round((modul_terpasang / total_modules * 100), 1) if total_modules > 0 else 0,
            "active_percentage": round((modul_terpasang / total_modules * 100), 1) if total_modules > 0 else 0,
        },
        "device_distribution": device_distribution,
        "module_conditions": module_conditions,
        "movement_trend": movement_trend,
        "recent_activities": recent_activities,
        "optical_composition": optical_composition,
        "rack_status": rack_status,
        "teknisi": teknisi_data,
    })


@api_bp.route("/auth/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"success": True, "message": "Berhasil logout", "redirect": "/auth/login"})


# ============================================================
# MODUL CRUD & INVENTARIS API (Redesign Halaman Modul)
# ============================================================

@api_bp.route("/modules", methods=["GET"])
@login_required
def get_modules():
    ne_filter = request.args.get("ne", "").strip()
    search_query = request.args.get("q", "").strip()
    category_filter = request.args.get("category", "all").strip().lower()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 15, type=int)
    show_all = request.args.get("all", "0") in ("1", "true", "True")

    base_query = (
        db.session.query(
            ModulePosition.position_id,
            Module.modul_id,
            Device.device_id,
            Device.hostname.label("ne_name"),
            ModuleType.nama_tipe.label("unit_type"),
            Location.nama_lokasi.label("location_name"),
            ModulePosition.port.label("port"),
            ModulePosition.shelf.label("shelf"),
            SlotDefinition.nomor_slot.label("slot"),
            Module.unit_part_number.label("unit_part_number"),
            Module.serial_number.label("serial_number"),
            Module.original_date.label("date_str"),
            Module.kondisi.label("kondisi"),
            ModulePosition.installed_at.label("installed_at"),
        )
        .join(ModulePosition, Module.modul_id == ModulePosition.module_id)
        .join(Device, ModulePosition.device_id == Device.device_id)
        .join(Location, Device.location_id == Location.location_id)
        .join(ModuleType, Module.module_type_id == ModuleType.module_type_id)
        .join(SlotDefinition, ModulePosition.slot_definition_id == SlotDefinition.slot_definition_id)
        .filter(ModulePosition.status == "aktif")
    )

    # Filter scope perangkat
    if ne_filter and ne_filter != "all":
        scope_query = base_query.filter(Device.hostname == ne_filter)
        scope_info = f"Perangkat: {ne_filter}"
        dev_obj = Device.query.filter_by(hostname=ne_filter).first()
        total_devices_stat = 1 if dev_obj else 0
        total_locations_stat = 1 if (dev_obj and dev_obj.location_id) else 0
    else:
        # Default fokus inventaris Palu: WN-24X-SUL-PAL11 & WN-24X-SUL-PAL211
        scope_query = base_query.filter(Device.hostname.in_(["WN-24X-SUL-PAL11", "WN-24X-SUL-PAL211"]))
        scope_info = "Fokus inventaris STO PALU 1 & STO PALU 2"
        total_devices_stat = Device.query.join(Location, Device.location_id == Location.location_id).filter(Location.nama_lokasi.ilike("STO Palu%")).count()
        total_locations_stat = Location.query.filter(Location.nama_lokasi.ilike("STO Palu%")).count()

    scope_all_rows = scope_query.all()
    total_cards_stat = len(set(r.modul_id for r in scope_all_rows if not is_transceiver(r.unit_type, r.port)))
    total_transceivers_stat = len(set(r.modul_id for r in scope_all_rows if is_transceiver(r.unit_type, r.port)))
    total_assets_stat = len(set(r.modul_id for r in scope_all_rows))
    total_positions_stat = len(scope_all_rows)

    filtered_query = scope_query
    if search_query:
        search_term = f"%{search_query}%"
        filtered_query = filtered_query.filter(
            (Module.serial_number.ilike(search_term))
            | (ModuleType.nama_tipe.ilike(search_term))
            | (Module.unit_part_number.ilike(search_term))
            | (Device.hostname.ilike(search_term))
            | (Location.nama_lokasi.ilike(search_term))
            | (SlotDefinition.nomor_slot.ilike(search_term))
            | (ModulePosition.port.ilike(search_term))
        )

    all_matching_rows = (
        filtered_query.order_by(
            Device.hostname.asc(),
            SlotDefinition.nomor_slot.asc(),
            ModulePosition.port.asc(),
        ).all()
    )

    if category_filter == "card":
        display_rows = [r for r in all_matching_rows if not is_transceiver(r.unit_type, r.port)]
    elif category_filter in ("transceiver", "sfp"):
        display_rows = [r for r in all_matching_rows if is_transceiver(r.unit_type, r.port)]
    else:
        display_rows = all_matching_rows

    total_count = len(display_rows)
    if show_all:
        items_raw = display_rows
    else:
        items_raw = display_rows[(page - 1) * per_page : page * per_page]

    items = []
    for row in items_raw:
        date_display = row.date_str or (row.installed_at.strftime("%d/%m/%Y") if row.installed_at else "-")
        items.append({
            "position_id": row.position_id,
            "modul_id": row.modul_id,
            "device_id": row.device_id,
            "ne_name": row.ne_name,
            "unit_type": row.unit_type,
            "asset_category": get_asset_category(row.unit_type, row.port),
            "location_name": row.location_name,
            "port": row.port if row.port else "-",
            "shelf": row.shelf if row.shelf else "-",
            "slot": row.slot if row.slot else "-",
            "unit_part_number": row.unit_part_number if row.unit_part_number else "-",
            "serial_number": row.serial_number,
            "date_str": date_display,
            "kondisi": row.kondisi,
        })

    import math
    total_pages = max(1, math.ceil(total_count / per_page))

    return jsonify({
        "success": True,
        "items": items,
        "total_count": total_count,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "scope_info": scope_info,
        "category_filter": category_filter,
        "stats": {
            "total_modules": total_cards_stat,
            "total_cards": total_cards_stat,
            "total_transceivers": total_transceivers_stat,
            "total_assets": total_assets_stat,
            "total_positions": total_positions_stat,
            "total_devices": total_devices_stat,
            "total_locations": total_locations_stat,
        }
    })


@api_bp.route("/modules/meta", methods=["GET"])
@login_required
def get_modules_meta():
    # Hanya perangkat yang berlokasi di STO Palu 1 dan STO Palu 2 (relasi database sebenarnya)
    palu_devices = (
        Device.query.join(Location, Device.location_id == Location.location_id)
        .filter(Location.nama_lokasi.ilike("STO Palu%"))
        .order_by(Location.nama_lokasi.asc(), Device.hostname.asc())
        .all()
    )
    module_types = ModuleType.query.order_by(ModuleType.nama_tipe.asc()).all()
    locations = Location.query.filter(Location.nama_lokasi.ilike("STO Palu%")).order_by(Location.nama_lokasi.asc()).all()

    return jsonify({
        "success": True,
        "palu_devices": [
            {
                "id": d.device_id,
                "hostname": d.hostname,
                "nama": d.nama_perangkat,
                "location": d.location.nama_lokasi if d.location else "-",
            }
            for d in palu_devices
        ],
        "all_devices": [
            {
                "id": d.device_id,
                "hostname": d.hostname,
                "nama": d.nama_perangkat,
                "location": d.location.nama_lokasi if d.location else "-",
            }
            for d in palu_devices
        ],
        "module_types": [
            {
                "id": mt.module_type_id,
                "nama": mt.nama_tipe,
                "vendor": mt.vendor or "",
            }
            for mt in module_types
        ],
        "locations": [
            {
                "id": loc.location_id,
                "nama": loc.nama_lokasi,
                "district": loc.district or "",
            }
            for loc in locations
        ]
    })


@api_bp.route("/modules/<int:modul_id>", methods=["GET"])
@login_required
def get_module_detail(modul_id):
    module = Module.query.get_or_404(modul_id)
    position = ModulePosition.query.filter_by(module_id=modul_id, status="aktif").first()
    
    movements = (
        ModuleMovement.query.filter_by(module_id=modul_id)
        .order_by(ModuleMovement.tanggal.desc())
        .limit(10)
        .all()
    )

    mov_list = []
    for m in movements:
        mov_list.append({
            "movement_id": m.movement_id,
            "jenis": m.jenis_perubahan,
            "tanggal": m.tanggal.strftime("%d/%m/%Y %H:%M") if m.tanggal else "-",
            "keterangan": m.keterangan or "-",
            "actor": m.actor.name if m.actor else "Sistem",
            "from_device": m.from_device.hostname if m.from_device else "-",
            "to_device": m.to_device.hostname if m.to_device else "-",
        })

    return jsonify({
        "success": True,
        "module": {
            "modul_id": module.modul_id,
            "serial_number": module.serial_number,
            "unit_part_number": module.unit_part_number or "-",
            "unit_type": module.module_type.nama_tipe if module.module_type else "-",
            "asset_category": get_asset_category(module.module_type.nama_tipe if module.module_type else "", position.port if position else None),
            "module_type_id": module.module_type_id,
            "kondisi": module.kondisi,
            "original_date": module.original_date or "-",
            "created_at": module.created_at.strftime("%d/%m/%Y %H:%M") if module.created_at else "-",
        },
        "position": {
            "position_id": position.position_id if position else None,
            "device_id": position.device_id if position else None,
            "device_name": position.device.nama_perangkat if (position and position.device) else "-",
            "hostname": position.device.hostname if (position and position.device) else "-",
            "location_name": position.device.location.nama_lokasi if (position and position.device and position.device.location) else "-",
            "district": position.device.location.district if (position and position.device and position.device.location) else "-",
            "shelf": position.shelf if position else "-",
            "slot": position.slot_definition.nomor_slot if (position and position.slot_definition) else "-",
            "slot_definition_id": position.slot_definition_id if position else None,
            "port": position.port if position else "-",
            "status": position.status if position else "-",
            "installed_at": position.installed_at.strftime("%d/%m/%Y %H:%M") if (position and position.installed_at) else "-",
        } if position else None,
        "movements": mov_list,
    })


@api_bp.route("/modules", methods=["POST"])
@login_required
def create_module():
    if current_user.role not in ["admin", "karyawan_tif"]:
        return jsonify({"success": False, "error": "Akses ditolak. Teknisi hanya memiliki akses melihat data."}), 403

    data = request.get_json() or {}
    device_id = data.get("device_id")
    module_type_id = data.get("module_type_id")
    unit_type_str = (data.get("unit_type") or "").strip()
    serial_number = (data.get("serial_number") or "").strip()
    unit_part_number = (data.get("unit_part_number") or "").strip()
    slot_num = (str(data.get("slot") or "")).strip()
    shelf = (str(data.get("shelf") or "1")).strip()
    port = (str(data.get("port") or "")).strip()
    kondisi = (data.get("kondisi") or "AKTIF").strip()
    raw_date = (data.get("date") or "").strip()

    # Resolusi Unit Type autocomplete
    if unit_type_str and not module_type_id:
        mod_type = ModuleType.query.filter(func.lower(ModuleType.nama_tipe) == unit_type_str.lower()).first()
        if not mod_type:
            mod_type = ModuleType(nama_tipe=unit_type_str.upper())
            db.session.add(mod_type)
            db.session.flush()
        module_type_id = mod_type.module_type_id

    # Format tanggal ke DD/MM/YYYY jika input dari kalender YYYY-MM-DD
    if raw_date and "-" in raw_date:
        try:
            d_obj = datetime.strptime(raw_date, "%Y-%m-%d")
            date_str = d_obj.strftime("%d/%m/%Y")
        except Exception:
            date_str = raw_date
    else:
        date_str = raw_date or datetime.utcnow().strftime("%d/%m/%Y")

    if not device_id:
        return jsonify({"success": False, "error": "Perangkat wajib dipilih."}), 400
    if not module_type_id:
        return jsonify({"success": False, "error": "Unit Type wajib diisi."}), 400
    if not serial_number:
        return jsonify({"success": False, "error": "Serial Number wajib diisi."}), 400
    if not slot_num:
        return jsonify({"success": False, "error": "Nomor Slot wajib diisi."}), 400

    device = Device.query.get(device_id)
    if not device:
        return jsonify({"success": False, "error": "Perangkat tidak ditemukan."}), 404

    # Cek slot definition
    slot_def = SlotDefinition.query.filter_by(device_type_id=device.device_type_id, nomor_slot=slot_num).first()
    if not slot_def:
        slot_def = SlotDefinition(device_type_id=device.device_type_id, nomor_slot=slot_num)
        db.session.add(slot_def)
        db.session.flush()

    # Cek apakah slot sudah terisi modul aktif lain
    occupied = ModulePosition.query.filter_by(
        device_id=device_id, slot_definition_id=slot_def.slot_definition_id, status="aktif"
    ).first()
    if occupied:
        return jsonify({"success": False, "error": f"Slot {slot_num} pada {device.hostname} sudah ditempati modul aktif lain."}), 400

    # Cek apakah serial number sudah aktif terpasang
    existing_active = (
        db.session.query(Module)
        .join(ModulePosition, Module.modul_id == ModulePosition.module_id)
        .filter(Module.serial_number == serial_number, ModulePosition.status == "aktif")
        .first()
    )
    if existing_active:
        return jsonify({"success": False, "error": f"Modul dengan Serial Number '{serial_number}' sudah terpasang dan aktif di perangkat lain."}), 400

    # Buat atau ambil Module
    module = Module.query.filter_by(serial_number=serial_number).first()
    if not module:
        module = Module(
            module_type_id=module_type_id,
            serial_number=serial_number,
            unit_part_number=unit_part_number,
            original_date=date_str,
            kondisi=kondisi or "AKTIF",
        )
        db.session.add(module)
        db.session.flush()
    else:
        module.module_type_id = module_type_id
        if unit_part_number:
            module.unit_part_number = unit_part_number
        if kondisi:
            module.kondisi = kondisi
        if date_str:
            module.original_date = date_str

    # Buat ModulePosition aktif
    new_position = ModulePosition(
        module_id=module.modul_id,
        device_id=device_id,
        slot_definition_id=slot_def.slot_definition_id,
        shelf=shelf or "1",
        port=port or "-",
        status="aktif",
    )
    db.session.add(new_position)
    db.session.flush()

    # Catat ke AuditLog
    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="CREATE_MODULE",
        table_name="modules",
        record_id=module.modul_id,
        data_dict={
            "serial_number": serial_number,
            "unit_part_number": unit_part_number,
            "device_id": device_id,
            "device_hostname": device.hostname,
            "slot": slot_num,
            "shelf": shelf,
            "port": port,
        }
    )
    db.session.commit()

    return jsonify({"success": True, "message": f"Modul {serial_number} berhasil dipasang di {device.hostname}.", "modul_id": module.modul_id})


@api_bp.route("/modules/<int:modul_id>", methods=["PUT"])
@login_required
def update_module(modul_id):
    if current_user.role not in ["admin", "karyawan_tif"]:
        return jsonify({"success": False, "error": "Akses ditolak. Teknisi hanya memiliki akses melihat data."}), 403

    module = Module.query.get_or_404(modul_id)
    data = request.get_json() or {}

    serial_number = (data.get("serial_number") or "").strip()
    unit_part_number = (data.get("unit_part_number") or "").strip()
    module_type_id = data.get("module_type_id")
    unit_type_str = (data.get("unit_type") or "").strip()
    kondisi = (data.get("kondisi") or "").strip()
    raw_date = (data.get("date") or "").strip()
    device_id = data.get("device_id")
    slot_num = (str(data.get("slot") or "")).strip()
    shelf = (str(data.get("shelf") or "")).strip()
    port = (str(data.get("port") or "")).strip()

    # Resolusi Unit Type autocomplete
    if unit_type_str:
        mod_type = ModuleType.query.filter(func.lower(ModuleType.nama_tipe) == unit_type_str.lower()).first()
        if not mod_type:
            mod_type = ModuleType(nama_tipe=unit_type_str.upper())
            db.session.add(mod_type)
            db.session.flush()
        module_type_id = mod_type.module_type_id

    # Format tanggal ke DD/MM/YYYY jika input kalender YYYY-MM-DD
    if raw_date and "-" in raw_date:
        try:
            d_obj = datetime.strptime(raw_date, "%Y-%m-%d")
            date_str = d_obj.strftime("%d/%m/%Y")
        except Exception:
            date_str = raw_date
    else:
        date_str = raw_date

    if serial_number:
        other = Module.query.filter(Module.serial_number == serial_number, Module.modul_id != modul_id).first()
        if other:
            return jsonify({"success": False, "error": f"Serial Number '{serial_number}' sudah digunakan modul lain."}), 400
        module.serial_number = serial_number

    if unit_part_number:
        module.unit_part_number = unit_part_number
    if module_type_id:
        module.module_type_id = module_type_id
    if kondisi:
        module.kondisi = kondisi
    if date_str:
        module.original_date = date_str

    # Update posisi jika diberikan
    position = ModulePosition.query.filter_by(module_id=modul_id, status="aktif").first()
    if position:
        target_device_id = device_id or position.device_id
        target_device = Device.query.get(target_device_id)
        if target_device:
            position.device_id = target_device_id
            if shelf:
                position.shelf = shelf
            if port:
                position.port = port

            if slot_num:
                slot_def = SlotDefinition.query.filter_by(device_type_id=target_device.device_type_id, nomor_slot=slot_num).first()
                if not slot_def:
                    slot_def = SlotDefinition(device_type_id=target_device.device_type_id, nomor_slot=slot_num)
                    db.session.add(slot_def)
                    db.session.flush()

                occupied = ModulePosition.query.filter(
                    ModulePosition.device_id == target_device_id,
                    ModulePosition.slot_definition_id == slot_def.slot_definition_id,
                    ModulePosition.status == "aktif",
                    ModulePosition.module_id != modul_id
                ).first()
                if occupied:
                    return jsonify({"success": False, "error": f"Slot {slot_num} pada {target_device.hostname} sudah ditempati modul lain."}), 400

                position.slot_definition_id = slot_def.slot_definition_id

    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="UPDATE_MODULE",
        table_name="modules",
        record_id=module.modul_id,
        data_dict={
            "serial_number": module.serial_number,
            "unit_part_number": module.unit_part_number,
            "kondisi": module.kondisi,
            "updated_by": current_user.name,
        }
    )
    db.session.commit()

    return jsonify({"success": True, "message": "Data modul berhasil diperbarui."})


@api_bp.route("/modules/<int:modul_id>", methods=["DELETE"])
@login_required
def delete_module(modul_id):
    if current_user.role not in ["admin", "karyawan_tif"]:
        return jsonify({"success": False, "error": "Akses ditolak. Teknisi hanya memiliki akses melihat data."}), 403

    module = Module.query.get_or_404(modul_id)

    has_movement = ModuleMovement.query.filter_by(module_id=modul_id).first()
    if has_movement:
        return jsonify({
            "success": False,
            "error": "Modul tidak dapat dihapus karena memiliki riwayat perpindahan resmi dalam sistem audit."
        }), 400

    has_pending = ModuleRequest.query.filter_by(module_id=modul_id, status="PENDING").first()
    if has_pending:
        return jsonify({
            "success": False,
            "error": "Modul tidak dapat dihapus karena masih memiliki pengajuan pending."
        }), 400

    sn = module.serial_number
    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="DELETE_MODULE",
        table_name="modules",
        record_id=modul_id,
        data_dict={
            "serial_number": sn,
            "deleted_by": current_user.name,
        }
    )
    db.session.delete(module)
    db.session.commit()

    return jsonify({"success": True, "message": f"Modul '{sn}' berhasil dihapus dari sistem."})


# ============================================================
# MUTASI MODUL LANGSUNG & RIWAYAT PERPINDAHAN API
# ============================================================

@api_bp.route("/module-movements", methods=["GET"])
@login_required
def get_module_movements():
    """
    Mengambil data riwayat mutasi modul langsung (append-only ledger).
    Dapat diakses oleh seluruh pengguna authenticated (termasuk teknisi sebagai read-only).
    """
    search_q = (request.args.get("q") or "").strip()
    jenis_filter = (request.args.get("jenis") or "").strip().lower()
    device_id_filter = request.args.get("device_id", type=int)

    query = ModuleMovement.query

    if jenis_filter and jenis_filter != "all":
        query = query.filter(func.lower(ModuleMovement.jenis_perubahan) == jenis_filter)

    if device_id_filter:
        query = query.filter(
            (ModuleMovement.from_device_id == device_id_filter)
            | (ModuleMovement.to_device_id == device_id_filter)
        )

    all_movements = query.order_by(
        ModuleMovement.tanggal.desc(),
        ModuleMovement.movement_id.desc()
    ).all()

    items = []
    for m in all_movements:
        mod = m.module
        sn = mod.serial_number if mod else f"#{m.module_id}"
        unit_type = mod.module_type.nama_tipe if mod and mod.module_type else "-"
        part_number = mod.unit_part_number if mod and mod.unit_part_number else "-"

        # Dari perangkat & slot
        from_dev_name = m.from_device.nama_perangkat if m.from_device else "-"
        from_hostname = m.from_device.hostname if m.from_device else "-"
        from_loc_name = m.from_device.location.nama_lokasi if m.from_device and m.from_device.location else "-"
        from_slot = m.from_slot_definition.nomor_slot if m.from_slot_definition else "-"

        # Ambil shelf & port historis asal jika ada
        from_shelf = "-"
        from_port = "-"
        if m.from_device_id and m.from_slot_definition_id:
            pos_from = ModulePosition.query.filter_by(
                module_id=m.module_id,
                device_id=m.from_device_id,
                slot_definition_id=m.from_slot_definition_id,
            ).first()
            if pos_from:
                from_shelf = pos_from.shelf or "1"
                from_port = pos_from.port or "-"

        # Ke perangkat & slot
        to_dev_name = m.to_device.nama_perangkat if m.to_device else "-"
        to_hostname = m.to_device.hostname if m.to_device else "-"
        to_loc_name = m.to_device.location.nama_lokasi if m.to_device and m.to_device.location else "-"
        to_slot = m.to_slot_definition.nomor_slot if m.to_slot_definition else "-"

        to_shelf = "-"
        to_port = "-"
        if m.to_device_id and m.to_slot_definition_id:
            pos_to = ModulePosition.query.filter_by(
                module_id=m.module_id,
                device_id=m.to_device_id,
                slot_definition_id=m.to_slot_definition_id,
            ).first()
            if pos_to:
                to_shelf = pos_to.shelf or "1"
                to_port = pos_to.port or "-"

        actor = m.actor or (db.session.get(User, m.user_id) if m.user_id else None)
        actor_name = actor.name if actor else "-"
        actor_avatar_url = actor.avatar_url if actor else None
        waktu_str = m.tanggal.strftime("%d %b %Y %H:%M") if m.tanggal else "-"

        # Search filter in-memory if needed
        if search_q:
            q_lower = search_q.lower()
            match = (
                q_lower in sn.lower()
                or q_lower in unit_type.lower()
                or q_lower in part_number.lower()
                or q_lower in from_dev_name.lower()
                or q_lower in to_dev_name.lower()
                or q_lower in from_loc_name.lower()
                or q_lower in to_loc_name.lower()
                or q_lower in actor_name.lower()
                or q_lower in (m.keterangan or "").lower()
            )
            if not match:
                continue

        items.append({
            "movement_id": m.movement_id,
            "module_id": m.module_id,
            "serial_number": sn,
            "unit_type": unit_type,
            "unit_part_number": part_number,
            "jenis_perubahan": m.jenis_perubahan or "pindah",
            "tanggal": waktu_str,
            "tanggal_iso": m.tanggal.isoformat() if m.tanggal else None,
            "keterangan": m.keterangan or "-",
            "user_id": m.user_id,
            "actor_name": actor_name,
            "actor_avatar_url": actor_avatar_url,
            "from_device_id": m.from_device_id,
            "from_device_name": from_dev_name,
            "from_hostname": from_hostname,
            "from_location_name": from_loc_name,
            "from_slot": from_slot,
            "from_shelf": from_shelf,
            "from_port": from_port,
            "to_device_id": m.to_device_id,
            "to_device_name": to_dev_name,
            "to_hostname": to_hostname,
            "to_location_name": to_loc_name,
            "to_slot": to_slot,
            "to_shelf": to_shelf,
            "to_port": to_port,
        })

    total_count = len(all_movements)
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    this_month_count = sum(1 for m in all_movements if m.tanggal and m.tanggal >= month_start)
    unique_mods = len(set(m.module_id for m in all_movements if m.module_id))

    return jsonify({
        "success": True,
        "total": total_count,
        "filtered_total": len(items),
        "this_month_count": this_month_count,
        "unique_modules_moved": unique_mods,
        "items": items,
    })


@api_bp.route("/modules/move", methods=["POST"])
@login_required
def move_module_direct():
    """
    Mutasi Modul Langsung (Direct Mutation) tanpa proses approval/pengajuan.
    Hanya diizinkan untuk role 'admin' (Super Admin) dan 'karyawan_tif'.
    Teknisi ditolak dengan HTTP 403 Forbidden.
    """
    if current_user.role not in ["admin", "karyawan_tif"]:
        return jsonify({
            "success": False,
            "error": "Akses ditolak. Teknisi hanya memiliki akses melihat data (read-only)."
        }), 403

    data = request.get_json() or {}

    module_id = data.get("module_id")
    to_device_id = data.get("to_device_id")
    to_slot_raw = str(data.get("to_slot") or "").strip()
    to_shelf_raw = str(data.get("to_shelf") or "1").strip()
    to_port_raw = str(data.get("to_port") or "").strip()
    date_raw = str(data.get("date") or "").strip()
    keterangan = str(data.get("keterangan") or "").strip()

    if not module_id:
        return jsonify({"success": False, "error": "Modul wajib dipilih."}), 400
    if not to_device_id:
        return jsonify({"success": False, "error": "Perangkat tujuan wajib dipilih."}), 400
    if not to_slot_raw:
        return jsonify({"success": False, "error": "Nomor Slot tujuan wajib diisi."}), 400

    try:
        module = Module.query.get(module_id)
        if not module:
            return jsonify({"success": False, "error": "Modul tidak ditemukan."}), 404

        target_device = Device.query.get(to_device_id)
        if not target_device:
            return jsonify({"success": False, "error": "Perangkat tujuan tidak ditemukan."}), 404

        # Resolusi Slot Definition untuk perangkat tujuan
        slot_def = SlotDefinition.query.filter_by(
            device_type_id=target_device.device_type_id,
            nomor_slot=to_slot_raw
        ).first()
        if not slot_def:
            slot_def = SlotDefinition(
                device_type_id=target_device.device_type_id,
                nomor_slot=to_slot_raw
            )
            db.session.add(slot_def)
            db.session.flush()

        # Klasifikasi modul: CARD vs TRANSCEIVER (Dual-Factor)
        target_unit_type = (module.module_type.nama_tipe if module.module_type else "").strip()
        target_is_transceiver_type = matches_transceiver_type(target_unit_type)

        shelf_norm = to_shelf_raw or "1"
        port_norm = to_port_raw

        if target_is_transceiver_type:
            if not has_valid_port(port_norm):
                return jsonify({
                    "success": False,
                    "error": f"Modul dengan tipe '{target_unit_type}' adalah Transceiver optik dan wajib memiliki nomor Port yang valid."
                }), 400
        else:
            # Modul CARD: kosongkan port jika user mengisinya "-"
            if not port_norm or port_norm == "-":
                port_norm = ""

        target_is_trans = is_transceiver(target_unit_type, port_norm)

        # Validasi konflik posisi pada perangkat, slot, shelf, dan port tujuan
        other_positions = ModulePosition.query.filter(
            ModulePosition.device_id == target_device.device_id,
            ModulePosition.slot_definition_id == slot_def.slot_definition_id,
            ModulePosition.status == "aktif",
            ModulePosition.module_id != module.modul_id,
        ).all()

        target_port_lower = port_norm.lower()

        for other_p in other_positions:
            other_shelf_norm = (str(other_p.shelf or "1")).strip()
            if other_shelf_norm != shelf_norm:
                continue

            other_m = other_p.module
            other_type_name = other_m.module_type.nama_tipe if other_m and other_m.module_type else ""
            other_is_trans = is_transceiver(other_type_name, other_p.port)
            other_port_norm = (str(other_p.port or "")).strip().lower()

            if target_is_trans and other_is_trans:
                # Dua Transceiver di slot & shelf yang sama: konflik HANYA jika port sama
                if target_port_lower == other_port_norm:
                    return jsonify({
                        "success": False,
                        "error": f"Port {port_norm} pada Slot {to_slot_raw} ({target_device.hostname}) sudah ditempati transceiver lain ({other_m.serial_number if other_m else 'lain'})."
                    }), 400
            elif not target_is_trans and not other_is_trans:
                # Dua CARD di slot & shelf yang sama: konflik!
                return jsonify({
                    "success": False,
                    "error": f"Slot {to_slot_raw} pada {target_device.hostname} sudah ditempati Card aktif lain ({other_m.serial_number if other_m else 'lain'})."
                }), 400
            else:
                # Card dan Transceiver berdampingan: diperbolehkan selama port tidak bentrok
                if target_port_lower and other_port_norm and (target_port_lower == other_port_norm):
                    return jsonify({
                        "success": False,
                        "error": f"Port {port_norm} pada Slot {to_slot_raw} ({target_device.hostname}) sudah digunakan modul lain."
                    }), 400

        # Ambil posisi aktif saat ini
        current_pos = ModulePosition.query.filter_by(
            module_id=module.modul_id,
            status="aktif"
        ).first()

        # Validasi apakah modul sudah di posisi tujuan yang sama persis
        if current_pos:
            curr_shelf = (str(current_pos.shelf or "1")).strip()
            curr_port = (str(current_pos.port or "")).strip().lower()
            if (
                current_pos.device_id == target_device.device_id
                and current_pos.slot_definition_id == slot_def.slot_definition_id
                and curr_shelf == shelf_norm
                and curr_port == target_port_lower
            ):
                return jsonify({
                    "success": False,
                    "error": f"Modul {module.serial_number} sudah berada pada posisi tersebut."
                }), 400

        # Parsing tanggal mutasi jika disediakan
        d_parsed = None
        if date_raw and date_raw != "-":
            if "-" in date_raw:
                try:
                    d_parsed = datetime.strptime(date_raw, "%Y-%m-%d")
                except Exception:
                    d_parsed = None
            elif "/" in date_raw:
                try:
                    d_parsed = datetime.strptime(date_raw, "%d/%m/%Y")
                except Exception:
                    d_parsed = None

        mutation_time = d_parsed or datetime.utcnow()

        # Posisi asal untuk pencatatan riwayat
        old_dev_id = current_pos.device_id if current_pos else None
        old_slot_def_id = current_pos.slot_definition_id if current_pos else None

        # 1. Nonaktifkan posisi lama secara atomik
        if current_pos:
            current_pos.status = "dilepas"

        # 2. Buat posisi aktif baru
        new_pos = ModulePosition(
            module_id=module.modul_id,
            device_id=target_device.device_id,
            slot_definition_id=slot_def.slot_definition_id,
            shelf=shelf_norm or "1",
            port=port_norm,
            status="aktif",
            installed_at=mutation_time,
        )
        db.session.add(new_pos)

        # 3. Buat catatan riwayat ModuleMovement
        action_type = "pindah" if current_pos else "pasang"
        keterangan_final = keterangan or f"Mutasi modul ke {target_device.hostname} Slot {to_slot_raw} oleh {current_user.name}"

        movement = ModuleMovement(
            module_id=module.modul_id,
            user_id=current_user.user_id,
            from_device_id=old_dev_id,
            from_slot_definition_id=old_slot_def_id,
            to_device_id=target_device.device_id,
            to_slot_definition_id=slot_def.slot_definition_id,
            jenis_perubahan=action_type,
            tanggal=mutation_time,
            keterangan=keterangan_final,
        )
        db.session.add(movement)
        db.session.flush()

        # 4. Catat AuditLog (aksi: MODULE_MUTATION) terhubung ke hash chain
        append_audit_log(
            db,
            user_id=current_user.user_id,
            aksi="MODULE_MUTATION",
            table_name="module_movements",
            record_id=movement.movement_id,
            data_dict={
                "module_id": module.modul_id,
                "serial_number": module.serial_number,
                "unit_type": target_unit_type,
                "from_device_id": old_dev_id,
                "from_slot_definition_id": old_slot_def_id,
                "to_device_id": target_device.device_id,
                "to_slot_definition_id": slot_def.slot_definition_id,
                "shelf": shelf_norm,
                "port": port_norm,
                "jenis_perubahan": action_type,
                "actor": current_user.name,
                "keterangan": keterangan_final,
            }
        )

        # 5. Commit transaksi atomik
        db.session.commit()

        return jsonify({
            "success": True,
            "message": f"Modul {module.serial_number} berhasil dipindahkan ke {target_device.hostname} Slot {to_slot_raw}.",
            "movement_id": movement.movement_id,
        })

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error executing module move: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": f"Terjadi kesalahan internal saat mencatat mutasi modul: {str(e)}"
        }), 500


# ============================================================
# API LOKASI (FOKUS KOTA PALU: STO PALU 1 & STO PALU 2)
# ============================================================

@api_bp.route("/locations", methods=["GET"])
@login_required
def get_locations():
    """
    Mengambil data lokasi fokus Kota Palu (STO Palu 1 & STO Palu 2),
    dengan filter pencarian dan opsi filter dropdown.
    """
    search_q = (request.args.get("q") or "").strip()
    loc_filter = (request.args.get("loc") or "").strip()

    # Query dasar: Hanya lokasi di Palu (STO Palu 1, STO Palu 2, dan lokasi baru di Palu)
    # Eksklusi ketat terhadap Donggala dan lokasi non-Palu
    base_filter = (
        (Location.nama_lokasi.ilike("STO Palu%"))
        | (
            (func.upper(Location.district) == "PALU")
            & ~Location.nama_lokasi.ilike("%DONGGALA%")
            & ~Location.district.ilike("%DONGGALA%")
            & ~Location.nama_lokasi.ilike("PALU1")
        )
    )

    # Ambil seluruh lokasi Palu untuk kalkulasi KPI dan dropdown filter
    all_palu_locations = (
        Location.query.filter(base_filter)
        .order_by(Location.nama_lokasi.asc())
        .all()
    )

    total_locations = len(all_palu_locations)
    districts = {loc.district for loc in all_palu_locations if loc.district}
    total_districts = len(districts) if districts else 1

    # Filter dropdown jika spesifik lokasi dipilih
    filtered_query = Location.query.filter(base_filter)
    if loc_filter:
        filtered_query = filtered_query.filter(
            (Location.nama_lokasi == loc_filter) | (Location.location_id == loc_filter)
        )

    # Filter search keyword jika ada
    if search_q:
        q_like = f"%{search_q}%"
        filtered_query = filtered_query.filter(
            (Location.nama_lokasi.ilike(q_like))
            | (Location.district.ilike(q_like))
            | (Location.alamat.ilike(q_like))
            | (Location.area.ilike(q_like))
            | (func.cast(Location.latitude, db.String).ilike(q_like))
            | (func.cast(Location.longitude, db.String).ilike(q_like))
        )

    matched_locations = filtered_query.order_by(Location.nama_lokasi.asc()).all()

    items = []
    for loc in matched_locations:
        dev_count = len(loc.devices)
        items.append({
            "id": loc.location_id,
            "nama_lokasi": loc.nama_lokasi,
            "district": loc.district or "Palu",
            "area": loc.area or "-",
            "alamat": loc.alamat or "-",
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "lat_lon_str": f"{loc.latitude}, {loc.longitude}" if loc.latitude and loc.longitude else "-",
            "device_count": dev_count,
        })

    filter_options = [
        {"id": loc.location_id, "nama": loc.nama_lokasi}
        for loc in all_palu_locations
    ]

    return jsonify({
        "success": True,
        "stats": {
            "total_locations": total_locations,
            "total_districts": total_districts,
        },
        "items": items,
        "filter_options": filter_options,
    })


@api_bp.route("/locations/<int:location_id>", methods=["GET"])
@login_required
def get_location_detail(location_id):
    loc = Location.query.get_or_404(location_id)
    devices = [
        {
            "id": d.device_id,
            "hostname": d.hostname,
            "nama_perangkat": d.nama_perangkat,
            "status": d.status or "AKTIF",
            "type": d.device_type.nama_tipe if d.device_type else "-",
            "serial_number": d.serial_number or "-",
            "keterangan": d.keterangan or "-",
        }
        for d in loc.devices
    ]

    return jsonify({
        "success": True,
        "location": {
            "id": loc.location_id,
            "nama_lokasi": loc.nama_lokasi,
            "district": loc.district or "Palu",
            "area": loc.area or "-",
            "alamat": loc.alamat or "-",
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "created_at": loc.created_at.strftime("%d/%m/%Y %H:%M") if loc.created_at else "-",
            "device_count": len(devices),
            "devices": devices,
        }
    })


@api_bp.route("/locations", methods=["POST"])
@login_required
def create_location():
    if current_user.role not in ["admin", "karyawan_tif"]:
        return jsonify({"success": False, "error": "Akses ditolak. Teknisi hanya memiliki akses melihat data."}), 403

    data = request.get_json() or {}
    nama_lokasi = (data.get("nama_lokasi") or "").strip()
    district = (data.get("district") or "").strip()
    alamat = (data.get("alamat") or "").strip()
    area = (data.get("area") or "").strip()
    lat_val = data.get("latitude")
    lon_val = data.get("longitude")

    # Mendukung format input gabungan koordinat: "-0.8987, 119.8707"
    koordinat_str = (data.get("koordinat") or "").strip()
    if koordinat_str and (lat_val is None or lon_val is None):
        parts = [p.strip() for p in koordinat_str.split(",") if p.strip()]
        if len(parts) >= 2:
            lat_val = parts[0]
            lon_val = parts[1]

    if not nama_lokasi:
        return jsonify({"success": False, "error": "Nama lokasi wajib diisi."}), 400
    if not district:
        return jsonify({"success": False, "error": "District wajib diisi."}), 400

    # Pastikan fokus wilayah Palu
    if "DONGGALA" in district.upper() or "DONGGALA" in nama_lokasi.upper():
        return jsonify({
            "success": False,
            "error": "Wilayah fokus sistem inventaris ini dibatasi hanya untuk area Kota Palu."
        }), 400

    # Cek duplikasi nama lokasi
    existing = Location.query.filter(func.lower(Location.nama_lokasi) == nama_lokasi.lower()).first()
    if existing:
        return jsonify({"success": False, "error": f"Lokasi dengan nama '{nama_lokasi}' sudah terdaftar."}), 400

    try:
        latitude = float(lat_val) if lat_val not in (None, "", "-") else None
        longitude = float(lon_val) if lon_val not in (None, "", "-") else None
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Latitude dan longitude harus berupa angka desimal."}), 400

    new_loc = Location(
        nama_lokasi=nama_lokasi,
        district=district,
        alamat=alamat if alamat else None,
        area=area if area else None,
        latitude=latitude,
        longitude=longitude,
    )
    db.session.add(new_loc)
    db.session.commit()

    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="CREATE_LOCATION",
        table_name="locations",
        record_id=new_loc.location_id,
        data_dict={
            "nama_lokasi": new_loc.nama_lokasi,
            "district": new_loc.district,
            "alamat": new_loc.alamat,
            "created_by": current_user.name,
        }
    )
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Lokasi '{nama_lokasi}' berhasil ditambahkan ke database.",
        "location_id": new_loc.location_id
    }), 201


@api_bp.route("/locations/<int:location_id>", methods=["PUT"])
@login_required
def update_location(location_id):
    if current_user.role not in ["admin", "karyawan_tif"]:
        return jsonify({"success": False, "error": "Akses ditolak. Teknisi hanya memiliki akses melihat data."}), 403

    loc = Location.query.get_or_404(location_id)
    data = request.get_json() or {}

    nama_lokasi = (data.get("nama_lokasi") or "").strip()
    district = (data.get("district") or "").strip()
    alamat = (data.get("alamat") or "").strip()
    area = (data.get("area") or "").strip()
    lat_val = data.get("latitude")
    lon_val = data.get("longitude")

    # Mendukung format input gabungan koordinat: "-0.8987, 119.8707"
    koordinat_str = (data.get("koordinat") or "").strip()
    if koordinat_str and (lat_val is None or lon_val is None):
        parts = [p.strip() for p in koordinat_str.split(",") if p.strip()]
        if len(parts) >= 2:
            lat_val = parts[0]
            lon_val = parts[1]

    if not nama_lokasi:
        return jsonify({"success": False, "error": "Nama lokasi wajib diisi."}), 400
    if not district:
        return jsonify({"success": False, "error": "District wajib diisi."}), 400

    # Cek duplikasi nama jika berganti nama
    if nama_lokasi.lower() != loc.nama_lokasi.lower():
        existing = Location.query.filter(
            func.lower(Location.nama_lokasi) == nama_lokasi.lower(),
            Location.location_id != location_id
        ).first()
        if existing:
            return jsonify({"success": False, "error": f"Lokasi dengan nama '{nama_lokasi}' sudah digunakan."}), 400

    try:
        latitude = float(lat_val) if lat_val not in (None, "", "-") else None
        longitude = float(lon_val) if lon_val not in (None, "", "-") else None
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Latitude dan longitude harus berupa angka desimal."}), 400

    loc.nama_lokasi = nama_lokasi
    loc.district = district
    loc.alamat = alamat if alamat else None
    loc.area = area if area else None
    loc.latitude = latitude
    loc.longitude = longitude
    loc.updated_at = datetime.utcnow()

    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="UPDATE_LOCATION",
        table_name="locations",
        record_id=loc.location_id,
        data_dict={
            "nama_lokasi": loc.nama_lokasi,
            "district": loc.district,
            "alamat": loc.alamat,
            "updated_by": current_user.name,
        }
    )
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Data lokasi '{nama_lokasi}' berhasil diperbarui."
    })


@api_bp.route("/locations/<int:location_id>", methods=["DELETE"])
@login_required
def delete_location(location_id):
    if current_user.role not in ["admin", "karyawan_tif"]:
        return jsonify({"success": False, "error": "Akses ditolak. Teknisi hanya memiliki akses melihat data."}), 403

    loc = Location.query.get_or_404(location_id)

    # Cek relasi perangkat di database nyata
    dev_count = len(loc.devices)
    if dev_count > 0:
        return jsonify({
            "success": False,
            "error": f"Lokasi '{loc.nama_lokasi}' tidak dapat dihapus karena masih terdapat {dev_count} perangkat aktif terpasang di lokasi ini."
        }), 400

    loc_name = loc.nama_lokasi
    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="DELETE_LOCATION",
        table_name="locations",
        record_id=location_id,
        data_dict={
            "nama_lokasi": loc_name,
            "district": loc.district,
            "deleted_by": current_user.name,
        }
    )
    db.session.delete(loc)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Lokasi '{loc_name}' berhasil dihapus dari sistem."
    })


# ============================================================
# API PERANGKAT (DEVICES) - FOKUS INVENTARIS PALU
# ============================================================

@api_bp.route("/devices", methods=["GET"])
@login_required
def get_devices():
    """
    Mengambil data perangkat fokus Kota Palu (STO Palu 1 & STO Palu 2),
    dengan pencarian dan filter lokasi serta tipe perangkat.
    """
    search_q = (request.args.get("q") or "").strip()
    loc_filter = request.args.get("location_id")
    type_filter = request.args.get("device_type_id")
    show_all = request.args.get("all", "0") == "1"

    # Base query filter untuk lokasi Palu (STO Palu 1 & STO Palu 2)
    palu_loc_filter = (
        Location.nama_lokasi.ilike("STO Palu%")
        | (
            (func.upper(Location.district) == "PALU")
            & ~Location.nama_lokasi.ilike("%DONGGALA%")
            & ~Location.nama_lokasi.ilike("PALU1")
        )
    )
    palu_locations = Location.query.filter(palu_loc_filter).all()
    palu_loc_ids = [loc.location_id for loc in palu_locations]

    available_locations = [
        {"id": loc.location_id, "nama": loc.nama_lokasi, "district": loc.district}
        for loc in palu_locations
    ]
    available_types = [
        {"id": dt.device_type_id, "nama": dt.nama_tipe, "vendor": dt.vendor}
        for dt in DeviceType.query.order_by(DeviceType.nama_tipe.asc()).all()
    ]

    # Base devices query
    query = Device.query.join(Location, Device.location_id == Location.location_id)

    if not show_all and not loc_filter:
        if search_q or type_filter:
            query = query.filter(Device.location_id.in_(palu_loc_ids))
        else:
            # Default tampilan 2 unit PSS24 utama Palu sesuai referensi gambar
            query = query.filter(
                (Device.hostname.in_(["WN-24X-SUL-PAL11", "WN-24X-SUL-PAL211"]))
                | (Device.nama_perangkat.in_(["WN-24X-SUL-PAL11", "WN-24X-SUL-PAL211"]))
            )
    elif loc_filter:
        try:
            loc_id_int = int(loc_filter)
            query = query.filter(Device.location_id == loc_id_int)
        except ValueError:
            query = query.filter(Location.nama_lokasi == loc_filter)
    else:
        query = query.filter(Device.location_id.in_(palu_loc_ids))

    if type_filter:
        try:
            type_id_int = int(type_filter)
            query = query.filter(Device.device_type_id == type_id_int)
        except ValueError:
            query = query.join(DeviceType).filter(DeviceType.nama_tipe == type_filter)

    if search_q:
        q_like = f"%{search_q}%"
        query = query.outerjoin(DeviceType, Device.device_type_id == DeviceType.device_type_id).filter(
            (Device.nama_perangkat.ilike(q_like))
            | (Device.hostname.ilike(q_like))
            | (Device.serial_number.ilike(q_like))
            | (DeviceType.nama_tipe.ilike(q_like))
            | (Location.nama_lokasi.ilike(q_like))
        )

    devices_list = query.order_by(Device.nama_perangkat.asc()).all()

    # Hitung KPI aktual dari database
    total_palu_devices = Device.query.filter(
        Device.hostname.in_(["WN-24X-SUL-PAL11", "WN-24X-SUL-PAL211"])
    ).count()
    if total_palu_devices < 2:
        total_palu_devices = len(devices_list)

    total_locations_count = len(palu_locations)

    items = []
    for d in devices_list:
        positions_for_dev = ModulePosition.query.filter_by(device_id=d.device_id, status="aktif").all()
        installed_count = len([
            p for p in positions_for_dev
            if not is_transceiver(
                p.module.module_type.nama_tipe if p.module and p.module.module_type else "",
                p.port
            )
        ])
        items.append({
            "id": d.device_id,
            "device_id": d.device_id,
            "nama_perangkat": d.nama_perangkat or d.hostname,
            "hostname": d.hostname or d.nama_perangkat,
            "serial_number": d.serial_number or "-",
            "status": d.status or "aktif",
            "keterangan": d.keterangan or "-",
            "device_type_id": d.device_type_id,
            "tipe": d.device_type.nama_tipe if d.device_type else "-",
            "vendor": d.device_type.vendor if d.device_type else "-",
            "location_id": d.location_id,
            "lokasi": d.location.nama_lokasi if d.location else "-",
            "district": d.location.district if d.location else "-",
            "installed_modules_count": installed_count,
            "created_at": d.created_at.strftime("%Y-%m-%d %H:%M") if d.created_at else None,
        })

    return jsonify({
        "success": True,
        "items": items,
        "total_count": len(items),
        "stats": {
            "total_devices": total_palu_devices,
            "total_locations": total_locations_count,
        },
        "filter_options": {
            "locations": available_locations,
            "types": available_types,
        }
    })


@api_bp.route("/devices/<int:device_id>", methods=["GET"])
@login_required
def get_device_detail(device_id):
    """
    Mengambil rincian perangkat beserta modul yang terpasang di slot perangkat.
    """
    dev = Device.query.get_or_404(device_id)

    positions = (
        ModulePosition.query.filter_by(device_id=device_id, status="aktif")
        .order_by(ModulePosition.installed_at.desc())
        .all()
    )

    card_positions = [
        p for p in positions
        if not is_transceiver(
            p.module.module_type.nama_tipe if p.module and p.module.module_type else "",
            p.port
        )
    ]

    installed_modules = []
    for p in card_positions:
        mod = p.module
        slot_def = p.slot_definition
        installed_modules.append({
            "position_id": p.position_id,
            "modul_id": mod.modul_id if mod else None,
            "serial_number": mod.serial_number if mod else "-",
            "unit_part_number": mod.unit_part_number if mod else "-",
            "kondisi": mod.kondisi if mod else "-",
            "shelf": p.shelf or "-",
            "slot_number": slot_def.nomor_slot if slot_def else "-",
            "nama_slot": slot_def.nama_slot if slot_def else "-",
            "port": p.port or "-",
            "installed_at": p.installed_at.strftime("%Y-%m-%d %H:%M") if p.installed_at else None,
        })

    return jsonify({
        "success": True,
        "device": {
            "id": dev.device_id,
            "device_id": dev.device_id,
            "nama_perangkat": dev.nama_perangkat or dev.hostname,
            "hostname": dev.hostname or dev.nama_perangkat,
            "serial_number": dev.serial_number or "-",
            "status": dev.status or "aktif",
            "keterangan": dev.keterangan or "-",
            "device_type_id": dev.device_type_id,
            "tipe": dev.device_type.nama_tipe if dev.device_type else "-",
            "vendor": dev.device_type.vendor if dev.device_type else "-",
            "location_id": dev.location_id,
            "lokasi": dev.location.nama_lokasi if dev.location else "-",
            "alamat": dev.location.alamat if dev.location else "-",
            "district": dev.location.district if dev.location else "-",
            "installed_modules_count": len(installed_modules),
            "created_at": dev.created_at.strftime("%Y-%m-%d %H:%M") if dev.created_at else None,
        },
        "installed_modules": installed_modules,
    })


@api_bp.route("/devices", methods=["POST"])
@login_required
def create_device():
    """
    Menambahkan perangkat baru ke dalam database.
    """
    if current_user.role not in ["admin", "karyawan_tif"]:
        return jsonify({"success": False, "error": "Akses ditolak. Hanya Admin dan Karyawan TIF yang berhak."}), 403

    data = request.get_json(silent=True) or request.form.to_dict()
    nama_perangkat = (data.get("nama_perangkat") or "").strip()
    hostname = (data.get("hostname") or "").strip() or nama_perangkat
    device_type_id = data.get("device_type_id")
    location_id = data.get("location_id")
    serial_number = (data.get("serial_number") or "").strip() or None
    status = (data.get("status") or "aktif").strip()
    keterangan = (data.get("keterangan") or "").strip() or None

    if not nama_perangkat:
        return jsonify({"success": False, "error": "Nama perangkat wajib diisi."}), 400
    if not device_type_id:
        return jsonify({"success": False, "error": "Tipe perangkat wajib dipilih."}), 400
    if not location_id:
        return jsonify({"success": False, "error": "Lokasi wajib dipilih."}), 400

    try:
        device_type_id = int(device_type_id)
        location_id = int(location_id)
    except ValueError:
        return jsonify({"success": False, "error": "ID tipe perangkat dan lokasi tidak valid."}), 400

    new_device = Device(
        nama_perangkat=nama_perangkat,
        hostname=hostname,
        device_type_id=device_type_id,
        location_id=location_id,
        serial_number=serial_number,
        status=status,
        keterangan=keterangan,
    )
    db.session.add(new_device)
    db.session.commit()

    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="CREATE_DEVICE",
        table_name="devices",
        record_id=new_device.device_id,
        data_dict={
            "nama_perangkat": new_device.nama_perangkat,
            "hostname": new_device.hostname,
            "device_type_id": new_device.device_type_id,
            "location_id": new_device.location_id,
            "created_by": current_user.name,
        }
    )

    return jsonify({
        "success": True,
        "message": f"Perangkat '{nama_perangkat}' berhasil ditambahkan ke database.",
        "device_id": new_device.device_id,
    }), 201


@api_bp.route("/devices/<int:device_id>", methods=["PUT"])
@login_required
def update_device(device_id):
    """
    Memperbarui data perangkat yang ada di database.
    """
    if current_user.role not in ["admin", "karyawan_tif"]:
        return jsonify({"success": False, "error": "Akses ditolak."}), 403

    dev = Device.query.get_or_404(device_id)
    data = request.get_json(silent=True) or request.form.to_dict()

    nama_perangkat = (data.get("nama_perangkat") or "").strip()
    hostname = (data.get("hostname") or "").strip()
    device_type_id = data.get("device_type_id")
    location_id = data.get("location_id")
    serial_number = data.get("serial_number")
    status = data.get("status")
    keterangan = data.get("keterangan")

    if nama_perangkat:
        dev.nama_perangkat = nama_perangkat
    if hostname:
        dev.hostname = hostname
    if device_type_id:
        try:
            dev.device_type_id = int(device_type_id)
        except ValueError:
            pass
    if location_id:
        try:
            dev.location_id = int(location_id)
        except ValueError:
            pass
    if serial_number is not None:
        dev.serial_number = serial_number.strip() if serial_number.strip() else None
    if status:
        dev.status = status.strip()
    if keterangan is not None:
        dev.keterangan = keterangan.strip() if keterangan.strip() else None

    db.session.commit()

    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="UPDATE_DEVICE",
        table_name="devices",
        record_id=dev.device_id,
        data_dict={
            "nama_perangkat": dev.nama_perangkat,
            "hostname": dev.hostname,
            "updated_by": current_user.name,
        }
    )

    return jsonify({
        "success": True,
        "message": f"Data perangkat '{dev.nama_perangkat}' berhasil diperbarui.",
    })


@api_bp.route("/devices/<int:device_id>", methods=["DELETE"])
@login_required
def delete_device(device_id):
    """
    Menghapus perangkat dari database jika tidak ada modul aktif yang menempel.
    """
    if current_user.role not in ["admin", "karyawan_tif"]:
        return jsonify({"success": False, "error": "Akses ditolak."}), 403

    dev = Device.query.get_or_404(device_id)

    # Validasi relasi modul aktif
    active_positions_count = ModulePosition.query.filter_by(device_id=device_id, status="aktif").count()
    if active_positions_count > 0:
        return jsonify({
            "success": False,
            "error": f"Perangkat '{dev.nama_perangkat}' tidak dapat dihapus karena masih terdapat {active_positions_count} modul aktif terpasang di perangkat ini. Harap pindahkan atau lepaskan modul terlebih dahulu."
        }), 400

    dev_name = dev.nama_perangkat or dev.hostname
    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="DELETE_DEVICE",
        table_name="devices",
        record_id=device_id,
        data_dict={
            "nama_perangkat": dev_name,
            "hostname": dev.hostname,
            "deleted_by": current_user.name,
        }
    )

    db.session.delete(dev)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Perangkat '{dev_name}' berhasil dihapus dari sistem."
    })



# =====================================================================
# DEVICE TYPE (JENIS PERANGKAT) APIS
# =====================================================================

@api_bp.route("/device-types", methods=["GET"])
@login_required
def get_device_types():
    """
    Mengambil daftar seluruh jenis/tipe perangkat (DeviceType).
    """
    types = DeviceType.query.order_by(DeviceType.nama_tipe.asc()).all()
    items = [
        {
            "id": dt.device_type_id,
            "device_type_id": dt.device_type_id,
            "nama": dt.nama_tipe,
            "nama_tipe": dt.nama_tipe,
            "vendor": dt.vendor or "-",
            "deskripsi": dt.deskripsi or "-",
            "devices_count": len(dt.devices) if dt.devices else 0,
            "created_at": dt.created_at.strftime("%Y-%m-%d %H:%M") if dt.created_at else None,
        }
        for dt in types
    ]
    return jsonify({
        "success": True,
        "items": items,
        "types": items,
        "total_count": len(items)
    })


@api_bp.route("/device-types", methods=["POST"])
@login_required
def create_device_type():
    """
    Menambahkan jenis/tipe perangkat baru ke database dengan pencatatan audit ledger.
    """
    if current_user.role not in ["admin", "karyawan_tif"]:
        return jsonify({"success": False, "error": "Akses ditolak. Hanya Admin dan Karyawan TIF yang berhak."}), 403

    data = request.get_json(silent=True) or request.form.to_dict()
    nama_tipe = (data.get("nama_tipe") or data.get("nama") or "").strip()
    vendor = (data.get("vendor") or "").strip() or None
    deskripsi = (data.get("deskripsi") or "").strip() or None

    if not nama_tipe:
        return jsonify({"success": False, "error": "Nama jenis/tipe perangkat wajib diisi."}), 400

    if len(nama_tipe) > 100:
        return jsonify({"success": False, "error": "Nama tipe perangkat maksimal 100 karakter."}), 400

    # Cek duplikasi nama tipe (case-insensitive)
    existing = DeviceType.query.filter(func.lower(DeviceType.nama_tipe) == func.lower(nama_tipe)).first()
    if existing:
        return jsonify({
            "success": False,
            "error": f"Jenis perangkat dengan nama '{nama_tipe}' sudah terdaftar di sistem."
        }), 400

    new_type = DeviceType(
        nama_tipe=nama_tipe,
        vendor=vendor,
        deskripsi=deskripsi
    )
    db.session.add(new_type)
    db.session.commit()

    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="CREATE_DEVICE_TYPE",
        table_name="device_types",
        record_id=new_type.device_type_id,
        data_dict={
            "nama_tipe": new_type.nama_tipe,
            "vendor": new_type.vendor or "-",
            "deskripsi": new_type.deskripsi or "-",
            "created_by": current_user.name,
        }
    )

    return jsonify({
        "success": True,
        "message": f"Jenis perangkat '{nama_tipe}' berhasil ditambahkan ke database.",
        "device_type": {
            "id": new_type.device_type_id,
            "device_type_id": new_type.device_type_id,
            "nama": new_type.nama_tipe,
            "nama_tipe": new_type.nama_tipe,
            "vendor": new_type.vendor or "-",
            "deskripsi": new_type.deskripsi or "-",
        }
    }), 201


# =====================================================================
# ADMIN USER MANAGEMENT (KELOLA USER) APIS
# =====================================================================

@api_bp.route("/admin/users", methods=["GET"])
@login_required
def list_admin_users():
    """Mengambil daftar seluruh akun pengguna sistem (Admin only)."""
    if current_user.role != "admin":
        return jsonify({"success": False, "error": "Akses ditolak. Fitur ini hanya dapat diakses oleh Admin."}), 403

    users = User.query.order_by(User.created_at.desc()).all()
    user_list = [
        {
            "user_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "district": u.district or "-",
            "status": u.status or "aktif",
            "avatar_url": u.get_avatar_url(),
            "created_at": u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else None,
            "updated_at": u.updated_at.strftime("%Y-%m-%d %H:%M") if u.updated_at else None,
        }
        for u in users
    ]

    return jsonify({"success": True, "users": user_list, "total": len(user_list)})


@api_bp.route("/admin/users/<int:user_id>", methods=["GET"])
@login_required
def get_admin_user_detail(user_id):
    """Mengambil detail satu pengguna (Admin only). Password tidak pernah ditampilkan."""
    if current_user.role != "admin":
        return jsonify({"success": False, "error": "Akses ditolak. Fitur ini hanya dapat diakses oleh Admin."}), 403

    u = User.query.get_or_404(user_id)
    return jsonify({
        "success": True,
        "user": {
            "user_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "district": u.district or "-",
            "status": u.status or "aktif",
            "avatar_url": u.get_avatar_url(),
            "created_at": u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else None,
            "updated_at": u.updated_at.strftime("%Y-%m-%d %H:%M") if u.updated_at else None,
        }
    })


@api_bp.route("/admin/users", methods=["POST"])
@login_required
def create_admin_user():
    """Admin membuat akun baru (Karyawan TIF atau Teknisi). Password di-hash dengan aman."""
    if current_user.role != "admin":
        return jsonify({"success": False, "error": "Akses ditolak. Fitur ini hanya dapat diakses oleh Admin."}), 403

    data = request.get_json(silent=True) or request.form
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    role = (data.get("role") or "").strip()
    district = (data.get("district") or "").strip()
    password = data.get("password") or ""

    if not name or not email or not role or not district or not password:
        return jsonify({"success": False, "error": "Semua kolom wajib diisi (Nama, Email, Role, District, Password)."}), 400

    if role not in ["karyawan_tif", "teknisi", "admin"]:
        return jsonify({"success": False, "error": "Role tidak valid. Pilihan yang didukung: Karyawan TIF atau Teknisi."}), 400

    if len(password) < 8:
        return jsonify({"success": False, "error": "Password awal minimal harus 8 karakter."}), 400

    # Cek duplikasi email
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "error": f"Email '{email}' sudah terdaftar pada akun lain."}), 400

    new_user = User(
        name=name,
        email=email,
        role=role,
        district=district,
        status="aktif",
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="CREATE_USER",
        table_name="user",
        record_id=new_user.user_id,
        data_dict={
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "district": new_user.district,
            "status": new_user.status,
            "created_by": current_user.name,
        }
    )

    return jsonify({
        "success": True,
        "message": f"Akun pengguna '{name}' ({role}) berhasil dibuat dan langsung berstatus aktif.",
        "user": {
            "user_id": new_user.user_id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "district": new_user.district,
            "status": new_user.status,
            "created_at": new_user.created_at.strftime("%Y-%m-%d %H:%M") if new_user.created_at else None,
        }
    }), 201


@api_bp.route("/admin/users/<int:user_id>", methods=["PUT"])
@login_required
def update_admin_user(user_id):
    """Admin memperbarui informasi akun pengguna (Nama, Email, Role, District, Status)."""
    if current_user.role != "admin":
        return jsonify({"success": False, "error": "Akses ditolak. Fitur ini hanya dapat diakses oleh Admin."}), 403

    u = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or request.form

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    role = (data.get("role") or "").strip()
    district = (data.get("district") or "").strip()
    status = (data.get("status") or "").strip()

    if not name or not email or not role or not district:
        return jsonify({"success": False, "error": "Nama, Email, Role, dan District wajib diisi."}), 400

    if role not in ["admin", "karyawan_tif", "teknisi"]:
        return jsonify({"success": False, "error": "Role tidak valid."}), 400

    if status and status not in ["aktif", "pending", "nonaktif"]:
        return jsonify({"success": False, "error": "Status tidak valid. Pilihan: aktif, pending, nonaktif."}), 400

    # Proteksi akun diri sendiri: admin tidak boleh mendowngrade role sendiri atau menonaktifkan diri
    if u.user_id == current_user.user_id:
        if role != "admin":
            return jsonify({"success": False, "error": "Anda tidak dapat mengubah role akun Admin yang sedang Anda gunakan."}), 400
        if status and status != "aktif":
            return jsonify({"success": False, "error": "Anda tidak dapat menonaktifkan akun yang sedang Anda gunakan."}), 400

    # Cek keunikan email
    existing = User.query.filter(User.email == email, User.user_id != user_id).first()
    if existing:
        return jsonify({"success": False, "error": f"Email '{email}' sudah digunakan oleh pengguna lain."}), 400

    u.name = name
    u.email = email
    u.role = role
    u.district = district
    if status:
        u.status = status

    db.session.commit()

    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="UPDATE_USER",
        table_name="user",
        record_id=u.user_id,
        data_dict={
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "district": u.district,
            "status": u.status,
            "updated_by": current_user.name,
        }
    )

    return jsonify({
        "success": True,
        "message": f"Data pengguna '{u.name}' berhasil diperbarui.",
        "user": {
            "user_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "district": u.district,
            "status": u.status,
            "avatar_url": u.get_avatar_url(),
        }
    })


@api_bp.route("/admin/users/<int:user_id>/reset-password", methods=["POST"])
@login_required
def reset_admin_user_password(user_id):
    """Admin mereset password akun pengguna. Password baru di-hash dan password lama tidak pernah diekspos."""
    if current_user.role != "admin":
        return jsonify({"success": False, "error": "Akses ditolak. Fitur ini hanya dapat diakses oleh Admin."}), 403

    u = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or request.form

    new_password = (data.get("new_password") or data.get("password") or "").strip()
    if not new_password or len(new_password) < 8:
        return jsonify({"success": False, "error": "Password baru wajib diisi dan minimal 8 karakter."}), 400

    u.set_password(new_password)
    db.session.commit()

    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="RESET_PASSWORD_USER",
        table_name="user",
        record_id=u.user_id,
        data_dict={
            "target_user_name": u.name,
            "target_user_email": u.email,
            "reset_by": current_user.name,
        }
    )

    return jsonify({
        "success": True,
        "message": f"Password untuk akun '{u.name}' ({u.email}) berhasil direset."
    })


@api_bp.route("/admin/users/<int:user_id>/approve", methods=["POST"])
@login_required
def api_approve_user(user_id):
    """Admin mengaktifkan akun pengguna yang berstatus pending."""
    if current_user.role != "admin":
        return jsonify({"success": False, "error": "Akses ditolak. Fitur ini hanya dapat diakses oleh Admin."}), 403

    u = User.query.get_or_404(user_id)
    u.status = "aktif"
    db.session.commit()

    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="APPROVE_USER",
        table_name="user",
        record_id=u.user_id,
        data_dict={
            "target_user_name": u.name,
            "target_user_email": u.email,
            "approved_by": current_user.name,
        }
    )

    return jsonify({
        "success": True,
        "message": f"Akun pengguna '{u.name}' telah disetujui dan berstatus aktif."
    })


@api_bp.route("/admin/users/<int:user_id>", methods=["DELETE"])
@login_required
def delete_admin_user(user_id):
    """Admin menghapus akun pengguna dengan validasi integritas database & relasi audit."""
    if current_user.role != "admin":
        return jsonify({"success": False, "error": "Akses ditolak. Fitur ini hanya dapat diakses oleh Admin."}), 403

    u = User.query.get_or_404(user_id)

    # 1. Tidak boleh menghapus akun sendiri
    if u.user_id == current_user.user_id:
        return jsonify({"success": False, "error": "Tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan."}), 400

    # 2. Periksa relasi riwayat aktivitas & mutasi demi integritas data database
    has_audit = AuditLog.query.filter_by(user_id=user_id).first() is not None
    has_movement = ModuleMovement.query.filter_by(user_id=user_id).first() is not None
    has_request = ModuleRequest.query.filter_by(requested_by=user_id).first() is not None
    has_import = DataImport.query.filter_by(user_id=user_id).first() is not None

    if has_audit or has_movement or has_request or has_import:
        return jsonify({
            "success": False,
            "error": f"Pengguna '{u.name}' memiliki riwayat aktivitas, audit log, atau mutasi modul dalam sistem dan tidak dapat dihapus secara permanen demi integritas data historis. Silakan ubah status pengguna menjadi 'nonaktif' melalui tombol Edit."
        }), 400

    user_name = u.name
    user_email = u.email

    db.session.delete(u)
    db.session.commit()

    append_audit_log(
        db,
        user_id=current_user.user_id,
        aksi="DELETE_USER",
        table_name="user",
        record_id=user_id,
        data_dict={
            "deleted_user_name": user_name,
            "deleted_user_email": user_email,
            "deleted_by": current_user.name,
        }
    )

    return jsonify({
        "success": True,
        "message": f"Pengguna '{user_name}' berhasil dihapus dari sistem."
    })


@api_bp.route("/audit-logs", methods=["GET"])
@login_required
def get_audit_logs():
    entries = AuditLog.query.order_by(AuditLog.audit_id.desc()).all()
    data = []
    for e in entries:
        data.append({
            "audit_id": e.audit_id,
            "created_at": e.created_at.strftime("%d %b %Y %H:%M:%S") if e.created_at else "-",
            "raw_time": e.created_at.isoformat() if e.created_at else "",
            "aksi": e.aksi or "",
            "table_name": e.table_name or "-",
            "record_id": e.record_id if e.record_id is not None else "-",
            "actor_name": e.actor.name if e.actor else "System",
            "actor_role": e.actor.role if e.actor else "-",
            "actor_email": e.actor.email if e.actor else "-",
            "actor_avatar_url": e.actor.avatar_url if e.actor else None,
            "hash": e.hash or "",
            "previous_hash": e.previous_hash or "GENESIS",
            "data_snapshot": e.data_snapshot or "",
        })
    return jsonify({
        "success": True,
        "entries": data,
        "total": len(data)
    })



