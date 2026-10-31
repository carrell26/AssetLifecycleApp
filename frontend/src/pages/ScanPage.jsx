import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { Html5Qrcode } from "html5-qrcode";

export default function ScanPage({ user, searchValue, onSearchChange }) {
  const { isDark } = useTheme();

  // State perangkat & scanner
  const [devicesList, setDevicesList] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
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

  // State Pop-up Lokasi Perangkat (Location-Based Context)
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedLocationData, setSelectedLocationData] = useState(null);
  const [locationDevices, setLocationDevices] = useState([]);
  const [loadingLocationDevices, setLoadingLocationDevices] = useState(false);

  // State 3D Digital Twin Viewer & Sensor IMU
  const [rackViewMode, setRackViewMode] = useState("2d"); // '2d' or '3d'
  const [rotX, setRotX] = useState(12); // Tilt vertikal (derajat)
  const [rotY, setRotY] = useState(-18); // Rotasi horizontal (derajat)
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [imuActive, setImuActive] = useState(false);
  const [imuData, setImuData] = useState({ pitch: 0, roll: 0 });

  // State Evaluasi Usability (System Usability Scale - SUS)
  const [susModalOpen, setSusModalOpen] = useState(false);
  const [susAnswers, setSusAnswers] = useState({
    1: 4, 2: 2, 3: 5, 4: 1, 5: 5,
    6: 1, 7: 5, 8: 1, 9: 5, 10: 2
  });

  // Toast notification
  const [toast, setToast] = useState(null);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const viewport3DRef = useRef(null);
  const isDragging3D = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Ambil daftar perangkat dan lokasi saat load awal
  useEffect(() => {
    // Ambil daftar perangkat
    fetch("/ar/api/devices")
      .then((res) => res.json())
      .then((data) => {
        if (data.devices) setDevicesList(data.devices);
      })
      .catch((err) => console.error("Gagal mengambil daftar perangkat:", err));

    // Ambil daftar lokasi untuk fallback simulasi lokasi
    fetch("/ar/api/locations")
      .then((res) => res.json())
      .then((data) => {
        if (data.locations) setLocationsList(data.locations);
      })
      .catch((err) => console.error("Gagal mengambil daftar lokasi:", err));

    // Cek query param di URL saat pertama kali load
    const urlParams = new URLSearchParams(window.location.search);
    const devIdParam = urlParams.get("device_id");
    const locIdParam = urlParams.get("location_id");

    if (devIdParam && !isNaN(parseInt(devIdParam, 10))) {
      loadDeviceContext(parseInt(devIdParam, 10));
    } else if (locIdParam && !isNaN(parseInt(locIdParam, 10))) {
      openLocationDevicesModal(parseInt(locIdParam, 10));
    }
  }, []);

  // 2. Lifecycle scanner kamera
  useEffect(() => {
    if (!currentDeviceId && !locationModalOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [currentDeviceId, cameraFacing, locationModalOpen]);

  // 3. Listener Sensor IMU (Device Orientation / Gyroscope)
  useEffect(() => {
    if (!imuActive || rackViewMode !== "3d") return;

    const handleDeviceOrientation = (event) => {
      const beta = event.beta; // Tilt depan-belakang [-180, 180]
      const gamma = event.gamma; // Tilt kiri-kanan [-90, 90]

      if (beta !== null && gamma !== null) {
        // Normalisasi untuk rotasi 3D rack
        const clampedX = Math.max(-25, Math.min(25, (beta - 45) * 0.5));
        const clampedY = Math.max(-35, Math.min(35, gamma * 0.6));
        setRotX(clampedX);
        setRotY(clampedY);
        setImuData({ pitch: Math.round(beta), roll: Math.round(gamma) });
      }
    };

    window.addEventListener("deviceorientation", handleDeviceOrientation, true);
    return () => {
      window.removeEventListener("deviceorientation", handleDeviceOrientation, true);
    };
  }, [imuActive, rackViewMode]);

  // Fungsi menyalakan kamera scanner
  const startCamera = async () => {
    setCameraError(null);
    setCameraStatus("Menghubungkan ke sensor kamera...");

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("ar-qr-reader");
      }

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
        (errorMessage) => {}
      );

      setScannerActive(true);
      setCameraStatus("Arahkan kamera ke QR Code lokasi ruangan atau rak perangkat...");
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
      } catch (e) {}
      setScannerActive(false);
    }
  };

  // Helper parsing teks QR untuk mengambil location_id
  const extractLocationIdFromText = (text) => {
    if (!text) return null;
    try {
      const urlObj = new URL(text, window.location.origin);
      const locIdParam = urlObj.searchParams.get("location_id") || urlObj.searchParams.get("loc_id");
      if (locIdParam && !isNaN(parseInt(locIdParam, 10))) {
        return parseInt(locIdParam, 10);
      }
      const matchPath = urlObj.pathname.match(/\/ar\/location\/(\d+)/);
      if (matchPath) return parseInt(matchPath[1], 10);
    } catch (e) {}

    const matchParam = text.match(/[?&]location_id=(\d+)/i) || text.match(/[?&]loc_id=(\d+)/i);
    if (matchParam) return parseInt(matchParam[1], 10);
    const matchPrefix = text.match(/^LOC-(\d+)$/i);
    if (matchPrefix) return parseInt(matchPrefix[1], 10);
    return null;
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
    } catch (e) {}
    const matchParam = text.match(/[?&]device_id=(\d+)/);
    if (matchParam) return parseInt(matchParam[1], 10);
    const matchDevicePath = text.match(/\/ar\/device\/(\d+)/);
    if (matchDevicePath) return parseInt(matchDevicePath[1], 10);
    if (!isNaN(parseInt(text, 10))) return parseInt(text, 10);
    return null;
  };

  // Callback saat QR berhasil dibaca (Kamera / File)
  const onQrCodeSuccess = async (decodedText) => {
    const raw = (decodedText || "").trim();

    // 1. Coba smart lookup ke server terlebih dahulu
    try {
      const lookupRes = await fetch(`/ar/api/lookup-qr?q=${encodeURIComponent(raw)}`);
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json();
        if (lookupData.found) {
          if (lookupData.type === "location") {
            showToast(`📍 Lokasi "${lookupData.nama_lokasi}" Terdeteksi! Membuka daftar perangkat...`, "success");
            await stopCamera();
            openLocationDevicesModal(lookupData.location_id);
            return;
          } else if (lookupData.type === "device") {
            showToast(`Rak Perangkat #${lookupData.device_id} Terdeteksi!`, "success");
            await stopCamera();
            loadDeviceContext(lookupData.device_id);
            return;
          } else if (lookupData.type === "module") {
            handleDirectModuleLookup(lookupData.serial_number);
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Smart lookup fallback to regex:", err);
    }

    // 2. Fallback regex Lokasi
    const locId = extractLocationIdFromText(raw);
    if (locId) {
      showToast(`📍 QR Lokasi #${locId} Terdeteksi!`, "success");
      await stopCamera();
      openLocationDevicesModal(locId);
      return;
    }

    // 3. Fallback regex Perangkat
    const devId = extractDeviceIdFromText(raw);
    if (devId) {
      showToast(`QR Perangkat #${devId} Terdeteksi!`, "success");
      await stopCamera();
      loadDeviceContext(devId);
      return;
    }

    // 4. Fallback Serial Number Modul
    handleDirectModuleLookup(raw);
  };

  // Buka Modal Pop-up Daftar Perangkat di Lokasi Terdeteksi
  const openLocationDevicesModal = async (locId) => {
    setLoadingLocationDevices(true);
    setLocationModalOpen(true);
    try {
      const res = await fetch(`/ar/api/location/${locId}/devices`);
      if (!res.ok) throw new Error("Gagal mengambil data perangkat di lokasi ini.");
      const data = await res.json();
      setSelectedLocationData(data.location);
      setLocationDevices(data.devices || []);
    } catch (err) {
      showToast(err.message, "error");
      setLocationModalOpen(false);
    } finally {
      setLoadingLocationDevices(false);
    }
  };

  // Lookup modul langsung jika QR adalah serial number modul
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
        setCameraStatus(`QR Terbaca: "${sn}". Format tidak dikenali sebagai perangkat Telkom.`);
      }
    } catch (e) {
      setCameraStatus(`QR Terbaca: "${sn}". Format tidak dikenali.`);
    }
  };

  // Unggah foto QR dari file/galeri (Static Method scanFileV2)
  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      setCameraStatus("Menganalisis file gambar QR...");
      const result = await Html5Qrcode.scanFileV2(file, false);
      await onQrCodeSuccess(result.decodedText);
    } catch (err) {
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

    const newUrl = new URL(window.location);
    newUrl.searchParams.set("device_id", devId);
    window.history.replaceState({}, "", newUrl);

    try {
      const devRes = await fetch(`/ar/api/device/${devId}`);
      if (!devRes.ok) throw new Error("Gagal mengambil data perangkat.");
      const devData = await devRes.json();
      setCurrentDevice(devData);

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
    newUrl.searchParams.delete("location_id");
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

  // Klik slot langsung dari grid / 3D
  const handleSlotCardClick = (slot) => {
    setSelectedSlotForAction(slot);
    setSearchMode("slot");
    setSearchQuery(slot.nomor_slot);
    setHighlightedSlotId(slot.slot_definition_id);

    if (currentDeviceId) {
      fetch(
        `/ar/api/search?device_id=${encodeURIComponent(currentDeviceId)}&type=slot&q=${encodeURIComponent(
          slot.nomor_slot
        )}`
      )
        .then((res) => res.json())
        .then((data) => setSearchResult(data))
        .catch((err) => console.error("Slot click search error:", err));
    }
  };

  // Navigasi pintas ke pengajuan mutasi modul
  const handleNavigateToMutation = (slot) => {
    if (!currentDevice) return;
    const url = `/modules/requests?action=pasang&device_id=${currentDevice.device_id}&slot_id=${slot.slot_definition_id}&slot_no=${slot.nomor_slot}`;
    window.location.href = url;
  };

  // Interaksi Drag Orbit 3D Rack
  const handle3DMouseDown = (e) => {
    isDragging3D.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handle3DMouseMove = (e) => {
    if (!isDragging3D.current || imuActive) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };

    setRotY((prev) => Math.max(-50, Math.min(50, prev + dx * 0.4)));
    setRotX((prev) => Math.max(-35, Math.min(35, prev - dy * 0.4)));
  };

  const handle3DMouseUp = () => {
    isDragging3D.current = false;
  };

  // Hitung Skor SUS (System Usability Scale)
  const calculateSusScore = () => {
    let oddSum = 0;
    let evenSum = 0;
    [1, 3, 5, 7, 9].forEach((num) => {
      oddSum += (susAnswers[num] || 3) - 1;
    });
    [2, 4, 6, 8, 10].forEach((num) => {
      evenSum += 5 - (susAnswers[num] || 3);
    });
    return Math.round((oddSum + evenSum) * 2.5 * 10) / 10;
  };

  const susScore = calculateSusScore();
  const getSusGrade = (score) => {
    if (score >= 80.3) return { grade: "Grade A", label: "Excellent (Sangat Layak Industri)", color: "text-emerald-400" };
    if (score >= 68) return { grade: "Grade B", label: "Good (Layak)", color: "text-blue-400" };
    if (score >= 51) return { grade: "Grade C", label: "OK (Perlu Optimasi)", color: "text-amber-400" };
    return { grade: "Grade D/F", label: "Kurang", color: "text-rose-400" };
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
              : toast.type === "info"
              ? isDark
                ? "bg-[#0A2540] border-[#38BDF8]/50 text-[#38BDF8] shadow-blue-950/40"
                : "bg-blue-50 border-blue-400 text-blue-700"
              : isDark
              ? "bg-[#2A0E12] border-rose-500/50 text-rose-300 shadow-rose-950/40"
              : "bg-rose-50 border-rose-400 text-rose-700"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === "success" ? "check_circle" : toast.type === "info" ? "info" : "error"}
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
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 w-full h-full">
          {/* Kiri: Icon Box + Teks */}
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
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
                  FR-12 Digital Twin
                </span>
              </div>
              <p
                className={`text-xs font-normal mt-0.5 leading-relaxed !m-0 ${
                  isDark ? "text-[#94A3B8]" : "text-slate-500"
                }`}
              >
                Hierarki Spasial: Pindai QR Lokasi Ruang STO atau QR Rak untuk inspeksi slot digital twin.
              </p>
            </div>
          </div>

          {/* Tengah: Ilustrasi Icon AR Animasi */}
          <div className="hidden md:flex items-center justify-center flex-1 px-2 select-none pointer-events-none h-full overflow-hidden">
            <div
              className="relative flex items-center justify-center h-[108px] lg:h-[114px] w-auto"
              style={{ filter: isDark ? "drop-shadow(0 0 28px rgba(0,229,255,0.45))" : "drop-shadow(0 8px 20px rgba(22,119,255,0.2))" }}
            >
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

          {/* Kanan: Tombol Uji Usability SUS & Telemetri */}
          <div className="hidden sm:flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSusModalOpen(true)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all shadow-sm ${
                isDark
                  ? "bg-[#071426] border-[#38BDF8]/40 text-[#38BDF8] hover:bg-[#122846]"
                  : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              }`}
              title="Evaluasi Kelayakan AR Berdasarkan Standar SUS (Matriks Rekognisi)"
            >
              <span className="material-symbols-outlined text-[16px]">rate_review</span>
              <span className="hidden lg:inline">Uji Usability AR</span>
              <span className="px-1.5 py-0.2 rounded-md bg-[#1677FF] text-white text-[10px] font-bold">
                SUS {susScore}
              </span>
            </button>

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
      {/* GRID UTAMA: VIEWFINDER SCANNER (KIRI) & DIGITAL TWIN     */}
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
          <div className="relative w-full aspect-square max-h-[360px] rounded-xl overflow-hidden bg-black border-2 border-[#1E3A5F] flex items-center justify-center shadow-inner">
            <div id="ar-qr-reader" className="w-full h-full object-cover"></div>

            {/* Overlay AR Reticle */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 border-t-2 border-l-2 border-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></div>
                <div className="w-8 h-8 border-t-2 border-r-2 border-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></div>
              </div>

              <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent shadow-[0_0_12px_#00E5FF] animate-pulse"></div>

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

          {/* FITUR 1: SIMULASI SCAN LOKASI (POP-UP PEMILIHAN PERANGKAT) */}
          <div className="mt-5 pt-4 border-t border-[#1A2E4C]/50">
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-xs font-semibold ${isDark ? "text-[#CBD5E1]" : "text-slate-700"}`}>
                📍 Simulasi Pindai QR Lokasi Ruang STO:
              </label>
              <span className="text-[10px] text-[#38BDF8] font-mono">Hierarki Spasial</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {locationsList.map((loc) => (
                <button
                  key={loc.location_id}
                  type="button"
                  onClick={() => openLocationDevicesModal(loc.location_id)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] hover:border-[#38BDF8] text-white hover:bg-[#122846]"
                      : "bg-slate-50 border-slate-300 hover:border-blue-500 text-slate-800 hover:bg-blue-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-rose-400 shrink-0">
                    location_on
                  </span>
                  <div className="overflow-hidden">
                    <div className="font-bold truncate text-[11px]">{loc.nama_lokasi}</div>
                    <div className="text-[10px] text-[#94A3B8]">{loc.total_devices} Perangkat</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fallback Dropdown: Pilih Perangkat Manual */}
          <div className="mt-4 pt-3 border-t border-[#1A2E4C]/40">
            <label className={`block text-xs font-semibold mb-2 ${isDark ? "text-[#CBD5E1]" : "text-slate-700"}`}>
              Atau Pilih Rak Perangkat Langsung:
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

                {/* Toggle Mode Tampilan 2D vs 3D Digital Twin */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex p-0.5 rounded-xl bg-[#071426] border border-[#1E3A5F]">
                    <button
                      type="button"
                      onClick={() => setRackViewMode("2d")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        rackViewMode === "2d"
                          ? "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/30"
                          : "text-[#94A3B8] hover:text-white"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">grid_view</span>
                      <span>2D Grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRackViewMode("3d")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        rackViewMode === "3d"
                          ? "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/30"
                          : "text-[#94A3B8] hover:text-white"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">3d_rotation</span>
                      <span>3D Digital Twin</span>
                    </button>
                  </div>
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
                    <span>🏷️ Cari by Serial Number</span>
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
              {/* TAMPILAN VIEW: 2D GRID vs 3D DIGITAL TWIN VIEWER         */}
              {/* ======================================================== */}
              {rackViewMode === "3d" ? (
                /* ── FITUR 2 & 3: 3D DIGITAL TWIN VIEWPORT DENGAN SENSOR IMU ── */
                <div className="space-y-3 animate-fadeIn">
                  {/* Toolbar Kontrol 3D */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#00E5FF]">view_in_ar</span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        3D Digital Twin Sub-Rack
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-[#38BDF8] font-mono">
                        Sub-CPMK 2 & 3
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Toggle Sensor IMU Gyroscope */}
                      <button
                        type="button"
                        onClick={() => setImuActive(!imuActive)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                          imuActive
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                            : isDark
                            ? "bg-[#071426] border-[#1E3A5F] text-[#94A3B8] hover:text-white"
                            : "bg-slate-100 border-slate-300 text-slate-700"
                        }`}
                        title="Gunakan Sensor Gyroscope Smartphone (IMU Parallax)"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {imuActive ? "sensors" : "sensors_off"}
                        </span>
                        <span>{imuActive ? "Sensor IMU Aktif" : "Aktifkan IMU"}</span>
                      </button>

                      {/* Reset Rotasi */}
                      <button
                        type="button"
                        onClick={() => {
                          setRotX(12);
                          setRotY(-18);
                          setZoomLevel(1.0);
                        }}
                        className={`p-1.5 rounded-lg border text-[11px] ${
                          isDark ? "bg-[#071426] border-[#1E3A5F] text-[#94A3B8]" : "bg-slate-100 border-slate-300"
                        }`}
                        title="Reset Sudut Pandang"
                      >
                        <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                      </button>
                    </div>
                  </div>

                  {/* Canvas Viewport 3D */}
                  <div
                    ref={viewport3DRef}
                    onMouseDown={handle3DMouseDown}
                    onMouseMove={handle3DMouseMove}
                    onMouseUp={handle3DMouseUp}
                    onMouseLeave={handle3DMouseUp}
                    className="relative w-full h-[360px] rounded-2xl overflow-hidden border border-[#1E3A5F] bg-gradient-to-b from-[#050D1A] via-[#071426] to-[#0A182B] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                    style={{ perspective: "1000px" }}
                  >
                    {/* Grid Background Ambient Wireframe */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        backgroundImage: "radial-gradient(#00E5FF 1px, transparent 1px)",
                        backgroundSize: "24px 24px"
                      }}
                    />

                    {/* HUD Telemetry Overlay di Atas 3D */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-[#38BDF8] pointer-events-none z-20">
                      <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded-md border border-[#00E5FF]/20 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
                        <span>ISOMETRIC 3D CHASSIS</span>
                      </div>
                      <div className="bg-black/60 px-2.5 py-1 rounded-md border border-[#00E5FF]/20 backdrop-blur-sm">
                        ROT: X {Math.round(rotX)}° | Y {Math.round(rotY)}° {imuActive && `| IMU: P${imuData.pitch} R${imuData.roll}`}
                      </div>
                    </div>

                    {/* Instruksi Drag di Bawah */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-[#64748B] pointer-events-none z-20 bg-black/50 px-3 py-0.5 rounded-full">
                      {imuActive ? "📡 Miringkan perangkat untuk menggerakkan sudut pandang" : "🖱️ Tahan & geser untuk rotasi orbit 3D • Klik slot untuk inspeksi"}
                    </div>

                    {/* Kontainer Rak 3D (Preserve 3D) */}
                    <div
                      className="transition-transform duration-75 ease-out"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: `scale(${zoomLevel}) rotateX(${rotX}deg) rotateY(${rotY}deg)`
                      }}
                    >
                      {/* Box Frame Luar Chassis Rak */}
                      <div
                        className="relative rounded-xl border-4 border-[#1E3A5F] bg-[#0A182B]/90 shadow-[0_0_50px_rgba(0,229,255,0.15)] p-4"
                        style={{
                          width: "360px",
                          minHeight: "260px",
                          transformStyle: "preserve-3d"
                        }}
                      >
                        {/* Header Rack Rail */}
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1E3A5F] text-[10px] font-mono text-[#38BDF8]">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{currentDevice.tipe} SHELF</span>
                          </span>
                          <span>POWER OK &bull; OPTICAL ACTIVE</span>
                        </div>

                        {/* Blade Slots 3D Layout */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                          {slots.slice(0, 24).map((slot) => {
                            const isOccupied = slot.occupied;
                            const isHighlighted = slot.slot_definition_id === highlightedSlotId;

                            return (
                              <div
                                key={slot.slot_definition_id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSlotCardClick(slot);
                                }}
                                className={`relative rounded-lg p-2 text-center cursor-pointer transition-all duration-200 select-none border ${
                                  isHighlighted
                                    ? "bg-amber-400 text-black border-amber-300 shadow-[0_0_24px_#F59E0B] z-30 font-bold"
                                    : isOccupied
                                    ? "bg-gradient-to-b from-[#1C2638] to-[#121B2A] border-rose-500/50 hover:border-rose-400 text-white shadow-sm"
                                    : "bg-emerald-500/10 border-dashed border-emerald-500/40 hover:border-emerald-400 text-emerald-300"
                                }`}
                                style={{
                                  transformStyle: "preserve-3d",
                                  transform: isHighlighted ? "translateZ(30px) scale(1.1)" : "translateZ(10px)"
                                }}
                              >
                                <div className="text-[10px] font-mono font-bold">
                                  #{slot.nomor_slot}
                                </div>
                                <div className="text-[9px] mt-0.5 truncate">
                                  {isOccupied ? "TERISI" : "READY"}
                                </div>
                                {isOccupied && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mx-auto mt-1 shadow-[0_0_6px_#F43F5E]" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {slots.length > 24 && (
                          <div className="text-center text-[10px] text-[#94A3B8] mt-2 font-mono">
                            + {slots.length - 24} slot lainnya tersedia (Lihat di Mode 2D Grid)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── TAMPILAN 2D MATRIX DEFAULT ── */
                <div>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#38BDF8]">grid_view</span>
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                        Peta Susunan Slot Rak ({currentDevice.nama_perangkat})
                      </h3>
                    </div>

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

                  {/* Grid Kontainer Slot 2D */}
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
              )}

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
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#071426] border border-[#1E3A5F] text-[#38BDF8] shadow-lg">
                <span className="material-symbols-outlined text-[32px]">view_in_ar</span>
              </div>
              <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Menunggu Pemindaian QR Perangkat / Lokasi
              </h3>
              <p className={`text-xs max-w-sm leading-relaxed ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                Pindai QR Code Ruang STO untuk memunculkan daftar perangkat, atau pilih nama perangkat secara langsung dari kolom sebelah kiri.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: POP-UP PILIH PERANGKAT BERDASARKAN LOKASI (QR)  */}
      {/* ======================================================== */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
              isDark ? "bg-[#0A182B] border-[#1E3A5F] text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1E3A5F]/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-rose-500/20 border border-rose-500/40 text-rose-400">
                  <span className="material-symbols-outlined text-[24px]">location_on</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">
                      {selectedLocationData ? selectedLocationData.nama_lokasi : "Lokasi Terdeteksi"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-[#38BDF8] border border-[#1677FF]/40">
                      QR Lokasi Aktif
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                    {selectedLocationData ? `${selectedLocationData.alamat} (${selectedLocationData.district})` : "Memuat data lokasi..."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body: List Perangkat */}
            <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-3">
              <div className="flex items-center justify-between text-xs text-[#94A3B8] pb-1">
                <span>Pilih Rak / Perangkat yang Ingin Diinspeksi:</span>
                <span className="font-mono text-[#38BDF8]">{locationDevices.length} Perangkat di Site Ini</span>
              </div>

              {loadingLocationDevices ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-[32px] text-[#38BDF8] animate-spin">progress_activity</span>
                  <p className="text-xs text-[#94A3B8] mt-2">Mengambil inventaris perangkat di lokasi...</p>
                </div>
              ) : locationDevices.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#94A3B8]">
                  Tidak ada perangkat yang terdaftar di lokasi ini.
                </div>
              ) : (
                locationDevices.map((dev) => (
                  <div
                    key={dev.device_id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDark
                        ? "bg-[#071426] border-[#1E3A5F] hover:border-[#38BDF8] hover:bg-[#0D1F36]"
                        : "bg-slate-50 border-slate-300 hover:border-blue-500 hover:bg-blue-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-[#00E5FF]">router</span>
                        <h4 className="font-bold text-sm">{dev.nama_perangkat}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1677FF]/20 text-[#38BDF8]">
                          {dev.tipe}
                        </span>
                      </div>
                      <div className="text-xs text-[#94A3B8] mt-1 flex items-center gap-3">
                        <span>Hostname: <strong className="text-white font-mono">{dev.hostname}</strong></span>
                        <span>Total Slot: <strong>{dev.total_slot}</strong></span>
                      </div>
                      {/* Bar Statistik Slot */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                          🟢 {dev.empty_slots} Slot Kosong
                        </span>
                        <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30">
                          🔴 {dev.occupied_slots} Slot Terisi
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        loadDeviceContext(dev.device_id);
                        setLocationModalOpen(false);
                        showToast(`Membuka Digital Twin: ${dev.nama_perangkat}`, "success");
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1677FF] hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#1677FF]/25 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
                      <span>Buka Digital Twin</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#1E3A5F]/60 flex justify-end">
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-600 hover:bg-white/5 transition-all text-slate-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EVALUASI USABILITY AR (SYSTEM USABILITY SCALE)  */}
      {/* ======================================================== */}
      {susModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
              isDark ? "bg-[#0A182B] border-[#1E3A5F] text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Header */}
            <div className="p-5 border-b border-[#1E3A5F]/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-500/20 border border-blue-500/40 text-[#38BDF8]">
                  <span className="material-symbols-outlined text-[24px]">fact_check</span>
                </div>
                <div>
                  <h3 className="text-base font-bold">Evaluasi Usability AR (System Usability Scale)</h3>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                    Bukti Rekognisi Matriks MK: Desain Realitas Berimbuh/Virtual (CPL-05 &bull; 3 SKS)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSusModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-4 text-xs">
              {/* Score Highlight Box */}
              <div className="p-4 rounded-xl border border-[#38BDF8]/40 bg-[#071426] flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-[11px] text-[#94A3B8]">Skor Akhir Evaluasi SUS:</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-extrabold text-[#00E5FF]">{susScore}</span>
                    <span className="text-xs text-[#94A3B8]">/ 100</span>
                    <span className={`font-bold ml-2 ${getSusGrade(susScore).color}`}>
                      {getSusGrade(susScore).grade} &bull; {getSusGrade(susScore).label}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const summary = `HASIL EVALUASI USABILITY AR (SYSTEM USABILITY SCALE - SUS)\n` +
                      `Mata Kuliah: Desain Realitas Berimbuh/Realitas Virtual (F09252023 - 3 SKS)\n` +
                      `Skor SUS: ${susScore} / 100 (${getSusGrade(susScore).grade} - ${getSusGrade(susScore).label})\n` +
                      `Tanggal Pengujian: ${new Date().toLocaleDateString('id-ID')}\n` +
                      `Status: Memenuhi Bukti Rekognisi Evaluasi Usability CPL-05.`;
                    navigator.clipboard.writeText(summary);
                    showToast("Hasil evaluasi disalin ke clipboard untuk Laporan Magang!", "success");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#1677FF] hover:bg-blue-600 text-white font-semibold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">content_copy</span>
                  <span>Salin untuk Laporan</span>
                </button>
              </div>

              {/* 10 Kuesioner SUS */}
              <div className="space-y-3">
                {[
                  { id: 1, q: "1. Saya berniat sering menggunakan panduan AR ini dalam operasional lapangan." },
                  { id: 2, q: "2. Saya merasa sistem panduan slot AR ini rumit untuk dipahami teknisi." },
                  { id: 3, q: "3. Saya merasa panduan AR ini sangat praktis dan mudah digunakan." },
                  { id: 4, q: "4. Saya merasa memerlukan bantuan IT khusus setiap kali memakai scanner AR ini." },
                  { id: 5, q: "5. Saya merasa fungsi pencarian dan visualisasi slot terintegrasi dengan sangat baik." },
                  { id: 6, q: "6. Saya merasa ada terlalu banyak inkonsistensi pada alur kerja pemindaian." },
                  { id: 7, q: "7. Saya yakin sebagian besar teknisi baru dapat menguasai sistem AR ini dengan cepat." },
                  { id: 8, q: "8. Saya merasa tampilan panduan AR ini membingungkan saat dioperasikan." },
                  { id: 9, q: "9. Saya merasa sangat percaya diri saat menentukan slot menggunakan AR ini." },
                  { id: 10, q: "10. Saya perlu mempelajari banyak hal baru sebelum bisa memakai sistem ini di lapangan." },
                ].map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-[#1A2E4C] bg-[#071426]/60">
                    <p className="font-medium text-slate-200 mb-2">{item.q}</p>
                    <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                      <span>1 (Sangat Tidak Setuju)</span>
                      <div className="flex items-center gap-3">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <label key={val} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`sus-${item.id}`}
                              checked={susAnswers[item.id] === val}
                              onChange={() => setSusAnswers({ ...susAnswers, [item.id]: val })}
                              className="accent-[#1677FF]"
                            />
                            <span>{val}</span>
                          </label>
                        ))}
                      </div>
                      <span>5 (Sangat Setuju)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#1E3A5F]/60 flex justify-end">
              <button
                type="button"
                onClick={() => setSusModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#1677FF] hover:bg-blue-600 text-white transition-all shadow-md"
              >
                Selesai & Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
