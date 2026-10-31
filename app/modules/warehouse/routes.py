import os
from flask import Blueprint, jsonify, request, render_template, current_app
from flask_login import login_required, current_user
from ...utils.decorators import role_required
from .etl import run_etl_pipeline
from .olap import (
    get_warehouse_overview,
    olap_query_movements,
    olap_query_requests,
    olap_pivot_table
)
from .models import DwhEtlLog, DimDate, DimLocation, DimModule

warehouse_bp = Blueprint(
    "warehouse",
    __name__,
    url_prefix="/warehouse",
    template_folder="../../templates/warehouse"
)


@warehouse_bp.route("/")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def index():
    """
    Rute utama Data Warehouse: Merender bundle React jika ada,
    atau fallback template Jinja.
    """
    react_template_path = os.path.join(current_app.root_path, "templates", "react_index.html")
    if os.path.exists(react_template_path):
        return render_template("react_index.html", current_user=current_user)
    return render_template("warehouse/index.html")


@warehouse_bp.route("/api/overview")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def api_overview():
    """
    Mengembalikan data KPI ringkasan, dimensi, dan opsi filter untuk UI.
    """
    overview = get_warehouse_overview()

    # Opsi filter dinamis dari dimensi
    available_years = [
        y[0] for y in DimDate.query.with_entities(DimDate.year).distinct().order_by(DimDate.year.desc()).all()
    ]
    available_locations = [
        {"id": loc.location_key, "name": loc.nama_lokasi}
        for loc in DimLocation.query.order_by(DimLocation.nama_lokasi.asc()).all()
    ]
    available_module_types = [
        m[0] for m in DimModule.query.with_entities(DimModule.tipe_modul).distinct().order_by(DimModule.tipe_modul.asc()).all()
        if m[0]
    ]

    overview["filter_options"] = {
        "years": available_years,
        "locations": available_locations,
        "module_types": available_module_types
    }
    return jsonify(overview)


@warehouse_bp.route("/api/olap/movements")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def api_olap_movements():
    """
    Endpoint Data Mart 1: Analisis Mutasi & Siklus Hidup Aset (OLAP Roll-up/Drill-down & Slice/Dice).
    """
    granularity = request.args.get("granularity", "month")
    year = request.args.get("year", type=int)
    location_id = request.args.get("location_id", type=int)
    module_type = request.args.get("module_type")
    jenis_perubahan = request.args.get("jenis_perubahan")

    data = olap_query_movements(
        granularity=granularity,
        year=year,
        location_id=location_id,
        module_type=module_type,
        jenis_perubahan=jenis_perubahan
    )
    return jsonify(data)


@warehouse_bp.route("/api/olap/requests")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def api_olap_requests():
    """
    Endpoint Data Mart 2: Analisis Pemenuhan Permohonan Modul & SLA.
    """
    year = request.args.get("year", type=int)
    status = request.args.get("status")
    jenis_perubahan = request.args.get("jenis_perubahan")

    data = olap_query_requests(year=year, status=status, jenis_perubahan=jenis_perubahan)
    return jsonify(data)


@warehouse_bp.route("/api/olap/pivot")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def api_olap_pivot():
    """
    Endpoint Matriks Pivot: Cross-tabulation Tipe Modul x Tipe Perangkat.
    """
    pivot_data = olap_pivot_table()
    return jsonify(pivot_data)


@warehouse_bp.route("/api/etl/run", methods=["POST"])
@login_required
@role_required("admin", "karyawan_tif")
def api_etl_run():
    """
    Pemicu manual eksekusi pipeline ETL.
    """
    result = run_etl_pipeline()
    return jsonify(result), (200 if result.get("success") else 500)


@warehouse_bp.route("/api/etl/history")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def api_etl_history():
    """
    Riwayat eksekusi pipeline ETL beserta log validasi kualitas data dan SHA-256 hash.
    """
    logs = DwhEtlLog.query.order_by(DwhEtlLog.run_timestamp.desc()).limit(10).all()
    history = [
        {
            "etl_id": log.etl_id,
            "timestamp": log.run_timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "status": log.status,
            "records_extracted": log.records_extracted,
            "records_loaded": log.records_loaded,
            "duration_seconds": log.duration_seconds,
            "integrity_hash": log.integrity_hash,
            "quality_issues": log.data_quality_issues
        }
        for log in logs
    ]
    return jsonify({"history": history})
