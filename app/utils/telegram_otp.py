"""
Utility untuk Verifikasi Keamanan 2FA via Telegram Bot OTP.
Mendukung pengiriman OTP 6-digit dengan batas kedaluwarsa 60 detik (1 menit).
"""
import random
import urllib.request
import urllib.parse
import json
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Token Bot Telegram Resmi AssetLifecycle Telkom Security
TELEGRAM_BOT_TOKEN = "9163519875:AAFic1fh5oYstTFc5cdPVCcG0c1ZVNo8yU8"
OTP_EXPIRY_SECONDS = 60  # Tepat 1 menit sesuai instruksi


def generate_otp_code(length=6):
    """Menghasilkan kode OTP acak numerik 6 digit."""
    return "".join(str(random.randint(0, 9)) for _ in range(length))


def send_telegram_message(chat_id, text):
    """Mengirim pesan teks ke pengguna Telegram via Bot API."""
    if not chat_id or not TELEGRAM_BOT_TOKEN:
        logger.error("Chat ID atau Token Bot Telegram tidak tersedia.")
        return False, "Chat ID atau Token tidak valid"

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
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
    if not user or not user.telegram_chat_id or user.telegram_username:
        return
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getChat?chat_id={user.telegram_chat_id}"
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
    Menghasilkan OTP baru, menyimpannya ke database user dengan kedaluwarsa 60 detik,
    dan mengirimkannya langsung ke Telegram akun bersangkutan.
    """
    if not user.telegram_chat_id:
        return False, "Akun ini belum menautkan Telegram ID."

    # Sinkronkan username telegram jika belum ada di database
    if not user.telegram_username:
        sync_telegram_user_info(user)

    otp = generate_otp_code(6)
    expires_at = datetime.utcnow() + timedelta(seconds=OTP_EXPIRY_SECONDS)

    user.otp_code = otp
    user.otp_expires_at = expires_at

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

