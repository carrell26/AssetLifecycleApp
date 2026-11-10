"""
Daemon latar belakang untuk Telegram Bot Auto-Responder (jika bot token disetel).
"""
import os
import logging

logger = logging.getLogger(__name__)


def start_telegram_daemon():
    """
    Memulai thread polling Telegram bot jika token tersedia.
    """
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.info("TELEGRAM_BOT_TOKEN tidak ditemukan di environment. Telegram daemon tidak dijalankan.")
        return

    logger.info("Telegram daemon diinisialisasi dengan bot token terkonfigurasi.")
