"""
Modul AR (versi web) -- FR-12 (Desain AR/VR, Fase 2).

Alur: tiap Device punya QR code yang mengarah ke halaman "panduan slot".
Teknisi scan QR pakai kamera HP (browser) -> diarahkan ke halaman yang
menampilkan peta slot device itu, warna-warna: slot terisi (merah, ada
modul aktif) vs slot kosong (hijau, tersedia dipasangi modul).

CATATAN: ini pendekatan web-based, BUKAN Unity/Unreal Engine seperti yang
diminta literal di RPS Sub-CPMK 5 -- dibangun sambil menunggu konfirmasi
dosen apakah versi web ini bisa diterima untuk rekognisi MK AR/VR.
"""
import os
from io import BytesIO

import qrcode
from flask import Blueprint, render_template, url_for, send_file, request, jsonify, current_app
from flask_login import login_required, current_user

from ...models import Device, SlotDefinition, ModulePosition, Module, Location
from ...utils.decorators import role_required

ar_bp = Blueprint("ar", __name__, url_prefix="/ar", template_folder="../../templates/ar")


@ar_bp.route("/")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def index():
    react_template_path = os.path.join(current_app.root_path, "templates", "react_index.html")
    if os.path.exists(react_template_path):
        return render_template("react_index.html", current_user=current_user)

    devices = Device.query.order_by(Device.nama_perangkat).all()
    return render_template("ar/index.html", devices=devices)


@ar_bp.route("/scan")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def scan():
    react_template_path = os.path.join(current_app.root_path, "templates", "react_index.html")
    if os.path.exists(react_template_path):
        return render_template("react_index.html", current_user=current_user)

    return render_template("ar/scan.html")


@ar_bp.route("/api/devices")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def api_devices():
    devices = Device.query.order_by(Device.nama_perangkat).all()
    devices_data = []
    for d in devices:
        total_slots = SlotDefinition.query.filter_by(device_type_id=d.device_type_id).count()
        devices_data.append({
            "device_id": d.device_id,
            "nama_perangkat": d.nama_perangkat,
            "hostname": d.hostname or "-",
            "serial_number": d.serial_number or "-",
            "tipe": d.device_type.nama_tipe if d.device_type else "-",
            "lokasi": d.location.nama_lokasi if d.location else "-",
            "total_slot": total_slots
        })
    return jsonify({"devices": devices_data})


@ar_bp.route("/api/lookup-module")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def api_lookup_module():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"found": False, "message": "Kata kunci pencarian tidak boleh kosong."}), 400

    module = Module.query.filter(Module.serial_number.ilike(q)).first()
    if not module:
        module = Module.query.filter(Module.serial_number.ilike(f"%{q}%")).first()

    if not module:
        return jsonify({
            "found": False,
            "reason": "not_found",
            "message": f"Modul dengan Serial Number '{q}' tidak ditemukan di sistem."
        })

    pos = ModulePosition.query.filter_by(module_id=module.modul_id, status="aktif").first()
    if not pos or not pos.device:
        return jsonify({
            "found": True,
            "installed": False,
            "module": {
                "modul_id": module.modul_id,
                "serial_number": module.serial_number,
                "tipe": module.module_type.nama_tipe if module.module_type else "-",
                "kondisi": module.kondisi
            },
            "message": f"Modul {module.serial_number} terdaftar (Kondisi: {module.kondisi}), namun sedang tidak terpasang pada perangkat manapun."
        })

    slot_def = pos.slot_definition
    return jsonify({
        "found": True,
        "installed": True,
        "module": {
            "modul_id": module.modul_id,
            "serial_number": module.serial_number,
            "tipe": module.module_type.nama_tipe if module.module_type else "-",
            "kondisi": module.kondisi
        },
        "device": {
            "device_id": pos.device.device_id,
            "nama_perangkat": pos.device.nama_perangkat,
            "lokasi": pos.device.location.nama_lokasi if pos.device.location else "-"
        },
        "slot": {
            "slot_definition_id": slot_def.slot_definition_id if slot_def else None,
            "nomor_slot": slot_def.nomor_slot if slot_def else "-",
            "nama_slot": slot_def.nama_slot if slot_def else "-"
        },
        "highlight_slot_id": slot_def.slot_definition_id if slot_def else None
    })


