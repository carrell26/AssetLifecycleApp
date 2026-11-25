"""
Modul Audit -- FR-6.2 (audit_logs generik) dan FR-6.3 (verifikasi integritas).

Rute yang tersedia:
  GET /audit/         -> daftar seluruh audit_logs (hash chain), terbaru duluan
  GET /audit/verify    -> hitung ulang seluruh chain, tampilkan hasil valid/rusak
"""
import os
from flask import Blueprint, render_template, flash, redirect, url_for, request, current_app
from flask_login import login_required, current_user

from ...models import AuditLog
from ...utils.decorators import role_required
from ...utils.hashing import verify_chain

audit_bp = Blueprint("audit", __name__, url_prefix="/audit", template_folder="../../templates/audit")


@audit_bp.route("/")
@login_required
@role_required("admin", "karyawan_tif")
def logs():
    react_template_path = os.path.join(current_app.root_path, "templates", "react_index.html")
    if os.path.exists(react_template_path) and not request.args.get("legacy"):
        return render_template("react_index.html", current_user=current_user)

    entries = AuditLog.query.order_by(AuditLog.audit_id.desc()).all()
    return render_template("audit/logs.html", entries=entries)


@audit_bp.route("/verify")
@login_required
@role_required("admin", "karyawan_tif")
def verify():
    is_valid, broken_at = verify_chain()
    if is_valid:
        flash("Integritas hash chain terverifikasi VALID -- tidak ada data yang dimanipulasi.", "success")
    else:
        flash(
            f"PERINGATAN: hash chain RUSAK, mulai terdeteksi di audit_id #{broken_at}. "
            f"Kemungkinan ada data yang diubah secara tidak sah.",
            "error",
        )
    return redirect(url_for("audit.logs"))