import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import ModalPortal from "../components/ModalPortal";
import TableSortHeader from "../components/TableSortHeader";
import TablePagination from "../components/TablePagination";
import mutasiModulBanner from "../assets/mutasi_modul_banner.svg";

export default function ModuleMovementsPage({ user, searchValue, onSearchChange }) {
  const { isDark } = useTheme();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    filtered_total: 0,
    this_month_count: 0,
    unique_modules_moved: 0,
  });

  // Filter States
  const [jenisFilter, setJenisFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [metaDevices, setMetaDevices] = useState([]);

  // Dropdown States & Refs (mengikuti standar Halaman Perangkat & Audit Log)
  const [jenisDropdownOpen, setJenisDropdownOpen] = useState(false);
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const [perPageDropdownOpen, setPerPageDropdownOpen] = useState(false);
  const jenisDropdownRef = useRef(null);
  const deviceDropdownRef = useRef(null);
  const perPageDropdownRef = useRef(null);

  const jenisOptions = [
    { value: "all", label: "Semua Aktivitas" },
    { value: "pindah", label: "Pindah Posisi" },
    { value: "pasang", label: "Pasang Baru" },
    { value: "lepas", label: "Lepas Modul" },
  ];

  // Close dropdowns on click outside (mengikuti standar Halaman Perangkat & Audit Log)
  useEffect(() => {
    function handleClickOutside(e) {
      if (jenisDropdownRef.current && !jenisDropdownRef.current.contains(e.target)) {
        setJenisDropdownOpen(false);
      }
      if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(e.target)) {
        setDeviceDropdownOpen(false);
      }
      if (perPageDropdownRef.current && !perPageDropdownRef.current.contains(e.target)) {
        setPerPageDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Preset Mutasi dari URL Search Params (misal saat navigasi langsung dari tombol AR Scan)
  const [presetMutation, setPresetMutation] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const openModal = params.get("open_modal") || params.get("popup");
      const action = params.get("action");
      const moduleId = params.get("module_id");
      const sn = params.get("sn");
      const devId = params.get("device_id");
      const devName = params.get("device_name");
      const locName = params.get("location_name");
      const slotNo = params.get("slot_no");
      const unitType = params.get("unit_type");
      const kondisi = params.get("kondisi");

      if (openModal || moduleId || sn || (action && devId)) {
        return {
          open: true,
          action: action || "pindah",
          moduleId: moduleId || "",
          sn: sn || "",
          unitType: unitType || "",
          kondisi: kondisi || "AKTIF",
          deviceId: devId || "",
          deviceName: devName || "",
          locationName: locName || "",
          slotNo: slotNo || "",
        };
      }
    } catch (e) {
      console.error("Error reading URL search params for mutation:", e);
    }
    return null;
  });

  // Modal State: otomatis terbuka jika ada parameter preset dari AR Scan
  const [moveModalOpen, setMoveModalOpen] = useState(() => !!presetMutation?.open);
  const [toastMessage, setToastMessage] = useState(null);

  // Bersihkan search params dari URL agar refresh browser tidak membuka modal berulang
  useEffect(() => {
    if (presetMutation?.open) {
      try {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (e) {}
    }
  }, [presetMutation]);

  // Detail Modal State (Kolom Aksi Ikon Mata)
  const [selectedMovementDetail, setSelectedMovementDetail] = useState(null);

  // Local Search state synchronized with searchValue prop
  const [localSearch, setLocalSearch] = useState(searchValue || "");
  useEffect(() => {
    if (searchValue !== undefined && searchValue !== localSearch) {
      setLocalSearch(searchValue);
      setPage(1);
    }
  }, [searchValue]);

  const handleSearchChange = (val) => {
    setLocalSearch(val);
    setPage(1);
    if (onSearchChange) onSearchChange(val);
  };

  // Sorting & Pagination State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: key === "tanggal" ? "desc" : "asc" };
    });
  };

  // Filtered & Sorted movements
  const sortedMovements = useMemo(() => {
    let list = [...movements];
    if (localSearch) {
      const q = localSearch.toLowerCase().trim();
      list = list.filter((m) =>
        (m.serial_number && m.serial_number.toLowerCase().includes(q)) ||
        (m.unit_type && m.unit_type.toLowerCase().includes(q)) ||
        (m.unit_part_number && m.unit_part_number.toLowerCase().includes(q)) ||
        (m.actor_name && m.actor_name.toLowerCase().includes(q)) ||
        (m.from_hostname && m.from_hostname.toLowerCase().includes(q)) ||
        (m.to_hostname && m.to_hostname.toLowerCase().includes(q)) ||
        (m.from_location_name && m.from_location_name.toLowerCase().includes(q)) ||
        (m.to_location_name && m.to_location_name.toLowerCase().includes(q)) ||
        (m.keterangan && m.keterangan.toLowerCase().includes(q))
      );
    }
    if (sortConfig.key && sortConfig.direction) {
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      list.sort((a, b) => {
        let valA = a[sortConfig.key] || "";
        let valB = b[sortConfig.key] || "";
        if (sortConfig.key === "tanggal") {
          const tA = a.tanggal_iso ? new Date(a.tanggal_iso).getTime() : 0;
          const tB = b.tanggal_iso ? new Date(b.tanggal_iso).getTime() : 0;
          return (tA - tB) * dir;
        }
        return String(valA).localeCompare(String(valB), "id", { numeric: true }) * dir;
      });
    }
    return list;
  }, [movements, localSearch, sortConfig]);

  const totalCount = sortedMovements.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * perPage;
  const paginatedMovements = sortedMovements.slice(startIdx, startIdx + perPage);

  // Helper badge Aktivitas mengikuti standar warna Audit Log
  const renderAktivitasBadge = (jenis) => {
    const j = (jenis || "").toLowerCase();
    if (j === "pasang") {
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-50 dark:bg-[#0E5C43] text-emerald-700 dark:text-[#34D399] border border-emerald-200 dark:border-[#059669]/40 min-w-[84px]">
          <span className="material-symbols-outlined text-[13px]">add_circle</span>
          <span>PASANG</span>
        </span>
      );
    }
    if (j === "pindah") {
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-50 dark:bg-[#153B6B] text-blue-700 dark:text-[#38BDF8] border border-blue-200 dark:border-[#1677FF]/40 min-w-[84px]">
          <span className="material-symbols-outlined text-[13px]">sync_alt</span>
          <span>PINDAH</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-rose-50 dark:bg-[#4C121A] text-rose-700 dark:text-[#FB7185] border border-rose-200 dark:border-[#E11D48]/40 min-w-[84px]">
        <span className="material-symbols-outlined text-[13px]">remove_circle</span>
        <span>LEPAS</span>
      </span>
    );
  };

  const canMutate = user?.role === "admin" || user?.role === "karyawan_tif";

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchValue) params.append("q", searchValue);
      if (jenisFilter && jenisFilter !== "all") params.append("jenis", jenisFilter);
      if (deviceFilter) params.append("device_id", deviceFilter);

      const res = await fetch(`/api/module-movements?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setMovements(data.items || []);
        setStats({
          total: data.total || 0,
          filtered_total: data.filtered_total || 0,
          this_month_count: data.this_month_count || 0,
          unique_modules_moved: data.unique_modules_moved || 0,
        });
      } else {
        setError(data.error || "Gagal memuat riwayat mutasi modul.");
      }
    } catch (err) {
      console.error("Fetch movements error:", err);
      setError("Terjadi kesalahan jaringan saat memuat riwayat mutasi.");
    } finally {
      setLoading(false);
    }
  }, [searchValue, jenisFilter, deviceFilter]);

  // Load device options for filter dropdown
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch("/api/modules/meta");
        const data = await res.json();
        if (data.success) {
          setMetaDevices(data.palu_devices || data.all_devices || []);
        }
      } catch (err) {
        console.error("Load meta error:", err);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    fetchMovements();

    const handleFocus = () => {
      fetchMovements();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchMovements]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 !mt-0 w-full" style={{ marginTop: 0 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-xl backdrop-blur-md transition-all">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ── HEADER HERO BANNER MUTASI MODUL (STRICTLY LOCKED TO 120px MATCHING KELOLA USER & DASHBOARD) ── */}
      <div
        className={`relative overflow-hidden rounded-2xl border px-5 sm:px-6 h-[120px] min-h-[120px] max-h-[120px] flex items-center justify-between transition-all duration-300 shadow-sm w-full !mt-0 ${isDark
          ? "border-[#1E3A5F] bg-[#0A182B] shadow-2xl"
          : "border-slate-200 bg-white shadow-sm"
          }`}
        style={{ marginTop: 0, height: "120px", minHeight: "120px", maxHeight: "120px" }}
      >
        {/* Glow ambient background circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 w-full">
          {/* Sisi Kiri: Ikon Box & Teks Judul */}
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
            {/* Ikon Box Mengikuti Style Halaman Kelola User / Audit Log */}
            <div
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border ${isDark
                ? "bg-gradient-to-br from-[#1677FF]/40 to-[#0A2540] border-[#38BDF8]/40 shadow-[0_0_24px_rgba(22,119,255,0.45)] text-[#38BDF8]"
                : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm text-blue-600"
                }`}
            >
              <span className="material-symbols-outlined text-[26px] sm:text-[30px]">
                sync_alt
              </span>
            </div>

            <div>
              <h1
                className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 !m-0 ${isDark ? "text-white" : "text-slate-900"
                  }`}
              >
                Mutasi Modul
              </h1>
              <p
                className={`text-xs font-normal mt-0.5 leading-relaxed !m-0 whitespace-nowrap ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
              >
                Pencatatan perpindahan fisik modul secara langsung dan riwayat audit ledger.
              </p>
            </div>
          </div>

          {/* Tengah: Ilustrasi Vector SVG Banner Mutasi Modul Berukuran Besar & Rapi di Dalam Box 120px */}
          <div className="hidden md:flex items-center justify-center flex-1 px-2 select-none pointer-events-none h-full overflow-hidden">
            <img
              src={mutasiModulBanner}
              alt="Mutasi Modul Vector Illustration"
              className="h-[108px] lg:h-[114px] w-auto max-h-[114px] object-contain drop-shadow-[0_8px_20px_rgba(22,119,255,0.25)] dark:drop-shadow-[0_0_28px_rgba(56,189,248,0.5)] transition-all duration-300 pointer-events-none select-none"
            />
          </div>

          {/* Sisi Kanan: Primary Action Button (Catat Mutasi Modul) */}
          {canMutate && (
            <div className="shrink-0 w-full sm:w-auto flex justify-end">
              <button
                type="button"
                id="btn-catat-mutasi-modul"
                onClick={() => setMoveModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-[#1677FF] hover:bg-blue-600 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#1677FF]/25 hover:shadow-[#1677FF]/40 transition-all duration-150 cursor-pointer !m-0"
              >
                <span className="material-symbols-outlined text-[20px]">sync_alt</span>
                <span>Catat Mutasi Modul</span>
              </button>
            </div>
          )}
        </div>
      </div>


      {/* ── PANEL TABEL MUTASI MODUL (100% MENGIKUTI STYLE TABEL AUDIT LOG) ── */}
      <div
        className={`rounded-2xl border transition-all duration-300 overflow-visible w-full ${isDark
          ? "border-[#162F52] bg-[#0A182B] shadow-2xl"
          : "border-slate-200 bg-white shadow-sm"
          }`}
      >
        {/* Controls Toolbar: Search & Dropdowns */}
        <div
          className={`p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 border-b ${isDark ? "border-[#142D4C]" : "border-slate-100"
            }`}
        >
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] pointer-events-none ${isDark ? "text-[#64748B]" : "text-slate-400"
                }`}
            >
              search
            </span>
            <input
              type="text"
              id="movementSearchInput"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari serial number, perangkat, atau pelaksana..."
              className={`w-full h-11 pl-10 pr-9 rounded-xl border text-xs sm:text-sm outline-none transition-all duration-200 ease-in-out ${isDark
                ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] placeholder-[#4d6686] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white"
                }`}
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${isDark ? "text-[#64748B] hover:text-white" : "text-slate-400 hover:text-slate-700"
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Right Side: Filter Dropdowns & Refresh (Mengikuti Style Halaman Perangkat) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Dropdown 1: Semua Aktivitas */}
            <div className="relative min-w-[170px]" ref={jenisDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setJenisDropdownOpen(!jenisDropdownOpen);
                  setDeviceDropdownOpen(false);
                }}
                className={`relative w-full h-11 px-3.5 sm:px-4 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${isDark
                  ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                  : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500"
                  }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="material-symbols-outlined text-[18px] text-blue-500 dark:text-[#38BDF8] shrink-0">
                    bolt
                  </span>
                  <span className="truncate font-semibold">
                    {jenisOptions.find((j) => j.value === jenisFilter)?.label || "Semua Aktivitas"}
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${jenisDropdownOpen ? "rotate-180" : ""
                    }`}
                >
                  expand_more
                </span>
              </button>

              {/* Popup Menu Dropdown Aktivitas */}
              {jenisDropdownOpen && (
                <div
                  className={`absolute left-0 top-12 mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-40 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md ${isDark
                    ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                    : "bg-white border-slate-200 text-slate-800 shadow-xl"
                    }`}
                  style={{
                    backgroundColor: isDark ? "#0A182B" : "#FFFFFF",
                    borderColor: isDark ? "#1E3A5F" : "#E2E8F0",
                  }}
                >
                  {jenisOptions.map((opt, idx) => {
                    const isSelected = jenisFilter === opt.value;
                    return (
                      <React.Fragment key={opt.value}>
                        {idx === 1 && (
                          <div
                            className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"}`}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setJenisFilter(opt.value);
                            setJenisDropdownOpen(false);
                            setPage(1);
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
                          <span className="truncate pr-2">{opt.label}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[16px] shrink-0">
                              check
                            </span>
                          )}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter Dropdown 2: Semua Perangkat */}
            <div className="relative min-w-[190px]" ref={deviceDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setDeviceDropdownOpen(!deviceDropdownOpen);
                  setJenisDropdownOpen(false);
                }}
                className={`relative w-full h-11 px-3.5 sm:px-4 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${isDark
                  ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                  : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500"
                  }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="material-symbols-outlined text-[18px] text-blue-500 dark:text-[#38BDF8] shrink-0">
                    dns
                  </span>
                  <span className="truncate font-semibold">
                    {deviceFilter
                      ? metaDevices.find((d) => String(d.id) === String(deviceFilter))?.hostname ||
                      "Perangkat Terpilih"
                      : "Semua Perangkat"}
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${deviceDropdownOpen ? "rotate-180" : ""
                    }`}
                >
                  expand_more
                </span>
              </button>

              {/* Popup Menu Dropdown Perangkat */}
              {deviceDropdownOpen && (
                <div
                  className={`absolute left-0 top-12 mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-40 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md ${isDark
                    ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                    : "bg-white border-slate-200 text-slate-800 shadow-xl"
                    }`}
                  style={{
                    backgroundColor: isDark ? "#0A182B" : "#FFFFFF",
                    borderColor: isDark ? "#1E3A5F" : "#E2E8F0",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDeviceFilter("");
                      setDeviceDropdownOpen(false);
                      setPage(1);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${deviceFilter === ""
                      ? isDark
                        ? "bg-[#1677FF] text-white font-semibold"
                        : "bg-blue-600 text-white font-semibold"
                      : isDark
                        ? "hover:bg-[#122846] text-[#CBD5E1]"
                        : "hover:bg-slate-100 text-slate-700"
                      }`}
                  >
                    <span>Semua Perangkat</span>
                    {deviceFilter === "" && (
                      <span className="material-symbols-outlined text-[16px] shrink-0">
                        check
                      </span>
                    )}
                  </button>

                  <div className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"}`} />

                  {metaDevices.map((d) => {
                    const isSelected = String(deviceFilter) === String(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setDeviceFilter(String(d.id));
                          setDeviceDropdownOpen(false);
                          setPage(1);
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
                        <div className="truncate pr-2">
                          <span className="font-semibold">{d.hostname}</span>
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

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchMovements}
              title="Muat ulang data"
              className={`h-11 px-3.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${isDark
                ? "bg-[#0A182B] border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-[#1677FF]"
                : "bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900 hover:border-blue-500"
                }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin text-[#1677FF]" : ""}`}>
                refresh
              </span>
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {/* Table Container (Fixed Column Widths & Rounded Header to Match Audit Log Standard) */}
        <div className="overflow-x-auto custom-scrollbar rounded-t-xl">
          <table
            id="moduleMovementTable"
            className="w-full text-left border-collapse min-w-[1140px] table-fixed"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <colgroup>
              <col style={{ width: "3.5%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12.5%" }} />
              <col style={{ width: "12.5%" }} />
              <col style={{ width: "10.5%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "12.5%" }} />
              <col style={{ width: "4.5%" }} />
            </colgroup>
            <thead className={`rounded-t-xl ${isDark ? "bg-[#071426]" : "bg-slate-50"}`}>
              <tr
                className={`border-b text-[11px] font-bold uppercase tracking-wider ${isDark
                  ? "bg-[#071426] border-[#142D4C] text-[#94A3B8]"
                  : "bg-slate-50 border-slate-200 text-slate-600"
                  } rounded-t-xl`}
              >
                {/* No Index: Selaras Warna Biru & Sudut Kiri Melengkung */}
                <th
                  className="py-3 px-3 text-center select-none rounded-tl-xl"
                  style={{ width: "3.5%" }}
                >
                  <span className={`font-extrabold uppercase tracking-wider text-[11px] ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                    No
                  </span>
                </th>
                <th
                  onClick={() => handleSort("tanggal")}
                  className="py-3 px-3.5 text-left select-none cursor-pointer"
                  style={{ width: "12%" }}
                >
                  <TableSortHeader
                    title="WAKTU"
                    sortKey="tanggal"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                <th
                  onClick={() => handleSort("serial_number")}
                  className="py-3 px-3.5 text-left select-none cursor-pointer"
                  style={{ width: "11%" }}
                >
                  <TableSortHeader
                    title="SERIAL NUMBER"
                    sortKey="serial_number"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                {/* Kolom UNIT TYPE disamping kanan SERIAL NUMBER */}
                <th
                  onClick={() => handleSort("unit_type")}
                  className="py-3 px-3.5 text-left select-none cursor-pointer"
                  style={{ width: "10%" }}
                >
                  <TableSortHeader
                    title="UNIT TYPE"
                    sortKey="unit_type"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                {/* POSISI ASAL: 12.5% agar hostname single-line rapi pada zoom 100% */}
                <th
                  onClick={() => handleSort("from_hostname")}
                  className="py-3 px-3.5 text-left select-none cursor-pointer"
                  style={{ width: "12.5%" }}
                >
                  <TableSortHeader
                    title="POSISI ASAL"
                    sortKey="from_hostname"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                {/* POSISI TUJUAN: 12.5% agar hostname single-line rapi pada zoom 100% */}
                <th
                  onClick={() => handleSort("to_hostname")}
                  className="py-3 px-3.5 text-left select-none cursor-pointer"
                  style={{ width: "12.5%" }}
                >
                  <TableSortHeader
                    title="POSISI TUJUAN"
                    sortKey="to_hostname"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                {/* AKTIVITAS: 10.5% agar badge tidak mepet dengan Pelaksana */}
                <th
                  onClick={() => handleSort("jenis_perubahan")}
                  className="py-3 px-3 text-center select-none cursor-pointer"
                  style={{ width: "10.5%" }}
                >
                  <TableSortHeader
                    title="AKTIVITAS"
                    sortKey="jenis_perubahan"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="center"
                    isDark={isDark}
                  />
                </th>
                {/* PELAKSANA: 11% dengan pl-6 untuk jeda lega terhadap badge Aktivitas */}
                <th
                  onClick={() => handleSort("actor_name")}
                  className="py-3 pl-6 pr-3 text-left select-none cursor-pointer"
                  style={{ width: "11%" }}
                >
                  <TableSortHeader
                    title="PELAKSANA"
                    sortKey="actor_name"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                <th
                  onClick={() => handleSort("keterangan")}
                  className="py-3 px-3.5 text-left select-none cursor-pointer"
                  style={{ width: "12.5%" }}
                >
                  <TableSortHeader
                    title="KETERANGAN"
                    sortKey="keterangan"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                {/* Kolom AKSI: Selaras Warna Biru & Sudut Kanan Melengkung */}
                <th
                  className="py-3 px-3 text-center select-none rounded-tr-xl"
                  style={{ width: "4.5%" }}
                >
                  <span className={`font-extrabold uppercase tracking-wider text-[11px] ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                    AKSI
                  </span>
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y text-xs ${isDark ? "divide-[#0F2238]" : "divide-slate-100"
                }`}
            >
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl animate-spin text-[#1677FF]">
                        progress_activity
                      </span>
                      <span>Memuat riwayat mutasi modul...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="10" className="py-14 text-center text-rose-400">
                    <span className="material-symbols-outlined text-[36px] block mb-2">error</span>
                    <span>{error}</span>
                  </td>
                </tr>
              ) : paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-16 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[36px]">search_off</span>
                      <span className="font-medium">
                        {canMutate
                          ? "Belum ada riwayat mutasi modul. Klik 'Catat Mutasi Modul' di atas untuk memulai."
                          : "Tidak ada riwayat mutasi modul yang sesuai dengan pencarian."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((m, idx) => {
                  const rowNum = startIdx + idx + 1;
                  return (
                    <tr
                      key={m.movement_id || idx}
                      className={`transition-colors border-b ${isDark
                        ? "border-[#0F2238] hover:bg-[#0D2138]/80 text-[#E6EDF7]"
                        : "border-slate-100 hover:bg-slate-50/80 text-slate-800"
                        }`}
                    >
                      {/* # Index */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400 dark:text-[#64748B] text-xs font-semibold">
                        {rowNum}
                      </td>

                      {/* Waktu */}
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-[#CBD5E1] whitespace-nowrap">
                        {m.tanggal}
                      </td>

                      {/* SERIAL NUMBER */}
                      <td className="py-3 px-4">
                        <div className={`font-semibold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                          {m.serial_number}
                        </div>
                      </td>

                      {/* UNIT TYPE (Kolom Disamping Kanan Serial Number - Light & Dark Mode Adapted) */}
                      <td className="py-3 px-4">
                        <div className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                          {m.unit_type || "-"}
                        </div>
                        {m.unit_part_number && m.unit_part_number !== "-" && (
                          <div className={`text-[11px] font-mono mt-0.5 truncate ${isDark ? "text-[#38BDF8]" : "text-blue-600 font-medium"}`}>
                            {m.unit_part_number}
                          </div>
                        )}
                      </td>

                      {/* Posisi Asal */}
                      <td className="py-3 px-4">
                        {m.from_hostname !== "-" ? (
                          <div className="space-y-0.5">
                            <div className={`font-semibold whitespace-nowrap ${isDark ? "text-white" : "text-slate-900"}`}>
                              {m.from_hostname}
                            </div>
                            <div className={`text-[11px] font-mono whitespace-nowrap ${isDark ? "text-[#38BDF8]" : "text-blue-600 font-medium"}`}>
                              Slot {m.from_slot}
                              {m.from_shelf && m.from_shelf !== "-" && ` · Shelf ${m.from_shelf}`}
                              {m.from_port && m.from_port !== "-" && ` · Port ${m.from_port}`}
                            </div>
                            <div className={`text-[10px] whitespace-nowrap ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>
                              {m.from_location_name}
                            </div>
                          </div>
                        ) : (
                          <span className={`italic text-xs whitespace-nowrap ${isDark ? "text-[#64748B]" : "text-slate-400"}`}>
                            - (Pasang Baru)
                          </span>
                        )}
                      </td>

                      {/* Posisi Tujuan */}
                      <td className="py-3 px-4">
                        {m.to_hostname !== "-" ? (
                          <div className="space-y-0.5">
                            <div className={`font-semibold whitespace-nowrap ${isDark ? "text-white" : "text-slate-900"}`}>
                              {m.to_hostname}
                            </div>
                            <div className={`text-[11px] font-mono whitespace-nowrap ${isDark ? "text-[#38BDF8]" : "text-blue-600 font-medium"}`}>
                              Slot {m.to_slot}
                              {m.to_shelf && m.to_shelf !== "-" && ` · Shelf ${m.to_shelf}`}
                              {m.to_port && m.to_port !== "-" && ` · Port ${m.to_port}`}
                            </div>
                            <div className={`text-[10px] whitespace-nowrap ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>
                              {m.to_location_name}
                            </div>
                          </div>
                        ) : (
                          <span className={`italic text-xs whitespace-nowrap ${isDark ? "text-[#64748B]" : "text-slate-400"}`}>
                            - (Dilepas)
                          </span>
                        )}
                      </td>

                      {/* Aktivitas Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {renderAktivitasBadge(m.jenis_perubahan)}
                      </td>

                      {/* Pelaksana */}
                      <td className="py-3 pl-6 pr-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 truncate">
                          {(() => {
                            const isSelf = user && (user.name === m.actor_name || user.user_id === m.user_id);
                            const avatarSrc = (isSelf && user?.avatar_url) ? user.avatar_url : m.actor_avatar_url;
                            const initial = (m.actor_name && m.actor_name !== "-") ? m.actor_name.trim()[0].toUpperCase() : "U";

                            return (
                              <>
                                {avatarSrc ? (
                                  <div className="relative group shrink-0">
                                    <img
                                      src={avatarSrc}
                                      alt={m.actor_name || "Pelaksana"}
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        const fb = e.currentTarget.parentElement?.nextElementSibling;
                                        if (fb) fb.style.display = "flex";
                                      }}
                                      className="w-7 h-7 rounded-full object-cover object-top ring-1.5 ring-[#1677FF]/40 shadow-xs shrink-0 transition-transform duration-200 group-hover:scale-130 group-hover:z-20 group-hover:ring-2 group-hover:ring-[#1677FF]"
                                    />
                                  </div>
                                ) : null}
                                <div
                                  style={{ display: avatarSrc ? "none" : "flex" }}
                                  className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#1677FF] dark:text-[#38BDF8] border border-blue-200 dark:border-blue-700/50 items-center justify-center text-xs font-bold shrink-0"
                                >
                                  {initial}
                                </div>
                              </>
                            );
                          })()}
                          <span className="font-medium text-slate-800 dark:text-[#E6EDF7] truncate">
                            {m.actor_name}
                          </span>
                        </div>
                      </td>

                      {/* Keterangan */}
                      <td className="py-3 px-4 truncate text-slate-500 dark:text-[#94A3B8]" title={m.keterangan}>
                        {m.keterangan || "-"}
                      </td>

                      {/* Detail Action Button (Ikon Mata) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedMovementDetail(m)}
                          title="Lihat Detail Mutasi Modul"
                          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer mx-auto ${isDark
                            ? "border-[#1E3A5F] bg-[#071426] hover:bg-[#1677FF]/20 hover:border-[#1677FF] text-[#38BDF8]"
                            : "border-slate-300 bg-slate-50 hover:bg-blue-50 hover:border-blue-500 text-blue-600"
                            }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary & Pagination (Matching Audit Log) */}
        <TablePagination
          page={page}
          perPage={perPage}
          totalCount={totalCount}
          itemLabel="riwayat mutasi"
          onPageChange={setPage}
          onPerPageChange={(num) => {
            setPerPage(num);
            setPage(1);
          }}
          isDark={isDark}
        />
      </div>

      {/* ── MODAL DETAIL MUTASI MODUL (MATCHING AUDIT LOG DETAIL MODAL) ── */}
      {selectedMovementDetail && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div
              className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 ${isDark
                ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7]"
                : "border-slate-200 bg-white text-slate-800"
                }`}
            >
              {/* Modal Header */}
              <div
                className={`p-5 border-b flex items-center justify-between shrink-0 ${isDark ? "border-[#1E3A5F] bg-[#071426]" : "border-slate-200 bg-slate-50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isDark
                      ? "border-[#38BDF8]/40 bg-[#1677FF]/20 text-[#38BDF8]"
                      : "border-blue-200 bg-blue-50 text-blue-600"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </div>
                  <div>
                    <h3 className={`font-bold text-base leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>Detail Mutasi Modul</h3>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                      ID Mutasi #{selectedMovementDetail.movement_id} · Buku Besar Resmi Modul (Audit Ledger)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMovementDetail(null)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isDark
                    ? "hover:bg-[#1E3A5F] text-[#94A3B8] hover:text-white"
                    : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
                {/* 4 KPI Quick Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between ${isDark ? "border-[#1E3A5F] bg-[#071426]" : "border-slate-200 bg-slate-50"
                      }`}
                  >
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>
                      Waktu Mutasi
                    </span>
                    <span className={`font-mono text-xs font-semibold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                      {selectedMovementDetail.tanggal}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between ${isDark ? "border-[#1E3A5F] bg-[#071426]" : "border-slate-200 bg-slate-50"
                      }`}
                  >
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>
                      Jenis Aktivitas
                    </span>
                    <div className="mt-1">
                      {renderAktivitasBadge(selectedMovementDetail.jenis_perubahan)}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between ${isDark ? "border-[#1E3A5F] bg-[#071426]" : "border-slate-200 bg-slate-50"
                      }`}
                  >
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>
                      Pelaksana
                    </span>
                    <div className="flex items-center gap-2 mt-1 min-w-0">
                      {(() => {
                        const isSelf = user && (user.name === selectedMovementDetail.actor_name || user.user_id === selectedMovementDetail.user_id);
                        const avatarSrc = (isSelf && user?.avatar_url) ? user.avatar_url : selectedMovementDetail.actor_avatar_url;
                        const initial = (selectedMovementDetail.actor_name && selectedMovementDetail.actor_name !== "-")
                          ? selectedMovementDetail.actor_name.trim()[0].toUpperCase()
                          : "U";

                        return (
                          <>
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={selectedMovementDetail.actor_name || "Pelaksana"}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fb = e.currentTarget.nextElementSibling;
                                  if (fb) fb.style.display = "flex";
                                }}
                                className="w-9 h-9 rounded-full object-cover object-top ring-2 ring-[#1677FF] shadow-sm shrink-0"
                              />
                            ) : null}
                            <div
                              style={{ display: avatarSrc ? "none" : "flex" }}
                              className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#1677FF] dark:text-[#38BDF8] border border-blue-200 dark:border-blue-700/50 items-center justify-center text-xs font-bold shrink-0"
                            >
                              {initial}
                            </div>
                          </>
                        );
                      })()}
                      <span className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                        {selectedMovementDetail.actor_name}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between ${isDark ? "border-[#1E3A5F] bg-[#071426]" : "border-slate-200 bg-slate-50"
                      }`}
                  >
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>
                      Status Ledger
                    </span>
                    <span className={`text-xs font-bold mt-1 flex items-center gap-1 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      VALID
                    </span>
                  </div>
                </div>

                {/* Card Modul Hardware */}
                <div
                  className={`p-4 rounded-xl border space-y-2.5 ${isDark ? "border-[#1E3A5F] bg-[#071426]" : "border-slate-200 bg-slate-50"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                      <span className="material-symbols-outlined text-[16px]">memory</span>
                      Identitas Modul Fisik
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedMovementDetail.serial_number);
                        showToast(`Serial number ${selectedMovementDetail.serial_number} berhasil disalin!`);
                      }}
                      className={`text-[11px] hover:underline flex items-center gap-1 cursor-pointer font-medium ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}
                    >
                      <span className="material-symbols-outlined text-[13px]">content_copy</span>
                      Salin SN
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className={`text-[11px] font-medium ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>Serial Number:</span>
                      <p className={`font-mono text-sm font-bold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{selectedMovementDetail.serial_number}</p>
                    </div>
                    <div>
                      <span className={`text-[11px] font-medium ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>Tipe Modul:</span>
                      <p className={`text-xs font-semibold mt-0.5 ${isDark ? "text-slate-200" : "text-slate-900"}`}>{selectedMovementDetail.unit_type || "-"}</p>
                    </div>
                    <div>
                      <span className={`text-[11px] font-medium ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>Part Number:</span>
                      <p className={`font-mono text-xs font-medium mt-0.5 ${isDark ? "text-slate-300" : "text-slate-800"}`}>{selectedMovementDetail.unit_part_number || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Perbandingan Alur Perpindahan: Asal -> Tujuan */}
                <div
                  className={`p-4 rounded-xl border space-y-3 ${isDark ? "border-[#1E3A5F] bg-[#071426]" : "border-slate-200 bg-slate-50"
                    }`}
                >
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                    <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                    Perpindahan Posisi Fisik
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                    {/* Posisi Asal */}
                    <div
                      className={`p-3 rounded-xl border ${isDark ? "border-[#1E3A5F] bg-[#040C17]" : "border-slate-200 bg-white"
                        }`}
                    >
                      <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                        <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                        Posisi Asal
                      </div>
                      {selectedMovementDetail.from_hostname !== "-" ? (
                        <div className="space-y-1.5 text-xs">
                          <div>
                            <span className={`text-[10px] block font-medium ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>Perangkat (Hostname):</span>
                            <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{selectedMovementDetail.from_hostname}</span>
                            {selectedMovementDetail.from_device_name && selectedMovementDetail.from_device_name !== "-" && (
                              <span className={`text-[11px] block font-medium ${isDark ? "text-[#94A3B8]" : "text-slate-600"}`}>({selectedMovementDetail.from_device_name})</span>
                            )}
                          </div>
                          <div>
                            <span className={`text-[10px] block font-medium ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>Slot / Shelf / Port:</span>
                            <span className={`font-mono font-semibold ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                              Slot {selectedMovementDetail.from_slot}
                              {selectedMovementDetail.from_shelf && selectedMovementDetail.from_shelf !== "-" && ` · Shelf ${selectedMovementDetail.from_shelf}`}
                              {selectedMovementDetail.from_port && selectedMovementDetail.from_port !== "-" && ` · Port ${selectedMovementDetail.from_port}`}
                            </span>
                          </div>
                          <div>
                            <span className={`text-[10px] block font-medium ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>Lokasi:</span>
                            <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-800"}`}>{selectedMovementDetail.from_location_name || "-"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`py-4 text-center text-xs italic ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>
                          - Tidak ada posisi asal (Modul Baru Dipasang) -
                        </div>
                      )}
                    </div>

                    {/* Posisi Tujuan */}
                    <div
                      className={`p-3 rounded-xl border ${isDark ? "border-[#1E3A5F] bg-[#040C17]" : "border-slate-200 bg-white"
                        }`}
                    >
                      <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                        <span className="material-symbols-outlined text-[15px]">arrow_downward</span>
                        Posisi Tujuan
                      </div>
                      {selectedMovementDetail.to_hostname !== "-" ? (
                        <div className="space-y-1.5 text-xs">
                          <div>
                            <span className={`text-[10px] block font-medium ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>Perangkat (Hostname):</span>
                            <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{selectedMovementDetail.to_hostname}</span>
                            {selectedMovementDetail.to_device_name && selectedMovementDetail.to_device_name !== "-" && (
                              <span className={`text-[11px] block font-medium ${isDark ? "text-[#94A3B8]" : "text-slate-600"}`}>({selectedMovementDetail.to_device_name})</span>
                            )}
                          </div>
                          <div>
                            <span className={`text-[10px] block font-medium ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>Slot / Shelf / Port:</span>
                            <span className={`font-mono font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                              Slot {selectedMovementDetail.to_slot}
                              {selectedMovementDetail.to_shelf && selectedMovementDetail.to_shelf !== "-" && ` · Shelf ${selectedMovementDetail.to_shelf}`}
                              {selectedMovementDetail.to_port && selectedMovementDetail.to_port !== "-" && ` · Port ${selectedMovementDetail.to_port}`}
                            </span>
                          </div>
                          <div>
                            <span className={`text-[10px] block font-medium ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>Lokasi:</span>
                            <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-800"}`}>{selectedMovementDetail.to_location_name || "-"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`py-4 text-center text-xs italic ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>
                          - Tidak ada posisi tujuan (Modul Dilepas dari Sistem) -
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Keterangan */}
                <div
                  className={`p-3.5 rounded-xl border ${isDark ? "border-[#1E3A5F] bg-[#071426]" : "border-slate-200 bg-slate-50"
                    }`}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? "text-[#64748B]" : "text-slate-500"}`}>
                    Keterangan / Alasan Mutasi
                  </span>
                  <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    {selectedMovementDetail.keterangan || "-"}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className={`p-4 border-t flex items-center justify-end ${isDark ? "border-[#1E3A5F] bg-[#071426]" : "border-slate-200 bg-slate-50"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedMovementDetail(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1677FF] hover:bg-blue-600 text-white transition-all cursor-pointer shadow-md"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: CATAT MUTASI MODUL */}
      {moveModalOpen && (
        <CreateDirectMutationModal
          initialData={presetMutation}
          onClose={() => {
            setMoveModalOpen(false);
            setPresetMutation(null);
          }}
          onSuccess={(msg) => {
            setMoveModalOpen(false);
            setPresetMutation(null);
            showToast(msg);
            fetchMovements();
          }}
        />
      )}
    </div>
  );
}

// ==============================================================
// MODAL: FORM MUTASI MODUL LANGSUNG
// ==============================================================
function CreateDirectMutationModal({ onClose, onSuccess, initialData }) {
  const { isDark } = useTheme();
  const [modules, setModules] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form states - jika dipanggil dari AR Scan, otomatis pre-fill modul dan asal
  const [selectedModuleId, setSelectedModuleId] = useState(initialData?.moduleId || "");
  const [toDeviceId, setToDeviceId] = useState(() => {
    if (initialData?.action === "pasang" && initialData?.deviceId) {
      return String(initialData.deviceId);
    }
    return "";
  });
  const [toSlot, setToSlot] = useState(() => {
    if (initialData?.action === "pasang" && initialData?.slotNo) {
      return String(initialData.slotNo);
    }
    return "";
  });
  const [toShelf, setToShelf] = useState("1");
  const [toPort, setToPort] = useState("");
  const [mutationDate, setMutationDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [keterangan, setKeterangan] = useState(() => {
    if (initialData?.deviceName && initialData?.slotNo) {
      return `Mutasi modul dari ${initialData.deviceName} (Slot #${initialData.slotNo}) via AR Digital Twin`;
    }
    if (initialData?.slotNo) {
      return `Mutasi modul dari Slot #${initialData.slotNo} via AR Digital Twin`;
    }
    return "";
  });

  // Custom Dropdowns states & refs (mengikuti style Halaman Perangkat)
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const [moduleSearchInput, setModuleSearchInput] = useState("");
  const moduleDropdownRef = useRef(null);
  const moduleInputRef = useRef(null);
  const deviceDropdownRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Selected module detail
  const selectedModule = useMemo(() => {
    if (!selectedModuleId) return null;
    return modules.find((m) => String(m.modul_id) === String(selectedModuleId));
  }, [selectedModuleId, modules]);

  // Close dropdowns when clicked outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(e.target)) {
        setModuleDropdownOpen(false);
        // Reset input text to selected module or empty if not selected
        if (selectedModule) {
          setModuleSearchInput(`${selectedModule.serial_number} — ${selectedModule.unit_type} (${selectedModule.ne_name || "Perangkat"}, Slot ${selectedModule.slot || "-"})`);
        } else {
          setModuleSearchInput("");
        }
      }
      if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(e.target)) {
        setDeviceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedModule]);

  // Load active modules and devices
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const [modRes, devRes] = await Promise.all([
          fetch("/api/modules?all=1"),
          fetch("/api/devices?all=1"),
        ]);
        const modData = await modRes.json();
        const devData = await devRes.json();

        let loadedMods = [];
        if (modData.success) {
          loadedMods = modData.items || [];
        }
        if (devData.success) {
          setDevices(devData.items || []);
        }

        // AUTO-SELECT MODUL JIKA ADA PRESET DARI AR SCAN
        if (initialData) {
          let matchedMod = null;
          if (initialData.moduleId) {
            matchedMod = loadedMods.find((m) => String(m.modul_id) === String(initialData.moduleId));
          }
          if (!matchedMod && initialData.sn) {
            const cleanSn = String(initialData.sn).trim().toLowerCase();
            matchedMod = loadedMods.find((m) => String(m.serial_number || "").trim().toLowerCase() === cleanSn);
          }
          if (!matchedMod && initialData.deviceId && initialData.slotNo) {
            matchedMod = loadedMods.find((m) =>
              String(m.device_id) === String(initialData.deviceId) &&
              String(m.slot) === String(initialData.slotNo)
            );
          }

          // Jika modul belum terdaftar di daftar API namun info dari AR scan valid, buat sintetis
          if (!matchedMod && (initialData.moduleId || initialData.sn)) {
            matchedMod = {
              modul_id: Number(initialData.moduleId) || Date.now(),
              serial_number: initialData.sn || `MOD-${initialData.moduleId}`,
              unit_type: initialData.unitType || "Modul Fisik",
              ne_name: initialData.deviceName || "Perangkat Asal",
              location_name: initialData.locationName || "STO Palu",
              slot: initialData.slotNo || "-",
              shelf: "1",
              port: "-",
              kondisi: initialData.kondisi || "AKTIF",
              device_id: initialData.deviceId,
            };
            loadedMods = [matchedMod, ...loadedMods];
          }

          if (matchedMod) {
            setSelectedModuleId(String(matchedMod.modul_id));
            setModuleSearchInput(
              `${matchedMod.serial_number} — ${matchedMod.unit_type} (${matchedMod.ne_name || "Perangkat"}, Slot ${matchedMod.slot || "-"})`
            );
          }
        }

        setModules(loadedMods);
      } catch (err) {
        console.error("Load modal data error:", err);
        setError("Gagal memuat daftar modul atau perangkat.");
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, [initialData]);

  // Sync moduleSearchInput if selectedModuleId changes externally
  useEffect(() => {
    if (!selectedModuleId) {
      setModuleSearchInput("");
    } else if (selectedModule) {
      setModuleSearchInput(`${selectedModule.serial_number} — ${selectedModule.unit_type} (${selectedModule.ne_name || "Perangkat"}, Slot ${selectedModule.slot || "-"})`);
    }
  }, [selectedModuleId, selectedModule]);

  // Dynamic filter for modules based on user typing
  const filteredModules = useMemo(() => {
    const q = moduleSearchInput.trim().toLowerCase();
    if (!q) return modules;
    if (selectedModule && moduleSearchInput === `${selectedModule.serial_number} — ${selectedModule.unit_type} (${selectedModule.ne_name || "Perangkat"}, Slot ${selectedModule.slot || "-"})`) {
      return modules;
    }
    return modules.filter((m) => {
      const sn = (m.serial_number || "").toLowerCase();
      const ut = (m.unit_type || "").toLowerCase();
      const ne = (m.ne_name || "").toLowerCase();
      const loc = (m.location_name || "").toLowerCase();
      const slot = String(m.slot || "").toLowerCase();
      return sn.includes(q) || ut.includes(q) || ne.includes(q) || loc.includes(q) || slot.includes(q);
    });
  }, [modules, moduleSearchInput, selectedModule]);

  // Selected device detail
  const selectedDevice = useMemo(() => {
    if (!toDeviceId) return null;
    return devices.find((d) => String(d.device_id) === String(toDeviceId));
  }, [toDeviceId, devices]);

  // Is transceiver check
  const isTransceiver = useMemo(() => {
    if (!selectedModule) return false;
    const t = (selectedModule.unit_type || "").toUpperCase();
    const tokens = ["SFP", "QSFP", "CFP", "XFP", "Q28", "C4A", "C2D", "DCO", "ACO"];
    return tokens.some((tok) => t.includes(tok));
  }, [selectedModule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedModuleId) return setError("Silakan pilih modul yang akan dipindahkan.");
    if (!toDeviceId) return setError("Silakan pilih perangkat tujuan.");
    if (!toSlot.trim()) return setError("Nomor slot tujuan wajib diisi.");
    if (isTransceiver && !toPort.trim()) {
      return setError(`Modul '${selectedModule.unit_type}' adalah Transceiver optik dan wajib memiliki nomor Port.`);
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/modules/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: Number(selectedModuleId),
          to_device_id: Number(toDeviceId),
          to_slot: toSlot.trim(),
          to_shelf: toShelf.trim() || "1",
          to_port: toPort.trim(),
          date: mutationDate,
          keterangan: keterangan.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message || "Mutasi modul berhasil dicatat.");
      } else {
        setError(data.error || "Gagal mencatat mutasi modul.");
      }
    } catch (err) {
      console.error("Submit move error:", err);
      setError("Terjadi kesalahan jaringan saat mencatat mutasi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div className={`relative w-full max-w-xl rounded-2xl shadow-2xl p-6 my-8 transition-colors ${isDark
            ? "bg-[#0D1F36] border border-[#1E3A5F] text-white"
            : "bg-white border border-slate-200 text-slate-800 shadow-2xl"
          }`}>
          {/* Header */}
          <div className={`flex items-center justify-between pb-4 border-b ${isDark ? "border-[#1A2E4C]" : "border-slate-200"
            }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#1677FF]/15 border border-[#1677FF]/30 text-[#38BDF8] flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">sync_alt</span>
              </div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Catat Mutasi Modul Fisik
                </h2>
                <p className={`text-xs ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                  Pencatatan langsung perpindahan modul tanpa approval
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark
                  ? "text-[#94A3B8] hover:text-white hover:bg-[#1A2E4C]"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                }`}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-rose-400">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Banner Notifikasi Auto-Fill dari AR Scan */}
          {initialData && (
            <div className="mt-4 p-3 rounded-xl bg-[#1677FF]/15 border border-[#1677FF]/30 text-[#38BDF8] text-xs flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-[20px] text-[#00E5FF] shrink-0">view_in_ar</span>
                <span className="truncate">
                  Terisi otomatis dari <strong>AR Digital Twin</strong>: Modul{" "}
                  <strong className="text-white font-mono">{initialData.sn || "Terpilih"}</strong>
                  {initialData.slotNo && ` (Slot #${initialData.slotNo})`}. Silakan tentukan <strong>perangkat tujuan</strong> mutasi di bawah.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1677FF]/40 text-white shrink-0 border border-blue-400/30">
                Auto-Filled
              </span>
            </div>
          )}

          {loadingInitial ? (
            <div className="py-12 text-center text-xs text-[#38BDF8]">
              <span className="material-symbols-outlined animate-spin text-[24px] block mb-2">progress_activity</span>
              <span>Memuat data modul & perangkat...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* 1. PILIH MODUL (Menggunakan Custom Dropdown Style Halaman Perangkat) */}
              <div className="relative" ref={moduleDropdownRef}>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                  }`}>
                  Pilih Modul yang Dipindahkan *
                </label>

                {/* Searchable Combobox Container Box (Bisa input teks + tetap ada popup filter) */}
                <div
                  onClick={() => {
                    setModuleDropdownOpen(true);
                    setDeviceDropdownOpen(false);
                    moduleInputRef.current?.focus();
                  }}
                  className={`relative w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-text ${moduleDropdownOpen
                      ? isDark
                        ? "bg-[#0A182B] border-2 border-[#1677FF] text-[#E6EDF7] shadow-[0_0_12px_rgba(22,119,255,0.25)]"
                        : "bg-white border-2 border-blue-600 text-slate-900 shadow-sm"
                      : isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0A182B]"
                        : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500"
                    }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                    <span className="material-symbols-outlined text-[19px] text-[#38BDF8] shrink-0 pointer-events-none">
                      memory
                    </span>
                    <input
                      ref={moduleInputRef}
                      type="text"
                      value={moduleSearchInput}
                      onChange={(e) => {
                        setModuleSearchInput(e.target.value);
                        if (!moduleDropdownOpen) setModuleDropdownOpen(true);
                        if (!e.target.value.trim()) {
                          setSelectedModuleId("");
                        }
                      }}
                      onFocus={() => {
                        setModuleDropdownOpen(true);
                        setDeviceDropdownOpen(false);
                      }}
                      placeholder="-- Cari / Ketik serial number, unit type, perangkat... --"
                      className={`w-full bg-transparent outline-none text-xs font-medium placeholder:font-normal ${isDark
                          ? "text-white placeholder-[#94A3B8]"
                          : "text-slate-900 placeholder-slate-400"
                        }`}
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {moduleSearchInput && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedModuleId("");
                          setModuleSearchInput("");
                          setModuleDropdownOpen(true);
                          moduleInputRef.current?.focus();
                        }}
                        title="Hapus pencarian / pilihan"
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isDark
                            ? "text-slate-400 hover:text-white hover:bg-slate-700"
                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                          }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModuleDropdownOpen(!moduleDropdownOpen);
                        setDeviceDropdownOpen(false);
                        if (!moduleDropdownOpen) {
                          moduleInputRef.current?.focus();
                        }
                      }}
                      className="w-6 h-6 flex items-center justify-center cursor-pointer"
                    >
                      <span
                        className={`material-symbols-outlined text-[19px] transition-transform duration-200 ${moduleDropdownOpen
                            ? "rotate-180 text-[#38BDF8]"
                            : isDark ? "text-[#94A3B8]" : "text-slate-400"
                          }`}
                      >
                        expand_more
                      </span>
                    </button>
                  </div>
                </div>

                {/* Popup Menu Filter Modul */}
                {moduleDropdownOpen && (
                  <div
                    className={`absolute left-0 top-full mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-50 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md ${isDark
                        ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                        : "bg-white border-slate-200 text-slate-800 shadow-xl"
                      }`}
                    style={{
                      backgroundColor: isDark ? "#0A182B" : "#FFFFFF",
                      borderColor: isDark ? "#1E3A5F" : "#E2E8F0",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedModuleId("");
                        setModuleSearchInput("");
                        setModuleDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${selectedModuleId === ""
                          ? isDark
                            ? "bg-[#1677FF] text-white font-semibold"
                            : "bg-blue-600 text-white font-semibold"
                          : isDark
                            ? "hover:bg-[#122846] text-[#CBD5E1]"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                    >
                      <span>-- Pilih Modul Aktif --</span>
                      {selectedModuleId === "" && (
                        <span className="material-symbols-outlined text-[16px] shrink-0">check</span>
                      )}
                    </button>

                    <div className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"}`} />

                    {filteredModules.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                        <span className="material-symbols-outlined text-[20px] text-slate-500">search_off</span>
                        <span>Tidak ada modul yang cocok dengan kata kunci</span>
                      </div>
                    ) : (
                      filteredModules.map((m) => {
                        const isSelected = String(selectedModuleId) === String(m.modul_id);
                        return (
                          <button
                            key={m.modul_id}
                            type="button"
                            onClick={() => {
                              setSelectedModuleId(String(m.modul_id));
                              setModuleSearchInput(`${m.serial_number} — ${m.unit_type} (${m.ne_name || "Perangkat"}, Slot ${m.slot || "-"})`);
                              setModuleDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${isSelected
                                ? isDark
                                  ? "bg-[#1677FF] text-white font-semibold shadow-sm"
                                  : "bg-blue-600 text-white font-semibold shadow-sm"
                                : isDark
                                  ? "hover:bg-[#122846] text-[#CBD5E1]"
                                  : "hover:bg-slate-100 text-slate-700"
                              }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-semibold font-mono">{m.serial_number}</span>
                              <span className={`mx-1.5 ${isSelected ? "text-white/80" : "text-[#94A3B8]"}`}>—</span>
                              <span className={`font-semibold ${isSelected ? "text-white" : isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                                {m.unit_type}
                              </span>
                              <span className={`text-[11px] ml-1.5 ${isSelected ? "text-white/80" : isDark ? "text-slate-400" : "text-slate-500"}`}>
                                ({m.ne_name || "Perangkat"}, Slot {m.slot || "-"})
                              </span>
                            </div>
                            {isSelected && (
                              <span className="material-symbols-outlined text-[16px] shrink-0">check</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* INFO POSISI ASAL (READ-ONLY) */}
              {selectedModule && (
                <div className={`p-3 rounded-xl border space-y-1 ${isDark
                    ? "bg-[#071426] border-[#1E3A5F]"
                    : "bg-blue-50/70 border-blue-200"
                  }`}>
                  <div className="text-[11px] font-semibold text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span>Posisi Asal Saat Ini:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Perangkat:</span>{" "}
                      <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{selectedModule.ne_name || "-"}</span>
                    </div>
                    <div>
                      <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Lokasi:</span>{" "}
                      <span className={isDark ? "text-white" : "text-slate-900"}>{selectedModule.location_name || "-"}</span>
                    </div>
                    <div>
                      <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Slot:</span>{" "}
                      <span className={`font-mono ${isDark ? "text-white" : "text-slate-900"}`}>{selectedModule.slot || "-"}</span>
                    </div>
                    <div>
                      <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Shelf / Port:</span>{" "}
                      <span className={`font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                        {selectedModule.shelf || "1"} / {selectedModule.port || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. PILIH PERANGKAT TUJUAN (Menggunakan Custom Dropdown Style Halaman Perangkat) */}
              <div className="relative" ref={deviceDropdownRef}>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                  }`}>
                  Perangkat Tujuan *
                </label>

                {/* Dropdown Container Box Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setDeviceDropdownOpen(!deviceDropdownOpen);
                    setModuleDropdownOpen(false);
                  }}
                  className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${deviceDropdownOpen
                      ? isDark
                        ? "bg-[#0A182B] border-2 border-[#1677FF] text-[#E6EDF7] shadow-[0_0_12px_rgba(22,119,255,0.25)]"
                        : "bg-white border-2 border-blue-600 text-slate-900 shadow-sm"
                      : isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0A182B]"
                        : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500"
                    }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span className="material-symbols-outlined text-[19px] text-[#38BDF8] shrink-0">
                      dns
                    </span>
                    <span className={`truncate ${selectedDevice
                        ? isDark ? "font-semibold text-white" : "font-semibold text-slate-900"
                        : isDark ? "text-[#94A3B8]" : "text-slate-400"
                      }`}>
                      {selectedDevice
                        ? `${selectedDevice.hostname || selectedDevice.nama_perangkat}${selectedDevice.lokasi ? ` (${selectedDevice.lokasi})` : ""}`
                        : "-- Pilih Perangkat Tujuan --"}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[19px] transition-transform duration-200 shrink-0 ${deviceDropdownOpen
                        ? "rotate-180 text-[#38BDF8]"
                        : isDark ? "text-[#94A3B8]" : "text-slate-400"
                      }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Popup Menu Filter Perangkat */}
                {deviceDropdownOpen && (
                  <div
                    className={`absolute left-0 top-full mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-50 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md ${isDark
                        ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                        : "bg-white border-slate-200 text-slate-800 shadow-xl"
                      }`}
                    style={{
                      backgroundColor: isDark ? "#0A182B" : "#FFFFFF",
                      borderColor: isDark ? "#1E3A5F" : "#E2E8F0",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setToDeviceId("");
                        setDeviceDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${toDeviceId === ""
                          ? isDark
                            ? "bg-[#1677FF] text-white font-semibold"
                            : "bg-blue-600 text-white font-semibold"
                          : isDark
                            ? "hover:bg-[#122846] text-[#CBD5E1]"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                    >
                      <span>-- Pilih Perangkat Tujuan --</span>
                      {toDeviceId === "" && (
                        <span className="material-symbols-outlined text-[16px] shrink-0">check</span>
                      )}
                    </button>

                    <div className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"}`} />

                    {devices.length === 0 ? (
                      <div className="px-3 py-3 text-center text-xs text-slate-400">
                        Tidak ada perangkat tujuan tersedia
                      </div>
                    ) : (
                      devices.map((d) => {
                        const isSelected = String(toDeviceId) === String(d.device_id);
                        return (
                          <button
                            key={d.device_id}
                            type="button"
                            onClick={() => {
                              setToDeviceId(String(d.device_id));
                              setDeviceDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${isSelected
                                ? isDark
                                  ? "bg-[#1677FF] text-white font-semibold shadow-sm"
                                  : "bg-blue-600 text-white font-semibold shadow-sm"
                                : isDark
                                  ? "hover:bg-[#122846] text-[#CBD5E1]"
                                  : "hover:bg-slate-100 text-slate-700"
                              }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-semibold">{d.hostname || d.nama_perangkat}</span>
                              {d.lokasi && (
                                <span className={`text-[11px] ml-1.5 ${isSelected ? "text-white/80" : isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                                  ({d.lokasi})
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <span className="material-symbols-outlined text-[16px] shrink-0">check</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* 3. POSISI TUJUAN (SLOT, SHELF, PORT) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                    }`}>
                    Nomor Slot Tujuan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 17"
                    value={toSlot}
                    onChange={(e) => setToSlot(e.target.value)}
                    className={`w-full h-10 px-3 rounded-xl border text-xs font-mono focus:outline-none focus:border-[#1677FF] transition-all ${isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                      }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                    }`}>
                    Shelf Tujuan
                  </label>
                  <input
                    type="text"
                    placeholder="1"
                    value={toShelf}
                    onChange={(e) => setToShelf(e.target.value)}
                    className={`w-full h-10 px-3 rounded-xl border text-xs font-mono focus:outline-none focus:border-[#1677FF] transition-all ${isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                      }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                    }`}>
                    Port {isTransceiver && <span className="text-amber-400 font-bold">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={isTransceiver ? "Wajib (misal: 1)" : "Opsional"}
                    value={toPort}
                    onChange={(e) => setToPort(e.target.value)}
                    className={`w-full h-10 px-3 rounded-xl border text-xs font-mono focus:outline-none focus:border-[#1677FF] transition-all ${isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                      }`}
                  />
                </div>
              </div>

              {isTransceiver && (
                <p className="text-[11px] text-amber-300/80 -mt-2">
                  * Tipe modul ini adalah transceiver optik dan memerlukan nomor port yang valid.
                </p>
              )}

              {/* 4. TANGGAL MUTASI */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                  }`}>
                  Tanggal Mutasi Fisik
                </label>
                <input
                  type="date"
                  value={mutationDate}
                  onChange={(e) => setMutationDate(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl border text-xs font-mono focus:outline-none focus:border-[#1677FF] transition-all cursor-pointer ${isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white [color-scheme:dark]"
                      : "bg-slate-50 border-slate-300 text-slate-900 [color-scheme:light]"
                    }`}
                />
              </div>

              {/* 5. KETERANGAN / ALASAN */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                  }`}>
                  Keterangan / Alasan Mutasi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Optimalisasi kapasitas STO Palu"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl border text-xs focus:outline-none focus:border-[#1677FF] transition-all ${isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
                      : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                    }`}
                />
              </div>

              {/* ACTIONS */}
              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? "border-[#1A2E4C]" : "border-slate-200"
                }`}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${isDark
                      ? "border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:bg-[#1A2E4C]"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1677FF] hover:bg-[#1466de] text-white shadow-lg shadow-[#1677FF]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting && (
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  )}
                  <span>Simpan Mutasi</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
