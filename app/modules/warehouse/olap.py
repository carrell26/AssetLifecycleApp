from sqlalchemy import func, case
from ...extensions import db
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


def get_warehouse_overview():
    """
    Mengambil metrik ringkasan keseluruhan Data Warehouse (High-Level BI KPIs).
    """
    total_dim_dates = DimDate.query.count()
    total_dim_devices = DimDevice.query.count()
    total_dim_modules = DimModule.query.count()
    total_dim_locations = DimLocation.query.count()
    total_dim_users = DimUser.query.count()

    total_fact_movements = FactModuleMovement.query.count()
    total_fact_requests = FactRequestFulfillment.query.count()

    # Rata-rata durasi pakai modul (hari)
    avg_duration = db.session.query(func.avg(FactModuleMovement.durasi_terpasang_hari)).scalar() or 0.0

    # SLA Permohonan: Rata-rata lead time (jam)
    avg_lead_time = db.session.query(func.avg(FactRequestFulfillment.lead_time_jam)).filter(
        FactRequestFulfillment.approval_date_key.isnot(None)
    ).scalar() or 0.0

    # Persentase permohonan disetujui (Acceptance Rate)
    total_req_count = FactRequestFulfillment.query.count()
    approved_req_count = FactRequestFulfillment.query.filter_by(is_approved=1).count()
    acceptance_rate = round((approved_req_count / total_req_count * 100), 1) if total_req_count > 0 else 100.0

    # Log ETL Terakhir
    last_etl = DwhEtlLog.query.order_by(DwhEtlLog.run_timestamp.desc()).first()

    return {
        "kpi": {
            "total_facts_recorded": total_fact_movements + total_fact_requests,
            "total_movements": total_fact_movements,
            "total_requests": total_fact_requests,
            "avg_module_lifespan_days": round(avg_duration, 1),
            "avg_request_lead_time_hours": round(avg_lead_time, 1),
            "request_acceptance_rate": acceptance_rate,
        },
        "dimensions": {
            "dates": total_dim_dates,
            "devices": total_dim_devices,
            "modules": total_dim_modules,
            "locations": total_dim_locations,
            "users": total_dim_users
        },
        "last_etl": {
            "run_timestamp": last_etl.run_timestamp.strftime("%Y-%m-%d %H:%M:%S") if last_etl else "-",
            "status": last_etl.status if last_etl else "BELUM_DIJALANKAN",
            "duration_seconds": last_etl.duration_seconds if last_etl else 0.0,
            "records_loaded": last_etl.records_loaded if last_etl else 0,
            "integrity_hash": last_etl.integrity_hash if last_etl else "-"
        }
    }


def olap_query_movements(granularity="month", year=None, location_id=None, module_type=None, jenis_perubahan=None):
    """
    Operasi OLAP untuk Data Mart 1 (Asset Movement & Lifecycle):
    - Roll-up / Drill-down: melalui parameter granularity ('year', 'quarter', 'month', 'day').
    - Slice & Dice: filter multidimensi (tahun, lokasi, jenis modul, jenis perubahan).
    """
    query = db.session.query(
        FactModuleMovement,
        DimDate,
        DimDevice,
        DimModule,
        DimLocation
    ).join(DimDate, FactModuleMovement.date_key == DimDate.date_key)\
     .outerjoin(DimDevice, FactModuleMovement.to_device_key == DimDevice.device_key)\
     .outerjoin(DimModule, FactModuleMovement.module_key == DimModule.module_key)\
     .outerjoin(DimLocation, FactModuleMovement.location_key == DimLocation.location_key)

    # Slice & Dice filtering
    if year:
        query = query.filter(DimDate.year == int(year))
    if location_id:
        query = query.filter(FactModuleMovement.location_key == int(location_id))
    if module_type:
        query = query.filter(DimModule.tipe_modul == module_type)
    if jenis_perubahan and jenis_perubahan != "all":
        query = query.filter(FactModuleMovement.jenis_perubahan == jenis_perubahan.lower())

    results = query.all()

    # Agregasi hierarki waktu (Roll-up / Drill-down)
    aggregated = {}
    breakdown_jenis = {"pasang": 0, "pindah": 0, "lepas": 0}
    durations = []

    for fact, d_date, d_dev, d_mod, d_loc in results:
        # Group key based on granularity
        if granularity == "year":
            group_key = f"Tahun {d_date.year}"
        elif granularity == "quarter":
            group_key = f"Q{d_date.quarter} {d_date.year}"
        elif granularity == "day":
            group_key = d_date.full_date.strftime("%d %b %Y")
        else:  # default month
            group_key = f"{d_date.month_name[:3]} {d_date.year}"

        if group_key not in aggregated:
            aggregated[group_key] = {
                "period": group_key,
                "total_movements": 0,
                "pasang": 0,
                "pindah": 0,
                "lepas": 0,
                "avg_duration": 0.0,
                "total_duration": 0.0
            }

        aggregated[group_key]["total_movements"] += 1
        jp = (fact.jenis_perubahan or "pindah").lower()
        if jp in aggregated[group_key]:
            aggregated[group_key][jp] += 1
        if jp in breakdown_jenis:
            breakdown_jenis[jp] += 1

        aggregated[group_key]["total_duration"] += (fact.durasi_terpasang_hari or 0.0)
        durations.append(fact.durasi_terpasang_hari or 0.0)

    # Format list for chart representation
    chart_series = []
    for k, v in aggregated.items():
        v["avg_duration"] = round(v["total_duration"] / v["total_movements"], 1) if v["total_movements"] > 0 else 0.0
        chart_series.append(v)

    return {
        "granularity": granularity,
        "filters": {
            "year": year,
            "location_id": location_id,
            "module_type": module_type,
            "jenis_perubahan": jenis_perubahan
        },
        "total_records": len(results),
        "breakdown_jenis": breakdown_jenis,
        "avg_duration_days": round(sum(durations) / len(durations), 1) if durations else 0.0,
        "series": chart_series
    }


