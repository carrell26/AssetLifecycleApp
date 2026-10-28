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
  const [searchInput, setSearchInput] = useState(searchValue || "");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Dropdown menus state
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const locationDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync external search prop if changed from topbar
  useEffect(() => {
    if (searchValue !== undefined && searchValue !== searchInput) {
      setSearchInput(searchValue);
      fetchDevices(selectedLocation, selectedType, searchValue);
    }
  }, [searchValue]);

  // Fetch devices from backend API
  const fetchDevices = async (
    locId = selectedLocation,
    typeId = selectedType,
    query = searchInput
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
    fetchDevices(selectedLocation, selectedType, searchInput);
    setPage(1);
  }, [selectedLocation, selectedType]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (onSearchChange) onSearchChange(searchInput);
    fetchDevices(selectedLocation, selectedType, searchInput);
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
        fetchDevices(selectedLocation, selectedType, searchInput);
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
      {/* 2. PANEL TABEL PERANGKAT DENGAN KONTROL FILTER & SEARCH      */}
      {/* ============================================================ */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${isDark
          ? "bg-[#0D1F36] border-[#1A3358] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          : "bg-white border-slate-200 shadow-md"
          }`}
      >
        {/* Controls Row: Dropdown Lokasi, Dropdown Tipe, & Tambah Perangkat */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4">
          {/* Left Side: Filter Dropdowns */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 flex-wrap">

            {/* Filter Dropdown 1: Semua Lokasi */}
            <div className="relative min-w-[170px]" ref={locationDropdownRef}>
              <button
                type="button"
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${isDark
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
                      : "Semua lokasi"}
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
                  className={`absolute left-0 top-12 mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-30 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md ${isDark
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
                        ? "bg-[#1677FF] text-white"
                        : "bg-blue-600 text-white"
                      : isDark
                        ? "hover:bg-[#122846] text-[#CBD5E1]"
                        : "hover:bg-slate-100 text-slate-700"
                      }`}
                  >
                    <span>Semua lokasi</span>
                    {selectedLocation === "" && (
                      <span className="material-symbols-outlined text-[16px]">
                        check
                      </span>
                    )}
                  </button>

                  <div className="h-px bg-[#1A3358] my-1" />

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
                            ? "bg-[#1677FF] text-white"
                            : "bg-blue-600 text-white"
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
                className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${isDark
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
                      : "Semua tipe"}
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
                  className={`absolute left-0 top-12 mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-30 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md ${isDark
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
                        ? "bg-[#1677FF] text-white"
                        : "bg-blue-600 text-white"
                      : isDark
                        ? "hover:bg-[#122846] text-[#CBD5E1]"
                        : "hover:bg-slate-100 text-slate-700"
                      }`}
                  >
                    <span>Semua tipe</span>
                    {selectedType === "" && (
                      <span className="material-symbols-outlined text-[16px]">
                        check
                      </span>
                    )}
                  </button>

                  <div className="h-px bg-[#1A3358] my-1" />

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
                            ? "bg-[#1677FF] text-white"
                            : "bg-blue-600 text-white"
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
          </div>

          {/* Right Side: Button Tambah Perangkat */}
          {user?.role !== "teknisi" && (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="h-11 px-5 rounded-xl bg-[#1677FF] hover:bg-[#0E65D9] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1677FF]/30 transition-all duration-200 hover:shadow-[#1677FF]/50 active:scale-[0.98] cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[19px]">add</span>
              <span>Tambah Perangkat</span>
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
            perangkat
          </span>
        </div>

        {/* Tabel Perangkat (Sesuai Referensi Gambar) */}
        <div className={`overflow-x-auto custom-scrollbar rounded-xl border ${isDark ? "border-[#162F52]" : "border-slate-200"}`}>
          <table className="w-full text-left border-collapse min-w-[650px] table-fixed">
            <colgroup>
              <col style={{ width: '36%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <thead>
              <tr className={`border-b ${isDark ? "bg-[#09172A] border-[#18355C]" : "bg-slate-50 border-slate-200"}`}>
                {/* 1. NAMA PERANGKAT */}
                <th className="py-3 px-5 text-[11px] font-extrabold uppercase tracking-wider">
                  <TableSortHeader
                    title="NAMA PERANGKAT"
                    sortKey="nama_perangkat"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>

                {/* 2. TIPE */}
                <th className="py-3 px-4 text-[11px] font-extrabold uppercase tracking-wider text-center">
                  <TableSortHeader
                    title="TIPE"
                    sortKey="tipe"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="center"
                    isDark={isDark}
                  />
                </th>

                {/* 3. LOKASI */}
                <th className="py-3 px-4 text-[11px] font-extrabold uppercase tracking-wider text-center">
                  <TableSortHeader
                    title="LOKASI"
                    sortKey="lokasi"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="center"
                    isDark={isDark}
                  />
                </th>

                {/* 4. AKSI */}
                <th className={`py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-center ${isDark ? "text-[#38BDF8]" : "text-blue-600"
                  }`}>
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${isDark ? "divide-[#132845]" : "divide-slate-200"}`}>
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
                        Tidak ada perangkat yang sesuai kriteria
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
                    className={`transition-colors group ${isDark
                      ? "hover:bg-[#102444]/60"
                      : "hover:bg-slate-50/80 even:bg-slate-50/40"
                      }`}
                  >
                    {/* 1. NAMA PERANGKAT */}
                    <td className={`py-3.5 px-5 font-semibold whitespace-nowrap overflow-hidden text-ellipsis ${isDark ? "text-[#E6EDF7]" : "text-slate-800"
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[13px] shrink-0 border ${isDark
                          ? "bg-[#0D264A] text-[#38BDF8] border-[#164375]"
                          : "bg-blue-50 text-blue-600 border-blue-200"
                          }`}>
                          <span className="material-symbols-outlined text-[15px]">
                            dns
                          </span>
                        </div>
                        <span className={`font-bold tracking-wide truncate ${isDark ? "text-white" : "text-slate-900"
                          }`}>
                          {item.nama_perangkat}
                        </span>
                      </div>
                    </td>

                    {/* 2. TIPE */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold border ${isDark
                        ? "bg-[#0C2548] border-[#1A4378] text-[#38BDF8]"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}>
                        {item.tipe}
                      </span>
                    </td>

                    {/* 3. LOKASI */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <div className={`inline-flex items-center gap-1.5 font-bold uppercase ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                        }`}>
                        <span className="material-symbols-outlined text-[16px] text-[#38BDF8]">
                          location_on
                        </span>
                        <span>{item.lokasi}</span>
                      </div>
                    </td>

                    {/* 4. AKSI */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-nowrap shrink-0 mx-auto">
                        {/* Detail */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(item)}
                          title="Detail Perangkat & Modul Terpasang"
                          className={`w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-colors cursor-pointer shadow-sm ${isDark
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

                        {/* Hapus */}
                        {user?.role !== "teknisi" && (
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(item)}
                            title="Hapus Perangkat"
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

        {/* Table Footer: Pagination */}
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
            fetchDevices(selectedLocation, selectedType, searchInput);
          }}
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
            fetchDevices(selectedLocation, selectedType, searchInput);
          }}
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
              className="bg-[#0D1F36] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">
                    warning
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Konfirmasi Hapus Perangkat
                  </h3>
                  <p className="text-xs text-rose-300">
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>

              <div className="bg-[#071426] border border-[#1A2E4C] rounded-xl p-4 text-xs space-y-2 text-[#CBD5E1]">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Nama Perangkat:</span>
                  <span className="font-bold text-white">
                    {selectedForDelete.nama_perangkat}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Tipe:</span>
                  <span className="text-[#38BDF8]">{selectedForDelete.tipe}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Lokasi STO:</span>
                  <span className="text-white font-semibold">
                    {selectedForDelete.lokasi}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Modul Aktif Terpasang:</span>
                  <span
                    className={`font-semibold ${selectedForDelete.installed_modules_count > 0
                      ? "text-rose-400"
                      : "text-emerald-400"
                      }`}
                  >
                    {selectedForDelete.installed_modules_count} Modul
                  </span>
                </div>
              </div>

              {selectedForDelete.installed_modules_count > 0 && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
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
                  className="px-4 py-2.5 rounded-xl border border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846] text-xs font-semibold transition-colors cursor-pointer"
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
function CreateDeviceModal({ filterOptions, onClose, onSuccess }) {
  const [namaPerangkat, setNamaPerangkat] = useState("");
  const [deviceTypeId, setDeviceTypeId] = useState(
    filterOptions.types[0]?.id || ""
  );
  const [locationId, setLocationId] = useState(
    filterOptions.locations[0]?.id || ""
  );

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

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-[#0D1F36] border border-[#1E3A5F] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1A2E4C]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1677FF]/15 border border-[#1677FF]/30 flex items-center justify-center text-[#38BDF8]">
                <span className="material-symbols-outlined text-[22px]">
                  add_circle
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Tambah Perangkat Baru
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Daftarkan perangkat jaringan transmisi optik ke sistem
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
              {/* Nama Perangkat */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Nama Perangkat *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: WN-24X-SUL-PAL11"
                  value={namaPerangkat}
                  onChange={(e) => setNamaPerangkat(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              {/* Tipe Perangkat */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Tipe Perangkat *
                </label>
                <select
                  required
                  value={deviceTypeId}
                  onChange={(e) => setDeviceTypeId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF]"
                >
                  {filterOptions.types.map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.nama} {tp.vendor ? `(${tp.vendor})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lokasi STO */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Lokasi STO *
                </label>
                <select
                  required
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF]"
                >
                  {filterOptions.locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nama}
                    </option>
                  ))}
                </select>
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
function EditDeviceModal({ deviceData, filterOptions, onClose, onSuccess }) {
  const [namaPerangkat, setNamaPerangkat] = useState(
    deviceData.nama_perangkat || ""
  );
  const [deviceTypeId, setDeviceTypeId] = useState(
    deviceData.device_type_id || ""
  );
  const [locationId, setLocationId] = useState(deviceData.location_id || "");

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

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-[#0D1F36] border border-[#1E3A5F] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1A2E4C]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <span className="material-symbols-outlined text-[22px]">
                  edit
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Edit Data Perangkat
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Perbarui konfigurasi atau status unit perangkat
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
              {/* Nama Perangkat */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Nama Perangkat *
                </label>
                <input
                  type="text"
                  required
                  value={namaPerangkat}
                  onChange={(e) => setNamaPerangkat(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              {/* Tipe Perangkat */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Tipe Perangkat
                </label>
                <select
                  value={deviceTypeId}
                  onChange={(e) => setDeviceTypeId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF]"
                >
                  {filterOptions.types.map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lokasi STO */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Lokasi STO
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF]"
                >
                  {filterOptions.locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nama}
                    </option>
                  ))}
                </select>
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
function DetailDeviceModal({ item, onClose }) {
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
          className="bg-[#0D1F36] border border-[#1E3A5F] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1A2E4C]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1677FF]/15 border border-[#1677FF]/30 flex items-center justify-center text-[#38BDF8]">
                <span className="material-symbols-outlined text-[22px]">
                  dns
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {deviceDetail.nama_perangkat}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F294D] border border-[#1E4378] text-[#38BDF8]">
                    {deviceDetail.tipe}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    {deviceDetail.status}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Informasi identitas perangkat dan daftar modul di slot
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

          {/* Spesifikasi Grid */}
          <div>
            <h4 className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider mb-2.5">
              Spesifikasi Unit Perangkat
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#071426] border border-[#1A2E4C] rounded-xl p-4 text-xs">
              <div>
                <span className="text-[#94A3B8] text-[11px] block">
                  Nama Perangkat
                </span>
                <span className="font-bold text-white">
                  {deviceDetail.nama_perangkat}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] text-[11px] block">Tipe</span>
                <span className="font-semibold text-[#38BDF8]">
                  {deviceDetail.tipe || "-"}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] text-[11px] block">Lokasi STO</span>
                <span className="font-semibold text-white">
                  {deviceDetail.lokasi || "-"}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] text-[11px] block">
                  Vendor / Pabrikan
                </span>
                <span className="text-[#CBD5E1]">
                  {deviceDetail.vendor || "Nokia"}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] text-[11px] block">
                  Modul Terpasang
                </span>
                <span className="font-bold text-[#38BDF8]">
                  {installedModules.length} Modul Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Daftar Modul Terpasang di Slot Perangkat */}
          <div>
            <h4 className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider mb-2.5">
              Daftar Modul Terpasang di Slot ({installedModules.length})
            </h4>
            {loading ? (
              <div className="py-8 text-center text-[#94A3B8] text-xs">
                <span className="material-symbols-outlined text-2xl animate-spin text-[#1677FF] mb-1">
                  progress_activity
                </span>
                <p>Memuat modul terpasang...</p>
              </div>
            ) : installedModules.length > 0 ? (
              <div className="border border-[#1A2E4C] rounded-xl overflow-hidden text-xs max-h-56 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-[#09172A] text-[#94A3B8] text-[10px] uppercase sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Slot / Shelf</th>
                      <th className="py-2.5 px-3 font-mono">Serial Number</th>
                      <th className="py-2.5 px-3 font-mono">Part Number</th>
                      <th className="py-2.5 px-3 text-center">Kondisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132845] text-[#CBD5E1]">
                    {installedModules.map((m) => (
                      <tr key={m.position_id} className="hover:bg-[#102444]/40">
                        <td className="py-2 px-3 font-bold text-white">
                          Slot #{m.slot_number} (Shelf {m.shelf})
                        </td>
                        <td className="py-2 px-3 font-mono text-[#38BDF8]">
                          {m.serial_number}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {m.unit_part_number}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.kondisi === "AKTIF"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
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
              <div className="bg-[#071426] border border-[#1A2E4C] rounded-xl p-4 text-center text-xs text-[#94A3B8]">
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
