"""
Utility untuk Verifikasi Keamanan 2FA via Telegram Bot OTP dan notifikasi keamanan.
Mendukung pengiriman OTP 6-digit dengan batas kedaluwarsa 60 detik (1 menit).
"""
from datetime import datetime, timedelta
import json
import logging
import os
import random
import urllib.parse
import urllib.request

logger = logging.getLogger(__name__)

# Token Bot Telegram diambil dari environment variable (jangan hardcoded)
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
OTP_EXPIRY_SECONDS = 60  # Tepat 1 menit


def _get_bot_token():
    """Mengambil token bot Telegram dari environment variable atau modul konfigurasi."""
    return (os.environ.get("TELEGRAM_BOT_TOKEN") or TELEGRAM_BOT_TOKEN or "").strip()


def is_telegram_configured():
    """Mengembalikan True apabila TELEGRAM_BOT_TOKEN telah disetel."""
    return bool(_get_bot_token())


def generate_otp_code(length=6):
    """Menghasilkan kode OTP acak numerik 6 digit."""
    return "".join(str(random.randint(0, 9)) for _ in range(length))


def send_telegram_message(chat_id, text):
    """Mengirim pesan teks ke pengguna Telegram via Bot API.

    Mengembalikan tuple (success: bool, message: str) agar kompatibel
    dengan seluruh pemanggil di modul autentikasi.
    """
    token = _get_bot_token()
    if not chat_id or not token:
        logger.warning("TELEGRAM_BOT_TOKEN atau chat_id tidak disetel. Pesan Telegram tidak terkirim.")
        return False, "Chat ID atau Token Bot Telegram tidak tersedia."

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": str(chat_id),
        "text": text,
        "parse_mode": "Markdown",
    }

    try:
        data = urllib.parse.urlencode(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if res_data.get("ok"):
                return True, "Pesan berhasil dikirim"
            return False, res_data.get("description", "Gagal mengirim pesan Telegram")
    except Exception as e:
        logger.exception("Gagal menghubungi Telegram Bot API: %s", e)
        return False, str(e)


def sync_telegram_user_info(user):
    """
    Jika telegram_username belum ada di DB tapi user memiliki telegram_chat_id,
    panggil getChat untuk menyinkronkan username atau nama Telegram secara otomatis.
    """
    token = _get_bot_token()
    if not token or not user or not user.telegram_chat_id or user.telegram_username:
        return
    try:
        url = f"https://api.telegram.org/bot{token}/getChat?chat_id={user.telegram_chat_id}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=4) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if res_data.get("ok"):
                result = res_data.get("result", {})
                username = result.get("username")
                if username:
                    user.telegram_username = username.lstrip("@")
                elif result.get("first_name"):
                    full = f"{result.get('first_name', '')} {result.get('last_name', '')}".strip()
                    user.telegram_username = full
    except Exception as e:
        logger.warning("Gagal menyinkronkan data Telegram user via getChat: %s", e)


def send_otp_to_user(user):
    """
    Menghasilkan OTP baru 6-digit, menyimpannya ke objek user dengan kedaluwarsa 60 detik,
    dan mengirimkannya langsung ke Telegram akun bersangkutan.

    Mengembalikan tuple (success: bool, otp_or_error: str).
    """
    if not user or not getattr(user, "telegram_chat_id", None):
        return False, "Akun ini belum menautkan Telegram ID."

    # Sinkronkan username telegram jika belum ada di database
    if not getattr(user, "telegram_username", None):
        sync_telegram_user_info(user)

    otp = generate_otp_code(6)
    expires_at = datetime.utcnow() + timedelta(seconds=OTP_EXPIRY_SECONDS)

    user.otp_code = otp
    user.otp_expires_at = expires_at
    if hasattr(user, "otp_failed_attempts"):
        user.otp_failed_attempts = 0

    display_name = user.name or "Pengguna"
    pesan = (
        f"🔐 *KODE VERIFIKASI KEAMANAN (OTP)*\n"
        f"Sistem AssetLifecycle Telkom\n\n"
        f"Halo *{display_name}*,\n"
        f"Gunakan kode verifikasi berikut untuk menyelesaikan proses login Anda:\n\n"
        f"👉 *`{otp}`* 👈\n\n"
        f"⏱ *Masa Berlaku:* 60 detik (1 menit)\n"
        f"⚠️ *Peringatan Keamanan:* Jangan membagikan kode rahasia ini kepada siapa pun, "
        f"termasuk pihak yang mengaku staf Telkom."
    )

    success, msg = send_telegram_message(user.telegram_chat_id, pesan)
    return success, otp if success else msg
