import React, { useState, useEffect, useMemo } from "react";

import ModalPortal from "./ModalPortal";

import { useTheme } from "../context/ThemeContext";

import nokiaSto1Depan from "../assets/nokia_1830_pss24_sto1_depan.png";

import nokiaSto2Depan from "../assets/nokia_1830_pss24_sto2_depan.png";

import infranexiaLogo from "../assets/infranexia_logo.png";



/**

 * Helper to determine physical port capacity based on card model

 */

export function getCardPortCapacity(unitType) {
  if (!unitType) return 0;
  const ut = unitType.toUpperCase();
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
}



/**

 * Photorealistic 2D Interactive Chassis Subrack Modal for Nokia 1830 PSS-24 (29 Physical Front Slots)

 * Supports full Dark & Light mode themes.

 */

export default function ChassisSubrackModal({ item, onClose, isDark: propIsDark, currentUser = null }) {

  const themeContext = useTheme ? useTheme() : null;

  const isDark = propIsDark !== undefined 

    ? propIsDark 

    : (themeContext?.isDark ?? document.documentElement.classList.contains("dark"));



  const [deviceData, setDeviceData] = useState(item || {});

  const [userProfile, setUserProfile] = useState(currentUser || null);



  useEffect(() => {

    if (currentUser?.avatar_url) {

      setUserProfile(currentUser);

      return;

    }

    fetch("/api/me")

      .then((r) => r.json())

      .then((d) => {

        if (d.success && d.user) {

          setUserProfile(d.user);

        }

      })

      .catch(() => {});

  }, [currentUser]);

  const [installedModules, setInstalledModules] = useState([]);

  const [transceivers, setTransceivers] = useState([]);

  const [sfpsBySlot, setSfpsBySlot] = useState({});

  const [allPositions, setAllPositions] = useState([]);

  const [loading, setLoading] = useState(true);



  // Active tab: 'chassis' (Detail Perangkat & Slot 29) or 'modules' (Slot & Modul 71)

  const [activeTab, setActiveTab] = useState("chassis");



  // Selected slot state: null by default (Slot 2 is not selected initially)

  const [selectedSlot, setSelectedSlot] = useState(null);



  // Tab 2 filter / search

  const [moduleSearch, setModuleSearch] = useState("");

  const [moduleCategoryFilter, setModuleCategoryFilter] = useState("all");



  const deviceId = item?.id || item?.device_id;



  // Load enriched device data from backend

  useEffect(() => {

    if (!deviceId) return;

    async function fetchDetail() {

      setLoading(true);

      try {

        const res = await fetch(`/api/devices/${deviceId}`);

        const data = await res.json();

        if (data.success) {

          setDeviceData(data.device || item);

          setInstalledModules(data.installed_modules || []);

          setTransceivers(data.transceivers || []);

          setSfpsBySlot(data.sfps_by_slot || {});

          setAllPositions(data.all_positions || []);

        }

      } catch (err) {

        console.error("Error loading device detail:", err);

      } finally {

        setLoading(false);

      }

    }

    fetchDetail();

  }, [deviceId]);



  // Hostname & metadata formatting (Palu 1 vs Palu 2)
  const devIdNum = parseInt(item?.id || item?.device_id || deviceData.id || deviceData.device_id, 10);
  const rawHostname = item?.hostname || item?.nama_perangkat || deviceData.hostname || deviceData.nama_perangkat || "";
  const rawStoName = item?.lokasi || item?.location_name || item?.sto_nama || deviceData.lokasi || deviceData.location_name || deviceData.sto_nama || "";

  // Rigorous check for STO Palu 2 (PLB) vs STO Palu 1 (PLA)
  const isPalu2 =
    devIdNum === 17 ||
    rawHostname.includes("PAL2") ||
    rawStoName.toLowerCase().includes("palu 2") ||
    item?.site_code === "PLB" ||
    deviceData.site_code === "PLB" ||
    deviceData.kode_site === "PLB";
  const isPalu1 = !isPalu2;

  const hostname = rawHostname || (isPalu1 ? "WN-24X-SUL-PAL11" : "WN-24X-SUL-PAL211");
  const stoName = rawStoName || (isPalu1 ? "STO Palu 1" : "STO Palu 2");
  const siteCode = item?.site_code || deviceData.site_code || deviceData.kode_site || (isPalu1 ? "PLA" : "PLB");
  const districtName = "PALU";
  const coordinates = item?.coordinates || deviceData.coordinates || (isPalu1 ? "-0.891700, 119.870700" : "-0.899500, 119.865400");
  const devicePhoto = isPalu1 ? nokiaSto1Depan : nokiaSto2Depan;

  // Real database position count strictly from API
  const totalPositionCount = allPositions.length > 0
    ? allPositions.length
    : (item?.total_positions ?? 0);

  // Build slot occupancy lookup map for physical slots 1 to 29 strictly from DB
  const slotCardMap = useMemo(() => {
    const map = {};
    if (installedModules && installedModules.length > 0) {
      installedModules.forEach((m) => {
        const sl = parseInt(m.slot_number, 10);
        if (!isNaN(sl) && sl >= 1 && sl <= 29) {
          map[sl] = m;
        }
      });
      return map;
    }

    // Gunakan initial slots jika tersedia dari parent (RackSlotStatus) untuk mencegah layout shift seketika
    if (item?.slots && Array.isArray(item.slots)) {
      item.slots.forEach((s) => {
        if (s.occupied && s.module) {
          map[s.slot_number] = {
            slot_number: String(s.slot_number),
            unit_type: s.module.unit_type,
            serial_number: s.module.serial_number,
            unit_part_number: s.module.unit_part_number,
            kondisi: s.module.kondisi || "AKTIF",
            desc: s.module.desc || "Line Card",
            installed_at: s.module.installed_at || "Aktif",
          };
        }
      });
    }

    return map;
  }, [installedModules, item]);



  // Selected card module details

  const selectedCard = selectedSlot ? (slotCardMap[selectedSlot] || null) : null;



  // Port and SFP capacity breakdown for selected slot

  const slotPortInfo = useMemo(() => {

    if (!selectedSlot) {

      return { total: 0, used: 0, remaining: 0, ports: [] };

    }



    if (!selectedCard) {

      return { total: 0, used: 0, remaining: 0, ports: [] };

    }



    const total = getCardPortCapacity(selectedCard.unit_type);



    if (total === 0) {

      return { total: 0, used: 0, remaining: 0, ports: [] };

    }



    // Real database SFP transceivers installed on this slot

    const dbSfps = sfpsBySlot[String(selectedSlot)] || [];



    // Map existing SFPs by their port number / identifier (e.g. "1", "2", "Port 1", etc.)

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

          port: sfp.port && sfp.port !== "-" ? (sfp.port.toLowerCase().startsWith("port") ? sfp.port : `Port ${sfp.port}`) : `Port ${pNum}`,

          type: sfp.unit_type || "Transceiver SFP",

          sn: `SN: ${sfp.serial_number || "-"}`,

          status: sfp.kondisi || "Aktif",

          isEmpty: false,

        });

      } else if (unnumberedIdx < unnumberedSfps.length) {

        const uSfp = unnumberedSfps[unnumberedIdx++];

        ports.push({

          port: uSfp.port && uSfp.port !== "-" ? `Port ${uSfp.port}` : `Port ${pNum}`,

          type: uSfp.unit_type || "Transceiver SFP",

          sn: `SN: ${uSfp.serial_number || "-"}`,

          status: uSfp.kondisi || "Aktif",

          isEmpty: false,

        });

      } else {

        // Genuinely unoccupied port cage on this card

        ports.push({

          port: `Port ${pNum}`,

          type: "Port Kosong",

          sn: "Tersedia untuk SFP Baru",

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

  }, [selectedSlot, selectedCard, sfpsBySlot]);



  // Filtered all positions for Tab 2

  const filteredAllPositions = useMemo(() => {

    return allPositions.filter((p) => {

      const matchSearch =

        !moduleSearch ||

        (p.serial_number && p.serial_number.toLowerCase().includes(moduleSearch.toLowerCase())) ||

        (p.unit_part_number && p.unit_part_number.toLowerCase().includes(moduleSearch.toLowerCase())) ||

        (p.unit_type && p.unit_type.toLowerCase().includes(moduleSearch.toLowerCase())) ||

        String(p.slot_number).includes(moduleSearch) ||

        String(p.port).includes(moduleSearch);



      const matchCat =

        moduleCategoryFilter === "all" ||

        (moduleCategoryFilter === "card" && p.kategori === "CARD") ||

        (moduleCategoryFilter === "sfp" && p.kategori === "SFP");



      return matchSearch && matchCat;

    });

  }, [allPositions, moduleSearch, moduleCategoryFilter]);



  // =========================================================================

  // HELPER: RENDER STANDARD CHASSIS SLOT (SLOTS 1-6, 17-22, 10-16, 23-29)

  // =========================================================================

  const renderStandardSlot = (slotNum, gridCol, gridRow) => {

    const isSelected = selectedSlot === slotNum;

    const card = slotCardMap[slotNum];

    const isController = slotNum === 16;

    const isBackupCtrl = slotNum === 29;

    const isOccupied = Boolean(card);



    return (

      <button

        key={`slot-${slotNum}`}

        type="button"

        onClick={(e) => {

          e.stopPropagation();

          setSelectedSlot((prev) => (prev === slotNum ? null : slotNum));

        }}

        style={{

          gridColumn: gridCol,

          gridRow: gridRow,

          backgroundColor: isSelected ? "#092B47" : (isOccupied ? "#0F233D" : "#060D17"),

          borderColor: isSelected ? "#00E5FF" : (isOccupied ? "#1D3B63" : "#102035"),

        }}

        className={`relative rounded flex flex-col justify-between p-1 transition-all duration-150 text-left cursor-pointer group border h-full w-full min-h-0 ${

          isSelected

            ? "border-2 !border-[#00E5FF] shadow-[0_0_14px_rgba(0,229,255,0.7)] z-20 scale-[1.03]"

            : isOccupied

            ? "hover:!bg-[#153256] hover:!border-[#38BDF8]"

            : "hover:!bg-[#0B1829] hover:!border-[#1E3D66]"

        }`}

      >

        {/* Top Slot Number & Indicator LED */}

        <div className="flex items-center justify-between w-full shrink-0">

          <span

            className={`text-[9px] font-bold font-mono ${

              isSelected

                ? "text-[#00E5FF]"

                : isOccupied

                ? "text-slate-300"

                : "text-[#475569]"

            }`}

          >

            {slotNum}

          </span>

          {isOccupied && (

            <span

              className={`w-1.5 h-1.5 rounded-full ${

                isController || isBackupCtrl

                  ? "bg-amber-400 shadow-[0_0_4px_#FBBF24]"

                  : "bg-emerald-400 shadow-[0_0_4px_#34D399]"

              }`}

            ></span>

          )}

        </div>



        {/* Card Faceplate Graphic */}

        <div className="flex-1 flex flex-col items-center justify-center my-0.5 overflow-hidden">

          {isController ? (

            <div className="w-full flex flex-col items-center gap-0.5">

              <span className="text-[7px] font-bold text-amber-300 leading-tight">OSC2</span>

              <span className="text-[6px] text-[#64748B] leading-none">Ctrl</span>

              <div className="w-2.5 h-2 bg-[#0B1726] border border-[#2B4B75] rounded-xs mt-0.5"></div>

              <div className="w-2.5 h-2 bg-[#0B1726] border border-[#2B4B75] rounded-xs"></div>

            </div>

          ) : isBackupCtrl ? (

            <div className="w-full flex flex-col items-center gap-0.5">

              <span className="text-[7px] font-bold text-amber-300 leading-tight">OSC2 B</span>

              <span className="text-[6px] text-[#64748B] leading-none">Sec</span>

              <div className="w-2.5 h-2 bg-[#0B1726] border border-[#2B4B75] rounded-xs mt-0.5"></div>

              <div className="w-2.5 h-2 bg-[#0B1726] border border-[#2B4B75] rounded-xs"></div>

            </div>

          ) : card ? (

            <div className="w-full flex flex-col items-center">

              <span

                className={`text-[8px] font-bold leading-tight truncate max-w-full text-center ${

                  isSelected ? "text-white" : "text-[#93C5FD]"

                }`}

              >

                {card.unit_type}

              </span>

              <div className="w-full flex flex-col items-center gap-0.5 mt-1">

                <div className="w-3 h-1.5 bg-[#06101D] border border-[#224470] rounded-xs flex items-center justify-center">

                  <span className="w-1.5 h-0.5 bg-[#1677FF]/40 rounded-xs"></span>

                </div>

                <div className="w-3 h-1.5 bg-[#06101D] border border-[#224470] rounded-xs flex items-center justify-center">

                  <span className="w-1.5 h-0.5 bg-[#1677FF]/40 rounded-xs"></span>

                </div>

              </div>

            </div>

          ) : (

            <div className="h-full flex flex-col items-center justify-center gap-1 opacity-25">

              <span className="w-0.5 h-3 bg-[#334155] rounded-full"></span>

              <span className="w-0.5 h-3 bg-[#334155] rounded-full"></span>

            </div>

          )}

        </div>



        {/* Bottom Slot Number */}

        <div className="text-center w-full shrink-0">

          <span

            className={`text-[8px] font-mono font-medium ${

              isSelected

                ? "text-[#00E5FF] font-bold"

                : isOccupied

                ? "text-slate-400"

                : "text-[#334155]"

            }`}

          >

            {slotNum}

          </span>

        </div>

      </button>

    );

  };



  // =========================================================================

  // HELPER: RENDER CENTER SWITCH FABRIC SLOT (SLOTS 7, 8, 9 FULL HEIGHT)

  // Continuous single card spanning top to bottom, without midplane divider

  // =========================================================================

  const renderFabricSlot = (slotNum, gridCol) => {

    const isSelected = selectedSlot === slotNum;

    const card = slotCardMap[slotNum];

    const isOccupied = Boolean(card);



    return (

      <button

        key={`fabric-${slotNum}`}

        type="button"

        onClick={(e) => {

          e.stopPropagation();

          setSelectedSlot((prev) => (prev === slotNum ? null : slotNum));

        }}

        style={{

          gridColumn: gridCol,

          gridRow: "1 / span 3",

          backgroundColor: isSelected ? "#092B47" : (isOccupied ? "#0D2139" : "#060D17"),

          borderColor: isSelected ? "#00E5FF" : (isOccupied ? "#1B3B63" : "#102035"),

        }}

        className={`relative rounded flex flex-col justify-between p-1 transition-all duration-150 text-left cursor-pointer group border h-full w-full min-h-0 ${

          isSelected

            ? "border-2 !border-[#00E5FF] shadow-[0_0_14px_rgba(0,229,255,0.7)] z-20 scale-[1.02]"

            : isOccupied

            ? "hover:!bg-[#153256] hover:!border-[#38BDF8]"

            : "hover:!bg-[#0B1829] hover:!border-[#1E3D66]"

        }`}

      >

        {/* Top Header: Slot Number & Status LED */}

        <div className="flex items-center justify-between w-full">

          <span

            className={`text-[9px] font-bold font-mono ${

              isSelected

                ? "text-[#00E5FF]"

                : isOccupied

                ? "text-slate-300"

                : "text-[#475569]"

            }`}

          >

            {slotNum}

          </span>

          {isOccupied && (

            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34D399]"></span>

          )}

        </div>



        {/* Top Ejector Latch Handle */}

        <div className="w-full flex justify-center my-1">

          <div className="w-3.5 h-7 bg-gradient-to-b from-[#1C3A5E] to-[#10223A] rounded border border-[#29507E] flex flex-col items-center justify-between py-1 shadow-sm">

            <span className="w-1.5 h-1 bg-[#38BDF8]/60 rounded-xs"></span>

            <span className="w-2 h-0.5 bg-[#0A1728] rounded-full"></span>

          </div>

        </div>



        {/* Card Body & Switch Fabric Labels */}

        <div className="flex-1 flex flex-col items-center justify-center my-1 overflow-hidden">

          <span className="text-[8px] font-bold text-[#38BDF8] tracking-tight text-center leading-none">

            SC24T

          </span>

          <span className="text-[6.5px] text-[#94A3B8] tracking-tighter text-center leading-tight mt-0.5">

            Switch Fabric

          </span>

          {/* Fabric high-speed interconnect graphic spine */}

          <div className="w-full flex flex-col items-center gap-1 my-2">

            <div className="w-2.5 h-12 bg-[#081524] rounded-xs border border-[#1E3E66] flex flex-col items-center justify-around py-1">

              <span className="w-1.5 h-0.5 bg-[#00E5FF]/50"></span>

              <span className="w-1.5 h-0.5 bg-[#00E5FF]/50"></span>

              <span className="w-1.5 h-0.5 bg-[#00E5FF]/50"></span>

              <span className="w-1.5 h-0.5 bg-[#00E5FF]/50"></span>

            </div>

            <span className="text-[6px] font-mono text-[#64748B]">1.2Tbps</span>

          </div>

        </div>



        {/* Bottom Ejector Latch Handle */}

        <div className="w-full flex justify-center my-1">

          <div className="w-3.5 h-7 bg-gradient-to-b from-[#10223A] to-[#1C3A5E] rounded border border-[#29507E] flex flex-col items-center justify-between py-1 shadow-sm">

            <span className="w-2 h-0.5 bg-[#0A1728] rounded-full"></span>

            <span className="w-1.5 h-1 bg-[#38BDF8]/60 rounded-xs"></span>

          </div>

        </div>



        {/* Bottom Slot Number */}

        <div className="text-center w-full">

          <span

            className={`text-[8px] font-mono font-medium ${

              isSelected

                ? "text-[#00E5FF] font-bold"

                : isOccupied

                ? "text-slate-400"

                : "text-[#334155]"

            }`}

          >

            {slotNum}

          </span>

        </div>

      </button>

    );

  };



  return (

    <ModalPortal>

      <div

        className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto"

        onClick={() => {

          if (selectedSlot !== null) {

            setSelectedSlot(null);

          } else {

            onClose();

          }

        }}

      >

        <div

          className={`relative w-full max-w-[1380px] my-auto rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[96vh] transition-colors duration-200 ${

            isDark

              ? "bg-[#071120] text-[#E6EDF7] border-[#162F52] shadow-[0_25px_70px_rgba(0,0,0,0.85)]"

              : "bg-white text-slate-800 border-slate-200 shadow-[0_25px_70px_rgba(15,23,42,0.25)]"

          }`}

          onClick={(e) => {

            e.stopPropagation();

            if (selectedSlot !== null) {

              setSelectedSlot(null);

            }

          }}

        >

          {/* ============================================================ */}

          {/* TOP APP BAR: LOGO, USER PROFILE, CLOSE BUTTON                */}

          {/* ============================================================ */}

          <div

            className={`px-5 py-3 border-b flex items-center justify-between gap-4 shrink-0 transition-colors ${

              isDark ? "bg-[#091527] border-[#142A4A]" : "bg-slate-50 border-slate-200"

            }`}

          >

            {/* Left: Brand Identity matching main app branding */}

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl p-[2px] flex items-center justify-center bg-white border border-slate-200 shadow-sm shrink-0 overflow-hidden">
                <img
                  src={infranexiaLogo}
                  alt="infraNexia by Telkom Indonesia"
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-bold tracking-tight leading-none ${isDark ? "text-[#E6EDF7]" : "text-slate-900"}`}>
                  Asset Lifecycle
                </span>
                <span className="text-[10px] font-medium leading-tight mt-0.5 text-[#38BDF8]">
                  PT Telkom Infrastruktur
                </span>
              </div>
            </div>



            {/* Right: User Profile with real DB photo & Close Button */}

            <div className="flex items-center gap-3">

              <div

                className={`flex items-center gap-2.5 px-2.5 py-1 rounded-xl border transition-colors ${

                  isDark ? "bg-[#0B1A2F] border-[#173357]" : "bg-white border-slate-200 shadow-xs"

                }`}

              >

                <div className="relative shrink-0">

                  {userProfile?.avatar_url ? (

                    <img

                      src={userProfile.avatar_url}

                      alt={userProfile?.name || "User Avatar"}

                      className="w-7 h-7 rounded-full object-cover object-top ring-1.5 shadow-sm ring-[#1677FF]"

                    />

                  ) : (

                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#1677FF] to-[#00E5FF] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">

                      {userProfile?.name ? userProfile.name.substring(0, 2).toUpperCase() : "AA"}

                    </div>

                  )}

                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white dark:ring-[#0B1A2F]"></span>

                </div>

                <div className="hidden sm:block text-left">

                  <p className={`text-[11px] font-semibold leading-tight ${isDark ? "text-white" : "text-slate-800"}`}>

                    {userProfile?.name || "Admin Asset"}

                  </p>

                  <p className={`text-[9px] leading-tight font-medium ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>

                    {userProfile?.role === "admin" ? "Super Admin" : "Karyawan TIF"}

                  </p>

                </div>

              </div>



              {/* Close Button */}

              <button

                type="button"

                onClick={onClose}

                aria-label="Tutup Detail Perangkat"

                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-sm ${

                  isDark

                    ? "bg-[#0D2038] hover:bg-[#16365C] border-[#1A3860] text-[#94A3B8] hover:text-white"

                    : "bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"

                }`}

              >

                <span className="material-symbols-outlined text-[19px]">close</span>

              </button>

            </div>

          </div>



          {/* ============================================================ */}

          {/* DEVICE TITLE & BREADCRUMBS BANNER                             */}

          {/* ============================================================ */}

          <div

            className={`px-6 pt-3 pb-2 border-b shrink-0 transition-colors ${

              isDark ? "bg-[#071324] border-[#142A4A]" : "bg-white border-slate-200"

            }`}

          >

            {/* Breadcrumbs */}

            <div className={`flex items-center gap-1.5 text-[11px] mb-1 font-medium ${isDark ? "text-[#64748B]" : "text-slate-400"}`}>

              <span className={`cursor-pointer ${isDark ? "hover:text-[#38BDF8]" : "hover:text-blue-600"}`}>Beranda</span>

              <span>&gt;</span>

              <span className={`cursor-pointer ${isDark ? "hover:text-[#38BDF8]" : "hover:text-blue-600"}`}>Inventaris</span>

              <span>&gt;</span>

              <span className={isDark ? "text-[#38BDF8]" : "text-blue-600 font-semibold"}>

                Detail Perangkat: {hostname}

              </span>

            </div>



            {/* Title & Specs summary */}

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>

                <div className="flex items-center gap-3">

                  <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>

                    {hostname}

                  </h2>

                  <span

                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${

                      isDark

                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"

                        : "bg-emerald-50 border border-emerald-200 text-emerald-700"

                    }`}

                  >

                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>

                    Aktif

                  </span>

                </div>

                <p className={`text-xs mt-0.5 flex flex-wrap items-center gap-2 ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>

                  <span>Nokia 1830 PSS-24</span>

                  <span>•</span>

                  <span>{stoName} ({siteCode})</span>

                  <span>•</span>

                  <span>District {districtName}</span>

                  <span>•</span>

                  <span>Sulawesi Tengah</span>

                  <span>•</span>

                  <span className={`font-mono ${isDark ? "text-[#38BDF8]" : "text-blue-600 font-medium"}`}>

                    Koordinat: {coordinates}

                  </span>

                </p>

              </div>

            </div>



            {/* ============================================================ */}

            {/* 2 NAVIGATION TABS                                            */}

            {/* ============================================================ */}

            <div

              className={`flex items-center gap-6 mt-3 border-t pt-2 text-xs font-semibold ${

                isDark ? "border-[#12243D]" : "border-slate-100"

              }`}

            >

              <button

                type="button"

                onClick={() => setActiveTab("chassis")}

                className={`pb-2 relative transition-all cursor-pointer ${

                  activeTab === "chassis"

                    ? isDark

                      ? "text-[#00E5FF] font-bold"

                      : "text-blue-600 font-bold border-b-2 border-blue-600"

                    : isDark

                    ? "text-[#94A3B8] hover:text-[#E2E8F0]"

                    : "text-slate-500 hover:text-slate-800"

                }`}

              >

                Detail Perangkat &amp; Slot (29)

                {activeTab === "chassis" && isDark && (

                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></span>

                )}

              </button>



              <button

                type="button"

                onClick={() => setActiveTab("modules")}

                className={`pb-2 relative transition-all cursor-pointer ${

                  activeTab === "modules"

                    ? isDark

                      ? "text-[#00E5FF] font-bold"

                      : "text-blue-600 font-bold border-b-2 border-blue-600"

                    : isDark

                    ? "text-[#94A3B8] hover:text-[#E2E8F0]"

                    : "text-slate-500 hover:text-slate-800"

                }`}

              >

                Slot &amp; Modul ({totalPositionCount})

                {activeTab === "modules" && isDark && (

                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></span>

                )}

              </button>

            </div>

          </div>



          {/* ============================================================ */}

          {/* TAB 1: DETAIL PERANGKAT & CHASSIS SUBRACK 2D INTERAKTIF      */}

          {/* ============================================================ */}

          {activeTab === "chassis" && (

            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* ============================================================ */}

              {/* LEFT COLUMN: CHASSIS SUBRACK VIEW & SELECTED SLOT INFO (8 cols) */}

              {/* ============================================================ */}

              <div className="lg:col-span-8 flex flex-col gap-3.5">

                {/* 1. CHASSIS SUBRACK 2D RACK CONTAINER */}

                <div

                  className={`border rounded-xl p-3.5 sm:p-4 shadow-md transition-colors ${

                    isDark ? "bg-[#091527] border-[#162F52]" : "bg-slate-50 border-slate-200"

                  }`}

                >

                  {/* Card Header & Legend */}

                  <div

                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b mb-3 ${

                      isDark ? "border-[#142A4A]" : "border-slate-200"

                    }`}

                  >

                    <div>

                      <div className="flex items-center gap-2">

                        <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]"></span>

                        <h3 className={`text-xs sm:text-sm font-bold tracking-wide ${isDark ? "text-white" : "text-slate-800"}`}>

                          Tampilan Slot Chassis Subrack Nokia 1830 PSS-24 (29 Slot Fisik Depan)

                        </h3>

                      </div>

                      <p className={`text-[10px] mt-0.5 pl-4.5 ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>

                        Top Tier: Slot 1 - 16 (16 Slot) &bull; Bottom Tier: Slot 17 - 29 (13 Slot)

                      </p>

                    </div>



                    {/* Legend */}

                    <div className="flex items-center gap-3 text-[10px]">

                      <div className="flex items-center gap-1.5">

                        <span className="w-3 h-3 rounded-sm border border-[#00E5FF] bg-[#00E5FF]/20 shadow-[0_0_6px_#00E5FF]"></span>

                        <span className={isDark ? "text-[#38BDF8] font-medium" : "text-blue-700 font-semibold"}>

                          {selectedSlot ? `Slot Terpilih (Slot ${selectedSlot})` : "Slot Terpilih"}

                        </span>

                      </div>

                      <div className="flex items-center gap-1.5">

                        <span className="w-3 h-3 rounded-sm bg-[#0F233D] border border-[#1E4370]"></span>

                        <span className={isDark ? "text-[#94A3B8]" : "text-slate-600"}>Modul Terpasang</span>

                      </div>

                      <div className="flex items-center gap-1.5">

                        <span className="w-3 h-3 rounded-sm bg-[#060D17] border border-[#122238]"></span>

                        <span className={isDark ? "text-[#64748B]" : "text-slate-500"}>Slot Kosong</span>

                      </div>

                    </div>

                  </div>



                  {/* 2D SUBRACK RACK VISUALIZER (Maintains realistic physical telecom metallic finish) */}

                  <div className="relative rounded-lg p-2 sm:p-3 bg-gradient-to-b from-[#0F1E33] to-[#081220] border-2 border-[#1E3E69] shadow-[inset_0_2px_12px_rgba(0,0,0,0.8)]">

                    {/* Outer Frame with Mounting Ears Flange */}

                    <div className="flex items-stretch gap-1.5 sm:gap-2">

                      {/* Left Rack Ear (Mounting Screws) */}

                      <div className="w-4 sm:w-5 bg-gradient-to-r from-[#182C47] to-[#101F33] rounded-sm border border-[#23426E] flex flex-col justify-around items-center py-4 shrink-0 shadow-inner">

                        {[0, 1, 2, 3].map((s) => (

                          <div

                            key={s}

                            className="w-2.5 h-2.5 rounded-full bg-[#081324] border border-[#3A5D8C] flex items-center justify-center shadow-inner"

                          >

                            <span className="w-1 h-1 rounded-full bg-[#182D4A]"></span>

                          </div>

                        ))}

                      </div>



                      {/* MAIN SUBRACK CHASSIS BODY: 16 COLUMNS UNIFIED CSS GRID (SEJAJAR SEMPURNA) */}

                      <div className="flex-1 bg-[#050D17] border border-[#162D4D] rounded p-2 overflow-x-auto custom-scrollbar">

                        <div

                          className="min-w-[640px] h-[310px] sm:h-[330px] grid gap-1"

                          style={{

                            gridTemplateColumns: "repeat(16, minmax(0, 1fr))",

                            gridTemplateRows: "minmax(0, 1fr) auto minmax(0, 1fr)",

                          }}

                        >

                          {/* ROW 1: TOP TIER (SLOTS 1 TO 6) */}

                          {[1, 2, 3, 4, 5, 6].map((slotNum, idx) =>

                            renderStandardSlot(slotNum, idx + 1, 1)

                          )}



                          {/* ROW 2: LEFT MIDPLANE DIVIDER (SPAN COLS 1 TO 6) */}

                          <div

                            style={{ gridColumn: "1 / span 6", gridRow: 2 }}

                            className="h-1.5 bg-[#13253D] border-y border-[#1C3659] flex items-center justify-between px-1.5 my-0.5 rounded-xs"

                          >

                            <span className="w-1 h-0.5 bg-[#3B82F6]/60 rounded-full"></span>

                            <span className="text-[6.5px] text-[#475569] font-mono tracking-wider uppercase truncate">

                              PSS-24 MIDPLANE

                            </span>

                            <span className="w-1 h-0.5 bg-[#3B82F6]/60 rounded-full"></span>

                          </div>



                          {/* ROW 3: BOTTOM TIER (SLOTS 17 TO 22) */}

                          {[17, 18, 19, 20, 21, 22].map((slotNum, idx) =>

                            renderStandardSlot(slotNum, idx + 1, 3)

                          )}



                          {/* CENTER SWITCH FABRIC (SLOTS 7, 8, 9: SPANS ROWS 1 TO 3 FULL CONTINUOUS HEIGHT) */}

                          {[7, 8, 9].map((slotNum, idx) =>

                            renderFabricSlot(slotNum, idx + 7)

                          )}



                          {/* ROW 1: TOP TIER (SLOTS 10 TO 16) */}

                          {[10, 11, 12, 13, 14, 15, 16].map((slotNum, idx) =>

                            renderStandardSlot(slotNum, idx + 10, 1)

                          )}



                          {/* ROW 2: RIGHT MIDPLANE DIVIDER (SPAN COLS 10 TO 16) */}

                          <div

                            style={{ gridColumn: "10 / span 7", gridRow: 2 }}

                            className="h-1.5 bg-[#13253D] border-y border-[#1C3659] flex items-center justify-between px-1.5 my-0.5 rounded-xs"

                          >

                            <span className="w-1 h-0.5 bg-[#3B82F6]/60 rounded-full"></span>

                            <span className="text-[6.5px] text-[#475569] font-mono tracking-wider uppercase truncate">

                              PSS-24 MIDPLANE

                            </span>

                            <span className="w-1 h-0.5 bg-[#3B82F6]/60 rounded-full"></span>

                          </div>



                          {/* ROW 3: BOTTOM TIER (SLOTS 23 TO 29) */}

                          {[23, 24, 25, 26, 27, 28, 29].map((slotNum, idx) =>

                            renderStandardSlot(slotNum, idx + 10, 3)

                          )}

                        </div>

                      </div>



                      {/* Right Rack Ear */}

                      <div className="w-4 sm:w-5 bg-gradient-to-l from-[#182C47] to-[#101F33] rounded-sm border border-[#23426E] flex flex-col justify-around items-center py-4 shrink-0 shadow-inner">

                        {[0, 1, 2, 3].map((s) => (

                          <div

                            key={s}

                            className="w-2.5 h-2.5 rounded-full bg-[#081324] border border-[#3A5D8C] flex items-center justify-center shadow-inner"

                          >

                            <span className="w-1 h-1 rounded-full bg-[#182D4A]"></span>

                          </div>

                        ))}

                      </div>

                    </div>



                    {/* Bottom Chassis utility slots note */}

                    <div className="mt-2 text-center">

                      <span className="text-[9px] text-[#64748B] font-mono">

                        * Slot Utilitas &amp; Pendingin: Slot 30 - 32: Fan Tray 1-3 (Slot 31-33) &bull; Power Filter PFL-PSS (Slot 34-37) &bull; NFC (Slot 39)

                      </span>

                    </div>

                  </div>

                </div>



                {/* 2. SELECTED SLOT DETAILS CARD */}

                <div

                  className={`border rounded-xl p-4 shadow-md transition-colors ${

                    isDark ? "bg-[#091527] border-[#162F52]" : "bg-white border-slate-200"

                  }`}

                  onClick={(e) => e.stopPropagation()}

                >

                  {selectedSlot === null ? (

                    /* Initial state before any slot is clicked */

                    <div

                      className={`rounded-xl p-4 sm:p-5 text-center text-xs flex flex-col items-center justify-center gap-1.5 transition-colors ${

                        isDark ? "bg-[#071324] border border-[#162D4A] text-[#94A3B8]" : "bg-slate-50 border border-slate-200 text-slate-500"

                      }`}

                    >

                      <span className={`material-symbols-outlined text-2xl ${isDark ? "text-[#38BDF8]" : "text-blue-500"}`}>

                        touch_app

                      </span>

                      <p className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>

                        Pilih Slot untuk Melihat Rincian

                      </p>

                      <p className="text-[11px] max-w-md">

                        Klik salah satu slot pada rak visualizer Nokia 1830 PSS-24 di atas untuk menampilkan detail card, kapasitas port, serta transceiver SFP terpasang.

                      </p>

                    </div>

                  ) : (

                    <div>

                      {/* Slot Header */}

                      <div

                        className={`flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b gap-2 ${

                          isDark ? "border-[#142A4A]" : "border-slate-200"

                        }`}

                      >

                        <div>

                          <div className="flex items-center gap-2">

                            <span className="text-[11px] font-mono font-bold text-[#00E5FF] uppercase">

                              SHELF 1 : SLOT {selectedSlot}

                            </span>

                            {selectedCard ? (

                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">

                                {selectedCard.kondisi || "AKTIF"}

                              </span>

                            ) : (

                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">

                                KOSONG

                              </span>

                            )}

                            <button

                              type="button"

                              onClick={(e) => {

                                e.stopPropagation();

                                setSelectedSlot(null);

                              }}

                              title="Lepas pilihan slot"

                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer border ${

                                isDark

                                  ? "bg-[#0E2038] hover:bg-[#16365C] text-[#94A3B8] hover:text-[#00E5FF] border-[#1A3A63]"

                                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-300"

                              }`}

                            >

                              <span className="material-symbols-outlined text-[12px]">close</span>

                              <span>Lepas Pilihan</span>

                            </button>

                          </div>

                          <h4 className={`text-base font-bold mt-0.5 ${isDark ? "text-white" : "text-slate-800"}`}>

                            {selectedCard ? `${selectedCard.unit_type} ${selectedCard.desc || ""}` : "Slot Kosong (Tersedia)"}

                          </h4>

                        </div>



                        <p className={`text-[11px] font-mono ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>

                          {selectedCard ? (

                            <>

                              PN: <span className={isDark ? "text-white" : "text-slate-800 font-semibold"}>{selectedCard.unit_part_number || "-"}</span> &bull; SN:{" "}

                              <span className={isDark ? "text-[#38BDF8]" : "text-blue-600 font-bold"}>{selectedCard.serial_number || "-"}</span>

                            </>

                          ) : (

                            <span>Slot siap dipasang modul baru</span>

                          )}

                        </p>

                      </div>



                      {/* Capacity Indicators (Total Port, Terpakai, Sisa Port Tersedia) */}

                      {selectedCard && slotPortInfo.total > 0 && (

                        <div

                          className={`mt-2.5 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 border ${

                            isDark ? "bg-[#06101D] border-[#142A47]" : "bg-slate-50 border-slate-200"

                          }`}

                        >

                          <div className="flex items-center gap-2">

                            <span className={`text-xs font-bold tracking-wide ${isDark ? "text-white" : "text-slate-800"}`}>

                              Status Port Modul:

                            </span>

                            <span className={`text-xs ${isDark ? "text-[#94A3B8]" : "text-slate-600"}`}>

                              Kapasitas Fisik: <strong className={`font-mono ${isDark ? "text-white" : "text-slate-900"}`}>{slotPortInfo.total} Port</strong>

                            </span>

                          </div>



                          <div className="flex items-center gap-2.5 text-xs">

                            <span

                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border font-semibold ${

                                isDark

                                  ? "bg-[#0C223D] border-[#1A4575] text-[#38BDF8]"

                                  : "bg-blue-50 border-blue-200 text-blue-700"

                              }`}

                            >

                              <span className="w-1.5 h-1.5 rounded-full bg-[#1677FF]"></span>

                              Terpakai: {slotPortInfo.used} Port SFP

                            </span>



                            <span

                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border font-bold ${

                                isDark

                                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"

                                  : "bg-emerald-50 border border-emerald-200 text-emerald-700"

                              }`}

                            >

                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>

                              Sisa Tersedia: {slotPortInfo.remaining} Port Kosong

                            </span>

                          </div>

                        </div>

                      )}



                      {/* Section Label: Port & SFP Terpasang */}

                      <div className="mt-2 mb-2 flex items-center justify-between">

                        <span className={`text-xs font-bold tracking-wide ${isDark ? "text-white" : "text-slate-800"}`}>

                          Rincian Port &amp; Transceiver SFP

                        </span>

                        <span className={`text-[10px] ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>

                          SFP dicatat sebagai modul dengan Nomor Port

                        </span>

                      </div>



                      {/* Horizontal Port Cards Grid */}

                      {slotPortInfo.ports.length > 0 ? (

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">

                          {slotPortInfo.ports.map((p, idx) => (

                            <div

                              key={idx}

                              className={`rounded-xl p-2.5 border transition-all ${

                                p.isEmpty

                                  ? isDark

                                    ? "bg-[#060E1A]/80 border-dashed border-[#162942] text-[#64748B]"

                                    : "bg-slate-100/70 border-dashed border-slate-300 text-slate-500"

                                  : isDark

                                  ? "bg-[#0C1B30] border-[#1A385E] text-[#E2E8F0] hover:border-[#38BDF8]"

                                  : "bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-400 shadow-xs"

                              }`}

                            >

                              <div className="flex items-center justify-between">

                                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>

                                  {p.port}

                                </span>

                                {p.isEmpty ? (

                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${

                                    isDark ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-700 bg-emerald-50 border-emerald-200"

                                  }`}>

                                    Sisa

                                  </span>

                                ) : (

                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${

                                    isDark ? "text-cyan-300 bg-cyan-500/10 border-cyan-500/20" : "text-blue-700 bg-blue-50 border-blue-200"

                                  }`}>

                                    Aktif

                                  </span>

                                )}

                              </div>

                              <span

                                className={`text-xs font-semibold block mt-1 truncate ${

                                  p.isEmpty ? (isDark ? "text-slate-400" : "text-slate-500") : (isDark ? "text-white" : "text-slate-900")

                                }`}

                              >

                                {p.type}

                              </span>

                              <span className={`text-[10px] font-mono block mt-1 truncate ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>

                                {p.sn}

                              </span>

                            </div>

                          ))}

                        </div>

                      ) : (

                        <div

                          className={`rounded-xl p-4 border text-center text-xs ${

                            isDark ? "bg-[#071324] border-[#162D4A] text-[#64748B]" : "bg-slate-50 border-slate-200 text-slate-500"

                          }`}

                        >

                          {selectedCard

                            ? "Modul ini adalah modul matriks switch / controller tanpa port transceiver eksternal."

                            : "Slot ini dalam kondisi kosong dan siap dipasang modul baru."}

                        </div>

                      )}

                    </div>

                  )}

                </div>

              </div>



              {/* ============================================================ */}

              {/* RIGHT COLUMN: INFORMASI PERANGKAT ONLY                       */}

              {/* ============================================================ */}

              <div className="lg:col-span-4 flex flex-col gap-3.5">

                {/* 1. INFORMASI PERANGKAT CARD */}

                <div

                  className={`border rounded-xl p-4 sm:p-5 shadow-md flex-1 flex flex-col justify-between transition-colors ${

                    isDark ? "bg-[#091527] border-[#162F52]" : "bg-white border-slate-200"

                  }`}

                >

                  <div>

                    <div

                      className={`flex items-center justify-between pb-2.5 border-b mb-3 ${

                        isDark ? "border-[#142A4A]" : "border-slate-200"

                      }`}

                    >

                      <div className="flex items-center gap-2">

                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]"></span>

                        <h3 className={`text-xs sm:text-sm font-bold tracking-wide ${isDark ? "text-white" : "text-slate-800"}`}>

                          Informasi Perangkat

                        </h3>

                      </div>

                      <span

                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${

                          isDark ? "bg-[#0D2440] text-[#38BDF8] border-[#1A4170]" : "bg-blue-50 text-blue-700 border-blue-200"

                        }`}

                      >

                        GEN-PSS

                      </span>

                    </div>



                    {/* Pure Front View Subrack Model Card */}

                    <div

                      className={`w-full rounded-xl border p-3 flex flex-col items-center justify-center mb-4 transition-colors ${

                        isDark

                          ? "bg-gradient-to-b from-[#06101D] to-[#0B1A2F] border-[#163054] shadow-inner"

                          : "bg-slate-50 border-slate-200 shadow-xs"

                      }`}

                    >

                      <div

                        className={`relative w-full h-44 flex items-center justify-center rounded-xl overflow-hidden p-2 transition-colors ${

                          isDark

                            ? "bg-[#071527]/90 border border-[#00E5FF]/30 shadow-[0_0_20px_rgba(0,229,255,0.18)]"

                            : "bg-white border border-slate-200 shadow-sm"

                        }`}

                      >

                        <img

                          src={devicePhoto}

                          alt={isPalu1 ? "Tampak Depan Nokia 1830 PSS-24 STO Palu 1" : "Tampak Depan Nokia 1830 PSS-24 STO Palu 2"}

                          className="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-200 hover:scale-105"

                        />

                      </div>

                      <span className={`text-[11px] mt-2 font-bold ${isDark ? "text-[#38BDF8]" : "text-blue-700"}`}>

                        Tampak Depan Subrack: Nokia 1830 PSS-24 · {isPalu1 ? "STO Palu 1 (PLA)" : "STO Palu 2 (PLB)"}

                      </span>

                      <span className={`text-[9px] mt-0.5 ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>

                        {isPalu1 ? "Konfigurasi Dense Core (15 Card Aktif Terpasang)" : "Konfigurasi Aggregation (10 Card Aktif Terpasang)"}

                      </span>

                    </div>



                    {/* Specifications Table (Kode Site PLA / PLB & District PALU) */}

                    <div className="space-y-2 text-xs">

                      <div className={`flex items-center justify-between py-1 border-b ${isDark ? "border-[#12243C]" : "border-slate-100"}`}>

                        <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Hostname</span>

                        <span className={`font-bold font-mono ${isDark ? "text-white" : "text-slate-800"}`}>{hostname}</span>

                      </div>



                      <div className={`flex items-center justify-between py-1 border-b ${isDark ? "border-[#12243C]" : "border-slate-100"}`}>

                        <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Lokasi STO</span>

                        <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{stoName}</span>

                      </div>



                      {/* Kode Site (PLA / PLB) */}

                      <div className={`flex items-center justify-between py-1 border-b ${isDark ? "border-[#12243C]" : "border-slate-100"}`}>

                        <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Kode Site</span>

                        <span

                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${

                            isDark

                              ? "bg-[#0D2440] text-[#00E5FF] border-[#1A4170] shadow-[0_0_6px_rgba(0,229,255,0.2)]"

                              : "bg-blue-50 text-blue-700 border-blue-200"

                          }`}

                        >

                          {siteCode}

                        </span>

                      </div>



                      {/* District (Hanya PALU) */}

                      <div className={`flex items-center justify-between py-1 border-b ${isDark ? "border-[#12243C]" : "border-slate-100"}`}>

                        <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>District</span>

                        <span className={`font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{districtName}</span>

                      </div>



                      <div className={`flex items-center justify-between py-1 border-b ${isDark ? "border-[#12243C]" : "border-slate-100"}`}>

                        <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Koordinat Site</span>

                        <span className={`font-mono text-[11px] ${isDark ? "text-slate-300" : "text-slate-600 font-medium"}`}>

                          {coordinates}

                        </span>

                      </div>



                      <div className={`flex items-center justify-between py-1 border-b ${isDark ? "border-[#12243C]" : "border-slate-100"}`}>

                        <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Vendor &amp; Model</span>

                        <span className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}>Nokia (1830 PSS-24)</span>

                      </div>



                      <div className={`flex items-center justify-between py-1 border-b ${isDark ? "border-[#12243C]" : "border-slate-100"}`}>

                        <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Total Slot Depan</span>

                        <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>29 Slot Fisik</span>

                      </div>



                      <div className={`flex items-center justify-between py-1 border-b ${isDark ? "border-[#12243C]" : "border-slate-100"}`}>

                        <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Slot Utilitas Tambahan</span>

                        <span className={`font-medium ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>Slot 30 - 38 (Fan Tray, PF, NFC)</span>

                      </div>



                      <div className={`flex items-center justify-between py-1 border-b ${isDark ? "border-[#12243C]" : "border-slate-100"}`}>

                        <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Transceiver SFP</span>

                        <span className={`font-bold ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>

                          {deviceData.transceivers_count || transceivers.length || (isPalu1 ? 46 : 14)} SFP Aktif Terpasang

                        </span>

                      </div>



                      <div className={`flex items-center justify-between py-1 border-b ${isDark ? "border-[#12243C]" : "border-slate-100"}`}>

                        <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Status Operasional</span>

                        <span className="font-bold text-emerald-500">&bull; Normal / Aktif Online</span>

                      </div>



                      {/* Slot Card Occupancy Bar */}

                      <div className="pt-2">

                        <div className="flex items-center justify-between text-[11px] mb-1">

                          <span className={isDark ? "text-[#94A3B8]" : "text-slate-600 font-medium"}>

                            Okupansi Slot Card ({deviceData.occupied_slots || Object.keys(slotCardMap).length} / 29)

                          </span>

                          <span className={`font-bold ${isDark ? "text-[#00E5FF]" : "text-blue-600"}`}>

                            {deviceData.occupancy_rate || Math.round((Object.keys(slotCardMap).length / 29) * 1000) / 10}%

                          </span>

                        </div>

                        <div className={`w-full h-2 rounded-full overflow-hidden border ${isDark ? "bg-[#06101D] border-[#173052]" : "bg-slate-100 border-slate-200"}`}>

                          <div

                            className="h-full bg-gradient-to-r from-[#1677FF] to-[#00E5FF] rounded-full transition-all duration-500 shadow-[0_0_8px_#00E5FF]"

                            style={{ width: `${deviceData.occupancy_rate || Math.round((Object.keys(slotCardMap).length / 29) * 1000) / 10}%` }}

                          ></div>

                        </div>

                      </div>

                    </div>

                  </div>



                  <div className={`mt-4 pt-3 border-t text-[11px] flex items-center justify-between ${isDark ? "border-[#12243C] text-[#64748B]" : "border-slate-100 text-slate-500"}`}>

                    <span>Telekomunikasi Seluler Regional Palu</span>

                    <span className="text-emerald-500 font-semibold">&bull; Monitoring Aktif</span>

                  </div>

                </div>

              </div>

            </div>

          )}



          {/* ============================================================ */}

          {/* TAB 2: SLOT & MODUL (71 ITEMS) DENGAN SCROLLBAR SMOOTH       */}

          {/* ============================================================ */}

          {activeTab === "modules" && (

            <div className="p-4 sm:p-5 overflow-hidden flex-1 flex flex-col gap-3.5">

              {/* Filter controls */}

              <div

                className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors ${

                  isDark ? "bg-[#091527] border-[#142A4A]" : "bg-slate-50 border-slate-200"

                }`}

              >

                <div className="relative flex-1 max-w-md">

                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] ${isDark ? "text-[#64748B]" : "text-slate-400"}`}>

                    search

                  </span>

                  <input

                    type="text"

                    value={moduleSearch}

                    onChange={(e) => setModuleSearch(e.target.value)}

                    placeholder="Cari slot, port, tipe, atau serial number modul..."

                    className={`w-full h-9 pl-9 pr-3 rounded-lg border text-xs outline-none transition-colors ${

                      isDark

                        ? "bg-[#071324] border-[#162F52] text-white placeholder-[#64748B] focus:border-[#00E5FF]"

                        : "bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500"

                    }`}

                  />

                </div>



                <div className="flex items-center gap-2">

                  <button

                    type="button"

                    onClick={() => setModuleCategoryFilter("all")}

                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${

                      moduleCategoryFilter === "all"

                        ? "bg-[#1677FF] text-white shadow-sm"

                        : isDark

                        ? "bg-[#0C1B30] text-[#94A3B8] border border-[#1A385E] hover:text-white"

                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"

                    }`}

                  >

                    Semua ({allPositions.length > 0 ? allPositions.length : totalPositionCount})

                  </button>

                  <button

                    type="button"

                    onClick={() => setModuleCategoryFilter("card")}

                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${

                      moduleCategoryFilter === "card"

                        ? "bg-[#1677FF] text-white shadow-sm"

                        : isDark

                        ? "bg-[#0C1B30] text-[#94A3B8] border border-[#1A385E] hover:text-white"

                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"

                    }`}

                  >

                    Cards ({installedModules.length})

                  </button>

                  <button

                    type="button"

                    onClick={() => setModuleCategoryFilter("sfp")}

                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${

                      moduleCategoryFilter === "sfp"

                        ? "bg-[#1677FF] text-white shadow-sm"

                        : isDark

                        ? "bg-[#0C1B30] text-[#94A3B8] border border-[#1A385E] hover:text-white"

                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"

                    }`}

                  >

                    SFPs ({transceivers.length})

                  </button>

                </div>

              </div>



              {/* Table with Dedicated Scrollbar Container */}

              <div

                className={`rounded-xl border overflow-y-auto max-h-[500px] custom-scrollbar flex-1 shadow-sm transition-colors ${

                  isDark ? "bg-[#091527] border-[#142A4A]" : "bg-white border-slate-200"

                }`}

              >

                <table className="w-full text-left text-xs">

                  <thead

                    className={`uppercase text-[10px] tracking-wider border-b sticky top-0 z-10 ${

                      isDark

                        ? "bg-[#071221] text-[#94A3B8] border-[#142A4A]"

                        : "bg-slate-100 text-slate-700 border-slate-200"

                    }`}

                  >

                    <tr>

                      <th className="py-3 px-4">Slot</th>

                      <th className="py-3 px-4">Port</th>

                      <th className="py-3 px-4">Kategori</th>

                      <th className="py-3 px-4">Unit Type</th>

                      <th className="py-3 px-4 font-mono">Serial Number</th>

                      <th className="py-3 px-4 font-mono">Part Number</th>

                      <th className="py-3 px-4 text-center">Kondisi</th>

                      <th className="py-3 px-4 text-center">Aksi</th>

                    </tr>

                  </thead>

                  <tbody

                    className={`divide-y ${

                      isDark ? "divide-[#10243D] text-[#CBD5E1]" : "divide-slate-100 text-slate-700"

                    }`}

                  >

                    {filteredAllPositions.map((pos) => (

                      <tr

                        key={pos.position_id}

                        className={`transition-colors ${

                          isDark ? "hover:bg-[#0D1F38]" : "hover:bg-slate-50"

                        }`}

                      >

                        <td className={`py-2.5 px-4 font-mono font-bold ${isDark ? "text-white" : "text-slate-900"}`}>

                          #{pos.slot_number}

                        </td>

                        <td className={`py-2.5 px-4 font-mono ${isDark ? "text-[#38BDF8]" : "text-blue-600 font-semibold"}`}>

                          {pos.port !== "-" ? pos.port : "—"}

                        </td>

                        <td className="py-2.5 px-4">

                          <span

                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${

                              pos.kategori === "SFP"

                                ? isDark

                                  ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"

                                  : "bg-cyan-50 text-cyan-700 border-cyan-200"

                                : isDark

                                ? "bg-purple-500/15 text-purple-300 border-purple-500/30"

                                : "bg-purple-50 text-purple-700 border-purple-200"

                            }`}

                          >

                            {pos.kategori}

                          </span>

                        </td>

                        <td className={`py-2.5 px-4 font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>

                          {pos.unit_type}

                        </td>

                        <td className={`py-2.5 px-4 font-mono ${isDark ? "text-[#38BDF8]" : "text-blue-600 font-medium"}`}>

                          {pos.serial_number}

                        </td>

                        <td className={`py-2.5 px-4 font-mono ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>

                          {pos.unit_part_number}

                        </td>

                        <td className="py-2.5 px-4 text-center">

                          <span

                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${

                              isDark

                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"

                                : "bg-emerald-50 text-emerald-700 border-emerald-200"

                            }`}

                          >

                            {pos.kondisi}

                          </span>

                        </td>

                        <td className="py-2.5 px-4 text-center">

                          <button

                            type="button"

                            onClick={() => {

                              setSelectedSlot(parseInt(pos.slot_number, 10) || 1);

                              setActiveTab("chassis");

                            }}

                            className={`p-1 rounded transition-colors cursor-pointer ${

                              isDark

                                ? "hover:bg-[#16365C] text-[#38BDF8] hover:text-[#00E5FF]"

                                : "hover:bg-blue-50 text-blue-600 hover:text-blue-800"

                            }`}

                            title="Tampilkan di Chassis"

                          >

                            <span className="material-symbols-outlined text-[17px]">visibility</span>

                          </button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          )}



          {/* ============================================================ */}

          {/* MODAL FOOTER                                                 */}

          {/* ============================================================ */}

          <div

            className={`px-5 py-2.5 border-t flex items-center justify-between text-xs shrink-0 transition-colors ${

              isDark ? "bg-[#091527] border-[#142A4A] text-[#64748B]" : "bg-slate-50 border-slate-200 text-slate-500"

            }`}

          >

            <span>

              Subrack Chassis Model: <strong className={isDark ? "text-slate-300" : "text-slate-700"}>Nokia 1830 PSS-24 (High-Density Optical)</strong>

            </span>

            <button

              type="button"

              onClick={onClose}

              className={`px-5 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${

                isDark

                  ? "bg-[#0C1B30] hover:bg-[#132A4A] border-[#1A385E] text-white"

                  : "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"

              }`}

            >

              Tutup

            </button>

          </div>

        </div>

      </div>

    </ModalPortal>

  );

}

