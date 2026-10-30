import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { Html5Qrcode } from "html5-qrcode";

export default function ScanPage({ user, searchValue, onSearchChange }) {
  const { isDark } = useTheme();

  // State perangkat & scanner
  const [devicesList, setDevicesList] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingDevice, setLoadingDevice] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment"); // 'environment' or 'user'
  const [cameraStatus, setCameraStatus] = useState("Menyiapkan pemindai kamera...");
  const [cameraError, setCameraError] = useState(null);

  // State pencarian & highlight slot
  const [searchMode, setSearchMode] = useState("sn"); // 'sn' or 'slot'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [highlightedSlotId, setHighlightedSlotId] = useState(null);
  const [selectedSlotForAction, setSelectedSlotForAction] = useState(null);

  // Toast notification
  const [toast, setToast] = useState(null);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Ambil daftar semua perangkat untuk dropdown fallback manual
  useEffect(() => {
    fetch("/ar/api/devices")
      .then((res) => res.json())
      .then((data) => {
        if (data.devices) {
          setDevicesList(data.devices);
        }
      })
      .catch((err) => console.error("Gagal mengambil daftar perangkat:", err));

    // Cek query param device_id di URL saat pertama kali load
    const urlParams = new URLSearchParams(window.location.search);
    const devIdParam = urlParams.get("device_id");
    if (devIdParam && !isNaN(parseInt(devIdParam, 10))) {
      loadDeviceContext(parseInt(devIdParam, 10));
    }
  }, []);

  // 2. Lifecycle scanner kamera
  useEffect(() => {
    // Jalankan kamera scanner jika belum ada device yang dipilih
    if (!currentDeviceId) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [currentDeviceId, cameraFacing]);

  // Fungsi menyalakan kamera scanner
  const startCamera = async () => {
    setCameraError(null);
    setCameraStatus("Menghubungkan ke sensor kamera...");

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("ar-qr-reader");
      }

      // Pastikan scanner sebelumnya sudah berhenti jika masih aktif
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      await scannerRef.current.start(
        { facingMode: cameraFacing },
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        onQrCodeSuccess,
        (errorMessage) => {
          // ignore transient frame decode errors
        }
      );

      setScannerActive(true);
      setCameraStatus("Arahkan kamera ke QR Code rak perangkat atau modul...");
    } catch (err) {
      console.warn("Kamera gagal dihidupkan:", err);
      setScannerActive(false);
      setCameraError(
        "Kamera tidak dapat diakses. Pastikan izin kamera aktif dan protokol HTTPS digunakan, atau gunakan opsi Unggah Foto QR / Pilih Manual di bawah."
      );
      setCameraStatus("Kamera tidak aktif.");
    }
  };

  // Fungsi mematikan kamera
  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        // ignore stop error
      }
      setScannerActive(false);
    }
  };

  // Helper parsing teks QR untuk mengambil device_id
  const extractDeviceIdFromText = (text) => {
    if (!text) return null;
    try {
      const urlObj = new URL(text, window.location.origin);
      const devIdParam = urlObj.searchParams.get("device_id");
      if (devIdParam && !isNaN(parseInt(devIdParam, 10))) {
        return parseInt(devIdParam, 10);
      }
      const matchPath = urlObj.pathname.match(/\/ar\/device\/(\d+)/);
      if (matchPath) return parseInt(matchPath[1], 10);
    } catch (e) {
      // not url
    }
    const matchParam = text.match(/[?&]device_id=(\d+)/);
    if (matchParam) return parseInt(matchParam[1], 10);
    const matchDevicePath = text.match(/\/ar\/device\/(\d+)/);
    if (matchDevicePath) return parseInt(matchDevicePath[1], 10);
    if (!isNaN(parseInt(text, 10))) return parseInt(text, 10);
    return null;
  };

  // Callback saat QR berhasil dibaca
  const onQrCodeSuccess = async (decodedText) => {
    const devId = extractDeviceIdFromText(decodedText);
    if (devId) {
      showToast(`QR Perangkat #${devId} Terdeteksi!`, "success");
      await stopCamera();
      loadDeviceContext(devId);
    } else {
      // Coba periksa apakah QR tersebut merupakan serial number modul langsung!
      handleDirectModuleLookup(decodedText.trim());
    }
  };

  // Lookup modul langsung jika QR yang dipindai adalah label modul
  const handleDirectModuleLookup = async (sn) => {
    try {
      const res = await fetch(`/ar/api/lookup-module?q=${encodeURIComponent(sn)}`);
      const data = await res.json();
      if (data.found && data.installed && data.device) {
        showToast(`Modul ${sn} terpasang di ${data.device.nama_perangkat}`, "success");
        await stopCamera();
        await loadDeviceContext(data.device.device_id);
        setHighlightedSlotId(data.highlight_slot_id);
        setSearchQuery(sn);
        setSearchMode("sn");
        setSearchResult({
          found: true,
          type: "sn",
          module: data.module,
          slot: data.slot,
          device: data.device,
          highlight_slot_id: data.highlight_slot_id,
        });
      } else if (data.found && !data.installed) {
        showToast(data.message, "info");
      } else {
        // Perbaikan bug: gunakan variabel `sn` bukan `decodedText` yang tidak ada di scope ini
        setCameraStatus(`QR Terbaca: "${sn}". Format tidak dikenali sebagai perangkat Telkom.`);
      }
    } catch (e) {
      setCameraStatus(`QR Terbaca: "${sn}". Format tidak dikenali.`);
    }
  };

  // Unggah foto QR dari file/galeri
  // Menggunakan Html5Qrcode.scanFileV2 (static method) agar tidak bergantung pada DOM element
  // dan bisa bekerja baik saat kamera aktif maupun tidak aktif
  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      setCameraStatus("Menganalisis file gambar QR...");

      // Gunakan static method scanFileV2 — tidak memerlukan elemen DOM aktif
      // Ini bekerja terlepas dari apakah kamera scanner sedang berjalan atau tidak
      const result = await Html5Qrcode.scanFileV2(file, /* showImage= */ false);
      await onQrCodeSuccess(result.decodedText);
    } catch (err) {
      // Bedakan jenis error untuk pesan yang lebih informatif
      const errMsg = err && err.message ? err.message : String(err);
      if (errMsg.toLowerCase().includes("no qr code") || errMsg.toLowerCase().includes("not found")) {
        showToast("QR Code tidak ditemukan di gambar ini. Pastikan gambar cukup jelas dan berisi QR code.", "error");
        setCameraStatus("QR Code tidak terdeteksi di file gambar. Coba foto dengan pencahayaan lebih baik.");
      } else {
        showToast("Tidak dapat membaca file gambar. Format file harus JPG/PNG dan tidak boleh rusak.", "error");
        setCameraStatus("Gagal membaca file gambar QR.");
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Load detail perangkat dan peta slot
  const loadDeviceContext = async (devId) => {
    setLoadingDevice(true);
    setCurrentDeviceId(devId);
    setHighlightedSlotId(null);
    setSearchResult(null);
    setSearchQuery("");
    setSelectedSlotForAction(null);

    // Update query params di URL tanpa refresh
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("device_id", devId);
    window.history.replaceState({}, "", newUrl);

    try {
      // 1. Fetch metadata perangkat
      const devRes = await fetch(`/ar/api/device/${devId}`);
      if (!devRes.ok) throw new Error("Gagal mengambil data perangkat.");
      const devData = await devRes.json();
      setCurrentDevice(devData);

      // 2. Fetch data slot
      const slotsRes = await fetch(`/ar/api/device/${devId}/slots`);
      if (!slotsRes.ok) throw new Error("Gagal mengambil data slot perangkat.");
      const slotsData = await slotsRes.json();
      setSlots(slotsData.slots || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingDevice(false);
    }
  };

  // Reset pencarian dan kembali ke mode scan
  const handleScanAnotherDevice = () => {
    setCurrentDeviceId(null);
    setCurrentDevice(null);
    setSlots([]);
    setHighlightedSlotId(null);
    setSearchResult(null);
    setSearchQuery("");
    setSelectedSlotForAction(null);

    const newUrl = new URL(window.location);
    newUrl.searchParams.delete("device_id");
    window.history.replaceState({}, "", newUrl);

    startCamera();
  };

  // Eksekusi pencarian SN atau Slot di perangkat aktif
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query || !currentDeviceId) return;

    setSearching(true);
    setSearchResult(null);
    setHighlightedSlotId(null);

    try {
      const url = `/ar/api/search?device_id=${encodeURIComponent(currentDeviceId)}&type=${encodeURIComponent(
        searchMode
      )}&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = await res.json();
      setSearchResult(data);

      if (data.found && data.highlight_slot_id) {
        setHighlightedSlotId(data.highlight_slot_id);
        // Scroll otomatis ke card slot yang disorot
        setTimeout(() => {
          const el = document.getElementById(`slot-item-${data.highlight_slot_id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 150);
      }
    } catch (err) {
      showToast("Gagal melakukan pencarian: " + err.message, "error");
    } finally {
      setSearching(false);
    }
  };

  // Klik slot langsung dari grid
  const handleSlotCardClick = (slot) => {
    setSelectedSlotForAction(slot);
    setSearchMode("slot");
    setSearchQuery(slot.nomor_slot);
    setHighlightedSlotId(slot.slot_definition_id);

    // Auto search slot tersebut
    if (currentDeviceId) {
      fetch(
        `/ar/api/search?device_id=${encodeURIComponent(currentDeviceId)}&type=slot&q=${encodeURIComponent(
          slot.nomor_slot
        )}`
      )
        .then((res) => res.json())
        .then((data) => {
          setSearchResult(data);
        })
        .catch((err) => console.error("Slot click search error:", err));
    }
  };

  // Navigasi pintas ke pengajuan mutasi modul
  const handleNavigateToMutation = (slot) => {
    if (!currentDevice) return;
    const url = `/modules/requests?action=pasang&device_id=${currentDevice.device_id}&slot_id=${slot.slot_definition_id}&slot_no=${slot.nomor_slot}`;
    window.location.href = url;
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-2xl transition-all duration-300 animate-slideIn ${
            toast.type === "success"
              ? isDark
                ? "bg-[#06241E] border-emerald-500/50 text-emerald-300 shadow-emerald-950/40"
                : "bg-emerald-50 border-emerald-400 text-emerald-700"
              : isDark
              ? "bg-[#2A0E12] border-rose-500/50 text-rose-300 shadow-rose-950/40"
              : "bg-rose-50 border-rose-400 text-rose-700"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* HERO BANNER BERGAYA CYBER AR & TELKOM INFRASTRUCTURE     */}
      {/* ======================================================== */}
      <div
        className={`relative overflow-hidden rounded-2xl border px-5 sm:px-6 h-[120px] min-h-[120px] max-h-[120px] flex items-center justify-between transition-all duration-300 shadow-sm !mt-0 ${
          isDark
            ? "border-[#1E3A5F] bg-[#0A182B] shadow-2xl"
            : "border-slate-200 bg-white shadow-sm"
        }`}
        style={{ marginTop: 0, height: "120px", minHeight: "120px", maxHeight: "120px" }}
      >
        {/* Glow ambient background circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 w-full h-full">
          {/* Kiri: Icon Box + Teks */}
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
            {/* Icon Box — ukuran dan style identik dengan halaman Kelola User & Audit Log */}
            <div
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                isDark
                  ? "bg-gradient-to-br from-[#1677FF]/40 to-[#0A2540] border-[#38BDF8]/40 shadow-[0_0_24px_rgba(22,119,255,0.45)] text-[#38BDF8]"
                  : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm text-blue-600"
              }`}
            >
              <span className="material-symbols-outlined text-[26px] sm:text-[30px]">
                view_in_ar
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className={`text-xl sm:text-2xl font-bold tracking-tight !m-0 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  AR Scan Perangkat
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                    isDark
                      ? "bg-[#0A284D] text-[#38BDF8] border-[#18467A]"
                      : "bg-blue-50 text-blue-600 border-blue-200"
                  }`}
                >
                  FR-12 Phase 2
                </span>
              </div>
              <p
                className={`text-xs font-normal mt-0.5 leading-relaxed !m-0 ${
                  isDark ? "text-[#94A3B8]" : "text-slate-500"
                }`}
              >
                Digital Twin & Augmented Guide: pindai QR rak, inspeksi slot kosong secara instan.
              </p>
            </div>
          </div>

          {/* Tengah: Icon besar AR sebagai ilustrasi banner — mengikuti pola halaman lain */}
          <div className="hidden md:flex items-center justify-center flex-1 px-2 select-none pointer-events-none h-full overflow-hidden">
            <div
              className={`relative flex items-center justify-center h-[108px] lg:h-[114px] w-auto`}
              style={{ filter: isDark ? "drop-shadow(0 0 28px rgba(0,229,255,0.45))" : "drop-shadow(0 8px 20px rgba(22,119,255,0.2))" }}
            >
              {/* Cincin dekorasi luar */}
              <div
                className={`absolute w-[90px] h-[90px] rounded-full border-2 ${
                  isDark ? "border-[#00E5FF]/20" : "border-blue-200/60"
                } animate-spin`}
                style={{ animationDuration: "12s" }}
              />
              <div
                className={`absolute w-[68px] h-[68px] rounded-full border ${
                  isDark ? "border-[#1677FF]/40" : "border-blue-300/50"
                } animate-spin`}
                style={{ animationDuration: "8s", animationDirection: "reverse" }}
              />
              {/* Icon AR utama */}
              <span
                className={`material-symbols-outlined ${
                  isDark ? "text-[#38BDF8]" : "text-blue-500"
                }`}
                style={{ fontSize: "52px" }}
              >
                view_in_ar
              </span>
            </div>
          </div>

          {/* Kanan: Status telemetry */}
          <div className="hidden lg:flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981] animate-pulse" />
              <span className={isDark ? "text-[#CBD5E1]" : "text-slate-700"}>AR Telemetry Aktif</span>
            </div>
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                isDark ? "bg-[#0D1F36] border-[#1E3A5F] text-[#38BDF8]" : "bg-slate-100 border-slate-200 text-slate-800"
              }`}
            >
              {devicesList.length} Perangkat
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* GRID UTAMA: VIEWFINDER SCANNER (KIRI) & AR MATRIX (KANAN)*/}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================== */}
        {/* KOLOM KIRI: KAMERA AR VIEWFINDER HUD (5 COL)   */}
        {/* ============================================== */}
        <div
          className={`lg:col-span-5 rounded-2xl border p-5 shadow-lg transition-all duration-300 ${
            isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
          }`}
        >
          {/* Header Kontrol Scanner */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1A2E4C]/60">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#38BDF8]">qr_code_scanner</span>
              <span className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Kamera AR Viewfinder
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle Kamera Belakang / Depan */}
              <button
                type="button"
                onClick={() => setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"))}
                title="Ganti Lensa Kamera"
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                  isDark
                    ? "bg-[#071426] border-[#1E3A5F] text-[#38BDF8] hover:bg-[#122846]"
                    : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">flip_camera_ios</span>
                <span className="hidden sm:inline font-medium text-[11px]">
                  {cameraFacing === "environment" ? "Belakang" : "Depan"}
                </span>
              </button>

              {/* Unggah Foto QR */}
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Unggah Gambar QR Code"
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                  isDark
                    ? "bg-[#071426] border-[#1E3A5F] text-[#38BDF8] hover:bg-[#122846]"
                    : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span className="hidden sm:inline font-medium text-[11px]">Foto QR</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Viewport Kamera Video dengan Cyberpunk Reticle Overlay */}
          <div className="relative w-full aspect-square max-h-[380px] rounded-xl overflow-hidden bg-black border-2 border-[#1E3A5F] flex items-center justify-center shadow-inner">
            {/* Target Container untuk Html5Qrcode */}
            <div id="ar-qr-reader" className="w-full h-full object-cover"></div>

            {/* Overlay AR Reticle (Garis Bujukan Targetting Cyber) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
              {/* Sudut Atas Reticle */}
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 border-t-2 border-l-2 border-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></div>
                <div className="w-8 h-8 border-t-2 border-r-2 border-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></div>
              </div>

              {/* Garis Pindai Horizontal Bergerak (Scanline Effect) */}
              <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent shadow-[0_0_12px_#00E5FF] animate-pulse"></div>

              {/* Sudut Bawah Reticle */}
              <div className="flex justify-between items-end">
                <div className="w-8 h-8 border-b-2 border-l-2 border-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></div>
                <div className="w-8 h-8 border-b-2 border-r-2 border-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></div>
              </div>
            </div>

            {/* Indikator Status di Atas Video */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-center px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-mono text-[#38BDF8] z-10 border border-[#00E5FF]/20">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF] animate-ping"></span>
                <span>HUD SCANNER ACTIVE</span>
              </span>
              <span>{cameraFacing.toUpperCase()}</span>
            </div>
          </div>

          {/* Status teks di bawah kamera */}
          <div className="mt-3 text-center">
            <p className={`text-xs font-medium ${isDark ? "text-[#94A3B8]" : "text-slate-600"}`}>
              {cameraStatus}
            </p>
            {cameraError && (
              <div className="mt-2.5 p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 text-left flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-rose-400 mt-0.5">warning</span>
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Fallback Dropdown: Pilih Perangkat Manual */}
          <div className="mt-5 pt-4 border-t border-[#1A2E4C]/50">
            <label className={`block text-xs font-semibold mb-2 ${isDark ? "text-[#CBD5E1]" : "text-slate-700"}`}>
              Atau Pilih Perangkat Secara Manual:
            </label>
            <div className="flex gap-2">
              <select
                value={currentDeviceId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) loadDeviceContext(parseInt(val, 10));
                }}
                className={`flex-1 h-10 px-3 rounded-xl text-xs focus:outline-none transition-all ${
                  isDark
                    ? "bg-[#071426] border border-[#1E3A5F] text-white focus:border-[#1677FF]"
                    : "bg-slate-50 border border-slate-300 text-slate-900 focus:border-[#1677FF]"
                }`}
              >
                <option value="" disabled>
                  -- Pilih Rak / Perangkat Telkom --
                </option>
                {devicesList.map((d) => (
                  <option key={d.device_id} value={d.device_id}>
                    {d.nama_perangkat} ({d.tipe} &bull; {d.lokasi})
                  </option>
                ))}
              </select>

              {currentDeviceId && (
                <button
                  type="button"
                  onClick={handleScanAnotherDevice}
                  title="Reset & Pindai Ulang"
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-[#38BDF8] hover:bg-[#122846]"
                      : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>Scan Ulang</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* KOLOM KANAN: DIGITAL TWIN RAK & PETA SLOT AR (7 COL)     */}
        {/* ======================================================== */}
        <div
          className={`lg:col-span-7 rounded-2xl border p-6 shadow-lg transition-all duration-300 ${
            isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
          }`}
        >
          {loadingDevice ? (
            <div className="py-24 text-center">
              <span className="material-symbols-outlined text-[40px] text-[#38BDF8] animate-spin">progress_activity</span>
              <p className={`text-sm mt-3 font-semibold ${isDark ? "text-[#E6EDF7]" : "text-slate-800"}`}>
                Memuat spesifikasi rak & peta slot chassis...
              </p>
            </div>
          ) : currentDevice ? (
            <div className="space-y-5">
              {/* Metadata Perangkat Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1A2E4C]/60 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[24px] text-[#00E5FF]">hub</span>
                    <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {currentDevice.nama_perangkat}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        isDark ? "bg-[#0B2A4A] text-[#38BDF8] border-[#164477]" : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {currentDevice.tipe}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${
                        isDark ? "bg-[#071426] text-[#CBD5E1] border-[#1E3A5F]" : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px] text-rose-400">location_on</span>
                      {currentDevice.lokasi}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${
                        isDark ? "bg-[#071426] text-[#94A3B8] border-[#1E3A5F]" : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      SN: {currentDevice.serial_number}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      isDark ? "bg-[#0A2E24] text-[#6EE7B7] border-[#15604B]" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {slots.length} Total Slot
                  </span>
                </div>
              </div>

              {/* Tabs Mode Pencarian & Form Search */}
              <div>
                <div className="flex gap-2 p-1 rounded-xl mb-3 bg-[#071426] border border-[#1E3A5F] max-w-md">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchMode("sn");
                      setSearchQuery("");
                      setSearchResult(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      searchMode === "sn"
                        ? "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/30"
                        : "text-[#94A3B8] hover:text-[#E6EDF7]"
                    }`}
                  >
                    <span>🏷️ Cari by Serial Number (SN)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchMode("slot");
                      setSearchQuery("");
                      setSearchResult(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      searchMode === "slot"
                        ? "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/30"
                        : "text-[#94A3B8] hover:text-[#E6EDF7]"
                    }`}
                  >
                    <span>📦 Cari by Nomor Slot</span>
                  </button>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#64748B]">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        searchMode === "sn"
                          ? "Masukkan nomor seri modul (cth: CFP2-001, SN-...)"
                          : "Masukkan nomor slot (cth: 1, 2, 5...)"
                      }
                      className={`w-full h-11 pl-10 pr-4 rounded-xl text-xs transition-all focus:outline-none ${
                        isDark
                          ? "bg-[#071426] border border-[#1E3A5F] text-white focus:border-[#1677FF]"
                          : "bg-slate-50 border border-slate-300 text-slate-900 focus:border-[#1677FF]"
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching || !searchQuery.trim()}
                    className="h-11 px-5 rounded-xl font-semibold text-xs text-white bg-[#1677FF] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#1677FF]/25 flex items-center gap-1.5"
                  >
                    {searching ? (
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">search</span>
                    )}
                    <span>Cari</span>
                  </button>
                </form>
              </div>

              {/* Alert / Card Hasil Pencarian */}
              {searchResult && (
                <div className="animate-fadeIn">
                  {!searchResult.found ? (
                    <div
                      className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                        searchResult.reason === "wrong_device" || searchResult.reason === "not_installed"
                          ? isDark
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : "bg-amber-50 border-amber-300 text-amber-800"
                          : isDark
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                          : "bg-rose-50 border-rose-300 text-rose-800"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                        {searchResult.reason === "wrong_device"
                          ? "swap_horiz"
                          : searchResult.reason === "not_installed"
                          ? "inventory_2"
                          : "cancel"}
                      </span>
                      <div>
                        <strong className="block text-sm font-bold mb-0.5">
                          {searchResult.reason === "wrong_device"
                            ? "Modul Berada di Perangkat Lain"
                            : searchResult.reason === "not_installed"
                            ? "Modul Bebas (Belum Terpasang)"
                            : "Pencarian Tidak Ditemukan"}
                        </strong>
                        <p className="leading-relaxed">{searchResult.message}</p>
                      </div>
                    </div>
                  ) : (
                    /* Hasil Temuan Modul / Slot Valid */
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        isDark ? "bg-[#071426] border-[#1E3A5F]" : "bg-slate-50 border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-[#1A2E4C]/50">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]"></span>
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                            Hasil Temuan Spesifikasi
                          </span>
                        </div>
                        {searchResult.module && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                              searchResult.module.kondisi?.toLowerCase() === "baik" ||
                              searchResult.module.kondisi?.toLowerCase() === "aktif"
                                ? isDark
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : searchResult.module.kondisi?.toLowerCase() === "rusak"
                                ? isDark
                                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                                : isDark
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            Kondisi: {searchResult.module.kondisi}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                        <div>
                          <span className="block text-[11px] text-[#94A3B8]">Nomor Slot</span>
                          <span className="font-bold text-amber-400 text-sm">
                            ⭐ Slot {searchResult.slot?.nomor_slot}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-[#94A3B8]">Status Slot</span>
                          <span
                            className={`font-semibold ${
                              searchResult.slot?.status === "KOSONG" ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {searchResult.slot?.status === "KOSONG" ? "🟢 Kosong" : "🔴 Terisi"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-[#94A3B8]">Serial Number Modul</span>
                          <span className={`font-mono font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                            {searchResult.module ? searchResult.module.serial_number : "Tidak Ada Modul"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-[#94A3B8]">Tipe Modul</span>
                          <span className={isDark ? "text-[#CBD5E1]" : "text-slate-700"}>
                            {searchResult.module ? searchResult.module.tipe : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* CHASSIS MATRIX: VISUALISASI GRID PETA SLOT AR 2D        */}
              {/* ======================================================== */}
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#38BDF8]">grid_view</span>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                      Peta Susunan Slot Rak ({currentDevice.nama_perangkat})
                    </h3>
                  </div>

                  {/* Legenda Warna Slot */}
                  <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]"></span>
                      <span>Kosong</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#F43F5E]"></span>
                      <span>Terisi</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]"></span>
                      <span>Highlight</span>
                    </div>
                  </div>
                </div>

                {/* Grid Kontainer Slot */}
                <div
                  className={`p-3 rounded-xl border max-h-[340px] overflow-y-auto custom-scrollbar grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${
                    isDark ? "bg-[#071426] border-[#1A2E4C]" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  {slots.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-[#94A3B8]">
                      Tidak ada definisi slot yang terdaftar untuk tipe perangkat ini.
                    </div>
                  ) : (
                    slots.map((slot) => {
                      const isOccupied = slot.occupied;
                      const isHighlighted = slot.slot_definition_id === highlightedSlotId;

                      return (
                        <div
                          key={slot.slot_definition_id}
                          id={`slot-item-${slot.slot_definition_id}`}
                          onClick={() => handleSlotCardClick(slot)}
                          className={`p-3 rounded-xl border text-center cursor-pointer transition-all duration-200 relative select-none ${
                            isHighlighted
                              ? isDark
                                ? "bg-[#2A1D0B] border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.6)] scale-[1.03] z-10"
                                : "bg-amber-50 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-[1.03] z-10"
                              : isOccupied
                              ? isDark
                                ? "bg-rose-500/10 border-rose-500/30 hover:border-rose-400/80 hover:bg-rose-500/20"
                                : "bg-rose-50 border-rose-200 hover:border-rose-400"
                              : isDark
                              ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400/80 hover:bg-emerald-500/20"
                              : "bg-emerald-50 border-emerald-200 hover:border-emerald-400"
                          }`}
                        >
                          {isHighlighted && (
                            <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-400 text-black uppercase tracking-wider shadow">
                              TERPILIH
                            </span>
                          )}

                          <div className={`font-bold text-xs ${isDark ? "text-white" : "text-slate-900"}`}>
                            Slot {slot.nomor_slot}
                          </div>

                          <div
                            className={`text-[11px] font-semibold mt-1 flex items-center justify-center gap-1 ${
                              isOccupied ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            <span>{isOccupied ? "🔴 Terisi" : "🟢 Kosong"}</span>
                          </div>

                          {isOccupied && slot.module ? (
                            <div className="mt-1.5 pt-1 border-t border-[#1A2E4C]/40">
                              <div
                                className={`text-[11px] font-mono font-medium truncate ${
                                  isDark ? "text-[#E6EDF7]" : "text-slate-800"
                                }`}
                                title={slot.module.serial_number}
                              >
                                {slot.module.serial_number}
                              </div>
                              <div className="text-[10px] text-[#94A3B8] truncate">{slot.module.tipe}</div>
                            </div>
                          ) : (
                            <div className="mt-1.5 text-[10px] text-emerald-400/80">Siap pasang</div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Call-to-Action Baris: Aksi Pemasangan / Mutasi Cepat */}
              {selectedSlotForAction && (
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slideIn ${
                    selectedSlotForAction.occupied
                      ? isDark
                        ? "bg-[#1B1226] border-purple-500/40 text-purple-200"
                        : "bg-purple-50 border-purple-200 text-purple-900"
                      : isDark
                      ? "bg-[#0A2E24] border-emerald-500/40 text-emerald-200"
                      : "bg-emerald-50 border-emerald-300 text-emerald-900"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>⚡ Slot Terpilih: Slot {selectedSlotForAction.nomor_slot}</span>
                      <span className="font-normal opacity-75">
                        ({selectedSlotForAction.occupied ? "Modul Terpasang" : "Slot Tersedia"})
                      </span>
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      {selectedSlotForAction.occupied
                        ? `SN: ${selectedSlotForAction.module?.serial_number || "-"} • Tipe: ${
                            selectedSlotForAction.module?.tipe || "-"
                          }`
                        : "Slot ini kosong dan siap dialokasikan untuk modul baru di lapangan."}
                    </div>
                  </div>

                  {!selectedSlotForAction.occupied ? (
                    <button
                      type="button"
                      onClick={() => handleNavigateToMutation(selectedSlotForAction)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#10B981] hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_task</span>
                      <span>Ajukan Pasang di Slot Ini</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleNavigateToMutation(selectedSlotForAction)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1677FF] hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                      <span>Ajukan Mutasi / Pindah</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* State Awal: Belum Ada Perangkat yang Terpilih / Ter-scan */
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#071426] border border-[#1E3A5F] text-[#38BDF8] shadow-lg">
                <span className="material-symbols-outlined text-[32px]">view_in_ar</span>
              </div>
              <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Menunggu Pemindaian QR Perangkat
              </h3>
              <p className={`text-xs max-w-sm leading-relaxed ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                Arahkan kamera ke QR Code yang tertempel di bodi rak perangkat, atau pilih nama perangkat secara manual dari menu dropdown di kolom sebelah kiri.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

