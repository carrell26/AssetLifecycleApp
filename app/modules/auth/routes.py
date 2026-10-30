"""
Modul Auth -- FR-1 (Manajemen User & Autentikasi).

Rute yang tersedia:
  GET/POST /auth/login              -> login semua role
  GET      /auth/logout             -> logout
  GET/POST /auth/register           -> self-registration Teknisi (FR-1.2), status jadi 'pending'
  GET/POST /auth/register-teknisi   -> Karyawan TIF daftarkan Teknisi baru (FR-1.4), langsung 'aktif'
  GET/POST /auth/admin/register-karyawan  -> Admin daftarkan Karyawan TIF (FR-1.3)
  GET      /auth/admin/users        -> Admin lihat & kelola semua user (approve pending)
  POST     /auth/admin/users/<id>/approve  -> Admin approve akun Teknisi yang masih pending
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user

from ...extensions import db
from ...models import User
from ...utils.decorators import role_required

auth_bp = Blueprint("auth", __name__, url_prefix="/auth", template_folder="../../templates/auth")


@auth_bp.route("/login", methods=["GET"])
def login():
    """Serve React SPA untuk halaman login."""
    if current_user.is_authenticated:
        return redirect(url_for("index"))
    return render_template("react_index.html")


@auth_bp.route("/admin-contact-api", methods=["GET"])
def admin_contact_api():
    """Mengembalikan data kontak admin resmi sistem untuk modal bantuan login."""
    admin = User.query.filter_by(role="admin", status="aktif").first()
    if not admin:
        admin = User.query.filter_by(role="admin").first()

    return jsonify(
        success=True,
        admin={
            "name": admin.name if admin else "Admin Asset",
            "email": admin.email if admin else "adminasset@gmail.com",
            "role": "Administrator Sistem",
        }
    )



@auth_bp.route("/login-api", methods=["POST"], endpoint="api_login")
def api_login():
    """API endpoint JSON untuk proses login dari React.
    Dipanggil sebagai: POST /auth/login-api
    Di-proxy React sebagai: POST /api/auth/login  (lihat vite.config.js)
    """
    data = request.get_json(force=True) or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()

    if user is None or not user.check_password(password):
        return jsonify(success=False, message="Email atau password salah."), 401

    if user.status != "aktif":
        return jsonify(success=False, message="Akun kamu masih menunggu persetujuan Admin."), 403

    login_user(user, remember=data.get("remember", False))
    user_dict = {
        "id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "district": user.district,
        "avatar_url": user.avatar_url or "",
    }
    return jsonify(success=True, redirect="/", user=user_dict)



@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Kamu sudah keluar.", "success")
    return redirect(url_for("auth.login"))


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    """Halaman register mandiri telah dinonaktifkan. Pembuatan akun dilakukan oleh Admin."""
    if current_user.is_authenticated:
        return redirect(url_for("index"))
    flash("Pendaftaran akun mandiri telah dinonaktifkan. Pembuatan akun hanya dapat dilakukan oleh Admin.", "info")
    return redirect(url_for("auth.login"))


@auth_bp.route("/register-api", methods=["POST"], endpoint="api_register")
def api_register():
    """API self-registration dinonaktifkan."""
    return jsonify({
        "success": False,
        "error": "Pendaftaran akun mandiri telah dinonaktifkan. Pembuatan akun hanya dapat dilakukan oleh Admin melalui menu Kelola User."
    }), 403


@auth_bp.route("/register-teknisi", methods=["GET", "POST"])
@login_required
@role_required("karyawan_tif")
def register_teknisi():
    """Karyawan TIF daftarkan Teknisi baru dalam district yang sama (FR-1.4). Langsung aktif."""
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")

        if not name or not email or not password:
            flash("Semua kolom wajib diisi.", "error")
            return render_template("auth/register_teknisi.html")

        if User.query.filter_by(email=email).first():
            flash("Email sudah terdaftar.", "error")
            return render_template("auth/register_teknisi.html")

        user = User(
            name=name,
            email=email,
            role="teknisi",
            district=current_user.district,  # otomatis samakan district dengan Karyawan TIF yang mendaftarkan
            status="aktif",
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        flash(f"Teknisi {name} berhasil didaftarkan untuk district {current_user.district}.", "success")
        return redirect(url_for("auth.register_teknisi"))

    return render_template("auth/register_teknisi.html")


@auth_bp.route("/admin/register-karyawan", methods=["GET", "POST"])
@login_required
@role_required("admin")
def register_karyawan():
    """Menu Daftarkan Karyawan telah disatukan ke dalam menu Kelola User."""
    return redirect(url_for("auth.manage_users"))


@auth_bp.route("/admin/users")
@login_required
@role_required("admin")
def manage_users():
    """Admin lihat semua user dan kelola akun via React SPA."""
    if request.args.get("legacy") == "true":
        users = User.query.order_by(User.created_at.desc()).all()
        return render_template("auth/manage_users.html", users=users)
    return render_template("react_index.html")


@auth_bp.route("/admin/users/<int:user_id>/approve", methods=["POST"])
@login_required
@role_required("admin")
def approve_user(user_id):
    user = User.query.get_or_404(user_id)
    user.status = "aktif"
    db.session.commit()
    flash(f"Akun {user.name} sudah diaktifkan.", "success")
    return redirect(url_for("auth.manage_users"))