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
from datetime import datetime, timedelta
import logging
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, make_response
from flask_login import login_user, logout_user, login_required, current_user

from ...extensions import db
from ...models import User
from ...utils.decorators import role_required
from ...utils.telegram_otp import send_otp_to_user, send_telegram_message

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/auth", template_folder="../../templates/auth")


@auth_bp.route("/login", methods=["GET"])
def login():
    """Serve React SPA untuk halaman login."""
    if current_user.is_authenticated:
        return redirect(url_for("index"))
    response = make_response(render_template("react_index.html"))
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


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

    # Cek apakah user sedang dalam masa freeze 5 menit karena salah OTP 3 kali
    now = datetime.utcnow()
    if user.otp_locked_until:
        if user.otp_locked_until > now:
            remaining_seconds = int((user.otp_locked_until - now).total_seconds())
            remaining_minutes = max(1, (remaining_seconds // 60) + 1)
            return jsonify(
                success=False,
                frozen=True,
                remaining_seconds=remaining_seconds,
                message=f"Anda telah salah memasukkan token sebanyak 3 kali. Silakan coba lagi dalam {remaining_minutes} menit."
            ), 429
        else:
            # Masa freeze telah berakhir, reset otomatis
            user.otp_locked_until = None
            user.otp_failed_attempts = 0
            db.session.commit()

    # Cek apakah user memiliki integrasi Telegram 2FA (wajib untuk Admin / user dengan telegram_chat_id)
    if user.telegram_chat_id:
        success, otp_res = send_otp_to_user(user)
        if success:
            db.session.commit()
            telegram_display = f"@{user.telegram_username}" if user.telegram_username else "Telegram Terdaftar"
            return jsonify(
                success=True,
                requires_otp=True,
                email=user.email,
                telegram_display=telegram_display,
                expires_in=60,
                message="Kode verifikasi OTP 6-digit telah dikirimkan ke Telegram Anda."
            )
        else:
            return jsonify(
                success=False,
                message=f"Gagal mengirimkan kode OTP ke Telegram ({otp_res}). Pastikan bot Telegram aktif."
            ), 500

    # Fallback untuk user tanpa Telegram 2FA
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


@auth_bp.route("/verify-otp-api", methods=["POST"], endpoint="api_verify_otp")
def api_verify_otp():
    """Memverifikasi kode OTP 6-digit dari input login React.
    Jika salah 3 kali, akun akan dibekukan / freeze selama 5 menit.
    """
    data = request.get_json(force=True) or {}
    email = data.get("email", "").strip()
    otp_input = str(data.get("otp", "")).strip()
    remember = data.get("remember", False)

    if not email or not otp_input:
        return jsonify(success=False, message="Email dan kode OTP wajib diisi."), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify(success=False, message="Pengguna tidak ditemukan."), 404

    now = datetime.utcnow()

    # 1. Cek apakah user sedang dalam masa freeze 5 menit
    if user.otp_locked_until:
        if user.otp_locked_until > now:
            remaining_seconds = int((user.otp_locked_until - now).total_seconds())
            remaining_minutes = max(1, (remaining_seconds // 60) + 1)
            return jsonify(
                success=False,
                frozen=True,
                remaining_seconds=remaining_seconds,
                attempts_left=0,
                message=f"Anda telah salah memasukkan token sebanyak 3 kali. Silakan coba lagi dalam {remaining_minutes} menit."
            ), 429
        else:
            # Masa freeze telah berakhir, reset otomatis
            user.otp_locked_until = None
            user.otp_failed_attempts = 0
            db.session.commit()

    if not user.otp_code or not user.otp_expires_at:
        return jsonify(success=False, message="Tidak ada permintaan OTP aktif. Silakan minta kode baru."), 400

    # 2. Cek kedaluwarsa (60 detik)
    if now > user.otp_expires_at:
        return jsonify(
            success=False,
            expired=True,
            message="Kode OTP telah kedaluwarsa (melebihi 60 detik). Silakan klik Kirim Ulang."
        ), 400

    # 3. Cek kecocokan OTP
    if user.otp_code.strip() != otp_input:
        current_attempts = (user.otp_failed_attempts or 0) + 1
        user.otp_failed_attempts = current_attempts

        if current_attempts >= 3:
            # FREEZE 5 MENIT!
            freeze_duration = timedelta(minutes=5)
            user.otp_locked_until = now + freeze_duration
            user.otp_code = None  # Invalidate OTP saat ini
            user.otp_expires_at = None
            db.session.commit()

            # Kirim notifikasi keamanan langsung ke Telegram user
            if user.telegram_chat_id:
                pesan_freeze = (
                    f"🚨 *PERINGATAN KEAMANAN SISTEM*\n"
                    f"Sistem AssetLifecycle Telkom\n\n"
                    f"Halo *{user.name or 'Pengguna'}*,\n"
                    f"Anda telah salah memasukkan token sebanyak 3 kali.\n\n"
                    f"⏱ Silakan coba lagi setelah 5 menit.\n"
                    f"Jika ini bukan aktivitas Anda, segera amankan kredensial akun Anda."
                )
                try:
                    send_telegram_message(user.telegram_chat_id, pesan_freeze)
                except Exception as e:
                    logger.warning("Gagal mengirim Telegram freeze notification: %s", e)

            return jsonify(
                success=False,
                frozen=True,
                remaining_seconds=5 * 60,
                attempts_left=0,
                message="Anda telah salah memasukkan token sebanyak 3 kali. Silakan coba lagi setelah 5 menit."
            ), 429
        else:
            db.session.commit()
            attempts_left = 3 - current_attempts
            return jsonify(
                success=False,
                frozen=False,
                attempts_left=attempts_left,
                message=f"Kode OTP salah! Sisa percobaan: {attempts_left} kali lagi sebelum akun dibekukan 5 menit."
            ), 400

    # 4. OTP Valid: bersihkan kode OTP, reset failed attempts & freeze lock, login user
    user.otp_code = None
    user.otp_expires_at = None
    user.otp_failed_attempts = 0
    user.otp_locked_until = None
    db.session.commit()

    login_user(user, remember=remember)
    user_dict = {
        "id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "district": user.district,
        "avatar_url": user.avatar_url or "",
    }
    return jsonify(success=True, redirect="/", user=user_dict)


@auth_bp.route("/resend-otp-api", methods=["POST"], endpoint="api_resend_otp")
def api_resend_otp():
    """Mengirim ulang kode OTP baru ke Telegram jika kode sebelumnya kedaluwarsa."""
    data = request.get_json(force=True) or {}
    email = data.get("email", "").strip()

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify(success=False, message="Pengguna tidak ditemukan."), 404

    now = datetime.utcnow()
    # Cek apakah akun sedang freeze
    if user.otp_locked_until:
        if user.otp_locked_until > now:
            remaining_seconds = int((user.otp_locked_until - now).total_seconds())
            remaining_minutes = max(1, (remaining_seconds // 60) + 1)
            return jsonify(
                success=False,
                frozen=True,
                remaining_seconds=remaining_seconds,
                message=f"Anda telah salah memasukkan token sebanyak 3 kali. Silakan coba lagi dalam {remaining_minutes} menit."
            ), 429
        else:
            # Masa freeze telah berakhir, reset otomatis
            user.otp_locked_until = None
            user.otp_failed_attempts = 0
            db.session.commit()

    if not user.telegram_chat_id:
        return jsonify(success=False, message="Pengguna belum menautkan Telegram."), 400

    success, otp_res = send_otp_to_user(user)
    if success:
        db.session.commit()
        return jsonify(
            success=True,
            expires_in=60,
            message="Kode OTP baru 6-digit berhasil dikirimkan ke Telegram Anda."
        )
    return jsonify(success=False, message=f"Gagal mengirim ulang OTP: {otp_res}"), 500



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