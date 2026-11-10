"""
Utility untuk integrasi 2FA Telegram OTP dan notifikasi keamanan.
"""
import os
import random
import logging
import urllib.request
import urllib.parse
import json
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")


def send_telegram_message(chat_id, text):
    """
    Mengirimkan pesan teks ke Telegram Chat ID menggunakan Telegram Bot API.
    """
    token = os.environ.get("TELEGRAM_BOT_TOKEN", TELEGRAM_BOT_TOKEN)
    if not token or not chat_id:
        logger.warning("Telegram Bot Token atau chat_id tidak disetel. Pesan tidak terkirim: %s", text[:50])
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({
        "chat_id": str(chat_id),
        "text": text,
        "parse_mode": "Markdown"
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status == 200
    except Exception as e:
        logger.error("Gagal mengirim pesan Telegram ke %s: %s", chat_id, e)
        raise e


def send_otp_to_user(user):
    """
    Menghasilkan kode OTP 6-digit, menyimpannya di objek user dengan masa berlaku 60 detik,
    dan mengirimkannya ke Telegram user.
    """
    otp_code = f"{random.randint(100000, 999999)}"
    now = datetime.utcnow()

    # Set kode OTP di user
    if hasattr(user, "otp_code"):
        user.otp_code = otp_code
    if hasattr(user, "otp_expires_at"):
        user.otp_expires_at = now + timedelta(seconds=60)
    if hasattr(user, "otp_failed_attempts"):
        user.otp_failed_attempts = 0

    chat_id = getattr(user, "telegram_chat_id", None)
    if not chat_id:
        return False, "User belum memiliki Telegram Chat ID terdaftar"

    message = (
        f"🔐 *KODE VERIFIKASI LOGIN (OTP)*\n"
        f"Sistem AssetLifecycle Telkom\n\n"
        f"Kode verifikasi Anda adalah: `{otp_code}`\n\n"
        f"⏱ Kode ini berlaku selama *60 detik*.\n"
        f"⚠️ *JANGAN BAGIKAN* kode ini kepada siapa pun demi keamanan aset."
    )

    try:
        send_telegram_message(chat_id, message)
        return True, "OTP berhasil dikirim"
    except Exception as e:
        return False, str(e)
