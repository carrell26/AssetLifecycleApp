import hashlib
import json
import time
from datetime import datetime, date
from ...extensions import db
from ...models.device import Device
from ...models.module import Module
from ...models.location import Location
from ...models.user import User
from ...models.module_movement import ModuleMovement
from ...models.module_request import ModuleRequest
from ...models.request_approval import RequestApproval

from .models import (
    DimDate,
    DimDevice,
    DimModule,
    DimLocation,
    DimUser,
    FactModuleMovement,
    FactRequestFulfillment,
    DwhEtlLog
)

INDONESIAN_DAYS = {
    0: "Senin",
    1: "Selasa",
    2: "Rabu",
    3: "Kamis",
    4: "Jumat",
    5: "Sabtu",
    6: "Minggu"
}

INDONESIAN_MONTHS = {
    1: "Januari",
    2: "Februari",
    3: "Maret",
    4: "April",
    5: "Mei",
    6: "Juni",
    7: "Juli",
    8: "Agustus",
    9: "September",
    10: "Oktober",
    11: "November",
    12: "Desember"
}


def get_or_create_date_key(dt_obj):
    """
    Mengambil atau membuat record DimDate berdasarkan tanggal yang diberikan.
    Surrogate key format: YYYYMMDD (integer).
    """
    if not dt_obj:
        dt_obj = datetime.utcnow()

    if isinstance(dt_obj, datetime):
        d = dt_obj.date()
    else:
        d = dt_obj

    date_key = d.year * 10000 + d.month * 100 + d.day
    dim_date = DimDate.query.filter_by(date_key=date_key).first()
    if not dim_date:
        dim_date = DimDate(
            date_key=date_key,
            full_date=d,
            day_of_week=d.weekday() + 1,  # 1 = Senin, 7 = Minggu
            day_name=INDONESIAN_DAYS.get(d.weekday(), "Unknown"),
            day_of_month=d.day,
            month=d.month,
            month_name=INDONESIAN_MONTHS.get(d.month, "Unknown"),
            quarter=((d.month - 1) // 3) + 1,
            year=d.year,
            is_weekend=(d.weekday() >= 5)
        )
        db.session.add(dim_date)
        db.session.flush()

    return date_key


def run_etl_pipeline():
    """
    Menjalankan siklus lengkap ETL (Extract, Transform, Load) untuk Data Warehouse:
    1. Extract: Membaca data transaksi operasional (OLTP).
    2. Transform: Pembersihan data, deteksi anomali, kalkulasi durasi & surrogate key.
    3. Load: Mengisi tabel fakta & dimensi skema bintang + logging kualitas & SHA-256 integrity hash.
    """
    start_time = time.time()
    quality_issues = []
    records_extracted = 0
    records_loaded = 0

    try:
        # ==============================================================
        # 1. EXTRACT DATA OPERASIONAL (READ-ONLY)
        # ==============================================================
        raw_devices = Device.query.all()
        raw_modules = Module.query.all()
        raw_locations = Location.query.all()
        raw_users = User.query.all()
        raw_movements = ModuleMovement.query.order_by(ModuleMovement.tanggal.asc()).all()
        raw_requests = ModuleRequest.query.order_by(ModuleRequest.created_at.asc()).all()
        raw_approvals = {a.request_id: a for a in RequestApproval.query.all()}

        records_extracted = (
            len(raw_devices) + len(raw_modules) + len(raw_locations) +
            len(raw_users) + len(raw_movements) + len(raw_requests)
        )

        # ==============================================================
        # 2. TRANSFORM & LOAD DIMENSIONS (UPSERT / SYNC)
        # ==============================================================

        # A. DimLocation
        loc_map = {}
        for loc in raw_locations:
            nama = (loc.nama_lokasi or "").strip()
            if not nama:
                nama = "Lokasi Tidak Diketahui"
                quality_issues.append(f"Location ID {loc.location_id}: nama lokasi kosong, diset default.")

            dim_loc = DimLocation.query.filter_by(original_location_id=loc.location_id).first()
            if not dim_loc:
                dim_loc = DimLocation(
                    original_location_id=loc.location_id,
                    nama_lokasi=nama
                )
                db.session.add(dim_loc)
                db.session.flush()
            else:
                dim_loc.nama_lokasi = nama
            loc_map[loc.location_id] = dim_loc.location_key

        # B. DimDevice
        dev_map = {}
        for dev in raw_devices:
            tipe_name = dev.device_type.nama_tipe if dev.device_type else "Umum"
            loc_name = dev.location.nama_lokasi if dev.location else "Tidak Terdefinisi"
            total_slots = len(dev.device_type.slot_definitions) if dev.device_type and dev.device_type.slot_definitions else 0

            dim_dev = DimDevice.query.filter_by(original_device_id=dev.device_id).first()
            if not dim_dev:
                dim_dev = DimDevice(
                    original_device_id=dev.device_id,
                    nama_perangkat=dev.nama_perangkat or f"Perangkat-{dev.device_id}",
                    hostname=dev.hostname or "-",
                    serial_number=dev.serial_number or "-",
                    tipe_perangkat=tipe_name,
                    lokasi_gedung=loc_name,
                    total_slots=total_slots,
                    status=dev.status or "AKTIF"
                )
                db.session.add(dim_dev)
                db.session.flush()
            else:
                dim_dev.nama_perangkat = dev.nama_perangkat or f"Perangkat-{dev.device_id}"
                dim_dev.hostname = dev.hostname or "-"
                dim_dev.serial_number = dev.serial_number or "-"
                dim_dev.tipe_perangkat = tipe_name
                dim_dev.lokasi_gedung = loc_name
                dim_dev.total_slots = total_slots
                dim_dev.status = dev.status or "AKTIF"
            dev_map[dev.device_id] = dim_dev.device_key

        # C. DimModule
        mod_map = {}
        for mod in raw_modules:
            sn = (mod.serial_number or "").strip()
            if not sn:
                sn = f"UNKNOWN-MOD-{mod.modul_id}"
                quality_issues.append(f"Module ID {mod.modul_id}: Serial number kosong, diset ke {sn}.")

            tipe_name = mod.module_type.nama_tipe if mod.module_type else "Optical Module"

            dim_mod = DimModule.query.filter_by(original_module_id=mod.modul_id).first()
            if not dim_mod:
                dim_mod = DimModule(
                    original_module_id=mod.modul_id,
                    serial_number=sn,
                    unit_part_number=mod.unit_part_number or "-",
                    tipe_modul=tipe_name,
                    kondisi=mod.kondisi or "AKTIF"
                )
                db.session.add(dim_mod)
                db.session.flush()
            else:
                dim_mod.serial_number = sn
                dim_mod.unit_part_number = mod.unit_part_number or "-"
                dim_mod.tipe_modul = tipe_name
                dim_mod.kondisi = mod.kondisi or "AKTIF"
            mod_map[mod.modul_id] = dim_mod.module_key

        # D. DimUser
        user_map = {}
        for usr in raw_users:
            nama = getattr(usr, "name", None) or getattr(usr, "username", None) or f"User-{usr.user_id}"
            email = getattr(usr, "email", None) or nama
            role_name = getattr(usr, "role", None) or "karyawan"
            district = getattr(usr, "district", None) or "Pusat"

            dim_usr = DimUser.query.filter_by(original_user_id=usr.user_id).first()
            if not dim_usr:
                dim_usr = DimUser(
                    original_user_id=usr.user_id,
                    username=email,
                    nama_lengkap=nama,
                    role=role_name,
                    divisi=f"Divisi {district}"
                )
                db.session.add(dim_usr)
                db.session.flush()
            else:
                dim_usr.username = email
                dim_usr.nama_lengkap = nama
                dim_usr.role = role_name
                dim_usr.divisi = f"Divisi {district}"
            user_map[usr.user_id] = dim_usr.user_key

        # ==============================================================
        # 3. TRANSFORM & LOAD FACT TABLES
        # ==============================================================

        # Hash accumulator for Data Integrity verification (SHA-256)
        hash_stream = hashlib.sha256()

        # A. FactModuleMovement (Data Mart 1: Asset Lifecycle & Movement)
        module_last_timestamp = {}
        for m in raw_movements:
            date_key = get_or_create_date_key(m.tanggal or datetime.utcnow())
            mod_key = mod_map.get(m.module_id)
            if not mod_key:
                continue

            from_dev_key = dev_map.get(m.from_device_id)
            to_dev_key = dev_map.get(m.to_device_id)
            usr_key = user_map.get(m.user_id)

            # Hitung durasi terpasang (hari) dari pergerakan sebelumnya
            durasi_hari = 0.0
            if m.module_id in module_last_timestamp and m.tanggal:
                prev_ts = module_last_timestamp[m.module_id]
                delta_sec = (m.tanggal - prev_ts).total_seconds()
                durasi_hari = round(max(0.0, delta_sec / 86400.0), 2)
            if m.tanggal:
                module_last_timestamp[m.module_id] = m.tanggal

            # Cari lokasi perangkat tujuan atau asal
            target_device = Device.query.get(m.to_device_id) if m.to_device_id else None
            loc_key = loc_map.get(target_device.location_id) if target_device and target_device.location_id else None

            fact_move = FactModuleMovement.query.filter_by(original_movement_id=m.movement_id).first()
            if not fact_move:
                fact_move = FactModuleMovement(
                    original_movement_id=m.movement_id,
                    date_key=date_key,
                    module_key=mod_key,
                    from_device_key=from_dev_key,
                    to_device_key=to_dev_key,
                    location_key=loc_key,
                    user_key=usr_key,
                    jenis_perubahan=(m.jenis_perubahan or "pindah").lower(),
                    durasi_terpasang_hari=durasi_hari,
                    movement_count=1
                )
                db.session.add(fact_move)
                records_loaded += 1
            else:
                fact_move.date_key = date_key
                fact_move.module_key = mod_key
                fact_move.from_device_key = from_dev_key
                fact_move.to_device_key = to_dev_key
                fact_move.location_key = loc_key
                fact_move.user_key = usr_key
                fact_move.jenis_perubahan = (m.jenis_perubahan or "pindah").lower()
                fact_move.durasi_terpasang_hari = durasi_hari

            # Hash integration
            hash_stream.update(f"MOVE|{m.movement_id}|{date_key}|{mod_key}|{durasi_hari}".encode("utf-8"))

        # B. FactRequestFulfillment (Data Mart 2: Request & SLA Fulfillment)
        for req in raw_requests:
            req_date_key = get_or_create_date_key(req.created_at or datetime.utcnow())
            mod_key = mod_map.get(req.module_id)
            requester_key = user_map.get(req.requested_by)
            target_dev_key = dev_map.get(req.to_device_id or req.from_device_id)

            appr_record = raw_approvals.get(req.request_id)
            appr_date_key = None
            approver_key = None
            lead_time_jam = 0.0

            if appr_record and appr_record.approved_at:
                appr_date_key = get_or_create_date_key(appr_record.approved_at)
                approver_key = user_map.get(appr_record.approved_by)
                if req.created_at:
                    delta_hours = (appr_record.approved_at - req.created_at).total_seconds() / 3600.0
                    lead_time_jam = round(max(0.0, delta_hours), 2)

            is_appr = 1 if req.status in ["APPROVED", "AUTO_APPROVED"] else 0

            fact_req = FactRequestFulfillment.query.filter_by(original_request_id=req.request_id).first()
            if not fact_req:
                fact_req = FactRequestFulfillment(
                    original_request_id=req.request_id,
                    request_date_key=req_date_key,
                    approval_date_key=appr_date_key,
                    module_key=mod_key,
                    requester_user_key=requester_key,
                    approver_user_key=approver_key,
                    target_device_key=target_dev_key,
                    jenis_perubahan=(req.jenis_perubahan or "pasang").lower(),
                    status=req.status or "PENDING",
                    lead_time_jam=lead_time_jam,
                    is_approved=is_appr,
                    request_count=1
                )
                db.session.add(fact_req)
                records_loaded += 1
            else:
                fact_req.request_date_key = req_date_key
                fact_req.approval_date_key = appr_date_key
                fact_req.module_key = mod_key
                fact_req.requester_user_key = requester_key
                fact_req.approver_user_key = approver_key
                fact_req.target_device_key = target_dev_key
                fact_req.jenis_perubahan = (req.jenis_perubahan or "pasang").lower()
                fact_req.status = req.status or "PENDING"
                fact_req.lead_time_jam = lead_time_jam
                fact_req.is_approved = is_appr

            # Hash integration
            hash_stream.update(f"REQ|{req.request_id}|{req_date_key}|{req.status}|{lead_time_jam}".encode("utf-8"))

        duration = round(time.time() - start_time, 3)
        integrity_hash = hash_stream.hexdigest()

        # Log ETL execution
        etl_log = DwhEtlLog(
            run_timestamp=datetime.utcnow(),
            status="SUCCESS",
            records_extracted=records_extracted,
            records_loaded=records_loaded,
            data_quality_issues=json.dumps(quality_issues),
            duration_seconds=duration,
            integrity_hash=integrity_hash
        )
        db.session.add(etl_log)
        db.session.commit()

        return {
            "success": True,
            "status": "SUCCESS",
            "duration_seconds": duration,
            "records_extracted": records_extracted,
            "records_loaded": records_loaded,
            "quality_issues_count": len(quality_issues),
            "quality_issues": quality_issues[:15],  # snippet
            "integrity_hash": integrity_hash,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        db.session.rollback()
        duration = round(time.time() - start_time, 3)
        err_msg = str(e)

        try:
            etl_log = DwhEtlLog(
                run_timestamp=datetime.utcnow(),
                status="FAILED",
                records_extracted=records_extracted,
                records_loaded=0,
                data_quality_issues=json.dumps([f"Error fatal: {err_msg}"]),
                duration_seconds=duration,
                integrity_hash=None
            )
            db.session.add(etl_log)
            db.session.commit()
        except Exception:
            pass

        return {
            "success": False,
            "status": "FAILED",
            "error": err_msg,
            "duration_seconds": duration
        }