def olap_query_requests(year=None, status=None, jenis_perubahan=None):
    """
    Operasi OLAP untuk Data Mart 2 (Request & SLA Fulfillment):
    - Analisis performa persetujuan modul, rasio penerimaan, dan lead time pemrosesan.
    """
    query = db.session.query(
        FactRequestFulfillment,
        DimDate
    ).join(DimDate, FactRequestFulfillment.request_date_key == DimDate.date_key)

    if year:
        query = query.filter(DimDate.year == int(year))
    if status and status != "all":
        query = query.filter(FactRequestFulfillment.status == status)
    if jenis_perubahan and jenis_perubahan != "all":
        query = query.filter(FactRequestFulfillment.jenis_perubahan == jenis_perubahan.lower())

    results = query.all()

    status_counts = {}
    monthly_trend = {}
    lead_times = []

    for fact, d_date in results:
        st = fact.status or "UNKNOWN"
        status_counts[st] = status_counts.get(st, 0) + 1

        month_key = f"{d_date.month_name[:3]} {d_date.year}"
        if month_key not in monthly_trend:
            monthly_trend[month_key] = {"period": month_key, "total": 0, "approved": 0, "rejected": 0, "pending": 0}

        monthly_trend[month_key]["total"] += 1
        if fact.is_approved == 1:
            monthly_trend[month_key]["approved"] += 1
        elif st == "REJECTED":
            monthly_trend[month_key]["rejected"] += 1
        else:
            monthly_trend[month_key]["pending"] += 1

        if fact.lead_time_jam and fact.lead_time_jam > 0:
            lead_times.append(fact.lead_time_jam)

    return {
        "total_requests": len(results),
        "status_breakdown": status_counts,
        "avg_lead_time_hours": round(sum(lead_times) / len(lead_times), 1) if lead_times else 0.0,
        "monthly_trend": list(monthly_trend.values())
    }


def olap_pivot_table():
    """
    Operasi OLAP: Pivot Table (Cross-Tabulation).
    Menampilkan matriks 2D: Baris (Tipe Modul) x Kolom (Tipe Perangkat).
    """
    movements = db.session.query(
        DimModule.tipe_modul,
        DimDevice.tipe_perangkat,
        func.count(FactModuleMovement.fact_movement_id).label("total")
    ).join(DimModule, FactModuleMovement.module_key == DimModule.module_key)\
     .outerjoin(DimDevice, FactModuleMovement.to_device_key == DimDevice.device_key)\
     .group_by(DimModule.tipe_modul, DimDevice.tipe_perangkat)\
     .all()

    # Extract distinct columns and rows
    row_headers = sorted(list(set(m[0] or "Umum" for m in movements)))
    col_headers = sorted(list(set(m[1] or "Standar" for m in movements)))

    matrix = {r: {c: 0 for c in col_headers} for r in row_headers}
    for m in movements:
        r = m[0] or "Umum"
        c = m[1] or "Standar"
        matrix[r][c] = m[2]

    # Format into table rows
    pivot_rows = []
    for r in row_headers:
        row_data = {"module_type": r}
        total_row = 0
        for c in col_headers:
            val = matrix[r][c]
            row_data[c] = val
            total_row += val
        row_data["_total"] = total_row
        pivot_rows.append(row_data)

    return {
        "column_headers": col_headers,
        "rows": pivot_rows
    }
