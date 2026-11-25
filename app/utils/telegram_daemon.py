"""
Telegram Bot Auto-Responder Daemon.
Berjalan otomatis sebagai background thread di aplikasi Flask apabila
TELEGRAM_BOT_TOKEN tersedia di environment variable.
Secara otomatis membalas setiap pesan /start atau chat yang masuk ke bot
secara real-time dengan memberikan nomor Chat ID unik pengguna.
"""
import html
import json
import logging
import os
import threading
import time
import urllib.parse
import urllib.request

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
_daemon_started = False
_lock = threading.Lock()


def _get_bot_token():
    """Mengambil token bot Telegram dari environment variable atau modul konfigurasi."""
    return (os.environ.get("TELEGRAM_BOT_TOKEN") or TELEGRAM_BOT_TOKEN or "").strip()


def _telegram_worker(token):
    logger.info("[Telegram Bot Daemon] Service started listening for updates...")
    offset = 0

    while True:
        try:
            url = f"https://api.telegram.org/bot{token}/getUpdates?offset={offset}&timeout=15"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=20) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                if not res_data.get("ok"):
                    time.sleep(2)
                    continue

                updates = res_data.get("result", [])
                for update in updates:
                    update_id = update.get("update_id", 0)
                    offset = max(offset, update_id + 1)

                    message = update.get("message")
                    if not message:
                        continue

                    chat = message.get("chat", {})
                    chat_id = chat.get("id")
                    if not chat_id:
                        continue

                    from_user = message.get("from", {})
                    first_name = from_user.get("first_name", "Pengguna")
                    last_name = from_user.get("last_name", "")
                    full_name = html.escape(f"{first_name} {last_name}".strip())

                    # Balasan otomatis dalam format HTML (kebal error parsing karakter khusus)
                    reply_html = (
                        f"Halo <b>{full_name}</b>! 👋\n\n"
                        f"Selamat datang di bot verifikasi resmi <b>AssetLifecycle Telkom Security</b>.\n\n"
                        f"🔑 <b>ID Telegram Anda:</b>\n"
                        f"👉 <code>{chat_id}</code> 👈 <i>(ketuk angka untuk menyalin)</i>\n\n"
                        f"Silakan berikan nomor ID Telegram di atas kepada <b>Admin Sistem</b> "
                        f"agar akun Anda terhubung dengan verifikasi keamanan <b>OTP 2FA (60 Detik)</b> saat login. 🛡️\n\n"
                        f"<i>Pesan ini dikirim otomatis oleh sistem Asset Lifecycle Telkom.</i>"
                    )

                    send_url = f"https://api.telegram.org/bot{token}/sendMessage"
                    payload = {
                        "chat_id": str(chat_id),
                        "text": reply_html,
                        "parse_mode": "HTML",
                    }
                    data = urllib.parse.urlencode(payload).encode("utf-8")
                    send_req = urllib.request.Request(send_url, data=data, method="POST")
                    try:
                        with urllib.request.urlopen(send_req, timeout=10):
                            logger.info("[Telegram Bot Daemon] Replied to %s (%s) successfully.", full_name, chat_id)
                    except Exception as err:
                        logger.warning("[Telegram Bot Daemon] Error sending to %s: %s", chat_id, err)
        except Exception as err:
            # Jika timeout getUpdates, gangguan jaringan, atau error API sementara, jangan hentikan Flask
            logger.debug("[Telegram Bot Daemon] Polling error (retrying): %s", err)
            time.sleep(5)


def start_telegram_daemon():
    """Memulai thread polling Telegram bot sekali saja apabila TELEGRAM_BOT_TOKEN tersedia."""
    global _daemon_started
    token = _get_bot_token()
    if not token:
        logger.info("TELEGRAM_BOT_TOKEN tidak ditemukan di environment. Telegram daemon tidak dijalankan.")
        return

    with _lock:
        if not _daemon_started:
            t = threading.Thread(
                target=_telegram_worker,
                args=(token,),
                daemon=True,
                name="TelegramBotDaemon",
            )
            t.start()
            _daemon_started = True
            logger.info("[Telegram Bot Daemon] Thread spawned successfully.")
