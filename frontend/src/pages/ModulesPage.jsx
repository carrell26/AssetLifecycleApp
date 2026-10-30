import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import statModule from "../assets/stat_module.jpg";
import statDevice from "../assets/stat_device.jpg";
import statLocation from "../assets/stat_location.jpg";
import TableSortHeader from "../components/TableSortHeader";
import TablePagination from "../components/TablePagination";
import ModalPortal from "../components/ModalPortal";
import { sortData } from "../utils/sortUtils";

// Helper konversi format tanggal
function toInputDateFormat(dateStr) {
  if (!dateStr || dateStr === "-") {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const dd = parts[0].padStart(2, "0");
      const mm = parts[1].padStart(2, "0");
      const yyyy = parts[2];
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  return dateStr;
}

const moduleColumnTypes = {
  ne_name: "text",
  unit_type: "text",
  category: "text",
  location_name: "text",
  shelf: "number",
  slot: "number",
  port: "number",
  unit_part_number: "text",
  serial_number: "text",
  date_str: "date",
};

const moduleColumnNames = {
  ne_name: "Nama Perangkat",
  unit_type: "Unit Type",
  category: "Kategori",
  location_name: "Lokasi",
  shelf: "Shelf",
  slot: "Slot",
  port: "Port",
  unit_part_number: "Unit Part Number",
  serial_number: "Serial Number",
  date_str: "Date",
};

export default function ModulesPage({ user, searchValue, onSearchChange }) {
  const { isDark } = useTheme();

  // Data states
  const [allModules, setAllModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_modules: 0,
    total_devices: 0,
    total_locations: 0,
  });
  const [scopeInfo, setScopeInfo] = useState("Fokus inventaris STO PALU 1 & STO PALU 2");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedDevice, setSelectedDevice] = useState("");
  const [meta, setMeta] = useState({
    palu_devices: [],
    all_devices: [],
    module_types: [],
    locations: [],
  });

  // UI Dropdown & Modals state
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedForDetail, setSelectedForDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Local search state synced with prop
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

  const deviceDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(e.target)) {
        setDeviceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show Toast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch Meta for dropdowns & forms
  const fetchMeta = async () => {
    try {
      const res = await fetch("/api/modules/meta");
      const data = await res.json();
      if (data.success) {
        setMeta({
          palu_devices: data.palu_devices || [],
          all_devices: data.all_devices || [],
          module_types: data.module_types || [],
          locations: data.locations || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch module meta:", err);
    }
  };

  // Fetch Modules & Stats (load all modules once on mount or mutation)
  const fetchModules = async (forceLoading = false) => {
    if (forceLoading || allModules.length === 0) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams({
        page: 1,
        per_page: 1000,
      });

      const res = await fetch(`/api/modules?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        const mapped = (data.items || []).map((m) => {
          const p = m.port !== null && m.port !== undefined ? String(m.port).trim() : "";
          const isSfp = p !== "" && p !== "-" && p.toLowerCase() !== "null" && p.toLowerCase() !== "none";
          return {
            ...m,
            category: isSfp ? "SFP" : "Card",
          };
        });
        setAllModules(mapped);
        setScopeInfo(data.scope_info || "");
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        showToast(data.error || "Gagal memuat data modul", "error");
      }
    } catch (err) {
      console.error("Error fetching modules:", err);
      showToast("Terjadi kesalahan jaringan saat memuat data modul", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
    fetchModules(true);
  }, []);

  // Handle Column Sorting (toggle: asc -> desc -> none)
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key: null, direction: null };
    });
    setPage(1);
  };

  // 1. Device filter & Search filtering across all fields (Instant in-memory, no layout jitter)
  const searchedModules = useMemo(() => {
    let list = allModules;
    if (selectedDevice) {
      list = list.filter((item) => item.ne_name === selectedDevice);
    }
    const q = (localSearch || searchValue || "").trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => {
      return (
        (item.ne_name && item.ne_name.toLowerCase().includes(q)) ||
        (item.unit_type && item.unit_type.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.location_name && item.location_name.toLowerCase().includes(q)) ||
        (item.shelf && String(item.shelf).toLowerCase().includes(q)) ||
        (item.slot && String(item.slot).toLowerCase().includes(q)) ||
        (item.port && String(item.port).toLowerCase().includes(q)) ||
        (item.unit_part_number && item.unit_part_number.toLowerCase().includes(q)) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(q)) ||
        (item.date_str && item.date_str.toLowerCase().includes(q))
      );
    });
  }, [allModules, selectedDevice, searchValue, localSearch]);

  // Dynamic stats calculation when device is selected
  const displayStats = useMemo(() => {
    if (!selectedDevice) return stats;
    const devModules = allModules.filter((m) => m.ne_name === selectedDevice);
    return {
      total_modules: devModules.length,
      total_devices: 1,
      total_locations: 1,
    };
  }, [allModules, selectedDevice, stats]);

  // 2. Sorting applied before pagination
  const sortedModules = useMemo(() => {
    return sortData(
      searchedModules,
      sortConfig.key,
      sortConfig.direction,
      moduleColumnTypes
    );
  }, [searchedModules, sortConfig]);

  // 3. Pagination calculations based on sorted result
  const totalItems = sortedModules.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paginatedModules = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return sortedModules.slice(start, start + perPage);
  }, [sortedModules, safePage, perPage]);

  // Open Detail Modal & load full DB detail
  const handleOpenDetail = async (item) => {
    setDetailModalOpen(true);
    setLoadingDetail(true);
    setSelectedForDetail(item);
    try {
      const res = await fetch(`/api/modules/${item.modul_id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedForDetail({
          ...item,
          ...data.module,
          position: data.position,
          movements: data.movements || [],
        });
      }
    } catch (err) {
      console.error("Failed to load module detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open Edit Modal & load full DB data
  const handleOpenEdit = async (item) => {
    setSelectedForEdit(item);
    setEditModalOpen(true);
    try {
      const res = await fetch(`/api/modules/${item.modul_id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedForEdit({
          ...item,
          ...data.module,
          position: data.position,
        });
      }
    } catch (err) {
      console.error("Failed to load module for edit:", err);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (item) => {
    setSelectedForDelete(item);
    setDeleteModalOpen(true);
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!selectedForDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/modules/${selectedForDelete.modul_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Modul berhasil dihapus", "success");
        setDeleteModalOpen(false);
        setSelectedForDelete(null);
        fetchModules(selectedDevice, searchValue);
      } else {
        showToast(data.error || "Gagal menghapus modul", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Terjadi kesalahan saat menghapus modul", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 !mt-0 w-full" style={{ marginTop: 0 }}>
      {/* Toast Alert Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl border shadow-2xl flex items-center gap-3 transition-all animate-bounce ${toast.type === "success"
            ? "bg-[#06241E] border-emerald-500/50 text-emerald-300 shadow-emerald-950/40"
            : "bg-[#2A0E12] border-rose-500/50 text-rose-300 shadow-rose-950/40"
            }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="text-xs font-medium">{toast.message}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* A. TIGA KARTU STATISTIK (Sesuai Referensi Gambar)       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
        {/* Card 1: TOTAL MODUL */}
        <div
          className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ease-in-out p-6 flex items-center justify-between group cursor-pointer hover:-translate-y-1 ${isDark
            ? "bg-[#0D1F36] border-[#1A3358] hover:border-[#38BDF8] hover:shadow-[0_10px_30px_rgba(56,189,248,0.22)]"
            : "bg-white border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md"
            }`}
        >
          <div className="flex flex-col justify-between h-full z-10">
            {/* Header: Cyan dot indicator */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isDark ? "bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" : "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]"}`}></span>
              <span className={`text-[11px] font-bold tracking-widest uppercase ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                TOTAL MODUL
              </span>
            </div>

            {/* Value & Badge */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? "text-[#F8FAFC]" : "text-slate-900"}`}>
                {displayStats.total_modules}
              </span>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${isDark ? "bg-[#0F294D] text-[#38BDF8] border border-[#1E4378]" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                Unit
              </span>
            </div>

            {/* Subtitle */}
            <p className={`text-xs mt-2 font-medium ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
              Modul optik dan card aktif terpasang
            </p>
          </div>

          {/* Right Icon / 3D Illustration Container with Neon Glow */}
          <div className={`relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden p-1 group-hover:scale-105 transition-all duration-300 flex items-center justify-center ${isDark
            ? "bg-[#071527] border border-[#00E5FF]/40 shadow-[0_0_18px_rgba(0,229,255,0.22)] group-hover:border-[#00E5FF]/80"
            : "bg-blue-50/80 border border-blue-200 shadow-sm group-hover:border-blue-400"
            }`}>
            <img
              src={statModule}
              alt="Total Modul 3D"
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#00E5FF]/10 to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* Card 2: TOTAL PERANGKAT */}
        <div
          className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ease-in-out p-6 flex items-center justify-between group cursor-pointer hover:-translate-y-1 ${isDark
            ? "bg-[#0D1F36] border-[#1A3358] hover:border-[#C084FC] hover:shadow-[0_10px_30px_rgba(192,132,252,0.22)]"
            : "bg-white border-slate-200 shadow-sm hover:border-purple-400 hover:shadow-md"
            }`}
        >
          <div className="flex flex-col justify-between h-full z-10">
            {/* Header: Purple dot indicator */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isDark ? "bg-[#C084FC] shadow-[0_0_8px_#C084FC]" : "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.4)]"}`}></span>
              <span className={`text-[11px] font-bold tracking-widest uppercase ${isDark ? "text-[#C084FC]" : "text-purple-600"}`}>
                TOTAL PERANGKAT
              </span>
            </div>

            {/* Value & Badge */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? "text-[#F8FAFC]" : "text-slate-900"}`}>
                {displayStats.total_devices}
              </span>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${isDark ? "bg-[#24133F] text-[#D8B4FE] border border-[#4C2880]" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
                Unit
              </span>
            </div>

            {/* Subtitle */}
            <p className={`text-xs mt-2 font-medium ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
              Perangkat transmisi optik aktif
            </p>
          </div>

          {/* Right Icon / 3D Illustration Container with Neon Glow */}
          <div className={`relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden p-1 group-hover:scale-105 transition-all duration-300 flex items-center justify-center ${isDark
            ? "bg-[#0F0B1E] border border-[#C084FC]/40 shadow-[0_0_18px_rgba(192,132,252,0.22)] group-hover:border-[#C084FC]/80"
            : "bg-purple-50/80 border border-purple-200 shadow-sm group-hover:border-purple-400"
            }`}>
            <img
              src={statDevice}
              alt="Total Perangkat 3D"
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#C084FC]/10 to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* Card 3: TOTAL LOKASI */}
        <div
          className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ease-in-out p-6 flex items-center justify-between group cursor-pointer hover:-translate-y-1 ${isDark
            ? "bg-[#0D1F36] border-[#1A3358] hover:border-[#10B981] hover:shadow-[0_10px_30px_rgba(16,185,129,0.22)]"
            : "bg-white border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md"
            }`}
        >
          <div className="flex flex-col justify-between h-full z-10">
            {/* Header: Green dot indicator */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isDark ? "bg-[#10B981] shadow-[0_0_8px_#10B981]" : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"}`}></span>
              <span className={`text-[11px] font-bold tracking-widest uppercase ${isDark ? "text-[#34D399]" : "text-emerald-600"}`}>
                TOTAL LOKASI
              </span>
            </div>

            {/* Value & Badge */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? "text-[#F8FAFC]" : "text-slate-900"}`}>
                {displayStats.total_locations}
              </span>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${isDark ? "bg-[#0A2E24] text-[#6EE7B7] border border-[#15604B]" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                Titik STO
              </span>
            </div>

            {/* Subtitle */}
            <p className={`text-xs mt-2 font-medium ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
              Titik STO operasional regional
            </p>
          </div>

          {/* Right Icon / 3D Illustration Container with Neon Glow */}
          <div className={`relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden p-1 group-hover:scale-105 transition-all duration-300 flex items-center justify-center ${isDark
            ? "bg-[#061814] border border-[#10B981]/40 shadow-[0_0_18px_rgba(16,185,129,0.22)] group-hover:border-[#10B981]/80"
            : "bg-emerald-50/80 border border-emerald-200 shadow-sm group-hover:border-emerald-400"
            }`}>
            <img
              src={statLocation}
              alt="Total Lokasi 3D"
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#10B981]/10 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* B. PANEL DAFTAR MODUL & KONTROL TABEL                    */}
      {/* ======================================================== */}
      <div
        className={`rounded-2xl border transition-colors duration-200 overflow-visible w-full ${isDark
          ? "border-[#162F52] bg-[#0A182B] shadow-2xl"
          : "border-slate-200 bg-white shadow-sm"
          }`}
      >
        {/* Controls Toolbar: Search di kiri, Dropdown Filter & Pasang Modul Baru di kanan */}
        <div
          className={`px-6 py-4 sm:py-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 border-b ${isDark ? "border-[#142D4C]" : "border-slate-100"
            }`}
        >
          {/* Left: Input Search Bar */}
          <div className="relative flex-1 max-w-md">
            <span
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] pointer-events-none ${isDark ? "text-[#64748B]" : "text-slate-400"
                }`}
            >
              search
            </span>
            <input
              type="text"
              id="moduleSearchInput"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari perangkat, modul, serial number, atau lokasi..."
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

          {/* Right: Device Filter Dropdown & Pasang Modul Baru */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Dropdown: Semua Perangkat (Panjang container box tetap stabil 215px agar tidak bergetar/geser) */}
            <div className="relative w-[215px] min-w-[215px]" ref={deviceDropdownRef}>
              <button
                type="button"
                onClick={() => setDeviceDropdownOpen(!deviceDropdownOpen)}
                className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium transition-all duration-200 cursor-pointer ${
                  deviceDropdownOpen
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
                    {selectedDevice ? selectedDevice : "Semua Perangkat"}
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${deviceDropdownOpen ? "rotate-180" : ""
                    }`}
                >
                  expand_more
                </span>
              </button>

              {/* Custom Filter Dropdown Menu */}
              {deviceDropdownOpen && (
                <div
                  className={`absolute left-0 top-12 mt-1.5 w-full min-w-full rounded-xl border shadow-2xl p-1.5 z-30 max-h-64 overflow-y-auto custom-scrollbar backdrop-blur-md animate-dropdown ${isDark
                    ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                    : "bg-white border-slate-200 text-slate-800 shadow-xl"
                    }`}
                  style={{
                    backgroundColor: isDark ? "#0A182B" : "#FFFFFF",
                    borderColor: isDark ? "#1E3A5F" : "#E2E8F0",
                  }}
                >
                  {/* Option: Semua Perangkat (Tanpa sublabel fokus STO) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDevice("");
                      setDeviceDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${selectedDevice === ""
                      ? isDark
                        ? "bg-[#1677FF] text-white font-semibold"
                        : "bg-blue-600 text-white font-semibold"
                      : isDark
                        ? "hover:bg-[#122846] text-[#CBD5E1]"
                        : "hover:bg-slate-100 text-slate-700"
                      }`}
                  >
                    <span>Semua Perangkat</span>
                    {selectedDevice === "" && (
                      <span className="material-symbols-outlined text-[16px] shrink-0">check</span>
                    )}
                  </button>

                  <div className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"}`} />

                  {/* Device Options from DB */}
                  {meta.palu_devices.map((dev) => {
                    const isSelected = selectedDevice === dev.hostname;
                    return (
                      <button
                        key={dev.id}
                        type="button"
                        onClick={() => {
                          setSelectedDevice(dev.hostname);
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
                          <span className="font-semibold">{dev.hostname}</span>
                          <span
                            className={`text-[10px] ${isSelected
                              ? "text-blue-100"
                              : isDark
                                ? "text-[#64748B]"
                                : "text-slate-400"
                              }`}
                          >
                            {dev.location}
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

            {/* Right: Pasang Modul Baru Button */}
            {user?.role !== "teknisi" && (
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="h-11 px-5 rounded-xl bg-[#1677FF] hover:bg-[#0E65D9] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1677FF]/30 transition-all duration-200 hover:shadow-[#1677FF]/50 active:scale-[0.98] cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[19px]">add</span>
                <span>Pasang Modul Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* C. STRUKTUR TABEL MODUL (100% MENGIKUTI STYLE MUTASI MODUL) */}
        <div className="overflow-x-auto custom-scrollbar rounded-t-xl">
          <table
            id="modulesTable"
            className="w-full text-left border-collapse min-w-[1200px] table-fixed"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <colgroup>
              <col style={{ width: '16%' }} />   {/* 1. NAMA PERANGKAT */}
              <col style={{ width: '10.5%' }} /> {/* 2. UNIT TYPE */}
              <col style={{ width: '7%' }} />    {/* 3. KATEGORI */}
              <col style={{ width: '8%' }} />    {/* 4. LOKASI */}
              <col style={{ width: '4.5%' }} />  {/* 5. SHELF */}
              <col style={{ width: '4.5%' }} />  {/* 6. SLOT */}
              <col style={{ width: '4.5%' }} />  {/* 7. PORT */}
              <col style={{ width: '12%' }} />   {/* 8. UNIT PART NUMBER */}
              <col style={{ width: '12.5%' }} /> {/* 9. SERIAL NUMBER */}
              <col style={{ width: '9%' }} />    {/* 10. DATE */}
              <col style={{ width: '11.5%' }} /> {/* 11. AKSI */}
            </colgroup>
            <thead className={`rounded-t-xl ${isDark ? "bg-[#071426]" : "bg-slate-50"}`}>
              <tr
                className={`border-b text-[11px] font-bold uppercase tracking-wider ${isDark
                  ? "bg-[#071426] border-[#142D4C] text-[#94A3B8]"
                  : "bg-slate-50 border-slate-200 text-slate-600"
                  } rounded-t-xl`}
              >
                {/* 1. NAMA PERANGKAT */}
                <th
                  className="py-3.5 pl-6 pr-3 text-left select-none rounded-tl-xl"
                  style={{ width: "16%" }}
                >
                  <TableSortHeader
                    title="NAMA PERANGKAT"
                    sortKey="ne_name"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>

                {/* 2. UNIT TYPE */}
                <th
                  className="py-3.5 px-3 text-left select-none"
                  style={{ width: "10.5%" }}
                >
                  <TableSortHeader
                    title="UNIT TYPE"
                    sortKey="unit_type"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>

                {/* 3. KATEGORI */}
                <th
                  className="py-3.5 px-3 text-left select-none"
                  style={{ width: "7%" }}
                >
                  <TableSortHeader
                    title="KATEGORI"
                    sortKey="category"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>

                {/* 4. LOKASI */}
                <th
                  className="py-3.5 px-3 text-left select-none"
                  style={{ width: "8%" }}
                >
                  <TableSortHeader
                    title="LOKASI"
                    sortKey="location_name"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>

                {/* 5. SHELF */}
                <th
                  className="py-3.5 px-1 text-center select-none"
                  style={{ width: "4.5%" }}
                >
                  <TableSortHeader
                    title="SHELF"
                    sortKey="shelf"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="center"
                    isDark={isDark}
                  />
                </th>

                {/* 6. SLOT */}
                <th
                  className="py-3.5 px-1 text-center select-none"
                  style={{ width: "4.5%" }}
                >
                  <TableSortHeader
                    title="SLOT"
                    sortKey="slot"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="center"
                    isDark={isDark}
                  />
                </th>

                {/* 7. PORT */}
                <th
                  className="py-3.5 px-1 text-center select-none"
                  style={{ width: "4.5%" }}
                >
                  <TableSortHeader
                    title="PORT"
                    sortKey="port"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="center"
                    isDark={isDark}
                  />
                </th>

                {/* 8. UNIT PART NUMBER */}
                <th
                  className="py-3.5 px-3 text-left select-none"
                  style={{ width: "12%" }}
                >
                  <TableSortHeader
                    title="UNIT PART NUMBER"
                    sortKey="unit_part_number"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>

                {/* 9. SERIAL NUMBER */}
                <th
                  className="py-3.5 px-3 text-left select-none"
                  style={{ width: "12.5%" }}
                >
                  <TableSortHeader
                    title="SERIAL NUMBER"
                    sortKey="serial_number"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>

                {/* 10. DATE */}
                <th
                  className="py-3.5 px-3 text-left select-none"
                  style={{ width: "9%" }}
                >
                  <TableSortHeader
                    title="DATE"
                    sortKey="date_str"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>

                {/* 11. AKSI */}
                <th
                  className="py-3.5 pl-3 pr-6 text-center select-none rounded-tr-xl"
                  style={{ width: "11.5%" }}
                >
                  <span className={`font-extrabold uppercase tracking-wider text-[11px] ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                    AKSI
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${isDark ? "divide-[#0F2238]" : "divide-slate-100"}`}>
              {loading && allModules.length === 0 ? (
                <tr>
                  <td colSpan="11" className={`py-16 text-center ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-4xl animate-spin text-[#1677FF]">
                        progress_activity
                      </span>
                      <span>Memuat inventaris modul...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedModules.length === 0 ? (
                <tr>
                  <td colSpan="11" className={`py-14 text-center ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-[#64748B]">
                        inbox
                      </span>
                      <span className="font-medium">Tidak ada data modul yang sesuai kriteria</span>
                      <span className="text-[11px] text-[#64748B]">
                        Coba ubah filter perangkat atau kata kunci pencarian.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedModules.map((item) => (
                  <tr
                    key={item.position_id}
                    className={`transition-colors border-b ${isDark
                      ? "border-[#0F2238] hover:bg-[#0D2138]/80 text-[#E6EDF7]"
                      : "border-slate-100 hover:bg-slate-50/80 text-slate-800"
                      }`}
                  >
                    {/* 1. NAMA PERANGKAT */}
                    <td className={`py-3.5 pl-6 pr-3 font-semibold whitespace-nowrap ${isDark ? "text-[#E6EDF7]" : "text-slate-800"
                      }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[13px] shrink-0 border ${isDark
                          ? "bg-[#0D264A] text-[#38BDF8] border-[#164375]"
                          : "bg-blue-50 text-blue-600 border-blue-200"
                          }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            hard_drive
                          </span>
                        </div>
                        <span className="font-mono text-xs tracking-wide">{item.ne_name}</span>
                      </div>
                    </td>

                    {/* 2. UNIT TYPE */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border max-w-full ${isDark
                        ? "bg-[#0C2548] border-[#1A4378] text-[#38BDF8]"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}>
                        {item.unit_type}
                      </span>
                    </td>

                    {/* 3. KATEGORI */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {item.category === "SFP" ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${isDark
                          ? "bg-[#0E3B33] text-[#34D399] border-[#059669]/40"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                          <span>SFP</span>
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${isDark
                          ? "bg-[#25133E] text-[#C084FC] border-[#A855F7]/35"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                          }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]"></span>
                          <span>CARD</span>
                        </span>
                      )}
                    </td>

                    {/* 4. LOKASI */}
                    <td className={`py-3.5 px-3 text-xs whitespace-nowrap ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                      }`}>
                      {item.location_name}
                    </td>

                    {/* 5. SHELF */}
                    <td className="py-3.5 px-1 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center min-w-[24px] h-[24px] px-1 rounded-md border font-bold text-xs font-mono ${isDark
                        ? "bg-[#0D2F54] border-[#174F88] text-[#38BDF8]"
                        : "bg-sky-50 border-sky-200 text-sky-700"
                        }`}>
                        {item.shelf || "1"}
                      </span>
                    </td>

                    {/* 6. SLOT */}
                    <td className="py-3.5 px-1 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center min-w-[28px] h-[24px] px-1.5 rounded-md border font-bold text-xs font-mono ${isDark
                        ? "bg-[#0D2F54] border-[#174F88] text-[#38BDF8]"
                        : "bg-sky-50 border-sky-200 text-sky-700"
                        }`}>
                        {item.slot}
                      </span>
                    </td>

                    {/* 7. PORT */}
                    <td className="py-3.5 px-1 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center min-w-[24px] h-[24px] px-1 rounded-md border font-bold text-xs font-mono ${isDark
                        ? "bg-[#0D2F54] border-[#174F88] text-[#38BDF8]"
                        : "bg-sky-50 border-sky-200 text-sky-700"
                        }`}>
                        {item.port || "-"}
                      </span>
                    </td>

                    {/* 8. UNIT PART NUMBER */}
                    <td className={`py-3.5 px-3 font-mono text-xs tracking-wide whitespace-nowrap ${isDark ? "text-[#94A3B8]" : "text-slate-600"
                      }`}>
                      {item.unit_part_number}
                    </td>

                    {/* 9. SERIAL NUMBER */}
                    <td className={`py-3.5 px-3 font-mono font-medium tracking-wide text-xs whitespace-nowrap ${isDark ? "text-slate-100" : "text-slate-800"
                      }`}>
                      {item.serial_number}
                    </td>

                    {/* 10. DATE */}
                    <td className={`py-3.5 px-3 font-mono text-[11.5px] tracking-wide whitespace-nowrap text-left ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                      }`}>
                      {item.date_str}
                    </td>

                    {/* 11. AKSI */}
                    <td className="py-3.5 pl-3 pr-6 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-nowrap shrink-0 mx-auto">
                        {/* Detail Action */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(item)}
                          title="Detail Modul"
                          className={`w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-colors cursor-pointer shadow-sm ${isDark
                            ? "bg-[#07383E] hover:bg-[#0A4E57] text-[#00E5FF] border-[#0A545E]"
                            : "bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200"
                            }`}
                        >
                          <span className="material-symbols-outlined text-[17px] leading-none select-none flex items-center justify-center pointer-events-none">
                            visibility
                          </span>
                        </button>

                        {/* Edit Action */}
                        {user?.role !== "teknisi" && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Modul"
                            className={`w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-colors cursor-pointer shadow-sm ${isDark
                              ? "bg-[#3D2C0D] hover:bg-[#523B11] text-[#FBBF24] border-[#5E4413]"
                              : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                              }`}
                          >
                            <span className="material-symbols-outlined text-[17px] leading-none select-none flex items-center justify-center pointer-events-none">
                              edit
                            </span>
                          </button>
                        )}

                        {/* Delete Action */}
                        {user?.role !== "teknisi" && (
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(item)}
                            title="Hapus Modul"
                            className={`w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-colors cursor-pointer shadow-sm ${isDark
                              ? "bg-[#3C1318] hover:bg-[#541B22] text-[#F43F5E] border-[#5C1D25]"
                              : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                              }`}
                          >
                            <span className="material-symbols-outlined text-[17px] leading-none select-none flex items-center justify-center pointer-events-none">
                              delete
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Pagination controls */}
        <TablePagination
          page={safePage}
          perPage={perPage}
          totalCount={totalItems}
          itemLabel="modul"
          onPageChange={(newPage) => setPage(newPage)}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
          }}
          isDark={isDark}
        />
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL: PASANG MODUL BARU                              */}
      {/* ======================================================== */}
      {createModalOpen && (
        <CreateModuleModal
          meta={meta}
          allModules={allModules}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={(msg) => {
            setCreateModalOpen(false);
            showToast(msg, "success");
            fetchModules(selectedDevice, searchValue);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* 4. MODAL: EDIT MODUL                                     */}
      {/* ======================================================== */}
      {editModalOpen && selectedForEdit && (
        <EditModuleModal
          moduleData={selectedForEdit}
          meta={meta}
          allModules={allModules}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedForEdit(null);
          }}
          onSuccess={(msg) => {
            setEditModalOpen(false);
            setSelectedForEdit(null);
            showToast(msg, "success");
            fetchModules(selectedDevice, searchValue);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: DETAIL MODUL                                   */}
      {/* ======================================================== */}
      {detailModalOpen && (
        <DetailModuleModal
          item={selectedForDetail}
          loading={loadingDetail}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedForDetail(null);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: KONFIRMASI HAPUS                               */}
      {/* ======================================================== */}
      {deleteModalOpen && selectedForDelete && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedForDelete(null);
            }}
          >
            <div
              className={`rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border transition-colors ${
                isDark
                  ? "bg-[#0D1F36] border-rose-500/40 text-[#E6EDF7]"
                  : "bg-white border-rose-300 text-slate-800 shadow-xl"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-rose-500">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isDark
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-rose-50 border-rose-200 text-rose-600"
                }`}>
                  <span className="material-symbols-outlined text-[24px]">warning</span>
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Konfirmasi Hapus Modul
                  </h3>
                  <p className={`text-xs ${isDark ? "text-rose-300" : "text-rose-600"}`}>
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>

              <div className={`rounded-xl p-4 text-xs space-y-2 border ${
                isDark
                  ? "bg-[#071426] border-[#1A2E4C] text-[#CBD5E1]"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                <div className="flex justify-between">
                  <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Serial Number:</span>
                  <span className={`font-mono font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {selectedForDelete.serial_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Perangkat:</span>
                  <span className={`font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                    {selectedForDelete.ne_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Unit Type:</span>
                  <span className={`font-semibold ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                    {selectedForDelete.unit_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>Lokasi / Slot:</span>
                  <span>
                    {selectedForDelete.location_name} • Slot {selectedForDelete.slot}
                  </span>
                </div>
              </div>

              <p className={`text-[11px] leading-relaxed ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                Sistem akan memeriksa integritas riwayat mutasi dan audit log. Modul dengan catatan
                resmi tidak akan dihapus sembarangan sesuai aturan integritas data.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setSelectedForDelete(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    isDark
                      ? "border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846]"
                      : "border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Hapus Modul</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

// ==============================================================
// SUBCOMPONENT: CREATE MODULE MODAL
// ==============================================================
// ==============================================================
// SUBCOMPONENT: CREATE MODULE MODAL
// ==============================================================
function CreateModuleModal({ meta, allModules = [], onClose, onSuccess }) {
  const { isDark } = useTheme();
  // 1. Perangkat State & Refs
  const [deviceId, setDeviceId] = useState("");
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const [deviceSearchQuery, setDeviceSearchQuery] = useState("");
  const deviceDropdownRef = useRef(null);

  // 2. Unit Type State & Refs
  const [unitType, setUnitType] = useState("");
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);
  const typeDropdownRef = useRef(null);
  const typeInputRef = useRef(null);

  // 3. Serial Number State & Refs
  const [serialNumber, setSerialNumber] = useState("");
  const [serialDropdownOpen, setSerialDropdownOpen] = useState(false);
  const serialDropdownRef = useRef(null);
  const serialInputRef = useRef(null);

  // 4. Form States
  const [unitPartNumber, setUnitPartNumber] = useState("");
  const [slot, setSlot] = useState("");
  const [shelf, setShelf] = useState("1");
  const [port, setPort] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(e.target)) {
        setDeviceDropdownOpen(false);
      }
      if (serialDropdownRef.current && !serialDropdownRef.current.contains(e.target)) {
        setSerialDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setShowTypeSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Selected device object
  const selectedDeviceObj = useMemo(() => {
    if (!deviceId) return null;
    return (meta.palu_devices || []).find((d) => String(d.id) === String(deviceId));
  }, [deviceId, meta.palu_devices]);

  // Filtered devices for popup
  const filteredDevices = useMemo(() => {
    const list = meta.palu_devices || [];
    if (!deviceSearchQuery.trim()) return list;
    const q = deviceSearchQuery.toLowerCase().trim();
    return list.filter(
      (d) =>
        (d.hostname && d.hostname.toLowerCase().includes(q)) ||
        (d.location && d.location.toLowerCase().includes(q)) ||
        (d.nama && d.nama.toLowerCase().includes(q))
    );
  }, [meta.palu_devices, deviceSearchQuery]);

  // Filtered module types for autocomplete
  const filteredModuleTypes = useMemo(() => {
    const types = meta.module_types || [];
    if (!unitType.trim()) return types;
    const q = unitType.toLowerCase().trim();
    return types.filter((mt) => mt.nama.toLowerCase().includes(q));
  }, [meta.module_types, unitType]);

  // Matching serial numbers from inventory/active modules (unique serial numbers only)
  const matchingSerialList = useMemo(() => {
    const q = serialNumber.toLowerCase().trim();
    const seen = new Set();
    const unique = [];

    for (const m of allModules || []) {
      const sn = (m.serial_number || "").trim();
      if (!sn || seen.has(sn)) continue;
      seen.add(sn);

      if (!q || sn.toLowerCase().includes(q)) {
        unique.push(m);
      }
    }
    return unique.slice(0, 30);
  }, [allModules, serialNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!deviceId) return setError("Silakan pilih perangkat terlebih dahulu.");
    if (!unitType.trim()) return setError("Unit Type wajib diisi.");
    if (!serialNumber.trim()) return setError("Serial number wajib diisi.");
    if (!slot.trim()) return setError("Nomor slot wajib diisi.");
    if (!date) return setError("Tanggal wajib dipilih.");

    setLoading(true);
    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: Number(deviceId),
          unit_type: unitType.trim(),
          serial_number: serialNumber.trim(),
          unit_part_number: unitPartNumber.trim(),
          slot: slot.trim(),
          shelf: shelf.trim() || "1",
          port: port.trim() || "-",
          date: date.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.message || "Modul baru berhasil dipasang!");
      } else {
        setError(data.error || "Gagal memasang modul baru.");
      }
    } catch (err) {
      console.error("Create module error:", err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div
          className={`rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar font-sans border transition-colors ${
            isDark
              ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
              : "bg-white border-slate-200 text-slate-800 shadow-xl"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3 border-b ${
            isDark ? "border-[#1A2E4C]" : "border-slate-100"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isDark
                  ? "bg-[#1677FF]/15 border-[#1677FF]/30 text-[#38BDF8]"
                  : "bg-blue-50 border-blue-200 text-blue-600"
              }`}>
                <span className="material-symbols-outlined text-[22px]">add_circle</span>
              </div>
              <div>
                <h3 className={`text-base font-bold font-sans ${isDark ? "text-white" : "text-slate-900"}`}>
                  Pasang Modul Baru
                </h3>
                <p className={`text-xs font-sans ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                  Pasang modul fisik baru pada perangkat jaringan yang aktif
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? "text-[#94A3B8] hover:text-white hover:bg-[#1A2E4C]"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {error && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 font-sans ${
              isDark
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-rose-50 border-rose-200 text-rose-600"
            }`}>
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. PERANGKAT (NE) - Custom Container Box Dropdown & Popup Menu Filter */}
              <div className="relative" ref={deviceDropdownRef}>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Perangkat (NE) *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setDeviceDropdownOpen(!deviceDropdownOpen);
                    setSerialDropdownOpen(false);
                    setShowTypeSuggestions(false);
                  }}
                  className={`relative w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs font-medium font-sans transition-all duration-200 cursor-pointer ${
                    deviceDropdownOpen
                      ? isDark
                        ? "bg-[#0A182B] border-[#1677FF] ring-2 ring-[#1677FF]/25 text-[#E6EDF7]"
                        : "bg-white border-[#1677FF] ring-2 ring-[#1677FF]/20 text-slate-900"
                      : isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF]/70 hover:bg-[#0A182B]"
                        : "bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span className={`material-symbols-outlined text-[19px] shrink-0 ${
                      isDark ? "text-[#38BDF8]" : "text-blue-600"
                    }`}>
                      desktop_windows
                    </span>
                    <span
                      className={`truncate ${
                        selectedDeviceObj
                          ? isDark ? "font-semibold text-white" : "font-semibold text-slate-900"
                          : isDark ? "text-[#64748B]" : "text-slate-400"
                      }`}
                    >
                      {selectedDeviceObj
                        ? `${selectedDeviceObj.hostname} (${selectedDeviceObj.location})`
                        : "Pilih Perangkat"}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[19px] transition-transform duration-200 shrink-0 ${
                      deviceDropdownOpen
                        ? isDark ? "rotate-180 text-[#38BDF8]" : "rotate-180 text-blue-600"
                        : isDark ? "text-[#94A3B8]" : "text-slate-400"
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Custom Filter Dropdown Menu Perangkat */}
                {deviceDropdownOpen && (
                  <div
                    className={`absolute left-0 top-full mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-50 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md font-sans animate-dropdown ${
                      isDark
                        ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7]"
                        : "border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    {meta.palu_devices && meta.palu_devices.length > 5 && (
                      <div className={`px-1.5 pb-1.5 mb-1 border-b ${
                        isDark ? "border-[#1A3358]" : "border-slate-100"
                      }`}>
                        <div className="relative">
                          <span className={`material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[15px] ${
                            isDark ? "text-[#64748B]" : "text-slate-400"
                          }`}>
                            search
                          </span>
                          <input
                            type="text"
                            value={deviceSearchQuery}
                            onChange={(e) => setDeviceSearchQuery(e.target.value)}
                            placeholder="Cari perangkat..."
                            className={`w-full h-8 pl-7 pr-2 rounded-lg border text-[11px] outline-none font-sans ${
                              isDark
                                ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B] focus:border-[#1677FF]"
                                : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}
                    {filteredDevices.map((d) => {
                      const isSelected = String(deviceId) === String(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setDeviceId(String(d.id));
                            setDeviceDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium font-sans flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#1677FF] text-white font-semibold"
                              : isDark
                                ? "hover:bg-[#122846] text-[#CBD5E1]"
                                : "hover:bg-blue-50 text-slate-700"
                          }`}
                        >
                          <div className="flex flex-col truncate pr-2">
                            <span className="font-semibold">{d.hostname}</span>
                            <span
                              className={`text-[10px] ${
                                isSelected
                                  ? "text-blue-100"
                                  : isDark ? "text-[#64748B]" : "text-slate-400"
                              }`}
                            >
                              {d.location}
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

              {/* 2. UNIT TYPE - Custom Container Box with Autocomplete Popup */}
              <div className="relative" ref={typeDropdownRef}>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Unit Type *
                </label>
                <div
                  onClick={() => {
                    setShowTypeSuggestions(true);
                    setDeviceDropdownOpen(false);
                    setSerialDropdownOpen(false);
                    typeInputRef.current?.focus();
                  }}
                  className={`relative w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs font-medium font-sans transition-all duration-200 cursor-text ${
                    showTypeSuggestions
                      ? isDark
                        ? "bg-[#0A182B] border-[#1677FF] ring-2 ring-[#1677FF]/25 text-[#E6EDF7]"
                        : "bg-white border-[#1677FF] ring-2 ring-[#1677FF]/20 text-slate-900"
                      : isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF]/70 hover:bg-[#0A182B]"
                        : "bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                    <span className={`material-symbols-outlined text-[19px] shrink-0 pointer-events-none ${
                      isDark ? "text-[#38BDF8]" : "text-blue-600"
                    }`}>
                      category
                    </span>
                    <input
                      ref={typeInputRef}
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Pilih tipe..."
                      value={unitType}
                      onChange={(e) => {
                        setUnitType(e.target.value);
                        if (!showTypeSuggestions) setShowTypeSuggestions(true);
                      }}
                      onFocus={() => {
                        setShowTypeSuggestions(true);
                        setDeviceDropdownOpen(false);
                        setSerialDropdownOpen(false);
                      }}
                      className={`w-full bg-transparent outline-none text-xs font-medium font-sans ${
                        isDark
                          ? "text-white placeholder-[#64748B]"
                          : "text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {unitType && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUnitType("");
                          setShowTypeSuggestions(true);
                          typeInputRef.current?.focus();
                        }}
                        title="Hapus tipe modul"
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          isDark
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
                        setShowTypeSuggestions(!showTypeSuggestions);
                        setDeviceDropdownOpen(false);
                        setSerialDropdownOpen(false);
                        if (!showTypeSuggestions) {
                          typeInputRef.current?.focus();
                        }
                      }}
                      className="w-6 h-6 flex items-center justify-center cursor-pointer"
                    >
                      <span
                        className={`material-symbols-outlined text-[19px] transition-transform duration-200 ${
                          showTypeSuggestions
                            ? isDark ? "rotate-180 text-[#38BDF8]" : "rotate-180 text-blue-600"
                            : isDark ? "text-[#94A3B8]" : "text-slate-400"
                        }`}
                      >
                        expand_more
                      </span>
                    </button>
                  </div>
                </div>

                {/* Floating Popup Suggestions Menu */}
                {showTypeSuggestions && (
                  <div className={`absolute left-0 top-full mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-50 max-h-56 overflow-y-auto custom-scrollbar backdrop-blur-md font-sans animate-dropdown ${
                    isDark
                      ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7]"
                      : "border-slate-200 bg-white text-slate-800"
                  }`}>
                    {filteredModuleTypes.map((mt) => {
                      const isSelected = unitType.toLowerCase() === mt.nama.toLowerCase();
                      return (
                        <button
                          key={mt.id}
                          type="button"
                          onMouseDown={() => {
                            setUnitType(mt.nama);
                            setShowTypeSuggestions(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium font-sans flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#1677FF] text-white font-semibold"
                              : isDark
                                ? "hover:bg-[#122846] text-[#CBD5E1] hover:text-[#38BDF8]"
                                : "hover:bg-blue-50 text-slate-700 hover:text-blue-600"
                          }`}
                        >
                          <span className="font-semibold">{mt.nama}</span>
                          {mt.vendor && (
                            <span className={`text-[10px] font-sans ${
                              isDark ? "text-[#64748B]" : "text-slate-400"
                            }`}>
                              {mt.vendor}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {filteredModuleTypes.length === 0 && unitType.trim() && (
                      <div className={`px-3 py-2 text-[11px] font-sans ${
                        isDark ? "text-[#64748B]" : "text-slate-500"
                      }`}>
                        Gunakan nilai manual:{" "}
                        <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                          {unitType}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. SERIAL NUMBER - Custom Container Box with Dropdown Popup Filter */}
              <div className="relative" ref={serialDropdownRef}>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Serial Number *
                </label>
                <div
                  onClick={() => {
                    setSerialDropdownOpen(true);
                    setDeviceDropdownOpen(false);
                    setShowTypeSuggestions(false);
                    serialInputRef.current?.focus();
                  }}
                  className={`relative w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs font-medium font-sans transition-all duration-200 cursor-text ${
                    serialDropdownOpen
                      ? isDark
                        ? "bg-[#0A182B] border-[#1677FF] ring-2 ring-[#1677FF]/25 text-[#E6EDF7]"
                        : "bg-white border-[#1677FF] ring-2 ring-[#1677FF]/20 text-slate-900"
                      : isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF]/70 hover:bg-[#0A182B]"
                        : "bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                    <span className={`material-symbols-outlined text-[19px] shrink-0 pointer-events-none ${
                      isDark ? "text-[#38BDF8]" : "text-blue-600"
                    }`}>
                      memory
                    </span>
                    <input
                      ref={serialInputRef}
                      type="text"
                      required
                      value={serialNumber}
                      onChange={(e) => {
                        setSerialNumber(e.target.value);
                        if (!serialDropdownOpen) setSerialDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setSerialDropdownOpen(true);
                        setDeviceDropdownOpen(false);
                        setShowTypeSuggestions(false);
                      }}
                      placeholder="Serial number..."
                      className={`w-full bg-transparent outline-none text-xs font-medium font-sans ${
                        isDark
                          ? "text-white placeholder-[#64748B]"
                          : "text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {serialNumber && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSerialNumber("");
                          setSerialDropdownOpen(true);
                          serialInputRef.current?.focus();
                        }}
                        title="Hapus serial number"
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          isDark
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
                        setSerialDropdownOpen(!serialDropdownOpen);
                        setDeviceDropdownOpen(false);
                        setShowTypeSuggestions(false);
                        if (!serialDropdownOpen) {
                          serialInputRef.current?.focus();
                        }
                      }}
                      className="w-6 h-6 flex items-center justify-center cursor-pointer"
                    >
                      <span
                        className={`material-symbols-outlined text-[19px] transition-transform duration-200 ${
                          serialDropdownOpen
                            ? isDark ? "rotate-180 text-[#38BDF8]" : "rotate-180 text-blue-600"
                            : isDark ? "text-[#94A3B8]" : "text-slate-400"
                        }`}
                      >
                        expand_more
                      </span>
                    </button>
                  </div>
                </div>

                {/* Floating Popup Menu Filter Serial Number */}
                {serialDropdownOpen && (
                  <div className={`absolute left-0 top-full mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-50 max-h-56 overflow-y-auto custom-scrollbar backdrop-blur-md font-sans animate-dropdown ${
                    isDark
                      ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7]"
                      : "border-slate-200 bg-white text-slate-800"
                  }`}>
                    {matchingSerialList.length === 0 ? (
                      <div className={`px-3 py-2.5 text-xs font-sans ${
                        isDark ? "text-[#94A3B8]" : "text-slate-500"
                      }`}>
                        Tidak ada serial number yang cocok
                      </div>
                    ) : (
                      matchingSerialList.map((m) => {
                        const isSelected = serialNumber === m.serial_number;
                        return (
                          <button
                            key={m.modul_id || m.serial_number}
                            type="button"
                            onMouseDown={() => {
                              setSerialNumber(m.serial_number);
                              if (m.unit_type && (!unitType || unitType === "-")) {
                                setUnitType(m.unit_type);
                              }
                              if (
                                m.unit_part_number &&
                                m.unit_part_number !== "-" &&
                                !unitPartNumber
                              ) {
                                setUnitPartNumber(m.unit_part_number);
                              }
                              setSerialDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium font-sans flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[#1677FF] text-white font-semibold"
                                : isDark
                                  ? "hover:bg-[#122846] text-[#CBD5E1]"
                                  : "hover:bg-blue-50 text-slate-700"
                            }`}
                          >
                            <span className={`font-semibold truncate ${
                              isSelected
                                ? "text-white"
                                : isDark ? "text-white" : "text-slate-800"
                            }`}>
                              {m.serial_number}
                            </span>
                            {isSelected && (
                              <span className="material-symbols-outlined text-[16px] shrink-0">
                                check
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* 4. UNIT PART NUMBER */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Unit Part Number
                </label>
                <input
                  type="text"
                  placeholder="Part number..."
                  value={unitPartNumber}
                  onChange={(e) => setUnitPartNumber(e.target.value)}
                  className={`w-full h-11 px-3.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] font-sans transition-all ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {/* 5. NOMOR SLOT */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Nomor Slot *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nomor slot..."
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className={`w-full h-11 px-3.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] font-sans transition-all ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {/* 6. SHELF */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Shelf
                </label>
                <input
                  type="text"
                  placeholder="1"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  className={`w-full h-11 px-3.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] font-sans transition-all ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {/* 7. PORT */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Port
                </label>
                <input
                  type="text"
                  placeholder="Port..."
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className={`w-full h-11 px-3.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] font-sans transition-all ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {/* 8. TANGGAL PASANG / DATE */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Tanggal Pasang / Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full h-11 px-3.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] font-sans cursor-pointer transition-all ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white [color-scheme:dark]"
                      : "bg-slate-50 border-slate-200 text-slate-900 [color-scheme:light] focus:bg-white"
                  }`}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className={`flex items-center justify-end gap-3 pt-3 border-t ${
              isDark ? "border-[#1A2E4C]" : "border-slate-100"
            }`}>
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className={`h-11 px-5 rounded-xl border text-xs font-semibold font-sans transition-colors cursor-pointer ${
                  isDark
                    ? "border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846]"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-6 rounded-xl bg-[#1677FF] hover:bg-[#0E65D9] text-white text-xs font-semibold font-sans flex items-center gap-2 shadow-lg shadow-[#1677FF]/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">
                      progress_activity
                    </span>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    <span>Pasang Modul</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

// ==============================================================
// SUBCOMPONENT: EDIT MODULE MODAL
// ==============================================================
function EditModuleModal({ moduleData, meta, allModules = [], onClose, onSuccess }) {
  const { isDark } = useTheme();
  // 1. Perangkat State & Refs
  const [deviceId, setDeviceId] = useState(moduleData.device_id || "");
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const [deviceSearchQuery, setDeviceSearchQuery] = useState("");
  const deviceDropdownRef = useRef(null);

  // 2. Unit Type State & Refs
  const [unitType, setUnitType] = useState(
    moduleData.unit_type !== "-" ? moduleData.unit_type : ""
  );
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);
  const typeDropdownRef = useRef(null);
  const typeInputRef = useRef(null);

  // 3. Serial Number State & Refs
  const [serialNumber, setSerialNumber] = useState(moduleData.serial_number || "");
  const [serialDropdownOpen, setSerialDropdownOpen] = useState(false);
  const serialDropdownRef = useRef(null);
  const serialInputRef = useRef(null);

  // 4. Form States
  const [unitPartNumber, setUnitPartNumber] = useState(
    moduleData.unit_part_number !== "-" ? moduleData.unit_part_number : ""
  );
  const [slot, setSlot] = useState(moduleData.slot !== "-" ? moduleData.slot : "1");
  const [shelf, setShelf] = useState(moduleData.shelf !== "-" ? moduleData.shelf : "1");
  const [port, setPort] = useState(moduleData.port !== "-" ? moduleData.port : "");
  const [date, setDate] = useState(() => toInputDateFormat(moduleData.date_str));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(e.target)) {
        setDeviceDropdownOpen(false);
      }
      if (serialDropdownRef.current && !serialDropdownRef.current.contains(e.target)) {
        setSerialDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setShowTypeSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Selected device object
  const selectedDeviceObj = useMemo(() => {
    if (!deviceId) return null;
    return (meta.palu_devices || []).find((d) => String(d.id) === String(deviceId));
  }, [deviceId, meta.palu_devices]);

  // Filtered devices for popup
  const filteredDevices = useMemo(() => {
    const list = meta.palu_devices || [];
    if (!deviceSearchQuery.trim()) return list;
    const q = deviceSearchQuery.toLowerCase().trim();
    return list.filter(
      (d) =>
        (d.hostname && d.hostname.toLowerCase().includes(q)) ||
        (d.location && d.location.toLowerCase().includes(q)) ||
        (d.nama && d.nama.toLowerCase().includes(q))
    );
  }, [meta.palu_devices, deviceSearchQuery]);

  // Filtered module types for autocomplete
  const filteredModuleTypes = useMemo(() => {
    const types = meta.module_types || [];
    if (!unitType.trim()) return types;
    const q = unitType.toLowerCase().trim();
    return types.filter((mt) => mt.nama.toLowerCase().includes(q));
  }, [meta.module_types, unitType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!deviceId) return setError("Silakan pilih perangkat.");
    if (!unitType.trim()) return setError("Unit Type wajib diisi.");
    if (!serialNumber.trim()) return setError("Serial number wajib diisi.");
    if (!slot.trim()) return setError("Nomor slot wajib diisi.");
    if (!date) return setError("Tanggal wajib dipilih.");

    setLoading(true);
    try {
      const res = await fetch(`/api/modules/${moduleData.modul_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceId ? Number(deviceId) : undefined,
          unit_type: unitType.trim(),
          serial_number: serialNumber.trim(),
          unit_part_number: unitPartNumber.trim(),
          slot: slot.trim(),
          shelf: shelf.trim(),
          port: port.trim(),
          date: date.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.message || "Data modul berhasil diperbarui!");
      } else {
        setError(data.error || "Gagal memperbarui data modul.");
      }
    } catch (err) {
      console.error("Update module error:", err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div
          className={`rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar font-sans border transition-colors ${
            isDark
              ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
              : "bg-white border-slate-200 text-slate-800 shadow-xl"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3 border-b ${
            isDark ? "border-[#1A2E4C]" : "border-slate-100"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isDark
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-amber-50 border-amber-200 text-amber-600"
              }`}>
                <span className="material-symbols-outlined text-[22px]">edit_square</span>
              </div>
              <div>
                <h3 className={`text-base font-bold font-sans ${isDark ? "text-white" : "text-slate-900"}`}>
                  Edit Data Modul
                </h3>
                <p className={`text-xs font-sans ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                  Perbarui rincian modul atau sesuaikan posisi modul
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? "text-[#94A3B8] hover:text-white hover:bg-[#1A2E4C]"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {error && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 font-sans ${
              isDark
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-rose-50 border-rose-200 text-rose-600"
            }`}>
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. PERANGKAT (NE) - Custom Container Box Dropdown */}
              <div className="relative" ref={deviceDropdownRef}>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Perangkat (NE) *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setDeviceDropdownOpen(!deviceDropdownOpen);
                    setShowTypeSuggestions(false);
                    setSerialDropdownOpen(false);
                  }}
                  className={`relative w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs font-medium font-sans transition-all duration-200 cursor-pointer ${
                    deviceDropdownOpen
                      ? isDark
                        ? "bg-[#0A182B] border-[#1677FF] ring-2 ring-[#1677FF]/25 text-[#E6EDF7]"
                        : "bg-white border-[#1677FF] ring-2 ring-[#1677FF]/20 text-slate-900"
                      : isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF]/70 hover:bg-[#0A182B]"
                        : "bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span className={`material-symbols-outlined text-[19px] shrink-0 ${
                      isDark ? "text-[#38BDF8]" : "text-blue-600"
                    }`}>
                      desktop_windows
                    </span>
                    <span
                      className={`truncate ${
                        selectedDeviceObj
                          ? isDark ? "font-semibold text-white" : "font-semibold text-slate-900"
                          : isDark ? "text-[#64748B]" : "text-slate-400"
                      }`}
                    >
                      {selectedDeviceObj
                        ? `${selectedDeviceObj.hostname} (${selectedDeviceObj.location})`
                        : "Pilih Perangkat"}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[19px] transition-transform duration-200 shrink-0 ${
                      deviceDropdownOpen
                        ? isDark ? "rotate-180 text-[#38BDF8]" : "rotate-180 text-blue-600"
                        : isDark ? "text-[#94A3B8]" : "text-slate-400"
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Custom Filter Dropdown Menu */}
                {deviceDropdownOpen && (
                  <div className={`absolute left-0 top-full mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-50 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md font-sans animate-dropdown ${
                    isDark
                      ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7]"
                      : "border-slate-200 bg-white text-slate-800"
                  }`}>
                    {meta.palu_devices && meta.palu_devices.length > 5 && (
                      <div className={`px-1.5 pb-1.5 mb-1 border-b ${
                        isDark ? "border-[#1A3358]" : "border-slate-100"
                      }`}>
                        <div className="relative">
                          <span className={`material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[15px] ${
                            isDark ? "text-[#64748B]" : "text-slate-400"
                          }`}>
                            search
                          </span>
                          <input
                            type="text"
                            value={deviceSearchQuery}
                            onChange={(e) => setDeviceSearchQuery(e.target.value)}
                            placeholder="Cari perangkat..."
                            className={`w-full h-8 pl-7 pr-2 rounded-lg border text-[11px] outline-none font-sans ${
                              isDark
                                ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B] focus:border-[#1677FF]"
                                : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}
                    {filteredDevices.map((d) => {
                      const isSelected = String(deviceId) === String(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setDeviceId(String(d.id));
                            setDeviceDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium font-sans flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#1677FF] text-white font-semibold"
                              : isDark
                                ? "hover:bg-[#122846] text-[#CBD5E1]"
                                : "hover:bg-blue-50 text-slate-700"
                          }`}
                        >
                          <div className="flex flex-col truncate pr-2">
                            <span className="font-semibold">{d.hostname}</span>
                            <span
                              className={`text-[10px] ${
                                isSelected
                                  ? "text-blue-100"
                                  : isDark ? "text-[#64748B]" : "text-slate-400"
                              }`}
                            >
                              {d.location}
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

              {/* 2. UNIT TYPE - Autocomplete Dropdown */}
              <div className="relative" ref={typeDropdownRef}>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Unit Type *
                </label>
                <div
                  onClick={() => {
                    setShowTypeSuggestions(true);
                    setDeviceDropdownOpen(false);
                    setSerialDropdownOpen(false);
                    typeInputRef.current?.focus();
                  }}
                  className={`relative w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs font-medium font-sans transition-all duration-200 cursor-text ${
                    showTypeSuggestions
                      ? isDark
                        ? "bg-[#0A182B] border-[#1677FF] ring-2 ring-[#1677FF]/25 text-[#E6EDF7]"
                        : "bg-white border-[#1677FF] ring-2 ring-[#1677FF]/20 text-slate-900"
                      : isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF]/70 hover:bg-[#0A182B]"
                        : "bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                    <span className={`material-symbols-outlined text-[19px] shrink-0 pointer-events-none ${
                      isDark ? "text-[#38BDF8]" : "text-blue-600"
                    }`}>
                      category
                    </span>
                    <input
                      ref={typeInputRef}
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Pilih tipe..."
                      value={unitType}
                      onChange={(e) => {
                        setUnitType(e.target.value);
                        if (!showTypeSuggestions) setShowTypeSuggestions(true);
                      }}
                      onFocus={() => {
                        setShowTypeSuggestions(true);
                        setDeviceDropdownOpen(false);
                        setSerialDropdownOpen(false);
                      }}
                      className={`w-full bg-transparent outline-none text-xs font-medium font-sans ${
                        isDark
                          ? "text-white placeholder-[#64748B]"
                          : "text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {unitType && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUnitType("");
                          setShowTypeSuggestions(true);
                          typeInputRef.current?.focus();
                        }}
                        title="Hapus tipe"
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          isDark
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
                        setShowTypeSuggestions(!showTypeSuggestions);
                        setDeviceDropdownOpen(false);
                        setSerialDropdownOpen(false);
                        if (!showTypeSuggestions) {
                          typeInputRef.current?.focus();
                        }
                      }}
                      className="w-6 h-6 flex items-center justify-center cursor-pointer"
                    >
                      <span
                        className={`material-symbols-outlined text-[19px] transition-transform duration-200 ${
                          showTypeSuggestions
                            ? isDark ? "rotate-180 text-[#38BDF8]" : "rotate-180 text-blue-600"
                            : isDark ? "text-[#94A3B8]" : "text-slate-400"
                        }`}
                      >
                        expand_more
                      </span>
                    </button>
                  </div>
                </div>

                {/* Floating Popup Suggestions Menu */}
                {showTypeSuggestions && (
                  <div className={`absolute left-0 top-full mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-50 max-h-56 overflow-y-auto custom-scrollbar backdrop-blur-md font-sans animate-dropdown ${
                    isDark
                      ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7]"
                      : "border-slate-200 bg-white text-slate-800"
                  }`}>
                    {filteredModuleTypes.map((mt) => {
                      const isSelected = unitType.toLowerCase() === mt.nama.toLowerCase();
                      return (
                        <button
                          key={mt.id}
                          type="button"
                          onMouseDown={() => {
                            setUnitType(mt.nama);
                            setShowTypeSuggestions(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium font-sans flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#1677FF] text-white font-semibold"
                              : isDark
                                ? "hover:bg-[#122846] text-[#CBD5E1] hover:text-[#38BDF8]"
                                : "hover:bg-blue-50 text-slate-700 hover:text-blue-600"
                          }`}
                        >
                          <span className="font-semibold">{mt.nama}</span>
                          {mt.vendor && (
                            <span className={`text-[10px] font-sans ${
                              isDark ? "text-[#64748B]" : "text-slate-400"
                            }`}>
                              {mt.vendor}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {filteredModuleTypes.length === 0 && unitType.trim() && (
                      <div className={`px-3 py-2 text-[11px] font-sans ${
                        isDark ? "text-[#64748B]" : "text-slate-500"
                      }`}>
                        Gunakan nilai manual:{" "}
                        <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                          {unitType}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. SERIAL NUMBER */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Serial Number *
                </label>
                <input
                  type="text"
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className={`w-full h-11 px-3.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] font-sans transition-all ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {/* 4. UNIT PART NUMBER */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Unit Part Number
                </label>
                <input
                  type="text"
                  value={unitPartNumber}
                  onChange={(e) => setUnitPartNumber(e.target.value)}
                  className={`w-full h-11 px-3.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] font-sans transition-all ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {/* 5. NOMOR SLOT */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Nomor Slot *
                </label>
                <input
                  type="text"
                  required
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className={`w-full h-11 px-3.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] font-sans transition-all ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {/* 6. SHELF */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Shelf
                </label>
                <input
                  type="text"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  className={`w-full h-11 px-3.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] font-sans transition-all ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {/* 7. PORT */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Port
                </label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className={`w-full h-11 px-3.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] font-sans transition-all ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {/* 8. TANGGAL PASANG / DATE */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 font-sans ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}>
                  Tanggal Pasang / Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full h-11 px-3.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF] font-sans cursor-pointer transition-all ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white [color-scheme:dark]"
                      : "bg-slate-50 border-slate-200 text-slate-900 [color-scheme:light] focus:bg-white"
                  }`}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className={`flex items-center justify-end gap-3 pt-3 border-t ${
              isDark ? "border-[#1A2E4C]" : "border-slate-100"
            }`}>
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className={`h-11 px-5 rounded-xl border text-xs font-semibold font-sans transition-colors cursor-pointer ${
                  isDark
                    ? "border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846]"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs font-sans flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
                  isDark ? "shadow-amber-950/30" : "shadow-amber-500/20"
                }`}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">
                      progress_activity
                    </span>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

// ==============================================================
// SUBCOMPONENT: DETAIL MODULE MODAL
// ==============================================================
function DetailModuleModal({ item, loading, onClose }) {
  const { isDark } = useTheme();
  if (!item) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div
          className={`rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar font-sans border transition-colors ${
            isDark
              ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
              : "bg-white border-slate-200 text-slate-800 shadow-xl"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3 border-b ${
            isDark ? "border-[#1A2E4C]" : "border-slate-100"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isDark
                  ? "bg-[#00E5FF]/15 border-[#00E5FF]/30 text-[#00E5FF]"
                  : "bg-cyan-50 border-cyan-200 text-cyan-600"
              }`}>
                <span className="material-symbols-outlined text-[22px]">memory</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-base font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                    {item.serial_number}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${(item.kondisi || "AKTIF").toUpperCase() === "AKTIF"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : (item.kondisi || "").toUpperCase() === "RUSAK"
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}
                  >
                    {item.kondisi || "AKTIF"}
                  </span>
                </div>
                <p className={`text-xs font-sans ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                  Informasi detail spesifikasi dan posisi modul pada perangkat
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? "text-[#94A3B8] hover:text-white hover:bg-[#1A2E4C]"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {loading ? (
            <div className={`py-12 text-center ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
              <span className="material-symbols-outlined text-4xl animate-spin text-[#1677FF]">
                progress_activity
              </span>
              <p className="text-xs mt-2">Memuat rincian database...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Grid Informasi Modul */}
              <div>
                <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 font-sans ${
                  isDark ? "text-[#38BDF8]" : "text-blue-600"
                }`}>
                  Spesifikasi & Identitas Modul
                </h4>
                <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl p-4 text-xs font-sans border ${
                  isDark
                    ? "bg-[#071426] border-[#1A2E4C]"
                    : "bg-slate-50 border-slate-200"
                }`}>
                  <div>
                    <span className={`text-[11px] block ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                      Unit Type
                    </span>
                    <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {item.unit_type}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[11px] block ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                      Kategori
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      item.category === "SFP"
                        ? isDark
                          ? "bg-[#0E3B33] text-[#34D399] border-[#059669]/40"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : isDark
                          ? "bg-[#25133E] text-[#C084FC] border-[#A855F7]/35"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.category === "SFP" ? "bg-[#10B981]" : "bg-[#A855F7]"}`}></span>
                      <span>{item.category || (item.port && item.port !== "-" ? "SFP" : "CARD")}</span>
                    </span>
                  </div>
                  <div>
                    <span className={`text-[11px] block ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                      Unit Part Number
                    </span>
                    <span className={`font-mono ${isDark ? "text-[#CBD5E1]" : "text-slate-600"}`}>
                      {item.unit_part_number || "-"}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[11px] block ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                      Tanggal Asli
                    </span>
                    <span className={`font-mono ${isDark ? "text-[#CBD5E1]" : "text-slate-600"}`}>
                      {item.date_str || "-"}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[11px] block ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                      Perangkat Terpasang
                    </span>
                    <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {item.ne_name}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[11px] block ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                      Lokasi STO
                    </span>
                    <span className={isDark ? "text-[#CBD5E1]" : "text-slate-700"}>
                      {item.location_name}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[11px] block ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                      Posisi Slot
                    </span>
                    <span className={`font-bold ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                      Shelf {item.shelf || "1"} • Slot {item.slot} • Port {item.port || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-[#1677FF] hover:bg-[#0E65D9] text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
