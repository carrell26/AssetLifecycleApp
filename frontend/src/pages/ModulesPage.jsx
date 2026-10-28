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

  // Fetch Modules & Stats
  const fetchModules = async (targetDevice = selectedDevice, search = searchValue) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: 1,
        per_page: 1000,
      });
      if (targetDevice) params.append("ne", targetDevice);
      if (search && search.trim()) params.append("q", search.trim());

      const res = await fetch(`/api/modules?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAllModules(data.items || []);
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
  }, []);

  useEffect(() => {
    fetchModules(selectedDevice, searchValue);
    setPage(1);
  }, [selectedDevice, searchValue]);

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

  // 1. Search filtering across all fields
  const searchedModules = useMemo(() => {
    if (!searchValue || !searchValue.trim()) return allModules;
    const q = searchValue.trim().toLowerCase();
    return allModules.filter((item) => {
      return (
        (item.ne_name && item.ne_name.toLowerCase().includes(q)) ||
        (item.unit_type && item.unit_type.toLowerCase().includes(q)) ||
        (item.location_name && item.location_name.toLowerCase().includes(q)) ||
        (item.shelf && String(item.shelf).toLowerCase().includes(q)) ||
        (item.slot && String(item.slot).toLowerCase().includes(q)) ||
        (item.port && String(item.port).toLowerCase().includes(q)) ||
        (item.unit_part_number && item.unit_part_number.toLowerCase().includes(q)) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(q)) ||
        (item.date_str && item.date_str.toLowerCase().includes(q))
      );
    });
  }, [allModules, searchValue]);

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
                {stats.total_modules}
              </span>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${isDark ? "bg-[#0F294D] text-[#38BDF8] border border-[#1E4378]" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                Unit
              </span>
            </div>
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
                {stats.total_devices}
              </span>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${isDark ? "bg-[#24133F] text-[#D8B4FE] border border-[#4C2880]" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
                Unit
              </span>
            </div>
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
                {stats.total_locations}
              </span>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${isDark ? "bg-[#0A2E24] text-[#6EE7B7] border border-[#15604B]" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                Titik STO
              </span>
            </div>
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
        className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${isDark
          ? "bg-[#0D1F36] border-[#1A3358] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          : "bg-white border-slate-200 shadow-md"
          }`}
      >
        {/* Controls Row: Dropdown filter on left, Pasang Modul Baru on right */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4">
          {/* Left: Device Filter Dropdown (HANYA STO PALU 1 & STO PALU 2) */}
          <div className="relative w-full sm:w-80" ref={deviceDropdownRef}>
            <button
              type="button"
              onClick={() => setDeviceDropdownOpen(!deviceDropdownOpen)}
              className={`relative w-full h-11 px-9 rounded-xl border flex items-center justify-center text-xs font-medium transition-all cursor-pointer ${isDark
                ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500"
                }`}
            >
              <div className="flex items-center justify-center gap-2.5 truncate">
                <span className="material-symbols-outlined text-[19px] text-[#38BDF8] shrink-0">
                  desktop_windows
                </span>
                <span className="truncate font-semibold">
                  {selectedDevice ? selectedDevice : "Semua Perangkat"}
                </span>
              </div>
              <span
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#94A3B8] transition-transform duration-200 ${deviceDropdownOpen ? "rotate-180" : ""
                  }`}
              >
                expand_more
              </span>
            </button>

            {/* Custom Filter Dropdown Menu (Hanya STO PALU 1 & 2) */}
            {deviceDropdownOpen && (
              <div
                className={`absolute left-0 top-12 mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-30 max-h-64 overflow-y-auto custom-scrollbar backdrop-blur-md ${isDark
                  ? "bg-[#0A182B]/95 border-[#1E3A5F] text-[#E6EDF7]"
                  : "bg-white border-slate-200 text-slate-800"
                  }`}
              >
                {/* Option: Semua Perangkat Palu */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDevice("");
                    setDeviceDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${selectedDevice === ""
                    ? isDark
                      ? "bg-[#1677FF] text-white"
                      : "bg-blue-600 text-white"
                    : isDark
                      ? "hover:bg-[#122846] text-[#CBD5E1]"
                      : "hover:bg-slate-100 text-slate-700"
                    }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">Semua Perangkat</span>
                    <span className={`text-[10px] ${selectedDevice === "" ? "text-blue-100" : isDark ? "text-[#64748B]" : "text-slate-400"}`}>
                      Fokus STO PALU 1 & STO PALU 2
                    </span>
                  </div>
                  {selectedDevice === "" && (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  )}
                </button>

                <div className="h-px bg-[#1A3358] my-1"></div>

                {/* Device Options from DB (Only STO PALU 1 & STO PALU 2) */}
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
                          ? "bg-[#1677FF] text-white"
                          : "bg-blue-600 text-white"
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

          {/* Right: Pasang Modul Baru Button (Hanya 1 ikon plus, tanpa dobel +) */}
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

        {/* Sub-header: Total baris info banner (Ukuran tetap tanpa pergeseran layout) */}
        <div className="flex items-center gap-2 pt-1 pb-4 text-xs font-medium text-[#38BDF8]">
          <span className="material-symbols-outlined text-[17px] text-[#00E5FF]">
            info
          </span>
          <span>
            Total data ditampilkan:{" "}
            <strong className={isDark ? "text-white font-bold" : "text-slate-900 font-bold"}>
              {totalItems}
            </strong>{" "}
            baris ({scopeInfo})
          </span>
        </div>

        {/* ======================================================== */}
        {/* C. STRUKTUR TABEL MODUL (WAJIB 10 KOLOM SESUAI GAMBAR)    */}
        {/* ======================================================== */}
        <div className={`overflow-x-auto custom-scrollbar rounded-xl border ${isDark ? "border-[#162F52]" : "border-slate-200"}`}>
          <table className="w-full text-left border-collapse min-w-[1180px] table-fixed">
            <colgroup>
              <col style={{ width: '15%' }} /> {/* 1. NAMA PERANGKAT */}
              <col style={{ width: '10%' }} /> {/* 2. UNIT TYPE */}
              <col style={{ width: '11%' }} /> {/* 3. LOKASI */}
              <col style={{ width: '5%' }} />  {/* 4. SHELF */}
              <col style={{ width: '5%' }} />  {/* 5. SLOT */}
              <col style={{ width: '5%' }} />  {/* 6. PORT */}
              <col style={{ width: '13%' }} /> {/* 7. UNIT PART NUMBER */}
              <col style={{ width: '13%' }} /> {/* 8. SERIAL NUMBER */}
              <col style={{ width: '9%' }} />  {/* 9. DATE */}
              <col style={{ width: '14%' }} /> {/* 10. AKSI */}
            </colgroup>
            <thead>
              <tr className={`border-b ${isDark ? "bg-[#09172A] border-[#18355C]" : "bg-slate-50 border-slate-200"}`}>
                {/* 1. NAMA PERANGKAT */}
                <th className="py-3 px-3 text-[11px] font-extrabold uppercase tracking-wider text-left">
                  <TableSortHeader
                    title="NAMA PERANGKAT"
                    sortKey="ne_name"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>

                {/* 2. UNIT TYPE */}
                <th className="py-3 px-3 text-[11px] font-extrabold uppercase tracking-wider text-left">
                  <TableSortHeader
                    title="UNIT TYPE"
                    sortKey="unit_type"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>

                {/* 3. LOKASI */}
                <th className="py-3 px-3 text-[11px] font-extrabold uppercase tracking-wider text-left">
                  <TableSortHeader
                    title="LOKASI"
                    sortKey="location_name"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>

                {/* 4. SHELF */}
                <th className="py-3 px-2 text-[11px] font-extrabold uppercase tracking-wider text-center">
                  <TableSortHeader
                    title="SHELF"
                    sortKey="shelf"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="center"
                    isDark={isDark}
                  />
                </th>

                {/* 5. SLOT */}
                <th className="py-3 px-2 text-[11px] font-extrabold uppercase tracking-wider text-center">
                  <TableSortHeader
                    title="SLOT"
                    sortKey="slot"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="center"
                    isDark={isDark}
                  />
                </th>

                {/* 6. PORT */}
                <th className="py-3 px-2 text-[11px] font-extrabold uppercase tracking-wider text-center">
                  <TableSortHeader
                    title="PORT"
                    sortKey="port"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="center"
                    isDark={isDark}
                  />
                </th>

                {/* 7. UNIT PART NUMBER */}
                <th className="py-3 px-3 text-[11px] font-extrabold uppercase tracking-wider text-left">
                  <TableSortHeader
                    title="UNIT PART NUMBER"
                    sortKey="unit_part_number"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>

                {/* 8. SERIAL NUMBER */}
                <th className="py-3 px-3 text-[11px] font-extrabold uppercase tracking-wider text-left">
                  <TableSortHeader
                    title="SERIAL NUMBER"
                    sortKey="serial_number"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>

                {/* 9. DATE */}
                <th className="py-3 px-2 text-[11px] font-extrabold uppercase tracking-wider text-left">
                  <TableSortHeader
                    title="DATE"
                    sortKey="date_str"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>

                {/* 10. AKSI */}
                <th className={`py-3.5 px-3 text-[11px] font-extrabold uppercase tracking-wider text-center ${isDark ? "text-[#38BDF8]" : "text-blue-600"
                  }`}>
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${isDark ? "divide-[#132845]" : "divide-slate-200"}`}>
              {loading ? (
                <tr>
                  <td colSpan="10" className={`py-16 text-center ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
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
                  <td colSpan="10" className={`py-14 text-center ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
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
                    className={`transition-colors group ${isDark
                      ? "hover:bg-[#102444]/60"
                      : "hover:bg-slate-50/80 even:bg-slate-50/40"
                      }`}
                  >
                    {/* 1. NAMA PERANGKAT */}
                    <td className={`py-3 px-4 font-semibold whitespace-nowrap ${isDark ? "text-[#E6EDF7]" : "text-slate-800"
                      }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[13px] shrink-0 border ${isDark
                          ? "bg-[#0D264A] text-[#38BDF8] border-[#164375]"
                          : "bg-blue-50 text-blue-600 border-blue-200"
                          }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            hard_drive
                          </span>
                        </div>
                        <span className="font-mono">{item.ne_name}</span>
                      </div>
                    </td>

                    {/* 2. UNIT TYPE */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${isDark
                        ? "bg-[#0C2548] border-[#1A4378] text-[#38BDF8]"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}>
                        {item.unit_type}
                      </span>
                    </td>

                    {/* 3. LOKASI */}
                    <td className={`py-3 px-3 whitespace-nowrap ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                      }`}>
                      {item.location_name}
                    </td>

                    {/* 4. SHELF */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center min-w-[26px] h-[26px] px-1.5 rounded-md border font-bold text-xs font-mono ${isDark
                        ? "bg-[#0D2F54] border-[#174F88] text-[#38BDF8]"
                        : "bg-sky-50 border-sky-200 text-sky-700"
                        }`}>
                        {item.shelf || "1"}
                      </span>
                    </td>

                    {/* 5. SLOT */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center min-w-[26px] h-[26px] px-1.5 rounded-md border font-bold text-xs font-mono ${isDark
                        ? "bg-[#0D2F54] border-[#174F88] text-[#38BDF8]"
                        : "bg-sky-50 border-sky-200 text-sky-700"
                        }`}>
                        {item.slot}
                      </span>
                    </td>

                    {/* 6. PORT */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center min-w-[26px] h-[26px] px-1.5 rounded-md border font-bold text-xs font-mono ${isDark
                        ? "bg-[#0D2F54] border-[#174F88] text-[#38BDF8]"
                        : "bg-sky-50 border-sky-200 text-sky-700"
                        }`}>
                        {item.port || "-"}
                      </span>
                    </td>

                    {/* 7. UNIT PART NUMBER */}
                    <td className={`py-3 px-4 font-mono text-[11px] whitespace-nowrap ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                      }`}>
                      {item.unit_part_number}
                    </td>

                    {/* 8. SERIAL NUMBER */}
                    <td className={`py-3 px-4 font-mono font-bold tracking-wide whitespace-nowrap ${isDark ? "text-[#F8FAFC]" : "text-slate-900"
                      }`}>
                      {item.serial_number}
                    </td>

                    {/* 9. DATE */}
                    <td className={`py-3 px-3 font-mono text-[11px] whitespace-nowrap ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                      }`}>
                      {item.date_str}
                    </td>

                    {/* 10. AKSI */}
                    <td className="py-3 px-3 whitespace-nowrap text-center">
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
              className="bg-[#0D1F36] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">warning</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Konfirmasi Hapus Modul</h3>
                  <p className="text-xs text-rose-300">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>

              <div className="bg-[#071426] border border-[#1A2E4C] rounded-xl p-4 text-xs space-y-2 text-[#CBD5E1]">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Serial Number:</span>
                  <span className="font-mono font-bold text-white">
                    {selectedForDelete.serial_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Perangkat:</span>
                  <span className="font-mono text-white">{selectedForDelete.ne_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Unit Type:</span>
                  <span className="font-semibold text-[#38BDF8]">
                    {selectedForDelete.unit_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Lokasi / Slot:</span>
                  <span>
                    {selectedForDelete.location_name} • Slot {selectedForDelete.slot}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
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
                  className="px-4 py-2.5 rounded-xl border border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846] text-xs font-semibold transition-colors cursor-pointer"
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
function CreateModuleModal({ meta, onClose, onSuccess }) {
  // 4. Dropdown harus dalam keadaan belum dipilih dengan placeholder
  const [deviceId, setDeviceId] = useState("");
  // 5. Unit Type teks autocomplete
  const [unitType, setUnitType] = useState("");
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [unitPartNumber, setUnitPartNumber] = useState("");
  const [slot, setSlot] = useState("");
  const [shelf, setShelf] = useState("1");
  const [port, setPort] = useState("");
  // 3. Date picker calendar (YYYY-MM-DD)
  const [date, setDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 4. Validasi wajib memilih
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
          className="bg-[#0D1F36] border border-[#1E3A5F] rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1A2E4C]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1677FF]/15 border border-[#1677FF]/30 flex items-center justify-center text-[#38BDF8]">
                <span className="material-symbols-outlined text-[22px]">add_circle</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pasang Modul Baru</h3>
                <p className="text-xs text-[#94A3B8]">
                  Pasang modul fisik baru pada perangkat jaringan yang aktif
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1A2E4C] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Perangkat (Wajib pilih, placeholder 'Pilih Perangkat') */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Perangkat (NE) *
                </label>
                <select
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl bg-[#071426] border text-xs focus:outline-none focus:border-[#1677FF] cursor-pointer ${deviceId ? "text-white border-[#1E3A5F]" : "text-[#64748B] border-[#1E3A5F]"
                    }`}
                >
                  <option value="" disabled>
                    Pilih Perangkat
                  </option>
                  {meta.palu_devices.map((d) => (
                    <option key={d.id} value={d.id} className="text-white bg-[#071426]">
                      {d.hostname} ({d.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Unit Type dengan Autocomplete (Input Teks Manual + Saran DB) */}
              <div className="relative">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Unit Type *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Ketik tipe (misal: 2UC400)..."
                  value={unitType}
                  onChange={(e) => {
                    setUnitType(e.target.value);
                    setShowTypeSuggestions(true);
                  }}
                  onFocus={() => setShowTypeSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTypeSuggestions(false), 200)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#1677FF] font-mono"
                />

                {/* Saran Autocomplete */}
                {showTypeSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl bg-[#0A182B] border border-[#1E3A5F] shadow-2xl max-h-48 overflow-y-auto custom-scrollbar p-1.5">
                    {meta.module_types
                      .filter((mt) =>
                        mt.nama.toLowerCase().includes(unitType.toLowerCase())
                      )
                      .map((mt) => (
                        <button
                          key={mt.id}
                          type="button"
                          onMouseDown={() => {
                            setUnitType(mt.nama);
                            setShowTypeSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#122846] text-[#CBD5E1] hover:text-[#38BDF8] flex items-center justify-between transition-colors font-mono cursor-pointer"
                        >
                          <span className="font-semibold">{mt.nama}</span>
                          {mt.vendor && (
                            <span className="text-[10px] text-[#64748B] font-sans">
                              {mt.vendor}
                            </span>
                          )}
                        </button>
                      ))}
                    {meta.module_types.filter((mt) =>
                      mt.nama.toLowerCase().includes(unitType.toLowerCase())
                    ).length === 0 && unitType.trim() && (
                        <div className="px-3 py-2 text-[11px] text-[#64748B]">
                          Gunakan nilai manual:{" "}
                          <span className="text-white font-mono font-semibold">{unitType}</span>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Serial Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ZJ2108000H9"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#1677FF] font-mono"
                />
              </div>

              {/* Unit Part Number */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Unit Part Number
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 3KC60346AANG03"
                  value={unitPartNumber}
                  onChange={(e) => setUnitPartNumber(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#1677FF] font-mono"
                />
              </div>

              {/* Slot */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Nomor Slot *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1, 10, atau 2"
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#1677FF] font-mono"
                />
              </div>

              {/* Shelf */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Shelf
                </label>
                <input
                  type="text"
                  placeholder="1"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#1677FF] font-mono"
                />
              </div>

              {/* Port */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Port
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 1, 2, atau N/A"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#1677FF] font-mono"
                />
              </div>

              {/* 3. Date (Input Kalender type='date') */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Tanggal Pasang / Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF] font-mono [color-scheme:dark] cursor-pointer"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A2E4C]">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846] text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-[#1677FF] hover:bg-[#0E65D9] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#1677FF]/30 transition-all cursor-pointer disabled:opacity-50"
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
                    <span className="material-symbols-outlined text-[16px]">check</span>
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
function EditModuleModal({ moduleData, meta, onClose, onSuccess }) {
  const [deviceId, setDeviceId] = useState(moduleData.device_id || "");
  // 5. Unit Type autocomplete pada Edit
  const [unitType, setUnitType] = useState(moduleData.unit_type !== "-" ? moduleData.unit_type : "");
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);
  const [serialNumber, setSerialNumber] = useState(moduleData.serial_number || "");
  const [unitPartNumber, setUnitPartNumber] = useState(
    moduleData.unit_part_number !== "-" ? moduleData.unit_part_number : ""
  );
  const [slot, setSlot] = useState(moduleData.slot !== "-" ? moduleData.slot : "1");
  const [shelf, setShelf] = useState(moduleData.shelf !== "-" ? moduleData.shelf : "1");
  const [port, setPort] = useState(moduleData.port !== "-" ? moduleData.port : "");
  // 3. Date picker calendar (YYYY-MM-DD)
  const [date, setDate] = useState(() => toInputDateFormat(moduleData.date_str));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
          className="bg-[#0D1F36] border border-[#1E3A5F] rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1A2E4C]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <span className="material-symbols-outlined text-[22px]">edit_square</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Edit Data Modul</h3>
                <p className="text-xs text-[#94A3B8]">
                  Perbarui rincian modul atau sesuaikan posisi modul
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1A2E4C] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Perangkat */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Perangkat (NE) *
                </label>
                <select
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF] cursor-pointer"
                >
                  <option value="" disabled>Pilih Perangkat</option>
                  {meta.palu_devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.hostname} ({d.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Unit Type dengan Autocomplete */}
              <div className="relative">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Unit Type *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Ketik tipe modul..."
                  value={unitType}
                  onChange={(e) => {
                    setUnitType(e.target.value);
                    setShowTypeSuggestions(true);
                  }}
                  onFocus={() => setShowTypeSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTypeSuggestions(false), 200)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF] font-mono"
                />

                {/* Saran Autocomplete */}
                {showTypeSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl bg-[#0A182B] border border-[#1E3A5F] shadow-2xl max-h-48 overflow-y-auto custom-scrollbar p-1.5">
                    {meta.module_types
                      .filter((mt) =>
                        mt.nama.toLowerCase().includes(unitType.toLowerCase())
                      )
                      .map((mt) => (
                        <button
                          key={mt.id}
                          type="button"
                          onMouseDown={() => {
                            setUnitType(mt.nama);
                            setShowTypeSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#122846] text-[#CBD5E1] hover:text-[#38BDF8] flex items-center justify-between transition-colors font-mono cursor-pointer"
                        >
                          <span className="font-semibold">{mt.nama}</span>
                          {mt.vendor && (
                            <span className="text-[10px] text-[#64748B] font-sans">
                              {mt.vendor}
                            </span>
                          )}
                        </button>
                      ))}
                    {meta.module_types.filter((mt) =>
                      mt.nama.toLowerCase().includes(unitType.toLowerCase())
                    ).length === 0 && unitType.trim() && (
                        <div className="px-3 py-2 text-[11px] text-[#64748B]">
                          Gunakan nilai manual:{" "}
                          <span className="text-white font-mono font-semibold">{unitType}</span>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Serial Number *
                </label>
                <input
                  type="text"
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white font-mono focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              {/* Unit Part Number */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Unit Part Number
                </label>
                <input
                  type="text"
                  value={unitPartNumber}
                  onChange={(e) => setUnitPartNumber(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white font-mono focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              {/* Slot */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Nomor Slot *
                </label>
                <input
                  type="text"
                  required
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white font-mono focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              {/* Shelf */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Shelf
                </label>
                <input
                  type="text"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white font-mono focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              {/* Port */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Port
                </label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white font-mono focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              {/* 3. Date (Kalender type='date') */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Tanggal Pasang / Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white font-mono focus:outline-none focus:border-[#1677FF] [color-scheme:dark] cursor-pointer"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A2E4C]">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846] text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/30 transition-all cursor-pointer disabled:opacity-50"
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
                    <span className="material-symbols-outlined text-[16px]">save</span>
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
  if (!item) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-[#0D1F36] border border-[#1E3A5F] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1A2E4C]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
                <span className="material-symbols-outlined text-[22px]">memory</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-mono">
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
                <p className="text-xs text-[#94A3B8]">
                  Informasi detail spesifikasi dan posisi modul pada perangkat
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1A2E4C] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[#94A3B8]">
              <span className="material-symbols-outlined text-4xl animate-spin text-[#1677FF]">
                progress_activity
              </span>
              <p className="text-xs mt-2">Memuat rincian database...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Grid Informasi Modul */}
              <div>
                <h4 className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider mb-2.5">
                  Spesifikasi & Identitas Modul
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#071426] border border-[#1A2E4C] rounded-xl p-4 text-xs">
                  <div>
                    <span className="text-[#94A3B8] text-[11px] block">Unit Type</span>
                    <span className="font-semibold text-white">{item.unit_type}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] text-[11px] block">Unit Part Number</span>
                    <span className="font-mono text-[#CBD5E1]">
                      {item.unit_part_number || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] text-[11px] block">Tanggal Asli</span>
                    <span className="font-mono text-[#CBD5E1]">{item.date_str || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] text-[11px] block">Perangkat Terpasang</span>
                    <span className="font-semibold text-white">{item.ne_name}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] text-[11px] block">Lokasi STO</span>
                    <span className="text-[#CBD5E1]">{item.location_name}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] text-[11px] block">Posisi Slot</span>
                    <span className="font-bold text-[#38BDF8]">
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