@ar_bp.route("/device/<int:device_id>")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def device_guide(device_id):
    device = Device.query.get_or_404(device_id)

    slot_defs = SlotDefinition.query.filter_by(device_type_id=device.device_type_id).order_by(
        SlotDefinition.nomor_slot
    ).all()

    slot_rows = []
    for slot_def in slot_defs:
        position = ModulePosition.query.filter_by(
            device_id=device.device_id, slot_definition_id=slot_def.slot_definition_id, status="aktif"
        ).first()
        slot_rows.append({
            "slot_def": slot_def,
            "occupied": position is not None,
            "module": position.module if position else None,
        })

    return render_template("ar/device_guide.html", device=device, slot_rows=slot_rows)


@ar_bp.route("/device/<int:device_id>/qr.png")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def device_qr(device_id):
    Device.query.get_or_404(device_id)

    # QR sekarang mengarahkan langsung ke halaman scan dengan device context
    target_url = url_for("ar.scan", device_id=device_id, _external=True)
    img = qrcode.make(target_url)

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return send_file(buffer, mimetype="image/png")


@ar_bp.route("/api/device/<int:device_id>")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def api_device(device_id):
    device = Device.query.get_or_404(device_id)
    total_slots = SlotDefinition.query.filter_by(device_type_id=device.device_type_id).count()
    return jsonify({
        "device_id": device.device_id,
        "nama_perangkat": device.nama_perangkat,
        "hostname": device.hostname or "-",
        "serial_number": device.serial_number or "-",
        "tipe": device.device_type.nama_tipe if device.device_type else "-",
        "lokasi": device.location.nama_lokasi if device.location else "-",
        "total_slot": total_slots
    })


@ar_bp.route("/api/device/<int:device_id>/slots")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def api_device_slots(device_id):
    device = Device.query.get_or_404(device_id)
    slot_defs = SlotDefinition.query.filter_by(device_type_id=device.device_type_id).order_by(
        SlotDefinition.nomor_slot
    ).all()

    slots_data = []
    for slot_def in slot_defs:
        position = ModulePosition.query.filter_by(
            device_id=device.device_id,
            slot_definition_id=slot_def.slot_definition_id,
            status="aktif"
        ).first()

        slots_data.append({
            "slot_definition_id": slot_def.slot_definition_id,
            "nomor_slot": slot_def.nomor_slot,
            "nama_slot": slot_def.nama_slot or f"Slot {slot_def.nomor_slot}",
            "posisi": slot_def.posisi or "-",
            "occupied": position is not None,
            "module": {
                "modul_id": position.module.modul_id,
                "serial_number": position.module.serial_number,
                "tipe": position.module.module_type.nama_tipe if position.module and position.module.module_type else "-",
                "kondisi": position.module.kondisi if position.module else "-"
            } if position and position.module else None
        })

    return jsonify({"slots": slots_data})


