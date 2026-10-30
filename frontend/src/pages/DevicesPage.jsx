import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import statDevice from "../assets/stat_device.jpg";
import statLocation from "../assets/stat_location.jpg";
import TableSortHeader from "../components/TableSortHeader";
import TablePagination from "../components/TablePagination";
import ModalPortal from "../components/ModalPortal";
import { sortData } from "../utils/sortUtils";

const deviceColumnNames = {
  nama_perangkat: "Nama Perangkat",
  tipe: "Tipe",
  lokasi: "Lokasi",
};

const deviceColumnTypes = {
  nama_perangkat: "text",
  tipe: "text",
  lokasi: "text",
};

export default function DevicesPage({ user, searchValue, onSearchChange }) {
  const { isDark } = useTheme();

  // State utama data perangkat & filter
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_devices: 2,
    total_locations: 2,
  });

  // Filter options dari database
  const [filterOptions, setFilterOptions] = useState({
    locations: [],
    types: [],
  });

  // Filter internal state
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [localSearch, setLocalSearch] = useState(searchValue || "");
  const searchTimeoutRef = useRef(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Dropdown menus state
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const locationDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);
  const addMenuRef = useRef(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTypeModalOpen, setCreateTypeModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedForDetail, setSelectedForDetail] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Close dropdowns when clicked outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(e.target)
      ) {
        setLocationDropdownOpen(false);
      }
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(e.target)
      ) {
        setTypeDropdownOpen(false);
      }
      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(e.target)
      ) {
        setAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync external search prop if changed from topbar
  useEffect(() => {
    if (searchValue !== undefined && searchValue !== localSearch) {
      setLocalSearch(searchValue);
      fetchDevices(selectedLocation, selectedType, searchValue);
    }
  }, [searchValue]);

  // Debounced search handler
  const handleSearchChange = (val) => {
    setLocalSearch(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      if (onSearchChange) onSearchChange(val);
      fetchDevices(selectedLocation, selectedType, val);
      setPage(1);
    }, 300);
  };

  // Fetch devices from backend API
  const fetchDevices = async (
    locId = selectedLocation,
    typeId = selectedType,
    query = localSearch
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (locId) params.append("location_id", locId);
      if (typeId) params.append("device_type_id", typeId);
      if (query && query.trim()) params.append("q", query.trim());

      const res = await fetch(`/api/devices?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setDevices(data.items || []);
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.filter_options) {
          setFilterOptions(data.filter_options);
        }
      } else {
        showToast(data.error || "Gagal memuat data perangkat", "error");
      }
    } catch (err) {
      console.error("Fetch devices error:", err);
      showToast("Terjadi gangguan jaringan saat memuat data perangkat", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices(selectedLocation, selectedType, localSearch);
    setPage(1);
  }, [selectedLocation, selectedType]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (onSearchChange) onSearchChange(localSearch);
    fetchDevices(selectedLocation, selectedType, localSearch);
    setPage(1);
  };

  // Handle Column Sorting (asc -> desc -> none)
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

  // Sorting applied before pagination
  const sortedDevices = useMemo(() => {
    return sortData(
      devices,
      sortConfig.key,
      sortConfig.direction,
      deviceColumnTypes
    );
  }, [devices, sortConfig]);

  // Pagination calculations based on sorted result
  const totalItems = sortedDevices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paginatedDevices = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return sortedDevices.slice(start, start + perPage);
  }, [sortedDevices, safePage, perPage]);

  // Open detail modal with live modules query
  const handleOpenDetail = (device) => {
    setSelectedForDetail(device);
    setDetailModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (device) => {
    setSelectedForEdit(device);
    setEditModalOpen(true);
  };

  // Open delete confirm modal
  const handleOpenDelete = (device) => {
    setSelectedForDelete(device);
    setDeleteModalOpen(true);
  };

  // Handle delete execution
  const handleDeleteConfirm = async () => {
    if (!selectedForDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/devices/${selectedForDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Perangkat berhasil dihapus", "success");
        setDeleteModalOpen(false);
        setSelectedForDelete(null);
        fetchDevices(selectedLocation, selectedType, localSearch);
      } else {
        showToast(data.error || "Gagal menghapus perangkat", "error");
      }
    } catch (err) {
      console.error("Delete device error:", err);
      showToast("Terjadi kesalahan jaringan saat menghapus perangkat", "error");
    } finally {
      setDeleting(false);
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

      {/* ============================================================ */}
      {/* 1. DUA KARTU STATISTIK (Sesuai Referensi Screenshot)          */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
        {/* KPI 1: TOTAL PERANGKAT */}
        <div
          className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ease-in-out p-6 flex items-center justify-between group cursor-pointer hover:-translate-y-1 ${isDark
            ? "bg-[#0D1F36] border-[#1A3358] hover:border-[#1677FF] hover:shadow-[0_10px_30px_rgba(22,119,255,0.22)]"
            : "bg-white border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md"
            }`}
        >
          <div className="flex flex-col justify-between h-full z-10">
            {/* Header: Cyan dot indicator */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isDark ? "bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" : "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]"}`}></span>
              <span className={`text-[11px] font-bold tracking-widest uppercase ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                TOTAL PERANGKAT
              </span>
            </div>

            {/* Value & Badge */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? "text-[#F8FAFC]" : "text-slate-900"}`}>
                {stats.total_devices}
              </span>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${isDark ? "bg-[#0F294D] text-[#38BDF8] border border-[#1E4378]" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                UNIT
              </span>
            </div>

            {/* Subtitle */}
            <p className={`text-xs mt-2 font-medium ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
              Perangkat jaringan backbone transmisi optik aktif terpasang.
            </p>
          </div>

          {/* Right Icon / 3D Illustration Container with Neon Glow */}
          <div className={`relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden p-1 group-hover:scale-105 transition-all duration-300 flex items-center justify-center ${isDark
            ? "bg-[#071527] border border-[#00E5FF]/40 shadow-[0_0_18px_rgba(0,229,255,0.22)] group-hover:border-[#00E5FF]/80"
            : "bg-blue-50/80 border border-blue-200 shadow-sm group-hover:border-blue-400"
            }`}>
            <img
              src={statDevice}
              alt="Total Perangkat 3D"
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#00E5FF]/10 to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* KPI 2: TOTAL LOKASI */}
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
                TITIK STO
              </span>
            </div>

            {/* Subtitle */}
            <p className={`text-xs mt-2 font-medium ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
              Pusat operasional transmisi telekomunikasi Palu aktif.
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

      {/* ============================================================ */}
      {/* 2. PANEL TABEL PERANGKAT (100% MENGIKUTI STYLE LOKASI)       */}
      {/* ============================================================ */}
      <div
        className={`rounded-2xl border transition-all duration-300 overflow-visible w-full ${isDark
          ? "border-[#162F52] bg-[#0A182B] shadow-2xl"
          : "border-slate-200 bg-white shadow-sm"
          }`}
      >
        {/* Controls Toolbar: Search Bar di kiri, Dropdown Filter & Tambah Perangkat di kanan */}
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
              id="deviceSearchInput"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari nama perangkat, tipe, atau lokasi..."
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

          {/* Right: Location & Type Filter Dropdowns & Tombol Tambah Perangkat */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Dropdown 1: Semua Lokasi */}
            <div className="relative min-w-[170px]" ref={locationDropdownRef}>
              <button
                type="button"
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium transition-all cursor-pointer ${isDark
                  ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                  : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500"
                  }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="material-symbols-outlined text-[18px] text-[#38BDF8] shrink-0">
                    location_on
                  </span>
                  <span className="truncate font-semibold">
                    {selectedLocation
                      ? filterOptions.locations.find(
                        (l) => String(l.id) === String(selectedLocation)
                      )?.nama || "Lokasi Terpilih"
                      : "Semua Lokasi"}
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${locationDropdownOpen ? "rotate-180" : ""
                    }`}
                >
                  expand_more
                </span>
              </button>

              {/* Menu Dropdown Lokasi */}
              {locationDropdownOpen && (
                <div
                  className={`absolute left-0 top-12 mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-30 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md animate-dropdown ${isDark
                    ? "bg-[#0A182B]/95 border-[#1E3A5F] text-[#E6EDF7]"
                    : "bg-white border-slate-200 text-slate-800"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocation("");
                      setLocationDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${selectedLocation === ""
                      ? isDark
                        ? "bg-[#1677FF] text-white font-semibold"
                        : "bg-blue-600 text-white font-semibold"
                      : isDark
                        ? "hover:bg-[#122846] text-[#CBD5E1]"
                        : "hover:bg-slate-100 text-slate-700"
                      }`}
                  >
                    <span>Semua Lokasi</span>
                    {selectedLocation === "" && (
                      <span className="material-symbols-outlined text-[16px] shrink-0">
                        check
                      </span>
                    )}
                  </button>

                  <div className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"}`} />

                  {filterOptions.locations.map((loc) => {
                    const isSelected = String(selectedLocation) === String(loc.id);
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(String(loc.id));
                          setLocationDropdownOpen(false);
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
                        <span className="truncate pr-2">{loc.nama}</span>
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

            {/* Filter Dropdown 2: Semua Tipe */}
            <div className="relative min-w-[160px]" ref={typeDropdownRef}>
              <button
                type="button"
                onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium transition-all cursor-pointer ${isDark
                  ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                  : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500"
                  }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="material-symbols-outlined text-[18px] text-[#38BDF8] shrink-0">
                    desktop_windows
                  </span>
                  <span className="truncate font-semibold">
                    {selectedType
                      ? filterOptions.types.find(
                        (t) => String(t.id) === String(selectedType)
                      )?.nama || "Tipe Terpilih"
                      : "Semua Tipe"}
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${typeDropdownOpen ? "rotate-180" : ""
                    }`}
                >
                  expand_more
                </span>
              </button>

              {/* Menu Dropdown Tipe */}
              {typeDropdownOpen && (
                <div
                  className={`absolute left-0 top-12 mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-30 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md animate-dropdown ${isDark
                    ? "bg-[#0A182B]/95 border-[#1E3A5F] text-[#E6EDF7]"
                    : "bg-white border-slate-200 text-slate-800"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType("");
                      setTypeDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${selectedType === ""
                      ? isDark
                        ? "bg-[#1677FF] text-white font-semibold"
                        : "bg-blue-600 text-white font-semibold"
                      : isDark
                        ? "hover:bg-[#122846] text-[#CBD5E1]"
                        : "hover:bg-slate-100 text-slate-700"
                      }`}
                  >
                    <span>Semua Tipe</span>
                    {selectedType === "" && (
                      <span className="material-symbols-outlined text-[16px] shrink-0">
                        check
                      </span>
                    )}
                  </button>

                  <div className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"}`} />

                  {filterOptions.types.map((tp) => {
                    const isSelected = String(selectedType) === String(tp.id);
                    return (
                      <button
                        key={tp.id}
                        type="button"
                        onClick={() => {
                          setSelectedType(String(tp.id));
                          setTypeDropdownOpen(false);
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
                        <span className="truncate pr-2">{tp.nama}</span>
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

            {/* Tombol Tambah dengan Popup Menu Pilihan */}
            {user?.role !== "teknisi" && (
              <div className="relative" ref={addMenuRef}>
                <button
                  type="button"
                  id="btn-tambah"
                  onClick={() => setAddMenuOpen(!addMenuOpen)}
                  className="h-11 px-5 rounded-xl bg-[#1677FF] hover:bg-[#0E65D9] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1677FF]/30 transition-all duration-200 hover:shadow-[#1677FF]/50 active:scale-[0.98] cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[19px]">add</span>
                  <span>Tambah</span>
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                      addMenuOpen ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Popup Menu Tambah */}
                {addMenuOpen && (
                  <div
                    className={`absolute right-0 top-12 mt-1.5 w-56 rounded-xl border shadow-2xl p-1.5 z-40 backdrop-blur-md animate-dropdown ${
                      isDark
                        ? "bg-[#0A182B]/95 border-[#1E3A5F] text-[#E6EDF7]"
                        : "bg-white border-slate-200 text-slate-800 shadow-xl"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setAddMenuOpen(false);
                        setCreateModalOpen(true);
                      }}
                      className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                        isDark
                          ? "hover:bg-[#122846] text-[#E6EDF7]"
                          : "hover:bg-slate-100 text-slate-800"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] shrink-0 ${
                          isDark ? "text-[#38BDF8]" : "text-blue-600"
                        }`}
                      >
                        dns
                      </span>
                      <div>
                        <div className="font-semibold">Tambah Perangkat</div>
                        <div
                          className={`text-[10px] ${
                            isDark ? "text-[#94A3B8]" : "text-slate-500"
                          }`}
                        >
                          Daftarkan unit perangkat baru
                        </div>
                      </div>
                    </button>

                    <div
                      className={`h-px my-1 ${
                        isDark ? "bg-[#1A3358]" : "bg-slate-100"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setAddMenuOpen(false);
                        setCreateTypeModalOpen(true);
                      }}
                      className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                        isDark
                          ? "hover:bg-[#122846] text-[#E6EDF7]"
                          : "hover:bg-slate-100 text-slate-800"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] shrink-0 ${
                          isDark ? "text-cyan-400" : "text-cyan-600"
                        }`}
                      >
                        category
                      </span>
                      <div>
                        <div className="font-semibold">Tambah Tipe Perangkat</div>
                        <div
                          className={`text-[10px] ${
                            isDark ? "text-[#94A3B8]" : "text-slate-500"
                          }`}
                        >
                          Daftarkan tipe perangkat baru
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabel Perangkat: 100% Mengikuti Standar Struktur Tabel Lokasi */}
        <div className="overflow-x-auto custom-scrollbar">
          <table
            id="devicesTable"
            className="w-full text-left border-collapse min-w-[950px] table-fixed"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <colgroup>
              <col style={{ width: '36%' }} /> {/* 1. NAMA PERANGKAT */}
              <col style={{ width: '22%' }} /> {/* 2. TIPE */}
              <col style={{ width: '28%' }} /> {/* 3. LOKASI */}
              <col style={{ width: '14%' }} /> {/* 4. AKSI */}
            </colgroup>
            <thead className={`rounded-t-xl ${isDark ? "bg-[#071426]" : "bg-slate-50"}`}>
              <tr
                className={`border-b text-[11px] font-bold uppercase tracking-wider ${isDark
                  ? "bg-[#071426] border-[#142D4C] text-[#94A3B8]"
                  : "bg-slate-50 border-slate-200 text-slate-600"
                  } rounded-t-xl`}
              >
                <th
                  className="py-3.5 pl-6 pr-4 text-left select-none rounded-tl-xl"
                  style={{ width: "36%" }}
                >
                  <TableSortHeader
                    title="NAMA PERANGKAT"
                    sortKey="nama_perangkat"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>
                <th
                  className="py-3.5 px-4 text-left select-none"
                  style={{ width: "22%" }}
                >
                  <TableSortHeader
                    title="TIPE"
                    sortKey="tipe"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                <th
                  className="py-3.5 px-4 text-left select-none"
                  style={{ width: "28%" }}
                >
                  <TableSortHeader
                    title="LOKASI"
                    sortKey="lokasi"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                <th
                  className="py-3.5 pl-3 pr-6 text-center select-none rounded-tr-xl"
                  style={{ width: "14%" }}
                >
                  <span className={`font-extrabold uppercase tracking-wider text-[11px] ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                    AKSI
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${isDark ? "divide-[#0F2238]" : "divide-slate-100"}`}>
              {loading ? (
                <tr>
                  <td colSpan="4" className={`py-16 text-center ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-4xl animate-spin text-[#1677FF]">
                        progress_activity
                      </span>
                      <span>Memuat data perangkat...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedDevices.length === 0 ? (
                <tr>
                  <td colSpan="4" className={`py-14 text-center ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-[#64748B]">
                        inbox
                      </span>
                      <span className="font-medium">
                        Tidak ada data perangkat yang sesuai kriteria
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Coba ubah filter lokasi, tipe, atau kata kunci pencarian.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDevices.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors border-b ${isDark
                      ? "border-[#0F2238] hover:bg-[#0D2138]/80 text-[#E6EDF7]"
                      : "border-slate-100 hover:bg-slate-50/80 text-slate-800"
                      }`}
                  >
                    {/* 1. NAMA PERANGKAT */}
                    <td className={`py-3.5 pl-6 pr-4 font-semibold whitespace-nowrap ${isDark ? "text-[#E6EDF7]" : "text-slate-800"
                      }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[13px] shrink-0 border ${isDark
                          ? "bg-[#0D264A] text-[#38BDF8] border-[#164375]"
                          : "bg-blue-50 text-blue-600 border-blue-200"
                          }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            dns
                          </span>
                        </div>
                        <span className={`font-bold tracking-wide ${isDark ? "text-white" : "text-slate-900"
                          }`}>
                          {item.nama_perangkat}
                        </span>
                      </div>
                    </td>

                    {/* 2. TIPE */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-left">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${isDark
                        ? "bg-[#0C2548] border-[#1A4378] text-[#38BDF8]"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}>
                        {item.tipe}
                      </span>
                    </td>

                    {/* 3. LOKASI */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-left">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#38BDF8] shrink-0">
                          location_on
                        </span>
                        <span className={`font-semibold ${isDark ? "text-[#E6EDF7]" : "text-slate-800"}`}>
                          {item.lokasi}
                        </span>
                      </div>
                    </td>

                    {/* 4. AKSI */}
                    <td className="py-3.5 pl-3 pr-6 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-nowrap shrink-0">
                        {/* Detail */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(item)}
                          title="Detail Perangkat & Modul Terpasang"
                          className={`w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-colors duration-150 cursor-pointer shadow-sm ${isDark
                            ? "bg-[#07383E] hover:bg-[#0A4E57] text-[#00E5FF] border-[#0A545E]"
                            : "bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200"
                            }`}
                        >
                          <span className="material-symbols-outlined text-[17px] leading-none select-none flex items-center justify-center pointer-events-none">
                            visibility
                          </span>
                        </button>

                        {/* Edit */}
                        {user?.role !== "teknisi" && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Perangkat"
                            className={`w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-colors duration-150 cursor-pointer shadow-sm ${isDark
                              ? "bg-[#3D2C0D] hover:bg-[#523B11] text-[#FBBF24] border-[#5E4413]"
                              : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                              }`}
                          >
                            <span className="material-symbols-outlined text-[17px] leading-none select-none flex items-center justify-center pointer-events-none">
                              edit
                            </span>
                          </button>
                        )}

                        {/* Hapus */}
                        {user?.role !== "teknisi" && (
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(item)}
                            title="Hapus Perangkat"
                            className={`w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-colors duration-150 cursor-pointer shadow-sm ${isDark
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

        {/* Table Footer: Pagination */}
        <TablePagination
          page={safePage}
          perPage={perPage}
          totalCount={totalItems}
          itemLabel="perangkat"
          onPageChange={(newPage) => setPage(newPage)}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
          }}
          isDark={isDark}
        />
      </div>

      {/* ============================================================ */}
      {/* MODAL: TAMBAH JENIS PERANGKAT                                */}
      {/* ============================================================ */}
      {createTypeModalOpen && (
        <CreateDeviceTypeModal
          onClose={() => setCreateTypeModalOpen(false)}
          onSuccess={(msg) => {
            setCreateTypeModalOpen(false);
            showToast(msg, "success");
            fetchDevices(selectedLocation, selectedType, localSearch);
          }}
          isDark={isDark}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH PERANGKAT                                      */}
      {/* ============================================================ */}
      {createModalOpen && (
        <CreateDeviceModal
          filterOptions={filterOptions}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={(msg) => {
            setCreateModalOpen(false);
            showToast(msg, "success");
            fetchDevices(selectedLocation, selectedType, localSearch);
          }}
          isDark={isDark}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT PERANGKAT                                        */}
      {/* ============================================================ */}
      {editModalOpen && selectedForEdit && (
        <EditDeviceModal
          deviceData={selectedForEdit}
          filterOptions={filterOptions}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedForEdit(null);
          }}
          onSuccess={(msg) => {
            setEditModalOpen(false);
            setSelectedForEdit(null);
            showToast(msg, "success");
            fetchDevices(selectedLocation, selectedType, localSearch);
          }}
          isDark={isDark}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: DETAIL PERANGKAT                                      */}
      {/* ============================================================ */}
      {detailModalOpen && selectedForDetail && (
        <DetailDeviceModal
          item={selectedForDetail}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedForDetail(null);
          }}
          isDark={isDark}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: KONFIRMASI HAPUS PERANGKAT                            */}
      {/* ============================================================ */}
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
              className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 ${
                isDark
                  ? "bg-[#0D1F36] border-rose-500/40 text-[#E6EDF7]"
                  : "bg-white border-rose-300 text-slate-800 shadow-xl"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-rose-500">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isDark
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      : "bg-rose-50 border-rose-200 text-rose-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    warning
                  </span>
                </div>
                <div>
                  <h3
                    className={`text-base font-bold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Konfirmasi Hapus Perangkat
                  </h3>
                  <p
                    className={`text-xs ${
                      isDark ? "text-rose-300" : "text-rose-600"
                    }`}
                  >
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>

              <div
                className={`border rounded-xl p-4 text-xs space-y-2 ${
                  isDark
                    ? "bg-[#071426] border-[#1A2E4C] text-[#CBD5E1]"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <div className="flex justify-between">
                  <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                    Nama Perangkat:
                  </span>
                  <span
                    className={`font-bold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {selectedForDelete.nama_perangkat}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                    Tipe:
                  </span>
                  <span
                    className={`font-semibold ${
                      isDark ? "text-[#38BDF8]" : "text-blue-600"
                    }`}
                  >
                    {selectedForDelete.tipe}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                    Lokasi STO:
                  </span>
                  <span
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {selectedForDelete.lokasi}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                    Modul Aktif Terpasang:
                  </span>
                  <span
                    className={`font-semibold ${
                      selectedForDelete.installed_modules_count > 0
                        ? "text-rose-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {selectedForDelete.installed_modules_count} Modul
                  </span>
                </div>
              </div>

              {selectedForDelete.installed_modules_count > 0 && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    isDark
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      : "bg-rose-50 border-rose-200 text-rose-700"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                    info
                  </span>
                  <span>
                    Perangkat ini masih memiliki modul aktif terpasang. Sistem akan
                    memproteksi integritas database agar perangkat tidak dihapus
                    secara tidak sengaja.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={deleting}
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
                  disabled={deleting}
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">
                        delete
                      </span>
                      <span>Hapus Perangkat</span>
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

// ============================================================
// SUB-KOMPONEN: MODAL TAMBAH PERANGKAT
// ============================================================
function CreateDeviceModal({ filterOptions, onClose, onSuccess, isDark = true }) {
  const [namaPerangkat, setNamaPerangkat] = useState("");
  const [deviceTypeId, setDeviceTypeId] = useState("");
  const [locationId, setLocationId] = useState("");

  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [stoDropdownOpen, setStoDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);
  const stoDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setTypeDropdownOpen(false);
      }
      if (stoDropdownRef.current && !stoDropdownRef.current.contains(e.target)) {
        setStoDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!namaPerangkat.trim()) {
      return setError("Nama perangkat wajib diisi.");
    }
    if (!deviceTypeId) {
      return setError("Tipe perangkat wajib dipilih.");
    }
    if (!locationId) {
      return setError("Lokasi perangkat wajib dipilih.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_perangkat: namaPerangkat.trim(),
          hostname: namaPerangkat.trim(),
          device_type_id: deviceTypeId,
          location_id: locationId,
          serial_number: null,
          status: "aktif",
          keterangan: null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.message || "Perangkat baru berhasil ditambahkan!");
      } else {
        setError(data.error || "Gagal menambahkan perangkat.");
      }
    } catch (err) {
      console.error("Create device error:", err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeObj = filterOptions.types.find(
    (tp) => String(tp.id) === String(deviceTypeId)
  );
  const selectedLocationObj = filterOptions.locations.find(
    (loc) => String(loc.id) === String(locationId)
  );

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div
          className={`border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar ${
            isDark
              ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
              : "bg-white border-slate-200 text-slate-800 shadow-xl"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between pb-3 border-b ${
              isDark ? "border-[#1A2E4C]" : "border-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isDark
                    ? "bg-[#1677FF]/15 border-[#1677FF]/30 text-[#38BDF8]"
                    : "bg-blue-50 border-blue-200 text-blue-600"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  add_circle
                </span>
              </div>
              <div>
                <h3
                  className={`text-base font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Tambah Perangkat Baru
                </h3>
                <p
                  className={`text-xs ${
                    isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
                >
                  Daftarkan perangkat jaringan transmisi optik ke sistem
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
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                isDark
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Perangkat */}
              <div className="md:col-span-2">
                <label
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-[#CBD5E1]" : "text-slate-700"
                  }`}
                >
                  Nama Perangkat *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: WN-24X-SUL-PAL11"
                  value={namaPerangkat}
                  onChange={(e) => setNamaPerangkat(e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl border text-xs sm:text-sm outline-none transition-all duration-200 ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B] focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white"
                  }`}
                />
              </div>

              {/* Tipe Perangkat (Container Box Dropdown matching Devices Page) */}
              <div className="relative" ref={typeDropdownRef}>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-[#CBD5E1]" : "text-slate-700"
                  }`}
                >
                  Tipe Perangkat *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTypeDropdownOpen(!typeDropdownOpen);
                    setStoDropdownOpen(false);
                  }}
                  className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium transition-all cursor-pointer ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                      : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className={`material-symbols-outlined text-[18px] shrink-0 ${
                        selectedTypeObj
                          ? isDark
                            ? "text-[#38BDF8]"
                            : "text-blue-600"
                          : isDark
                          ? "text-[#64748B]"
                          : "text-slate-400"
                      }`}
                    >
                      desktop_windows
                    </span>
                    <span
                      className={`truncate ${
                        selectedTypeObj
                          ? isDark
                            ? "text-[#E6EDF7] font-semibold"
                            : "text-slate-800 font-semibold"
                          : isDark
                          ? "text-[#64748B] font-normal"
                          : "text-slate-400 font-normal"
                      }`}
                    >
                      {selectedTypeObj?.nama || "Pilih Tipe Perangkat"}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform duration-200 shrink-0 ${
                      typeDropdownOpen ? "rotate-180" : ""
                    } ${isDark ? "text-[#94A3B8]" : "text-slate-400"}`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Popup Menu Dropdown Tipe */}
                {typeDropdownOpen && (
                  <div
                    className={`absolute left-0 top-[72px] mt-1 w-full rounded-xl border shadow-2xl p-1.5 z-50 max-h-56 overflow-y-auto custom-scrollbar backdrop-blur-md animate-dropdown ${
                      isDark
                        ? "bg-[#0A182B]/95 border-[#1E3A5F] text-[#E6EDF7]"
                        : "bg-white border-slate-200 text-slate-800 shadow-xl"
                    }`}
                  >
                    {filterOptions.types.map((tp) => {
                      const isSelected = String(deviceTypeId) === String(tp.id);
                      return (
                        <button
                          key={tp.id}
                          type="button"
                          onClick={() => {
                            setDeviceTypeId(tp.id);
                            setTypeDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? isDark
                                ? "bg-[#1677FF] text-white font-semibold"
                                : "bg-blue-600 text-white font-semibold"
                              : isDark
                                ? "hover:bg-[#122846] text-[#CBD5E1]"
                                : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span className="truncate pr-2">{tp.nama}</span>
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

              {/* Lokasi STO (Container Box Dropdown matching Devices Page) */}
              <div className="relative" ref={stoDropdownRef}>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-[#CBD5E1]" : "text-slate-700"
                  }`}
                >
                  Lokasi STO *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStoDropdownOpen(!stoDropdownOpen);
                    setTypeDropdownOpen(false);
                  }}
                  className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium transition-all cursor-pointer ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                      : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className={`material-symbols-outlined text-[18px] shrink-0 ${
                        selectedLocationObj
                          ? isDark
                            ? "text-[#38BDF8]"
                            : "text-blue-600"
                          : isDark
                          ? "text-[#64748B]"
                          : "text-slate-400"
                      }`}
                    >
                      location_on
                    </span>
                    <span
                      className={`truncate ${
                        selectedLocationObj
                          ? isDark
                            ? "text-[#E6EDF7] font-semibold"
                            : "text-slate-800 font-semibold"
                          : isDark
                          ? "text-[#64748B] font-normal"
                          : "text-slate-400 font-normal"
                      }`}
                    >
                      {selectedLocationObj?.nama || "Pilih Lokasi STO"}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform duration-200 shrink-0 ${
                      stoDropdownOpen ? "rotate-180" : ""
                    } ${isDark ? "text-[#94A3B8]" : "text-slate-400"}`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Popup Menu Dropdown STO */}
                {stoDropdownOpen && (
                  <div
                    className={`absolute left-0 top-[72px] mt-1 w-full rounded-xl border shadow-2xl p-1.5 z-50 max-h-56 overflow-y-auto custom-scrollbar backdrop-blur-md animate-dropdown ${
                      isDark
                        ? "bg-[#0A182B]/95 border-[#1E3A5F] text-[#E6EDF7]"
                        : "bg-white border-slate-200 text-slate-800 shadow-xl"
                    }`}
                  >
                    {filterOptions.locations.map((loc) => {
                      const isSelected = String(locationId) === String(loc.id);
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => {
                            setLocationId(loc.id);
                            setStoDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? isDark
                                ? "bg-[#1677FF] text-white font-semibold"
                                : "bg-blue-600 text-white font-semibold"
                              : isDark
                                ? "hover:bg-[#122846] text-[#CBD5E1]"
                                : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span className="truncate pr-2">{loc.nama}</span>
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
            </div>

            {/* Action buttons */}
            <div
              className={`flex items-center justify-end gap-3 pt-3 border-t ${
                isDark ? "border-[#1A2E4C]" : "border-slate-100"
              }`}
            >
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
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
                    <span className="material-symbols-outlined text-[16px]">
                      check
                    </span>
                    <span>Simpan Perangkat</span>
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

// ============================================================
// SUB-KOMPONEN: MODAL EDIT PERANGKAT
// ============================================================
function EditDeviceModal({ deviceData, filterOptions, onClose, onSuccess, isDark = true }) {
  const [namaPerangkat, setNamaPerangkat] = useState(
    deviceData.nama_perangkat || ""
  );
  const [deviceTypeId, setDeviceTypeId] = useState(
    deviceData.device_type_id || ""
  );
  const [locationId, setLocationId] = useState(deviceData.location_id || "");

  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [stoDropdownOpen, setStoDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);
  const stoDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setTypeDropdownOpen(false);
      }
      if (stoDropdownRef.current && !stoDropdownRef.current.contains(e.target)) {
        setStoDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!namaPerangkat.trim()) {
      return setError("Nama perangkat wajib diisi.");
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${deviceData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_perangkat: namaPerangkat.trim(),
          hostname: namaPerangkat.trim(),
          device_type_id: deviceTypeId,
          location_id: locationId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.message || "Data perangkat berhasil diperbarui!");
      } else {
        setError(data.error || "Gagal memperbarui data perangkat.");
      }
    } catch (err) {
      console.error("Update device error:", err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeObj = filterOptions.types.find(
    (tp) => String(tp.id) === String(deviceTypeId)
  );
  const selectedLocationObj = filterOptions.locations.find(
    (loc) => String(loc.id) === String(locationId)
  );

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div
          className={`border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar ${
            isDark
              ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
              : "bg-white border-slate-200 text-slate-800 shadow-xl"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between pb-3 border-b ${
              isDark ? "border-[#1A2E4C]" : "border-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isDark
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                    : "bg-amber-50 border-amber-200 text-amber-600"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  edit
                </span>
              </div>
              <div>
                <h3
                  className={`text-base font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Edit Data Perangkat
                </h3>
                <p
                  className={`text-xs ${
                    isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
                >
                  Perbarui konfigurasi atau status unit perangkat
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
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                isDark
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Perangkat */}
              <div className="md:col-span-2">
                <label
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-[#CBD5E1]" : "text-slate-700"
                  }`}
                >
                  Nama Perangkat *
                </label>
                <input
                  type="text"
                  required
                  value={namaPerangkat}
                  onChange={(e) => setNamaPerangkat(e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl border text-xs sm:text-sm outline-none transition-all duration-200 ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B] focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white"
                  }`}
                />
              </div>

              {/* Tipe Perangkat (Container Box Dropdown matching Devices Page) */}
              <div className="relative" ref={typeDropdownRef}>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-[#CBD5E1]" : "text-slate-700"
                  }`}
                >
                  Tipe Perangkat
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTypeDropdownOpen(!typeDropdownOpen);
                    setStoDropdownOpen(false);
                  }}
                  className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium transition-all cursor-pointer ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                      : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className={`material-symbols-outlined text-[18px] shrink-0 ${
                        isDark ? "text-[#38BDF8]" : "text-blue-600"
                      }`}
                    >
                      desktop_windows
                    </span>
                    <span className="truncate font-semibold">
                      {selectedTypeObj?.nama || "Pilih Tipe Perangkat"}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform duration-200 shrink-0 ${
                      typeDropdownOpen ? "rotate-180" : ""
                    } ${isDark ? "text-[#94A3B8]" : "text-slate-400"}`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Popup Menu Dropdown Tipe */}
                {typeDropdownOpen && (
                  <div
                    className={`absolute left-0 top-[72px] mt-1 w-full rounded-xl border shadow-2xl p-1.5 z-50 max-h-52 overflow-y-auto custom-scrollbar backdrop-blur-md animate-dropdown ${
                      isDark
                        ? "bg-[#0A182B]/95 border-[#1E3A5F] text-[#E6EDF7]"
                        : "bg-white border-slate-200 text-slate-800 shadow-xl"
                    }`}
                  >
                    {filterOptions.types.map((tp) => {
                      const isSelected = String(deviceTypeId) === String(tp.id);
                      return (
                        <button
                          key={tp.id}
                          type="button"
                          onClick={() => {
                            setDeviceTypeId(tp.id);
                            setTypeDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? isDark
                                ? "bg-[#1677FF] text-white font-semibold"
                                : "bg-blue-600 text-white font-semibold"
                              : isDark
                                ? "hover:bg-[#122846] text-[#CBD5E1]"
                                : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span className="truncate pr-2">{tp.nama}</span>
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

              {/* Lokasi STO (Container Box Dropdown matching Devices Page) */}
              <div className="relative" ref={stoDropdownRef}>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-[#CBD5E1]" : "text-slate-700"
                  }`}
                >
                  Lokasi STO
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStoDropdownOpen(!stoDropdownOpen);
                    setTypeDropdownOpen(false);
                  }}
                  className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium transition-all cursor-pointer ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                      : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className={`material-symbols-outlined text-[18px] shrink-0 ${
                        isDark ? "text-[#38BDF8]" : "text-blue-600"
                      }`}
                    >
                      location_on
                    </span>
                    <span className="truncate font-semibold">
                      {selectedLocationObj?.nama || "Pilih Lokasi STO"}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform duration-200 shrink-0 ${
                      stoDropdownOpen ? "rotate-180" : ""
                    } ${isDark ? "text-[#94A3B8]" : "text-slate-400"}`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Popup Menu Dropdown STO */}
                {stoDropdownOpen && (
                  <div
                    className={`absolute left-0 top-[72px] mt-1 w-full rounded-xl border shadow-2xl p-1.5 z-50 max-h-52 overflow-y-auto custom-scrollbar backdrop-blur-md animate-dropdown ${
                      isDark
                        ? "bg-[#0A182B]/95 border-[#1E3A5F] text-[#E6EDF7]"
                        : "bg-white border-slate-200 text-slate-800 shadow-xl"
                    }`}
                  >
                    {filterOptions.locations.map((loc) => {
                      const isSelected = String(locationId) === String(loc.id);
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => {
                            setLocationId(loc.id);
                            setStoDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? isDark
                                ? "bg-[#1677FF] text-white font-semibold"
                                : "bg-blue-600 text-white font-semibold"
                              : isDark
                                ? "hover:bg-[#122846] text-[#CBD5E1]"
                                : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span className="truncate pr-2">{loc.nama}</span>
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
            </div>

            {/* Action buttons */}
            <div
              className={`flex items-center justify-end gap-3 pt-3 border-t ${
                isDark ? "border-[#1A2E4C]" : "border-slate-100"
              }`}
            >
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
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
                    <span className="material-symbols-outlined text-[16px]">
                      check
                    </span>
                    <span>Perbarui Perangkat</span>
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

// ============================================================
// SUB-KOMPONEN: MODAL DETAIL PERANGKAT & MODUL TERPASANG
// ============================================================
function DetailDeviceModal({ item, onClose, isDark = true }) {
  const [deviceDetail, setDeviceDetail] = useState(item);
  const [installedModules, setInstalledModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      try {
        const res = await fetch(`/api/devices/${item.id}`);
        const data = await res.json();
        if (data.success) {
          setDeviceDetail(data.device);
          setInstalledModules(data.installed_modules || []);
        }
      } catch (err) {
        console.error("Load detail device error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [item.id]);

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div
          className={`border rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar ${
            isDark
              ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
              : "bg-white border-slate-200 text-slate-800 shadow-xl"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between pb-3 border-b ${
              isDark ? "border-[#1A2E4C]" : "border-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isDark
                    ? "bg-[#1677FF]/15 border-[#1677FF]/30 text-[#38BDF8]"
                    : "bg-blue-50 border-blue-200 text-blue-600"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  dns
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-base font-bold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {deviceDetail.nama_perangkat}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isDark
                        ? "bg-[#0F294D] border-[#1E4378] text-[#38BDF8]"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                    }`}
                  >
                    {deviceDetail.tipe}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isDark
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                    }`}
                  >
                    {deviceDetail.status}
                  </span>
                </div>
                <p
                  className={`text-xs ${
                    isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
                >
                  Informasi identitas perangkat dan daftar modul di slot
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

          {/* Spesifikasi Grid */}
          <div>
            <h4
              className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${
                isDark ? "text-[#38BDF8]" : "text-blue-600"
              }`}
            >
              Spesifikasi Unit Perangkat
            </h4>
            <div
              className={`grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl p-4 text-xs border ${
                isDark
                  ? "bg-[#071426] border-[#1A2E4C]"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div>
                <span
                  className={`text-[11px] block ${
                    isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
                >
                  Nama Perangkat
                </span>
                <span
                  className={`font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {deviceDetail.nama_perangkat}
                </span>
              </div>
              <div>
                <span
                  className={`text-[11px] block ${
                    isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
                >
                  Tipe
                </span>
                <span
                  className={`font-semibold ${
                    isDark ? "text-[#38BDF8]" : "text-blue-600"
                  }`}
                >
                  {deviceDetail.tipe || "-"}
                </span>
              </div>
              <div>
                <span
                  className={`text-[11px] block ${
                    isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
                >
                  Lokasi STO
                </span>
                <span
                  className={`font-semibold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {deviceDetail.lokasi || "-"}
                </span>
              </div>
              <div>
                <span
                  className={`text-[11px] block ${
                    isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
                >
                  Vendor / Pabrikan
                </span>
                <span className={isDark ? "text-[#CBD5E1]" : "text-slate-700"}>
                  {deviceDetail.vendor || "Nokia"}
                </span>
              </div>
              <div>
                <span
                  className={`text-[11px] block ${
                    isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
                >
                  Modul Terpasang
                </span>
                <span
                  className={`font-bold ${
                    isDark ? "text-[#38BDF8]" : "text-blue-600"
                  }`}
                >
                  {installedModules.length} Modul Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Daftar Modul Terpasang di Slot Perangkat */}
          <div>
            <h4
              className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${
                isDark ? "text-[#38BDF8]" : "text-blue-600"
              }`}
            >
              Daftar Modul Terpasang di Slot ({installedModules.length})
            </h4>
            {loading ? (
              <div
                className={`py-8 text-center text-xs ${
                  isDark ? "text-[#94A3B8]" : "text-slate-500"
                }`}
              >
                <span className="material-symbols-outlined text-2xl animate-spin text-[#1677FF] mb-1">
                  progress_activity
                </span>
                <p>Memuat modul terpasang...</p>
              </div>
            ) : installedModules.length > 0 ? (
              <div
                className={`border rounded-xl overflow-hidden text-xs max-h-56 overflow-y-auto custom-scrollbar ${
                  isDark ? "border-[#1A2E4C]" : "border-slate-200"
                }`}
              >
                <table className="w-full text-left">
                  <thead
                    className={`text-[10px] uppercase sticky top-0 ${
                      isDark ? "bg-[#09172A] text-[#94A3B8]" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <tr>
                      <th className="py-2.5 px-3">Slot / Shelf</th>
                      <th className="py-2.5 px-3 font-mono">Serial Number</th>
                      <th className="py-2.5 px-3 font-mono">Part Number</th>
                      <th className="py-2.5 px-3 text-center">Kondisi</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      isDark
                        ? "divide-[#132845] text-[#CBD5E1]"
                        : "divide-slate-200 text-slate-700"
                    }`}
                  >
                    {installedModules.map((m) => (
                      <tr
                        key={m.position_id}
                        className={isDark ? "hover:bg-[#102444]/40" : "hover:bg-slate-50"}
                      >
                        <td
                          className={`py-2 px-3 font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          Slot #{m.slot_number} (Shelf {m.shelf})
                        </td>
                        <td
                          className={`py-2 px-3 font-mono font-medium ${
                            isDark ? "text-[#38BDF8]" : "text-blue-600"
                          }`}
                        >
                          {m.serial_number}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {m.unit_part_number}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              m.kondisi === "AKTIF"
                                ? isDark
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : isDark
                                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {m.kondisi}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className={`border rounded-xl p-4 text-center text-xs ${
                  isDark
                    ? "bg-[#071426] border-[#1A2E4C] text-[#94A3B8]"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                Belum ada modul yang terpasang pada slot perangkat ini.
              </div>
            )}
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
      </div>
    </ModalPortal>
  );
}

// ============================================================
// SUB-KOMPONEN: MODAL TAMBAH TIPE PERANGKAT
// ============================================================
function CreateDeviceTypeModal({ onClose, onSuccess, isDark = true }) {
  const [namaTipe, setNamaTipe] = useState("");
  const [vendor, setVendor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!namaTipe.trim()) {
      return setError("Nama tipe perangkat wajib diisi.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/device-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_tipe: namaTipe.trim(),
          vendor: vendor.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(
          data.message || `Tipe perangkat '${namaTipe}' berhasil ditambahkan!`,
          data.device_type
        );
      } else {
        setError(data.error || "Gagal menambahkan tipe perangkat.");
      }
    } catch (err) {
      console.error("Create device type error:", err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div
          className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-scaleUp ${
            isDark
              ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
              : "bg-white border-slate-200 text-slate-800 shadow-xl"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between pb-3 border-b ${
              isDark ? "border-[#1A2E4C]" : "border-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isDark
                    ? "bg-cyan-500/15 border-cyan-500/30 text-[#38BDF8]"
                    : "bg-cyan-50 border-cyan-200 text-cyan-600"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">category</span>
              </div>
              <div>
                <h3
                  className={`text-base font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Tambah Tipe Perangkat
                </h3>
                <p
                  className={`text-xs ${
                    isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
                >
                  Daftarkan tipe perangkat baru
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
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                isDark
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Tipe */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}
              >
                Nama Tipe Perangkat *
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan nama tipe perangkat"
                value={namaTipe}
                onChange={(e) => setNamaTipe(e.target.value)}
                className={`w-full h-11 px-4 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
                  isDark
                    ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B] focus:border-[#38BDF8]"
                    : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white"
                }`}
              />
            </div>

            {/* Vendor */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? "text-[#CBD5E1]" : "text-slate-700"
                }`}
              >
                Vendor
              </label>
              <input
                type="text"
                placeholder="Contoh: Nokia, Huawei, ZTE"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className={`w-full h-11 px-4 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
                  isDark
                    ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B] focus:border-[#38BDF8]"
                    : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white"
                }`}
              />
            </div>

            {/* Tombol Aksi (Rata Kanan) */}
            <div
              className={`flex items-center justify-end gap-3 pt-3 border-t ${
                isDark ? "border-[#1A2E4C]" : "border-slate-100"
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                className={`px-5 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
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
                    <span className="material-symbols-outlined text-[16px]">
                      save
                    </span>
                    <span>Simpan Tipe Perangkat</span>
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
