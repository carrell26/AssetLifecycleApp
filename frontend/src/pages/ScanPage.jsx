import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { Html5Qrcode } from "html5-qrcode";
import qrDevice16 from "../assets/qr_device_16.png";
import qrDevice17 from "../assets/qr_device_17.png";

// ── SUBRACK AUTHENTIC SIDE WALL COMPONENT (TAMPAK SAMPING OTENTIK NOKIA 1830 PSS-24x) ──
// Exact height 560px (flush with front & rear bottom - no excess height)
// Exact screw pattern matching Gambar 2 (top 3, upper-mid 2, seam cluster 7, lower-mid 2, bottom 3, plus flange screws)
// Zero gaps, sealed corners, and solid mounting post
function SubrackSideWall({ side = "right" }) {
  const isRight = side === "right";

  // Reusable 3D Metallic Fastener Stud Component (Clean 3D Bolt without black dot)
  const FastenerStud = ({ size = 16 }) => (
    <svg
      viewBox="0 0 51 51"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        filter: "drop-shadow(0px 1px 1.5px rgba(0,0,0,0.5))",
      }}
      className="shrink-0 select-none block overflow-visible pointer-events-none"
    >
      {/* Outer Beveled Metallic Disc / Collar */}
      <circle cx="25.5" cy="25.5" r="12" fill="url(#subrackScrewOuter)" />
      {/* Recessed Inner Socket Cup */}
      <ellipse cx="25.5" cy="25.5" rx="5.5" ry="5.8" fill="url(#subrackScrewSocket)" />
      {/* Raised Center Button / Dome Core */}
      <ellipse cx="25.5" cy="25" rx="3.6" ry="3.8" fill="url(#subrackScrewCore)" />
      {/* Specular Highlight Glint */}
      <ellipse cx="24.5" cy="23.8" rx="1.2" ry="1.1" fill="#FFFFFF" opacity="0.95" />
    </svg>
  );

  return (
    <div
      className="absolute pointer-events-none select-none overflow-hidden"
      style={{
        width: "200px",
        height: "560px",
        top: "0px",
        left: isRight ? "540px" : "0px",
        transformOrigin: "left center",
        transform: isRight ? "translateZ(100px) rotateY(90deg)" : "translateZ(-100px) rotateY(-90deg)",
        transformStyle: "preserve-3d",
        backfaceVisibility: "visible",
        borderRadius: "0px",
        boxSizing: "border-box",
        background: isRight
          ? "linear-gradient(135deg, #CBD5E1 0%, #B8C4D1 25%, #94A3B8 55%, #7E8B9B 85%, #64748B 100%)"
          : "linear-gradient(225deg, #CBD5E1 0%, #B8C4D1 25%, #94A3B8 55%, #7E8B9B 85%, #64748B 100%)",
        borderLeft: isRight ? "none" : "2px solid #475569",
        borderRight: isRight ? "2px solid #475569" : "none",
        clipPath: isRight
          ? "polygon(0px 0px, 200px 88px, 200px 560px, 0px 560px)"
          : "polygon(0px 88px, 200px 0px, 200px 560px, 0px 560px)",
      }}
    >
      {/* SVG Definitions for 3D Screws / Fasteners matching Tampak Depan */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <radialGradient id="subrackScrewOuter" cx="40%" cy="38%" r="52%">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="35%" stopColor="#CBD5E1" />
            <stop offset="65%" stopColor="#94A3B8" />
            <stop offset="85%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#475569" />
          </radialGradient>
          <linearGradient id="subrackScrewSocket" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="30%" stopColor="#334155" />
            <stop offset="80%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <radialGradient id="subrackScrewCore" cx="38%" cy="32%" r="58%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#E2E8F0" />
            <stop offset="60%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>
        </defs>
      </svg>

      {/* Galvanized sheet metal hairline texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 3px)",
          opacity: 0.5,
        }}
      />

      {/* Top Sloped Beveled Flange SVG - perfectly aligns with slope with zero noise */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 200 560"
        preserveAspectRatio="none"
      >
        <line
          x1={isRight ? 0 : 200}
          y1={isRight ? 0 : 0}
          x2={isRight ? 200 : 0}
          y2={88}
          stroke="#475569"
          strokeWidth="3"
        />
        <line
          x1={isRight ? 0 : 200}
          y1={isRight ? 1.5 : 1.5}
          x2={isRight ? 200 : 0}
          y2={89.5}
          stroke="#E2E8F0"
          strokeWidth="1.2"
          opacity="0.9"
        />
      </svg>

      {/* ── BOTTOM STRUCTURAL BASE RAIL (REL DUDUKAN RAK BAJA GALVANIS OTENTIK - DIPERTAHANKAN SESUAI GAMBAR 2) ── */}
      <div
        className="absolute z-20 pointer-events-none border-t border-[#94A3B8]"
        style={{
          bottom: "0px",
          left: "0px",
          right: "0px",
          width: "200px",
          height: "28px",
          boxSizing: "border-box",
          background: "linear-gradient(to bottom, #7E8B9B 0%, #64748B 60%, #475569 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 35px",
        }}
      >
        {/* 2 Baut Dudukan Pondasi Sasis Bawah */}
        <FastenerStud size={16} />
        <FastenerStud size={16} />
      </div>
    </div>
  );
}

// ── 6 KUPING / FLIP-LOCK HITAM SISI KIRI & KANAN RAK (SESUAI FOTO ASLI PERANGKAT STO) ──
function SideCupingRail({ side = "left" }) {
  const isRight = side === "right";
  const renderCupingSVG = (layerSuffix) => (
    <svg
      viewBox="0 0 18 560"
      className="w-full h-full block overflow-visible"
      style={{ filter: "drop-shadow(1px 1.5px 2px rgba(0,0,0,0.65))" }}
    >
      <defs>
        <linearGradient id={`cuping-dark-${side}-${layerSuffix}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="25%" stopColor="#111827" />
          <stop offset="70%" stopColor="#090D16" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id={`cuping-cyl-${side}-${layerSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="30%" stopColor="#1E293B" />
          <stop offset="75%" stopColor="#05080F" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      {/* 1. Cuping Paling Atas (Pas di bawah dudukan / mount atas, ngunci section 1) */}
      <g transform="translate(0, 6)">
        <path
          d="M 18 0 L 15 0 L 4 2 L 4 9 L 7.5 10.5 L 7.5 15.5 L 4 17 L 4 24 L 15 26 L 18 26 Z"
          fill={`url(#cuping-dark-${side}-${layerSuffix})`}
          stroke="#020617"
          strokeWidth="0.6"
        />
        <line x1="15" y1="0.5" x2="15" y2="25.5" stroke="#475569" strokeWidth="0.7" opacity="0.8" />
        <line x1="5" y1="2.5" x2="5" y2="8.5" stroke="#64748B" strokeWidth="0.6" opacity="0.7" />
        <circle cx="9.5" cy="7.5" r="1.4" fill="#E2E8F0" stroke="#0F172A" strokeWidth="0.4" />
        <circle cx="9.5" cy="18.5" r="1.4" fill="#E2E8F0" stroke="#0F172A" strokeWidth="0.4" />
      </g>

      {/* 2. Cuping Ke-2 (Tengah atas, ngatur tinggi section ke-2) */}
      <g transform="translate(0, 35)">
        <path
          d="M 18 0 L 15 0 L 4 2 L 4 9 L 7.5 10.5 L 7.5 15.5 L 4 17 L 4 24 L 15 26 L 18 26 Z"
          fill={`url(#cuping-dark-${side}-${layerSuffix})`}
          stroke="#020617"
          strokeWidth="0.6"
        />
        <line x1="15" y1="0.5" x2="15" y2="25.5" stroke="#475569" strokeWidth="0.7" opacity="0.8" />
        <line x1="5" y1="2.5" x2="5" y2="8.5" stroke="#64748B" strokeWidth="0.6" opacity="0.7" />
        <circle cx="9.5" cy="7.5" r="1.4" fill="#E2E8F0" stroke="#0F172A" strokeWidth="0.4" />
        <circle cx="9.5" cy="18.5" r="1.4" fill="#E2E8F0" stroke="#0F172A" strokeWidth="0.4" />
      </g>

      {/* 3. Cuping Ke-3 (Section ke-3: Upper-mid curved flip-lock guide) */}
      <g transform="translate(0, 116)">
        <path
          d="M 18 1 L 7 0 C 4 0 2.5 2 2.5 5 L 2.5 16 C 2.5 19 4 21 7 21 L 18 20 Z"
          fill={`url(#cuping-cyl-${side}-${layerSuffix})`}
          stroke="#020617"
          strokeWidth="0.7"
        />
        <path d="M 4 3 C 6 1.5 13 1.5 16 2" fill="none" stroke="#64748B" strokeWidth="0.7" />
        <line x1="5.5" y1="4" x2="5.5" y2="17" stroke="#475569" strokeWidth="0.8" opacity="0.75" />
        <rect x="13.5" y="2" width="3" height="17" rx="0.5" fill="#0F172A" opacity="0.8" />
      </g>

      {/* 4. Cuping Ke-4 (Tengah / Midplane, multi-fin slotted flip-lock) */}
      <g transform="translate(0, 266)">
        <path d="M 17 0 L 7 4 L 4 8 L 17 8 Z" fill="#0F172A" stroke="#334155" strokeWidth="0.5" />
        <path d="M 17 4 L 6 8 L 3.5 12 L 17 12 Z" fill="#1E293B" stroke="#475569" strokeWidth="0.5" />
        <path d="M 17 8 L 5 12 L 3 16 L 17 16 Z" fill="#090D16" stroke="#334155" strokeWidth="0.5" />
        <path
          d="M 18 11 L 6 11 C 3.5 11 2 13 2 16 L 2 25 C 2 28 3.5 29.5 6 29.5 L 18 28.5 Z"
          fill={`url(#cuping-cyl-${side}-${layerSuffix})`}
          stroke="#020617"
          strokeWidth="0.7"
        />
        <line x1="5" y1="13" x2="5" y2="27" stroke="#64748B" strokeWidth="0.7" opacity="0.75" />
        <circle cx="5.5" cy="27" r="1.1" fill="#CBD5E1" opacity="0.9" />
        <rect x="14" y="12" width="2.8" height="15" rx="0.4" fill="#020617" opacity="0.85" />
      </g>

      {/* 5. Cuping Ke-5 (Tengah bawah, multi-fin slotted flip-lock) */}
      <g transform="translate(0, 414)">
        <path d="M 17 0 L 7 5 L 4 10 L 17 10 Z" fill="#0F172A" stroke="#334155" strokeWidth="0.5" />
        <path d="M 17 5 L 6 10 L 3.5 15 L 17 15 Z" fill="#1E293B" stroke="#475569" strokeWidth="0.5" />
        <path d="M 17 10 L 5 15 L 3 20 L 17 20 Z" fill="#090D16" stroke="#334155" strokeWidth="0.5" />
        <path
          d="M 18 15 L 6 15 C 3.5 15 2 17 2 20 L 2 31 C 2 34 3.5 35.5 6 35.5 L 18 34.5 Z"
          fill={`url(#cuping-cyl-${side}-${layerSuffix})`}
          stroke="#020617"
          strokeWidth="0.7"
        />
        <line x1="5" y1="17" x2="5" y2="33" stroke="#64748B" strokeWidth="0.7" opacity="0.75" />
        <rect x="14" y="16" width="2.8" height="17" rx="0.4" fill="#020617" opacity="0.85" />
      </g>

      {/* 6. Cuping Paling Bawah (Dekat kaki, ngunci section paling besar / paling bawah) */}
      <g transform="translate(0, 502)">
        <path
          d="M 18 34 L 5 36 L 2 41 L 5 48 L 15 47 L 18 45 Z"
          fill={`url(#cuping-dark-${side}-${layerSuffix})`}
          stroke="#020617"
          strokeWidth="0.7"
        />
        <line x1="5" y1="38" x2="14" y2="37" stroke="#64748B" strokeWidth="0.7" opacity="0.8" />
        <line x1="4.5" y1="42" x2="14" y2="41.5" stroke="#475569" strokeWidth="0.6" opacity="0.7" />
      </g>
    </svg>
  );

  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        width: "18px",
        height: "560px",
        top: "0px",
        left: isRight ? "538px" : "-16px",
        transform: isRight ? "translateZ(100px) scaleX(-1)" : "translateZ(100px)",
        transformStyle: "preserve-3d",
        backfaceVisibility: "visible",
      }}
      aria-hidden="true"
    >
      {/* Muka Depan Cuping (Z = +100px, selalu terlihat tunggal dari depan, samping, maupun belakang) */}
      <div
        className="absolute inset-0"
        style={{ transform: "translateZ(0px)", backfaceVisibility: "visible" }}
      >
        {renderCupingSVG("front")}
      </div>
    </div>
  );
}