@ar_bp.route("/api/search")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def api_search():
    device_id = request.args.get("device_id", type=int)
    if not device_id:
        return jsonify({"found": False, "message": "Parameter device_id diperlukan."}), 400

    device = Device.query.get_or_404(device_id)
    search_type = (request.args.get("type") or "sn").strip().lower()
    q = (request.args.get("q") or "").strip()

    if not q:
        return jsonify({"found": False, "message": "Kata kunci pencarian tidak boleh kosong."}), 400

    if search_type == "sn":
        # 1. Cari modul berdasarkan serial number (exact atau partial)
        module = Module.query.filter(Module.serial_number.ilike(q)).first()
        if not module:
            module = Module.query.filter(Module.serial_number.ilike(f"%{q}%")).first()

        if not module:
            return jsonify({
                "found": False,
                "reason": "not_found",
                "message": f"Modul dengan Serial Number '{q}' tidak ditemukan di database."
            })

        # 2. Cek posisi aktif modul
        pos = ModulePosition.query.filter_by(module_id=module.modul_id, status="aktif").first()
        if not pos:
            return jsonify({
                "found": False,
                "reason": "not_installed",
                "message": f"Modul {module.serial_number} terdaftar di database (kondisi: {module.kondisi}), namun sedang tidak terpasang pada perangkat manapun."
            })

        # 3. Validasi apakah modul terpasang di perangkat yang dipindai
        if pos.device_id != device.device_id:
            other_dev_name = pos.device.nama_perangkat if pos.device else "Perangkat lain"
            other_loc = pos.device.location.nama_lokasi if pos.device and pos.device.location else "-"
            return jsonify({
                "found": False,
                "reason": "wrong_device",
                "message": f"Modul {module.serial_number} ditemukan, tetapi terpasang di {other_dev_name} ({other_loc}), bukan pada perangkat yang sedang Anda pindai ({device.nama_perangkat})."
            })

        slot_def = pos.slot_definition
        return jsonify({
            "found": True,
            "type": "sn",
            "module": {
                "modul_id": module.modul_id,
                "serial_number": module.serial_number,
                "tipe": module.module_type.nama_tipe if module.module_type else "-",
                "kondisi": module.kondisi
            },
            "slot": {
                "slot_definition_id": slot_def.slot_definition_id if slot_def else None,
                "nomor_slot": slot_def.nomor_slot if slot_def else "-",
                "nama_slot": slot_def.nama_slot if slot_def else (f"Slot {slot_def.nomor_slot}" if slot_def else "-"),
                "posisi": slot_def.posisi if slot_def else "-"
            },
            "device": {
                "device_id": device.device_id,
                "nama_perangkat": device.nama_perangkat,
                "lokasi": device.location.nama_lokasi if device.location else "-"
            },
            "highlight_slot_id": slot_def.slot_definition_id if slot_def else None
        })

    elif search_type == "slot":
        # Cari slot_definition berdasarkan nomor_slot untuk tipe perangkat yang dipindai
        slot_def = SlotDefinition.query.filter_by(
            device_type_id=device.device_type_id,
            nomor_slot=q
        ).first()

        # Fallback pencarian parsial jika exact match tidak ditemukan
        if not slot_def:
            slot_def = SlotDefinition.query.filter(
                SlotDefinition.device_type_id == device.device_type_id,
                (SlotDefinition.nomor_slot.ilike(q)) | (SlotDefinition.nama_slot.ilike(f"%{q}%"))
            ).first()

        if not slot_def:
            dev_type_name = device.device_type.nama_tipe if device.device_type else "perangkat ini"
            return jsonify({
                "found": False,
                "reason": "invalid_slot",
                "message": f"Slot '{q}' tidak terdaftar pada spesifikasi {device.nama_perangkat} ({dev_type_name})."
            })

        pos = ModulePosition.query.filter_by(
            device_id=device.device_id,
            slot_definition_id=slot_def.slot_definition_id,
            status="aktif"
        ).first()

        if pos and pos.module:
            return jsonify({
                "found": True,
                "type": "slot",
                "slot": {
                    "slot_definition_id": slot_def.slot_definition_id,
                    "nomor_slot": slot_def.nomor_slot,
                    "nama_slot": slot_def.nama_slot or f"Slot {slot_def.nomor_slot}",
                    "posisi": slot_def.posisi or "-",
                    "status": "TERISI"
                },
                "module": {
                    "modul_id": pos.module.modul_id,
                    "serial_number": pos.module.serial_number,
                    "tipe": pos.module.module_type.nama_tipe if pos.module.module_type else "-",
                    "kondisi": pos.module.kondisi
                },
                "device": {
                    "device_id": device.device_id,
                    "nama_perangkat": device.nama_perangkat,
                    "lokasi": device.location.nama_lokasi if device.location else "-"
                },
                "highlight_slot_id": slot_def.slot_definition_id
            })
        else:
            return jsonify({
                "found": True,
                "type": "slot",
                "slot": {
                    "slot_definition_id": slot_def.slot_definition_id,
                    "nomor_slot": slot_def.nomor_slot,
                    "nama_slot": slot_def.nama_slot or f"Slot {slot_def.nomor_slot}",
                    "posisi": slot_def.posisi or "-",
                    "status": "KOSONG"
                },
                "module": None,
                "device": {
                    "device_id": device.device_id,
                    "nama_perangkat": device.nama_perangkat,
                    "lokasi": device.location.nama_lokasi if device.location else "-"
                },
                "highlight_slot_id": slot_def.slot_definition_id
            })
    else:
        return jsonify({
            "found": False,
            "message": f"Mode pencarian '{search_type}' tidak valid. Gunakan 'sn' atau 'slot'."
        }), 400


