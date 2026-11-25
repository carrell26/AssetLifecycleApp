from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db


class User(db.Model, UserMixin):
    __tablename__ = "user"

    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True)
    password = db.Column(db.String(255))
    role = db.Column(db.String(20), nullable=False)  # 'admin' / 'karyawan_tif' / 'teknisi'
    district = db.Column(db.String(100))
    status = db.Column(db.String(20), default="aktif")  # 'aktif' / 'pending'
    avatar_path = db.Column(db.String(255), nullable=True)  # path relatif ke static/avatars/

    # 2FA Telegram OTP & Freeze Policy
    telegram_chat_id = db.Column(db.String(50), nullable=True)
    telegram_username = db.Column(db.String(100), nullable=True)
    otp_code = db.Column(db.String(10), nullable=True)
    otp_expires_at = db.Column(db.DateTime, nullable=True)
    otp_failed_attempts = db.Column(db.Integer, default=0)
    otp_locked_until = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    def set_password(self, raw_password):
        self.password = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password, raw_password)

    def get_id(self):
        # Diperlukan Flask-Login: primary key kita bernama user_id, bukan id
        return str(self.user_id)

    def get_avatar_url(self):
        """Return URL avatar, fallback ke None jika belum ada."""
        if self.avatar_path:
            return f"/static/avatars/{self.avatar_path}"
        return None

    @property
    def avatar_url(self):
        """Property avatar_url agar kompatibel diakses langsung di template Jinja."""
        return self.get_avatar_url()