export default function ScanPage({ user, searchValue, onSearchChange }) {
  const { isDark } = useTheme();

  // State perangkat & scanner
  const [devicesList, setDevicesList] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [slots, setSlots] = useState([]);
  const [sfpsBySlot, setSfpsBySlot] = useState({});
  const [loadingDevice, setLoadingDevice] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [isCameraStandby, setIsCameraStandby] = useState(true);
  const prevObsFrameRef = useRef(null);
  const [cameraFacing, setCameraFacing] = useState("environment"); // 'environment' or 'user'
  const [cameraStatus, setCameraStatus] = useState("Menyiapkan pemindai kamera...");
  const [cameraError, setCameraError] = useState(null);

  // Helper resolusi QR Code otentik STO 1 (ID 16) vs STO 2 (ID 17)
  const activeQrInfo = useMemo(() => {
    if (!currentDevice && !currentDeviceId) return null;
    const devId = parseInt(currentDeviceId || currentDevice?.device_id, 10);
    const hostname = String(currentDevice?.hostname || currentDevice?.nama_perangkat || "").toUpperCase();
    const lokasi = String(currentDevice?.lokasi || (currentDevice?.location && currentDevice?.location?.nama_lokasi) || "").toUpperCase();

    // STO Palu 1 (Device ID 16 - WN-24X-SUL-PAL11)
    if (devId === 16 || hostname.includes("PAL1") || lokasi.includes("PALU 1")) {
      return {
        deviceId: 16,
        qrImg: qrDevice16,
        deviceName: currentDevice?.nama_perangkat || "WN-24X-SUL-PAL11",
        locationName: "STO Palu 1",
        siteCode: "PLA",
        downloadName: "QR_Code_WN-24X-SUL-PAL11_STO_Palu_1.png",
      };
    }
    // STO Palu 2 (Device ID 17 - WN-24X-SUL-PAL21 / PAL211)
    if (devId === 17 || hostname.includes("PAL2") || lokasi.includes("PALU 2")) {
      return {
        deviceId: 17,
        qrImg: qrDevice17,
        deviceName: currentDevice?.nama_perangkat || "WN-24X-SUL-PAL211",
        locationName: "STO Palu 2",
        siteCode: "PLB",
        downloadName: "QR_Code_WN-24X-SUL-PAL211_STO_Palu_2.png",
      };
    }
    // Perangkat umum lainnya
    return {
      deviceId: devId,
      qrImg: `/device/${devId}/qr.png`,
      deviceName: currentDevice?.nama_perangkat || `Perangkat #${devId}`,
      locationName: currentDevice?.lokasi || "Lokasi STO",
      siteCode: "-",
      downloadName: `QR_Code_${devId}.png`,
    };
  }, [currentDevice, currentDeviceId]);

  // State pencarian & highlight slot
  const [searchMode, setSearchMode] = useState("sn"); // 'sn' or 'slot'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [highlightedSlotId, setHighlightedSlotId] = useState(null);
  const highlightedSlotIdRef = useRef(null);
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



  // Floating Card Popup Slot State (Sesuai Desain Gambar 2 / Dashboard RackSlotStatus)
  const [activeSlotPopup, setActiveSlotPopup] = useState(null);
  const [slotPopupPos, setSlotPopupPos] = useState({ x: 0, y: 0, isBelow: false });
  const hidePopupTimerRef = useRef(null);
  const activePopupSlotIdRef = useRef(null);

  // Horizontal Port Scroll State & Controller (Persis Gambar Mockup 8 Port User)
  const portScrollRef = useRef(null);
  const [portScrollState, setPortScrollState] = useState({ left: 0, width: 100, canScroll: false });

  const updatePortScrollState = useCallback(() => {
    const el = portScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 4) {
      setPortScrollState({ left: 0, width: 100, canScroll: false });
    } else {
      const thumbWidth = Math.max(12, Math.min(80, (el.clientWidth / el.scrollWidth) * 100));
      const scrollPct = (el.scrollLeft / maxScroll) * (100 - thumbWidth);
      setPortScrollState({ left: scrollPct, width: thumbWidth, canScroll: true });
    }
  }, []);

  const handleScrollPorts = (dir) => {
    const el = portScrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  // Helper kapasitas port modul optik
  const getCardPortCapacity = (unitType) => {
    if (!unitType) return 0;
    const ut = String(unitType).toUpperCase();
    if (ut.includes("8UC")) return 8;
    if (ut.includes("4UC")) return 4;
    if (ut.includes("2UC")) return 4; // 4 Port (2 Client QSFP28 + 2 Line CFP2-DCO)
    if (ut.includes("10AN")) return 10;
    if (ut.includes("30AN")) return 30;
    if (ut.includes("SC24")) return 0; // Central matrix switch fabric
    if (ut.includes("OSC") || ut.includes("CEC")) return 2; // Management ports
    if (ut.includes("FAN") || ut.includes("PF") || ut.includes("MFC") || ut.includes("TPSC")) return 0; // Cooling, power & utility
    if (ut.includes("SHELF") || ut.includes("CHASSIS") || ut.includes("SUBRACK")) return 0; // Rack frame / casing
    return 4;
  };

  // Helper untuk menghitung rincian port dan transceiver SFP (identik dengan page detail perangkat / ChassisSubrackModal)
  const getSlotPortInfo = (slot) => {
    if (!slot) return { total: 0, used: 0, remaining: 0, ports: [] };
    const card = slot.module;
    if (!slot.occupied && !card) {
      return { total: 0, used: 0, remaining: 0, ports: [] };
    }

    const unitType = card?.tipe || card?.unit_type || "";
    const total = getCardPortCapacity(unitType);
    if (total === 0) {
      return { total: 0, used: 0, remaining: 0, ports: [] };
    }

    const slotNumMatch = String(slot.nomor_slot ?? slot.slot_number ?? "").match(/\d+/);
    const slotNum = slotNumMatch ? slotNumMatch[0] : String(slot.nomor_slot ?? "");
    const rawNum = String(slot.nomor_slot ?? "");

    // Prioritaskan SFP dari slot.sfps (dari backend AR slots API), fallback ke sfpsBySlot (dari API /api/devices/:id)
    const dbSfps = (slot.sfps && slot.sfps.length > 0)
      ? slot.sfps
      : (sfpsBySlot[slotNum] || sfpsBySlot[rawNum] || []);

    const sfpByPortNum = {};
    const unnumberedSfps = [];

    dbSfps.forEach((s) => {
      const portRaw = String(s.port || "");
      const match = portRaw.match(/\d+/);
      if (match) {
        const pNum = parseInt(match[0], 10);
        sfpByPortNum[pNum] = s;
      } else {
        unnumberedSfps.push(s);
      }
    });

    const ports = [];
    let unnumberedIdx = 0;

    for (let pNum = 1; pNum <= total; pNum++) {
      const sfp = sfpByPortNum[pNum];
      if (sfp) {
        ports.push({
          port: sfp.port && sfp.port !== "-" ? (String(sfp.port).toLowerCase().startsWith("port") ? sfp.port : `Port ${sfp.port}`) : `Port ${pNum}`,
          type: sfp.tipe || sfp.unit_type || "Transceiver SFP",
          sn: sfp.serial_number ? `SN: ${sfp.serial_number}` : "-",
          partNumber: sfp.unit_part_number || "-",
          status: sfp.kondisi || "Aktif",
          isEmpty: false,
        });
      } else if (unnumberedIdx < unnumberedSfps.length) {
        const uSfp = unnumberedSfps[unnumberedIdx++];
        ports.push({
          port: uSfp.port && uSfp.port !== "-" ? (String(uSfp.port).toLowerCase().startsWith("port") ? uSfp.port : `Port ${uSfp.port}`) : `Port ${pNum}`,
          type: uSfp.tipe || uSfp.unit_type || "Transceiver SFP",
          sn: uSfp.serial_number ? `SN: ${uSfp.serial_number}` : "-",
          partNumber: uSfp.unit_part_number || "-",
          status: uSfp.kondisi || "Aktif",
          isEmpty: false,
        });
      } else {
        ports.push({
          port: `Port ${pNum}`,
          type: "Port Kosong",
          sn: "Tersedia untuk SFP Baru",
          partNumber: "-",
          status: "Tersedia",
          isEmpty: true,
        });
      }
    }

    const usedCount = ports.filter((p) => !p.isEmpty).length;
    const remainingCount = ports.filter((p) => p.isEmpty).length;

    return {
      total,
      used: usedCount,
      remaining: remainingCount,
      ports,
    };
  };

  const showSlotPopup = (e, slot) => {
    if (!e || !e.currentTarget) return;
    // Cancel any pending hide timer
    if (hidePopupTimerRef.current) {
      clearTimeout(hidePopupTimerRef.current);
      hidePopupTimerRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const popupW = 220;
    const popupH = 260;
    const halfWidth = popupW / 2;
    const clampX = Math.max(halfWidth + 4, Math.min(window.innerWidth - halfWidth - 4, rect.left + rect.width / 2));
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const isBelow = spaceAbove < popupH + 12 || spaceBelow > spaceAbove;
    let posY;
    if (isBelow) {
      posY = Math.min(rect.bottom + 6, window.innerHeight - popupH - 8);
    } else {
      posY = Math.max(8, rect.top - 6);
    }

    activePopupSlotIdRef.current = slot.slot_definition_id;
    setSlotPopupPos({ x: clampX, y: posY, isBelow });
    setActiveSlotPopup(slot);
  };

  const hideSlotPopup = (slotId) => {
    // Debounce hide - allow cursor to move from slot to popup
    if (hidePopupTimerRef.current) clearTimeout(hidePopupTimerRef.current);
    hidePopupTimerRef.current = setTimeout(() => {
      // Only hide if the popup still belongs to this slot
      if (activePopupSlotIdRef.current === slotId) {
        setActiveSlotPopup(null);
        activePopupSlotIdRef.current = null;
      }
      hidePopupTimerRef.current = null;
    }, 200);
  };

  const cancelPopupHide = () => {
    if (hidePopupTimerRef.current) {
      clearTimeout(hidePopupTimerRef.current);
      hidePopupTimerRef.current = null;
    }
  };

  const triggerPopupHide = () => {
    if (hidePopupTimerRef.current) clearTimeout(hidePopupTimerRef.current);
    hidePopupTimerRef.current = setTimeout(() => {
      setActiveSlotPopup(null);
      activePopupSlotIdRef.current = null;
      hidePopupTimerRef.current = null;
    }, 150);
  };

  // Click outside listener untuk menutup hover popup & melepaskan seleksi slot saat klik di mana pun
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isSlotClick = event.target.closest('[id^="slot-item-"]');
      const isFloatingPopupClick = event.target.closest("#ar-slot-floating-popup");
      const isActionCardClick = event.target.closest("#selected-slot-action-card");
      const isSearchBoxClick =
        event.target.closest("#search-result-box") ||
        event.target.closest("#scan-search-container") ||
        event.target.closest("form");
      const isModalClick = event.target.closest('[role="dialog"]') || event.target.closest(".modal-container");

      // Menutup floating hover popup jika kursor/klik di luar slot & popup
      if (!isSlotClick && !isFloatingPopupClick) {
        if (hidePopupTimerRef.current) clearTimeout(hidePopupTimerRef.current);
        setActiveSlotPopup(null);
        activePopupSlotIdRef.current = null;
      }

      // Melepaskan seleksi slot jika klik di mana pun di luar slot dan di luar action card
      if (!isSlotClick && !isActionCardClick && !isFloatingPopupClick && !isSearchBoxClick && !isModalClick) {
        if (hasDragged3D.current) {
          hasDragged3D.current = false;
          return;
        }
        setSelectedSlotForAction(null);
        setHighlightedSlotId(null);
        highlightedSlotIdRef.current = null;
        setSearchResult(null);
        setSearchQuery("");
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      if (hidePopupTimerRef.current) clearTimeout(hidePopupTimerRef.current);
    };
  }, []);

  // Update Port Scroll Track status saat slot berubah atau resize window
  useEffect(() => {
    if (selectedSlotForAction) {
      const timer = setTimeout(() => updatePortScrollState(), 80);
      return () => clearTimeout(timer);
    }
  }, [selectedSlotForAction, updatePortScrollState]);

  useEffect(() => {
    window.addEventListener("resize", updatePortScrollState);
    return () => window.removeEventListener("resize", updatePortScrollState);
  }, [updatePortScrollState]);
  const isDragging3D = useRef(false);
  const hasDragged3D = useRef(false);
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
        } else if (slot.occupied && slot.module && !existing.module) {
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

  // Map slot berdasarkan nomor slot (1-29) dan utilitas untuk grid presisi Nokia 1830 PSS-24x
  const slotMap = useMemo(() => {
    const map = {};
    normalizedSlots.forEach((slot) => {
      const match = String(slot.nomor_slot).match(/\d+/);
      const num = match ? parseInt(match[0], 10) : parseInt(slot.nomor_slot, 10);
      if (!isNaN(num)) {
        map[num] = slot;
      }
      const rawKey = String(slot.nomor_slot).toUpperCase().trim();
      map[rawKey] = slot;
    });
    return map;
  }, [normalizedSlots]);

  const getSlot = (num) => {
    const key = typeof num === "string" ? num.toUpperCase().trim() : String(num);
    return (
      slotMap[num] ||
      slotMap[key] || {
        slot_definition_id: `slot-def-${num}`,
        nomor_slot: num,
        nama_slot: `Slot ${num}`,
        occupied: false,
        module: null,
      }
    );
  };

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

  // Helper inspeksi frame video untuk menjaga tampilan standby terpusat tanpa kedipan frame mentah OBS idle
  const evaluateVideoStandby = (vid) => {
    if (!vid || vid.paused || vid.readyState < 2) return;
    try {
      const track = vid.srcObject?.getVideoTracks?.()[0];
      const label = String(track?.label || "").toLowerCase();
      if (label.includes("obs") || label.includes("virtual")) {
        const c = document.createElement("canvas");
        c.width = 48;
        c.height = 48;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(vid, 0, 0, 48, 48);
        const data = ctx.getImageData(0, 0, 48, 48).data;
        const hasPrevFrame = Boolean(prevObsFrameRef.current && prevObsFrameRef.current.length === data.length);
        let diff = 0;
        if (hasPrevFrame) {
          for (let i = 0; i < data.length; i += 16) {
            diff += Math.abs(data[i] - prevObsFrameRef.current[i]);
          }
          diff /= (data.length / 16);
        }
        prevObsFrameRef.current = new Uint8ClampedArray(data);

        const px = (x, y) => {
          const idx = (y * 48 + x) * 4;
          return [data[idx], data[idx + 1], data[idx + 2]];
        };
        const [lr, lg, lb] = px(6, 24);
        const [rr, rg, rb] = px(42, 24);
        const isDarkNavyBg = lb > lr + 10 && rb > rr + 10 && lr < 50 && rr < 50;

        let hasBrightCenter = false;
        for (let py = 4; py <= 32; py++) {
          const [cr, cg, cb] = px(24, py);
          if (cr > 170 && cg > 170 && cb > 170) {
            hasBrightCenter = true;
            break;
          }
        }
        setIsCameraStandby((!hasPrevFrame || diff < 2.0) && isDarkNavyBg && hasBrightCenter);
      } else {
        setIsCameraStandby(false);
      }
    } catch {
      setIsCameraStandby(false);
    }
  };

  // 2. Lifecycle scanner kamera: aktif hanya ketika BELUM ada perangkat aktif (mode pindai live)
  useEffect(() => {
    if (!currentDeviceId && !locationModalOpen) {
      startCamera();

      // Monitor aktif elemen video kamera untuk auto-dismiss notifikasi error & deteksi frame standby kamera virtual (OBS idle)
      const videoMonitorInterval = setInterval(() => {
        const vid = document.querySelector("#ar-qr-reader video");
        if (vid && !vid.paused && vid.readyState >= 2) {
          setScannerActive(true);
          setCameraError(null);
          evaluateVideoStandby(vid);
        }
      }, 200);

      return () => {
        clearInterval(videoMonitorInterval);
        stopCamera();
      };
    } else {
      // Saat perangkat / QR code muncul, matikan kamera agar tidak ada webcam menyala di belakang
      stopCamera();
    }
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

  // Listener zoom via mouse wheel pada area 3D Viewport
  useEffect(() => {
    const el = viewport3DRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.0015;
      setZoomLevel((prev) => Math.max(0.6, Math.min(2.0, Number((prev + delta).toFixed(2)))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [currentDeviceId, rackViewMode]);

  // Fungsi menyalakan kamera scanner
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraStandby(true);
    prevObsFrameRef.current = null;
    setCameraStatus("Menghubungkan ke sensor kamera...");

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("ar-qr-reader");
      }

      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      const calculateSquareQrBox = (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        // Kotak 1:1 persegi proporsional persis sama dengan kartu QR (~48.5% dari dimensi terkecil viewport)
        const size = Math.max(110, Math.min(180, Math.floor(minEdge * 0.485)));
        return { width: size, height: size };
      };

      try {
        await scannerRef.current.start(
          { facingMode: cameraFacing },
          {
            fps: 15,
            qrbox: calculateSquareQrBox,
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
            qrbox: calculateSquareQrBox,
            aspectRatio: 1.0,
          },
          onQrCodeSuccess,
          (errorMessage) => { }
        );
      }

      setScannerActive(true);
      setCameraError(null);
      setCameraStatus("Arahkan kamera ke QR Code lokasi ruangan atau rak perangkat...");

      const initialVid = document.querySelector("#ar-qr-reader video");
      if (initialVid && !initialVid.paused && initialVid.readyState >= 2) {
        evaluateVideoStandby(initialVid);
      }

      // Pasang listener langsung pada elemen video jika sudah ter-render di DOM
      setTimeout(() => {
        const vid = document.querySelector("#ar-qr-reader video");
        if (vid) {
          vid.onplay = () => {
            setScannerActive(true);
            setCameraError(null);
            evaluateVideoStandby(vid);
          };
          if (!vid.paused && vid.readyState >= 2) {
            setScannerActive(true);
            setCameraError(null);
            evaluateVideoStandby(vid);
          }
        }
      }, 150);
    } catch (err) {
      console.warn("Kamera gagal dihidupkan:", err);
      // Cek apakah video sebenarnya sudah berjalan (mencegah false error popup)
      const vid = document.querySelector("#ar-qr-reader video");
      if (vid && !vid.paused && vid.readyState >= 2) {
        setScannerActive(true);
        setCameraError(null);
        setCameraStatus("Arahkan kamera ke QR Code lokasi ruangan atau rak perangkat...");
      } else {
        setScannerActive(false);
        setCameraError(
          "Kamera tidak dapat diakses. Silakan aktifkan izin kamera atau gunakan tombol Foto QR."
        );
        setCameraStatus("Kamera tidak aktif.");
      }
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
      setIsCameraStandby(true);
      prevObsFrameRef.current = null;
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
    setCameraError(null);

    // 1. Coba smart lookup ke server terlebih dahulu
    try {
      const lookupRes = await fetch(`/ar/api/lookup-qr?q=${encodeURIComponent(raw)}`);
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json();
        if (lookupData.found) {
          if (lookupData.type === "location") {
            showToast(`📍 Lokasi "${lookupData.nama_lokasi}" Terdeteksi! Membuka daftar perangkat...`, "success");
            openLocationDevicesModal(lookupData.location_id);
            return;
          } else if (lookupData.type === "device") {
            showToast(`✅ Perangkat "${lookupData.nama_perangkat}" ditemukan! Memuat peta slot...`, "success");
            // Kamera tetap aktif (stay di mode scan)
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
      openLocationDevicesModal(locId);
      return;
    }

    // 3. Fallback regex Perangkat
    const devId = extractDeviceIdFromText(raw);
    if (devId) {
      showToast(`✅ QR Perangkat terdeteksi! Memuat peta slot...`, "success");
      // Kamera tetap aktif (stay di mode scan)
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
        setCameraStatus("Arahkan kamera ke QR Code lokasi ruangan atau rak perangkat...");
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
      let initialSlots = slotsData.slots || [];
      if (slotsData.sfps_by_slot) {
        setSfpsBySlot(slotsData.sfps_by_slot);
      }

      // Sinkronisasi data kartu utama dan SFP persis dari API detail perangkat (/api/devices/:id)
      try {
        const detailRes = await fetch(`/api/devices/${devId}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          if (detailData.success) {
            if (detailData.sfps_by_slot) {
              setSfpsBySlot((prev) => ({ ...(prev || {}), ...detailData.sfps_by_slot }));
            }
            if (detailData.installed_modules && detailData.installed_modules.length > 0) {
              const cardBySlot = {};
              detailData.installed_modules.forEach((m) => {
                const rawSl = String(m.slot_number).trim();
                cardBySlot[rawSl] = m;
                const match = rawSl.match(/\d+/);
                if (match) {
                  cardBySlot[match[0]] = m;
                  cardBySlot[parseInt(match[0], 10)] = m;
                }
              });

              initialSlots = initialSlots.map((s) => {
                const sNumStr = String(s.nomor_slot).trim();
                const mNum = sNumStr.match(/\d+/);
                const numKey = mNum ? mNum[0] : sNumStr;
                const devCard = cardBySlot[sNumStr] || cardBySlot[numKey] || (mNum ? cardBySlot[parseInt(mNum[0], 10)] : null);
                if (devCard) {
                  return {
                    ...s,
                    occupied: true,
                    module: {
                      modul_id: devCard.modul_id,
                      serial_number: devCard.serial_number,
                      unit_part_number: devCard.unit_part_number || "-",
                      tipe: devCard.unit_type || "-",
                      unit_type: devCard.unit_type || "-",
                      kondisi: devCard.kondisi || "AKTIF",
                    },
                  };
                }
                return s;
              });
            }
          }
        }
      } catch (errApi) {
        // Fallback hening jika endpoint /api/devices/:id sedang tidak tersedia
      }
      setSlots(initialSlots);
      if (slotsData.sfps_by_slot) {
        setSfpsBySlot((prev) => ({ ...(slotsData.sfps_by_slot || {}), ...(prev || {}) }));
      }
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
    setSfpsBySlot({});
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

  // Klik slot langsung dari grid / 3D (Toggle on/off jika diklik kembali)
  const handleSlotCardClick = (slot, keepRotation = false) => {
    // Simpan posisi scroll agar viewport 3D tidak bergeser saat action card muncul/hilang
    const scrollContainer = document.querySelector('main');
    const savedScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    const restoreScroll = () => {
      if (scrollContainer) {
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = savedScrollTop;
          // Double-ensure: kadang satu rAF tidak cukup
          requestAnimationFrame(() => {
            scrollContainer.scrollTop = savedScrollTop;
          });
        });
      }
    };

    // Jika slot yang diklik adalah slot yang sedang aktif, lepaskan / deselect (toggle off)
    if (
      selectedSlotForAction &&
      (selectedSlotForAction.slot_definition_id === slot.slot_definition_id ||
        String(selectedSlotForAction.nomor_slot) === String(slot.nomor_slot))
    ) {
      setSelectedSlotForAction(null);
      setHighlightedSlotId(null);
      highlightedSlotIdRef.current = null;
      setSearchResult(null);
      setSearchQuery("");
      restoreScroll();
      return;
    }

    setSelectedSlotForAction(slot);
    restoreScroll();
    setSearchMode("slot");
    setSearchQuery(String(slot.nomor_slot));
    setHighlightedSlotId(slot.slot_definition_id);
    highlightedSlotIdRef.current = slot.slot_definition_id;

    if (!keepRotation) {
      const num = parseInt(String(slot.nomor_slot).match(/\d+/)?.[0] || "-1", 10);
      if (num >= 34 && num <= 40) {
        // Slot bagian belakang: otomatis putar ke Tampak Belakang jika belum di belakang
        const normY = ((rotY % 360) + 360) % 360;
        if (normY < 120 || normY > 240) {
          setRotY(180);
          setRotX(0);
        }
      } else {
        // Slot bagian depan (1-33, N/A): otomatis putar ke Tampak Depan jika belum di depan
        const normY = ((rotY % 360) + 360) % 360;
        if (normY > 60 && normY < 300) {
          setRotY(0);
          setRotX(0);
        }
      }
    }

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
  const handleNavigateToMutation = (slot, actionType = "pindah", portInfo = null) => {
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

    if (portInfo) {
      if (portInfo.port) params.set("port", String(portInfo.port));
      if (portInfo.sn && !portInfo.isEmpty && portInfo.sn !== "Belum ada SFP") {
        params.set("sfp_sn", String(portInfo.sn.replace(/^SN:\s*/i, "")));
      }
      if (portInfo.type && !portInfo.isEmpty && portInfo.type !== "Slot Kosong") {
        params.set("sfp_type", String(portInfo.type));
      }
    }

    window.location.href = `/modules/requests?${params.toString()}`;
  };

  // Interaksi Drag Orbit 3D Rack
  const handle3DMouseDown = (e) => {
    isDragging3D.current = true;
    hasDragged3D.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handle3DMouseMove = (e) => {
    if (!isDragging3D.current || imuActive) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDragged3D.current = true;
    }
    dragStart.current = { x: e.clientX, y: e.clientY };

    // Rotasi 360 derajat horizontal bebas dan continuous
    setRotY((prev) => (prev + dx * 0.55) % 360);
    // Tilt vertikal dibatasi natural agar tidak terbalik
    setRotX((prev) => Math.max(-28, Math.min(28, prev - dy * 0.35)));
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

    // Rotasi 360 derajat horizontal bebas via touch
    setRotY((prev) => (prev + dx * 0.6) % 360);
    setRotX((prev) => Math.max(-28, Math.min(28, prev - dy * 0.35)));
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

  const isFrontFacing = (() => {
    const normY = ((rotY % 360) + 360) % 360;
    return normY < 70 || normY > 290;
  })();

  const render3DChassisSlot = (slotNum, gridCol, gridRow) => {
    const slot = getSlot(slotNum);
    const num = Number(slotNum);
    const devId = parseInt(currentDeviceId || currentDevice?.device_id, 10);
    const hostname = String(currentDevice?.hostname || currentDevice?.nama_perangkat || "").toUpperCase();
    const lokasi = String(currentDevice?.lokasi || (currentDevice?.location && currentDevice?.location?.nama_lokasi) || "").toUpperCase();
    const isSto2 = devId === 17 || hostname.includes("PAL2") || lokasi.includes("PALU 2") || lokasi.includes("STO 2");

    // Validasi okupansi slot sesuai data riil database (STO 1 vs STO 2)
    let isOccupied = Boolean(slot.occupied);
    const card = slot.module;
    if (!slot.occupied && !card) {
      if (isSto2) {
        // STO 2 (WN-24X-SUL-PAL211): Slot 1, 2, 3, 7, 8, 9, 10, 16, 17, 29 aktif terpasang
        isOccupied = [1, 2, 3, 7, 8, 9, 10, 16, 17, 29].includes(num);
      } else {
        // STO 1 (WN-24X-SUL-PAL11): Slot 2, 3, 7, 8, 9, 10, 11, 12, 16, 17, 18, 26, 27, 28, 29 aktif terpasang
        isOccupied = [2, 3, 7, 8, 9, 10, 11, 12, 16, 17, 18, 26, 27, 28, 29].includes(num);
      }
    }
    const isHighlighted = slot.slot_definition_id === highlightedSlotId;
    const isSelected = selectedSlotForAction?.slot_definition_id === slot.slot_definition_id;
    const isController = slotNum === 16;
    const isBackupCtrl = slotNum === 29;
    const activeHighlight = isHighlighted || isSelected;

    let topRoleBadge = null;
    let bottomRoleBadge = null;

    if (isSto2) {
      // ── KONFIGURASI KHUSUS PERANGKAT STO 2 (Sesuai Foto Referensi Gambar STO 2 User) ──
      // Slot 10: Red Circle [C] (Protection / Client)
      // Slot 16: Yellow/Amber Circle [m] (Master Controller)
      // Slot lainnya bersih tanpa badge ("yang lain hapus")
      if (num === 10) {
        topRoleBadge = { letter: "C", color: "#EF4444", title: "Client / Protection Slot (C)" };
      } else if (num === 16) {
        topRoleBadge = { letter: "m", color: "#F59E0B", title: "Master Controller Slot (m)" };
      }
    } else {
      // ── KONFIGURASI OTENTIK PERANGKAT STO 1 (Tetap Dipertahankan) ──
      // Upper Shelf: Slot 2 & 10 (Badge W di nomor slot ATAS)
      // Lower Shelf: Slot 17 & 18 (Badge W di BAWAH), Slot 28 (Badge C di BAWAH)
      if (num === 2 || num === 10) {
        topRoleBadge = { letter: "W", color: "#00BCD4", title: "Working Slot (W)" };
      }
      if (num === 17 || num === 18) {
        bottomRoleBadge = { letter: "W", color: "#00BCD4", title: "Working Slot (W)" };
      } else if (num === 28) {
        bottomRoleBadge = { letter: "C", color: "#EF4444", title: "Protection / Client Slot (C)" };
      }
    }

    // Helper render badge huruf otentik sesuai STO (tanpa border hitam, huruf berwarna hitam)
    const renderSharpRoleBadgeSVG = (badge) => {
      if (!badge) return null;
      return (
        <svg
          viewBox="0 0 10 10"
          style={{ width: "7px", height: "7px" }}
          className="shrink-0 select-none overflow-visible rounded-full"
          title={badge.title}
          aria-hidden="true"
        >
          {/* Lingkaran disc flat tanpa border hitam sesuai perangkat asli STO */}
          <circle cx="5" cy="5" r="5" fill={badge.color} />
          {/* Huruf Vektor Berwarna Hitam Murni (#000000) Otentik Sesuai STO */}
          {badge.letter === "W" ? (
            <path
              d="M 2.4 3.2 L 3.7 7.0 L 5 4.3 L 6.3 7.0 L 7.6 3.2"
              fill="none"
              stroke="#000000"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : badge.letter === "C" ? (
            <path
              d="M 7.3 3.3 C 6.5 2.1 4.2 2.1 3.2 3.3 C 2.2 4.4 2.2 6.1 3.2 7.2 C 4.2 8.4 6.5 8.4 7.3 7.2"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.35"
              strokeLinecap="round"
            />
          ) : badge.letter === "m" ? (
            <path
              d="M 2.6 3.6 L 2.6 7.0 M 2.6 4.5 C 3.2 3.4 4.5 3.4 5.0 4.5 L 5.0 7.0 M 5.0 4.5 C 5.5 3.4 6.8 3.4 7.4 4.5 L 7.4 7.0"
              fill="none"
              stroke="#000000"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <text
              x="5"
              y="5.3"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#000000"
              fontSize="6"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
            >
              {badge.letter}
            </text>
          )}
        </svg>
      );
    };

    // SFP dan Port Transceiver terhubung dinamis ke database
    const slotSfps = (sfpsBySlot && (sfpsBySlot[slotNum] || sfpsBySlot[String(slotNum)])) || slot.sfps || [];

    const isPortActive = (port1Based) => {
      // Murni mengikuti data SFP aktual dari database (tanpa fallback port hardcoded)
      if (slotSfps && slotSfps.length > 0) {
        const match = slotSfps.some((s) => {
          const rawP = String(s.port || "").trim();
          const pNum = parseInt(rawP.replace(/\D+/g, ""), 10);
          return pNum === port1Based;
        });
        if (match) return true;
        const hasNumberedPorts = slotSfps.some((s) => /\d+/.test(String(s.port || "")));
        if (!hasNumberedPorts && port1Based <= slotSfps.length) return true;
      }
      return false;
    };

    const moduleName = card?.tipe || card?.unit_type || "";

    return (
      <div
        key={`3d-slot-${slotNum}`}
        id={`slot-item-${slot.slot_definition_id}`}
        style={{
          gridColumn: gridCol,
          gridRow: gridRow,
          pointerEvents: isFrontFacing ? "auto" : "none",
          backgroundColor: activeHighlight
            ? "#FEF3C7"
            : isOccupied
              ? "#FFFFFF"
              : "#F8FAFC",
          borderColor: activeHighlight
            ? "#F59E0B"
            : "#CBD5E1",
          borderWidth: activeHighlight ? "2px" : "1px",
          zIndex: activeHighlight ? 30 : 1,
          boxShadow: activeHighlight ? "0 0 16px rgba(245,158,11,0.9)" : "none",
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleSlotCardClick(slot);
          showSlotPopup(e, slot);
        }}
        onMouseEnter={(e) => showSlotPopup(e, slot)}
        onMouseLeave={() => hideSlotPopup(slot.slot_definition_id)}
        className={`group relative flex flex-col justify-between p-[1px] transition-all duration-150 text-left cursor-pointer border select-none h-full w-full min-h-0 overflow-hidden ${
          activeHighlight
            ? "scale-[1.03] ring-2 ring-amber-400"
            : isOccupied
              ? "hover:bg-slate-50 hover:border-slate-400"
              : "hover:bg-slate-100"
        }`}
      >
        {/* Top Active Badge */}
        {activeHighlight && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[6.5px] font-mono px-1 py-0.2 rounded-xs shadow-md uppercase tracking-wider whitespace-nowrap pointer-events-none z-30 animate-pulse">
            SLOT {slotNum < 10 ? `0${slotNum}` : slotNum}
          </div>
        )}

        {/* ── TOP SLOT HEADER: BULATAN HIJAU DITARUH DI ATAS ANGKA SLOT (DIJAMIN 100% KONSISTEN DI SEMUA SLOT TANPA TINGGI SEBELAH) ── */}
        <div className="w-full flex flex-col items-center pt-0.5 px-0.5 shrink-0">
          {/* 1. Tanda Ada Modul: Bulatan Hijau jika terpasang modul; spacer transparan jika kosong agar garis nomor slot 100% sejajar */}
          <div className="h-[6px] flex items-center justify-center mb-0.5 shrink-0">
            {isOccupied ? (
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_2.5px_#10B981]"
                title="Status Slot: Terpasang Modul Aktif"
              />
            ) : (
              <div className="w-1.5 h-1.5" />
            )}
          </div>

          {/* 2. Nomor Slot dalam Wrapper h-[10px] Presisi (Role Badge W di atas hanya untuk Slot 2 & 10) */}
          <div className="w-full h-[10px] flex items-center justify-center gap-[1.5px] shrink-0">
            {topRoleBadge && renderSharpRoleBadgeSVG(topRoleBadge)}
            <span
              className={`text-[7.5px] font-bold font-mono leading-none ${
                activeHighlight
                  ? "text-amber-900 font-black"
                  : isOccupied
                    ? "text-slate-900"
                    : "text-slate-500"
              }`}
            >
              {slotNum}
            </span>
          </div>

          {/* 3. Latch Handle Atas dalam Wrapper h-[6px] Presisi */}
          <div className="w-full h-[6px] flex items-center justify-center my-0.5 shrink-0">
            <div
              className={`w-[20px] h-[3.5px] rounded-[1px] border flex items-center justify-center shadow-xs ${
                activeHighlight
                  ? "bg-amber-600 border-amber-800"
                  : "bg-[#111827] border-black"
              }`}
            >
              <div className="w-2.5 h-0.5 bg-neutral-600 rounded-full" />
            </div>
          </div>

          {/* 4. Judul Modul / Tipe Modul dalam Wrapper h-[8px] Presisi */}
          <div className="w-full flex items-center justify-center h-[8px] mb-0.5 shrink-0">
            <span
              style={{
                fontSize: isOccupied
                  ? (moduleName.length >= 7 ? "3.8px" : moduleName.length > 5 ? "4.2px" : "4.8px")
                  : "4.5px",
                lineHeight: "1",
              }}
              className={`font-mono font-bold uppercase text-center select-none tracking-tight block truncate ${
                isOccupied
                  ? activeHighlight ? "text-amber-950 font-black" : "text-slate-800"
                  : "text-slate-400 font-normal"
              }`}
            >
              {isOccupied ? moduleName : "EMPTY"}
            </span>
          </div>
        </div>

        {/* ── SPECIALIZED PORT HARDWARE VISUALS DENGAN GAP KONSISTEN & TINGGI KALIBRASI (ANTI TINGGI SEBELAH) ── */}
        {isController || isBackupCtrl ? (
          /* ── CEC2 (Slot 16) / OSC2 B (Slot 29): AUTENTIK SESUAI 4 FOTO REFERENSI USER (TITIK HITAM & R SEJAJAR DENGAN BLANK) ── */
          <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-between pt-0.5 pb-1 px-0.5 select-none overflow-hidden">
            {/* 1. GAMBAR 1: LAMPU LED VERTIKAL SESUAI FOTO */}
            <div className="w-full pl-1.5 pr-0.5 flex flex-col shrink-0" style={{ gap: "1.1px" }}>
              <div className="flex items-center gap-1" title="STAT: Normal Green">
                <span style={{ width: "2.5px", height: "2.5px" }} className="rounded-full bg-[#10B981] shadow-[0_0_1.5px_#10B981] shrink-0" />
                <span style={{ fontSize: "2.7px", lineHeight: "1" }} className="font-mono font-bold text-slate-700">STAT</span>
              </div>
              <div className="flex items-center gap-1" title="UPD: Update Controller Active">
                <span style={{ width: "2.5px", height: "2.5px" }} className="rounded-full bg-[#10B981] shadow-[0_0_1.5px_#10B981] shrink-0" />
                <span style={{ fontSize: "2.7px", lineHeight: "1" }} className="font-mono font-bold text-slate-700">UPD</span>
              </div>
              <div className="flex items-center gap-1" title="ACO: Alarm Cut-Off">
                <span style={{ width: "2.5px", height: "2.5px" }} className="rounded-full bg-slate-500 shrink-0" />
                <span style={{ fontSize: "2.7px", lineHeight: "1" }} className="font-mono font-bold text-slate-700">ACO</span>
              </div>
              <div className="flex items-center gap-1" title="CR: Critical Alarm">
                <span style={{ width: "2.5px", height: "2.5px" }} className="rounded-full bg-[#EF4444] shadow-[0_0_1.5px_#EF4444] shrink-0" />
                <span style={{ fontSize: "2.7px", lineHeight: "1" }} className="font-mono font-bold text-slate-700">CR</span>
              </div>
              <div className="flex items-center gap-1" title="MJ: Major Alarm">
                <span style={{ width: "2.5px", height: "2.5px" }} className="rounded-full bg-[#EF4444] shadow-[0_0_1.5px_#EF4444] shrink-0" />
                <span style={{ fontSize: "2.7px", lineHeight: "1" }} className="font-mono font-bold text-slate-700">MJ</span>
              </div>
              <div className="flex items-center gap-1" title="MN: Minor Alarm">
                <span style={{ width: "2.5px", height: "2.5px" }} className="rounded-full bg-black shrink-0" />
                <span style={{ fontSize: "2.7px", lineHeight: "1" }} className="font-mono font-bold text-slate-700">MN</span>
              </div>
              <div className="flex items-center gap-1" title="ACT: Active Status">
                <span style={{ width: "2.5px", height: "2.5px" }} className="rounded-full bg-[#F59E0B] shadow-[0_0_1.5px_#F59E0B] shrink-0" />
                <span style={{ fontSize: "2.7px", lineHeight: "1" }} className="font-mono font-bold text-slate-700">ACT</span>
              </div>
              <div className="flex items-center gap-1" title="F1: Feature 1">
                <span style={{ width: "2.5px", height: "2.5px" }} className="rounded-full bg-slate-400 shrink-0" />
                <span style={{ fontSize: "2.7px", lineHeight: "1" }} className="font-mono font-bold text-slate-700">F1</span>
              </div>
              <div className="flex items-center gap-1" title="F2: Feature 2">
                <span style={{ width: "2.5px", height: "2.5px" }} className="rounded-full bg-slate-400 shrink-0" />
                <span style={{ fontSize: "2.7px", lineHeight: "1" }} className="font-mono font-bold text-slate-700">F2</span>
              </div>
            </div>

            {/* 2. GAMBAR 2: ELEMEN DIBAWAH LAMPU LED (USB PORT) */}
            <div className="flex flex-col items-center gap-[0.5px] shrink-0" title="USB Craft Interface">
              <svg viewBox="0 0 16 6" style={{ width: "11px", height: "3px" }} className="text-slate-700 fill-current opacity-80">
                <path d="M8 0 L9 1.5 L8.3 1.5 L8.3 4 L11 4 L11 3 L12.5 3.5 L11 4 L11 4.5 L8.3 4.5 L8.3 5.5 L7.7 5.5 L7.7 4.5 L5 4.5 L5 5 L3.5 4.5 L5 4 L5 4 L7.7 4 L7.7 1.5 L7 1.5 Z"/>
              </svg>
              <div style={{ width: "13px", height: "3.2px" }} className="bg-[#020617] border border-slate-600 rounded-[0.8px] flex items-center justify-center shadow-inner">
                <div style={{ width: "7.5px", height: "0.9px" }} className="bg-slate-300 rounded-full" />
              </div>
            </div>

            {/* 3. GAMBAR 3: ELEMEN DIBAWAHNYA LAGI (DVR CRAFT PORT & DVR LED) */}
            <div className="w-full px-2 flex flex-col gap-1 shrink-0" title="DVR Interface & Indicator">
              {/* DVR Vertical Slot + Text */}
              <div className="flex items-center gap-1.5">
                <div style={{ width: "4.5px", height: "6.5px" }} className="bg-[#020617] border border-slate-600 rounded-[0.8px] flex items-center justify-center shadow-xs">
                  <div style={{ width: "1.5px", height: "3.8px" }} className="bg-slate-400 rounded-xs" />
                </div>
                <span style={{ fontSize: "2.8px", lineHeight: "1" }} className="font-mono font-bold text-slate-700">DVR</span>
              </div>
              {/* DVR LED Dot + Text */}
              <div className="flex items-center gap-1.5">
                <span style={{ width: "3px", height: "3px" }} className="rounded-full bg-black shrink-0" />
                <span style={{ fontSize: "2.8px", lineHeight: "1" }} className="font-mono font-bold text-slate-700">DVR</span>
              </div>
            </div>

            {/* 4. CARD NOTICE YANG MENAUNGI (ENCLOSING CARD BOX WITH HEADER & WARNING BODY) */}
            <div className="w-full flex justify-center items-center mt-1 mb-0.5 shrink-0">
              <div
                style={{ width: "25px" }}
                className="flex flex-col rounded-[1.2px] border border-[#0055AA] bg-white overflow-hidden shadow-xs shrink-0"
                title="Safety Notice Card"
              >
                {/* Header Biru NOTICE */}
                <div style={{ height: "4.8px" }} className="w-full bg-[#0066CC] flex items-center justify-center">
                  <span
                    style={{ fontSize: "3.2px", lineHeight: "1" }}
                    className="text-white font-sans font-black tracking-wider block text-center"
                  >
                    NOTICE
                  </span>
                </div>
                {/* Body Card Putih dengan Subteks Peringatan */}
                <div className="w-full bg-white px-0.5 py-[1.2px] flex items-center justify-center">
                  <span
                    style={{ fontSize: "2px", lineHeight: "2.4px" }}
                    className="font-mono text-slate-700 text-center font-medium whitespace-nowrap block"
                  >
                    Do not remove card<br />when DVR LED is ON
                  </span>
                </div>
              </div>
            </div>

            {/* 5. DUA (2) CARD PORT RESMI SESUAI BANYAKNYA PORT DI DATABASE (PORT 1 & PORT 2 / ES1 & ES2) */}
            <div className="flex flex-col items-center shrink-0" style={{ gap: "3.5px" }}>
              {[1, 2].map((portNum) => {
                const isActive = isPortActive(portNum);
                return (
                  <div
                    key={`ctrl-port-${portNum}`}
                    style={{ width: "25px", height: "8.5px" }}
                    className="relative mx-auto bg-gradient-to-b from-[#F1F5F9] via-[#CBD5E1] to-[#94A3B8] border border-[#64748B] rounded-[1.2px] flex items-center justify-between px-[1.2px] shadow-xs shrink-0 port-cage-frame"
                    title={`Port ${portNum} (ES${portNum}): ${isActive ? "Active SFP (Hijau/Cyan)" : "Standby SFP (Abu-abu)"}`}
                  >
                    <div style={{ width: "14px", height: "5.5px" }} className="bg-[#020617] border border-[#1E293B] rounded-[0.5px] flex items-center justify-center port-cage-subport">
                      {isActive ? (
                        <div style={{ width: "9px", height: "2px" }} className="bg-[#00E5FF] rounded-xs shadow-[0_0_1.5px_#00E5FF]" />
                      ) : (
                        <div style={{ width: "9px", height: "2px" }} className="bg-slate-800 rounded-xs" />
                      )}
                    </div>
                    <div
                      style={{ width: "2.8px", height: "5.5px" }}
                      className={`rounded-[0.5px] ${isActive ? "bg-[#10B981] shadow-[0_0_1.5px_#10B981]" : "bg-[#64748B]"}`}
                    />
                    <span style={{ fontSize: "2.8px", lineHeight: "1", right: "-7.5px" }} className="absolute font-mono font-bold text-slate-500 scale-90">
                      {portNum}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 6. GAMBAR 4: TITIK HITAM & HURUF R DIBESARIN SEBESAR TITIK HITAM DAN DITENGAHIN */}
            <div className="w-full flex items-center justify-center gap-1.5 shrink-0" title="Ground Screw & Reset / Retaining Indicator (R)">
              {/* Titik Hitam Presisi Vektor Bundar Sempurna (1:1 Sumbu X dan Y, Anti Oval/Lonjong) */}
              <svg
                viewBox="0 0 10 10"
                style={{ width: "4.5px", height: "4.5px" }}
                className="shrink-0 block overflow-visible select-none"
                aria-hidden="true"
              >
                <circle cx="5" cy="5" r="4.8" className="fill-slate-700" />
              </svg>
              
              {/* Box Huruf R: Garis Putus-putus (Dashed) dengan Huruf R Ditengahin Presisi Matematis (100% Simetris Sumbu X dan Y) */}
              <svg
                viewBox="0 0 20 20"
                style={{ width: "6.5px", height: "6.5px" }}
                className="shrink-0 block overflow-visible select-none"
                aria-hidden="true"
              >
                <rect x="1" y="1" width="18" height="18" rx="2" fill="none" stroke="#64748b" strokeWidth="1.8" strokeDasharray="3, 2.5" />
                <path d="M 5.9 4.5 L 11.5 4.5 C 13.2 4.5 14.1 5.4 14.1 7.2 C 14.1 8.8 13.2 9.7 11.5 9.7 L 8.1 9.7 L 8.1 15.5 L 5.9 15.5 Z M 8.1 6.3 L 8.1 8.1 L 11.1 8.1 C 11.7 8.1 12.0 7.8 12.0 7.2 C 12.0 6.6 11.7 6.3 11.1 6.3 Z M 10.7 9.7 L 14.1 15.5 L 11.7 15.5 L 8.8 10.2 Z" className="fill-slate-700" />
              </svg>
            </div>
          </div>
        ) : isOccupied && (moduleName.includes("30AN") || moduleName.includes("30")) ? (
          /* 30AN300 / 30AN30G (Slot 27 & 28): 30 Micro-Ports (15 Baris x 2 Port) Terkalibrasi Sejajar Eksak dengan Slot 26 */
          <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-between py-1.5">
            <div className="w-[26px] h-full mx-auto flex flex-col justify-between items-center">
              {[...Array(15)].map((_, rIdx) => {
                const p1 = rIdx * 2 + 1;
                const p2 = rIdx * 2 + 2;
                const act1 = isPortActive(p1);
                const act2 = isPortActive(p2);
                return (
                  <div key={`row-${rIdx}`} className="w-full flex items-center justify-between">
                    {/* Port Kiri (p1) */}
                    <div
                      className="w-[11.8px] h-[5.8px] bg-gradient-to-b from-[#F8FAFC] via-[#E2E8F0] to-[#CBD5E1] border border-[#64748B] rounded-[1px] flex items-center justify-center gap-[1px] shadow-[0_0.5px_1px_rgba(0,0,0,0.15)] port-cage-frame shrink-0"
                      title={`Port ${p1}: ${act1 ? "Terisi SFP (Hijau Aktif)" : "Kosong SFP (Abu-abu)"}`}
                    >
                      {act1 ? (
                        <>
                          <div style={{ width: "5px", height: "3.2px" }} className="bg-[#00E5FF] border border-[#0284C7] shadow-[0_0_1.5px_#00E5FF] rounded-[0.5px]" />
                          <div style={{ width: "2px", height: "3.2px" }} className="bg-[#10B981] shadow-[0_0_2px_#10B981] rounded-[0.5px]" />
                        </>
                      ) : (
                        <>
                          <div style={{ width: "5px", height: "3.2px" }} className="bg-[#1E293B] rounded-[0.5px]" />
                          <div style={{ width: "2px", height: "3.2px" }} className="bg-[#64748B] rounded-[0.5px]" />
                        </>
                      )}
                    </div>

                    {/* Port Kanan (p2) */}
                    <div
                      className="w-[11.8px] h-[5.8px] bg-gradient-to-b from-[#F8FAFC] via-[#E2E8F0] to-[#CBD5E1] border border-[#64748B] rounded-[1px] flex items-center justify-center gap-[1px] shadow-[0_0.5px_1px_rgba(0,0,0,0.15)] port-cage-frame shrink-0"
                      title={`Port ${p2}: ${act2 ? "Terisi SFP (Hijau Aktif)" : "Kosong SFP (Abu-abu)"}`}
                    >
                      {act2 ? (
                        <>
                          <div style={{ width: "5px", height: "3.2px" }} className="bg-[#00E5FF] border border-[#0284C7] shadow-[0_0_1.5px_#00E5FF] rounded-[0.5px]" />
                          <div style={{ width: "2px", height: "3.2px" }} className="bg-[#10B981] shadow-[0_0_2px_#10B981] rounded-[0.5px]" />
                        </>
                      ) : (
                        <>
                          <div style={{ width: "5px", height: "3.2px" }} className="bg-[#1E293B] rounded-[0.5px]" />
                          <div style={{ width: "2px", height: "3.2px" }} className="bg-[#64748B] rounded-[0.5px]" />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : isOccupied && (moduleName.includes("10AN") || moduleName.includes("10")) ? (
          /* 10AN400 / 10AN1T (Slot 17, 18, 26): 10 Port Vertikal Terkalibrasi Sejajar Eksak dengan Slot 27 & 28 */
          <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-between py-1.5">
            <div className="w-[26px] h-full mx-auto flex flex-col justify-between items-center">
              {[...Array(10)].map((_, i) => {
                const portNum = i + 1;
                const isActive = isPortActive(portNum);
                return (
                  <div
                    key={portNum}
                    className="w-[26px] h-[9.8px] mx-auto bg-gradient-to-b from-[#F1F5F9] via-[#CBD5E1] to-[#94A3B8] border border-[#64748B] rounded-[1.5px] flex items-center justify-between px-[1.5px] shadow-[0_0.5px_1px_rgba(0,0,0,0.2)] port-cage-frame shrink-0"
                    title={`Port ${portNum}: ${isActive ? "Terisi SFP (Hijau)" : "Kosong SFP (Abu-abu)"}`}
                  >
                    <div className="w-[15px] h-[6px] bg-[#020617] border border-[#1E293B] rounded-[1px] flex items-center justify-center port-cage-subport">
                      {isActive ? (
                        <div className="w-[10px] h-[2.2px] bg-[#00E5FF] rounded-xs shadow-[0_0_2px_#00E5FF]" />
                      ) : (
                        <div className="w-[10px] h-[2.2px] bg-slate-800 rounded-xs" />
                      )}
                    </div>
                    <div
                      className={`w-[3px] h-[6px] rounded-[0.5px] ${
                        isActive ? "bg-[#10B981] shadow-[0_0_2px_#10B981]" : "bg-[#64748B]"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : isOccupied && (moduleName.includes("8UC") || moduleName.includes("8")) ? (
          /* 8UC1T (Slot 2 & 11): 8 Port SFP+ Terkalibrasi (Garis Biru Solid Kontinu seperti 10AN, Gap 2.5px) */
          <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center gap-[2.5px] py-1">
            {[...Array(8)].map((_, i) => {
              const portNum = i + 1;
              const isActive = isPortActive(portNum);
              return (
                <div
                  key={portNum}
                  className="w-[26px] mx-auto h-[12.5px] bg-gradient-to-b from-[#F1F5F9] via-[#CBD5E1] to-[#94A3B8] border border-[#64748B] rounded-[1.5px] flex items-center justify-between px-[1.5px] shadow-[0_0.5px_1px_rgba(0,0,0,0.2)] port-cage-frame"
                  title={`Port ${portNum}: ${isActive ? "Terisi SFP (Hijau)" : "Kosong SFP (Abu-abu)"}`}
                >
                  <div className="w-[15px] h-[7.5px] bg-[#020617] border border-[#1E293B] rounded-[1px] flex items-center justify-center port-cage-subport">
                    {isActive ? (
                      <div className="w-[10px] h-[2.5px] bg-[#00E5FF] rounded-xs shadow-[0_0_2.5px_#00E5FF]" />
                    ) : (
                      <div className="w-[10px] h-[2.5px] bg-slate-800 rounded-xs" />
                    )}
                  </div>
                  <div
                    className={`w-[3.5px] h-[7.5px] rounded-[0.5px] ${
                      isActive ? "bg-[#10B981] shadow-[0_0_2px_#10B981]" : "bg-[#64748B]"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        ) : isOccupied && (moduleName.includes("2UC") || moduleName.startsWith("2")) ? (
          /* 2UC400 (Slot 3): 4 Port Fisik (2 Client QSFP28 + 2 Line CFP2-DCO) - Sejajar Eksak dengan Slot 1 & 2 (4UC1T) */
          <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center gap-[12px] py-2">
            {[0, 1, 2, 3].map((pIdx) => {
              const portNum = pIdx + 1;
              const isActive = isPortActive(portNum);
              const isLine = pIdx >= 2; // Port 1 & 2: Client QSFP28, Port 3 & 4: Line CFP2-DCO
              return (
                <div
                  key={portNum}
                  className="w-[26px] mx-auto h-[16px] bg-gradient-to-b from-[#FFFFFF] via-[#E2E8F0] to-[#CBD5E1] border border-[#64748B] rounded-[2px] shadow-xs flex items-center justify-between px-[2px] port-cage-frame"
                  title={`Port ${portNum} (${isLine ? "Line CFP2-DCO" : "Client QSFP28"}): ${isActive ? "Terisi SFP (Hijau/Cyan)" : "Kosong SFP (Standby)"}`}
                >
                  <div className="w-[16px] h-[11px] bg-[#020617] border border-[#1E293B] rounded-[1px] shadow-inner flex items-center justify-center port-cage-subport">
                    {isActive ? (
                      <div className="w-[11px] h-[3px] bg-[#00E5FF] rounded-xs shadow-[0_0_2px_#00E5FF]" />
                    ) : (
                      <div className="w-[11px] h-[3px] bg-slate-800 rounded-xs border border-slate-700" />
                    )}
                  </div>
                  {/* Style Status Tab Vertikal */}
                  <div
                    className={`w-[3.5px] h-[11px] rounded-[0.5px] ${
                      isActive ? "bg-[#10B981] shadow-[0_0_2px_#10B981]" : "bg-[#64748B]"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        ) : isOccupied && (moduleName.includes("4UC") || moduleName.startsWith("4")) ? (
          /* 4UC1T (Slot 10 & 12): 4 Port QSFP (w-[26px] mx-auto) dengan Gap Terkalibrasi */
          <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center gap-[12px] py-2">
            {[0, 1, 2, 3].map((pIdx) => {
              const portNum = pIdx + 1;
              const isActive = isPortActive(portNum);
              return (
                <div
                  key={portNum}
                  className="w-[26px] mx-auto h-[16px] bg-gradient-to-b from-[#F1F5F9] via-[#E2E8F0] to-[#CBD5E1] border border-[#64748B] rounded-[2px] shadow-xs flex items-center justify-between px-[2px] port-cage-frame"
                  title={`Port ${portNum}: ${isActive ? "Terisi SFP (Hijau)" : "Kosong SFP (Abu-abu)"}`}
                >
                  <div className="w-[16px] h-[11px] bg-[#020617] border border-[#1E293B] rounded-[1px] flex items-center justify-center shadow-inner port-cage-subport">
                    {isActive ? (
                      <div className="w-[11px] h-[3px] bg-[#00E5FF] rounded-xs shadow-[0_0_2px_rgba(0,229,255,0.5)]" />
                    ) : (
                      <div className="w-[11px] h-[3px] bg-slate-800 rounded-xs border border-slate-700" />
                    )}
                  </div>
                  <div
                    className={`w-[3.5px] h-[11px] rounded-[0.5px] ${
                      isActive ? "bg-[#10B981] shadow-[0_0_2px_#10B981]" : "bg-[#64748B]"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        ) : isOccupied ? (
          /* Modul Terpasang Generik: 4 Port SFP (w-[26px] mx-auto) dengan Gap Terkalibrasi */
          <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center gap-[12px] py-2">
            {[0, 1, 2, 3].map((pIdx) => {
              const portNum = pIdx + 1;
              const isActive = isPortActive(portNum);
              return (
                <div
                  key={portNum}
                  className="w-[26px] mx-auto h-[14px] bg-gradient-to-b from-[#F1F5F9] via-[#CBD5E1] to-[#94A3B8] border border-[#64748B] rounded-[1.5px] flex items-center justify-between px-[1.5px] shadow-xs port-cage-frame"
                  title={`Port ${portNum}: ${isActive ? "Terisi SFP (Hijau)" : "Kosong SFP (Abu-abu)"}`}
                >
                  <div className="w-[15px] h-[7px] bg-[#020617] border border-[#1E293B] rounded-[1px] flex items-center justify-center port-cage-subport">
                    {isActive ? (
                      <div className="w-[9px] h-[2.2px] bg-[#00E5FF] rounded-xs" />
                    ) : (
                      <div className="w-[9px] h-[2.2px] bg-slate-800 rounded-xs" />
                    )}
                  </div>
                  <div
                    className={`w-[3px] h-[7px] rounded-[0.5px] ${
                      isActive ? "bg-[#10B981] shadow-[0_0_2px_#10B981]" : "bg-[#64748B]"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          /* Slot Kosong: Rel Panduan Vertikal Membentang Penuh & Teks BLANK (Poin 1 Sesuai Gambar 1) */
          <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-between py-1 relative">
            <div className="w-[1.5px] flex-1 my-1 bg-gradient-to-r from-slate-300 via-slate-200 to-white shadow-inner rounded-full" />
            <span className="text-[4.5px] font-mono font-bold text-slate-400 tracking-wider">
              BLANK
            </span>
          </div>
        )}

        {/* ── BOTTOM PINNED FOOTER: LATCH HANDLE + NOMOR SLOT (DIJAMIN 100% KONSISTEN DI SEMUA SLOT TANPA TINGGI SEBELAH) ── */}
        <div className="w-full flex flex-col items-center shrink-0 mt-auto">
          <div className="w-full flex justify-center items-center h-[6px] shrink-0">
            <div
              className={`w-[20px] h-[3.5px] rounded-[1px] border flex items-center justify-center shadow-xs ${
                activeHighlight
                  ? "bg-amber-600 border-amber-800"
                  : "bg-[#111827] border-black"
              }`}
            >
              <div className="w-2.5 h-0.5 bg-neutral-600 rounded-full" />
            </div>
          </div>
          <div className="w-full h-[12px] flex items-center justify-center gap-[1.5px] shrink-0">
            {bottomRoleBadge && renderSharpRoleBadgeSVG(bottomRoleBadge)}
            <span
              className={`text-[7.5px] font-bold font-mono leading-none ${
                activeHighlight
                  ? "text-amber-900 font-black"
                  : isOccupied
                    ? "text-slate-800"
                    : "text-slate-500"
              }`}
            >
              {slotNum}
            </span>
          </div>
        </div>
      </div>
    );
  };
  const render3DChassisFabricSlot = (slotNum, gridCol) => {
    const slot = getSlot(slotNum);
    const isOccupied = Boolean(slot.occupied);
    const isHighlighted = slot.slot_definition_id === highlightedSlotId;
    const isSelected = selectedSlotForAction?.slot_definition_id === slot.slot_definition_id;
    const activeHighlight = isHighlighted || isSelected;

    return (
      <div
        key={`3d-fabric-${slotNum}`}
        id={`slot-item-${slot.slot_definition_id}`}
        style={{
          gridColumn: gridCol,
          gridRow: "1 / span 3",
          pointerEvents: isFrontFacing ? "auto" : "none",
          backgroundColor: activeHighlight
            ? "#FEF3C7"
            : "#F8FAFC",
          borderColor: activeHighlight
            ? "#F59E0B"
            : "#CBD5E1",
          borderWidth: activeHighlight ? "2px" : "1px",
          zIndex: activeHighlight ? 30 : 1,
          boxShadow: activeHighlight ? "0 0 16px rgba(245,158,11,0.9)" : "none",
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleSlotCardClick(slot);
          showSlotPopup(e, slot);
        }}
        onMouseEnter={(e) => showSlotPopup(e, slot)}
        onMouseLeave={() => hideSlotPopup(slot.slot_definition_id)}
        className={`group relative flex flex-col justify-between p-[1px] transition-all duration-150 text-left cursor-pointer border select-none h-full w-full min-h-0 ${
          activeHighlight
            ? "scale-[1.03] ring-2 ring-amber-400"
            : "hover:bg-slate-50 hover:border-slate-400"
        }`}
      >
        {/* Top Active Badge */}
        {activeHighlight && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[6.5px] font-mono px-1 py-0.2 rounded-xs shadow-md uppercase tracking-wider whitespace-nowrap pointer-events-none z-30 animate-pulse">
            SLOT {slotNum < 10 ? `0${slotNum}` : slotNum}
          </div>
        )}

        {/* Top Header: Bulatan Hijau di ATAS Angka Slot (Konsisten 100% dengan Seluruh Slot) */}
        <div className="w-full flex flex-col items-center pt-0.5 px-0.5 shrink-0">
          <div className="h-[6px] flex items-center justify-center mb-0.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_2.5px_#10B981]" />
          </div>
          <div className="w-full h-[10px] flex items-center justify-center shrink-0">
            <span
              className={`text-[7.5px] font-bold font-mono leading-none ${
                activeHighlight ? "text-amber-950 font-black" : "text-slate-800"
              }`}
            >
              {slotNum}
            </span>
          </div>
        </div>

        {/* Upper Tall Vertical Ejector Lever with White F badge Centered at TOP */}
        <div className="w-full flex flex-col items-center shrink-0 mt-1">
          <div className="w-[15px] h-[38px] bg-gradient-to-b from-[#27272A] via-[#18181B] to-[#09090B] rounded-[2px] border border-black shadow-md flex flex-col items-center justify-between py-1">
            <svg viewBox="0 0 10 8" className="w-[10px] h-[7.5px] shadow-xs shrink-0">
              <rect x="0.5" y="0.5" width="9" height="7" rx="1" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="0.8" />
              <text x="5" y="4.5" fill="#0F172A" fontSize="5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="central">F</text>
            </svg>
            <div className="w-[5px] h-[13px] bg-[#09090B] rounded-xs border border-neutral-700 shadow-inner" />
            <span className="w-2 h-0.5 bg-neutral-500 rounded-full" />
          </div>
        </div>

        {/* Center Silkscreen SC24T & 6-Bar Interconnect Gauge (Tanpa Kotak Hitam & Tanpa Teks 1.2T Sesuai Permintaan User) */}
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 py-2">
          <span
            className={`text-[6.5px] font-mono font-bold tracking-tight uppercase leading-none mb-3 ${
              activeHighlight ? "text-amber-950 font-black" : "text-slate-800"
            }`}
          >
            SC24T
          </span>

          {/* Vertical Pill Capsule with 6 Blue Dashes */}
          <div className="w-[8px] h-[64px] bg-[#D9E1EA] border border-[#B0BDCC] rounded-[2px] flex flex-col justify-between items-center py-2 shadow-inner">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={`gauge-dash-${idx}`}
                className="w-[4.5px] h-[1.5px] bg-[#0066FF] rounded-[0.5px] shadow-[0_0_2px_#0066FF]"
              />
            ))}
          </div>
        </div>

        {/* Lower Tall Vertical Ejector Lever with White F badge Centered at BOTTOM */}
        <div className="w-full flex flex-col items-center shrink-0 mb-1">
          <div className="w-[15px] h-[38px] bg-gradient-to-t from-[#27272A] via-[#18181B] to-[#09090B] rounded-[2px] border border-black shadow-md flex flex-col items-center justify-between py-1">
            <span className="w-2 h-0.5 bg-neutral-500 rounded-full" />
            <div className="w-[5px] h-[13px] bg-[#09090B] rounded-xs border border-neutral-700 shadow-inner" />
            <svg viewBox="0 0 10 8" className="w-[10px] h-[7.5px] shadow-xs shrink-0">
              <rect x="0.5" y="0.5" width="9" height="7" rx="1" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="0.8" />
              <text x="5" y="4.5" fill="#0F172A" fontSize="5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="central">F</text>
            </svg>
          </div>
        </div>

        {/* Bottom Slot Number */}
        <div className="w-full h-[12px] flex items-center justify-center shrink-0 mt-auto">
          <span
            className={`text-[7.5px] font-bold font-mono leading-none ${
              activeHighlight ? "text-amber-950 font-black" : "text-slate-800"
            }`}
          >
            {slotNum}
          </span>
        </div>
      </div>
    );
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
          <div className="hidden sm:flex shrink-0 items-center gap-2">
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
                isDark
                  ? "bg-[#071426] border-[#1E3A5F] text-[#38BDF8]"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">devices</span>
              <span>{devicesList.length || 2} Perangkat</span>
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
          className={`lg:col-span-5 rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 shadow-lg transition-all duration-300 flex flex-col justify-between h-full relative z-10 ${isDark
            ? "border-[#1E3A5F] bg-gradient-to-r from-[#071426] via-[#0D2341] to-[#0A182B] shadow-2xl shadow-blue-950/60"
            : "border-blue-200 bg-gradient-to-r from-white via-blue-50 to-white shadow-md shadow-blue-100/80"
            }`}
        >
          {/* Ambient Glow Terisolasi di Background (Agar Menu Dropdown Bebas Melayang Tanpa Terpotong) */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-500/25 dark:bg-blue-600/30 rounded-full blur-3xl" />
            <div className="absolute -top-12 -right-12 w-52 h-52 bg-cyan-500/20 dark:bg-cyan-500/25 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 left-1/4 w-72 h-72 bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-3xl" />
          </div>

          {/* Wrapper Konten Atas Viewfinder */}
          <div className="flex flex-col relative z-10">
            {/* Header Kontrol Scanner: Format Otentik Persis Sesuai Request Gambar */}
            <div className={`flex flex-nowrap items-center justify-between mb-3.5 pb-2.5 border-b gap-1.5 min-w-0 h-10 ${isDark ? "border-[#1A2E4C]/60" : "border-blue-100"}`}>
              {/* Title: Kamera AR Viewfinder (Ukuran Font Lebih Gede & Tegas) */}
              <div className="flex items-center gap-2 min-w-0 shrink-0">
                <span className={`material-symbols-outlined text-[21px] sm:text-[22px] shrink-0 ${isDark ? "text-[#00E5FF]" : "text-blue-600"}`}>
                  qr_code_scanner
                </span>
                <h2 className={`text-[15.5px] sm:text-[16.5px] font-bold tracking-tight whitespace-nowrap ${isDark ? "text-white" : "text-slate-900"}`}>
                  Kamera AR Viewfinder
                </h2>
              </div>

              {/* Action Buttons: Belakang, Foto QR, Scan Ulang (Format Otentik Kotak Rounded Rapi & Presisi) */}
              <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                {/* 1. Belakang */}
                <button
                  type="button"
                  onClick={() => setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"))}
                  title="Ganti Lensa Kamera"
                  className={`px-2 py-1 rounded-lg border text-[10.5px] font-medium flex items-center gap-1 transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] hover:border-[#00E5FF] hover:bg-[#0D2341] text-[#38BDF8] hover:text-[#00E5FF] shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                      : "bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 hover:text-blue-700 shadow-xs"
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px] leading-none shrink-0">flip_camera_ios</span>
                  <span className="whitespace-nowrap font-medium">
                    {cameraFacing === "environment" ? "Belakang" : "Depan"}
                  </span>
                </button>

                {/* 2. Foto QR */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  title="Unggah Gambar QR Code"
                  className={`px-2 py-1 rounded-lg border text-[10.5px] font-medium flex items-center gap-1 transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] hover:border-[#00E5FF] hover:bg-[#0D2341] text-[#38BDF8] hover:text-[#00E5FF] shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                      : "bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 hover:text-blue-700 shadow-xs"
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px] leading-none shrink-0">upload_file</span>
                  <span className="whitespace-nowrap font-medium">Foto QR</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* 3. Scan Ulang */}
                <button
                  type="button"
                  onClick={handleScanAnotherDevice}
                  title="Reset & Pindai Ulang Kamera / Perangkat"
                  className={`px-2 py-1 rounded-lg border text-[10.5px] font-medium flex items-center gap-1 transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] hover:border-[#00E5FF] hover:bg-[#0D2341] text-[#38BDF8] hover:text-[#00E5FF] shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                      : "bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 hover:text-blue-700 shadow-xs"
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px] leading-none shrink-0">restart_alt</span>
                  <span className="whitespace-nowrap font-medium">Scan Ulang</span>
                </button>
              </div>
            </div>

            {/* 4. CAMERA SCAN: Viewport Kamera Video dengan Gradasi Border Adaptif */}
            <div
              className={`relative w-full aspect-square max-h-[360px] rounded-2xl p-[2px] transition-all duration-300 shadow-xl ${
                isDark
                  ? "bg-gradient-to-br from-[#00E5FF]/50 via-[#1E3A5F] to-[#38BDF8]/40 shadow-[0_0_20px_rgba(0,229,255,0.15)]"
                  : "bg-gradient-to-br from-blue-400 via-sky-300 to-indigo-400 shadow-lg shadow-blue-500/15"
              }`}
            >
              <div id="ar-camera-viewport" className="ar-viewfinder-screen relative w-full h-full rounded-[14px] overflow-hidden bg-[#050D1A] flex items-center justify-center">
                {/* 1. Kontainer Kamera Video (Hanya tampil saat mode scan / belum ada QR aktif) */}
                <div
                  id="ar-qr-reader"
                  className={`w-full h-full object-cover relative z-[5] ${activeQrInfo ? "hidden" : "block"} ${!scannerActive || isCameraStandby ? "obs-standby-active" : ""}`}
                ></div>

                {/* 1B. Tampilan Standby Terpusat Saat Kamera Belum Aktif / OBS Idle: Bulatan Tepat di Tengah Kotak & Ikon Video di Tengah Bawah */}
                {!activeQrInfo && (!scannerActive || isCameraStandby) && (
                  <div
                    id="ar-camera-standby-overlay"
                    className="absolute inset-0 z-[2] pointer-events-none select-none overflow-hidden"
                    style={{
                      background: "linear-gradient(162deg, #071024 0%, #0A1734 45%, #0D1E45 65%, #060E20 100%)",
                    }}
                  >
                    {/* Bulatan Logo Kamera Standby: Tepat di Tengah Kotak Reticle Cyan */}
                    <div
                      className="absolute flex items-center justify-center"
                      style={{
                        top: "calc(50% + 9px)",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <svg viewBox="0 0 100 100" className="w-[126px] h-[126px] drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]">
                        <defs>
                          <linearGradient id="obs-ring-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="55%" stopColor="#E2E8F0" />
                            <stop offset="100%" stopColor="#94A3B8" />
                          </linearGradient>
                          <clipPath id="obs-inner-clip">
                            <circle cx="50" cy="50" r="41" />
                          </clipPath>
                        </defs>
                        {/* Outer Circle Ring */}
                        <circle cx="50" cy="50" r="45.5" fill="#070B14" stroke="url(#obs-ring-grad)" strokeWidth="4.2" opacity="0.95" />
                        {/* Classic OBS Swirl: White/Silver Swirl Field + 3 Dark Sculpted Lobes */}
                        <g clipPath="url(#obs-inner-clip)">
                          <circle cx="50" cy="50" r="41" fill="url(#obs-ring-grad)" opacity="0.92" />
                          {[0, 120, 240].map((deg) => (
                            <g key={deg} transform={`rotate(${deg} 50 50)`}>
                              <path
                                d="M 55 44 C 56 26, 65 13, 81 17 C 92 20, 95 38, 86 53 C 77 67, 62 64, 57 54 C 55 50, 55 47, 55 44 Z"
                                fill="#070B14"
                              />
                            </g>
                          ))}
                          {/* Thin dark inner border for crisp ring separation */}
                          <circle cx="50" cy="50" r="41" fill="none" stroke="#070B14" strokeWidth="2.5" />
                        </g>
                      </svg>
                    </div>

                    {/* Ikon Video Off: Dipertahankan Posisinya Tetap di Tengah Bagian Bawah */}
                    <div
                      className="absolute flex items-center justify-center"
                      style={{
                        bottom: "12px",
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="w-[52px] h-[52px]" fill="rgba(148, 163, 184, 0.45)">
                        <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* 2. HUD STATUS SCANNER / TARGET AR: Indikator Status Card dengan Gradasi Border Adaptif Transparan */}
                <div
                  className="absolute top-2.5 left-2.5 right-2.5 z-30 p-[1px] rounded-lg transition-all duration-300 shadow-md bg-gradient-to-r from-[#00E5FF]/70 via-[#1E3A5F] to-[#00E5FF]/70 shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                >
                  <div
                    className="w-full flex justify-between items-center px-3 py-1.5 rounded-[7px] text-[10px] font-mono backdrop-blur-md bg-[#050D1A]/85 text-[#38BDF8] transition-colors"
                  >
                    <span className="flex items-center gap-2 tracking-wider">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          activeQrInfo
                            ? "bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]"
                            : isDark
                              ? "bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-ping"
                              : "bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-pulse"
                        }`}
                      />
                      <span>{activeQrInfo ? "AR TARGET LOCKED" : "HUD SCANNER ACTIVE"}</span>
                    </span>
                    <span
                      style={{ borderColor: "rgba(0, 229, 255, 0.45)", color: "#00E5FF" }}
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1E3A5F]/70 text-[#00E5FF] border border-[#00E5FF]/30 font-mono"
                    >
                      {activeQrInfo ? activeQrInfo.siteCode : cameraFacing.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* 3. TAMPILAN VIEWPORT: Mode QR Code Eksklusif (Tanpa Kamera di Belakang) vs Mode Kamera Live */}
                {activeQrInfo ? (
                  /* ── MODE 1: QR CODE PERANGKAT AKTIF (KAMERA FISIK MATI & TIDAK ADA VIDEO DI BELAKANG) ── */
                  <div className="absolute inset-0 z-20 bg-gradient-to-b from-[#081528] via-[#050D1A] to-[#040812] flex flex-col items-center justify-center pt-8 pb-3 px-4 select-none animate-fadeIn">
                    {/* Reticle Frame AR Gradasi Biru / Cyan (Identik dengan Tema Gradasi) */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pt-14 pb-5 px-5 z-10">
                      <div className="flex justify-between items-start">
                        <div
                          style={{ borderColor: "#00E5FF" }}
                          className="w-7 h-7 border-t-2 border-l-2 rounded-tl-[2px] transition-colors border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.7)]"
                        />
                        <div
                          style={{ borderColor: "#00E5FF" }}
                          className="w-7 h-7 border-t-2 border-r-2 rounded-tr-[2px] transition-colors border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.7)]"
                        />
                      </div>

                      <div className="flex justify-between items-end">
                        <div
                          style={{ borderColor: "#00E5FF" }}
                          className="w-7 h-7 border-b-2 border-l-2 rounded-bl-[2px] transition-colors border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.7)]"
                        />
                        <div
                          style={{ borderColor: "#00E5FF" }}
                          className="w-7 h-7 border-b-2 border-r-2 rounded-br-[2px] transition-colors border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.7)]"
                        />
                      </div>
                    </div>

                    {/* QR Code Container Center */}
                    <div className="relative flex flex-col items-center z-20 pointer-events-auto">
                      {/* Kotak QR Code Otentik STO 1 / STO 2 (Bersih Tanpa Garis Gradasi / Tanpa Popup) */}
                      <div
                        className="relative p-2.5 rounded-xl bg-white shadow-2xl border-2 border-cyan-400/80 select-none"
                        style={{
                          boxShadow: isDark
                            ? "0 0 20px rgba(0,229,255,0.25)"
                            : "0 10px 25px -5px rgba(59,130,246,0.3)",
                        }}
                      >
                        {/* Sudut Frame AR Hologram */}
                        <div style={{ borderColor: "#00E5FF" }} className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#00E5FF]" />
                        <div style={{ borderColor: "#00E5FF" }} className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#00E5FF]" />
                        <div style={{ borderColor: "#00E5FF" }} className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#00E5FF]" />
                        <div style={{ borderColor: "#00E5FF" }} className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#00E5FF]" />

                        {/* Gambar QR Code Otentik STO 1 / STO 2 */}
                        <img
                          src={activeQrInfo.qrImg}
                          alt={`QR Code ${activeQrInfo.deviceName}`}
                          className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded-lg block"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── MODE 2: KAMERA SCANNER AKTIF (UNTUK PINDAI QR SECARA LIVE) ── */
                  <>
                    {/* Reticle Frame AR Pojok Viewfinder */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pt-14 pb-5 px-5 z-10">
                      <div className="flex justify-between items-start">
                        <div
                          style={{ borderColor: "#00E5FF" }}
                          className="w-7 h-7 border-t-2 border-l-2 rounded-tl-[2px] transition-colors border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.7)]"
                        />
                        <div
                          style={{ borderColor: "#00E5FF" }}
                          className="w-7 h-7 border-t-2 border-r-2 rounded-tr-[2px] transition-colors border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.7)]"
                        />
                      </div>

                      <div className="flex justify-between items-end">
                        <div
                          style={{ borderColor: "#00E5FF" }}
                          className="w-7 h-7 border-b-2 border-l-2 rounded-bl-[2px] transition-colors border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.7)]"
                        />
                        <div
                          style={{ borderColor: "#00E5FF" }}
                          className="w-7 h-7 border-b-2 border-r-2 rounded-br-[2px] transition-colors border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.7)]"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status teks di bawah kamera */}
            <div className="mt-3 text-center">
              <p className={`text-xs font-medium ${isDark ? "text-[#94A3B8]" : "text-slate-600"}`}>
                {activeQrInfo ? (
                  <span className="inline-flex items-center gap-1.5 text-[#00E5FF] font-semibold">
                    <span className="material-symbols-outlined text-[15px] animate-pulse">verified</span>
                    <span>
                      Target AR Terkunci: QR Code {activeQrInfo.deviceName} ({activeQrInfo.locationName}) aktif
                    </span>
                  </span>
                ) : (
                  cameraStatus
                )}
              </p>
              {cameraError && !scannerActive && (
                <div className="mt-2.5 p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 text-left flex items-start justify-between gap-2 animate-fadeIn">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-rose-400 mt-0.5 shrink-0">warning</span>
                    <span>{cameraError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCameraError(null)}
                    className="text-rose-400 hover:text-white transition-colors shrink-0 ml-1"
                    title="Tutup Notifikasi"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* KOLOM KANAN: DIGITAL TWIN RAK & PETA SLOT AR (7 COL)     */}
        {/* ======================================================== */}
        <div
          className={`lg:col-span-7 rounded-2xl border px-4 pt-4 pb-4 sm:px-5 sm:pt-5 sm:pb-4 shadow-lg transition-all duration-300 flex flex-col h-full relative z-10 ${isDark
            ? "border-[#1E3A5F] bg-gradient-to-r from-[#071426] via-[#0D2341] to-[#0A182B] shadow-2xl shadow-blue-950/60"
            : "border-blue-200 bg-gradient-to-r from-white via-blue-50 to-white shadow-md shadow-blue-100/80"
            }`}
        >
          {/* Ambient Glow Terisolasi di Background */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute -top-14 -left-14 w-72 h-72 bg-blue-500/25 dark:bg-blue-600/30 rounded-full blur-3xl" />
            <div className="absolute -top-14 -right-14 w-72 h-72 bg-cyan-500/20 dark:bg-cyan-500/25 rounded-full blur-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 left-1/3 w-80 h-80 bg-blue-500/15 dark:bg-blue-500/20 rounded-full blur-3xl" />
          </div>

          {/* Konten Utama Card 3 di Layer z-10 */}
          <div className="relative z-10 flex-1 flex flex-col">
            {loadingDevice ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center my-auto">
                <span className="material-symbols-outlined text-[40px] text-[#38BDF8] animate-spin">progress_activity</span>
                <p className={`text-sm mt-3 font-semibold ${isDark ? "text-[#E6EDF7]" : "text-slate-800"}`}>
                  Memuat spesifikasi rak & peta slot chassis...
                </p>
              </div>
            ) : currentDevice ? (
              <div className="flex-1 flex flex-col relative z-10">
                {/* Metadata Perangkat Header: Sejajar Sempurna dengan Garis Card Kamera AR Viewfinder */}
                <div className={`flex flex-nowrap items-center justify-between mb-3.5 pb-2.5 border-b gap-1.5 min-w-0 h-10 ${isDark ? "border-[#1A2E4C]/60" : "border-blue-100"}`}>
                  {/* Title & Icon: Ukuran Font Lebih Gede & Sama Persis dengan Kamera AR Viewfinder */}
                  <div className="flex items-center gap-2 min-w-0 shrink-0">
                    <span className={`material-symbols-outlined text-[21px] sm:text-[22px] shrink-0 ${isDark ? "text-[#00E5FF]" : "text-blue-600"}`}>hub</span>
                    <h2 className={`text-[15.5px] sm:text-[16.5px] font-bold tracking-tight whitespace-nowrap ${isDark ? "text-white" : "text-slate-900"}`}>
                      {currentDevice.nama_perangkat}
                    </h2>
                  </div>

                  {/* 3 Badges / Cards Dipojokkanankan (Far Right Corner): Konsisten Gap, Ukuran & Format */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                    <span
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold border whitespace-nowrap shrink-0 ${
                        isDark ? "bg-[#071426] text-[#38BDF8] border-[#1E3A5F]" : "bg-blue-50 text-blue-700 border-blue-200 shadow-xs"
                      }`}
                    >
                      {currentDevice.tipe}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-medium border flex items-center gap-1 whitespace-nowrap shrink-0 ${
                        isDark ? "bg-[#071426] text-[#CBD5E1] border-[#1E3A5F]" : "bg-white text-slate-700 border-slate-200 shadow-xs"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px] text-rose-400 shrink-0">location_on</span>
                      <span className="whitespace-nowrap font-medium">{currentDevice.lokasi}</span>
                    </span>
                    <span
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-mono font-medium border whitespace-nowrap shrink-0 ${
                        isDark ? "bg-[#071426] text-[#94A3B8] border-[#1E3A5F]" : "bg-white text-slate-600 border-slate-200 shadow-xs"
                      }`}
                    >
                      SN: {currentDevice.serial_number || "-"}
                    </span>
                  </div>
                </div>

                {/* Tabs Mode Pencarian & Form Search: Format Otentik Persis Sesuai Gambar 2 */}
                <div id="scan-search-container">
                  <div className={`flex gap-2 p-1 rounded-xl mb-3 border max-w-md ${isDark ? "bg-[#071426] border-[#1E3A5F]" : "bg-slate-100 border-slate-200"}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchMode("sn");
                        setSearchQuery("");
                        setSearchResult(null);
                        setHighlightedSlotId(null);
                        if (highlightedSlotIdRef) highlightedSlotIdRef.current = null;
                        setSelectedSlotForAction(null);
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${searchMode === "sn"
                        ? "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/30"
                        : isDark ? "text-[#94A3B8] hover:text-[#E6EDF7]" : "text-slate-600 hover:text-slate-900"
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
                        setHighlightedSlotId(null);
                        if (highlightedSlotIdRef) highlightedSlotIdRef.current = null;
                        setSelectedSlotForAction(null);
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${searchMode === "slot"
                        ? "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/30"
                        : isDark ? "text-[#94A3B8] hover:text-[#E6EDF7]" : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      <span>📦 Cari by Nomor Slot</span>
                    </button>
                  </div>

                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#64748B] pointer-events-none select-none">
                        search
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchQuery(val);
                          // Saat nomor slot / query dihapus atau dikosongkan, popup/card hasil pencarian otomatis hilang
                          if (!val.trim()) {
                            setSearchResult(null);
                            setHighlightedSlotId(null);
                            if (highlightedSlotIdRef) highlightedSlotIdRef.current = null;
                            setSelectedSlotForAction(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setSearchQuery("");
                            setSearchResult(null);
                            setHighlightedSlotId(null);
                            if (highlightedSlotIdRef) highlightedSlotIdRef.current = null;
                            setSelectedSlotForAction(null);
                          }
                        }}
                        placeholder={
                          searchMode === "sn"
                            ? "Masukkan nomor seri modul (cth: CFP2-001, SN-...)"
                            : "Masukkan nomor slot (cth: 1, 2, 5...)"
                        }
                        style={isDark ? { backgroundColor: "#0A182B", color: "#E6EDF7" } : undefined}
                        className={`scan-search-input w-full h-11 pl-10 pr-9 rounded-xl border text-xs sm:text-sm outline-none transition-all duration-200 ease-in-out ${isDark
                          ? "bg-[#0A182B] border-transparent text-[#E6EDF7] placeholder-[#4d6686] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white"
                          }`}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setSearchResult(null);
                            setHighlightedSlotId(null);
                            if (highlightedSlotIdRef) highlightedSlotIdRef.current = null;
                            setSelectedSlotForAction(null);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="Hapus pencarian"
                        >
                          <span className="material-symbols-outlined text-[16px] block">close</span>
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={searching || !searchQuery.trim()}
                      className="h-11 px-5 rounded-xl font-semibold text-xs text-white bg-[#1677FF] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#1677FF]/25 flex items-center gap-1.5 cursor-pointer"
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

                {/* Alert / Card Hasil Pencarian (Hanya Muncul Saat Ada Hasil Pencarian - Diberi mt-3.5 / 14px Gap Konsisten) */}
                {searchResult && (
                  <div id="search-result-box" className="animate-fadeIn mt-3.5">
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
                        <button
                          type="button"
                          onClick={() => {
                            setSearchResult(null);
                            setHighlightedSlotId(null);
                            if (highlightedSlotIdRef) highlightedSlotIdRef.current = null;
                            setSelectedSlotForAction(null);
                          }}
                          className={`shrink-0 ml-auto p-1 rounded-lg transition-colors cursor-pointer ${
                            isDark
                              ? "text-amber-400 hover:text-white hover:bg-amber-500/20"
                              : "text-amber-700 hover:text-amber-900 hover:bg-amber-200/50"
                          }`}
                          title="Tutup Notifikasi"
                        >
                          <span className="material-symbols-outlined text-[16px] block">close</span>
                        </button>
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
                {/* 3D DIGITAL TWIN VIEWER                                   */}
                {/* ======================================================== */}
                {/* ── 3D ISOMETRIC CHASSIS VIEWPORT (ANTI-GEPENG) ── */}
                <div className="mt-4 space-y-3 animate-fadeIn">
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
                        {/* Presets Sudut Pandang (360° Penuh: Depan, Isometrik, Samping Kanan, Belakang, Samping Kiri) */}
                        <div className={`flex items-center gap-1 p-0.5 rounded-lg border transition-colors ${isDark ? "bg-[#050D1A] border-[#1E3A5F]" : "bg-slate-100 border-slate-300 shadow-sm"
                          }`}>
                          <button
                            type="button"
                            onClick={() => { setRotX(0); setRotY(0); setZoomLevel(1.0); }}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${((rotY % 360) + 360) % 360 < 30 || ((rotY % 360) + 360) % 360 >= 330
                                ? "bg-[#1677FF] text-white shadow-sm font-bold"
                                : isDark
                                  ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
                              }`}
                            title="Tampak Depan (0°)"
                          >
                            ⏹️ Depan
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRotX(14); setRotY(-22); setZoomLevel(1.0); }}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${rotX === 14 && rotY === -22
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
                            onClick={() => { setRotX(0); setRotY(90); setZoomLevel(1.0); }}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${Math.round(((rotY % 360) + 360) % 360) === 90
                                ? "bg-[#1677FF] text-white shadow-sm font-bold"
                                : isDark
                                  ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
                              }`}
                            title="Tampak Samping Kanan (90°)"
                          >
                            ▶️ Samping
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRotX(0); setRotY(180); setZoomLevel(1.0); }}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${Math.round(((rotY % 360) + 360) % 360) === 180
                                ? "bg-[#1677FF] text-white shadow-sm font-bold"
                                : isDark
                                  ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
                              }`}
                            title="Tampak Belakang (180°)"
                          >
                            ◀️ Belakang
                          </button>
                        </div>

                        {/* Zoom Controls (Kecil proporsional saat Zoom Out, Besar HD saat Zoom In) */}
                        <div className={`flex items-center gap-1.5 p-0.5 rounded-lg border transition-colors ${isDark ? "bg-[#050D1A] border-[#1E3A5F]" : "bg-slate-100 border-slate-300 shadow-sm"
                          }`}>
                          <button
                            type="button"
                            onClick={() => setZoomLevel((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))))}
                            className={`p-1 rounded cursor-pointer transition-colors ${isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-600 hover:text-slate-900 hover:bg-white"
                              }`}
                            title="Perkecil Zoom (Ukuran Real STO)"
                          >
                            <span className="material-symbols-outlined text-[15px]">zoom_out</span>
                          </button>
                          <input
                            type="range"
                            min="0.6"
                            max="2.0"
                            step="0.05"
                            value={zoomLevel}
                            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                            className="w-14 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1677FF]"
                            title={`Skala: ${Math.round(zoomLevel * 100)}%`}
                          />
                          <button
                            type="button"
                            onClick={() => setZoomLevel((prev) => Math.min(2.0, Number((prev + 0.1).toFixed(2))))}
                            className={`p-1 rounded cursor-pointer transition-colors ${isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-600 hover:text-slate-900 hover:bg-white"
                              }`}
                            title="Perbesar Zoom (Detail HD)"
                          >
                            <span className="material-symbols-outlined text-[15px]">zoom_in</span>
                          </button>
                          <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                            {Math.round(zoomLevel * 100)}%
                          </span>
                          <button
                            type="button"
                            onClick={() => { setRotX(0); setRotY(0); setZoomLevel(1.0); }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-800/60" : "text-slate-600 hover:text-slate-900 hover:bg-white"
                              }`}
                            title="Reset Tampak Depan & Skala 100%"
                          >
                            Reset
                          </button>
                        </div>

                        {/* Toggle Sensor IMU Gyroscope */}
                        <button
                          type="button"
                          onClick={() => setImuActive(!imuActive)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${imuActive
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

                    {/* Canvas Viewport 3D (Adaptif Tema Dark / Light Mode) */}
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
                      className={`relative w-full min-h-[720px] rounded-2xl overflow-hidden border flex items-center justify-center cursor-grab active:cursor-grabbing select-none p-2 sm:p-4 transition-colors duration-300 ${isDark
                          ? "border-[#1E3A5F] bg-gradient-to-b from-[#030712] via-[#071324] to-[#0A1A2F]"
                          : "border-slate-300 bg-gradient-to-b from-slate-100 via-blue-50/50 to-slate-200 shadow-inner"
                        }`}
                      style={{ perspective: "1400px" }}
                    >
                      {/* Grid Background Ambient Wireframe (Adaptif Biru / Cyan) */}
                      <div
                        className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-20" : "opacity-35"}`}
                        style={{
                          backgroundImage: isDark
                            ? "radial-gradient(#00E5FF 1px, transparent 1px)"
                            : "radial-gradient(#1677FF 1.2px, transparent 1.2px)",
                          backgroundSize: "28px 28px",
                        }}
                      />

                      {/* HUD Telemetry Overlay di Atas 3D */}
                      <div className={`absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono pointer-events-none z-30 ${isDark ? "text-[#38BDF8]" : "text-blue-700"
                        }`}>
                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md border backdrop-blur-sm shadow-sm ${isDark
                            ? "bg-black/70 border-[#00E5FF]/20"
                            : "bg-white/85 border-blue-200 text-blue-900"
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-[#00E5FF] animate-ping" : "bg-[#1677FF] animate-pulse"}`} />
                          <span className="font-bold">
                            {((rotY % 360) + 360) % 360 >= 45 && ((rotY % 360) + 360) % 360 < 135
                              ? "3D RACK: TAMPAK SAMPING KANAN"
                              : ((rotY % 360) + 360) % 360 >= 135 && ((rotY % 360) + 360) % 360 < 225
                                ? "3D RACK: TAMPAK BELAKANG (DUAL PSU & EXHAUST)"
                                : ((rotY % 360) + 360) % 360 >= 225 && ((rotY % 360) + 360) % 360 < 315
                                  ? "3D RACK: TAMPAK SAMPING KIRI"
                                  : "3D RACK: TAMPAK DEPAN (29 SLOT FISIK)"}
                          </span>
                        </div>
                        <div className={`px-2.5 py-1 rounded-md border backdrop-blur-sm shadow-sm ${isDark
                            ? "bg-black/70 border-[#00E5FF]/20"
                            : "bg-white/85 border-blue-200 text-blue-900 font-semibold"
                          }`}>
                          ROT: X {Math.round(rotX)}° | Y {Math.round(((rotY % 360) + 360) % 360)}° • SKALA {Math.round(zoomLevel * 100)}%
                        </div>
                      </div>

                      {/* Kontainer Rak 3D (Preserve 3D) */}
                      <div
                        className="transition-transform duration-100 ease-out py-2"
                        style={{
                          transformStyle: "preserve-3d",
                          transform: `scale(${zoomLevel}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                        }}
                      >
                        {/* SUBRACK CHASSIS 3D SOLID CUBOID BOX (NOKIA 1830 PSS-24X HD) */}
                        <div
                          id="subrack-chassis-3d"
                          data-hardware-device="true"
                          data-preserve-theme="true"
                          className="relative rounded-none"
                          style={{
                            width: "540px",
                            height: "560px",
                            transformStyle: "preserve-3d",
                            borderRadius: "0px",
                          }}
                        >
                          {/* ── 3D CUBOID SLOPED CANOPY FAN TRAY (#face-canopy-fan - CUMA JARING-JARING HONEYCOMB MESH) ── */}
                          <div
                            id="face-canopy-fan"
                            data-hardware-device="true"
                            data-preserve-theme="true"
                            className="absolute select-none overflow-hidden p-1 flex flex-col justify-between"
                            style={{
                              width: "540px",
                              height: "222px",
                              top: "0",
                              left: "0",
                              transformOrigin: "top center",
                              transform: "translateZ(100px) rotateX(-65.7725deg) scaleX(-1)",
                              transformStyle: "preserve-3d",
                              backfaceVisibility: "visible",
                              background: "linear-gradient(180deg, #94A3B8 0%, #CBD5E1 15%, #E2E8F0 50%, #94A3B8 90%, #64748B 100%)",
                              border: "2px solid #475569",
                              borderRadius: "0px",
                              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.8)",
                            }}
                          >
                            {/* Top Galvanized Bracket with Stamped Slots */}
                            <div className="bg-gradient-to-b from-[#CBD5E1] via-[#94A3B8] to-[#64748B] border border-slate-600 rounded-[2px] h-4 flex justify-between items-center px-2 shadow-inner shrink-0">
                              <div className="flex gap-2 items-center">
                                {[...Array(14)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-[2.5px] h-[9px] bg-slate-700 rounded-[0.5px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_0.5px_0_rgba(255,255,255,0.5)]"
                                  />
                                ))}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[7px] font-black text-slate-900 tracking-wider">
                                  TOP EXHAUST CANOPY &bull; 3x HIGH-CAPACITY FAN TRAYS
                                </span>
                              </div>
                            </div>

                            {/* 3 Fan Modules Container (Cuma Jaring-Jaring Hexagonal Honeycomb Penuh - Sesuai Request User) */}
                            <div className="grid grid-cols-3 gap-1.5 flex-1 mt-1 relative min-h-0">
                              {[
                                { slotNum: 30, label: "FAN 1 (SLOT 30)", sn: "BT203700709" },
                                { slotNum: 31, label: "FAN 2 (SLOT 31)", sn: "BT203700703" },
                                { slotNum: 32, label: "FAN 3 (SLOT 32)", sn: "BT203700690" },
                              ].map(({ slotNum, label, sn }, idx) => {
                                const s = getSlot(slotNum);
                                const isHighlighted = s.slot_definition_id === highlightedSlotId;
                                const isSelected = selectedSlotForAction?.slot_definition_id === s.slot_definition_id;
                                const isAct = isHighlighted || isSelected;

                                return (
                                  <div
                                    key={`canopy-fan-${slotNum}`}
                                    id={`slot-item-${s.slot_definition_id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSlotCardClick(s, true);
                                      showSlotPopup(e, s);
                                    }}
                                    onMouseEnter={(e) => showSlotPopup(e, s)}
                                    onMouseLeave={() => hideSlotPopup(s.slot_definition_id)}
                                    className={`relative rounded-[3px] border transition-all cursor-pointer flex flex-col justify-between p-1 bg-gradient-to-b from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8] shadow-md overflow-hidden ${
                                      isAct
                                        ? "border-2 !border-amber-500 shadow-[0_0_12px_#F59E0B] ring-2 ring-amber-400 bg-amber-50 scale-[1.01] z-20"
                                        : "border-slate-500 hover:border-blue-500 hover:shadow-lg"
                                    }`}
                                    title={`${label} • Serial: ${s.occupied && s.module ? s.module.serial_number : sn} (Klik untuk inspeksi)`}
                                  >
                                    {/* Full Height Metallic Outer Bezel for Honeycomb */}
                                    <div className="bg-slate-950 border-2 border-slate-300 rounded-[2px] shadow-[inset_0_6px_16px_rgba(0,0,0,0.95),0_1px_3px_rgba(0,0,0,0.5)] flex-1 relative overflow-hidden flex justify-center items-center">
                                      {/* Impeller Cavity with Dual Circular Rings Behind Mesh */}
                                      <div className="absolute inset-0 flex justify-around items-center opacity-65">
                                        <div className="w-18 h-18 rounded-full border-2 border-white/18 shadow-[inset_0_0_20px_#000] flex items-center justify-center">
                                          <div className="w-5 h-5 rounded-full bg-black border border-white/25" />
                                        </div>
                                        <div className="w-18 h-18 rounded-full border-2 border-white/18 shadow-[inset_0_0_20px_#000] flex items-center justify-center">
                                          <div className="w-5 h-5 rounded-full bg-black border border-white/25" />
                                        </div>
                                      </div>

                                      {/* Full Height Stepped/Notched Hexagonal Honeycomb Grille */}
                                      <svg className="w-full h-full absolute inset-0 z-5 pointer-events-none" viewBox="0 0 160 160" preserveAspectRatio="none">
                                        <defs>
                                          <pattern id={`hex-pat-jsx-${idx}`} width="12" height="20.78" patternUnits="userSpaceOnUse">
                                            <path d="M 6,0 L 12,3.46 L 12,10.39 L 6,13.86 L 0,10.39 L 0,3.46 Z" fill="none" stroke="#CBD5E1" strokeWidth="1.6" />
                                            <path d="M 6,0 L 12,3.46 L 12,10.39 L 6,13.86 L 0,10.39 L 0,3.46 Z" fill="none" stroke="#FFFFFF" strokeWidth="0.7" opacity="0.8" />
                                            <path d="M 0,10.39 L 6,13.86 L 6,20.78 L 0,24.25 L -6,20.78 L -6,13.86 Z" fill="none" stroke="#CBD5E1" strokeWidth="1.6" />
                                            <path d="M 12,10.39 L 18,13.86 L 18,20.78 L 12,24.25 L 6,20.78 L 6,13.86 Z" fill="none" stroke="#CBD5E1" strokeWidth="1.6" />
                                          </pattern>
                                          <clipPath id={`notched-full-clip-jsx-${idx}`}>
                                            <polygon points="4,2 156,2 156,110 144,110 144,158 16,158 16,110 4,110" />
                                          </clipPath>
                                        </defs>
                                        <polygon points="4,2 156,2 156,110 144,110 144,158 16,158 16,110 4,110" fill={`url(#hex-pat-jsx-${idx})`} stroke="#E2E8F0" strokeWidth="2.2" clipPath={`url(#notched-full-clip-jsx-${idx})`} />
                                        <polygon points="4,2 156,2 156,110 144,110 144,158 16,158 16,110 4,110" fill="none" stroke="#CBD5E1" strokeWidth="2" />
                                        <polygon points="5,3 155,3 155,109 143,109 143,157 17,157 17,109 5,109" fill="none" stroke="#000000" strokeWidth="0.8" opacity="0.6" />
                                      </svg>

                                      {/* Pure honeycomb exhaust mesh - clean without text overlay */}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* ── 3D CUBOID BOTTOM BASE (DINDING BAWAH - SUB-RACK BASE PLATE PRESISI TANPA CELAH & TANPA TULISAN) ── */}
                          <div
                            className="absolute pointer-events-none rounded-none overflow-hidden select-none"
                            style={{
                              width: "540px",
                              height: "200px",
                              top: "460px",
                              left: "0px",
                              transformOrigin: "center center",
                              transform: "rotateX(-90deg) translateZ(0)",
                              transformStyle: "preserve-3d",
                              backfaceVisibility: "hidden",
                              background: "#080C16",
                              boxShadow: "0 0 0 1px #080C16",
                              borderRadius: "0px",
                            }}
                          >
                            <div className="w-full h-full flex flex-col justify-between items-center py-2 px-3 rounded-none bg-[#080C16]">
                              <div className="w-full flex justify-around">
                                {[...Array(6)].map((_, i) => (
                                  <div key={`b-bolt-top-${i}`} className="w-2 h-2 rounded-full bg-slate-700/50 border border-slate-800 shadow-inner" />
                                ))}
                              </div>
                              <div className="w-full flex justify-around">
                                {[...Array(6)].map((_, i) => (
                                  <div key={`b-bolt-bot-${i}`} className="w-2 h-2 rounded-full bg-slate-700/50 border border-slate-800 shadow-inner" />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* ── 3D CUBOID LEFT SIDE WALL (TAMPAK SAMPING KIRI - OTENTIK GALVANIZED STEEL & BRACKETS) ── */}
                          <SubrackSideWall side="left" />

                          {/* ── 3D CUBOID RIGHT SIDE WALL (TAMPAK SAMPING KANAN - OTENTIK GALVANIZED STEEL & BRACKETS) ── */}
                          <SubrackSideWall side="right" />

                          {/* ── 3D CUBOID REAR FACE (TAMPAK BELAKANG OTENTIK - EXACT GAMBAR 2 USER) ── */}
                          <div
                            id="face-rear"
                            data-hardware-device="true"
                            data-preserve-theme="true"
                            className="absolute rounded-none border-2 border-slate-400 bg-gradient-to-b from-[#CBD5E1] via-[#B0BDCC] to-[#7E8B9B] p-1 text-slate-900 select-none flex flex-col justify-between overflow-hidden"
                            style={{
                              width: "540px",
                              height: "472px",
                              top: "88px",
                              left: "0",
                              transform: "rotateY(180deg) translateZ(100px)",
                              transformStyle: "preserve-3d",
                              backfaceVisibility: "hidden",
                              borderRadius: "0px",
                            }}
                          >
                            {/* ── VERTICAL RACK MOUNTING FLANGES (KUPING RAK 19" ALUMINIUM BRUSHED) ── */}
                            {/* Left Vertical Mounting Ear */}
                            <div
                              className="absolute -left-7 top-1 bottom-1 w-7 pointer-events-none z-10 rounded-md"
                              style={{
                                transform: "translateZ(6px)",
                                transformStyle: "preserve-3d",
                                background: "linear-gradient(to right, #94A3B8 0%, #E2E8F0 35%, #CBD5E1 70%, #64748B 100%)",
                                border: "1px solid #94A3B8",
                              }}
                            >
                              <div className="h-full flex flex-col justify-between items-start pl-1 py-2">
                                {[...Array(6)].map((_, i) => (
                                  <div key={i} className="w-2.5 h-3 rounded-[2px] bg-slate-900 border border-slate-500/80 shadow-inner" title="19-inch EIA-310 Rack Hole" />
                                ))}
                              </div>
                              <div className="absolute top-2 bottom-2 right-1 flex flex-col justify-between items-center">
                                {[...Array(5)].map((_, i) => (
                                  <div key={i} className="w-2 h-2 rounded-full bg-gradient-to-b from-slate-100 to-slate-400 border border-slate-500 shadow-sm flex items-center justify-center text-[5px] text-slate-800 font-bold">
                                    +
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Right Vertical Mounting Ear */}
                            <div
                              className="absolute -right-7 top-1 bottom-1 w-7 pointer-events-none z-10 rounded-md"
                              style={{
                                transform: "translateZ(6px)",
                                transformStyle: "preserve-3d",
                                background: "linear-gradient(to left, #94A3B8 0%, #E2E8F0 35%, #CBD5E1 70%, #64748B 100%)",
                                border: "1px solid #94A3B8",
                              }}
                            >
                              <div className="h-full flex flex-col justify-between items-end pr-1 py-2">
                                {[...Array(6)].map((_, i) => (
                                  <div key={i} className="w-2.5 h-3 rounded-[2px] bg-slate-900 border border-slate-500/80 shadow-inner" title="19-inch EIA-310 Rack Hole" />
                                ))}
                              </div>
                              <div className="absolute top-2 bottom-2 left-1 flex flex-col justify-between items-center">
                                {[...Array(5)].map((_, i) => (
                                  <div key={i} className="w-2 h-2 rounded-full bg-gradient-to-b from-slate-100 to-slate-400 border border-slate-500 shadow-sm flex items-center justify-center text-[5px] text-slate-800 font-bold">
                                    +
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* ── 1. ROW OF 3 FTU FAN CASSETTES (Slots 30, 31, 32 - Exact Real Photo & Gambar 2) ── */}
                            <div className="grid grid-cols-3 gap-1.5 h-[58px] shrink-0">
                              {[
                                { slotNum: 30, label: "FTU-1 (SLOT 30)" },
                                { slotNum: 31, label: "FTU-2 (SLOT 31)" },
                                { slotNum: 32, label: "FTU-3 (SLOT 32)" },
                              ].map(({ slotNum, label }, idx) => {
                                const s = getSlot(slotNum);
                                const pn = s.occupied && s.module?.unit_part_number ? s.module.unit_part_number : "-";
                                const sn = s.occupied && s.module?.serial_number ? s.module.serial_number : "-";
                                const isHighlighted = s.slot_definition_id === highlightedSlotId;
                                const isSelected = selectedSlotForAction?.slot_definition_id === s.slot_definition_id;
                                const isAct = isHighlighted || isSelected;

                                return (
                                  <div
                                    key={`rear-fan-${slotNum}`}
                                    id={`slot-item-${s.slot_definition_id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSlotCardClick(s, true);
                                      showSlotPopup(e, s);
                                    }}
                                    onMouseEnter={(e) => showSlotPopup(e, s)}
                                    onMouseLeave={() => hideSlotPopup(s.slot_definition_id)}
                                    className={`relative rounded-[3px] border transition-all cursor-pointer flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F4F4F5] to-[#E4E4E7] shadow-xs select-none ${
                                      isAct
                                        ? "border-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.7)] bg-amber-50/20 z-20"
                                        : "border-slate-400 hover:border-blue-500 hover:shadow-md"
                                    }`}
                                    title={`${label} • Part: ${pn} • Serial: ${s.occupied && s.module ? s.module.serial_number : sn} (Klik untuk inspeksi)`}
                                  >
                                    {/* Active Selection Frame Overlay: Encompasses 100% of the fan tray slot */}
                                    {isAct && (
                                      <div className="absolute inset-0 pointer-events-none rounded-[3px] border-2 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.9),inset_0_0_8px_rgba(245,158,11,0.25)] z-35" />
                                    )}
                                    {/* Authentic Cylindrical Lug Bosses & Deep U-Shaped Bail Pull Handle with Realistic Drop Shadow */}
                                    <div className="h-[34px] w-full flex justify-center items-center relative">
                                      <svg viewBox="0 0 170 34" className="w-full h-[34px] pointer-events-none" fill="none">
                                        <defs>
                                          <filter id={`photo-cast-shadow-${idx}`} x="-20%" y="-20%" width="140%" height="150%">
                                            <feDropShadow dx="3" dy="3.5" stdDeviation="1.8" floodColor="#18181B" floodOpacity="0.35" />
                                          </filter>
                                          <linearGradient id={`rod-metal-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#FFFFFF" />
                                            <stop offset="25%" stopColor="#E4E4E7" />
                                            <stop offset="65%" stopColor="#A1A1AA" />
                                            <stop offset="100%" stopColor="#52525B" />
                                          </linearGradient>
                                          <radialGradient id={`boss-face-${idx}`} cx="40%" cy="35%" r="65%">
                                            <stop offset="0%" stopColor="#FFFFFF" />
                                            <stop offset="35%" stopColor="#E4E4E7" />
                                            <stop offset="75%" stopColor="#A1A1AA" />
                                            <stop offset="100%" stopColor="#52525B" />
                                          </radialGradient>
                                        </defs>

                                        {/* Real Cast Shadow behind the handle bar (from top-left lighting) */}
                                        <path d="M 38,6 L 38,20 Q 38,26.5 48,26.5 L 122,26.5 Q 132,26.5 132,20 L 132,6" stroke="#000000" strokeWidth="4.2" strokeLinecap="round" fill="none" opacity="0.3" filter={`url(#photo-cast-shadow-${idx})`} />

                                        {/* Left Cylindrical Projection Boss (Lug Hinge) */}
                                        <rect x="33.5" y="1.5" width="9" height="10" rx="4.5" fill="#71717A" />
                                        <circle cx="38" cy="6" r="4.8" fill={`url(#boss-face-${idx})`} stroke="#52525B" strokeWidth="0.7" />
                                        <rect x="36.8" y="3" width="2.4" height="6" rx="1.2" fill="#27272A" />

                                        {/* Right Cylindrical Projection Boss (Lug Hinge) */}
                                        <rect x="127.5" y="1.5" width="9" height="10" rx="4.5" fill="#71717A" />
                                        <circle cx="132" cy="6" r="4.8" fill={`url(#boss-face-${idx})`} stroke="#52525B" strokeWidth="0.7" />
                                        <rect x="130.8" y="3" width="2.4" height="6" rx="1.2" fill="#27272A" />

                                        {/* The U-Shaped Bail Handle Wire */}
                                        <path d="M 38,5.5 L 38,19 Q 38,25 48,25 L 122,25 Q 132,25 132,19 L 132,5.5" stroke="#3F3F46" strokeWidth="3.6" strokeLinecap="round" fill="none" />
                                        <path d="M 38,5.5 L 38,19 Q 38,25 48,25 L 122,25 Q 132,25 132,19 L 132,5.5" stroke={`url(#rod-metal-${idx})`} strokeWidth="2.4" strokeLinecap="round" fill="none" />
                                        <path d="M 38,5.5 L 38,18.5 Q 38,24.2 48,24.2 L 122,24.2 Q 132,24.2 132,18.5 L 132,5.5" stroke="#FFFFFF" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.95" />

                                        {/* Boss center pivot pins */}
                                        <circle cx="38" cy="6" r="1.1" fill="#E4E4E7" stroke="#27272A" strokeWidth="0.5" />
                                        <circle cx="132" cy="6" r="1.1" fill="#E4E4E7" stroke="#27272A" strokeWidth="0.5" />
                                      </svg>
                                    </div>

                                    {/* Authentic Decal Chin Tab: Strictly Padded Triangles & Neon Green Glowing STAT */}
                                    <div className="h-[21px] bg-white border-t border-slate-300 px-1 mx-0.5 mb-0.5 rounded-[1px] flex justify-between items-center box-border shadow-xs">
                                      <div className="flex items-center gap-1">
                                        {/* ♨️ Hot Surface Warning: Strictly inside border, zero overflow */}
                                        <svg viewBox="0 0 20 18" className="w-3.5 h-3 shrink-0" fill="none">
                                          <polygon points="10,2 18,16 2,16" fill="#FACC15" stroke="#000000" strokeWidth="1.4" strokeLinejoin="round" />
                                          <path d="M 6.5,13.2 L 13.5,13.2" stroke="#000000" strokeWidth="1.1" strokeLinecap="round" />
                                          <path d="M 8.2,11.5 Q 8.8,9.8 8.2,8.2 Q 7.6,6.8 8.2,5.5" stroke="#000000" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                                          <path d="M 10.0,11.5 Q 10.6,9.8 10.0,8.2 Q 9.4,6.8 10.0,5.5" stroke="#000000" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                                          <path d="M 11.8,11.5 Q 12.4,9.8 11.8,8.2 Q 11.2,6.8 11.8,5.5" stroke="#000000" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                                        </svg>

                                        {/* ⚠️ Caution / Hazard Warning: Strictly inside border, zero overflow */}
                                        <svg viewBox="0 0 20 18" className="w-3.5 h-3 shrink-0" fill="none">
                                          <polygon points="10,2 18,16 2,16" fill="#FACC15" stroke="#000000" strokeWidth="1.4" strokeLinejoin="round" />
                                          <path d="M 10,5.8 L 10,10.2" stroke="#000000" strokeWidth="1.6" strokeLinecap="round" />
                                          <circle cx="10" cy="13.0" r="1.0" fill="#000000" />
                                        </svg>

                                        {/* 🟢 BRIGHT NEON GREEN GLOWING LED & STAT */}
                                        <div className="flex items-center gap-1 ml-0.5">
                                          <div
                                            className="w-2 h-2 rounded-full flex items-center justify-center shrink-0"
                                            style={{
                                              background: "radial-gradient(circle, #FFFFFF 0%, #39FF14 45%, #00DD44 100%)",
                                              border: "1px solid #00FF66",
                                              boxShadow: "0 0 4px #00FF66, 0 0 8px #39FF14, 0 0 14px rgba(57, 255, 20, 0.75)",
                                            }}
                                          >
                                            <div className="w-0.5 h-0.5 rounded-full bg-white opacity-90" />
                                          </div>
                                          <span className="font-mono text-[7px] font-black text-slate-900 tracking-wider">
                                            STAT
                                          </span>
                                        </div>
                                      </div>

                                      {/* Barcodes matching Gambar 2 & Real Photo */}
                                      <div className="flex items-center gap-1.5">
                                        {/* Part Number Barcode */}
                                        <div className="border-l border-slate-300 pl-1 flex items-center gap-0.5">
                                          <div className="flex flex-col">
                                            <span className="font-mono font-black text-[4.5px] text-slate-900 leading-none">{pn}</span>
                                            <span className="font-mono text-[3.8px] text-slate-600 leading-none">FTU24X Fan</span>
                                            <span className="font-mono text-[3.5px] text-slate-500 leading-none">Rate: 12V 16A</span>
                                          </div>
                                          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 bg-white border border-slate-500 p-0.2 shrink-0">
                                            <rect x="0" y="0" width="10" height="1.5" fill="#000" />
                                            <rect x="0" y="0" width="1.5" height="10" fill="#000" />
                                            <rect x="3" y="3" width="2" height="2" fill="#000" />
                                            <rect x="7" y="3" width="2" height="2" fill="#000" />
                                            <rect x="3" y="7" width="2" height="2" fill="#000" />
                                            <rect x="7" y="7" width="1.5" height="1.5" fill="#000" />
                                            <rect x="5" y="1" width="1" height="1" fill="#000" />
                                          </svg>
                                        </div>

                                        {/* Serial Number Barcode */}
                                        <div className="border-l border-slate-300 pl-1 flex items-center gap-0.5">
                                          <div className="flex flex-col">
                                            <span className="font-mono font-black text-[4.5px] text-slate-900 leading-none">{s.occupied && s.module ? s.module.serial_number : sn}</span>
                                            <span className="font-mono text-[3.8px] text-slate-600 leading-none">FTU-Cassette</span>
                                            <span className="font-mono text-[3.5px] text-slate-500 leading-none">12V - 16A</span>
                                          </div>
                                          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 bg-white border border-slate-500 p-0.2 shrink-0">
                                            <rect x="0" y="0" width="10" height="1.5" fill="#000" />
                                            <rect x="0" y="0" width="1.5" height="10" fill="#000" />
                                            <rect x="2" y="2" width="2" height="2" fill="#000" />
                                            <rect x="6" y="2" width="3" height="1.5" fill="#000" />
                                            <rect x="2" y="6" width="3" height="2" fill="#000" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* ── UNIFIED LOWER CHASSIS BAY: HEADER BRIDGE + SLOTS 34-37 (PSF), TROUGH, & SLOT 39 (MFC) ── */}
                            <div className="relative flex flex-col justify-between mt-0.5 shrink-0 w-full rounded-md overflow-hidden">

                              {/* ── 2B. TOP BUSBAR & MAPPING BRIDGE PLATE ABOVE SLOTS 34-37 (EXACT FOTO ASLI STO GAMBAR 5-7) ── */}
                              <div className="h-[22px] w-full bg-gradient-to-b from-[#E2E8F0] via-[#CBD5E1] to-[#B0BDCC] border border-[#94A3B8] border-b-0 rounded-t-[3px] px-1 flex items-center justify-between relative shrink-0 select-none">
                                {/* Left Dual Chassis Screws */}
                                <div className="flex flex-col justify-between h-[16px] pl-0.5 pr-1 shrink-0">
                                  <div className="w-[4.5px] h-[4.5px] rounded-full bg-gradient-to-br from-white to-slate-400 border border-slate-600 flex items-center justify-center text-[3.5px] font-black text-slate-800 leading-none">+</div>
                                  <div className="w-[4.5px] h-[4.5px] rounded-full bg-gradient-to-br from-white to-slate-400 border border-slate-600 flex items-center justify-center text-[3.5px] font-black text-slate-800 leading-none">+</div>
                                </div>

                                {/* Printed Mapping Brackets (Top: FAN1..3, Bottom: PSF-I..IV & A1/B1 Branches) */}
                                <div className="flex-1 h-full relative">
                                  <svg viewBox="0 0 500 22" className="w-full h-full block" preserveAspectRatio="none">
                                    {/* Top Brackets for FAN 1, FAN 2, FAN 3 */}
                                    <path d="M 10,3 L 10,6 L 118,6 L 118,3" stroke="#1E293B" strokeWidth="0.6" fill="none" />
                                    <text x="64" y="4.8" fontFamily="monospace" fontSize="3.4" fontWeight="800" fill="#0F172A" textAnchor="middle">FAN1 (SLOT 30)</text>

                                    <path d="M 176,3 L 176,6 L 324,6 L 324,3" stroke="#1E293B" strokeWidth="0.6" fill="none" />
                                    <text x="250" y="4.8" fontFamily="monospace" fontSize="3.4" fontWeight="800" fill="#0F172A" textAnchor="middle">FAN2 (SLOT 31)</text>

                                    <path d="M 382,3 L 382,6 L 490,6 L 490,3" stroke="#1E293B" strokeWidth="0.6" fill="none" />
                                    <text x="436" y="4.8" fontFamily="monospace" fontSize="3.4" fontWeight="800" fill="#0F172A" textAnchor="middle">FAN3 (SLOT 32)</text>

                                    {/* Bottom Mapping Brackets for PSF-I..IV */}
                                    {[
                                      { cx: 62, title: "PSF-I (SLOT 34)", b: ["A1", "A5", "A2"] },
                                      { cx: 187, title: "PSF-II (SLOT 35)", b: ["B2", "B5", "B3"] },
                                      { cx: 312, title: "PSF-III (SLOT 36)", b: ["A3", "A6", "A4"] },
                                      { cx: 437, title: "PSF-IV (SLOT 37)", b: ["B1", "B6", "B4"] },
                                    ].map((col, idx) => (
                                      <g key={`hdr-psf-${idx}`}>
                                        <text x={col.cx} y="9.7" fontFamily="monospace" fontSize="3.4" fontWeight="900" fill="#0F172A" textAnchor="middle">{col.title}</text>
                                        <path d={`M ${col.cx - 46},13.5 L ${col.cx - 46},11.2 L ${col.cx + 46},11.2 L ${col.cx + 46},13.5`} stroke="#334155" strokeWidth="0.55" fill="none" />
                                        <text x={col.cx} y="14.2" fontFamily="monospace" fontSize="2.6" fontWeight="800" fill="#334155" textAnchor="middle">FEED</text>
                                        {[
                                          { dx: -34, code: col.b[0], batt: "BATT-I" },
                                          { dx: 0, code: col.b[1], batt: "BATT-II" },
                                          { dx: 34, code: col.b[2], batt: "BATT-III" },
                                        ].map((item, j) => (
                                          <g key={j}>
                                            <text x={col.cx + item.dx} y="17.6" fontFamily="monospace" fontSize="3.0" fontWeight="900" fill="#0F172A" textAnchor="middle">{item.code}</text>
                                            <text x={col.cx + item.dx} y="20.8" fontFamily="monospace" fontSize="2.8" fontWeight="800" fill="#1E293B" textAnchor="middle">{item.batt}</text>
                                          </g>
                                        ))}
                                      </g>
                                    ))}
                                  </svg>
                                </div>

                                {/* Right Dual Chassis Screws */}
                                <div className="flex flex-col justify-between h-[16px] pl-1 pr-0.5 shrink-0">
                                  <div className="w-[4.5px] h-[4.5px] rounded-full bg-gradient-to-br from-white to-slate-400 border border-slate-600 flex items-center justify-center text-[3.5px] font-black text-slate-800 leading-none">+</div>
                                  <div className="w-[4.5px] h-[4.5px] rounded-full bg-gradient-to-br from-white to-slate-400 border border-slate-600 flex items-center justify-center text-[3.5px] font-black text-slate-800 leading-none">+</div>
                                </div>
                              </div>

                              {/* ── 3. 4 PSF MODULES GRID (Slots 34-37 - Exact Hardware STO Photos) ── */}
                              <div className="h-[246px] bg-gradient-to-b from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8] border border-[#94A3B8] p-[1.5px] grid grid-cols-4 gap-[1.5px] relative shrink-0">
                                {[
                                  {
                                    slotNum: 34,
                                    label: "PSF-I (SLOT 34)",
                                    pfName: "PF-A1",
                                    bus: "BUS A",
                                    branches: ["A1 BATT-I", "A5 BATT-II", "A2 BATT-III"],
                                  },
                                  {
                                    slotNum: 35,
                                    label: "PSF-II (SLOT 35)",
                                    pfName: "PF-A2",
                                    bus: "BUS A",
                                    branches: ["B2 BATT-I", "B5 BATT-II", "B3 BATT-III"],
                                  },
                                  {
                                    slotNum: 36,
                                    label: "PSF-III (SLOT 36)",
                                    pfName: "PF-B1",
                                    bus: "BUS B",
                                    branches: ["A3 BATT-I", "A6 BATT-II", "A4 BATT-III"],
                                  },
                                  {
                                    slotNum: 37,
                                    label: "PSF-IV (SLOT 37)",
                                    pfName: "PF-B2",
                                    bus: "BUS B",
                                    branches: ["B1 BATT-I", "B6 BATT-II", "B4 BATT-III"],
                                  },
                                ].map(({ slotNum, label, pfName, bus, branches }, mIdx) => {
                                  const s = getSlot(slotNum);
                                  const sn = s.occupied && s.module?.serial_number ? s.module.serial_number : "-";
                                  const isHighlighted = s.slot_definition_id === highlightedSlotId;
                                  const isSelected = selectedSlotForAction?.slot_definition_id === s.slot_definition_id;
                                  const isAct = isHighlighted || isSelected;

                                  return (
                                    <div
                                      key={`rear-psf-${slotNum}`}
                                      id={`slot-item-${s.slot_definition_id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSlotCardClick(s, true);
                                        showSlotPopup(e, s);
                                      }}
                                      onMouseEnter={(e) => showSlotPopup(e, s)}
                                      onMouseLeave={() => hideSlotPopup(s.slot_definition_id)}
                                      className={`relative rounded-[2px] border transition-all cursor-pointer flex flex-col justify-between bg-gradient-to-b from-[#F8FAFC] via-[#E2E8F0] to-[#CBD5E1] select-none ${
                                        isAct
                                          ? "border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.7)] bg-amber-50/20 z-20"
                                          : "border-[#94A3B8] shadow-[inset_1px_1px_0_rgba(255,255,255,0.9),inset_-1px_-1px_0_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.2)] hover:border-blue-500 hover:shadow-md"
                                      }`}
                                      title={`${label} • Power Filter ${pfName} (${bus}) • Serial: ${s.occupied && s.module ? s.module.serial_number : sn} (Klik untuk inspeksi)`}
                                    >
                                      {/* ZONE 1: Top LED & DataMatrix Plate (Exact Foto Gambar 8) */}
                                      <div className="h-[26px] bg-gradient-to-b from-[#FFFFFF] via-[#F1F5F9] to-[#E2E8F0] border-b border-[#94A3B8] px-1 pt-0.5 pb-[1px] flex flex-col justify-between shrink-0 relative rounded-t-[1px]">
                                        <div className="flex justify-between items-start w-full">
                                          {/* Left Large Thumbscrew + Vertical SN & DataMatrix */}
                                          <div className="flex flex-col items-center gap-[1px]">
                                            <div className="w-[7.5px] h-[7.5px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#FFFFFF_0%,#CBD5E1_45%,#64748B_90%,#334155_100%)] border border-[#475569] shadow-xs flex items-center justify-center">
                                              <span className="font-mono text-[5.5px] font-black text-slate-800 leading-none">+</span>
                                            </div>
                                            <svg viewBox="0 0 8 8" className="w-[5px] h-[5px] bg-white border border-slate-400">
                                              <rect x="1" y="1" width="2" height="2" fill="#1E293B" />
                                              <rect x="4" y="1" width="2" height="1.5" fill="#1E293B" />
                                              <rect x="1" y="4" width="1.5" height="2" fill="#1E293B" />
                                              <rect x="4" y="4" width="2.5" height="2.5" fill="#1E293B" />
                                            </svg>
                                          </div>

                                          {/* Center 4 Glowing LEDs with Vertical Labels Below Each LED */}
                                          <div className="flex items-start gap-[5.5px] pt-[1px]">
                                            {[
                                              { label: "STAT", bg: "radial-gradient(circle, #FFFFFF 0%, #86EFAC 45%, #22C55E 100%)", border: "#16A34A", shadow: "0 0 4px #4ADE80" },
                                              { label: "BATT-I", bg: "radial-gradient(circle, #FFFFFF 0%, #FEF08A 50%, #EAB308 100%)", border: "#CA8A04", shadow: "0 0 3px #FACC15" },
                                              { label: "BATT-II", bg: "radial-gradient(circle, #FFFFFF 0%, #FEF08A 50%, #EAB308 100%)", border: "#CA8A04", shadow: "0 0 3px #FACC15" },
                                              { label: "BATT-III", bg: "radial-gradient(circle, #FFFFFF 0%, #FEF08A 50%, #EAB308 100%)", border: "#CA8A04", shadow: "0 0 3px #FACC15" },
                                            ].map((led, lIdx) => (
                                              <div key={lIdx} className="flex flex-col items-center">
                                                <div
                                                  className="w-[4.8px] h-[4.8px] rounded-full shrink-0"
                                                  style={{ background: led.bg, border: `0.5px solid ${led.border}`, boxShadow: led.shadow }}
                                                />
                                                <span
                                                  className="font-mono text-[2.9px] font-black text-slate-800 leading-none mt-[1.5px] tracking-tighter"
                                                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", height: "12px" }}
                                                >
                                                  {led.label}
                                                </span>
                                              </div>
                                            ))}
                                          </div>

                                          {/* Right Large Thumbscrew + Vertical PN & DataMatrix */}
                                          <div className="flex flex-col items-center gap-[1px]">
                                            <div className="w-[7.5px] h-[7.5px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#FFFFFF_0%,#CBD5E1_45%,#64748B_90%,#334155_100%)] border border-[#475569] shadow-xs flex items-center justify-center">
                                              <span className="font-mono text-[5.5px] font-black text-slate-800 leading-none">+</span>
                                            </div>
                                            <svg viewBox="0 0 8 8" className="w-[5px] h-[5px] bg-white border border-slate-400">
                                              <rect x="1" y="1" width="2.5" height="1.5" fill="#1E293B" />
                                              <rect x="5" y="1" width="2" height="2" fill="#1E293B" />
                                              <rect x="1" y="4" width="2" height="2.5" fill="#1E293B" />
                                              <rect x="4.5" y="4.5" width="2" height="2" fill="#1E293B" />
                                            </svg>
                                          </div>
                                        </div>

                                        {/* Bottom Row of 3 Micro Fastener Screws */}
                                        <div className="flex justify-between items-center px-3">
                                          <div className="w-[3px] h-[3px] rounded-full bg-slate-500 border border-slate-700" />
                                          <div className="w-[3px] h-[3px] rounded-full bg-slate-500 border border-slate-700" />
                                          <div className="w-[3px] h-[3px] rounded-full bg-slate-500 border border-slate-700" />
                                        </div>
                                      </div>

                                      {/* ZONE 2: Orange WARNING / AVERTISSEMENT Card & U-Shaped Bail Handle + Yellow Triangle (Exact Foto Gambar 9) */}
                                      <div className="h-[36px] relative flex justify-center items-center px-1 shrink-0 bg-gradient-to-b from-[#F1F5F9] to-[#E2E8F0]">
                                        <svg viewBox="0 0 125 38" className="w-full h-[36px] pointer-events-none" fill="none">
                                          <defs>
                                            <filter id={`psf-drop-${mIdx}`} x="-20%" y="-20%" width="140%" height="150%">
                                              <feDropShadow dx="1" dy="2" stdDeviation="1.2" floodColor="#0F172A" floodOpacity="0.3" />
                                            </filter>
                                            <linearGradient id={`psf-handle-metal-${mIdx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                              <stop offset="0%" stopColor="#FFFFFF" />
                                              <stop offset="30%" stopColor="#E2E8F0" />
                                              <stop offset="70%" stopColor="#94A3B8" />
                                              <stop offset="100%" stopColor="#475569" />
                                            </linearGradient>
                                          </defs>

                                          {/* Far Left Vertical DataMatrix & Micro Text */}
                                          <rect x="4" y="6" width="3.5" height="3.5" fill="#1E293B" />
                                          <line x1="5" y1="12" x2="5" y2="24" stroke="#475569" strokeWidth="1" strokeDasharray="1.5 1" />

                                          {/* Orange Warning / Avertissement Placard */}
                                          <rect x="22" y="2" width="58" height="25" rx="1" fill="#EA580C" stroke="#9A3412" strokeWidth="0.7" />
                                          <text x="51" y="6.8" fontFamily="sans-serif" fontSize="3.4" fontWeight="900" fill="#1E293B" textAnchor="middle">WARNING</text>
                                          <text x="51" y="10.4" fontFamily="sans-serif" fontSize="3.2" fontWeight="900" fill="#1E293B" textAnchor="middle">AVERTISSEMENT</text>
                                          <rect x="23" y="11.6" width="56" height="14.5" rx="0.4" fill="#FFFFFF" />
                                          <text x="51" y="15.0" fontFamily="monospace" fontSize="2.1" fontWeight="800" fill="#0F172A" textAnchor="middle">TO AVOID INJURY THIS HANDLE IS NOT</text>
                                          <text x="51" y="18.0" fontFamily="monospace" fontSize="2.1" fontWeight="800" fill="#0F172A" textAnchor="middle">TO BE USED FOR LIFTING SHELF ASSEMBLY</text>
                                          <text x="51" y="21.0" fontFamily="monospace" fontSize="2.0" fontWeight="700" fill="#334155" textAnchor="middle">POUR EVITER LES BLESSURES CETTE POIGNEE</text>
                                          <text x="51" y="24.0" fontFamily="monospace" fontSize="2.0" fontWeight="700" fill="#334155" textAnchor="middle">N'EST PAS FAITE POUR LEVER L'ENSEMBLE</text>

                                          {/* Cast Drop Shadow under Bail Handle */}
                                          <path d="M 18,6 L 18,24 Q 18,30 24,30 L 78,30 Q 84,30 84,24 L 84,6" stroke="#000000" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.25" filter={`url(#psf-drop-${mIdx})`} />

                                          {/* Left & Right Circular Pivot Washers */}
                                          <circle cx="18" cy="6" r="4.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.7" />
                                          <circle cx="84" cy="6" r="4.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.7" />

                                          {/* U-Shaped Tubular Metal Bail Handle */}
                                          <path d="M 18,6 L 18,24 Q 18,30 24,30 L 78,30 Q 84,30 84,24 L 84,6" stroke="#64748B" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                                          <path d="M 18,6 L 18,24 Q 18,30 24,30 L 78,30 Q 84,30 84,24 L 84,6" stroke={`url(#psf-handle-metal-${mIdx})`} strokeWidth="1.8" strokeLinecap="round" fill="none" />
                                          <path d="M 18,6 L 18,23.5 Q 18,29 24,29 L 78,29 Q 84,29 84,23.5 L 84,6" stroke="#FFFFFF" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.9" />

                                          {/* Right Yellow ESD Caution Triangle */}
                                          <polygon points="107,10 116,25 98,25" fill="#FACC15" stroke="#000000" strokeWidth="1.0" strokeLinejoin="round" />
                                          <path d="M 107,14.5 L 107,19.5" stroke="#000000" strokeWidth="1.3" strokeLinecap="round" />
                                          <circle cx="107" cy="22.3" r="0.8" fill="#000000" />
                                        </svg>
                                      </div>

                                      {/* ZONE 3: 3 Circuit Breakers with Seamless Gunmetal Inverted-T Foot & Knurled Thumbscrews (Exact Foto Referensi 2) */}
                                      <div className="flex flex-col shrink-0 border-t border-b border-[#94A3B8]">
                                        {/* Upper 3 Breakers (h-[88px]) */}
                                        <div className="h-[88px] bg-gradient-to-b from-[#E2E8F0] via-[#CBD5E1] to-[#B0BDCC] px-[2.5px] py-[2px]">
                                          <div className="grid grid-cols-3 gap-[2.5px] h-full">
                                            {[0, 1, 2].map((bIdx) => (
                                              <div
                                                key={bIdx}
                                                className="relative h-full w-full flex flex-col items-center justify-between bg-gradient-to-b from-[#F8FAFC] via-[#E2E8F0] to-[#CBD5E1] rounded-[1px] overflow-hidden"
                                              >
                                                {/* Vertical Slide-In Guide Grooves (Left & Right Rails) */}
                                                <div
                                                  className="absolute left-[2px] top-[12px] bottom-[15px] w-[1.5px] bg-gradient-to-r from-[#475569] to-[#94A3B8] opacity-80 rounded-full pointer-events-none"
                                                />
                                                <div
                                                  className="absolute right-[2px] top-[12px] bottom-[15px] w-[1.5px] bg-gradient-to-l from-[#475569] to-[#94A3B8] opacity-80 rounded-full pointer-events-none"
                                                />

                                                {/* 1. Top Area: Large Silver Washer Bolt + Small Recessed Dark Screw */}
                                                <div className="flex flex-col items-center pt-[2.5px] gap-[2.5px] shrink-0 z-10">
                                                  <div className="w-[7px] h-[7px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#FFFFFF_0%,#CBD5E1_55%,#64748B_100%)] border border-[#64748B] shadow-[0_0.5px_1px_rgba(0,0,0,0.3)] flex items-center justify-center">
                                                    <div className="w-[2.5px] h-[2.5px] rounded-full bg-[#64748B]/70" />
                                                  </div>
                                                  <div className="w-[3.2px] h-[3.2px] rounded-full bg-gradient-to-br from-[#334155] to-[#0F172A] border border-[#64748B]/60 shadow-inner" />
                                                </div>

                                                {/* 2. Middle Area: Wide Dark Charcoal Switch Housing & Chunky 3D Toggle */}
                                                <div className="w-[24px] h-[30px] bg-gradient-to-b from-[#2A2F36] via-[#1C2026] to-[#121519] border border-[#475569] rounded-[1px] shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.9)] flex items-center justify-center relative shrink-0 z-10">
                                                  {/* Subtle Divider Line & Micro ON/OFF Indicator */}
                                                  <div className="absolute inset-y-1 left-1/2 -translate-x-1/2 w-[0.5px] bg-slate-600/35" />
                                                  {/* Chunky 3D Breaker Toggle Lever */}
                                                  <div className="w-[7px] h-[13px] bg-gradient-to-b from-[#1E242B] via-[#090B0E] to-[#020305] border border-[#475569]/80 rounded-[1px] shadow-[0_2px_3px_rgba(0,0,0,0.85)] flex items-center justify-center relative">
                                                    <div className="w-[5px] h-[2px] bg-gradient-to-r from-[#94A3B8] via-[#F8FAFC] to-[#94A3B8] rounded-[0.4px]" />
                                                  </div>
                                                </div>

                                                {/* 3. Lower Area: Seamless Brushed Gunmetal Inverted-T Plate + Large Knurled Thumbscrew */}
                                                <div className="w-full flex flex-col items-center shrink-0 z-10">
                                                  {/* Narrower Upper Stem between the two vertical guide rails */}
                                                  <div className="w-[24px] h-[16px] bg-gradient-to-b from-[#8A95A5] via-[#6D7888] to-[#5B6574] border-x border-t border-[#475569] flex items-center justify-center relative shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                                                    <div className="w-[3.5px] h-[2px] rounded-full bg-[#334155]/80 border-b border-white/30" />
                                                  </div>
                                                  {/* Full-Width Bottom T-Foot with Large Raised 3D Knurled Silver Thumbscrew */}
                                                  <div className="w-full h-[16px] bg-gradient-to-b from-[#5B6574] via-[#4B5563] to-[#3B4451] border-x border-b border-[#334155] rounded-b-[1px] flex items-center justify-center relative shadow-[inset_0_-1px_2px_rgba(0,0,0,0.35)]">
                                                    <div
                                                      className="w-[10.5px] h-[10.5px] rounded-full bg-[radial-gradient(circle_at_35%_32%,#FFFFFF_0%,#E2E8F0_35%,#94A3B8_70%,#475569_100%)] border border-[#334155] flex items-center justify-center"
                                                      style={{ boxShadow: "0 1.5px 2.5px rgba(0,0,0,0.55), inset 0 0.5px 0.5px rgba(255,255,255,0.9)" }}
                                                    >
                                                      <div className="w-[6px] h-[6px] rounded-full bg-[radial-gradient(circle_at_40%_40%,#F8FAFC_0%,#94A3B8_80%,#475569_100%)] border border-[#64748B]/70 flex items-center justify-center">
                                                        <span className="font-mono text-[4.5px] font-black text-[#334155] leading-none">+</span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Lower Brushed Silver-Gray Plate with Dual Vertical Test Sockets on Right (h-[32px] - Exact Gambar 10) */}
                                        <div className="h-[32px] bg-gradient-to-b from-[#F1F5F9] via-[#E2E8F0] to-[#CBD5E1] border-t border-[#94A3B8] px-1.5 flex justify-between items-center relative">
                                          <span className="font-mono text-[5.5px] font-black text-slate-700/80 tracking-wider">
                                            {pfName}
                                          </span>
                                          {/* Vertical Pill Bezel with 2 Recessed Metallic Sockets on Right */}
                                          <div className="w-[13px] h-[24px] bg-gradient-to-b from-[#94A3B8] to-[#64748B] border border-[#475569] rounded-[6.5px] shadow-inner flex flex-col justify-around items-center py-[1.5px]">
                                            <div className="w-[8px] h-[8px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#FFFFFF_0%,#CBD5E1_50%,#334155_100%)] border border-slate-800 flex items-center justify-center">
                                              <div className="w-[2.5px] h-[2.5px] rounded-full bg-[#0F172A]" />
                                            </div>
                                            <div className="w-[8px] h-[8px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#FFFFFF_0%,#CBD5E1_50%,#334155_100%)] border border-slate-800 flex items-center justify-center">
                                              <div className="w-[2.5px] h-[2.5px] rounded-full bg-[#0F172A]" />
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* ZONE 4: Black Terminal Recess + White Rating & BATT Plate + Rounded Lower Tongue Flap (Exact Foto Gambar 11) */}
                                      <div className="flex-1 bg-gradient-to-b from-[#CBD5E1] to-[#94A3B8] flex flex-col justify-between px-1 pt-[3px] pb-0 min-h-0 relative">
                                        {/* Black Horizontal Terminal Recess Window with 2 Square Retainers & 4 Contact Pins */}
                                        <div className="h-[14px] bg-[#05080F] border border-[#334155] rounded-[2px] relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.95)] flex flex-col justify-between px-2 py-[1.5px] shrink-0">
                                          {/* Top 2 Square Metallic Retainer Clips */}
                                          <div className="flex justify-around items-start">
                                            <div className="w-[6px] h-[5px] bg-gradient-to-b from-white via-slate-300 to-slate-500 border border-slate-600 rounded-[0.5px]" />
                                            <div className="w-[6px] h-[5px] bg-gradient-to-b from-white via-slate-300 to-slate-500 border border-slate-600 rounded-[0.5px]" />
                                          </div>
                                          {/* 4 Terminal Pin Dots */}
                                          <div className="flex justify-between items-center px-1">
                                            <div className="w-[2px] h-[2px] rounded-full bg-slate-300" />
                                            <div className="w-[2px] h-[2px] rounded-full bg-slate-300" />
                                            <div className="w-[2px] h-[2px] rounded-full bg-slate-300" />
                                            <div className="w-[2px] h-[2px] rounded-full bg-slate-300" />
                                          </div>
                                        </div>

                                        {/* White Specification Sticker Plate with 2 Screws & BATT-I / BATT-II / BATT-III */}
                                        <div className="bg-white border border-slate-400 rounded-[1.5px] px-1 py-[1.5px] flex flex-col justify-between flex-1 my-[2px] shadow-2xs">
                                          <div className="font-sans text-[2.9px] leading-[3.5px] text-slate-800 font-semibold">
                                            <div>Input Rated: Three (3) Lines -48V 50/70A max each line</div>
                                            <div>Or Capacitive Feeders</div>
                                            <div>Input Rated: Three (3) Lines -48V/-60V 50/70A max each line</div>
                                            <div>To Be Powered Only By SELV From a -48V Source or TNV-2 -60V</div>
                                          </div>
                                          {/* 2 Tiny Screws Above BATT Row */}
                                          <div className="flex justify-around items-center px-4">
                                            <div className="w-[3px] h-[3px] rounded-full bg-slate-400 border border-slate-600" />
                                            <div className="w-[3px] h-[3px] rounded-full bg-slate-400 border border-slate-600" />
                                          </div>
                                          {/* Bottom Row: BATT - I, BATT - II, BATT - III */}
                                          <div className="flex justify-between items-center px-1 font-mono text-[4.0px] font-black text-slate-900 leading-none">
                                            <span>BATT - I</span>
                                            <span>BATT - II</span>
                                            <span>BATT - III</span>
                                          </div>
                                        </div>

                                        {/* Protruding Central Rounded Tongue Flap at Bottom Edge */}
                                        <div className="w-full flex justify-center h-[4px] relative">
                                          <div className="w-[46%] h-[8px] bg-gradient-to-b from-[#CBD5E1] to-[#94A3B8] border-x border-b border-[#64748B] rounded-b-[5px] shadow-sm absolute top-0 z-10" />
                                        </div>
                                      </div>

                                      {/* ── ACTIVE SELECTION FRAME OVERLAY: PERFECTLY ENCOMPASSES 100% OF THE PHYSICAL SLOT (ZONE 1 TO ZONE 4) ── */}
                                      {isAct && (
                                        <div className="absolute inset-0 pointer-events-none rounded-[2px] border-2 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.9),inset_0_0_8px_rgba(245,158,11,0.25)] z-35" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* ── 4. HORIZONTAL CABLE TROUGH GUTTER (Exact Gambar 2 Full) ── */}
                              <div className="h-[16px] w-full bg-[#0B0F19] border-t border-b border-[#334155] flex items-center justify-between pl-[78px] pr-2 text-[4px] font-mono font-bold text-slate-400 select-none shrink-0 shadow-inner relative z-10">
                                <div className="flex items-center gap-1 z-10">
                                  <span className="text-[#38BDF8]">&bull;</span>
                                  <span>-48V/-60V DC POWER &bull; SLOT 34...37 PS-A/B &bull; DC DISTR LOOM ASSEMBLY</span>
                                </div>
                                <div className="flex items-center gap-1 font-mono text-[3.8px] text-slate-500 z-10">
                                  <span>USE SLOTS - ROUTE TO LEFT TRAY</span>
                                  <span className="text-slate-400">&bull;</span>
                                </div>
                              </div>

                              {/* ── 5. MFC UTILITY TRAY (Slot 39 - Exact Gambar 2 Full Resolution HD & 3D) ── */}
                              {(() => {
                                const s39 = getSlot(39);
                                const isHighlighted = s39.slot_definition_id === highlightedSlotId;
                                const isSelected = selectedSlotForAction?.slot_definition_id === s39.slot_definition_id;
                                const isAct = isHighlighted || isSelected;

                                return (
                                  <div
                                    id={`slot-item-${s39.slot_definition_id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSlotCardClick(s39, true);
                                      showSlotPopup(e, s39);
                                    }}
                                    onMouseEnter={(e) => showSlotPopup(e, s39)}
                                    onMouseLeave={() => hideSlotPopup(s39.slot_definition_id)}
                                    className={`h-[102px] w-full shrink-0 rounded-none p-[2px] flex relative transition-all cursor-pointer border select-none ${
                                      isAct
                                        ? "border-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.7)] bg-amber-50/10 z-20"
                                        : "border border-[#64748B] hover:border-blue-500 shadow-sm"
                                    }`}
                                    title={`Slot 39: MFC (Multifunction Controller) & TPSC24X (Top Power Shelf Controller) • Part: ${s39.occupied && s39.module?.unit_part_number ? s39.module.unit_part_number : "-"} • Serial: ${s39.occupied && s39.module ? s39.module.serial_number : "-"} (Klik untuk inspeksi)`}
                                  >
                                    {/* Main Body Row: Left Runway + Right Cassette Tray */}
                                    <div className="flex flex-1 gap-[3px] h-full relative min-h-0 w-full">
                                      
                                      {/* ── LEFT RUNWAY (Grounding & Vertical Cable Bundle - Exact Gambar 2) ── */}
                                      <div className="w-[105px] h-full bg-gradient-to-b from-[#334155] via-[#1E293B] to-[#0F172A] border-l border-b border-[#475569] rounded-bl-md relative shrink-0 shadow-inner">
                                        
                                        {/* ── AUTHENTIC PORTRAIT ATTENTION PLACARD (EXACT GAMBAR 3 HARDWARE ASLI STO - BEHIND CABLES) ── */}
                                        <div className="absolute left-[8px] top-[6px] w-[38px] h-[52px] bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] border border-white/95 rounded-[1.5px] shadow-[0_1.5px_4px_rgba(0,0,0,0.5),0_0_0_0.8px_rgba(255,255,255,0.9)] overflow-hidden z-[2] select-none pointer-events-none flex flex-col justify-between">
                                          {/* 1. Top Yellow Header Banner: CAUTION with Black Hazard Triangle (Exact Gambar 3) */}
                                          <div className="bg-[#FACC15] border-b border-[#CA8A04] px-[2.5px] py-[1.4px] flex items-center justify-center gap-[2px] shadow-xs shrink-0">
                                            <svg viewBox="0 0 20 18" className="w-[4.5px] h-[4px] shrink-0" fill="none">
                                              <polygon points="10,1.5 19,16.5 1,16.5" fill="#000" />
                                              <polygon points="10,4.2 16.8,15.2 3.2,15.2" fill="#FACC15" />
                                              <path d="M 10,7.2 L 10,11" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
                                              <circle cx="10" cy="13.4" r="0.9" fill="#000" />
                                            </svg>
                                            <span className="font-mono text-[3.4px] font-black text-black tracking-tight leading-none">
                                              CAUTION
                                            </span>
                                          </div>

                                          {/* 2. Upper Micro-Text Warning Notice */}
                                          <div className="px-[2.5px] py-[1px] font-mono text-[2.0px] leading-tight flex-1 flex flex-col justify-center">
                                            <div className="font-black text-[#991B1B] tracking-tight truncate">
                                              HIGH CURRENT LOOM
                                            </div>
                                            <div className="text-slate-800 tracking-tighter truncate font-semibold">
                                              Avant intervention couper
                                            </div>
                                            <div className="text-slate-600 tracking-tighter truncate font-medium">
                                              Disconnect power supply
                                            </div>
                                          </div>

                                          {/* 3. Center Horizontal Warning Band: 48V/60V DC with Black Hazard Triangle (Exact Gambar 3) */}
                                          <div className="mx-[1px] py-[1.2px] px-[2px] bg-[#FACC15] border-y border-[#CA8A04] flex items-center justify-center gap-[2px] shrink-0">
                                            <svg viewBox="0 0 20 18" className="w-[5px] h-[4.5px] shrink-0" fill="none">
                                              <polygon points="10,1.5 19,16.5 1,16.5" fill="#000" />
                                              <polygon points="10,4.2 16.8,15.2 3.2,15.2" fill="#FACC15" />
                                              <path d="M 10,7.2 L 10,11" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
                                              <circle cx="10" cy="13.4" r="0.9" fill="#000" />
                                            </svg>
                                            <div className="font-mono text-[2.2px] font-black text-black tracking-tighter leading-none">
                                              48V/60V DC
                                            </div>
                                          </div>

                                          {/* 4. Lower Micro-Text Notice & Grounding Compliance */}
                                          <div className="px-[2.5px] py-[1px] font-mono text-[1.9px] leading-tight flex-1 flex flex-col justify-center">
                                            <div className="text-slate-800 tracking-tighter font-bold truncate">
                                              EQUIPMENT GROUNDING
                                            </div>
                                            <div className="text-slate-600 tracking-tighter font-medium truncate">
                                              Mise à la terre requise
                                            </div>
                                            <div className="text-slate-500 tracking-tighter truncate">
                                              BEFORE ENERGIZING
                                            </div>
                                          </div>

                                          {/* 5. Bottom Brand & Certification Strip */}
                                          <div className="px-[2.5px] pb-[1.5px] border-t border-slate-300 flex justify-between items-center text-[1.7px] text-slate-700 font-bold shrink-0">
                                            <span>NOKIA 1830 PSS</span>
                                            <span className="text-slate-900 font-black">CE</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* ── RIGHT MFC CASSETTE (Slot 39 Panel - Exact Gambar 2 Clean Silver/White Satin Aluminum) ── */}
                                      <div
                                        className="flex-1 h-full rounded-[3px] relative flex flex-col justify-between p-[2px] min-w-0 overflow-hidden"
                                        style={{
                                          background: "linear-gradient(to bottom, #FFFFFF 0%, #F8FAFC 35%, #F1F5F9 70%, #E2E8F0 100%)",
                                          border: "1px solid #CBD5E1",
                                          boxShadow: "inset 0 1px 0 rgba(255,255,255,1), 0 1px 3px rgba(0,0,0,0.1)",
                                        }}
                                      >
                                        {/* Top Guide Lip with Oblong Slots & Corner Fastening Screw (Only on Right Cassette) */}
                                        <div className="h-[7.5px] w-full flex items-center justify-between px-1.5 shrink-0 mb-[1px] bg-gradient-to-b from-[#CBD5E1] to-[#94A3B8] border-b border-[#CBD5E1] rounded-t-[2px]">
                                          <div className="flex items-center gap-[9px] pl-[8px]">
                                            {[...Array(5)].map((_, i) => (
                                              <div key={i} className="w-[18px] h-[3px] rounded-[1.5px] bg-[#090D16] border border-[#334155] shadow-inner" />
                                            ))}
                                          </div>
                                          <div className="flex items-center gap-[4px] pr-[2px]">
                                            <div className="w-[6.5px] h-[6.5px] rounded-full bg-gradient-to-br from-white via-[#CBD5E1] to-[#64748B] border border-[#334155] flex items-center justify-center font-mono text-[5px] font-black text-[#1E293B] shadow-xs">
                                              +
                                            </div>
                                          </div>
                                        </div>

                                        {/* Top Bar: MFC Title, Oblong Chassis Slots, & CLEI Badge */}
                                        <div className="h-[13.5px] bg-[#070B13] border border-[#334155] rounded-[2px] flex items-center justify-between px-[6px] mx-[2px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)] z-10 shrink-0">
                                          <div className="flex items-center gap-[5px]">
                                            <div
                                              className="w-[7.5px] h-[7.5px] rounded-full"
                                              style={{
                                                background: "radial-gradient(circle, #FFFFFF 0%, #39FF14 45%, #00DD44 100%)",
                                                border: "1px solid #00FF66",
                                                boxShadow: "0 0 5px #00FF66, 0 0 10px #39FF14, 0 0 16px rgba(57,255,20,0.6)",
                                              }}
                                            />
                                            <span className="font-mono text-[6.8px] font-black text-white tracking-[0.4px]">
                                              MFC / TPSC24X (SLOT 39) &bull; 3HE08225AA
                                            </span>
                                          </div>

                                          {/* Chassis Ventilation Slots in Center (Exact 4 oblong slots) */}
                                          <div className="flex gap-[6px]">
                                            <div className="w-[15px] h-[3.2px] rounded-[1.5px] bg-[#02050A] border border-[#1E293B] shadow-inner" />
                                            <div className="w-[15px] h-[3.2px] rounded-[1.5px] bg-[#02050A] border border-[#1E293B] shadow-inner" />
                                            <div className="w-[15px] h-[3.2px] rounded-[1.5px] bg-[#02050A] border border-[#1E293B] shadow-inner" />
                                            <div className="w-[15px] h-[3.2px] rounded-[1.5px] bg-[#02050A] border border-[#1E293B] shadow-inner" />
                                          </div>

                                          {/* CLEI Badge & Corner Fastening Screw */}
                                          <div className="flex items-center gap-[5px]">
                                            <div className="h-[8.5px] flex items-center border border-[#0284C7]/60 bg-[#06101E] px-[4px] rounded-[1px] whitespace-nowrap shrink-0 leading-none shadow-xs">
                                              <span className="font-mono text-[6px] font-black text-[#38BDF8] tracking-tight">
                                                CLEI: IPUCAM0RAA &bull; BITS SYNC
                                              </span>
                                            </div>
                                            <div className="w-[6px] h-[6px] rounded-full bg-gradient-to-br from-white via-[#CBD5E1] to-[#64748B] border border-[#334155] flex items-center justify-center font-mono text-[4.5px] font-black text-[#0F172A] shadow-xs">
                                              +
                                            </div>
                                          </div>
                                        </div>

                                        {/* Mid Cassette Body: Ejector Latches, Center Sensor, Breakers, Lightpipe */}
                                        <div className="flex-1 relative min-h-0">
                                          
                                          {/* Left Ejector Latch Lever & Thumbscrew */}
                                          <div className="absolute left-[6px] top-[4px] flex flex-col justify-around items-center h-[58px] z-20">
                                            <div className="w-[6px] h-[36px] rounded-[1.5px] bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#020617] border border-[#475569] flex items-center justify-center shadow-[1px_2px_3px_rgba(0,0,0,0.4)]">
                                              <div className="w-[2px] h-[26px] bg-gradient-to-b from-[#FFFFFF] via-[#CBD5E1] to-[#64748B] rounded-[0.5px] shadow-2xs" />
                                            </div>
                                            <div className="w-[7.5px] h-[7.5px] rounded-full bg-gradient-to-br from-white via-[#CBD5E1] to-[#64748B] border border-[#334155] flex items-center justify-center font-mono text-[5px] font-black text-[#0F172A] shadow-[0_1.5px_2px_rgba(0,0,0,0.3)]">
                                              +
                                            </div>
                                          </div>

                                          {/* 3 Chassis Rivet Dots on Lower Left */}
                                          <div className="absolute left-[45px] bottom-[10px] flex gap-[6px] z-10">
                                            <div className="w-[3.5px] h-[3.5px] rounded-full bg-gradient-to-br from-white via-[#CBD5E1] to-[#64748B] border border-[#475569] shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
                                            <div className="w-[3.5px] h-[3.5px] rounded-full bg-gradient-to-br from-white via-[#CBD5E1] to-[#64748B] border border-[#475569] shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
                                            <div className="w-[3.5px] h-[3.5px] rounded-full bg-gradient-to-br from-white via-[#CBD5E1] to-[#64748B] border border-[#475569] shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
                                          </div>

                                          {/* Center Vertical SENSOR IN Port (HD Shielded Industrial Connector - Exact Gambar 5) */}
                                          <div className="absolute left-[96px] top-[2px] flex flex-col items-center z-20">
                                            <span className="font-mono text-[4.5px] font-black text-slate-700 tracking-wider mb-[1px]">
                                              SENSOR IN
                                            </span>
                                            {/* Shielded Receptacle Housing with Mounting Screws & Metal Cage */}
                                            <div className="w-[20px] h-[34px] bg-gradient-to-b from-[#F1F5F9] via-[#E2E8F0] to-[#CBD5E1] border border-[#64748B] rounded-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,1)] flex flex-col items-center justify-between p-[1.5px]">
                                              {/* Top Phillips Mounting Screw */}
                                              <div className="w-[4.5px] h-[4.5px] rounded-full bg-gradient-to-br from-white via-slate-200 to-slate-400 border border-slate-600 flex items-center justify-center font-mono text-[3.8px] font-black text-slate-800 shadow-2xs">
                                                +
                                              </div>

                                              {/* Shielded RJ45 Plug firmly seated inside metal receptacle */}
                                              <div className="w-[15px] h-[20px] bg-gradient-to-b from-[#090D16] to-[#020617] border border-[#334155] rounded-[1px] p-[1px] flex flex-col items-center justify-between shadow-inner relative">
                                                {/* Die-cast metallic shielded plug body */}
                                                <div className="w-[13px] h-[13px] bg-gradient-to-b from-[#FFFFFF] via-[#E2E8F0] to-[#94A3B8] border border-[#475569] rounded-[1px] shadow-sm relative flex flex-col items-center justify-between overflow-hidden">
                                                  <div className="absolute inset-x-0 top-0 h-[2px] bg-white opacity-90" />
                                                  <div className="w-[4px] h-[8px] bg-gradient-to-b from-slate-200/90 to-slate-400/80 border border-slate-600 rounded-[0.5px] mt-[1px] shadow-xs" />
                                                  <div className="w-full flex justify-between px-[1px] pb-[1px]">
                                                    <div className="w-[1.5px] h-[3px] bg-slate-500 rounded-[0.2px]" />
                                                    <div className="w-[1.5px] h-[3px] bg-slate-500 rounded-[0.2px]" />
                                                  </div>
                                                </div>
                                                {/* Molded Strain Relief Boot (Dark Platinum Grey Rubber) */}
                                                <div className="w-[9px] h-[5px] bg-gradient-to-b from-[#475569] via-[#334155] to-[#1E293B] border border-[#0F172A] rounded-b-[1px] shadow-xs" />
                                              </div>

                                              {/* Bottom Phillips Mounting Screw */}
                                              <div className="w-[4.5px] h-[4.5px] rounded-full bg-gradient-to-br from-white via-slate-200 to-slate-400 border border-slate-600 flex items-center justify-center font-mono text-[3.8px] font-black text-slate-800 shadow-2xs">
                                                +
                                              </div>
                                            </div>
                                          </div>

                                          {/* RESET Button beside vertical sensor (Micro-tactile switch with collar) */}
                                          <div className="absolute left-[122px] top-[18px] flex items-center gap-[3px] z-10">
                                            <div className="w-[6px] h-[6px] rounded-full bg-gradient-to-br from-white via-slate-200 to-slate-400 border border-slate-500 shadow-xs flex items-center justify-center">
                                              <div className="w-[2.2px] h-[2.2px] rounded-full bg-[#0F172A]" />
                                            </div>
                                            <span className="font-mono text-[3.8px] font-black text-[#64748B]">RESET</span>
                                          </div>

                                          {/* 3D Realistic Jumper Cable SVG: Sweeps gracefully from SENSOR IN to SENSOR OUT */}
                                          <svg viewBox="0 0 412 65" className="absolute inset-0 w-full h-full pointer-events-none z-15" fill="none">
                                            <defs>
                                              <filter id="jumper-cable-shadow" x="-20%" y="-20%" width="140%" height="150%">
                                                <feDropShadow dx="1.5" dy="2.5" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.4" />
                                              </filter>
                                              <linearGradient id="jumper-cable-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#CBD5E1" />
                                                <stop offset="35%" stopColor="#F8FAFC" />
                                                <stop offset="70%" stopColor="#94A3B8" />
                                                <stop offset="100%" stopColor="#475569" />
                                              </linearGradient>
                                            </defs>

                                            {/* Cast shadow under flexible cable */}
                                            <path d="M 106,36 C 106,62 118,64 144,50" stroke="#000000" strokeWidth="4.6" strokeLinecap="round" opacity="0.35" filter="url(#jumper-cable-shadow)" />
                                            {/* Outer dark casing */}
                                            <path d="M 106,36 C 106,62 118,64 144,50" stroke="#334155" strokeWidth="3.6" strokeLinecap="round" />
                                            {/* Cylindrical metallic/rubber sleeve */}
                                            <path d="M 106,36 C 106,62 118,64 144,50" stroke="url(#jumper-cable-grad)" strokeWidth="2.4" strokeLinecap="round" />
                                            {/* Specular highlight */}
                                            <path d="M 106,36 C 106,62 118,64 144,50" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.9" />
                                          </svg>

                                          {/* SENSOR OUT / BITS REF Connector (HD Industrial Metallic Bracket & Port - Exact Gambar 5) */}
                                          <div className="absolute left-[134px] top-[44px] flex items-center gap-[4px] z-20">
                                            <div className="flex items-center bg-gradient-to-b from-[#F1F5F9] via-[#E2E8F0] to-[#CBD5E1] border border-[#64748B] rounded-[1.5px] px-[3px] py-[1.5px] shadow-[0_1.5px_3px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,1)] gap-[2px]">
                                              {/* Metal Bracket Screws */}
                                              <div className="w-[4px] h-[4px] rounded-full bg-gradient-to-br from-white to-slate-400 border border-slate-600 flex items-center justify-center font-mono text-[3px] font-black text-slate-800">
                                                +
                                              </div>
                                              {/* Metallic Shielded Connector Shell with Molded Boot */}
                                              <div className="flex items-center">
                                                <div className="w-[10px] h-[9px] bg-gradient-to-r from-[#CBD5E1] via-[#FFFFFF] to-[#94A3B8] border border-[#475569] rounded-l-[1px] shadow-xs flex items-center justify-center">
                                                  <div className="w-[3px] h-[5px] bg-[#334155] rounded-[0.5px]" />
                                                </div>
                                                <div className="w-[9px] h-[8px] bg-gradient-to-r from-[#475569] to-[#1E293B] border border-[#0F172A] rounded-r-[1px] shadow-xs" />
                                              </div>
                                              <div className="w-[4px] h-[4px] rounded-full bg-gradient-to-br from-white to-slate-400 border border-slate-600 flex items-center justify-center font-mono text-[3px] font-black text-slate-800">
                                                +
                                              </div>
                                            </div>
                                            <span className="font-mono text-[4px] font-bold text-slate-700 tracking-tight">
                                              SENSOR OUT / BITS REF
                                            </span>
                                          </div>
                                          {/* Port Console (BITS1, BITS2, LAN, CLK, STAT ON - Exact Gambar 5 & Gambar 2) */}
                                          <div className="absolute left-[242px] top-[6px] bg-gradient-to-b from-[#060A12] via-[#0B101D] to-[#0F172A] border-2 border-[#1E293B] rounded-[3px] p-[2px_5px] shadow-[inset_0_2px_5px_rgba(0,0,0,0.85),0_1.5px_3px_rgba(0,0,0,0.3)] flex items-center gap-[4px] z-20">
                                            {/* Port 1: BITS1 (Unpopulated Open RJ45 Receptacle - Exact Gambar 2) */}
                                            <div className="flex flex-col items-center gap-[1px]">
                                              <div className="w-[14px] h-[24px] bg-gradient-to-b from-[#0F172A] to-[#020617] border border-[#334155] rounded-[1.5px] shadow-inner flex flex-col items-center justify-between p-[1px] relative">
                                                <div className="w-full flex justify-between px-[1px]">
                                                  <div className="w-[2px] h-[2px] rounded-full bg-slate-700" />
                                                  <div className="w-[2px] h-[2px] rounded-full bg-slate-700" />
                                                </div>
                                                {/* Deep RJ45 Socket Receptacle Opening */}
                                                <div className="w-[11px] h-[16px] bg-[#050811] border border-black rounded-[1px] shadow-inner flex flex-col justify-between items-center p-[0.5px]">
                                                  <div className="w-full flex gap-[0.5px] justify-center pt-[1px]">
                                                    {[...Array(6)].map((_, i) => (
                                                      <div key={i} className="w-[0.8px] h-[3px] bg-[#EAB308] opacity-60" />
                                                    ))}
                                                  </div>
                                                  <div className="w-[5px] h-[3.5px] bg-[#0B0F19] border border-[#1E293B] rounded-[0.5px]" />
                                                </div>
                                              </div>
                                              <span className="font-mono text-[3.6px] font-black text-[#94A3B8]">BITS1</span>
                                            </div>

                                            {/* Port 2: BITS2 (Unpopulated Open RJ45 Receptacle) */}
                                            <div className="flex flex-col items-center gap-[1px]">
                                              <div className="w-[14px] h-[24px] bg-gradient-to-b from-[#0F172A] to-[#020617] border border-[#334155] rounded-[1.5px] shadow-inner flex flex-col items-center justify-between p-[1px] relative">
                                                <div className="w-full flex justify-between px-[1px]">
                                                  <div className="w-[2px] h-[2px] rounded-full bg-slate-700" />
                                                  <div className="w-[2px] h-[2px] rounded-full bg-slate-700" />
                                                </div>
                                                <div className="w-[11px] h-[16px] bg-[#050811] border border-black rounded-[1px] shadow-inner flex flex-col justify-between items-center p-[0.5px]">
                                                  <div className="w-full flex gap-[0.5px] justify-center pt-[1px]">
                                                    {[...Array(6)].map((_, i) => (
                                                      <div key={i} className="w-[0.8px] h-[3px] bg-[#EAB308] opacity-75" />
                                                    ))}
                                                  </div>
                                                  <div className="w-[5px] h-[3.5px] bg-[#0B0F19] border border-[#1E293B] rounded-[0.5px]" />
                                                </div>
                                              </div>
                                              <span className="font-mono text-[3.6px] font-black text-[#64748B]">BITS2</span>
                                            </div>

                                            {/* Port 3: LAN (Active 1G Ethernet Link - Socket Cavity - Exact Gambar 2) */}
                                            <div className="flex flex-col items-center gap-[1px]">
                                              <div className="w-[14px] h-[24px] bg-gradient-to-b from-[#0F172A] to-[#020617] border border-[#334155] rounded-[1.5px] shadow-inner flex flex-col items-center justify-between p-[1px] relative">
                                                <div className="w-full flex justify-between px-[1px]">
                                                  <div className="w-[2px] h-[2px] rounded-full bg-[#00E5FF] shadow-[0_0_4px_#00E5FF]" title="LAN 1G Active" />
                                                  <div className="w-[2px] h-[2px] rounded-full bg-[#38BDF8]/60" />
                                                </div>
                                                {/* Deep RJ45 Socket Receptacle Opening */}
                                                <div className="w-[11px] h-[16px] bg-[#050811] border border-black rounded-[1px] shadow-inner relative overflow-hidden" />
                                              </div>
                                              <span className="font-mono text-[3.6px] font-black text-[#38BDF8] drop-shadow-[0_0_2px_#0284C7]">LAN</span>
                                            </div>

                                            {/* Port 4: CLK (Unpopulated Open RJ45 Receptacle) */}
                                            <div className="flex flex-col items-center gap-[1px]">
                                              <div className="w-[14px] h-[24px] bg-gradient-to-b from-[#0F172A] to-[#020617] border border-[#334155] rounded-[1.5px] shadow-inner flex flex-col items-center justify-between p-[1px] relative">
                                                <div className="w-full flex justify-between px-[1px]">
                                                  <div className="w-[2px] h-[2px] rounded-full bg-slate-700" />
                                                  <div className="w-[2px] h-[2px] rounded-full bg-slate-700" />
                                                </div>
                                                <div className="w-[11px] h-[16px] bg-[#050811] border border-black rounded-[1px] shadow-inner flex flex-col justify-between items-center p-[0.5px]">
                                                  <div className="w-full flex gap-[0.5px] justify-center pt-[1px]">
                                                    {[...Array(6)].map((_, i) => (
                                                      <div key={i} className="w-[0.8px] h-[3px] bg-[#EAB308] opacity-75" />
                                                    ))}
                                                  </div>
                                                  <div className="w-[5px] h-[3.5px] bg-[#0B0F19] border border-[#1E293B] rounded-[0.5px]" />
                                                </div>
                                              </div>
                                              <span className="font-mono text-[3.6px] font-black text-[#94A3B8]">CLK</span>
                                            </div>

                                            {/* Vertical Divider */}
                                            <div className="w-[1px] h-[28px] bg-[#334155] mx-[1px]" />

                                            {/* STAT Glowing Green LED */}
                                            <div className="flex flex-col items-center gap-[1px] px-[2px]">
                                              <div
                                                className="w-[8.5px] h-[8.5px] rounded-full"
                                                style={{
                                                  background: "radial-gradient(circle, #FFFFFF 0%, #39FF14 45%, #00DD44 100%)",
                                                  border: "1px solid #00FF66",
                                                  boxShadow: "0 0 5px #00FF66, 0 0 10px #39FF14, 0 0 16px rgba(57,255,20,0.6)",
                                                }}
                                              />
                                              <span className="font-mono text-[3.4px] font-black text-white leading-none mt-0.5">STAT</span>
                                              <span className="font-mono text-[3.0px] font-black text-[#39FF14] leading-none">ON</span>
                                            </div>
                                          </div>
                                          {/* Labels below Breaker Box */}
                                          <div className="absolute left-[246px] top-[44px] font-mono text-[3.8px] font-bold text-[#64748B] z-10">
                                            DC 48/60V
                                          </div>



                                          {/* Far Right: Vertical Green Guide / Lightpipe Bar & Right Ejector Latch */}
                                          <div className="absolute right-[6px] top-[4px] flex items-center gap-[4px] z-20">
                                            {/* Green Neon Lightpipe Bar with White Clamp */}
                                            <div className="relative flex items-center justify-center">
                                              <div
                                                className="w-[4px] h-[58px] rounded-[2px] flex items-center justify-center relative"
                                                style={{
                                                  background: "linear-gradient(to right, #047857 0%, #10B981 30%, #34D399 50%, #10B981 70%, #065F46 100%)",
                                                  border: "0.8px solid #059669",
                                                  boxShadow: "0 0 6px #00FF66, 0 0 12px rgba(0,255,102,0.6)",
                                                }}
                                              >
                                                <div className="w-[5px] h-[3.5px] bg-white border border-[#047857] rounded-[0.5px] shadow-xs" />
                                              </div>
                                            </div>

                                            {/* Right Latch Lever & Thumbscrew */}
                                            <div className="flex flex-col justify-around items-center h-[58px]">
                                              <div className="w-[6px] h-[36px] rounded-[1.5px] bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#020617] border border-[#475569] flex items-center justify-center shadow-[1px_2px_3px_rgba(0,0,0,0.4)]">
                                                <div className="w-[2px] h-[26px] bg-gradient-to-b from-[#FFFFFF] via-[#CBD5E1] to-[#64748B] rounded-[0.5px] shadow-2xs" />
                                              </div>
                                              <div className="w-[7.5px] h-[7.5px] rounded-full bg-gradient-to-br from-white via-[#CBD5E1] to-[#64748B] border border-[#334155] flex items-center justify-center font-mono text-[5px] font-black text-[#0F172A] shadow-[0_1.5px_2px_rgba(0,0,0,0.3)]">
                                                +
                                              </div>
                                            </div>
                                          </div>

                                          {/* Authentic Compact Industrial Regulatory ESD Placard (Exact Gambar 2 & Gambar 4) */}
                                          <div className="absolute right-[24px] bottom-[3px] w-[58px] bg-[#CBD5E1] border border-[#64748B] rounded-[1.5px] shadow-[0_1px_2px_rgba(0,0,0,0.25),inset_0_0.8px_0_rgba(255,255,255,0.9)] overflow-hidden z-20">
                                            {/* 4 Corner Screws / Rivets */}
                                            <div className="absolute top-[0.8px] left-[0.8px] w-[2px] h-[2px] rounded-full bg-slate-200 border border-slate-600 flex items-center justify-center font-mono text-[1.8px] text-slate-800 leading-none">+</div>
                                            <div className="absolute top-[0.8px] right-[0.8px] w-[2px] h-[2px] rounded-full bg-slate-200 border border-slate-600 flex items-center justify-center font-mono text-[1.8px] text-slate-800 leading-none">+</div>
                                            <div className="absolute bottom-[0.8px] left-[0.8px] w-[2px] h-[2px] rounded-full bg-slate-200 border border-slate-600 flex items-center justify-center font-mono text-[1.8px] text-slate-800 leading-none">+</div>
                                            <div className="absolute bottom-[0.8px] right-[0.8px] w-[2px] h-[2px] rounded-full bg-slate-200 border border-slate-600 flex items-center justify-center font-mono text-[1.8px] text-slate-800 leading-none">+</div>

                                            {/* Yellow Header Banner: ATTENTION */}
                                            <div className="bg-[#FACC15] border-b border-[#CA8A04] px-1 py-[0.8px] flex items-center justify-center gap-[1.5px]">
                                              <svg viewBox="0 0 20 18" className="w-[3.5px] h-[3px] shrink-0" fill="none">
                                                <polygon points="10,1.5 19,16.5 1,16.5" fill="#000" />
                                                <polygon points="10,3.5 17.5,15.5 2.5,15.5" fill="#FACC15" />
                                                <path d="M 10,7 L 10,11" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
                                                <circle cx="10" cy="13.5" r="1.0" fill="#000" />
                                              </svg>
                                              <span className="font-mono text-[2.8px] font-black text-black tracking-tight leading-none">
                                                ATTENTION / CAUTION
                                              </span>
                                            </div>

                                            {/* Body: Multi-line Industrial Regulatory Notice (Fine Micro-Text) */}
                                            <div className="px-1 py-[1px] font-mono text-[2.1px] text-slate-800 leading-tight">
                                              <div className="tracking-tighter text-slate-900 font-semibold truncate">
                                                Avant de manipuler circuits ou cartes
                                              </div>
                                              <div className="tracking-tighter text-slate-700 truncate">
                                                faire attention aux pièces sensibles
                                              </div>
                                              <div className="flex justify-between items-center border-t border-slate-300/80 pt-[0.5px] mt-[0.5px] text-[1.9px] text-slate-600 font-bold">
                                                <span>CIRCUIT CARDS &bull; STATIC</span>
                                                <span className="text-slate-800 font-black">ESD &bull; CE</span>
                                              </div>
                                            </div>
                                          </div>

                                        </div>

                                      </div>

                                      {/* ── ACTIVE SELECTION FRAME OVERLAY: ENCOMPASSES 100% OF THE MFC UTILITY TRAY SLOT ── */}
                                      {isAct && (
                                        <div className="absolute inset-0 pointer-events-none border-2 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.9),inset_0_0_10px_rgba(245,158,11,0.25)] z-35" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* ── 4. CHASSIS LOWER CAVITY & CABLE CLEARANCE BAY (BAGIAN BAWAH YANG "FREE" - SESUAI FOTO HARDWARE GAMBAR 3) ── */}
                              {/* Isi belakang tidak sampai bawah: Ada rongga bebas industri (free bay) 34px untuk jalur kabel DC & grounding STO */}
                              <div
                                className="h-[26px] w-full shrink-0 rounded-none relative flex items-center justify-between px-2 select-none overflow-hidden"
                                style={{
                                  background: "linear-gradient(to bottom, #1E293B 0%, #151F30 40%, #0F172A 80%, #090D16 100%)",
                                  border: "1px solid #334155",
                                  boxShadow: "inset 0 4px 8px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.4)",
                                }}
                              >
                                {/* Area Kiri: Rongga Bebas Jalur Kabel DC & Grounding Bar STO */}
                                <div className="flex items-center gap-2 pl-1 z-10">
                                  {/* Dual Grounding Studs (M6 Copper / Brass Hex Nuts & Lugs) */}
                                  <div className="flex items-center gap-1.5" title="Central Office Grounding Terminals">
                                    <div className="flex items-center gap-1">
                                      <div className="w-[8px] h-[8px] rounded-full bg-[#D97706] border border-[#78350F] flex items-center justify-center shadow-xs">
                                        <div className="w-[4px] h-[4px] rounded-full bg-[#F59E0B]" />
                                      </div>
                                      <div className="w-[8px] h-[8px] rounded-full bg-[#D97706] border border-[#78350F] flex items-center justify-center shadow-xs">
                                        <div className="w-[4px] h-[4px] rounded-full bg-[#F59E0B]" />
                                      </div>
                                    </div>
                                    <span className="font-mono text-[5.5px] font-black text-amber-500/90 tracking-tight">
                                      GND ⏚
                                    </span>
                                  </div>

                                  {/* Cable Run-Through Clearance Notch */}
                                  <div className="h-[18px] w-[50px] bg-[#070B13] border border-[#1E293B] rounded-[2px] flex items-center justify-around px-1 shadow-inner">
                                    <div className="w-[2px] h-[12px] bg-[#334155] rounded-full" />
                                    <div className="w-[2px] h-[12px] bg-[#334155] rounded-full" />
                                    <span className="font-mono text-[4.8px] font-bold text-slate-500 uppercase">
                                      CABLE RUNWAY
                                    </span>
                                  </div>
                                </div>

                                {/* Area Tengah: Stamped Chassis Ventilation Slots */}
                                <div className="flex items-center gap-2 z-10">
                                  {[...Array(6)].map((_, i) => (
                                    <div key={i} className="w-[14px] h-[3.5px] rounded-[1px] bg-[#02050A] border border-[#1E293B] shadow-inner" />
                                  ))}
                                </div>

                                {/* Area Kanan: Chassis Base Structural Flange (Free Lower Clearance) */}
                                <div className="flex items-center gap-2 pr-1 z-10">
                                  <span className="font-mono text-[5px] font-black text-slate-400 tracking-wider">
                                    FREE LOWER CLEARANCE &bull; 1830 PSS-24x
                                  </span>
                                  <div className="w-[7px] h-[7px] rounded-full bg-gradient-to-br from-white via-[#CBD5E1] to-[#64748B] border border-[#334155] flex items-center justify-center font-mono text-[5px] font-black text-[#1E293B] shadow-xs">
                                    +
                                  </div>
                                </div>

                                {/* Subtle Galvanized Steel Hairline Overlay */}
                                <div
                                  className="absolute inset-0 pointer-events-none opacity-20"
                                  style={{
                                    background: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 3px)",
                                  }}
                                />
                              </div>

                              {/* ── UNIFIED CONTINUOUS 12-CABLE HARNESS & CONDUIT OVERLAY (ZERO DISCONNECT - SEAMLESS FROM BREAKERS TO RUNWAY) ── */}
                              <svg viewBox="0 0 532 400" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-30" fill="none">
                                <defs>
                                  <filter id="bay-cables-shadow" x="-10%" y="-10%" width="130%" height="130%">
                                    <feDropShadow dx="1.5" dy="2.5" stdDeviation="2.5" floodColor="#020617" floodOpacity="0.45" />
                                  </filter>
                                  <linearGradient id="bay-grey-conduit" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#FFFFFF" />
                                    <stop offset="30%" stopColor="#E2E8F0" />
                                    <stop offset="70%" stopColor="#94A3B8" />
                                    <stop offset="100%" stopColor="#475569" />
                                  </linearGradient>
                                  <filter id="c-drop-3d" x="-20%" y="-20%" width="140%" height="150%">
                                    <feDropShadow dx="2" dy="3" stdDeviation="2.5" floodColor="#020617" floodOpacity="0.6" />
                                  </filter>
                                  <linearGradient id="plug-chrome-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#475569" />
                                    <stop offset="20%" stopColor="#E2E8F0" />
                                    <stop offset="50%" stopColor="#FFFFFF" />
                                    <stop offset="75%" stopColor="#CBD5E1" />
                                    <stop offset="100%" stopColor="#334155" />
                                  </linearGradient>
                                  <linearGradient id="plug-body-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#020617" />
                                    <stop offset="35%" stopColor="#1E293B" />
                                    <stop offset="65%" stopColor="#334155" />
                                    <stop offset="85%" stopColor="#1E293B" />
                                    <stop offset="100%" stopColor="#020617" />
                                  </linearGradient>
                                  <linearGradient id="colokan-silver-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#FFFFFF" />
                                    <stop offset="35%" stopColor="#E2E8F0" />
                                    <stop offset="70%" stopColor="#94A3B8" />
                                    <stop offset="100%" stopColor="#64748B" />
                                  </linearGradient>
                                  <linearGradient id="colokan-chrome-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#94A3B8" />
                                    <stop offset="30%" stopColor="#FFFFFF" />
                                    <stop offset="65%" stopColor="#E2E8F0" />
                                    <stop offset="100%" stopColor="#64748B" />
                                  </linearGradient>
                                </defs>

                                {/* ── 4x DUAL-BOLT METALLIC GROUNDING LUGS (BETWEEN BATT-I & BATT-II ON EACH MODULE - EXACT FOTO GAMBAR 11) ── */}
                                {[45, 178, 311, 444].map((gx, gIdx) => (
                                  <g key={`psf-gnd-lug-${gIdx}`}>
                                    {/* Vertical cable behind lug */}
                                    <path d={`M ${gx},268 L ${gx},278`} stroke="#070A10" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                                    {/* Metallic Silver Aluminum Lug Plate */}
                                    <rect x={gx - 3.5} y={261} width="7" height="10.5" rx="0.8" fill="url(#colokan-chrome-grad)" stroke="#475569" strokeWidth="0.6" filter="drop-shadow(0 1px 1.5px rgba(0,0,0,0.4))" />
                                    {/* Dual Hex/Phillips Ground Bolts */}
                                    <circle cx={gx} cy={264} r="1.7" fill="#F8FAFC" stroke="#334155" strokeWidth="0.5" />
                                    <circle cx={gx} cy={268.5} r="1.7" fill="#F8FAFC" stroke="#334155" strokeWidth="0.5" />
                                  </g>
                                ))}

                                {/* ── THE 12 UNBROKEN CONTINUOUS CABLES, RECTANGULAR BLACK PLUGS & WHITE BATT TAGS (EXACT FOTO GAMBAR 11) ── */}
                                {[
                                  // Module 1 (Slot 34)
                                  { bx: 24,  tag: "BATT-I",   d: "M 24,265 L 24,273 C 24,276 36,276 50,279 L 50,392" },
                                  { bx: 66,  tag: "BATT-II",  d: "M 66,265 L 66,273 C 66,276 58,276 52,279 L 52,392" },
                                  { bx: 108, tag: "BATT-III", d: "M 108,265 L 108,273 C 108,276 75,276 54,279 L 54,392" },
                                  // Module 2 (Slot 35)
                                  { bx: 157, tag: "BATT-I",   d: "M 157,265 L 157,271 C 157,275 147,275 88,275 C 72,275 56,278 56,285 L 56,392" },
                                  { bx: 199, tag: "BATT-II",  d: "M 199,265 L 199,271 C 199,276 189,276 90,276 C 74,276 58,279 58,286 L 58,392" },
                                  { bx: 241, tag: "BATT-III", d: "M 241,265 L 241,271 C 241,277 231,277 92,277 C 76,277 60,280 60,287 L 60,392" },
                                  // Module 3 (Slot 36)
                                  { bx: 290, tag: "BATT-I",   d: "M 290,265 L 290,271 C 290,278 280,278 94,278 C 78,278 62,281 62,288 L 62,392" },
                                  { bx: 332, tag: "BATT-II",  d: "M 332,265 L 332,271 C 332,279 322,279 96,279 C 80,279 64,282 64,289 L 64,392" },
                                  { bx: 374, tag: "BATT-III", d: "M 374,265 L 374,271 C 374,280 364,280 98,280 C 82,280 66,283 66,290 L 66,392" },
                                  // Module 4 (Slot 37)
                                  { bx: 423, tag: "BATT-I",   d: "M 423,265 L 423,271 C 423,281 413,281 100,281 C 84,281 68,284 68,291 L 68,392" },
                                  { bx: 465, tag: "BATT-II",  d: "M 465,265 L 465,271 C 465,282 455,282 102,282 C 86,282 70,285 70,292 L 70,392" },
                                  { bx: 507, tag: "BATT-III", d: "M 507,265 L 507,271 C 507,283 497,283 104,283 C 88,283 72,286 72,293 L 72,392" },
                                ].map(({ bx, tag, d }, cIdx) => (
                                  <g key={`unified-cable-${cIdx}`}>
                                    {/* 1. Ambient Drop Shadow onto the card face */}
                                    <path d={d} stroke="rgba(2, 6, 23, 0.45)" strokeWidth="5.0" strokeLinecap="round" fill="none" filter="url(#c-drop-3d)" />
                                    {/* 2. Heavy-duty Midnight Black Rubber Jacket */}
                                    <path d={d} stroke="#070A10" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                                    {/* 3. 3D Cylindrical Core Tone */}
                                    <path d={d} stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                                    {/* 4. Cylindrical Specular Highlight Streak */}
                                    <path d={d} stroke="#64748B" strokeWidth="0.9" strokeLinecap="round" fill="none" />

                                    {/* 5. Molded Black Rectangular Power Plug Exiting Bottom of PSF Module (Exact Gambar 11) */}
                                    <rect x={bx - 5.2} y={260} width="10.4" height="8.5" rx="0.8" fill="url(#plug-body-grad)" stroke="#020617" strokeWidth="0.7" filter="drop-shadow(0 1.5px 2px rgba(0,0,0,0.5))" />
                                    <line x1={bx - 3.5} y1={261.5} x2={bx + 3.5} y2={261.5} stroke="#475569" strokeWidth="0.6" />

                                    {/* 6. White Wrap-Around Cable Label Tag Reading BATT-I/II/III */}
                                    <rect x={bx - 3.6} y={269.5} width="7.2" height="5.5" rx="0.6" fill="#FFFFFF" stroke="#64748B" strokeWidth="0.5" filter="drop-shadow(0 1px 1.2px rgba(0,0,0,0.4))" />
                                    <text x={bx} y={273.1} fontFamily="monospace" fontSize="2.1" fontWeight="900" fill="#0F172A" textAnchor="middle">{tag}</text>
                                  </g>
                                ))}

                                {/* ── HORIZONTAL CABLE TROUGH ZIP-TIES (Strapping horizontal bundle together - Exact Gambar 1 & 4) ── */}
                                <rect x="390" y="258" width="3.2" height="11" rx="0.6" fill="#FFFFFF" stroke="#475569" strokeWidth="0.6" />
                                <rect x="260" y="256" width="3.2" height="13" rx="0.6" fill="#FFFFFF" stroke="#475569" strokeWidth="0.6" />
                                <rect x="130" y="253" width="3.2" height="15" rx="0.6" fill="#FFFFFF" stroke="#475569" strokeWidth="0.6" />
                                <rect x="80" y="252" width="3.6" height="17" rx="0.6" fill="#FFFFFF" stroke="#475569" strokeWidth="0.6" />

                                {/* ── DUAL GREY PATCH CABLES (NEAT RUNWAY ROUTING & PRECISE LAN PORT TERMINATION AT X=401 - EXACT GAMBAR 1 & 4) ── */}
                                {/* Cable 1 (Inner Cable): Runs vertically straight at X=75, sweeps smoothly through top channel, curves directly into LAN Boot at X=401 */}
                                <path
                                  d="M 75,392 L 75,292 C 75,279 85,279 102,279 L 280,279 C 315,279 342,294 368,312 C 382,322 393,329 399.5,330 Q 401,330 401,327 L 401,324"
                                  stroke="rgba(2, 6, 23, 0.40)"
                                  strokeWidth="3.8"
                                  fill="none"
                                  filter="url(#bay-cables-shadow)"
                                />
                                <path
                                  d="M 75,392 L 75,292 C 75,279 85,279 102,279 L 280,279 C 315,279 342,294 368,312 C 382,322 393,329 399.5,330 Q 401,330 401,327 L 401,324"
                                  stroke="#64748B"
                                  strokeWidth="2.8"
                                  strokeLinecap="round"
                                  fill="none"
                                />
                                <path
                                  d="M 75,392 L 75,292 C 75,279 85,279 102,279 L 280,279 C 315,279 342,294 368,312 C 382,322 393,329 399.5,330 Q 401,330 401,327 L 401,324"
                                  stroke="#CBD5E1"
                                  strokeWidth="2.0"
                                  strokeLinecap="round"
                                  fill="none"
                                />
                                <path
                                  d="M 75,392 L 75,292 C 75,279 85,279 102,279 L 280,279 C 315,279 342,294 368,312 C 382,322 393,329 399.5,330 Q 401,330 401,327 L 401,324"
                                  stroke="#F8FAFC"
                                  strokeWidth="0.6"
                                  strokeLinecap="round"
                                  fill="none"
                                  opacity="0.8"
                                />

                                {/* Cable 2 (Outer Cable): Runs vertically straight at X=78.5, sweeps smoothly parallel and enters LAN boot base */}
                                <path
                                  d="M 78.5,392 L 78.5,295 C 78.5,282 88.5,282 104,282 L 280,282 C 315,282 342,297 368,315 C 382,325 393,332 401,333 Q 402.5,333 402.5,329 L 402.5,326"
                                  stroke="rgba(2, 6, 23, 0.40)"
                                  strokeWidth="3.8"
                                  fill="none"
                                  filter="url(#bay-cables-shadow)"
                                />
                                <path
                                  d="M 78.5,392 L 78.5,295 C 78.5,282 88.5,282 104,282 L 280,282 C 315,282 342,297 368,315 C 382,325 393,332 401,333 Q 402.5,333 402.5,329 L 402.5,326"
                                  stroke="#64748B"
                                  strokeWidth="2.8"
                                  strokeLinecap="round"
                                  fill="none"
                                />
                                <path
                                  d="M 78.5,392 L 78.5,295 C 78.5,282 88.5,282 104,282 L 280,282 C 315,282 342,297 368,315 C 382,325 393,332 401,333 Q 402.5,333 402.5,329 L 402.5,326"
                                  stroke="#CBD5E1"
                                  strokeWidth="2.0"
                                  strokeLinecap="round"
                                  fill="none"
                                />
                                <path
                                  d="M 78.5,392 L 78.5,295 C 78.5,282 88.5,282 104,282 L 280,282 C 315,282 342,297 368,315 C 382,325 393,332 401,333 Q 402.5,333 402.5,329 L 402.5,326"
                                  stroke="#F8FAFC"
                                  strokeWidth="0.6"
                                  strokeLinecap="round"
                                  fill="none"
                                  opacity="0.8"
                                />

                                {/* ── MID RUNWAY ZIP-TIE STRAP (Strapping DC Loom and Grey Cables neatly together - Exact Gambar 1 & 4) ── */}
                                <g>
                                  <rect x="47" y="328" width="35" height="4.2" rx="1.0" fill="#F8FAFC" stroke="#64748B" strokeWidth="0.6" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.35))" />
                                  <rect x="79" y="326.5" width="4.5" height="7.2" rx="0.8" fill="#FFFFFF" stroke="#475569" strokeWidth="0.7" />
                                  <line x1="50" y1="330.1" x2="77" y2="330.1" stroke="#94A3B8" strokeWidth="0.5" strokeDasharray="1.2 1.2" />
                                </g>

                                {/* ── LOWER RUNWAY ZIP-TIE (Inside Slot 39 Runway - Cleaned per Gambar 2 & 3) ── */}
                                <g>
                                  <rect x="47" y="368" width="35" height="4.2" rx="1.0" fill="#F8FAFC" stroke="#64748B" strokeWidth="0.6" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.35))" />
                                  <rect x="79" y="366.5" width="4.5" height="7.2" rx="0.8" fill="#FFFFFF" stroke="#475569" strokeWidth="0.7" />
                                  <line x1="50" y1="370.1" x2="77" y2="370.1" stroke="#94A3B8" strokeWidth="0.5" strokeDasharray="1.2 1.2" />
                                </g>

                                {/* ── CASSETTE CORNER WHITE ZIP-TIE (Strapping Grey Cables directly to MFC Top Flange - Exact Gambar 1 & 4) ── */}
                                <g>
                                  <rect x="105" y="275.5" width="4.6" height="9.5" rx="0.8" fill="#FFFFFF" stroke="#475569" strokeWidth="0.7" filter="drop-shadow(0 1.5px 2px rgba(0,0,0,0.4))" />
                                  <rect x="105.5" y="274" width="3.6" height="3.5" rx="0.5" fill="#F8FAFC" stroke="#334155" strokeWidth="0.7" />
                                  <line x1="107.3" y1="277.5" x2="107.3" y2="284" stroke="#94A3B8" strokeWidth="0.6" />
                                </g>

                                {/* White Nylon Cable Fasteners Along the Top Channel of MFC (Exact Gambar 1 & 4) */}
                                <rect x="165" y="277" width="3.2" height="7.5" rx="0.6" fill="#FFFFFF" stroke="#475569" strokeWidth="0.6" />
                                <rect x="225" y="277" width="3.2" height="7.5" rx="0.6" fill="#FFFFFF" stroke="#475569" strokeWidth="0.6" />

                                {/* ── UNIFIED HD RJ45 CONNECTOR & SNAGLESS BOOT (ACCURATELY PLUGGED INTO LAN PORT 3 AT X=401.0 - ZERO OFFSET) ── */}
                                <g key="lan-rj45-plug-unified">
                                  {/* 1. Molded Light Grey Snagless Rubber Boot (Centred exactly at X=401.0, connecting seamlessly to cable end) */}
                                  <path d="M 397,331 L 405,331 L 404,323 L 398,323 Z" fill="#94A3B8" stroke="#475569" strokeWidth="0.6" />
                                  <path d="M 398,330 L 404,330 L 403.2,324 L 398.8,324 Z" fill="#CBD5E1" />
                                  <line x1="398.5" y1="326.5" x2="403.5" y2="326.5" stroke="#64748B" strokeWidth="0.5" />
                                  <line x1="398.3" y1="328.5" x2="403.7" y2="328.5" stroke="#64748B" strokeWidth="0.5" />

                                  {/* 2. Shielded / Tinted Polycarbonate Plug Body seated firmly inside LAN socket cavity (X=401.0, Y=316..323) */}
                                  <rect x="396.3" y="316" width="9.4" height="7.5" rx="0.8" fill="url(#plug-chrome-grad)" stroke="#475569" strokeWidth="0.6" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))" />
                                  <line x1="397.0" y1="317.5" x2="405.0" y2="317.5" stroke="#FFFFFF" strokeWidth="0.7" />

                                  {/* 3. Polycarbonate Latch Arm Notch (Centered at X=401.0) */}
                                  <rect x="400.0" y="318" width="2" height="4.5" rx="0.4" fill="rgba(241, 245, 249, 0.95)" stroke="#64748B" strokeWidth="0.5" />
                                </g>
                              </svg>
                            </div>
                          </div>

                          {/* ── 3D CUBOID FRONT FACE (TAMPAK DEPAN OTENTIK TELKOM / NOKIA 1830 PSS-24X) ── */}
                          <div
                            id="face-front"
                            data-hardware-device="true"
                            data-preserve-theme="true"
                            className="absolute rounded-none border-t-2 border-l-2 border-r-2 border-b-0 border-slate-300 bg-gradient-to-b from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8] pt-1.5 px-1.5 pb-[34px] text-slate-900 flex flex-col justify-between select-none"
                            style={{
                              width: "540px",
                              height: "560px",
                              top: "0",
                              left: "0",
                              transform: "translateZ(100px)",
                              transformStyle: "preserve-3d",
                              backfaceVisibility: "hidden",
                              borderRadius: "0px",
                              boxSizing: "border-box",
                            }}
                          >
                            {/* ── AUTHENTIC TOP HEADER & FIBER MANAGEMENT TRAY (HIGH-DEFINITION 3D DIGITAL TWIN - EXACT REAL STO HARDWARE) ── */}
                            <div className="bg-[#CBD5E1] border-2 border-[#1E293B] rounded-none shadow-xl shrink-0 select-none overflow-hidden" style={{ borderRadius: "0px" }}>
                              {/* SLOT N/A: SHELF CHASSIS INSPECTION WRAPPER */}
                              {(() => {
                                const slotNA = normalizedSlots.find((s) => String(s.nomor_slot).toLowerCase().includes("n/a")) || {
                                  slot_definition_id: "slot-def-na",
                                  nomor_slot: "N/A",
                                  nama_slot: "Shelf Chassis",
                                  occupied: Boolean(currentDevice?.nomor_seri || currentDevice?.serial_number),
                                  module: { tipe: currentDevice?.tipe || "PSS-24x Shelf", serial_number: currentDevice?.nomor_seri || currentDevice?.serial_number || "-" },
                                };
                                const isHighlighted = slotNA.slot_definition_id === highlightedSlotId;
                                const isSelected = selectedSlotForAction?.slot_definition_id === slotNA.slot_definition_id;
                                const isAct = isHighlighted || isSelected;

                                return (
                                  <div
                                    id={`slot-item-${slotNA.slot_definition_id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSlotCardClick(slotNA, true);
                                      showSlotPopup(e, slotNA);
                                    }}
                                    onMouseEnter={(e) => showSlotPopup(e, slotNA)}
                                    onMouseLeave={() => hideSlotPopup(slotNA.slot_definition_id)}
                                    className={`transition-all cursor-pointer relative ${
                                      isAct ? "ring-2 ring-amber-500 shadow-[0_0_15px_#F59E0B]" : ""
                                    }`}
                                    title="Klik untuk inspeksi Sasis Rak (Slot N/A: Nokia 1830 PSS-24x Shelf Chassis)"
                                  >
                                    {/* ── LAYER A: SOLID CONTINUOUS INDUSTRIAL DECAL SHEET (EXACT HARDWARE TWIN - COMPACT & FULL LIKE GAMBAR 1) ── */}
                                    <div
                                      className="bg-[#CBD5E1] p-[2px] border-b-2 border-black overflow-hidden relative"
                                      style={{ height: "82px", boxSizing: "border-box" }}
                                    >
                                      <div
                                        className="bg-[#E5E7EB] border-2 border-black text-black leading-none select-none origin-top-left grid divide-x-2 divide-black"
                                        style={{
                                          width: "1260px",
                                          height: "184px",
                                          transform: "scale(0.409524)",
                                          gridTemplateColumns: "21.5% 20% 29.25% 29.25%",
                                          boxSizing: "border-box",
                                        }}
                                      >
                                        {/* ── COLUMN 1 (21.5%): NOKIA BRANDING, SPECS, FCC BOX & CERTIFICATION LOGOS ── */}
                                        <div className="bg-[#E5E7EB] p-1 flex flex-col justify-between font-sans text-black h-full overflow-hidden">
                                          {/* Header Row: NOKIA Wordmark & 1830 PSS-24x */}
                                          <div className="flex items-center justify-between">
                                            <span className="font-sans font-black text-[18px] text-black tracking-[-0.05em] leading-none">
                                              NOKIA
                                            </span>
                                            <span className="font-sans font-bold text-[11.5px] text-black tracking-tight leading-none">
                                              1830 PSS-24x
                                            </span>
                                          </div>

                                          {/* Address, Corner Brackets, Model Number, & Trough Notice */}
                                          <div className="flex flex-col gap-[1px] text-[6.1px] leading-[7.1px]">
                                            <div className="flex items-start justify-between gap-1">
                                              <div className="text-black shrink-0">
                                                <div className="font-semibold">Nokia</div>
                                                <div>Thurn-und-Taxis-Str. 10 / 2</div>
                                                <div>90411 Nürnberg</div>
                                                <div>Germany</div>
                                              </div>
                                              <div className="flex items-center gap-1 pt-0.5">
                                                <div className="w-10 h-6 flex flex-col justify-between text-black font-mono font-bold text-[7px] leading-none shrink-0">
                                                  <div className="flex justify-between w-full"><span>┌</span><span>┐</span></div>
                                                  <div className="flex justify-between w-full"><span>└</span><span>┘</span></div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                  <span className="font-sans font-bold text-[7.3px] text-black block leading-tight whitespace-nowrap">
                                                    Model No. 3KC50223AA
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="text-[5.9px] leading-[6.8px] text-black">
                                              Date Of Manufacture And Model Number May Be Viewed On The Label Placed In The Center Of Upper Fiber Trough
                                            </div>
                                          </div>

                                          {/* POWER REQUIREMENTS Section with Authentic DC symbols */}
                                          <div className="font-sans text-[6.0px] leading-[7.0px] text-black">
                                            <div className="font-bold text-[7.2px] tracking-wide text-black uppercase mb-[1px]">
                                              POWER REQUIREMENTS
                                            </div>
                                            <div>Up To Twelve (12) Input Power Feeders Per Shelf Each Rated As Follows:</div>
                                            <div>Twelve (12) Lines, -48V/-60V, 50/70 A max. Each Line.</div>
                                            <div>To Be Powered Only By Safety Extra Low Voltage (SELV)</div>
                                            <div className="flex items-center gap-1 flex-wrap">
                                              <span>From a -48V</span>
                                              <span className="inline-flex flex-col items-center justify-center w-3 h-1.5 align-middle">
                                                <span className="w-full border-t border-black" />
                                                <span className="w-full border-t border-dashed border-black mt-[1.5px]" />
                                              </span>
                                              <span>Source Or TNV-2 From a -60V</span>
                                              <span className="inline-flex flex-col items-center justify-center w-3 h-1.5 align-middle">
                                                <span className="w-full border-t border-black" />
                                                <span className="w-full border-t border-dashed border-black mt-[1.5px]" />
                                              </span>
                                              <span>Source.</span>
                                            </div>
                                          </div>

                                          {/* Bottom Section: FCC Box on Left, Authentic Regulatory Logos on Right */}
                                          <div className="flex items-stretch gap-1.5">
                                            {/* FCC Box */}
                                            <div className="flex-1 border border-black rounded-[3px] px-1 py-0.5 font-sans text-[5.4px] leading-[6.3px] text-black bg-[#E5E7EB] flex flex-col justify-center">
                                              <div>This Device Complies With Part 15 Of The Federal Communications Commission (FCC) Rules. Operation Is Subject To The Following Two Conditions: (1) This Device May Not Cause Harmful Interference / And (2) This Device Must Accept Any Interference Received Including Interference That May Cause Undesired Operation.</div>
                                              <div className="mt-[1px]">This Class A Digital Apparatus Complies With Canadian ICES-003. Cet Appareil Numérique De La Classe A Est Conforme A La Norme NMB-003 Du Canada.</div>
                                            </div>

                                            {/* Regulatory Logos Column: CSA US, CE, China RoHS 50, WEEE */}
                                            <div className="flex flex-col items-center justify-between shrink-0 w-6 py-0.5 text-black">
                                              {/* CSA US */}
                                              <svg viewBox="0 0 32 32" className="w-[15px] h-[15px] shrink-0" fill="currentColor">
                                                <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
                                                <text x="16" y="21" fontSize="13" fontWeight="900" fontFamily="serif" textAnchor="middle">SA</text>
                                                <text x="3.5" y="22" fontSize="9" fontWeight="bold" fontFamily="sans-serif">C</text>
                                                <text x="23" y="22" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">US</text>
                                              </svg>

                                              {/* CE */}
                                              <div className="font-sans font-black text-[10.5px] tracking-tight leading-none text-black">
                                                CE
                                              </div>

                                              {/* China RoHS 50 (Orange Circle) */}
                                              <svg viewBox="0 0 32 32" className="w-[15px] h-[15px] shrink-0 text-[#F59E0B]" fill="none" stroke="currentColor">
                                                <circle cx="16" cy="16" r="13" strokeWidth="2.2" strokeDasharray="30 8" />
                                                <polygon points="27,10 31,16 27,16" fill="currentColor" stroke="none" />
                                                <polygon points="5,22 1,16 5,16" fill="currentColor" stroke="none" />
                                                <text x="16" y="21" fontSize="13" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="currentColor" stroke="none">50</text>
                                              </svg>

                                              {/* WEEE Crossed-out Dustbin */}
                                              <svg viewBox="0 0 24 28" className="w-[12px] h-[14px] shrink-0 fill-current text-black">
                                                <rect x="5" y="4" width="14" height="2" rx="0.5" />
                                                <rect x="9" y="2" width="6" height="2" rx="0.5" />
                                                <polygon points="6,7 18,7 16.5,20 7.5,20" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                                <line x1="10" y1="9" x2="9.5" y2="18" stroke="currentColor" strokeWidth="1.2" />
                                                <line x1="14" y1="9" x2="14.5" y2="18" stroke="currentColor" strokeWidth="1.2" />
                                                <line x1="4" y1="5" x2="20" y2="21" stroke="currentColor" strokeWidth="1.8" />
                                                <line x1="20" y1="5" x2="4" y2="21" stroke="currentColor" strokeWidth="1.8" />
                                                <circle cx="8" cy="22" r="1.2" fill="currentColor" />
                                                <circle cx="16" cy="22" r="1.2" fill="currentColor" />
                                                <rect x="4" y="24.5" width="16" height="2.2" rx="0.5" fill="currentColor" />
                                              </svg>
                                            </div>
                                          </div>
                                        </div>

                                        {/* ── COLUMN 2 (20%): DANGER LASER WITH DUAL HAZARD TRIANGLES & GROUNDING ── */}
                                        <div className="bg-[#E5E7EB] flex flex-col divide-y-2 divide-black h-full overflow-hidden">
                                          {/* Box 1: DANGER LASER */}
                                          <div className="flex flex-col">
                                            <div className="bg-[#DC2626] text-white px-1.5 py-[2px] flex items-center justify-center gap-1.5 font-sans font-bold text-[10.5px] tracking-wider leading-none border-b border-black">
                                              <svg viewBox="0 0 24 22" className="w-[11px] h-[10px] shrink-0 fill-white">
                                                <polygon points="12,1.5 23,20.5 1,20.5" />
                                                <line x1="12" y1="7" x2="12" y2="13.5" stroke="#DC2626" strokeWidth="2.4" strokeLinecap="round" />
                                                <circle cx="12" cy="17.5" r="1.4" fill="#DC2626" />
                                              </svg>
                                              <span>DANGER</span>
                                            </div>
                                            <div className="divide-y divide-black/60 font-sans text-[5.7px] leading-[6.7px] text-black">
                                              {/* English Section */}
                                              <div className="px-1 py-[2px] flex items-center justify-between gap-1">
                                                <div className="flex-1">
                                                  <div className="font-bold uppercase">
                                                    INVISIBLE LASER RADIATION WHEN OPEN AND FIBER OPTIC CABLE DISCONNECTED.
                                                  </div>
                                                  <div>Avoid Direct Exposure To Beam.</div>
                                                  <div>Do Not View Beam Directly With Optical Instruments.</div>
                                                </div>
                                                <svg viewBox="0 0 24 22" className="w-[19px] h-[17px] shrink-0" fill="none">
                                                  <polygon points="12,1.5 23,20.5 1,20.5" fill="#FACC15" stroke="#000" strokeWidth="1.8" strokeLinejoin="round" />
                                                  <circle cx="12" cy="14" r="2" fill="#000" />
                                                  <line x1="12" y1="8" x2="12" y2="19" stroke="#000" strokeWidth="1.4" />
                                                  <line x1="7" y1="14" x2="17" y2="14" stroke="#000" strokeWidth="1.4" />
                                                  <line x1="8.5" y1="10.5" x2="15.5" y2="17.5" stroke="#000" strokeWidth="1.2" />
                                                  <line x1="15.5" y1="10.5" x2="8.5" y2="17.5" stroke="#000" strokeWidth="1.2" />
                                                </svg>
                                              </div>
                                              {/* French Section */}
                                              <div className="px-1 py-[2px] flex items-center justify-between gap-1">
                                                <div className="flex-1">
                                                  <div className="font-bold uppercase">
                                                    RAYONNEMENT LASER INVISIBLE SI LE COUVERCLE EST RETIRE ET SI LA FIBRE OPTIQUE EST DEBRANCHEE.
                                                  </div>
                                                  <div>Ne Pas S'exposer Aux Rayons Directs.</div>
                                                  <div>Ne Pas Observer Le Rayon Directement Au Moyen D'Instruments Optiques.</div>
                                                </div>
                                                <svg viewBox="0 0 24 22" className="w-[19px] h-[17px] shrink-0" fill="none">
                                                  <polygon points="12,1.5 23,20.5 1,20.5" fill="#FACC15" stroke="#000" strokeWidth="1.8" strokeLinejoin="round" />
                                                  <circle cx="12" cy="14" r="2" fill="#000" />
                                                  <line x1="12" y1="8" x2="12" y2="19" stroke="#000" strokeWidth="1.4" />
                                                  <line x1="7" y1="14" x2="17" y2="14" stroke="#000" strokeWidth="1.4" />
                                                  <line x1="8.5" y1="10.5" x2="15.5" y2="17.5" stroke="#000" strokeWidth="1.2" />
                                                  <line x1="15.5" y1="10.5" x2="8.5" y2="17.5" stroke="#000" strokeWidth="1.2" />
                                                </svg>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Box 2: WARNING (Independent Ground - English) */}
                                          <div className="flex flex-col flex-1 justify-between">
                                            <div className="bg-[#F59E0B] text-black px-1.5 py-[2px] flex items-center justify-center gap-1.5 font-sans font-bold text-[10px] tracking-wider leading-none border-b border-black">
                                              <svg viewBox="0 0 24 22" className="w-[10.5px] h-[9.5px] shrink-0 fill-black">
                                                <polygon points="12,1.5 23,20.5 1,20.5" />
                                                <line x1="12" y1="7" x2="12" y2="13.5" stroke="#F59E0B" strokeWidth="2.4" strokeLinecap="round" />
                                                <circle cx="12" cy="17.5" r="1.4" fill="#F59E0B" />
                                              </svg>
                                              <span>WARNING</span>
                                            </div>
                                            <div className="px-1.5 py-0.5 font-sans text-[6.0px] leading-[7.1px] text-black flex-1 flex flex-col justify-center">
                                              <div className="font-bold uppercase">
                                                INSTALLATION MUST INCLUDE AN INDEPENDENT FRAME GROUND DROP TO BUILDING GROUND.
                                              </div>
                                              <div className="text-[5.5px] mt-[1px]">
                                                See Alcatel-Lucent 1830 PSS-24x Installation Manual Document
                                              </div>
                                            </div>
                                          </div>

                                          {/* Box 3: AVERTISSEMENT (Independent Ground - French) */}
                                          <div className="flex flex-col flex-1 justify-between">
                                            <div className="bg-[#F59E0B] text-black px-1.5 py-[2px] flex items-center justify-center gap-1.5 font-sans font-bold text-[10px] tracking-wider leading-none border-b border-black">
                                              <svg viewBox="0 0 24 22" className="w-[10.5px] h-[9.5px] shrink-0 fill-black">
                                                <polygon points="12,1.5 23,20.5 1,20.5" />
                                                <line x1="12" y1="7" x2="12" y2="13.5" stroke="#F59E0B" strokeWidth="2.4" strokeLinecap="round" />
                                                <circle cx="12" cy="17.5" r="1.4" fill="#F59E0B" />
                                              </svg>
                                              <span>AVERTISSEMENT</span>
                                            </div>
                                            <div className="px-1.5 py-0.5 font-sans text-[5.9px] leading-[7.0px] text-black flex-1 flex flex-col justify-center">
                                              <div className="font-bold uppercase">
                                                À L'INSTALLATION, CE MATÉRIEL DOIT ÊTRE MIS À LA TERRE AU MOYEN D'UN CONDUCTEUR DE CONTINUITÉ DES MASSES INDÉPENDANT.
                                              </div>
                                              <div className="text-[5.5px] mt-[1px]">
                                                Voir Alcatel-Lucent 1830 PSS-24x Installation Manual Document
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* ── COLUMN 3 (29.25%): CAUTION 12 POWER FEEDERS & EARTHING ── */}
                                        <div className="bg-[#E5E7EB] flex flex-col divide-y-2 divide-black h-full overflow-hidden">
                                          {/* Box 1: CAUTION (Power Feeders, Metallic Interfaces, Circuit Packs) */}
                                          <div className="flex flex-col h-[81px] shrink-0">
                                            <div className="bg-[#FACC15] text-black px-1.5 py-[2px] flex items-center justify-center gap-1.5 font-sans font-bold text-[10.5px] tracking-wider leading-none border-b border-black">
                                              <svg viewBox="0 0 24 22" className="w-[11px] h-[10px] shrink-0 fill-black">
                                                <polygon points="12,1.5 23,20.5 1,20.5" />
                                                <line x1="12" y1="7" x2="12" y2="13.5" stroke="#FACC15" strokeWidth="2.4" strokeLinecap="round" />
                                                <circle cx="12" cy="17.5" r="1.4" fill="#FACC15" />
                                              </svg>
                                              <span>CAUTION</span>
                                            </div>
                                            <div className="divide-y divide-black/60 font-sans text-[5.8px] leading-[6.8px] text-black flex-1 flex flex-col justify-between">
                                              <div className="px-1.5 py-[2px]">
                                                <div className="font-bold uppercase">
                                                  THIS UNIT HAS UP TO TWELVE (12) INPUT POWER FEEDERS. DISCONNECTING LESS THAN THE MAXIMUM WILL NOT DEENERGIZE THE SYSTEM.
                                                </div>
                                                <div>To Reduce The Risk Of Injury, Disconnect All Up To Twelve (12) Power Feeders When Removing Power To The System.</div>
                                              </div>
                                              <div className="px-1.5 py-[2px] font-bold uppercase">
                                                METALLIC TELECOMMUNICATION INTERFACES SHOULD NOT LEAVE THE BUILDING PREMISES UNLESS CONNECTED TO TELECOMMUNICATION DEVICES PROVIDING PRIMARY AND SECONDARY PROTECTION, AS APPLICABLE.
                                              </div>
                                              <div className="px-1.5 py-[2px] text-[5.5px] leading-[6.4px]">
                                                Use Only Alcatel-Lucent Manufactured Circuit Packs Designated For Use With This Equipment. Use Of Other Circuit Packs May Result In Improper Connection Of Circuitry Leading To Fire Or Injury Of Persons.
                                              </div>
                                            </div>
                                          </div>

                                          {/* Box 2: CAUTION (DC Earthing Conductors - 5 Complete Clauses) */}
                                          <div className="flex flex-col flex-1">
                                            <div className="bg-[#FACC15] text-black px-1.5 py-[2px] flex items-center justify-center gap-1.5 font-sans font-bold text-[10.5px] tracking-wider leading-none border-b border-black">
                                              <svg viewBox="0 0 24 22" className="w-[11px] h-[10px] shrink-0 fill-black">
                                                <polygon points="12,1.5 23,20.5 1,20.5" />
                                                <line x1="12" y1="7" x2="12" y2="13.5" stroke="#FACC15" strokeWidth="2.4" strokeLinecap="round" />
                                                <circle cx="12" cy="17.5" r="1.4" fill="#FACC15" />
                                              </svg>
                                              <span>CAUTION</span>
                                            </div>
                                            <div className="px-1.5 py-0.5 font-sans text-[5.9px] leading-[7.0px] text-black flex flex-col justify-evenly flex-1">
                                              <div>This equipment has a connection between the earthed conductor of the D.C. supply circuit and the earthing conductor.</div>
                                              <div>This equipment shall be connected directly to the D.C. supply system earthing electrode conductor or to a bonding jumper from an earthing terminal bar or bus to which the D.C. supply system earthing electrode conductor is connected.</div>
                                              <div>This equipment shall be located in the same immediate area (such as adjacent cabinets) as by other equipment that has a connection between the earthed conductor of the same D.C. supply circuit and the earthing conductor and also the point of earthing of the D.C. system. The D.C. system shall not be earthed elsewhere.</div>
                                              <div>The D.C. supply source is to be located within the same premises as the equipment.</div>
                                              <div>Switching or disconnecting devices shall not be in earthed circuit conductor between the D.C. source and the point of the connection of the earthing electrode conductor.</div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* ── COLUMN 4 (29.25%): ATTENTION 12 ARTÈRES & MISE À LA TERRE ── */}
                                        <div className="bg-[#E5E7EB] flex flex-col divide-y-2 divide-black h-full overflow-hidden">
                                          {/* Box 1: ATTENTION (12 Artères d'entrée, Interfaces Métalliques, Circuit Packs) */}
                                          <div className="flex flex-col h-[81px] shrink-0">
                                            <div className="bg-[#FACC15] text-black px-1.5 py-[2px] flex items-center justify-center gap-1.5 font-sans font-bold text-[10.5px] tracking-wider leading-none border-b border-black">
                                              <svg viewBox="0 0 24 22" className="w-[11px] h-[10px] shrink-0 fill-black">
                                                <polygon points="12,1.5 23,20.5 1,20.5" />
                                                <line x1="12" y1="7" x2="12" y2="13.5" stroke="#FACC15" strokeWidth="2.4" strokeLinecap="round" />
                                                <circle cx="12" cy="17.5" r="1.4" fill="#FACC15" />
                                              </svg>
                                              <span>ATTENTION</span>
                                            </div>
                                            <div className="divide-y divide-black/60 font-sans text-[5.7px] leading-[6.7px] text-black flex-1 flex flex-col justify-between">
                                              <div className="px-1.5 py-[2px]">
                                                <div className="font-bold uppercase">
                                                  CE SYSTÈME COMPORTE UN MAXIMUM DE DOUZE (12) ARTÈRES D'ENTRÉE; SI TOUTES LES ARTÈRES NE SONT PAS DÉBRANCHÉES, LE SYSTÈME N'EST PAS HORS TENSION.
                                                </div>
                                                <div>Pour Réduire le Risque de blessure, Débrancher Au Plus Douze (12) Artères D' entrée Pour Mettre Le Système Hors Tension.</div>
                                              </div>
                                              <div className="px-1.5 py-[2px] font-bold uppercase">
                                                LES INTERFACES MÉTALLIQUES DE TÉLÉCOMMUNICATIONS NE DEVRAIENT PAS ÊTRE DÉPLACÉ HORS DU BÂTIMENT À MOINS D'ÊTRE RACCORDÉES À DES DISPOSITIFS DE TÉLÉCOMMUNICATIONS ASSURANT LA PROTECTION DU PRIMAIRE ET DU SECONDAIRE SELON LE CAS.
                                              </div>
                                              <div className="px-1.5 py-[2px] text-[5.5px] leading-[6.4px]">
                                                Use Only Alcatel-Lucent Manufactured Circuit Packs Designated For Use With This Equipment. Use Of Other Circuit Packs May Result In Improper Connection Of Circuitry Leading To Fire Or Injury Of Persons.
                                              </div>
                                            </div>
                                          </div>

                                          {/* Box 2: ATTENTION (French Earthing Conductor Clauses) */}
                                          <div className="flex flex-col flex-1">
                                            <div className="bg-[#FACC15] text-black px-1.5 py-[2px] flex items-center justify-center gap-1.5 font-sans font-bold text-[10.5px] tracking-wider leading-none border-b border-black">
                                              <svg viewBox="0 0 24 22" className="w-[11px] h-[10px] shrink-0 fill-black">
                                                <polygon points="12,1.5 23,20.5 1,20.5" />
                                                <line x1="12" y1="7" x2="12" y2="13.5" stroke="#FACC15" strokeWidth="2.4" strokeLinecap="round" />
                                                <circle cx="12" cy="17.5" r="1.4" fill="#FACC15" />
                                              </svg>
                                              <span>ATTENTION</span>
                                            </div>
                                            <div className="px-1.5 py-0.5 font-sans text-[5.8px] leading-[6.8px] text-black flex flex-col justify-evenly flex-1">
                                              <div>Cet appareil comporte une connexion entre le conducteur relié à la terre du circuit d'alimentation C.C. et son conducteur de terre.</div>
                                              <div>Ce matériel doit être raccordé directement au conducteur relié à la terre du circuit d'alimentation C.C. ou à une tresse de mise à la masse reliée à une barre omnibus de terre laquelle est raccordée à l'électrode de terre du circuit d'alimentation C.C.</div>
                                              <div>Les appareils dont les conducteurs de terre respectifs sont raccordés au conducteur de terre du même circuit d'alimentation C.C. doivent être installés à proximités les uns des autres (p ex, dans des armoires adjacentes) et à proximité de la prise de terre du circuit d'alimentation C.C. ne doit comporter aucune autre prise de terre.</div>
                                              <div>La source d'alimentation du circuit C.C. doit être située dans la même pièce que le matériel.</div>
                                              <div>Il ne doit y avoir aucun dispositif de commutation ou de sectionnement entre le point de raccordement au conducteur de la source.</div>
                                            </div>
                                          </div>
                                        </div>

                                      </div>
                                    </div>
                                    {/* ── LAYER B & C: UNIFIED HIGH-DEFINITION FIBER MANAGEMENT TROUGH (EXACT GAMBAR 1 DARI STO ASLI) ── */}
                                    <div className="h-[48px] bg-gradient-to-b from-[#CBD5E1] via-[#E2E8F0] to-[#94A3B8] flex items-stretch justify-between relative shadow-inner overflow-hidden">
                                      
                                      {/* ── LEFT SECTION: FOLDED STEEL SHELF + CONTINUOUS HD BLACK SPOOL POD (SLOTS 1 TO 6 - EXACT HARDWARE TWIN) ── */}
                                      <div className="w-[37.5%] flex flex-col justify-between shrink-0 relative">
                                        {/* Upper Folded Steel Overhang Shelf with Fastener Rivets */}
                                        <div className="h-[6px] bg-gradient-to-b from-[#64748B] via-[#475569] to-[#334155] border-b border-[#1E293B] shadow-xs flex items-center justify-between px-2">
                                          <div className="w-[3.5px] h-[3.5px] rounded-full bg-gradient-to-br from-white via-slate-300 to-slate-500 border border-slate-700 shadow-xs flex items-center justify-center font-mono text-[2.5px] text-slate-900 leading-none">+</div>
                                          <div className="h-[1.5px] w-full bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 rounded-full mx-1 opacity-70" />
                                          <div className="w-[3.5px] h-[3.5px] rounded-full bg-gradient-to-br from-white via-slate-300 to-slate-500 border border-slate-700 shadow-xs flex items-center justify-center font-mono text-[2.5px] text-slate-900 leading-none">+</div>
                                        </div>

                                        {/* Molded Black Spool Pod with 45-degree Chamfered Top-Left Corner (Exact Gambar STO) */}
                                        <div
                                          className="flex-1 bg-[#06090F] border border-slate-800 shadow-2xl relative overflow-hidden"
                                          style={{
                                            clipPath: "polygon(10px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 10px)",
                                          }}
                                        >
                                          <svg viewBox="0 0 204 42" className="w-full h-full block" preserveAspectRatio="none">
                                            <defs>
                                              <radialGradient id="spool-drum-grad-l" cx="50%" cy="50%" r="50%">
                                                <stop offset="0%" stopColor="#1E293B" />
                                                <stop offset="65%" stopColor="#0F172A" />
                                                <stop offset="100%" stopColor="#020617" />
                                              </radialGradient>
                                              <linearGradient id="horn-main-grad-l" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#64748B" />
                                                <stop offset="25%" stopColor="#334155" />
                                                <stop offset="75%" stopColor="#0F172A" />
                                                <stop offset="100%" stopColor="#020617" />
                                              </linearGradient>
                                              <linearGradient id="cross-arm-grad-l" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#475569" />
                                                <stop offset="40%" stopColor="#1E293B" />
                                                <stop offset="100%" stopColor="#090D16" />
                                              </linearGradient>
                                              <linearGradient id="bottom-runner-grad-l" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#475569" />
                                                <stop offset="50%" stopColor="#1E293B" />
                                                <stop offset="100%" stopColor="#090D16" />
                                              </linearGradient>
                                              <radialGradient id="screw-dome-grad-l" cx="35%" cy="32%" r="60%">
                                                <stop offset="0%" stopColor="#FFFFFF" />
                                                <stop offset="30%" stopColor="#E2E8F0" />
                                                <stop offset="70%" stopColor="#94A3B8" />
                                                <stop offset="90%" stopColor="#475569" />
                                                <stop offset="100%" stopColor="#1E293B" />
                                              </radialGradient>
                                              <linearGradient id="screw-socket-grad-l" x1="20%" y1="0%" x2="80%" y2="100%">
                                                <stop offset="0%" stopColor="#1E293B" />
                                                <stop offset="100%" stopColor="#020617" />
                                              </linearGradient>
                                            </defs>

                                            {/* 6 High-Definition Continuous Spool Mandrels (Slots 1 to 6) */}
                                            {[...Array(6)].map((_, i) => {
                                              const cx = 17 + i * 34;
                                              const cy = 22;
                                              return (
                                                <g key={`spool-unit-l-${i}`}>
                                                  <title>{`Optical Fiber Mandrel ${i + 1}`}</title>
                                                  {/* 1. Cylindrical Drum Spool Base */}
                                                  <circle cx={cx} cy={cy} r="14.5" fill="url(#spool-drum-grad-l)" stroke="#111827" strokeWidth="1.0" />
                                                  <circle cx={cx} cy={cy} r="11.5" stroke="#1E293B" strokeWidth="0.8" strokeDasharray="2 1.5" fill="none" opacity="0.7" />
                                                  <path d={`M ${cx - 12},${cy + 2} A 12 12 0 0 0 ${cx + 12},${cy + 2}`} stroke="#050811" strokeWidth="1.5" fill="none" opacity="0.8" />

                                                  {/* 2. Continuous Bottom Fiber Guide Runner */}
                                                  <path d={`M ${cx - 16},${cy + 7} Q ${cx - 4},${cy + 15} ${cx + 7},${cy + 11} Q ${cx + 13},${cy + 8} ${cx + 18},${cy + 6}`} stroke="#0F172A" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                                                  <path d={`M ${cx - 16},${cy + 7} Q ${cx - 4},${cy + 15} ${cx + 7},${cy + 11} Q ${cx + 13},${cy + 8} ${cx + 18},${cy + 6}`} stroke="url(#bottom-runner-grad-l)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                                                  <path d={`M ${cx - 14},${cy + 6.5} Q ${cx - 4},${cy + 14} ${cx + 6},${cy + 10.5}`} stroke="#94A3B8" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.85" />

                                                  {/* Bottom slot cable prongs */}
                                                  <rect x={cx - 3.8} y="35" width="2.4" height="6" rx="0.8" fill="#1E293B" stroke="#0A0F1D" strokeWidth="0.5" />
                                                  <rect x={cx + 1.4} y="35" width="2.4" height="6" rx="0.8" fill="#1E293B" stroke="#0A0F1D" strokeWidth="0.5" />
                                                  <line x1={cx - 2.8} y1="36" x2={cx - 2.8} y2="40" stroke="#64748B" strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />
                                                  <line x1={cx + 2.4} y1="36" x2={cx + 2.4} y2="40" stroke="#64748B" strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />

                                                  {/* 3. Secondary Cross Arm (+36deg) */}
                                                  <g transform={`rotate(36 ${cx} ${cy})`}>
                                                    <rect x={cx - 2.8} y={cy - 9.5} width="5.6" height="19" rx="2.8" fill="#000000" opacity="0.85" />
                                                    <rect x={cx - 2.2} y={cy - 9} width="4.4" height="18" rx="2.2" fill="url(#cross-arm-grad-l)" stroke="#090D16" strokeWidth="0.6" />
                                                    <line x1={cx - 0.8} y1={cy - 7.5} x2={cx - 0.8} y2={cy + 7.5} stroke="#CBD5E1" strokeWidth="0.7" strokeLinecap="round" opacity="0.8" />
                                                    <ellipse cx={cx} cy={cy - 7.5} rx="1.6" ry="1.2" fill="#475569" />
                                                    <ellipse cx={cx} cy={cy + 7.5} rx="1.6" ry="1.2" fill="#1E293B" />
                                                  </g>

                                                  {/* 4. Primary Diagonal Horn Bar (-60deg) */}
                                                  <g transform={`rotate(-60 ${cx} ${cy})`}>
                                                    <rect x={cx - 4.0} y={cy - 14.2} width="8.0" height="28.4" rx="4.0" fill="#000000" opacity="0.9" />
                                                    <rect x={cx - 3.3} y={cy - 13.5} width="6.6" height="27" rx="3.3" fill="url(#horn-main-grad-l)" stroke="#050811" strokeWidth="0.8" />
                                                    {/* Bright tubular specular highlight */}
                                                    <line x1={cx - 1.2} y1={cy - 11.5} x2={cx - 1.2} y2={cy + 11.5} stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.95" />
                                                    <line x1={cx - 2.2} y1={cy - 10} x2={cx - 2.2} y2={cy + 10} stroke="#94A3B8" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />
                                                    {/* Upper bulb cap highlight */}
                                                    <ellipse cx={cx - 0.6} cy={cy - 11} rx="2.2" ry="1.7" fill="#FFFFFF" opacity="0.9" />
                                                    <ellipse cx={cx} cy={cy + 11.5} rx="2.2" ry="1.6" fill="#0A0F1D" opacity="0.8" />
                                                  </g>

                                                  {/* 5. Central Hub Boss & Chrome Pin */}
                                                  <circle cx={cx} cy={cy} r="4.2" fill="#0B101B" stroke="#334155" strokeWidth="0.8" />
                                                  <circle cx={cx} cy={cy} r="3.0" fill="#1E293B" stroke="#050811" strokeWidth="0.5" />
                                                  <circle cx={cx} cy={cy} r="1.8" fill="url(#screw-dome-grad-l)" stroke="#090D16" strokeWidth="0.4" />
                                                  <circle cx={cx - 0.6} cy={cy - 0.6} r="0.7" fill="#FFFFFF" opacity="0.95" />
                                                </g>
                                              );
                                            })}

                                            {/* 7 Metallic Dome Machine Screws along Top Rail */}
                                            {[13, 47, 81, 115, 149, 183, 197].map((sx, idx) => {
                                              const sy = 6.5;
                                              return (
                                                <g key={`screw-l-${idx}`}>
                                                  <ellipse cx={sx} cy={sy + 0.8} rx="3.6" ry="2.2" fill="#000000" opacity="0.85" />
                                                  <circle cx={sx} cy={sy} r="3.2" fill="url(#screw-dome-grad-l)" stroke="#1E293B" strokeWidth="0.5" />
                                                  <circle cx={sx} cy={sy} r="1.6" fill="url(#screw-socket-grad-l)" stroke="#020617" strokeWidth="0.4" />
                                                  <circle cx={sx} cy={sy} r="0.7" fill="#94A3B8" />
                                                  <ellipse cx={sx - 1.0} cy={sy - 1.0} rx="1.1" ry="0.8" fill="#FFFFFF" opacity="0.95" />
                                                </g>
                                              );
                                            })}
                                          </svg>
                                        </div>
                                      </div>

                                      {/* ── CENTER SECTION: SWEEPING CURVED SHEET METAL FLANGES & BARCODE BAY (SLOTS 7 TO 10 - EXACT GAMBAR 4) ── */}
                                      <div className="flex-1 flex items-stretch justify-between relative mx-0.5">
                                        
                                        {/* Left Waterfall Curved Sheet Metal Entry Wing (Exact Gambar 4) */}
                                        <div className="w-[18px] h-full relative shrink-0">
                                          <svg viewBox="0 0 18 48" className="w-full h-full" fill="none" preserveAspectRatio="none">
                                            <defs>
                                              <linearGradient id="metal-waterfall-l" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#F8FAFC" />
                                                <stop offset="35%" stopColor="#CBD5E1" />
                                                <stop offset="80%" stopColor="#64748B" />
                                                <stop offset="100%" stopColor="#334155" />
                                              </linearGradient>
                                            </defs>
                                            {/* Sweeping Quarter-Circle Curved Steel Flange */}
                                            <path d="M 0,0 L 4,0 Q 17,0 17,48 L 0,48 Z" fill="url(#metal-waterfall-l)" />
                                            {/* Bright Outer Edge Specular Highlight */}
                                            <path d="M 4,0 Q 17,0 17,48" stroke="#FFFFFF" strokeWidth="2.0" strokeLinecap="round" />
                                            <path d="M 5,0 Q 18,0 18,48" stroke="#475569" strokeWidth="1.0" strokeLinecap="round" />
                                          </svg>
                                        </div>

                                        {/* Center Recessed Steel Trough Wall & Authentic Nameplate Label (Exact Gambar 4) */}
                                        <div className="flex-1 h-full bg-gradient-to-b from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8] border-x border-slate-500 shadow-inner flex flex-col items-center justify-between py-1 px-2 relative">
                                          {/* Two-Part Authentic Nokia Nameplate Label */}
                                          <div className="bg-white border border-slate-700 rounded-[1px] p-[1.5px] shadow-md flex flex-col items-center gap-[1px] z-10 w-full max-w-[110px]">
                                            {/* Top Label: Warning Triangle, Part Number & Barcode */}
                                            <div className="flex items-center justify-between w-full px-1 py-[0.5px] border-b border-slate-300">
                                              <div className="flex items-center gap-1">
                                                <svg viewBox="0 0 20 18" className="w-[5px] h-[4.5px] shrink-0" fill="none">
                                                  <polygon points="10,1.5 19,16.5 1,16.5" fill="#000" />
                                                  <polygon points="10,3.8 17.2,15.5 2.8,15.5" fill="#FACC15" />
                                                  <line x1="10" y1="7" x2="10" y2="11" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
                                                  <circle cx="10" cy="13.5" r="1.0" fill="#000" />
                                                </svg>
                                                <span className="font-mono text-[4.5px] font-black text-black tracking-wider leading-none">3HE08222AA</span>
                                              </div>
                                              <span className="font-mono text-[4px] font-bold text-slate-700 leading-none">CE</span>
                                            </div>
                                            {/* 1D Linear Barcode Graphic */}
                                            <div className="flex gap-[0.6px] items-center h-[3.5px] w-full px-1 my-[0.5px]">
                                              {[...Array(24)].map((_, i) => (
                                                <div key={i} className={`h-full ${i % 4 === 0 ? "w-[1.2px] bg-black" : i % 2 === 0 ? "w-[0.8px] bg-black" : "w-[0.4px] bg-slate-800"}`} />
                                              ))}
                                            </div>
                                            {/* Bottom Label: QR Code Matrix & CLEI Serial */}
                                            <div className="flex items-center justify-between w-full px-1 pt-[0.5px] border-t border-slate-300">
                                              {/* 2D DataMatrix / QR Code */}
                                              <div className="w-[7.5px] h-[7.5px] bg-black p-[0.6px] grid grid-cols-3 gap-[0.5px] shrink-0">
                                                <div className="bg-white" /><div className="bg-black" /><div className="bg-white" />
                                                <div className="bg-black" /><div className="bg-white" /><div className="bg-black" />
                                                <div className="bg-white" /><div className="bg-black" /><div className="bg-white" />
                                              </div>
                                              <span className="font-mono text-[3.8px] font-bold text-slate-800 tracking-wider">CLEI: IPUCAN0RAA</span>
                                            </div>
                                          </div>

                                          {/* Recessed Cable Transit Floor with Center Guide Rail */}
                                          <div className="w-full flex items-center justify-center gap-2 mt-0.5">
                                            <div className="w-2 h-1.5 rounded-full bg-slate-400 border border-slate-600 shadow-inner" />
                                            <div className="flex-1 h-[2px] bg-slate-400/80 rounded-full" />
                                            <div className="w-2 h-1.5 rounded-full bg-slate-400 border border-slate-600 shadow-inner" />
                                          </div>
                                        </div>

                                        {/* Right Waterfall Curved Sheet Metal Entry Wing (Exact Gambar 4) */}
                                        <div className="w-[18px] h-full relative shrink-0">
                                          <svg viewBox="0 0 18 48" className="w-full h-full" fill="none" preserveAspectRatio="none">
                                            <defs>
                                              <linearGradient id="metal-waterfall-r" x1="100%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#F8FAFC" />
                                                <stop offset="35%" stopColor="#CBD5E1" />
                                                <stop offset="80%" stopColor="#64748B" />
                                                <stop offset="100%" stopColor="#334155" />
                                              </linearGradient>
                                            </defs>
                                            {/* Sweeping Quarter-Circle Curved Steel Flange */}
                                            <path d="M 18,0 L 14,0 Q 1,0 1,48 L 18,48 Z" fill="url(#metal-waterfall-r)" />
                                            {/* Bright Outer Edge Specular Highlight */}
                                            <path d="M 14,0 Q 1,0 1,48" stroke="#FFFFFF" strokeWidth="2.0" strokeLinecap="round" />
                                            <path d="M 13,0 Q 0,0 0,48" stroke="#475569" strokeWidth="1.0" strokeLinecap="round" />
                                          </svg>
                                        </div>

                                      </div>

                                      {/* ── RIGHT SECTION: FOLDED STEEL SHELF + CONTINUOUS HD BLACK SPOOL POD (SLOTS 11 TO 16 - EXACT HARDWARE TWIN) ── */}
                                      <div className="w-[37.5%] flex flex-col justify-between shrink-0 relative">
                                        {/* Upper Folded Steel Overhang Shelf with Fastener Rivets */}
                                        <div className="h-[6px] bg-gradient-to-b from-[#64748B] via-[#475569] to-[#334155] border-b border-[#1E293B] shadow-xs flex items-center justify-between px-2">
                                          <div className="w-[3.5px] h-[3.5px] rounded-full bg-gradient-to-br from-white via-slate-300 to-slate-500 border border-slate-700 shadow-xs flex items-center justify-center font-mono text-[2.5px] text-slate-900 leading-none">+</div>
                                          <div className="h-[1.5px] w-full bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 rounded-full mx-1 opacity-70" />
                                          <div className="w-[3.5px] h-[3.5px] rounded-full bg-gradient-to-br from-white via-slate-300 to-slate-500 border border-slate-700 shadow-xs flex items-center justify-center font-mono text-[2.5px] text-slate-900 leading-none">+</div>
                                        </div>

                                        {/* Molded Black Spool Pod with 45-degree Chamfered Top-Right Corner (Exact Gambar STO) */}
                                        <div
                                          className="flex-1 bg-[#06090F] border border-slate-800 shadow-2xl relative overflow-hidden"
                                          style={{
                                            clipPath: "polygon(0% 0%, calc(100% - 10px) 0%, 100% 10px, 100% 100%, 0% 100%)",
                                          }}
                                        >
                                          <svg viewBox="0 0 204 42" className="w-full h-full block" preserveAspectRatio="none">
                                            <defs>
                                              <radialGradient id="spool-drum-grad-r" cx="50%" cy="50%" r="50%">
                                                <stop offset="0%" stopColor="#1E293B" />
                                                <stop offset="65%" stopColor="#0F172A" />
                                                <stop offset="100%" stopColor="#020617" />
                                              </radialGradient>
                                              <linearGradient id="horn-main-grad-r" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#64748B" />
                                                <stop offset="25%" stopColor="#334155" />
                                                <stop offset="75%" stopColor="#0F172A" />
                                                <stop offset="100%" stopColor="#020617" />
                                              </linearGradient>
                                              <linearGradient id="cross-arm-grad-r" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#475569" />
                                                <stop offset="40%" stopColor="#1E293B" />
                                                <stop offset="100%" stopColor="#090D16" />
                                              </linearGradient>
                                              <linearGradient id="bottom-runner-grad-r" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#475569" />
                                                <stop offset="50%" stopColor="#1E293B" />
                                                <stop offset="100%" stopColor="#090D16" />
                                              </linearGradient>
                                              <radialGradient id="screw-dome-grad-r" cx="35%" cy="32%" r="60%">
                                                <stop offset="0%" stopColor="#FFFFFF" />
                                                <stop offset="30%" stopColor="#E2E8F0" />
                                                <stop offset="70%" stopColor="#94A3B8" />
                                                <stop offset="90%" stopColor="#475569" />
                                                <stop offset="100%" stopColor="#1E293B" />
                                              </radialGradient>
                                              <linearGradient id="screw-socket-grad-r" x1="20%" y1="0%" x2="80%" y2="100%">
                                                <stop offset="0%" stopColor="#1E293B" />
                                                <stop offset="100%" stopColor="#020617" />
                                              </linearGradient>
                                            </defs>

                                            {/* 6 High-Definition Continuous Spool Mandrels (Slots 11 to 16) */}
                                            {[...Array(6)].map((_, i) => {
                                              const cx = 17 + i * 34;
                                              const cy = 22;
                                              return (
                                                <g key={`spool-unit-r-${i}`}>
                                                  <title>{`Optical Fiber Mandrel ${i + 11}`}</title>
                                                  {/* 1. Cylindrical Drum Spool Base */}
                                                  <circle cx={cx} cy={cy} r="14.5" fill="url(#spool-drum-grad-r)" stroke="#111827" strokeWidth="1.0" />
                                                  <circle cx={cx} cy={cy} r="11.5" stroke="#1E293B" strokeWidth="0.8" strokeDasharray="2 1.5" fill="none" opacity="0.7" />
                                                  <path d={`M ${cx - 12},${cy + 2} A 12 12 0 0 0 ${cx + 12},${cy + 2}`} stroke="#050811" strokeWidth="1.5" fill="none" opacity="0.8" />

                                                  {/* 2. Continuous Bottom Fiber Guide Runner */}
                                                  <path d={`M ${cx - 16},${cy + 7} Q ${cx - 4},${cy + 15} ${cx + 7},${cy + 11} Q ${cx + 13},${cy + 8} ${cx + 18},${cy + 6}`} stroke="#0F172A" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                                                  <path d={`M ${cx - 16},${cy + 7} Q ${cx - 4},${cy + 15} ${cx + 7},${cy + 11} Q ${cx + 13},${cy + 8} ${cx + 18},${cy + 6}`} stroke="url(#bottom-runner-grad-r)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                                                  <path d={`M ${cx - 14},${cy + 6.5} Q ${cx - 4},${cy + 14} ${cx + 6},${cy + 10.5}`} stroke="#94A3B8" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.85" />

                                                  {/* Bottom slot cable prongs */}
                                                  <rect x={cx - 3.8} y="35" width="2.4" height="6" rx="0.8" fill="#1E293B" stroke="#0A0F1D" strokeWidth="0.5" />
                                                  <rect x={cx + 1.4} y="35" width="2.4" height="6" rx="0.8" fill="#1E293B" stroke="#0A0F1D" strokeWidth="0.5" />
                                                  <line x1={cx - 2.8} y1="36" x2={cx - 2.8} y2="40" stroke="#64748B" strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />
                                                  <line x1={cx + 2.4} y1="36" x2={cx + 2.4} y2="40" stroke="#64748B" strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />

                                                  {/* 3. Secondary Cross Arm (+36deg) */}
                                                  <g transform={`rotate(36 ${cx} ${cy})`}>
                                                    <rect x={cx - 2.8} y={cy - 9.5} width="5.6" height="19" rx="2.8" fill="#000000" opacity="0.85" />
                                                    <rect x={cx - 2.2} y={cy - 9} width="4.4" height="18" rx="2.2" fill="url(#cross-arm-grad-r)" stroke="#090D16" strokeWidth="0.6" />
                                                    <line x1={cx - 0.8} y1={cy - 7.5} x2={cx - 0.8} y2={cy + 7.5} stroke="#CBD5E1" strokeWidth="0.7" strokeLinecap="round" opacity="0.8" />
                                                    <ellipse cx={cx} cy={cy - 7.5} rx="1.6" ry="1.2" fill="#475569" />
                                                    <ellipse cx={cx} cy={cy + 7.5} rx="1.6" ry="1.2" fill="#1E293B" />
                                                  </g>

                                                  {/* 4. Primary Diagonal Horn Bar (-60deg) */}
                                                  <g transform={`rotate(-60 ${cx} ${cy})`}>
                                                    <rect x={cx - 4.0} y={cy - 14.2} width="8.0" height="28.4" rx="4.0" fill="#000000" opacity="0.9" />
                                                    <rect x={cx - 3.3} y={cy - 13.5} width="6.6" height="27" rx="3.3" fill="url(#horn-main-grad-r)" stroke="#050811" strokeWidth="0.8" />
                                                    {/* Bright tubular specular highlight */}
                                                    <line x1={cx - 1.2} y1={cy - 11.5} x2={cx - 1.2} y2={cy + 11.5} stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.95" />
                                                    <line x1={cx - 2.2} y1={cy - 10} x2={cx - 2.2} y2={cy + 10} stroke="#94A3B8" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />
                                                    {/* Upper bulb cap highlight */}
                                                    <ellipse cx={cx - 0.6} cy={cy - 11} rx="2.2" ry="1.7" fill="#FFFFFF" opacity="0.9" />
                                                    <ellipse cx={cx} cy={cy + 11.5} rx="2.2" ry="1.6" fill="#0A0F1D" opacity="0.8" />
                                                  </g>

                                                  {/* 5. Central Hub Boss & Chrome Pin */}
                                                  <circle cx={cx} cy={cy} r="4.2" fill="#0B101B" stroke="#334155" strokeWidth="0.8" />
                                                  <circle cx={cx} cy={cy} r="3.0" fill="#1E293B" stroke="#050811" strokeWidth="0.5" />
                                                  <circle cx={cx} cy={cy} r="1.8" fill="url(#screw-dome-grad-r)" stroke="#090D16" strokeWidth="0.4" />
                                                  <circle cx={cx - 0.6} cy={cy - 0.6} r="0.7" fill="#FFFFFF" opacity="0.95" />
                                                </g>
                                              );
                                            })}

                                            {/* 7 Metallic Dome Machine Screws along Top Rail */}
                                            {[7, 21, 55, 89, 123, 157, 191].map((sx, idx) => {
                                              const sy = 6.5;
                                              return (
                                                <g key={`screw-r-${idx}`}>
                                                  <ellipse cx={sx} cy={sy + 0.8} rx="3.6" ry="2.2" fill="#000000" opacity="0.85" />
                                                  <circle cx={sx} cy={sy} r="3.2" fill="url(#screw-dome-grad-r)" stroke="#1E293B" strokeWidth="0.5" />
                                                  <circle cx={sx} cy={sy} r="1.6" fill="url(#screw-socket-grad-r)" stroke="#020617" strokeWidth="0.4" />
                                                  <circle cx={sx} cy={sy} r="0.7" fill="#94A3B8" />
                                                  <ellipse cx={sx - 1.0} cy={sy - 1.0} rx="1.1" ry="0.8" fill="#FFFFFF" opacity="0.95" />
                                                </g>
                                              );
                                            })}
                                          </svg>
                                        </div>
                                      </div>

                                    </div>

                                  </div>
                                );
                              })()}
                            </div>

                            {/* Steel Divider Bar Between Header & Grid */}
                            <div className="h-1 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 border-t border-b border-slate-400 my-0.5 shadow-xs" />

                            {/* ── 16-COLUMNS UNIFIED SUBRACK CHASSIS GRID (SECARA NATIVE TERKONEKSI DATABASE) ── */}
                            <div className="flex-1 bg-[#CBD5E1] p-0.5 overflow-hidden my-0.5 shadow-inner border border-[#94A3B8]">
                              <div
                                className="w-full h-full grid"
                                style={{
                                  gridTemplateColumns: "repeat(16, minmax(0, 1fr))",
                                  gridTemplateRows: "1fr 12px 1fr",
                                  gap: "0",
                                }}
                              >
                                {/* ROW 1: TOP TIER (SLOTS 1 TO 6) */}
                                {[1, 2, 3, 4, 5, 6].map((slotNum, idx) =>
                                  render3DChassisSlot(slotNum, idx + 1, 1)
                                )}

                                {/* ROW 2: LEFT MIDPLANE DIVIDER (SPAN COLS 1 TO 6) */}
                                <div
                                  style={{ gridColumn: "1 / span 6", gridRow: 2 }}
                                  className="h-2.5 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 border-y border-slate-500 flex items-center justify-between px-1.5 my-0.5 rounded-[1px] shadow-xs"
                                >
                                  <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                  <span className="text-[5.5px] text-slate-900 font-mono tracking-widest uppercase truncate font-black">
                                    PSS-24 MIDPLANE
                                  </span>
                                  <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                </div>

                                {/* ROW 3: BOTTOM TIER (SLOTS 17 TO 22) */}
                                {[17, 18, 19, 20, 21, 22].map((slotNum, idx) =>
                                  render3DChassisSlot(slotNum, idx + 1, 3)
                                )}

                                {/* CENTER SWITCH FABRIC (SLOTS 7, 8, 9: SPANS ROWS 1 TO 3 FULL CONTINUOUS HEIGHT) */}
                                {[7, 8, 9].map((slotNum, idx) =>
                                  render3DChassisFabricSlot(slotNum, idx + 7)
                                )}

                                {/* ROW 1: TOP TIER (SLOTS 10 TO 16) */}
                                {[10, 11, 12, 13, 14, 15, 16].map((slotNum, idx) =>
                                  render3DChassisSlot(slotNum, idx + 10, 1)
                                )}

                                {/* ROW 2: RIGHT MIDPLANE DIVIDER (SPAN COLS 10 TO 16) */}
                                <div
                                  style={{ gridColumn: "10 / span 7", gridRow: 2 }}
                                  className="h-2.5 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 border-y border-slate-500 flex items-center justify-between px-1.5 my-0.5 rounded-[1px] shadow-xs"
                                >
                                  <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                  <span className="text-[5.5px] text-slate-900 font-mono tracking-widest uppercase truncate font-black">
                                    PSS-24 MIDPLANE
                                  </span>
                                  <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                </div>

                                {/* ROW 3: BOTTOM TIER (SLOTS 23 TO 29) */}
                                {[23, 24, 25, 26, 27, 28, 29].map((slotNum, idx) =>
                                  render3DChassisSlot(slotNum, idx + 10, 3)
                                )}
                              </div>
                            </div>

                            {/* ── BOTTOM KICKPLATE: OTENTIK SESUAI GAMBAR 1 & 2 (LEBAR SEJAJAR CARD JUDUL NOKIA & SUBRACK GRID, BAUT 3D METALLIC) ── */}
                            <div
                              id="chassis-bottom-kickplate"
                              className="absolute select-none shrink-0 bg-[#090E1B] rounded-none border-t border-[#1E293B] overflow-hidden"
                              style={{
                                bottom: "0px",
                                left: "-2px",
                                width: "540px",
                                height: "34px",
                                borderRadius: "0px",
                                margin: "0px",
                                boxSizing: "border-box",
                                zIndex: 20,
                              }}
                            >
                              {/* 3D Bevel Top Edge Highlight */}
                              <div className="absolute top-0 left-0 right-0 h-[0.8px] bg-gradient-to-r from-transparent via-slate-300/40 to-transparent pointer-events-none" />

                              {/* SVG Gradient Definitions for 3D Screw Fasteners (Otentik Persis Foto Referensi User) */}
                              <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
                                <defs>
                                  <radialGradient id="kickplateScrewOuter" cx="40%" cy="38%" r="52%">
                                    <stop offset="0%" stopColor="#F1F5F9" />
                                    <stop offset="35%" stopColor="#CBD5E1" />
                                    <stop offset="65%" stopColor="#94A3B8" />
                                    <stop offset="85%" stopColor="#64748B" />
                                    <stop offset="100%" stopColor="#475569" />
                                  </radialGradient>
                                  <linearGradient id="kickplateScrewSocket" x1="20%" y1="0%" x2="80%" y2="100%">
                                    <stop offset="0%" stopColor="#64748B" />
                                    <stop offset="30%" stopColor="#334155" />
                                    <stop offset="80%" stopColor="#0F172A" />
                                    <stop offset="100%" stopColor="#020617" />
                                  </linearGradient>
                                  <radialGradient id="kickplateScrewCore" cx="38%" cy="32%" r="58%">
                                    <stop offset="0%" stopColor="#FFFFFF" />
                                    <stop offset="30%" stopColor="#E2E8F0" />
                                    <stop offset="60%" stopColor="#94A3B8" />
                                    <stop offset="100%" stopColor="#334155" />
                                  </radialGradient>
                                </defs>
                              </svg>

                              {/* Bar Hitam Ventilasi Atas (Tinggi 7px) */}
                              <div className="w-full h-[7px] bg-[#03060E] border-b border-black flex items-center justify-between px-3.5">
                                {/* Left 5 Tabs (w-[110px]) */}
                                <div className="w-[110px] flex items-center justify-between">
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={`tab-l-${i}`} style={{ width: "8.5px", height: "3.5px" }} className="rounded-[0.8px] bg-[#111A27] border border-[#1E2B3E] shadow-inner" />
                                  ))}
                                </div>

                                {/* Central Air Slit */}
                                <div className="flex items-center justify-center">
                                  <div style={{ width: "50px", height: "1.8px" }} className="rounded-full bg-[#131E2C] border border-[#223348] shadow-inner" />
                                </div>

                                {/* Right 5 Tabs (w-[110px]) */}
                                <div className="w-[110px] flex items-center justify-between">
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={`tab-r-${i}`} style={{ width: "8.5px", height: "3.5px" }} className="rounded-[0.8px] bg-[#111A27] border border-[#1E2B3E] shadow-inner" />
                                  ))}
                                </div>
                              </div>

                              {/* Bar Utama Charcoal Metallic Kickplate (Tinggi 25px) */}
                              <div className="relative w-full h-[25px] bg-gradient-to-b from-[#202936] via-[#131822] to-[#0A0D14] flex items-center justify-between px-3.5">
                                {/* SISI KIRI: 6 BAUT STUD PERAK 3D (Rapat Kompak w=[110px], Sesuai Presisi Foto Referensi User) */}
                                <div className="w-[110px] flex items-center justify-between shrink-0">
                                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                                    <svg
                                      key={`stud-l-${idx}`}
                                      viewBox="0 0 51 57"
                                      style={{ width: "16px", height: "18px" }}
                                      className="shrink-0 select-none block overflow-visible pointer-events-none"
                                      title={`3D Fastener Stud #${idx}`}
                                    >
                                      {/* Outer Beveled Metallic Disc / Collar */}
                                      <circle cx="25" cy="22" r="11" fill="url(#kickplateScrewOuter)" />
                                      {/* Recessed Inner Socket Cup */}
                                      <ellipse cx="25.2" cy="22" rx="5" ry="5.4" fill="url(#kickplateScrewSocket)" />
                                      {/* Raised Center Button / Dome Core */}
                                      <ellipse cx="25" cy="21.5" rx="3.3" ry="3.6" fill="url(#kickplateScrewCore)" />
                                      {/* Specular Highlight Glint */}
                                      <ellipse cx="24.2" cy="20.3" rx="1.1" ry="1.0" fill="#FFFFFF" opacity="0.9" />
                                      {/* Dark Pilot Pinhole di Bawah Baut */}
                                      <ellipse cx="25.5" cy="41" rx="1.8" ry="2.2" fill="#0A0F1D" opacity="0.85" />
                                      <ellipse cx="25.5" cy="41" rx="1.0" ry="1.3" fill="#020408" />
                                    </svg>
                                  ))}
                                </div>

                                {/* AREA TENGAH: DUAL BLUE DOTS & STIKER KUNING */}
                                <div className="flex items-center justify-center gap-1.5 px-2">
                                  {/* Dual Vertical Cyan/Blue ESD Grounding Banana Jacks (:) */}
                                  <div className="flex flex-col items-center gap-[2px] shrink-0" title="ESD Grounding Jacks">
                                    <div style={{ width: "3.5px", height: "3.5px" }} className="rounded-full bg-[#0284C7] border border-[#38BDF8] flex items-center justify-center">
                                      <div style={{ width: "1px", height: "1px" }} className="rounded-full bg-black" />
                                    </div>
                                    <div style={{ width: "3.5px", height: "3.5px" }} className="rounded-full bg-[#0284C7] border border-[#38BDF8] flex items-center justify-center">
                                      <div style={{ width: "1px", height: "1px" }} className="rounded-full bg-black" />
                                    </div>
                                  </div>

                                  {/* Stiker Kuning ATTENTION ESD BONDING POINT */}
                                  <div
                                    style={{ width: "55px", height: "16px" }}
                                    className="bg-[#F59E0B] border border-black rounded-[1px] flex items-center px-1 gap-1 select-none shrink-0"
                                  >
                                    <svg viewBox="0 0 24 24" style={{ width: "10px", height: "10px" }} className="shrink-0 text-black fill-current">
                                      <path d="M12 2L1 21h22L12 2zm0 3.8l8.5 14.2H3.5L12 5.8zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
                                    </svg>
                                    <div className="flex flex-col text-black font-sans leading-none justify-center">
                                      <span style={{ fontSize: "4.2px" }} className="font-black tracking-tight uppercase">ATTENTION</span>
                                      <span style={{ fontSize: "3.5px", marginTop: "0.5px" }} className="font-extrabold tracking-wide">ESD</span>
                                      <span style={{ fontSize: "2.9px", marginTop: "0.5px" }} className="font-bold tracking-tight">BONDING POINT</span>
                                    </div>
                                  </div>
                                </div>

                                {/* SISI KANAN: 6 BAUT STUD PERAK 3D (Rapat Kompak w=[110px], Sesuai Presisi Foto Referensi User) */}
                                <div className="w-[110px] flex items-center justify-between shrink-0">
                                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                                    <svg
                                      key={`stud-r-${idx}`}
                                      viewBox="0 0 51 57"
                                      style={{ width: "16px", height: "18px" }}
                                      className="shrink-0 select-none block overflow-visible pointer-events-none"
                                      title={`3D Fastener Stud #${idx + 6}`}
                                    >
                                      {/* Outer Beveled Metallic Disc / Collar */}
                                      <circle cx="25" cy="22" r="11" fill="url(#kickplateScrewOuter)" />
                                      {/* Recessed Inner Socket Cup */}
                                      <ellipse cx="25.2" cy="22" rx="5" ry="5.4" fill="url(#kickplateScrewSocket)" />
                                      {/* Raised Center Button / Dome Core */}
                                      <ellipse cx="25" cy="21.5" rx="3.3" ry="3.6" fill="url(#kickplateScrewCore)" />
                                      {/* Specular Highlight Glint */}
                                      <ellipse cx="24.2" cy="20.3" rx="1.1" ry="1.0" fill="#FFFFFF" opacity="0.9" />
                                      {/* Dark Pilot Pinhole di Bawah Baut */}
                                      <ellipse cx="25.5" cy="41" rx="1.8" ry="2.2" fill="#0A0F1D" opacity="0.85" />
                                      <ellipse cx="25.5" cy="41" rx="1.0" ry="1.3" fill="#020408" />
                                    </svg>
                                  ))}
                                </div>
                              </div>

                              {/* Bottom 3D Dark Metallic Lip (Tinggi 2px) */}
                              <div className="w-full h-[2px] bg-gradient-to-r from-[#03060E] via-[#1E293B] to-[#03060E] border-t border-slate-700/60" />
                            </div>
                          </div>

                          {/* 6 Cuping Flip-Lock Hitam Kiri & Kanan (Anak langsung kubus 3D + backfaceVisibility visible agar terlihat dari depan, samping, maupun belakang) */}
                          <SideCupingRail side="left" />
                          <SideCupingRail side="right" />
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Call-to-Action Baris: Aksi Pemasangan / Mutasi Cepat (Persis Desain Gambar 2 User: 8 Port Rapi, Compact, Height & Width Proporsional) */}
                {selectedSlotForAction && (() => {
                  const actionPortInfo = getSlotPortInfo(selectedSlotForAction);
                  return (
                    <div
                      id="selected-slot-action-card"
                      className={`mt-4 p-2.5 sm:p-3 mb-0 rounded-2xl border flex flex-col transition-all duration-300 shadow-xl w-full min-w-0 ${selectedSlotForAction.occupied
                        ? isDark
                          ? "bg-[#060D1A]/95 border-[#1E3A5F] text-slate-200 shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
                          : "bg-purple-50 border-purple-300 text-purple-900 shadow-purple-500/10"
                        : isDark
                          ? "bg-[#071F1B]/95 border-emerald-500/40 text-emerald-200 shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
                          : "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-emerald-500/10"
                        }`}
                    >
                      {/* Top Row: Info + Button (Persis Sesuai Mockup Gambar 2: 2 Baris Bersih & Sejajar) */}
                      <div className="flex items-center justify-between gap-2 w-full min-w-0">
                        {/* Sisi Kiri: Ikon Chip + Baris Informasi */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${selectedSlotForAction.occupied
                              ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                              : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                              }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {selectedSlotForAction.occupied ? "memory" : "add_box"}
                            </span>
                          </div>

                          <div className="flex flex-col justify-center min-w-0 flex-1">
                            {/* Baris 1: Slot # + Badge Status + Posisi + Port Capacity Badge (1 Baris Utuh Tanpa Terpotong Persis Gambar 2) */}
                            <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap min-w-0">
                              <span className={`shrink-0 ${isDark ? "text-white" : "text-slate-900"} font-extrabold text-[13px] sm:text-sm`}>
                                Slot #{selectedSlotForAction.nomor_slot}
                              </span>
                              <span
                                className={`shrink-0 text-[8.5px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shadow-2xs flex items-center gap-1 whitespace-nowrap ${selectedSlotForAction.occupied
                                    ? isDark
                                      ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                                      : "bg-rose-100 text-rose-800 border-rose-300 font-extrabold"
                                    : isDark
                                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40 font-bold"
                                      : "bg-emerald-600 text-white border-emerald-700 font-extrabold shadow-md"
                                  }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${selectedSlotForAction.occupied ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse" : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"}`} />
                                <span>{selectedSlotForAction.occupied ? "MODUL TERPASANG" : "SLOT KOSONG (READY)"}</span>
                              </span>
                              <span className={`shrink-0 text-[9px] sm:text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                {parseInt(String(selectedSlotForAction.nomor_slot).replace(/[^\d.]/g, ""), 10) <= 16
                                  ? "(Baris Atas)"
                                  : "(Baris Bawah)"}
                              </span>

                              {/* Port Capacity Badge (Tidak Terpotong) */}
                              {selectedSlotForAction.occupied && actionPortInfo.total > 0 && (
                                <span className={`shrink-0 text-[8.5px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 whitespace-nowrap ${isDark
                                    ? "bg-[#0C223D] border-[#1677FF]/40 text-[#38BDF8]"
                                    : "bg-blue-100 border-blue-300 text-blue-800 font-bold"
                                  }`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1677FF] shadow-[0_0_8px_rgba(22,119,255,0.9)] shrink-0"></span>
                                  <span>{actionPortInfo.total} Port ({actionPortInfo.used} SFP • {actionPortInfo.remaining} Kosong)</span>
                                </span>
                              )}
                            </div>

                            {/* Baris 2: Data SN, PN, Tipe, Kondisi (1 Baris Rapi Persis Gambar 2) */}
                            <div className={`text-[9.5px] sm:text-[10px] mt-0.5 flex items-center min-w-0 flex-nowrap whitespace-nowrap gap-x-1 ${isDark ? "text-slate-300" : "text-slate-700 font-medium"
                              }`}>
                              {selectedSlotForAction.occupied ? (
                                <>
                                  <span className="shrink-0">
                                    SN:{" "}
                                    <strong className={`font-mono ${isDark ? "text-amber-400" : "text-amber-700"} font-bold`}>
                                      {selectedSlotForAction.module?.serial_number || "-"}
                                    </strong>
                                  </span>
                                  {selectedSlotForAction.module?.unit_part_number && (
                                    <>
                                      <span className="shrink-0 text-slate-500 font-bold mx-0.5">•</span>
                                      <span className="shrink-0">
                                        PN: <strong className={`font-mono ${isDark ? "text-white" : "text-slate-900"} font-bold`}>{selectedSlotForAction.module.unit_part_number}</strong>
                                      </span>
                                    </>
                                  )}
                                  <span className="shrink-0 text-slate-500 font-bold mx-0.5">•</span>
                                  <span className="shrink-0">
                                    Tipe: <strong className={`${isDark ? "text-white" : "text-slate-900"} font-bold`}>{selectedSlotForAction.module?.tipe || "-"}</strong>
                                  </span>
                                  <span className="shrink-0 text-slate-500 font-bold mx-0.5">•</span>
                                  <span className="shrink-0">
                                    Kondisi: <strong className="text-emerald-400 font-bold uppercase">{selectedSlotForAction.module?.kondisi || "AKTIF"}</strong>
                                  </span>
                                </>
                              ) : (
                                <p className={`truncate whitespace-nowrap ${isDark ? "text-emerald-300" : "text-emerald-900 font-medium"}`}>
                                  ✨ Slot kosong, siap dialokasikan untuk penempatan modul baru di STO.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sisi Kanan: Tombol Mutasi / Lepas (Solid Royal Blue seperti Gambar 2) */}
                        <div className="flex items-center shrink-0 ml-2">
                          {!selectedSlotForAction.occupied ? (
                            <button
                              type="button"
                              onClick={() => handleNavigateToMutation(selectedSlotForAction, "pasang")}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1677FF] hover:bg-blue-600 active:scale-95 text-white shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px] shrink-0">add_task</span>
                              <span>Pasang di Slot Ini</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleNavigateToMutation(selectedSlotForAction, "pindah")}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1677FF] hover:bg-blue-600 active:scale-95 text-white shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px] shrink-0">swap_horiz</span>
                              <span>Mutasi / Lepas</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Garis Divider Pemisah Horizontal Persis Gambar Mockup */}
                      {selectedSlotForAction.occupied && actionPortInfo.total > 0 && (
                        <div className="border-t border-[#1E3A5F]/70 my-2 w-full" />
                      )}

                      {/* Baris 3: Rincian Port & Transceiver SFP (Mengikuti Persis Gambar 2) */}
                      {selectedSlotForAction.occupied && actionPortInfo.total > 0 && (
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1.5 flex-nowrap">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[11px] sm:text-xs font-bold tracking-wide ${isDark ? "text-white" : "text-slate-800"}`}>
                                Rincian Port &amp; Transceiver SFP:
                              </span>
                              <span className={`text-[10px] sm:text-[10.5px] ${isDark ? "text-slate-400" : "text-slate-600"} ml-1`}>
                                Kapasitas Fisik: <strong className={`font-mono font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{actionPortInfo.total} Port</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs shrink-0">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-semibold ${isDark ? "bg-[#0C223D] border border-[#1A4575] text-[#38BDF8]" : "bg-blue-100 border border-blue-200 text-blue-700"
                                }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1677FF] shrink-0"></span>
                                Terpakai: {actionPortInfo.used} SFP
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold ${isDark ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" : "bg-emerald-100 border border-emerald-200 text-emerald-700"
                                }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                Sisa: {actionPortInfo.remaining} Kosong
                              </span>
                            </div>
                          </div>

                          {/* Horizontal Scrollable Row Card Port & SFP (Persis Gambar 2: 8 Port Terlihat Sempurna, Compact, Rounded-lg, Tinggi Pas) */}
                          <div
                            ref={portScrollRef}
                            onScroll={updatePortScrollState}
                            className="flex items-stretch gap-1 overflow-x-auto pb-0.5 pt-0.5 custom-scrollbar w-full min-w-0"
                            style={{
                              scrollbarWidth: "none",
                              msOverflowStyle: "none",
                            }}
                          >
                            {actionPortInfo.ports.map((p, idx) => (
                              <div
                                key={idx}
                                style={{
                                  width: "calc((100% - 7 * 4px) / 8)",
                                  minWidth: 0,
                                  flexShrink: 0,
                                }}
                                className={`rounded-lg px-1.5 py-1.5 border transition-all text-left flex flex-col justify-between shadow-2xs h-[82px] min-h-[82px] max-h-[85px] box-border overflow-hidden ${p.isEmpty
                                    ? isDark
                                      ? "bg-[#071322]/70 border-dashed border-slate-700/80 hover:border-slate-500 text-slate-400"
                                      : "bg-white/90 border-dashed border-slate-400 hover:border-slate-500 text-slate-600 shadow-2xs"
                                    : isDark
                                      ? "bg-[#081526]/90 border border-cyan-500/35 hover:border-cyan-400/60 text-[#E2E8F0]"
                                      : "bg-white border border-blue-400/80 text-slate-800 hover:border-blue-500 shadow-2xs"
                                  }`}
                              >
                                {/* Port Card Header: PORT X & Aktif/Kosong Badge (Keterangan Terkunci Aman di Dalam Border Penuh) */}
                                <div className="flex items-center justify-between gap-1 mb-0.5 w-full min-w-0">
                                  <span className={`text-[6.8px] sm:text-[7px] font-bold uppercase tracking-tight shrink-0 leading-none ${p.isEmpty ? (isDark ? "text-slate-400" : "text-slate-500") : (isDark ? "text-[#38BDF8]" : "text-blue-600")
                                    }`}>
                                    {p.port}
                                  </span>
                                  <span className={`text-[6px] font-bold px-1 py-[0.5px] rounded-full border leading-tight shrink-0 whitespace-nowrap tracking-tight ${p.isEmpty
                                      ? isDark ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" : "text-emerald-700 bg-emerald-50 border-emerald-200"
                                      : isDark ? "text-cyan-300 bg-cyan-500/20 border-cyan-500/40" : "text-blue-700 bg-blue-50 border-blue-200"
                                    }`}>
                                    {p.isEmpty ? "Kosong" : "Aktif"}
                                  </span>
                                </div>

                                {/* Port Card Content: Type & Serial */}
                                <div className="my-auto py-0.5 min-w-0">
                                  <span className={`text-[9px] sm:text-[9.5px] block truncate leading-tight tracking-tight ${p.isEmpty
                                      ? isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium"
                                      : isDark ? "text-white font-bold" : "text-slate-900 font-bold"
                                    }`}>
                                    {p.isEmpty ? "Slot Kosong" : (p.type || "SFP Transceiver")}
                                  </span>
                                  <span className={`text-[6px] sm:text-[6.5px] block truncate mt-0.5 leading-none ${p.isEmpty
                                      ? isDark ? "text-slate-500" : "text-slate-400"
                                      : isDark ? "font-mono text-slate-400" : "font-mono text-slate-500"
                                    }`} title={p.sn}>
                                    {p.isEmpty ? "Belum ada SFP" : (p.sn ? (p.sn.startsWith("SN:") ? p.sn : `SN: ${p.sn}`) : "SN: -")}
                                  </span>
                                </div>

                                {/* Port Card Action Button (Pasang SFP / Mutasi SFP) */}
                                {p.isEmpty ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNavigateToMutation(selectedSlotForAction, "pasang", p);
                                    }}
                                    className="mt-auto w-full py-0.5 px-0.5 rounded-[4px] text-[7px] font-bold flex items-center justify-center gap-0.5 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/25 active:scale-95 text-emerald-400 transition-all cursor-pointer whitespace-nowrap shadow-2xs leading-tight"
                                    title={`Pasang Transceiver SFP pada ${p.port}`}
                                  >
                                    <span className="material-symbols-outlined text-[9.5px] shrink-0">add</span>
                                    <span>Pasang SFP</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNavigateToMutation(selectedSlotForAction, "pindah", p);
                                    }}
                                    className="mt-auto w-full py-0.5 px-0.5 rounded-[4px] text-[7px] font-bold flex items-center justify-center gap-0.5 border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/25 active:scale-95 text-[#38BDF8] transition-all cursor-pointer whitespace-nowrap shadow-2xs leading-tight"
                                    title={`Mutasi Transceiver SFP pada ${p.port}`}
                                  >
                                    <span className="material-symbols-outlined text-[9.5px] shrink-0">swap_horiz</span>
                                    <span>Mutasi SFP</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Custom Scrollbar Track: Warna Solid Jelas & Kontras (Tanpa Gradasi) Sesuai Permintaan User */}
                          <div className={`flex items-center gap-1.5 mt-1.5 px-0.5 select-none ${portScrollState.canScroll ? "visible" : "invisible"}`}>
                            <button
                              type="button"
                              onClick={() => handleScrollPorts("left")}
                              className={`active:scale-90 transition-all cursor-pointer p-0.5 ${
                                isDark ? "text-slate-400 hover:text-[#38BDF8]" : "text-slate-500 hover:text-blue-600"
                              }`}
                              title="Geser ke kiri"
                            >
                              <span className="text-[10px] leading-none block font-mono">◀</span>
                            </button>
                            <div
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickRatio = (e.clientX - rect.left) / rect.width;
                                if (portScrollRef.current) {
                                  const maxScroll = portScrollRef.current.scrollWidth - portScrollRef.current.clientWidth;
                                  portScrollRef.current.scrollTo({ left: clickRatio * maxScroll, behavior: "smooth" });
                                }
                              }}
                              className={`flex-1 h-[6px] rounded-full overflow-hidden relative cursor-pointer border ${
                                isDark ? "bg-[#0A182B] border-[#1E3A5F]" : "bg-slate-200 border-slate-300"
                              }`}
                            >
                              <div
                                className={`h-full rounded-full transition-all duration-150 ${
                                  isDark ? "bg-[#38BDF8]" : "bg-[#1677FF]"
                                }`}
                                style={{
                                  width: `${portScrollState.width}%`,
                                  marginLeft: `${portScrollState.left}%`,
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleScrollPorts("right")}
                              className={`active:scale-90 transition-all cursor-pointer p-0.5 ${
                                isDark ? "text-slate-400 hover:text-[#38BDF8]" : "text-slate-500 hover:text-blue-600"
                              }`}
                              title="Geser ke kanan"
                            >
                              <span className="text-[10px] leading-none block font-mono">▶</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
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
                    Pindai QR Code Ruang STO atau QR Rak Perangkat untuk memunculkan visualisasi digital twin slot chassis.
                  </p>
                </div>
              </div>
            )}
          </div>
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


      {/* Floating Card Popup Slot (Compact + Hover-Stay) */}
      {activeSlotPopup && (() => {
        const popupPortInfo = getSlotPortInfo(activeSlotPopup);
        return (
          <div
            id="ar-slot-floating-popup"
            onMouseEnter={cancelPopupHide}
            onMouseLeave={triggerPopupHide}
            className={`fixed z-50 pointer-events-auto transform -translate-x-1/2 ${slotPopupPos.isBelow ? "" : "-translate-y-full"
              } text-[10px] p-2 rounded-xl shadow-2xl border transition-all duration-150 w-[220px] max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 ${isDark
                ? "bg-[#071426] border-[#38BDF8]/50 text-[#E6EDF7] shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
                : "bg-white border-blue-400 text-slate-800 shadow-xl"
              }`}
            style={{ left: `${slotPopupPos.x}px`, top: `${slotPopupPos.y}px` }}
          >
            {/* Header: Slot # | Port badge | Status | Close */}
            <div className={`flex items-center justify-between pb-1 border-b mb-1 ${isDark ? "border-[#1E3A5F]" : "border-slate-200"}`}>
              <div className="flex items-center gap-1 whitespace-nowrap min-w-0">
                <span className={`font-bold text-[10px] ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                  Slot #{String(activeSlotPopup.nomor_slot ?? activeSlotPopup.slot_number ?? "").padStart(2, "0")}
                </span>
                {popupPortInfo.total > 0 && (
                  <span className={`text-[7px] font-mono font-semibold px-1 py-px rounded border ${isDark ? "bg-[#0C223D] border-[#1A4575] text-[#38BDF8]" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
                    {popupPortInfo.total} Port
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`px-1 py-px rounded text-[7px] font-semibold whitespace-nowrap ${activeSlotPopup.occupied
                    ? isDark ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold"
                    : isDark ? "bg-slate-500/20 text-slate-400 border border-slate-500/30" : "bg-slate-100 text-slate-600 border border-slate-300"
                  }`}>
                  {activeSlotPopup.occupied ? "TERISI" : "KOSONG"}
                </span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setActiveSlotPopup(null); }}
                  className={`text-[9px] leading-none p-0.5 transition-colors cursor-pointer ${isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-900"}`} title="Tutup">
                  ✕
                </button>
              </div>
            </div>

            {activeSlotPopup.occupied && activeSlotPopup.module ? (
              <div className="space-y-px text-[8px]">
                {/* Info rows — each is a single horizontal line */}
                <div className="flex items-center whitespace-nowrap overflow-hidden">
                  <span className={`w-[52px] shrink-0 ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>Serial No:</span>
                  <span className={`font-mono font-semibold truncate ${isDark ? "text-[#E6EDF7]" : "text-slate-800"}`}>
                    {activeSlotPopup.module.serial_number || "-"}
                  </span>
                </div>
                {activeSlotPopup.module.unit_part_number && (
                  <div className="flex items-center whitespace-nowrap overflow-hidden">
                    <span className={`w-[52px] shrink-0 ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>Part No:</span>
                    <span className={`font-mono truncate ${isDark ? "text-[#E6EDF7]" : "text-slate-800"}`}>
                      {activeSlotPopup.module.unit_part_number}
                    </span>
                  </div>
                )}
                <div className="flex items-center whitespace-nowrap overflow-hidden">
                  <span className={`w-[52px] shrink-0 ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>Tipe:</span>
                  <span className={`font-semibold truncate ${isDark ? "text-[#CBD5E1]" : "text-slate-800"}`}>
                    {activeSlotPopup.module.tipe || activeSlotPopup.module.unit_type || "Card Transmisi"}
                  </span>
                </div>
                <div className="flex items-center whitespace-nowrap overflow-hidden">
                  <span className={`w-[52px] shrink-0 ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>Status:</span>
                  <span className={`font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600 font-bold"}`}>
                    {activeSlotPopup.module.kondisi || "AKTIF"}
                  </span>
                </div>

                {/* Port & SFP Section */}
                {popupPortInfo.total > 0 && (
                  <div className={`mt-1 pt-1 border-t ${isDark ? "border-[#1E3A5F]/70" : "border-slate-200"}`}>
                    <div className="flex items-center justify-between mb-0.5 whitespace-nowrap">
                      <span className={`font-bold text-[8px] ${isDark ? "text-white" : "text-slate-800"}`}>Port & SFP:</span>
                      <div className="flex items-center gap-0.5 text-[7px]">
                        <span className={`px-1 py-px rounded font-bold ${isDark ? "bg-[#0C223D] text-[#38BDF8] border border-[#1A4575]" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                          {popupPortInfo.used} SFP
                        </span>
                        <span className={`px-1 py-px rounded font-bold ${isDark ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                          {popupPortInfo.remaining} Kosong
                        </span>
                      </div>
                    </div>

                    <div className="space-y-px max-h-[100px] overflow-y-auto pr-0.5 custom-scrollbar">
                      {popupPortInfo.ports.map((p, idx) => (
                        <div key={idx}
                          className={`flex items-center px-1 py-[2px] rounded border text-[7px] whitespace-nowrap ${p.isEmpty
                            ? isDark ? "bg-[#060E1A]/80 border-dashed border-[#162942] text-[#64748B]" : "bg-slate-50 border-dashed border-slate-300 text-slate-500"
                            : isDark ? "bg-[#0C1B30] border-[#1A385E] text-[#E2E8F0]" : "bg-blue-50/70 border-blue-200 text-slate-800"
                          }`}>
                          <span className={`font-bold font-mono uppercase w-[34px] shrink-0 ${isDark ? (p.isEmpty ? "text-slate-500" : "text-[#38BDF8]") : (p.isEmpty ? "text-slate-500" : "text-blue-600")}`}>
                            {p.port}
                          </span>
                          <span className="font-semibold w-[36px] shrink-0 truncate">{p.type}</span>
                          <span className={`font-mono text-[6.5px] truncate ml-auto ${p.isEmpty
                            ? isDark ? "text-emerald-400/90 font-medium" : "text-emerald-600 font-bold"
                            : isDark ? "text-slate-300" : "text-slate-600"
                          }`}>
                            {p.isEmpty ? "Kosong" : (p.sn.replace("SN: ", "") || "Aktif")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={`text-[8px] italic ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Slot belum terpasang modul
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
