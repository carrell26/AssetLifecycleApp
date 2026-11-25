"""
Telegram Bot Auto-Responder Daemon.
Berjalan otomatis sebagai background thread di Flask application.
Secara otomatis membalas setiap pesan /start atau chat yang masuk ke @asset_telkom_otp_bot
secara real-time dengan memberikan nomor Chat ID unik pengguna.
"""
import time
import threading
import html
import urllib.request
import urllib.parse
import json

TELEGRAM_BOT_TOKEN = "9163519875:AAFic1fh5oYstTFc5cdPVCcG0c1ZVNo8yU8"
_daemon_started = False
_lock = threading.Lock()


def _telegram_worker():
    print("[Telegram Bot Daemon] Service started listening for updates...")
    offset = 0

    while True:
        try:
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates?offset={offset}&timeout=15"
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

                    send_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
                    payload = {
                        "chat_id": str(chat_id),
                        "text": reply_html,
                        "parse_mode": "HTML",
                    }
                    data = urllib.parse.urlencode(payload).encode("utf-8")
                    send_req = urllib.request.Request(send_url, data=data, method="POST")
                    try:
                        with urllib.request.urlopen(send_req, timeout=10) as s_res:
                            print(f"[Telegram Bot Daemon] Replied to {full_name} ({chat_id}) successfully.")
                    except Exception as err:
                        print(f"[Telegram Bot Daemon] Error sending to {chat_id}: {err}")
        except Exception as e:
            # Jika timeout getUpdates atau koneksi sejenak terputus
            time.sleep(2)


def start_telegram_daemon():
    """Memulai worker thread background Telegram daemon sekali saja."""
    global _daemon_started
    with _lock:
        if not _daemon_started:
            t = threading.Thread(target=_telegram_worker, daemon=True, name="TelegramBotDaemon")
            t.start()
            _daemon_started = True
            print("[Telegram Bot Daemon] Thread spawned successfully.")