@ar_bp.route("/api/locations")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def api_locations():
    locations = Location.query.order_by(Location.nama_lokasi).all()
    results = []
    for loc in locations:
        dev_count = len(loc.devices)
        if dev_count > 0:
            results.append({
                "location_id": loc.location_id,
                "nama_lokasi": loc.nama_lokasi,
                "district": loc.district or "-",
                "alamat": loc.alamat or "-",
                "total_devices": dev_count
            })
    return jsonify({"locations": results})


@ar_bp.route("/api/location/<int:location_id>/devices")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def api_location_devices(location_id):
    loc = Location.query.get_or_404(location_id)
    devices_data = []
    for d in loc.devices:
        total_slots = SlotDefinition.query.filter_by(device_type_id=d.device_type_id).count()
        occupied_slots = ModulePosition.query.filter_by(device_id=d.device_id, status="aktif").count()
        empty_slots = max(0, total_slots - occupied_slots)
        devices_data.append({
            "device_id": d.device_id,
            "nama_perangkat": d.nama_perangkat,
            "hostname": d.hostname or "-",
            "serial_number": d.serial_number or "-",
            "tipe": d.device_type.nama_tipe if d.device_type else "-",
            "total_slot": total_slots,
            "occupied_slots": occupied_slots,
            "empty_slots": empty_slots
        })
    return jsonify({
        "location": {
            "location_id": loc.location_id,
            "nama_lokasi": loc.nama_lokasi,
            "district": loc.district or "-",
            "alamat": loc.alamat or "-",
            "total_devices": len(devices_data)
        },
        "devices": devices_data
    })


@ar_bp.route("/location/<int:location_id>/qr.png")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def location_qr(location_id):
    loc = Location.query.get_or_404(location_id)
    target_url = url_for("ar.scan", location_id=location_id, _external=True)
    img = qrcode.make(target_url)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return send_file(buffer, mimetype="image/png")


@ar_bp.route("/api/lookup-qr")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def api_lookup_qr():
    import re
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"found": False, "message": "Query tidak boleh kosong"}), 400

    # 1. Cek parameter location_id di query string atau teks URL
    loc_match = re.search(r'(?:location_id=|loc-|lokasi[-_]?id=)(\d+)', q, re.IGNORECASE)
    if loc_match:
        loc_id = int(loc_match.group(1))
        loc = Location.query.get(loc_id)
        if loc:
            return jsonify({
                "found": True,
                "type": "location",
                "location_id": loc.location_id,
                "nama_lokasi": loc.nama_lokasi
            })

    # Cek kecocokan nama lokasi secara langsung
    loc = Location.query.filter(Location.nama_lokasi.ilike(q)).first()
    if loc and len(loc.devices) > 0:
        return jsonify({
            "found": True,
            "type": "location",
            "location_id": loc.location_id,
            "nama_lokasi": loc.nama_lokasi
        })

    # 2. Cek parameter device_id di URL
    dev_match = re.search(r'(?:device_id=|device/)(\d+)', q, re.IGNORECASE)
    if dev_match:
        dev_id = int(dev_match.group(1))
        dev = Device.query.get(dev_id)
        if dev:
            return jsonify({
                "found": True,
                "type": "device",
                "device_id": dev.device_id,
                "nama_perangkat": dev.nama_perangkat
            })

    # 3. Cek Module Serial Number
    module = Module.query.filter(Module.serial_number.ilike(q)).first()
    if module:
        return jsonify({
            "found": True,
            "type": "module",
            "serial_number": module.serial_number
        })

    return jsonify({"found": False, "message": "Format QR tidak dikenali sebagai lokasi atau perangkat Telkom."})
