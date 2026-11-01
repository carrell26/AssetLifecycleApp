import React, { useState, useEffect, useRef, useMemo } from "react";
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
  const [rackViewMode, setRackViewMode] = useState("3d"); // Default '3d' Digital Twin Sub-Rack
  const [rotX, setRotX] = useState(0); // Menghadap lurus ke depan secara default (0 derajat)
  const [rotY, setRotY] = useState(0); // Menghadap lurus ke depan secara default (0 derajat)
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

  // Custom Dropdown State & Ref (Sesuai Desain Gambar 1)
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const deviceDropdownRef = useRef(null);

  // Floating Card Popup Slot State (Sesuai Desain Gambar 2 / Dashboard RackSlotStatus)
  const [activeSlotPopup, setActiveSlotPopup] = useState(null);
  const [slotPopupPos, setSlotPopupPos] = useState({ x: 0, y: 0, isBelow: false });

  const showSlotPopup = (e, slot) => {
    if (!e || !e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const halfWidth = 105;
    const clampX = Math.max(halfWidth + 12, Math.min(window.innerWidth - halfWidth - 12, rect.left + rect.width / 2));
    const isBelow = rect.top < 170;
    const posY = isBelow ? rect.bottom + 8 : rect.top - 8;

    setSlotPopupPos({ x: clampX, y: posY, isBelow });
    setActiveSlotPopup(slot);
  };

  const hideSlotPopup = (slotId) => {
    if (highlightedSlotId !== slotId) {
      setActiveSlotPopup(null);
    }
  };

  // Click outside listener untuk menutup custom dropdown & slot popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(event.target)) {
        setDeviceDropdownOpen(false);
      }
      if (
        !event.target.closest('[id^="slot-item-"]') &&
        !event.target.closest("#ar-slot-floating-popup")
      ) {
        setActiveSlotPopup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [highlightedSlotId]);
  const isDragging3D = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper memisahkan slot Nokia 1830 PSS-24x menjadi Tier 1 (Atas: 1-16) dan Tier 2 (Bawah: 17-29)
  const normalizedSlots = useMemo(() => {
    if (!slots || slots.length === 0) return [];

    // Deduplikasi jika ada format '1' dan '1.0', prioritaskan yang ada modul terpasang
    const mapByNum = new Map();
    slots.forEach((slot) => {
      const match = String(slot.nomor_slot).match(/\d+/);
      const slotNum = match ? parseInt(match[0], 10) : slot.nomor_slot;

      if (!mapByNum.has(slotNum)) {
        mapByNum.set(slotNum, slot);
      } else {
        const existing = mapByNum.get(slotNum);
        if (!existing.occupied && slot.occupied) {
          mapByNum.set(slotNum, slot);
        }
      }
    });

    return Array.from(mapByNum.values()).sort((a, b) => {
      const numA = parseInt(String(a.nomor_slot).match(/\d+/)?.[0] || "0", 10);
      const numB = parseInt(String(b.nomor_slot).match(/\d+/)?.[0] || "0", 10);
      return numA - numB;
    });
  }, [slots]);

  const { topTierSlots, bottomTierSlots, otherSlots } = useMemo(() => {
    const top = [];
    const bottom = [];
    const others = [];

    normalizedSlots.forEach((slot) => {
      const num = parseInt(String(slot.nomor_slot).match(/\d+/)?.[0] || "-1", 10);
      if (num >= 1 && num <= 16) {
        top.push(slot);
      } else if (num >= 17 && num <= 29) {
        bottom.push(slot);
      } else {
        others.push(slot);
      }
    });

    if (top.length > 0 || bottom.length > 0) {
      return { topTierSlots: top, bottomTierSlots: bottom, otherSlots: others };
    }

    const half = Math.ceil(normalizedSlots.length / 2);
    return {
      topTierSlots: normalizedSlots.slice(0, half),
      bottomTierSlots: normalizedSlots.slice(half),
      otherSlots: [],
    };
  }, [normalizedSlots]);

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

      try {
        await scannerRef.current.start(
          { facingMode: cameraFacing },
          {
            fps: 15,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          },
          onQrCodeSuccess,
          (errorMessage) => { }
        );
      } catch (constraintErr) {
        // Fallback otomatis jika kamera belakang (environment) tidak tersedia di laptop
        console.warn("Kamera spesifik tidak tersedia, beralih ke webcam default:", constraintErr);
        await scannerRef.current.start(
          { facingMode: "user" },
          {
            fps: 15,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          },
          onQrCodeSuccess,
          (errorMessage) => { }
        );
      }

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
      } catch (e) { }
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
    } catch (e) { }

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
    } catch (e) { }
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
            showToast(`✅ Perangkat "${lookupData.nama_perangkat}" ditemukan! Memuat peta slot...`, "success");
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
      showToast(`📍 QR Lokasi terdeteksi! Memuat daftar perangkat...`, "success");
      await stopCamera();
      openLocationDevicesModal(locId);
      return;
    }

    // 3. Fallback regex Perangkat
    const devId = extractDeviceIdFromText(raw);
    if (devId) {
      showToast(`✅ QR Perangkat terdeteksi! Memuat peta slot...`, "success");
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
        if (data.slot) {
          setSelectedSlotForAction({
            slot_definition_id: data.highlight_slot_id,
            nomor_slot: data.slot.nomor_slot,
            nama_slot: data.slot.nama_slot,
            occupied: true,
            module: data.module,
          });
        }
      } else if (data.found && !data.installed) {
        showToast(data.message, "info");
      } else {
        setCameraStatus(`QR Terbaca: "${sn}". Format tidak dikenali sebagai perangkat Telkom.`);
      }
    } catch (e) {
      setCameraStatus(`QR Terbaca: "${sn}". Format tidak dikenali.`);
    }
  };

  // Decoder gambar multi-tier: mendukung penuh JPEG, JPG, PNG, WEBP, dan foto kamera resolusi tinggi
  const decodeQrFromImageFile = async (file) => {
    // ── TIER 1: Native BarcodeDetector (Tersedia di Chrome, Edge, Chromium Android) ──
    // Hardware accelerated, native JPEG/JPG engine, tanpa ketergantungan DOM
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const bitmap = await createImageBitmap(file);
        const detected = await barcodeDetector.detect(bitmap);
        if (detected && detected.length > 0 && detected[0].rawValue) {
          return detected[0].rawValue;
        }
      } catch (nativeErr) {
        console.warn("Native BarcodeDetector coba fallback:", nativeErr);
      }
    }

    // ── TIER 2: Dedicated Html5Qrcode Instance (Isolated DOM Element) ──
    const fileReaderElementId = "ar-qr-file-dedicated-reader";
    let fileHelperEl = document.getElementById(fileReaderElementId);
    if (!fileHelperEl) {
      fileHelperEl = document.createElement("div");
      fileHelperEl.id = fileReaderElementId;
      fileHelperEl.style.position = "absolute";
      fileHelperEl.style.width = "200px";
      fileHelperEl.style.height = "200px";
      fileHelperEl.style.top = "-9999px";
      fileHelperEl.style.left = "-9999px";
      fileHelperEl.style.opacity = "0";
      fileHelperEl.style.pointerEvents = "none";
      document.body.appendChild(fileHelperEl);
    }

    const fileScanner = new Html5Qrcode(fileReaderElementId);

    // Coba scan file asli terlebih dahulu
    try {
      const decodedText = await fileScanner.scanFile(file, false);
      try { await fileScanner.clear(); } catch (e) { }
      if (decodedText) return decodedText;
    } catch (directErr) {
      console.warn("Direct scan coba normalisasi canvas JPEG:", directErr);
    }

    // ── TIER 3: Canvas Downscaling & Contrast Normalization untuk Foto Smartphone (Resolusi Tinggi) ──
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);

      img.onload = async () => {
        try {
          URL.revokeObjectURL(objUrl);
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          // Tambahkan quiet zone (border putih) 28px agar finder pattern QR di sudut terbaca sempurna
          const padding = 28;
          const canvas = document.createElement("canvas");
          canvas.width = w + padding * 2;
          canvas.height = h + padding * 2;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, padding, padding, w, h);

          // Coba deteksi langsung dari canvas dengan padding via BarcodeDetector
          if (typeof window !== "undefined" && "BarcodeDetector" in window) {
            try {
              const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
              const codes = await detector.detect(canvas);
              if (codes && codes.length > 0 && codes[0].rawValue) {
                try { await fileScanner.clear(); } catch (e) { }
                resolve(codes[0].rawValue);
                return;
              }
            } catch (err) { }
          }

          canvas.toBlob(async (blob) => {
            if (!blob) {
              try { await fileScanner.clear(); } catch (e) { }
              reject(new Error("Gagal memproses canvas gambar."));
              return;
            }
            try {
              const optFile = new File([blob], "normalized.jpg", { type: "image/jpeg" });
              const resText = await fileScanner.scanFile(optFile, false);
              try { await fileScanner.clear(); } catch (e) { }
              resolve(resText);
            } catch (canvasScanErr) {
              try { await fileScanner.clear(); } catch (e) { }
              reject(new Error("QR code tidak terdeteksi pada gambar JPEG ini."));
            }
          }, "image/jpeg", 0.92);
        } catch (procErr) {
          try { await fileScanner.clear(); } catch (e) { }
          reject(procErr);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        try { fileScanner.clear(); } catch (e) { }
        reject(new Error("Format file gambar tidak dapat dibuka atau file rusak."));
      };

      img.src = objUrl;
    });
  };

  // Unggah foto QR dari file/galeri (Mendukung penuh format JPEG, JPG, PNG, WEBP)
  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      setCameraStatus("Menganalisis file gambar QR (JPEG/PNG)...");
      const decodedText = await decodeQrFromImageFile(file);
      if (decodedText) {
        await onQrCodeSuccess(decodedText);
      } else {
        throw new Error("QR code tidak terdeteksi.");
      }
    } catch (err) {
      showToast("QR Code tidak terdeteksi di gambar ini. Pastikan gambar JPEG/PNG jelas dan pola QR terlihat.", "error");
      setCameraStatus("Gagal membaca QR dari file gambar.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Load detail perangkat dan peta slot
  const loadDeviceContext = async (devId) => {
    setLoadingDevice(true);
    setCurrentDeviceId(devId);
    setHighlightedSlotId(null);
    setActiveSlotPopup(null);
    setSearchResult(null);
    setSearchQuery("");
    setSelectedSlotForAction(null);
    setRotX(0); // Selalu reset menghadap depan saat perangkat dimuat/di-scan
    setRotY(0);
    setZoomLevel(1.0);

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
    setActiveSlotPopup(null);
    setSearchResult(null);
    setSearchQuery("");
    setSelectedSlotForAction(null);
    setRotX(0);
    setRotY(0);
    setZoomLevel(1.0);

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
        setRotX(0); // Pastikan menghadap depan saat modul/slot ditemukan
        setRotY(0);
        const matchingSlot = slots.find((s) => s.slot_definition_id === data.highlight_slot_id);
        if (matchingSlot) {
          setSelectedSlotForAction(matchingSlot);
        } else if (data.slot) {
          setSelectedSlotForAction({
            slot_definition_id: data.highlight_slot_id,
            nomor_slot: data.slot.nomor_slot,
            nama_slot: data.slot.nama_slot,
            occupied: !!data.module,
            module: data.module,
          });
        }
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
    setSearchQuery(String(slot.nomor_slot));
    setHighlightedSlotId(slot.slot_definition_id);
    setRotX(0);
    setRotY(0);

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

  // Navigasi langsung ke Catat Mutasi Modul dengan pre-fill otomatis
  const handleNavigateToMutation = (slot, actionType = "pindah") => {
    if (!currentDevice) return;
    const cleanSlotNo = slot.nomor_slot || "";
    const devId = currentDevice.device_id || "";
    const devName = currentDevice.hostname || currentDevice.nama_perangkat || "";
    const locName = currentDevice.lokasi || (currentDevice.location && currentDevice.location.nama_lokasi) || "";

    const params = new URLSearchParams();
    params.set("open_modal", "1");
    params.set("action", actionType);
    params.set("device_id", String(devId));
    params.set("device_name", devName);
    if (locName) params.set("location_name", locName);
    params.set("slot_no", String(cleanSlotNo));
    if (slot.slot_definition_id) {
      params.set("slot_id", String(slot.slot_definition_id));
    }

    if (slot.module) {
      if (slot.module.modul_id) params.set("module_id", String(slot.module.modul_id));
      if (slot.module.serial_number) params.set("sn", String(slot.module.serial_number));
      if (slot.module.tipe) params.set("unit_type", String(slot.module.tipe));
      if (slot.module.kondisi) params.set("kondisi", String(slot.module.kondisi));
    }

    window.location.href = `/modules/requests?${params.toString()}`;
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

  const handle3DTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      isDragging3D.current = true;
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handle3DTouchMove = (e) => {
    if (!isDragging3D.current || imuActive || !e.touches || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    setRotY((prev) => Math.max(-50, Math.min(50, prev + dx * 0.4)));
    setRotX((prev) => Math.max(-35, Math.min(35, prev - dy * 0.4)));
  };

  const handle3DTouchEnd = () => {
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
    <div className="flex flex-col space-y-6 w-full animate-fadeIn min-h-[calc(100vh-112px)] pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-2xl transition-all duration-300 animate-slideIn ${toast.type === "success"
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
        className={`relative overflow-hidden rounded-2xl border px-5 sm:px-6 h-[120px] min-h-[120px] max-h-[120px] flex items-center justify-between transition-all duration-300 shadow-sm !mt-0 shrink-0 ${isDark
            ? "border-[#1E3A5F] bg-gradient-to-r from-[#071426] via-[#0D2341] to-[#0A182B] shadow-2xl shadow-blue-950/60"
            : "border-blue-200 bg-gradient-to-r from-white via-blue-50 to-white shadow-md shadow-blue-100/80"
          }`}
        style={{ marginTop: 0, height: "120px", minHeight: "120px", maxHeight: "120px" }}
      >
        <div className="absolute -top-16 -left-16 w-80 h-80 bg-blue-500/30 dark:bg-blue-600/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-cyan-500/20 dark:bg-cyan-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/3 w-64 h-64 bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 w-full h-full">
          {/* Kiri: Icon Box + Teks */}
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
            <div
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border ${isDark
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
                  className={`text-xl sm:text-2xl font-bold tracking-tight !m-0 ${isDark ? "text-white" : "text-slate-900"
                    }`}
                >
                  AR Scan Perangkat
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${isDark
                      ? "bg-[#0A284D] text-[#38BDF8] border-[#18467A]"
                      : "bg-blue-50 text-blue-600 border-blue-200"
                    }`}
                >
                  FR-12 Digital Twin
                </span>
              </div>
              <p
                className={`text-xs font-normal mt-0.5 leading-relaxed !m-0 ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
              >
                Hierarki Spasial: Pindai QR Lokasi Ruang STO atau QR Rak untuk inspeksi slot digital twin.
              </p>
            </div>
          </div>



          {/* Kanan: Badge Jumlah Perangkat */}
          <div className="hidden sm:flex shrink-0 items-center gap-2.5">
            <div
              className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 ${isDark
                  ? "bg-[#0D1F36] border-[#1E3A5F] text-[#38BDF8]"
                  : "bg-blue-50 border-blue-200 text-blue-700"
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">devices</span>
              <span>{devicesList.length} Perangkat</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* GRID UTAMA: VIEWFINDER SCANNER (KIRI) & DIGITAL TWIN     */}
      {/* ======================================================== */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[540px]">
        {/* ============================================== */}
        {/* KOLOM KIRI: KAMERA AR VIEWFINDER HUD (5 COL)   */}
        {/* ============================================== */}
        <div
          className={`lg:col-span-5 rounded-2xl border p-5 shadow-lg transition-all duration-300 flex flex-col justify-between h-full ${isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
            }`}
        >
          {/* Wrapper Konten Atas Viewfinder */}
          <div className="flex flex-col">
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
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${isDark
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
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${isDark
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
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
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

          </div>

          {/* Custom Filter Dropdown: Pilih Rak Perangkat Langsung (Sesuai Desain Gambar 1) */}
          <div className="mt-auto pt-4 border-t border-[#1A2E4C]/50">
            <label className={`block text-xs font-semibold mb-2 ${isDark ? "text-[#CBD5E1]" : "text-slate-700"}`}>
              Atau Pilih Rak Perangkat Langsung:
            </label>
            <div className="flex gap-2 min-w-0">
              {/* Custom Dropdown Trigger & Panel */}
              <div className="relative flex-1 min-w-0" ref={deviceDropdownRef}>
                <button
                  type="button"
                  onClick={() => setDeviceDropdownOpen(!deviceDropdownOpen)}
                  className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium transition-all duration-200 cursor-pointer ${deviceDropdownOpen
                      ? isDark
                        ? "bg-[#0A182B] border-[#1677FF] ring-2 ring-[#1677FF]/25 text-[#E6EDF7]"
                        : "bg-white border-[#1677FF] ring-2 ring-[#1677FF]/20 text-slate-900"
                      : isDark
                        ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                        : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500"
                    }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="material-symbols-outlined text-[18px] text-[#38BDF8] shrink-0">
                      desktop_windows
                    </span>
                    <span className="truncate font-semibold">
                      {currentDevice ? currentDevice.nama_perangkat : "Semua Perangkat"}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${deviceDropdownOpen ? "rotate-180" : ""
                      }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Custom Filter Dropdown Menu (Konsisten dengan Gambar 1) */}
                {deviceDropdownOpen && (
                  <div
                    className={`absolute left-0 top-12 mt-1.5 w-full min-w-full rounded-xl border shadow-2xl p-1.5 z-50 max-h-64 overflow-y-auto custom-scrollbar backdrop-blur-md animate-dropdown ${isDark
                        ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                        : "bg-white border-slate-200 text-slate-800 shadow-xl"
                      }`}
                    style={{
                      backgroundColor: isDark ? "#0A182B" : "#FFFFFF",
                      borderColor: isDark ? "#1E3A5F" : "#E2E8F0",
                    }}
                  >
                    {/* Option: Semua Perangkat (Default / Reset Pilihan) */}
                    <button
                      type="button"
                      onClick={() => {
                        handleScanAnotherDevice();
                        setDeviceDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${!currentDeviceId
                          ? isDark
                            ? "bg-[#1677FF] text-white font-semibold"
                            : "bg-blue-600 text-white font-semibold"
                          : isDark
                            ? "hover:bg-[#122846] text-[#CBD5E1]"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                    >
                      <span>Semua Perangkat</span>
                      {!currentDeviceId && (
                        <span className="material-symbols-outlined text-[16px] shrink-0">check</span>
                      )}
                    </button>

                    <div className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"}`} />

                    {/* Device Options from DB */}
                    {devicesList.map((dev) => {
                      const isSelected = currentDeviceId === dev.device_id;
                      return (
                        <button
                          key={dev.device_id}
                          type="button"
                          onClick={() => {
                            loadDeviceContext(dev.device_id);
                            setDeviceDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${isSelected
                              ? isDark
                                ? "bg-[#1677FF] text-white font-semibold"
                                : "bg-blue-600 text-white font-semibold"
                              : isDark
                                ? "hover:bg-[#122846] text-[#CBD5E1]"
                                : "hover:bg-slate-100 text-slate-700"
                            }`}
                        >
                          <div className="flex flex-col truncate pr-2">
                            <span className="font-semibold">{dev.nama_perangkat}</span>
                            <span
                              className={`text-[10px] ${isSelected
                                  ? "text-blue-100"
                                  : isDark
                                    ? "text-[#64748B]"
                                    : "text-slate-400"
                                }`}
                            >
                              {dev.lokasi}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[16px] shrink-0">
                              check
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {currentDeviceId && (
                <button
                  type="button"
                  onClick={handleScanAnotherDevice}
                  title="Reset & Pindai Ulang"
                  className={`h-11 px-3.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer ${isDark
                      ? "bg-[#0A182B] border-[#1E3A5F] text-[#38BDF8] hover:bg-[#122846] hover:border-[#1677FF]"
                      : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span className="hidden sm:inline">Scan Ulang</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* KOLOM KANAN: DIGITAL TWIN RAK & PETA SLOT AR (7 COL)     */}
        {/* ======================================================== */}
        <div
          className={`lg:col-span-7 rounded-2xl border p-6 shadow-lg transition-all duration-300 flex flex-col h-full ${isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
            }`}
        >
          {loadingDevice ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center my-auto">
              <span className="material-symbols-outlined text-[40px] text-[#38BDF8] animate-spin">progress_activity</span>
              <p className={`text-sm mt-3 font-semibold ${isDark ? "text-[#E6EDF7]" : "text-slate-800"}`}>
                Memuat spesifikasi rak & peta slot chassis...
              </p>
            </div>
          ) : currentDevice ? (
            <div className="flex-1 flex flex-col justify-between space-y-5">
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
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${isDark ? "bg-[#0B2A4A] text-[#38BDF8] border-[#164477]" : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                    >
                      {currentDevice.tipe}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${isDark ? "bg-[#071426] text-[#CBD5E1] border-[#1E3A5F]" : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                    >
                      <span className="material-symbols-outlined text-[13px] text-rose-400">location_on</span>
                      {currentDevice.lokasi}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${isDark ? "bg-[#071426] text-[#94A3B8] border-[#1E3A5F]" : "bg-slate-100 text-slate-600 border-slate-200"
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${rackViewMode === "2d"
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${rackViewMode === "3d"
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
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${searchMode === "sn"
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
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${searchMode === "slot"
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
                      className={`w-full h-11 pl-10 pr-4 rounded-xl text-xs transition-all focus:outline-none ${isDark
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
                      className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${searchResult.reason === "wrong_device" || searchResult.reason === "not_installed"
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
                      className={`p-4 rounded-xl border transition-all ${isDark ? "bg-[#071426] border-[#1E3A5F]" : "bg-slate-50 border-slate-300"
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
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${searchResult.module.kondisi?.toLowerCase() === "baik" ||
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
                            className={`font-semibold ${searchResult.slot?.status === "KOSONG" ? "text-emerald-400" : "text-rose-400"
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
                /* ── 3D ISOMETRIC CHASSIS VIEWPORT (ANTI-GEPENG) ── */
                <div className="space-y-3 animate-fadeIn">
                  {/* Toolbar Kontrol 3D */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[18px] ${isDark ? "text-[#00E5FF]" : "text-[#1677FF]"}`}>
                        view_in_ar
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        3D Digital Twin Sub-Rack (Nokia 1830 PSS-24x)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Presets Sudut Pandang */}
                      <div className={`flex items-center gap-1 p-0.5 rounded-lg border transition-colors ${
                        isDark ? "bg-[#050D1A] border-[#1E3A5F]" : "bg-slate-100 border-slate-300 shadow-sm"
                      }`}>
                        <button
                          type="button"
                          onClick={() => { setRotX(0); setRotY(0); setZoomLevel(1.0); }}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                            rotX === 0 && rotY === 0
                              ? "bg-[#1677FF] text-white shadow-sm font-bold"
                              : isDark
                                ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white"
                          }`}
                          title="Tampak Depan Lurus (Tegak)"
                        >
                          ⏹️ Depan
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRotX(14); setRotY(-22); setZoomLevel(1.0); }}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                            rotX === 14 && rotY === -22
                              ? "bg-[#1677FF] text-white shadow-sm font-bold"
                              : isDark
                                ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white"
                          }`}
                          title="Tampak Sudut Isometrik 3D"
                        >
                          📐 Isometrik
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRotX(6); setRotY(-42); setZoomLevel(1.0); }}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                            rotY === -42
                              ? "bg-[#1677FF] text-white shadow-sm font-bold"
                              : isDark
                                ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white"
                          }`}
                          title="Tampak Miring Kiri"
                        >
                          ◀️ Kiri
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRotX(6); setRotY(42); setZoomLevel(1.0); }}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                            rotY === 42
                              ? "bg-[#1677FF] text-white shadow-sm font-bold"
                              : isDark
                                ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white"
                          }`}
                          title="Tampak Miring Kanan"
                        >
                          ▶️ Kanan
                        </button>
                      </div>

                      {/* Zoom Controls */}
                      <div className={`flex items-center gap-1 p-0.5 rounded-lg border transition-colors ${
                        isDark ? "bg-[#050D1A] border-[#1E3A5F]" : "bg-slate-100 border-slate-300 shadow-sm"
                      }`}>
                        <button
                          type="button"
                          onClick={() => setZoomLevel((prev) => Math.min(1.4, prev + 0.1))}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-600 hover:text-slate-900 hover:bg-white"
                          }`}
                          title="Perbesar Zoom"
                        >
                          <span className="material-symbols-outlined text-[15px]">zoom_in</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomLevel((prev) => Math.max(0.65, prev - 0.1))}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-600 hover:text-slate-900 hover:bg-white"
                          }`}
                          title="Perkecil Zoom"
                        >
                          <span className="material-symbols-outlined text-[15px]">zoom_out</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRotX(0); setRotY(0); setZoomLevel(1.0); }}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-600 hover:text-slate-900 hover:bg-white"
                          }`}
                          title="Reset Tampak Depan & Zoom"
                        >
                          <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                        </button>
                      </div>

                      {/* Toggle Sensor IMU Gyroscope */}
                      <button
                        type="button"
                        onClick={() => setImuActive(!imuActive)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          imuActive
                            ? isDark
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                              : "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold shadow-sm shadow-emerald-500/20"
                            : isDark
                              ? "bg-[#071426] border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:bg-[#0D1F36]"
                              : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-white hover:text-slate-900 hover:border-slate-400 shadow-sm"
                        }`}
                        title="Gunakan Sensor Gyroscope Smartphone (IMU Parallax)"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {imuActive ? "sensors" : "sensors_off"}
                        </span>
                        <span>{imuActive ? "IMU Aktif" : "Sensor IMU"}</span>
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
                    onTouchStart={handle3DTouchStart}
                    onTouchMove={handle3DTouchMove}
                    onTouchEnd={handle3DTouchEnd}
                    onTouchCancel={handle3DTouchEnd}
                    className="relative w-full min-h-[520px] rounded-2xl overflow-hidden border border-[#1E3A5F] bg-gradient-to-b from-[#030712] via-[#071324] to-[#0A1A2F] flex items-center justify-center cursor-grab active:cursor-grabbing select-none p-4 sm:p-8"
                    style={{ perspective: "1400px" }}
                  >
                    {/* Grid Background Ambient Wireframe */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        backgroundImage: "radial-gradient(#00E5FF 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                      }}
                    />

                    {/* HUD Telemetry Overlay di Atas 3D */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-[#38BDF8] pointer-events-none z-30">
                      <div className="flex items-center gap-2 bg-black/70 px-2.5 py-1 rounded-md border border-[#00E5FF]/20 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
                        <span className="font-bold">
                          ISOMETRIC 3D CHASSIS (DEPTH: 350mm)
                        </span>
                      </div>
                      <div className="bg-black/70 px-2.5 py-1 rounded-md border border-[#00E5FF]/20 backdrop-blur-sm">
                        ROT: X {Math.round(rotX)}° | Y {Math.round(rotY)}° {imuActive && `| IMU: P${imuData.pitch} R${imuData.roll}`}
                      </div>
                    </div>

                    {/* Instruksi Drag di Bawah */}
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[10px] text-[#94A3B8] pointer-events-none z-30 bg-black/60 px-3.5 py-1 rounded-full border border-slate-700/50 backdrop-blur-sm">
                      {imuActive ? "📡 Miringkan smartphone untuk mengubah perspektif" : "🖱️ Tahan & geser untuk rotasi orbit 3D • Klik bilah slot untuk inspeksi"}
                    </div>

                    {/* Kontainer Rak 3D (Preserve 3D) */}
                    <div
                      className="transition-transform duration-100 ease-out py-8"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: `scale(${zoomLevel}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                      }}
                    >
                      {/* SUBRACK CHASSIS BOX */}
                      <div
                        className="relative"
                        style={{
                          width: "clamp(340px, 94vw, 610px)",
                          transformStyle: "preserve-3d",
                        }}
                      >
                        {/* ── 3D DEPTH WALLS (EXTRUSION) ANTI-GEPENG ── */}
                        {/* Top Roof Wall (Dinding Atas) */}
                        <div
                          className="absolute top-0 left-0 right-0 h-[110px] pointer-events-none rounded-t"
                          style={{
                            transformOrigin: "top",
                            transform: "rotateX(90deg) translateY(-110px)",
                            background: "linear-gradient(to bottom, #1E293B, #0B1324)",
                            border: "1px solid #334155",
                            boxShadow: "inset 0 0 30px rgba(0,0,0,0.8)",
                          }}
                        >
                          <div className="w-full h-full p-2 flex items-center justify-around opacity-30">
                            <div className="w-20 h-4 border border-slate-600 rounded bg-slate-900" />
                            <div className="w-20 h-4 border border-slate-600 rounded bg-slate-900" />
                            <div className="w-20 h-4 border border-slate-600 rounded bg-slate-900" />
                          </div>
                        </div>

                        {/* Bottom Floor Wall (Dinding Bawah) */}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-[110px] pointer-events-none rounded-b"
                          style={{
                            transformOrigin: "bottom",
                            transform: "rotateX(-90deg) translateY(110px)",
                            background: "linear-gradient(to top, #0A0F1D, #020617)",
                            border: "1px solid #1E293B",
                            boxShadow: "inset 0 0 30px rgba(0,0,0,0.9)",
                          }}
                        />

                        {/* Left Side Wall (Dinding Samping Kiri) */}
                        <div
                          className="absolute top-0 bottom-0 left-0 w-[110px] pointer-events-none rounded-l"
                          style={{
                            transformOrigin: "left",
                            transform: "rotateY(-90deg) translateX(-110px)",
                            background: "linear-gradient(to right, #0F172A, #1E293B)",
                            border: "1px solid #334155",
                            boxShadow: "inset 0 0 30px rgba(0,0,0,0.85)",
                          }}
                        >
                          <div className="h-full w-full p-2 flex flex-col justify-between items-center opacity-70">
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-slate-800" title="Rack Mounting Hole" />
                            <div className="w-full border-t border-dashed border-slate-600/70 my-2" />
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-slate-800" />
                            <div className="w-full border-t border-dashed border-slate-600/70 my-2" />
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-slate-800" />
                          </div>
                        </div>

                        {/* Right Side Wall (Dinding Samping Kanan) */}
                        <div
                          className="absolute top-0 bottom-0 right-0 w-[110px] pointer-events-none rounded-r"
                          style={{
                            transformOrigin: "right",
                            transform: "rotateY(90deg) translateX(110px)",
                            background: "linear-gradient(to left, #0F172A, #1E293B)",
                            border: "1px solid #334155",
                            boxShadow: "inset 0 0 30px rgba(0,0,0,0.85)",
                          }}
                        >
                          <div className="h-full w-full p-2 flex flex-col justify-between items-center opacity-70">
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-slate-800" />
                            <div className="w-full border-t border-dashed border-slate-600/70 my-2" />
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-slate-800" />
                            <div className="w-full border-t border-dashed border-slate-600/70 my-2" />
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-slate-800" />
                          </div>
                        </div>

                        {/* Back Enclosure Wall (Backplane) */}
                        <div
                          className="absolute inset-0 pointer-events-none rounded-xl"
                          style={{
                            transform: "translateZ(-110px)",
                            background: "#050B14",
                            border: "2px solid #1E293B",
                            boxShadow: "0 0 60px rgba(0,0,0,0.9)",
                          }}
                        />

                        {/* ── SIDE CABLE RINGS (CINCIN KABEL SAMPING KIRI & KANAN) ── */}
                        {/* Left Cable Rings */}
                        <div
                          className="absolute -left-8 top-16 bottom-16 flex flex-col justify-between pointer-events-none z-20"
                          style={{ transform: "translateZ(15px)", transformStyle: "preserve-3d" }}
                        >
                          {[0, 1, 2, 3].map((ringIdx) => (
                            <div key={ringIdx} className="relative flex items-center">
                              <div
                                className="w-6 h-9 rounded-l-full border-2 border-slate-700/90 bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg flex items-center pl-1"
                                style={{ transform: "rotateY(-25deg)" }}
                              >
                                <div className="w-1.5 h-7 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B]" />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Right Cable Rings */}
                        <div
                          className="absolute -right-8 top-16 bottom-16 flex flex-col justify-between pointer-events-none z-20"
                          style={{ transform: "translateZ(15px)", transformStyle: "preserve-3d" }}
                        >
                          {[0, 1, 2, 3].map((ringIdx) => (
                            <div key={ringIdx} className="relative flex items-center justify-end">
                              <div
                                className="w-6 h-9 rounded-r-full border-2 border-slate-700/90 bg-gradient-to-l from-slate-900 to-slate-800 shadow-lg flex items-center justify-end pr-1"
                                style={{ transform: "rotateY(25deg)" }}
                              >
                                <div className="w-1.5 h-7 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B]" />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* ── FRONT FASCIA PANEL (MUKA DEPAN SASIS NOKIA PSS-24X) ── */}
                        <div
                          className="relative rounded-xl border-2 border-[#1E3A5F] bg-[#0A1628]/95 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-3"
                          style={{
                            transformStyle: "preserve-3d",
                            transform: "translateZ(2px)",
                          }}
                        >
                          {/* TOP HEADER: BRAND, DANGER/CAUTION LABELS & FIBER TROUGH */}
                          <div className="border-b-2 border-[#1E3A5F] pb-2 mb-2">
                            {/* Brand Row */}
                            <div className="flex items-center justify-between text-[11px] font-mono text-[#38BDF8] pb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-xs tracking-widest text-white px-2 py-0.5 rounded bg-blue-600 shadow-sm">
                                  NOKIA
                                </span>
                                <span className="font-bold text-xs text-slate-200">
                                  {currentDevice.tipe === "PSS24" || currentDevice.tipe?.includes("24")
                                    ? "1830 PSS-24x"
                                    : `${currentDevice.tipe} SHELF`}
                                </span>
                                <span className="text-[10px] text-slate-400 hidden sm:inline">&bull; Model 3HE08222AA</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10B981]" />
                                <span className="text-emerald-300 font-semibold hidden sm:inline">DUAL DC POWER OK</span>
                              </div>
                            </div>

                            {/* Warning Safety Badges */}
                            <div className="flex items-center gap-1.5 text-[9px] font-bold">
                              <div className="flex-1 px-2 py-0.5 rounded bg-rose-600/90 text-white border border-rose-400/50 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px] text-yellow-300">warning</span>
                                <span className="truncate uppercase tracking-wider">DANGER: INVISIBLE LASER RADIATION</span>
                              </div>
                              <div className="flex-1 px-2 py-0.5 rounded bg-amber-500/90 text-black border border-amber-300 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">bolt</span>
                                <span className="truncate uppercase tracking-wider">CAUTION: DUAL -48V DC FEEDS</span>
                              </div>
                            </div>

                            {/* Top Fiber Routing Trough Header */}
                            <div className="mt-1 px-2 py-0.5 rounded bg-black/60 border border-slate-800 flex items-center justify-between text-[8px] text-slate-400 font-mono">
                              <span>TOP FIBER MANAGEMENT TROUGH</span>
                              <div className="flex items-center gap-1">
                                <span className="w-10 h-1 rounded-full bg-amber-400/80 shadow-[0_0_4px_#F59E0B]" />
                                <span className="text-[7.5px] text-amber-300">PATCH CORDS</span>
                              </div>
                            </div>
                          </div>

                          {/* ── TIER 1: BARIS ATAS (SLOTS 1 - 16) ── */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 mb-1">
                              <span className="font-bold text-[#38BDF8] flex items-center gap-1">
                                <span>▲ TIER 1: BARIS ATAS</span>
                                <span className="text-slate-500 font-normal">(SLOT 01 - 16)</span>
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {topTierSlots.filter((s) => s.occupied).length}/{topTierSlots.length} Terpasang
                              </span>
                            </div>

                            {/* 16 Vertical Blade Slots Strip */}
                            <div className="flex gap-1 overflow-x-auto custom-scrollbar p-1.5 rounded-lg bg-[#050D1A] border border-[#1E3A5F]/80">
                              {topTierSlots.map((slot) => {
                                const isOccupied = slot.occupied;
                                const isHighlighted = slot.slot_definition_id === highlightedSlotId;
                                const cardModuleType = isOccupied ? slot.module?.tipe || "ACTIVE" : "EMPTY";

                                return (
                                  <div
                                    key={slot.slot_definition_id}
                                    id={`slot-item-${slot.slot_definition_id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSlotCardClick(slot);
                                      showSlotPopup(e, slot);
                                    }}
                                    onMouseEnter={(e) => showSlotPopup(e, slot)}
                                    onMouseLeave={() => hideSlotPopup(slot.slot_definition_id)}
                                    className={`group relative flex flex-col justify-between items-center rounded transition-all duration-300 cursor-pointer select-none border ${isHighlighted
                                        ? "bg-gradient-to-b from-amber-400 via-amber-300 to-amber-500 border-amber-200 shadow-[0_0_30px_#F59E0B] z-40 text-black font-extrabold ring-2 ring-amber-400"
                                        : isOccupied
                                          ? "bg-gradient-to-b from-[#1E293B] via-[#152033] to-[#0D1526] border-slate-700/80 hover:border-cyan-400/80 text-white shadow-sm hover:shadow-cyan-500/20"
                                          : "bg-[#091524]/60 border-dashed border-emerald-500/35 hover:border-emerald-400/90 text-emerald-300/80 hover:bg-emerald-500/10"
                                      }`}
                                    style={{
                                      width: "32px",
                                      minWidth: "32px",
                                      height: "145px",
                                      transformStyle: "preserve-3d",
                                      transform: isHighlighted ? "translateZ(38px) scale(1.08)" : "translateZ(8px)",
                                    }}
                                  >


                                    {/* Top Ejector Latch */}
                                    <div
                                      className={`w-full h-3 rounded-t flex items-center justify-center border-b ${isHighlighted
                                          ? "bg-amber-600/60 border-amber-700"
                                          : isOccupied
                                            ? "bg-gradient-to-b from-slate-700 to-slate-800 border-slate-900"
                                            : "bg-emerald-950/40 border-emerald-900/50"
                                        }`}
                                    >
                                      <div className={`w-3.5 h-1 rounded-sm ${isHighlighted ? "bg-black" : "bg-slate-400/60"}`} />
                                    </div>

                                    {/* Slot Number Label */}
                                    <div className="w-full text-center py-0.5">
                                      <span
                                        className={`text-[9px] font-mono font-bold leading-none block ${isHighlighted ? "text-black" : "text-slate-400"
                                          }`}
                                      >
                                        #{slot.nomor_slot}
                                      </span>
                                    </div>

                                    {/* Vertical Card Body */}
                                    <div className="flex-1 w-full flex flex-col items-center justify-center px-0.5 overflow-hidden">
                                      {isOccupied ? (
                                        <>
                                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00E5FF] mb-1 animate-pulse" />
                                          <span
                                            className={`text-[9px] font-mono font-black tracking-wider text-center leading-tight break-all uppercase ${isHighlighted ? "text-slate-950 font-black" : "text-cyan-300"
                                              }`}
                                            style={{
                                              writingMode: "vertical-rl",
                                              textOrientation: "mixed",
                                              maxHeight: "85px",
                                              textShadow: isHighlighted ? "none" : "0 0 4px rgba(0, 229, 255, 0.4)",
                                            }}
                                          >
                                            {cardModuleType}
                                          </span>
                                          <div className="w-2.5 h-3 mt-1.5 rounded-sm bg-black border border-slate-700 flex items-center justify-center">
                                            <div className="w-1 h-1 rounded-full bg-slate-500" />
                                          </div>
                                        </>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center h-full">
                                          <span className={`material-symbols-outlined text-[14px] ${isHighlighted ? "text-black font-black" : "text-emerald-400 font-bold"}`}>
                                            add
                                          </span>
                                          <span
                                            className={`text-[9px] font-mono font-black tracking-widest leading-none ${isHighlighted ? "text-black" : "text-emerald-300"
                                              }`}
                                            style={{
                                              writingMode: "vertical-rl",
                                              textOrientation: "mixed",
                                              textShadow: isHighlighted ? "none" : "0 0 5px rgba(16, 185, 129, 0.7)",
                                            }}
                                          >
                                            EMPTY
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Bottom Ejector Latch */}
                                    <div
                                      className={`w-full h-3 rounded-b flex items-center justify-center border-t ${isHighlighted
                                          ? "bg-amber-600/60 border-amber-700"
                                          : isOccupied
                                            ? "bg-gradient-to-t from-slate-700 to-slate-800 border-slate-900"
                                            : "bg-emerald-950/40 border-emerald-900/50"
                                        }`}
                                    >
                                      <div className={`w-3.5 h-1 rounded-sm ${isHighlighted ? "bg-black" : "bg-slate-400/60"}`} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* ── MID-CHASSIS STRUCTURAL DIVIDER ── */}
                          <div className="my-1.5 px-2 py-0.5 rounded bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-y border-slate-600 flex items-center justify-between text-[8px] font-mono text-slate-300">
                            <span>CROSS-CONNECT SWITCH MATRIX BRIDGE</span>
                            <span>BACKPLANE BUS</span>
                          </div>

                          {/* ── TIER 2: BARIS BAWAH (SLOTS 17 - 29) ── */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 mb-1">
                              <span className="font-bold text-[#38BDF8] flex items-center gap-1">
                                <span>▼ TIER 2: BARIS BAWAH</span>
                                <span className="text-slate-500 font-normal">(SLOT 17 - 29)</span>
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {bottomTierSlots.filter((s) => s.occupied).length}/{bottomTierSlots.length} Terpasang
                              </span>
                            </div>

                            {/* 13 Vertical Blade Slots Strip */}
                            <div className="flex gap-1 overflow-x-auto custom-scrollbar p-1.5 rounded-lg bg-[#050D1A] border border-[#1E3A5F]/80">
                              {bottomTierSlots.map((slot) => {
                                const isOccupied = slot.occupied;
                                const isHighlighted = slot.slot_definition_id === highlightedSlotId;
                                const cardModuleType = isOccupied ? slot.module?.tipe || "ACTIVE" : "EMPTY";

                                return (
                                  <div
                                    key={slot.slot_definition_id}
                                    id={`slot-item-${slot.slot_definition_id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSlotCardClick(slot);
                                      showSlotPopup(e, slot);
                                    }}
                                    onMouseEnter={(e) => showSlotPopup(e, slot)}
                                    onMouseLeave={() => hideSlotPopup(slot.slot_definition_id)}
                                    className={`group relative flex flex-col justify-between items-center rounded transition-all duration-300 cursor-pointer select-none border ${isHighlighted
                                        ? "bg-gradient-to-b from-amber-400 via-amber-300 to-amber-500 border-amber-200 shadow-[0_0_30px_#F59E0B] z-40 text-black font-extrabold ring-2 ring-amber-400"
                                        : isOccupied
                                          ? "bg-gradient-to-b from-[#1E293B] via-[#152033] to-[#0D1526] border-slate-700/80 hover:border-cyan-400/80 text-white shadow-sm hover:shadow-cyan-500/20"
                                          : "bg-[#091524]/60 border-dashed border-emerald-500/35 hover:border-emerald-400/90 text-emerald-300/80 hover:bg-emerald-500/10"
                                      }`}
                                    style={{
                                      width: "32px",
                                      minWidth: "32px",
                                      height: "135px",
                                      transformStyle: "preserve-3d",
                                      transform: isHighlighted ? "translateZ(38px) scale(1.08)" : "translateZ(8px)",
                                    }}
                                  >


                                    {/* Top Ejector Latch */}
                                    <div
                                      className={`w-full h-3 rounded-t flex items-center justify-center border-b ${isHighlighted
                                          ? "bg-amber-600/60 border-amber-700"
                                          : isOccupied
                                            ? "bg-gradient-to-b from-slate-700 to-slate-800 border-slate-900"
                                            : "bg-emerald-950/40 border-emerald-900/50"
                                        }`}
                                    >
                                      <div className={`w-3.5 h-1 rounded-sm ${isHighlighted ? "bg-black" : "bg-slate-400/60"}`} />
                                    </div>

                                    {/* Slot Number Label */}
                                    <div className="w-full text-center py-0.5">
                                      <span
                                        className={`text-[9px] font-mono font-bold leading-none block ${isHighlighted ? "text-black" : "text-slate-400"
                                          }`}
                                      >
                                        #{slot.nomor_slot}
                                      </span>
                                    </div>

                                    {/* Vertical Card Body */}
                                    <div className="flex-1 w-full flex flex-col items-center justify-center px-0.5 overflow-hidden">
                                      {isOccupied ? (
                                        <>
                                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00E5FF] mb-1 animate-pulse" />
                                          <span
                                            className={`text-[9px] font-mono font-black tracking-wider text-center leading-tight break-all uppercase ${isHighlighted ? "text-slate-950 font-black" : "text-cyan-300"
                                              }`}
                                            style={{
                                              writingMode: "vertical-rl",
                                              textOrientation: "mixed",
                                              maxHeight: "80px",
                                              textShadow: isHighlighted ? "none" : "0 0 4px rgba(0, 229, 255, 0.4)",
                                            }}
                                          >
                                            {cardModuleType}
                                          </span>
                                          <div className="w-2.5 h-3 mt-1.5 rounded-sm bg-black border border-slate-700 flex items-center justify-center">
                                            <div className="w-1 h-1 rounded-full bg-slate-500" />
                                          </div>
                                        </>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center h-full">
                                          <span className={`material-symbols-outlined text-[14px] ${isHighlighted ? "text-black font-black" : "text-emerald-400 font-bold"}`}>
                                            add
                                          </span>
                                          <span
                                            className={`text-[9px] font-mono font-black tracking-widest leading-none ${isHighlighted ? "text-black" : "text-emerald-300"
                                              }`}
                                            style={{
                                              writingMode: "vertical-rl",
                                              textOrientation: "mixed",
                                              textShadow: isHighlighted ? "none" : "0 0 5px rgba(16, 185, 129, 0.7)",
                                            }}
                                          >
                                            EMPTY
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Bottom Ejector Latch */}
                                    <div
                                      className={`w-full h-3 rounded-b flex items-center justify-center border-t ${isHighlighted
                                          ? "bg-amber-600/60 border-amber-700"
                                          : isOccupied
                                            ? "bg-gradient-to-t from-slate-700 to-slate-800 border-slate-900"
                                            : "bg-emerald-950/40 border-emerald-900/50"
                                        }`}
                                    >
                                      <div className={`w-3.5 h-1 rounded-sm ${isHighlighted ? "bg-black" : "bg-slate-400/60"}`} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* ── AUXILIARY SLOTS (JIKA ADA LEBIH DARI 29) ── */}
                          {otherSlots.length > 0 && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-[10px] font-mono px-1 mb-1">
                                <span className="font-bold text-[#38BDF8] flex items-center gap-1">
                                  <span>◆ AUXILIARY EXPANSION SLOTS</span>
                                  <span className="text-slate-400 font-normal">(SLOT 30+)</span>
                                </span>
                                <span className="text-[9px] text-[#38BDF8]/90 font-semibold">
                                  {otherSlots.filter((s) => s.occupied).length}/{otherSlots.length} Terpasang
                                </span>
                              </div>
                              <div className="flex gap-1 overflow-x-auto custom-scrollbar p-1.5 rounded-lg bg-[#050D1A] border border-[#1E3A5F]/70">
                                {otherSlots.map((slot) => {
                                  const isOccupied = slot.occupied;
                                  const isHighlighted = slot.slot_definition_id === highlightedSlotId;
                                  return (
                                    <div
                                      key={slot.slot_definition_id}
                                      id={`slot-item-${slot.slot_definition_id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSlotCardClick(slot);
                                        showSlotPopup(e, slot);
                                      }}
                                      onMouseEnter={(e) => showSlotPopup(e, slot)}
                                      onMouseLeave={() => hideSlotPopup(slot.slot_definition_id)}
                                      className={`px-2.5 py-1.5 rounded text-center cursor-pointer border text-[10px] font-mono font-bold transition-all ${isHighlighted
                                          ? "bg-amber-400 text-black border-amber-300 font-extrabold shadow-[0_0_12px_#F59E0B]"
                                          : isOccupied
                                            ? "bg-slate-800 text-cyan-200 border-slate-600 hover:border-cyan-400 hover:text-white"
                                            : "bg-emerald-950/60 text-emerald-300 border-emerald-600/80 hover:border-emerald-400"
                                        }`}
                                    >
                                      #{slot.nomor_slot}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* ── BOTTOM FOOTER: AIR INTAKE & ESD GROUND ── */}
                          <div className="border-t-2 border-[#1E3A5F] pt-2 flex items-center justify-between text-[9px] font-mono">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col gap-0.5 w-20">
                                <div className="w-full h-0.5 bg-slate-700 rounded" />
                                <div className="w-full h-0.5 bg-slate-700 rounded" />
                                <div className="w-full h-0.5 bg-slate-700 rounded" />
                              </div>
                              <span className="text-[8px] text-slate-400">COOLING AIR INTAKE</span>
                            </div>

                            <div className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 flex items-center gap-1 font-bold">
                              <span className="material-symbols-outlined text-[11px]">bolt</span>
                              <span>ESD GROUND STUD</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── TAMPILAN 2D MATRIX DENGAN SUSUNAN 2 TIER ── */
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

                  {/* Kontainer Slot 2D Berdasarkan 2 Tier */}
                  <div
                    className={`p-3.5 rounded-xl border flex-1 min-h-[280px] max-h-[500px] overflow-y-auto custom-scrollbar space-y-4 ${isDark ? "bg-[#071426] border-[#1A2E4C]" : "bg-slate-100 border-slate-200"
                      }`}
                  >
                    {normalizedSlots.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#94A3B8]">
                        Tidak ada definisi slot yang terdaftar untuk tipe perangkat ini.
                      </div>
                    ) : (
                      <>
                        {/* 2D Tier 1: Baris Atas */}
                        <div>
                          <div className="text-[11px] font-mono font-bold text-[#38BDF8] mb-2 flex items-center justify-between">
                            <span>▲ TIER 1: BARIS ATAS (SLOTS 1 - 16)</span>
                            <span className="text-slate-400 font-normal">
                              {topTierSlots.filter((s) => s.occupied).length}/{topTierSlots.length} Terpasang
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                            {topTierSlots.map((slot) => {
                              const isOccupied = slot.occupied;
                              const isHighlighted = slot.slot_definition_id === highlightedSlotId;

                              return (
                                <div
                                  key={slot.slot_definition_id}
                                  id={`slot-item-${slot.slot_definition_id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSlotCardClick(slot);
                                    showSlotPopup(e, slot);
                                  }}
                                  onMouseEnter={(e) => showSlotPopup(e, slot)}
                                  onMouseLeave={() => hideSlotPopup(slot.slot_definition_id)}
                                  className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all duration-200 relative select-none ${isHighlighted
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
                                    <span className="absolute -top-2 right-1 px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-amber-400 text-black uppercase tracking-wider shadow">
                                      PILIH
                                    </span>
                                  )}
                                  <div className={`font-bold text-xs ${isDark ? "text-white" : "text-slate-900"}`}>
                                    Slot {slot.nomor_slot}
                                  </div>
                                  <div
                                    className={`text-[10px] font-semibold mt-0.5 flex items-center justify-center gap-1 ${isOccupied ? "text-rose-400" : "text-emerald-400"
                                      }`}
                                  >
                                    <span>{isOccupied ? "🔴 Terisi" : "🟢 Kosong"}</span>
                                  </div>
                                  {isOccupied && slot.module ? (
                                    <div className="mt-1 pt-1 border-t border-[#1A2E4C]/40">
                                      <div
                                        className={`text-[10px] font-mono font-medium truncate ${isDark ? "text-[#E6EDF7]" : "text-slate-800"
                                          }`}
                                        
                                      >
                                        {slot.module.serial_number}
                                      </div>
                                      <div className="text-[9px] text-[#94A3B8] truncate">{slot.module.tipe}</div>
                                    </div>
                                  ) : (
                                    <div className="mt-1 text-[9px] text-emerald-400/80">Ready</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2D Tier 2: Baris Bawah */}
                        <div className="pt-2 border-t border-slate-700/50">
                          <div className="text-[11px] font-mono font-bold text-[#38BDF8] mb-2 flex items-center justify-between">
                            <span>▼ TIER 2: BARIS BAWAH (SLOTS 17 - 29)</span>
                            <span className="text-slate-400 font-normal">
                              {bottomTierSlots.filter((s) => s.occupied).length}/{bottomTierSlots.length} Terpasang
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                            {bottomTierSlots.map((slot) => {
                              const isOccupied = slot.occupied;
                              const isHighlighted = slot.slot_definition_id === highlightedSlotId;

                              return (
                                <div
                                  key={slot.slot_definition_id}
                                  id={`slot-item-${slot.slot_definition_id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSlotCardClick(slot);
                                    showSlotPopup(e, slot);
                                  }}
                                  onMouseEnter={(e) => showSlotPopup(e, slot)}
                                  onMouseLeave={() => hideSlotPopup(slot.slot_definition_id)}
                                  className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all duration-200 relative select-none ${isHighlighted
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
                                    <span className="absolute -top-2 right-1 px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-amber-400 text-black uppercase tracking-wider shadow">
                                      PILIH
                                    </span>
                                  )}
                                  <div className={`font-bold text-xs ${isDark ? "text-white" : "text-slate-900"}`}>
                                    Slot {slot.nomor_slot}
                                  </div>
                                  <div
                                    className={`text-[10px] font-semibold mt-0.5 flex items-center justify-center gap-1 ${isOccupied ? "text-rose-400" : "text-emerald-400"
                                      }`}
                                  >
                                    <span>{isOccupied ? "🔴 Terisi" : "🟢 Kosong"}</span>
                                  </div>
                                  {isOccupied && slot.module ? (
                                    <div className="mt-1 pt-1 border-t border-[#1A2E4C]/40">
                                      <div
                                        className={`text-[10px] font-mono font-medium truncate ${isDark ? "text-[#E6EDF7]" : "text-slate-800"
                                          }`}
                                        
                                      >
                                        {slot.module.serial_number}
                                      </div>
                                      <div className="text-[9px] text-[#94A3B8] truncate">{slot.module.tipe}</div>
                                    </div>
                                  ) : (
                                    <div className="mt-1 text-[9px] text-emerald-400/80">Ready</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2D Auxiliary Slots jika ada */}
                        {otherSlots.length > 0 && (
                          <div className={`pt-2 border-t ${isDark ? "border-slate-700/50" : "border-slate-300"}`}>
                            <div className={`text-[11px] font-mono font-bold mb-2 flex items-center gap-1.5 ${isDark ? "text-[#38BDF8]" : "text-blue-700 font-extrabold"}`}>
                              <span>◆ AUXILIARY EXPANSION SLOTS</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {otherSlots.map((slot) => {
                                const isOccupied = slot.occupied;
                                const isHighlighted = slot.slot_definition_id === highlightedSlotId;
                                return (
                                  <div
                                    key={slot.slot_definition_id}
                                    id={`slot-item-${slot.slot_definition_id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSlotCardClick(slot);
                                      showSlotPopup(e, slot);
                                    }}
                                    onMouseEnter={(e) => showSlotPopup(e, slot)}
                                    onMouseLeave={() => hideSlotPopup(slot.slot_definition_id)}
                                    className={`p-2.5 rounded-lg border text-center cursor-pointer text-xs font-bold transition-all ${
                                      isHighlighted
                                        ? "bg-amber-400 text-black border-amber-500 shadow-md font-extrabold"
                                        : isDark
                                          ? isOccupied
                                            ? "bg-slate-800 text-cyan-200 border-slate-700 hover:border-cyan-400"
                                            : "bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:border-emerald-500"
                                          : isOccupied
                                            ? "bg-white text-blue-900 border-slate-300 shadow-sm hover:border-blue-400"
                                            : "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm hover:border-emerald-500"
                                    }`}
                                  >
                                    Slot {slot.nomor_slot}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Call-to-Action Baris: Aksi Pemasangan / Mutasi Cepat */}
              {selectedSlotForAction && (
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 shadow-xl animate-slideIn ${selectedSlotForAction.occupied
                      ? isDark
                        ? "bg-gradient-to-r from-[#1B1226] via-[#1E1736] to-[#0A1628] border-purple-500/50 text-purple-200"
                        : "bg-purple-50 border-purple-300 text-purple-900 shadow-purple-500/10"
                      : isDark
                        ? "bg-gradient-to-r from-[#07241E] via-[#0A2E26] to-[#0B1E33] border-emerald-500/50 text-emerald-200"
                        : "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-emerald-500/10"
                    }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${selectedSlotForAction.occupied
                          ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                          : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        }`}
                    >
                      <span className="material-symbols-outlined text-[26px]">
                        {selectedSlotForAction.occupied ? "memory" : "add_box"}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2 flex-wrap min-w-0">
                        <span className={`shrink-0 ${isDark ? "text-white" : "text-slate-900 font-extrabold"}`}>
                          Slot #{selectedSlotForAction.nomor_slot}
                        </span>
                        <span
                          className={`shrink-0 text-xs px-3 py-1 rounded-full font-black uppercase border tracking-wide shadow-sm ${
                            selectedSlotForAction.occupied
                              ? isDark
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                : "bg-rose-100 text-rose-800 border-rose-300 font-extrabold"
                              : isDark
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                                : "bg-emerald-600 text-white border-emerald-700 font-extrabold shadow-md"
                          }`}
                        >
                          {selectedSlotForAction.occupied ? "🔴 Modul Terpasang" : "🟢 Slot Kosong (Ready)"}
                        </span>
                        <span className={`shrink-0 text-[11px] font-mono font-normal ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {parseInt(String(selectedSlotForAction.nomor_slot).replace(/[^\d.]/g, ""), 10) <= 16
                            ? "(Baris Atas)"
                            : "(Baris Bawah)"}
                        </span>
                      </div>
                      <div className={`text-xs mt-1.5 flex flex-nowrap items-center gap-x-2 overflow-hidden ${
                        isDark ? "text-slate-300" : "text-slate-800 font-semibold"
                      }`}>
                        {selectedSlotForAction.occupied ? (
                          <>
                            <span className="shrink-0">
                              SN:{" "}
                              <strong className={`font-mono ${isDark ? "text-amber-300" : "text-amber-700 font-black"}`}>
                                {selectedSlotForAction.module?.serial_number || "-"}
                              </strong>
                            </span>
                            <span className="shrink-0">&nbsp;•</span>
                            <span className="shrink-0">
                              Tipe: <strong className={isDark ? "text-white" : "text-slate-900 font-bold"}>{selectedSlotForAction.module?.tipe || "-"}</strong>
                            </span>
                            <span className="shrink-0">&nbsp;•</span>
                            <span className="shrink-0">
                              Kondisi: <span className="capitalize font-semibold">{selectedSlotForAction.module?.kondisi || "-"}</span>
                            </span>
                          </>
                        ) : (
                          <span className={isDark ? "text-emerald-200" : "text-emerald-950 font-bold text-xs"}>
                            ✨ Slot ini kosong dan siap dialokasikan untuk penempatan modul baru di STO.
                          </span>
                        )}
                      </div>

                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!selectedSlotForAction.occupied ? (
                      <button
                        type="button"
                        onClick={() => handleNavigateToMutation(selectedSlotForAction, "pasang")}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <span className="material-symbols-outlined text-[17px]">add_task</span>
                        <span>Ajukan Pasang di Slot Ini</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleNavigateToMutation(selectedSlotForAction, "pindah")}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#1677FF] to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[17px]">swap_horiz</span>
                        <span>Ajukan Mutasi / Lepas Modul Ini</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-auto py-12">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-[#071426] border border-[#1E3A5F] text-[#38BDF8] shadow-xl relative group">
                <div className="absolute inset-0 rounded-2xl bg-cyan-500/10 blur-xl pointer-events-none" />
                <span className="material-symbols-outlined text-[40px] text-[#00E5FF]">view_in_ar</span>
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className={`text-base sm:text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Menunggu Pemindaian QR Perangkat / Lokasi
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-[#94A3B8]" : "text-slate-400"}`}>
                  Pindai QR Code Ruang STO untuk memunculkan daftar perangkat, atau pilih nama perangkat secara langsung dari kolom sebelah kiri.
                </p>
              </div>
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
            className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${isDark ? "bg-[#0A182B] border-[#1E3A5F] text-white" : "bg-white border-slate-200 text-slate-900"
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
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDark
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
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${isDark ? "bg-[#0A182B] border-[#1E3A5F] text-white" : "bg-white border-slate-200 text-slate-900"
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

      {/* Floating Card Popup Slot (Persis Desain Dashboard RackSlotStatus) */}
      {activeSlotPopup && (
        <div
          id="ar-slot-floating-popup"
          className={`fixed z-50 pointer-events-auto transform -translate-x-1/2 ${
            slotPopupPos.isBelow ? "" : "-translate-y-full"
          } text-[11px] p-3 rounded-xl shadow-2xl border transition-all duration-150 min-w-[210px] max-w-[280px] animate-in fade-in zoom-in-95 ${
            isDark
              ? "bg-[#071426] border-[#38BDF8]/50 text-[#E6EDF7] shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
              : "bg-white border-blue-400 text-slate-800 shadow-xl"
          }`}
          style={{ left: `${slotPopupPos.x}px`, top: `${slotPopupPos.y}px` }}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-[#1E3A5F] mb-1.5">
            <span className="font-bold text-xs text-[#38BDF8]">
              Slot #{String(activeSlotPopup.nomor_slot ?? activeSlotPopup.slot_number ?? "").padStart(2, "0")}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                  activeSlotPopup.occupied
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                }`}
              >
                {activeSlotPopup.occupied ? "TERISI" : "KOSONG"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSlotPopup(null);
                }}
                className="text-slate-400 hover:text-white text-xs leading-none p-0.5 ml-1 transition-colors"
                title="Tutup"
              >
                ✕
              </button>
            </div>
          </div>
          {activeSlotPopup.occupied && activeSlotPopup.module ? (
            <div className="space-y-1 text-[10px]">
              <div>
                <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                  Serial No:{" "}
                </span>
                <span className="font-mono font-semibold">
                  {activeSlotPopup.module.serial_number || "-"}
                </span>
              </div>
              {activeSlotPopup.module.unit_part_number && (
                <div>
                  <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                    Part No:{" "}
                  </span>
                  <span className="font-mono">
                    {activeSlotPopup.module.unit_part_number}
                  </span>
                </div>
              )}
              <div>
                <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                  Tipe:{" "}
                </span>
                <span>
                  {activeSlotPopup.module.tipe || activeSlotPopup.module.unit_type || "Card Transmisi"}
                </span>
              </div>
              <div>
                <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                  Status:{" "}
                </span>
                <span className="text-emerald-400 font-semibold">
                  {activeSlotPopup.module.kondisi || "AKTIF"}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 italic">
              Slot belum terpasang modul
            </div>
          )}
        </div>
      )}
    </div>
  );
}
