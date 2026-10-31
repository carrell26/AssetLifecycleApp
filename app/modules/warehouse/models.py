from datetime import datetime
from ...extensions import db


class DimDate(db.Model):
    """
    Tabel Dimensi Waktu (DimDate) untuk analisis temporal (Roll-up & Drill-down).
    Surrogate key berupa integer YYYYMMDD (contoh: 20261031).
    """
    __tablename__ = "dwh_dim_date"

    date_key = db.Column(db.Integer, primary_key=True)  # Format: YYYYMMDD
    full_date = db.Column(db.Date, nullable=False, index=True)
    day_of_week = db.Column(db.Integer, nullable=False)  # 1 (Senin) - 7 (Minggu)
    day_name = db.Column(db.String(20), nullable=False)   # Senin, Selasa, ...
    day_of_month = db.Column(db.Integer, nullable=False) # 1 - 31
    month = db.Column(db.Integer, nullable=False)        # 1 - 12
    month_name = db.Column(db.String(20), nullable=False) # Januari, Februari, ...
    quarter = db.Column(db.Integer, nullable=False)      # 1 - 4 (Q1, Q2, Q3, Q4)
    year = db.Column(db.Integer, nullable=False, index=True) # 2025, 2026, ...
    is_weekend = db.Column(db.Boolean, default=False)


class DimDevice(db.Model):
    """
    Tabel Dimensi Perangkat (DimDevice).
    Menyimpan profil snapshot perangkat jaringan / server rack.
    """
    __tablename__ = "dwh_dim_device"

    device_key = db.Column(db.Integer, primary_key=True, autoincrement=True)  # Surrogate Key
    original_device_id = db.Column(db.Integer, nullable=False, index=True)   # Natural/OLTP Key
    nama_perangkat = db.Column(db.String(150), nullable=False)
    hostname = db.Column(db.String(150), default="-")
    serial_number = db.Column(db.String(100), default="-")
    tipe_perangkat = db.Column(db.String(100), default="-")
    lokasi_gedung = db.Column(db.String(150), default="-")
    total_slots = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), default="AKTIF")


class DimModule(db.Model):
    """
    Tabel Dimensi Modul (DimModule).
    Menyimpan atribut modul optik / line card.
    """
    __tablename__ = "dwh_dim_module"

    module_key = db.Column(db.Integer, primary_key=True, autoincrement=True)  # Surrogate Key
    original_module_id = db.Column(db.Integer, nullable=False, index=True)   # Natural/OLTP Key
    serial_number = db.Column(db.String(100), nullable=False, index=True)
    unit_part_number = db.Column(db.String(100), default="-")
    tipe_modul = db.Column(db.String(100), default="-")
    kondisi = db.Column(db.String(50), default="AKTIF")


class DimLocation(db.Model):
    """
    Tabel Dimensi Lokasi (DimLocation).
    Menyimpan hierarki penempatan fisik perangkat / rak.
    """
    __tablename__ = "dwh_dim_location"

    location_key = db.Column(db.Integer, primary_key=True, autoincrement=True)
    original_location_id = db.Column(db.Integer, nullable=False, index=True)
    nama_lokasi = db.Column(db.String(150), nullable=False)


class DimUser(db.Model):
    """
    Tabel Dimensi Pengguna (DimUser).
    Menyimpan pelaku mutasi maupun permohonan aset.
    """
    __tablename__ = "dwh_dim_user"

    user_key = db.Column(db.Integer, primary_key=True, autoincrement=True)
    original_user_id = db.Column(db.Integer, nullable=False, index=True)
    username = db.Column(db.String(100), nullable=False)
    nama_lengkap = db.Column(db.String(150), default="-")
    role = db.Column(db.String(50), default="karyawan")
    divisi = db.Column(db.String(100), default="TI")


class FactModuleMovement(db.Model):
    """
    Tabel Fakta 1: Pergerakan Modul (Data Mart: Asset Movement & Lifecycle).
    Grain: 1 record = 1 kejadian perpindahan/instalasi modul yang disetujui.
    """
    __tablename__ = "dwh_fact_module_movement"

    fact_movement_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    original_movement_id = db.Column(db.Integer, nullable=False, index=True)

    # Foreign Keys ke Tabel Dimensi
    date_key = db.Column(db.Integer, db.ForeignKey("dwh_dim_date.date_key"), nullable=False, index=True)
    module_key = db.Column(db.Integer, db.ForeignKey("dwh_dim_module.module_key"), nullable=False, index=True)
    from_device_key = db.Column(db.Integer, db.ForeignKey("dwh_dim_device.device_key"), nullable=True)
    to_device_key = db.Column(db.Integer, db.ForeignKey("dwh_dim_device.device_key"), nullable=True)
    location_key = db.Column(db.Integer, db.ForeignKey("dwh_dim_location.location_key"), nullable=True)
    user_key = db.Column(db.Integer, db.ForeignKey("dwh_dim_user.user_key"), nullable=True)

    # Atribut Kejadian & Fakta Terukur (Metrics)
    jenis_perubahan = db.Column(db.String(20), nullable=False)  # pasang / pindah / lepas
    durasi_terpasang_hari = db.Column(db.Float, default=0.0)    # Waktu pakai modul sebelum dipindah
    movement_count = db.Column(db.Integer, default=1)           # Additive measure

    # Relationships
    dim_date = db.relationship("DimDate", foreign_keys=[date_key])
    dim_module = db.relationship("DimModule", foreign_keys=[module_key])
    from_device = db.relationship("DimDevice", foreign_keys=[from_device_key])
    to_device = db.relationship("DimDevice", foreign_keys=[to_device_key])
    dim_location = db.relationship("DimLocation", foreign_keys=[location_key])
    dim_user = db.relationship("DimUser", foreign_keys=[user_key])


class FactRequestFulfillment(db.Model):
    """
    Tabel Fakta 2: Pemenuhan Permohonan Modul (Data Mart: Request & SLA Fulfillment).
    Grain: 1 record = 1 pengajuan permohonan modul beserta status persetujuannya.
    """
    __tablename__ = "dwh_fact_request_fulfillment"

    fact_request_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    original_request_id = db.Column(db.Integer, nullable=False, index=True)

    # Foreign Keys ke Tabel Dimensi
    request_date_key = db.Column(db.Integer, db.ForeignKey("dwh_dim_date.date_key"), nullable=False, index=True)
    approval_date_key = db.Column(db.Integer, db.ForeignKey("dwh_dim_date.date_key"), nullable=True)
    module_key = db.Column(db.Integer, db.ForeignKey("dwh_dim_module.module_key"), nullable=True)
    requester_user_key = db.Column(db.Integer, db.ForeignKey("dwh_dim_user.user_key"), nullable=True)
    approver_user_key = db.Column(db.Integer, db.ForeignKey("dwh_dim_user.user_key"), nullable=True)
    target_device_key = db.Column(db.Integer, db.ForeignKey("dwh_dim_device.device_key"), nullable=True)

    # Atribut & Metrik (Measures)
    jenis_perubahan = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(30), nullable=False)  # APPROVED / REJECTED / AUTO_APPROVED / PENDING
    lead_time_jam = db.Column(db.Float, default=0.0)   # Durasi permohonan hingga diproses (Jam)
    is_approved = db.Column(db.Integer, default=0)     # 1 jika approved, 0 jika rejected/pending
    request_count = db.Column(db.Integer, default=1)   # Additive measure

    # Relationships
    request_dim_date = db.relationship("DimDate", foreign_keys=[request_date_key])
    approval_dim_date = db.relationship("DimDate", foreign_keys=[approval_date_key])
    dim_module = db.relationship("DimModule", foreign_keys=[module_key])
    requester = db.relationship("DimUser", foreign_keys=[requester_user_key])
    approver = db.relationship("DimUser", foreign_keys=[approver_user_key])
    target_device = db.relationship("DimDevice", foreign_keys=[target_device_key])


class DwhEtlLog(db.Model):
    """
    Log Rekam Jejak Pipeline ETL & Validasi Kualitas Data (Data Quality & Integrity).
    Menyimpan metrik eksekusi ETL, ringkasan pembersihan anomali, dan SHA-256 Hash.
    """
    __tablename__ = "dwh_etl_log"

    etl_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    run_timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    status = db.Column(db.String(20), default="SUCCESS")  # SUCCESS / FAILED
    records_extracted = db.Column(db.Integer, default=0)
    records_loaded = db.Column(db.Integer, default=0)
    data_quality_issues = db.Column(db.Text, default="[]")  # JSON list catatan cleansing
    duration_seconds = db.Column(db.Float, default=0.0)
    integrity_hash = db.Column(db.String(64), nullable=True)  # SHA-256 cryptographic batch hash
