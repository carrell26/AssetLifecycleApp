import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import statLocation from "../assets/stat_location.jpg";
import statDistrict from "../assets/stat_district.jpg";
import TableSortHeader from "../components/TableSortHeader";
import TablePagination from "../components/TablePagination";
import ModalPortal from "../components/ModalPortal";
import { sortData } from "../utils/sortUtils";

const locationColumnNames = {
  nama_lokasi: "Nama Lokasi",
  district: "District",
  alamat: "Alamat",
  lat_lon_str: "Koordinat",
};

const locationColumnTypes = {
  nama_lokasi: "text",
  district: "text",
  alamat: "text",
  lat_lon_str: "text",
};

export default function LocationsPage({ user, searchValue, onSearchChange }) {
  const { isDark } = useTheme();

  // State utama data
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_locations: 2,
    total_districts: 1,
  });

  // Filter dropdown state
  const [selectedLocationFilter, setSelectedLocationFilter] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedForDetail, setSelectedForDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  // Notification toast
  const [toast, setToast] = useState(null);

  const filterDropdownRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target)
      ) {
        setFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch locations from backend API
  const fetchLocations = async (loc = selectedLocationFilter, q = localSearch) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (loc) params.append("loc", loc);
      if (q && q.trim()) params.append("q", q.trim());

      const res = await fetch(`/api/locations?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setLocations(data.items || []);
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.filter_options) {
          setFilterOptions(data.filter_options);
        }
      } else {
        showToast(data.error || "Gagal memuat data lokasi.", "error");
      }
    } catch (err) {
      console.error("Error fetching locations:", err);
      showToast("Terjadi kesalahan jaringan saat memuat lokasi.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations(selectedLocationFilter, localSearch);
    setPage(1);
  }, [selectedLocationFilter, localSearch]);

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
  const sortedLocations = useMemo(() => {
    return sortData(
      locations,
      sortConfig.key,
      sortConfig.direction,
      locationColumnTypes
    );
  }, [locations, sortConfig]);

  // Pagination calculations based on sorted result
  const totalItems = sortedLocations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paginatedLocations = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return sortedLocations.slice(start, start + perPage);
  }, [sortedLocations, safePage, perPage]);

  // Open detail modal with full devices info
  const handleOpenDetail = async (loc) => {
    setSelectedForDetail(loc);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/locations/${loc.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedForDetail(data.location);
      }
    } catch (err) {
      console.error("Failed to load location detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open edit modal
  const handleOpenEdit = (loc) => {
    setSelectedForEdit(loc);
    setEditModalOpen(true);
  };

  // Open delete modal
  const handleOpenDelete = (loc) => {
    setSelectedForDelete(loc);
    setDeleteModalOpen(true);
  };

  // Execute delete location
  const handleDeleteConfirm = async () => {
    if (!selectedForDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/locations/${selectedForDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Lokasi berhasil dihapus.", "success");
        setDeleteModalOpen(false);
        setSelectedForDelete(null);
        fetchLocations(selectedLocationFilter, searchValue);
      } else {
        showToast(data.error || "Gagal menghapus lokasi.", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Terjadi kesalahan saat menghapus lokasi.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Suggestion references for autocomplete
  const availableDistricts = ["Palu", "Palu Timur", "Palu Barat", "Palu Selatan", "Palu Utara", "Mantikulore", "Ulujadi", "Tatanga"];
  const availableLocationNames = filterOptions.length > 0
    ? filterOptions.map((o) => o.nama)
    : ["STO Palu 1", "STO Palu 2"];

  return (
    <div className="space-y-6 !mt-0 w-full" style={{ marginTop: 0 }}>
      {/* Toast Notification */}
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
      {/* 1. STAT CARDS (Sesuai Referensi Gambar & Proporsi Modul)     */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
        {/* KPI 1: TOTAL LOKASI */}
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
                TOTAL LOKASI
              </span>
            </div>

            {/* Value & Badge */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? "text-[#F8FAFC]" : "text-slate-900"}`}>
                {stats.total_locations}
              </span>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${isDark ? "bg-[#0F294D] text-[#38BDF8] border border-[#1E4378]" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                Titik STO Aktif
              </span>
            </div>

            {/* Subtitle */}
            <p className={`text-xs mt-2 font-medium ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
              Terdaftar dalam database inventaris regional
            </p>
          </div>

          {/* Right Icon / 3D Illustration Container with Neon Glow */}
          <div className={`relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden p-1 group-hover:scale-105 transition-all duration-300 flex items-center justify-center ${isDark
            ? "bg-[#071527] border border-[#00E5FF]/40 shadow-[0_0_18px_rgba(0,229,255,0.22)] group-hover:border-[#00E5FF]/80"
            : "bg-blue-50/80 border border-blue-200 shadow-sm group-hover:border-blue-400"
            }`}>
            <img
              src={statLocation}
              alt="Total Lokasi 3D"
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#00E5FF]/10 to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* KPI 2: TOTAL DISTRICT */}
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
                TOTAL DISTRICT
              </span>
            </div>

            {/* Value & Badge */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? "text-[#F8FAFC]" : "text-slate-900"}`}>
                {stats.total_districts}
              </span>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${isDark ? "bg-[#0A2E24] text-[#6EE7B7] border border-[#15604B]" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                Wilayah Tercover
              </span>
            </div>

            {/* Subtitle */}
            <p className={`text-xs mt-2 font-medium ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
              Zona operasional Sulawesi Tengah
            </p>
          </div>

          {/* Right Icon / 3D Illustration Container with Neon Glow */}
          <div className={`relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden p-1 group-hover:scale-105 transition-all duration-300 flex items-center justify-center ${isDark
            ? "bg-[#061814] border border-[#10B981]/40 shadow-[0_0_18px_rgba(16,185,129,0.22)] group-hover:border-[#10B981]/80"
            : "bg-emerald-50/80 border border-emerald-200 shadow-sm group-hover:border-emerald-400"
            }`}>
            <img
              src={statDistrict}
              alt="Total District 3D"
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#10B981]/10 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. PANEL TABEL LOKASI (100% MENGIKUTI STYLE MUTASI MODUL)    */}
      {/* ============================================================ */}
      <div
        className={`rounded-2xl border transition-all duration-300 overflow-visible w-full ${isDark
          ? "border-[#162F52] bg-[#0A182B] shadow-2xl"
          : "border-slate-200 bg-white shadow-sm"
          }`}
      >
        {/* Controls Toolbar: Search Bar di kiri, Dropdown Filter & Tambah Lokasi di kanan */}
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
              id="locationSearchInput"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari nama lokasi, district, atau alamat..."
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

          {/* Right: Location Filter Dropdown & Tombol Tambah Lokasi */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Dropdown: Semua Lokasi (Container box panjangnya menyesuaikan isi konten) */}
            <div className="relative min-w-[170px]" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium transition-all cursor-pointer ${isDark
                  ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                  : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500"
                  }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-[18px] text-[#38BDF8] shrink-0">
                    location_on
                  </span>
                  <span className="truncate font-semibold">
                    {selectedLocationFilter || "Semua Lokasi"}
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${filterDropdownOpen ? "rotate-180" : ""
                    }`}
                >
                  expand_more
                </span>
              </button>

              {/* Custom Filter Dropdown Menu */}
              {filterDropdownOpen && (
                <div
                  className={`absolute left-0 top-12 mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-30 max-h-64 overflow-y-auto custom-scrollbar backdrop-blur-md ${isDark
                    ? "bg-[#0A182B]/95 border-[#1E3A5F] text-[#E6EDF7]"
                    : "bg-white border-slate-200 text-slate-800"
                    }`}
                >
                  {/* Option: Semua Lokasi (Tanpa sublabel fokus STO) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocationFilter("");
                      setFilterDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${selectedLocationFilter === ""
                      ? isDark
                        ? "bg-[#1677FF] text-white font-semibold"
                        : "bg-blue-600 text-white font-semibold"
                      : isDark
                        ? "hover:bg-[#122846] text-[#CBD5E1]"
                        : "hover:bg-slate-100 text-slate-700"
                      }`}
                  >
                    <span>Semua Lokasi</span>
                    {selectedLocationFilter === "" && (
                      <span className="material-symbols-outlined text-[16px] shrink-0">
                        check
                      </span>
                    )}
                  </button>

                  <div className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"}`} />

                  {/* Option per Lokasi */}
                  {filterOptions.map((opt) => {
                    const isSelected = selectedLocationFilter === opt.nama;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedLocationFilter(opt.nama);
                          setFilterDropdownOpen(false);
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
                        <span className="truncate pr-2">{opt.nama}</span>
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

            {/* Tombol Tambah Lokasi */}
            {user?.role !== "teknisi" && (
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="h-11 px-5 rounded-xl bg-[#1677FF] hover:bg-[#0E65D9] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1677FF]/30 transition-all duration-200 hover:shadow-[#1677FF]/50 active:scale-[0.98] cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[19px]">add</span>
                <span>Tambah Lokasi</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabel Lokasi: 100% Mengikuti Standar Mutasi Modul & Audit Log */}
        <div className="overflow-x-auto custom-scrollbar">
          <table
            id="locationsTable"
            className="w-full text-left border-collapse min-w-[950px] table-fixed"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <colgroup>
              <col style={{ width: '20%' }} /> {/* 1. NAMA LOKASI */}
              <col style={{ width: '13%' }} /> {/* 2. DISTRICT */}
              <col style={{ width: '35%' }} /> {/* 3. ALAMAT */}
              <col style={{ width: '18%' }} /> {/* 4. LATITUDE, LONGITUDE */}
              <col style={{ width: '14%' }} /> {/* 5. AKSI */}
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
                  style={{ width: "20%" }}
                >
                  <TableSortHeader
                    title="NAMA LOKASI"
                    sortKey="nama_lokasi"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>
                <th
                  className="py-3.5 px-4 text-left select-none"
                  style={{ width: "13%" }}
                >
                  <TableSortHeader
                    title="DISTRICT"
                    sortKey="district"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                <th
                  className="py-3.5 px-4 text-left select-none"
                  style={{ width: "35%" }}
                >
                  <TableSortHeader
                    title="ALAMAT"
                    sortKey="alamat"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    isDark={isDark}
                  />
                </th>
                <th
                  className="py-3.5 px-4 text-left select-none"
                  style={{ width: "18%" }}
                >
                  <TableSortHeader
                    title="LATITUDE, LONGITUDE"
                    sortKey="lat_lon_str"
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
                  <td colSpan="5" className={`py-16 text-center ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-4xl animate-spin text-[#1677FF]">
                        progress_activity
                      </span>
                      <span>Memuat data lokasi...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLocations.length === 0 ? (
                <tr>
                  <td colSpan="5" className={`py-14 text-center ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-[#64748B]">
                        inbox
                      </span>
                      <span className="font-medium">
                        Tidak ada data lokasi yang sesuai kriteria
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Coba ubah filter lokasi atau kata kunci pencarian.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLocations.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors border-b ${isDark
                      ? "border-[#0F2238] hover:bg-[#0D2138]/80 text-[#E6EDF7]"
                      : "border-slate-100 hover:bg-slate-50/80 text-slate-800"
                      }`}
                  >
                    {/* 1. NAMA LOKASI */}
                    <td className={`py-3.5 pl-6 pr-4 font-semibold whitespace-nowrap ${isDark ? "text-[#E6EDF7]" : "text-slate-800"
                      }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[13px] shrink-0 border ${isDark
                          ? "bg-[#0D264A] text-[#38BDF8] border-[#164375]"
                          : "bg-blue-50 text-blue-600 border-blue-200"
                          }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            location_on
                          </span>
                        </div>
                        <span className={`font-bold tracking-wide ${isDark ? "text-white" : "text-slate-900"
                          }`}>
                          {item.nama_lokasi}
                        </span>
                      </div>
                    </td>

                    {/* 2. DISTRICT */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-left">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${isDark
                        ? "bg-[#0C2548] border-[#1A4378] text-[#38BDF8]"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}>
                        {item.district}
                      </span>
                    </td>

                    {/* 3. ALAMAT */}
                    <td
                      className={`py-3.5 px-4 truncate ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                        }`}
                      title={item.alamat || "-"}
                    >
                      {item.alamat || "-"}
                    </td>

                    {/* 4. LATITUDE, LONGITUDE */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-left">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md border font-bold text-xs font-mono ${isDark
                        ? "bg-[#0D2F54] border-[#174F88] text-[#38BDF8]"
                        : "bg-sky-50 border-sky-200 text-sky-700"
                        }`}>
                        {item.lat_lon_str}
                      </span>
                    </td>

                    {/* 5. AKSI */}
                    <td className="py-3.5 pl-3 pr-6 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-nowrap shrink-0">
                        {/* Detail */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(item)}
                          title="Detail Lokasi"
                          className={`w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-colors duration-150 cursor-pointer shadow-sm ${isDark
                            ? "bg-[#07383E] hover:bg-[#0A4E57] text-[#00E5FF] border-[#0A545E]"
                            : "bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200"
                            }`}
                        >
                          <span className="material-symbols-outlined text-[17px] leading-none select-none pointer-events-none flex items-center justify-center">
                            visibility
                          </span>
                        </button>

                        {/* Edit */}
                        {user?.role !== "teknisi" && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Lokasi"
                            className={`w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-colors duration-150 cursor-pointer shadow-sm ${isDark
                              ? "bg-[#3D2C0D] hover:bg-[#523B11] text-[#FBBF24] border-[#5E4413]"
                              : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                              }`}
                          >
                            <span className="material-symbols-outlined text-[17px] leading-none select-none pointer-events-none flex items-center justify-center">
                              edit
                            </span>
                          </button>
                        )}

                        {/* Hapus */}
                        {user?.role !== "teknisi" && (
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(item)}
                            title="Hapus Lokasi"
                            className={`w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-colors duration-150 cursor-pointer shadow-sm ${isDark
                              ? "bg-[#3C1318] hover:bg-[#541B22] text-[#F43F5E] border-[#5C1D25]"
                              : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                              }`}
                          >
                            <span className="material-symbols-outlined text-[17px] leading-none select-none pointer-events-none flex items-center justify-center">
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
          itemLabel="lokasi"
          onPageChange={(newPage) => setPage(newPage)}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
          }}
          isDark={isDark}
        />
      </div>

      {/* ============================================================ */}
      {/* MODAL: TAMBAH LOKASI                                         */}
      {/* ============================================================ */}
      {createModalOpen && (
        <CreateLocationModal
          availableLocations={availableLocationNames}
          availableDistricts={availableDistricts}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={(msg) => {
            setCreateModalOpen(false);
            showToast(msg, "success");
            fetchLocations(selectedLocationFilter, searchValue);
          }}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT LOKASI                                           */}
      {/* ============================================================ */}
      {editModalOpen && selectedForEdit && (
        <EditLocationModal
          locationData={selectedForEdit}
          availableLocations={availableLocationNames}
          availableDistricts={availableDistricts}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedForEdit(null);
          }}
          onSuccess={(msg) => {
            setEditModalOpen(false);
            setSelectedForEdit(null);
            showToast(msg, "success");
            fetchLocations(selectedLocationFilter, searchValue);
          }}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: DETAIL LOKASI                                         */}
      {/* ============================================================ */}
      {detailModalOpen && selectedForDetail && (
        <DetailLocationModal
          item={selectedForDetail}
          loading={detailLoading}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedForDetail(null);
          }}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: KONFIRMASI HAPUS                                      */}
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
                    Konfirmasi Hapus Lokasi
                  </h3>
                  <p className="text-xs text-rose-300">
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>

              <div className="bg-[#071426] border border-[#1A2E4C] rounded-xl p-4 text-xs space-y-2 text-[#CBD5E1]">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Nama Lokasi:</span>
                  <span className="font-bold text-white">
                    {selectedForDelete.nama_lokasi}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">District:</span>
                  <span className="text-[#38BDF8]">
                    {selectedForDelete.district}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Alamat:</span>
                  <span className="truncate max-w-[200px]">
                    {selectedForDelete.alamat || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Perangkat Terpasang:</span>
                  <span className="font-semibold text-amber-400">
                    {selectedForDelete.device_count} Perangkat
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Sistem akan memvalidasi apakah ada perangkat yang masih terpasang.
                Lokasi yang masih memiliki perangkat aktif tidak dapat dihapus
                untuk menjaga integritas database.
              </p>

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
                      <span>Hapus Lokasi</span>
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
// SUB-KOMPONEN: MODAL TAMBAH LOKASI
// (Area dihapus, Autocomplete Nama Lokasi & District, Koordinat disatukan)
// ============================================================
function CreateLocationModal({ availableLocations, availableDistricts, onClose, onSuccess }) {
  const [namaLokasi, setNamaLokasi] = useState("");
  const [showNamaSuggest, setShowNamaSuggest] = useState(false);

  const [district, setDistrict] = useState("Palu");
  const [showDistrictSuggest, setShowDistrictSuggest] = useState(false);

  const [alamat, setAlamat] = useState("");
  const [koordinat, setKoordinat] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!namaLokasi.trim()) {
      return setError("Nama lokasi wajib diisi.");
    }
    if (!district.trim()) {
      return setError("District wajib diisi.");
    }

    let lat = null;
    let lon = null;
    if (koordinat && koordinat.trim()) {
      const parts = koordinat.split(",").map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        lat = parts[0];
        lon = parts[1];
      } else {
        return setError(
          "Format koordinat tidak valid. Gunakan format 'Latitude, Longitude' (contoh: -0.8987, 119.8707)."
        );
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_lokasi: namaLokasi.trim(),
          district: district.trim(),
          alamat: alamat.trim(),
          koordinat: koordinat.trim(),
          latitude: lat,
          longitude: lon,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.message || "Lokasi baru berhasil ditambahkan!");
      } else {
        setError(data.error || "Gagal menambahkan lokasi.");
      }
    } catch (err) {
      console.error("Create location error:", err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const filteredNames = (availableLocations || []).filter((n) =>
    n.toLowerCase().includes(namaLokasi.toLowerCase())
  );
  const filteredDistricts = (availableDistricts || []).filter((d) =>
    d.toLowerCase().includes(district.toLowerCase())
  );

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
                  add_location
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Tambah Lokasi Baru
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Daftarkan titik STO atau lokasi perangkat jaringan di Kota Palu
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
              {/* Nama Lokasi dengan Autocomplete */}
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Nama Lokasi *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Ketik nama lokasi (misal: STO Palu 1)..."
                  value={namaLokasi}
                  onChange={(e) => {
                    setNamaLokasi(e.target.value);
                    setShowNamaSuggest(true);
                  }}
                  onFocus={() => setShowNamaSuggest(true)}
                  onBlur={() => setTimeout(() => setShowNamaSuggest(false), 200)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#1677FF]"
                />

                {showNamaSuggest && filteredNames.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl bg-[#0A182B] border border-[#1E3A5F] shadow-2xl max-h-40 overflow-y-auto custom-scrollbar p-1.5">
                    <div className="px-2 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Saran Referensi Database
                    </div>
                    {filteredNames.map((n, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={() => {
                          setNamaLokasi(n);
                          setShowNamaSuggest(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[#122846] text-[#CBD5E1] hover:text-[#38BDF8] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px] text-[#38BDF8]">
                          location_on
                        </span>
                        <span>{n}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* District dengan Autocomplete */}
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  District *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setShowDistrictSuggest(true);
                  }}
                  onFocus={() => setShowDistrictSuggest(true)}
                  onBlur={() => setTimeout(() => setShowDistrictSuggest(false), 200)}
                  placeholder="Ketik district (misal: Palu)..."
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#1677FF]"
                />

                {showDistrictSuggest && filteredDistricts.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl bg-[#0A182B] border border-[#1E3A5F] shadow-2xl max-h-36 overflow-y-auto custom-scrollbar p-1.5">
                    <div className="px-2 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Saran District
                    </div>
                    {filteredDistricts.map((d, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={() => {
                          setDistrict(d);
                          setShowDistrictSuggest(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[#122846] text-[#CBD5E1] hover:text-[#38BDF8] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px] text-[#10B981]">
                          domain
                        </span>
                        <span>{d}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Alamat Lengkap */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Alamat Lengkap
                </label>
                <textarea
                  rows="2"
                  placeholder="Contoh: Jl. Sam Ratulangi No. 12, Palu Timur, Kota Palu"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#1677FF] resize-none"
                />
              </div>

              {/* Bagian Koordinat (Latitude & Longitude digabungkan dalam satu input) */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-[#CBD5E1]">
                  Latitude, Longitude
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Contoh: -0.8987, 119.8707"
                    value={koordinat}
                    onChange={(e) => setKoordinat(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#1677FF] font-mono tracking-wide"
                  />
                </div>
                <p className="text-[10px] text-[#64748B]">
                  Format koordinat: <span className="text-[#38BDF8] font-mono">Latitude, Longitude</span> (contoh: -0.8987, 119.8707). Disimpan otomatis ke kolom database yang sesuai.
                </p>
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
                    <span>Simpan Lokasi</span>
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
// SUB-KOMPONEN: MODAL EDIT LOKASI
// (Area dihapus, Autocomplete Nama Lokasi & District, Koordinat disatukan)
// ============================================================
function EditLocationModal({ locationData, availableLocations, availableDistricts, onClose, onSuccess }) {
  const [namaLokasi, setNamaLokasi] = useState(locationData.nama_lokasi || "");
  const [showNamaSuggest, setShowNamaSuggest] = useState(false);

  const [district, setDistrict] = useState(locationData.district || "Palu");
  const [showDistrictSuggest, setShowDistrictSuggest] = useState(false);

  const [alamat, setAlamat] = useState(
    locationData.alamat && locationData.alamat !== "-" ? locationData.alamat : ""
  );
  const [koordinat, setKoordinat] = useState(
    locationData.lat_lon_str ||
    (locationData.latitude !== null &&
      locationData.latitude !== undefined &&
      locationData.longitude !== null &&
      locationData.longitude !== undefined
      ? `${locationData.latitude}, ${locationData.longitude}`
      : "")
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!namaLokasi.trim()) {
      return setError("Nama lokasi wajib diisi.");
    }
    if (!district.trim()) {
      return setError("District wajib diisi.");
    }

    let lat = null;
    let lon = null;
    if (koordinat && koordinat.trim()) {
      const parts = koordinat.split(",").map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        lat = parts[0];
        lon = parts[1];
      } else {
        return setError(
          "Format koordinat tidak valid. Gunakan format 'Latitude, Longitude' (contoh: -0.8987, 119.8707)."
        );
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/locations/${locationData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_lokasi: namaLokasi.trim(),
          district: district.trim(),
          alamat: alamat.trim(),
          koordinat: koordinat.trim(),
          latitude: lat,
          longitude: lon,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.message || "Data lokasi berhasil diperbarui!");
      } else {
        setError(data.error || "Gagal memperbarui data lokasi.");
      }
    } catch (err) {
      console.error("Update location error:", err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const filteredNames = (availableLocations || []).filter((n) =>
    n.toLowerCase().includes(namaLokasi.toLowerCase())
  );
  const filteredDistricts = (availableDistricts || []).filter((d) =>
    d.toLowerCase().includes(district.toLowerCase())
  );

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
                  edit_location
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Edit Data Lokasi
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Perbarui informasi titik STO atau koordinat wilayah
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
              {/* Nama Lokasi dengan Autocomplete */}
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Nama Lokasi *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={namaLokasi}
                  onChange={(e) => {
                    setNamaLokasi(e.target.value);
                    setShowNamaSuggest(true);
                  }}
                  onFocus={() => setShowNamaSuggest(true)}
                  onBlur={() => setTimeout(() => setShowNamaSuggest(false), 200)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF]"
                />

                {showNamaSuggest && filteredNames.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl bg-[#0A182B] border border-[#1E3A5F] shadow-2xl max-h-40 overflow-y-auto custom-scrollbar p-1.5">
                    <div className="px-2 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Saran Referensi Database
                    </div>
                    {filteredNames.map((n, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={() => {
                          setNamaLokasi(n);
                          setShowNamaSuggest(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[#122846] text-[#CBD5E1] hover:text-[#38BDF8] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px] text-[#38BDF8]">
                          location_on
                        </span>
                        <span>{n}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* District dengan Autocomplete */}
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  District *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setShowDistrictSuggest(true);
                  }}
                  onFocus={() => setShowDistrictSuggest(true)}
                  onBlur={() => setTimeout(() => setShowDistrictSuggest(false), 200)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF]"
                />

                {showDistrictSuggest && filteredDistricts.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl bg-[#0A182B] border border-[#1E3A5F] shadow-2xl max-h-36 overflow-y-auto custom-scrollbar p-1.5">
                    <div className="px-2 py-1 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Saran District
                    </div>
                    {filteredDistricts.map((d, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={() => {
                          setDistrict(d);
                          setShowDistrictSuggest(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[#122846] text-[#CBD5E1] hover:text-[#38BDF8] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px] text-[#10B981]">
                          domain
                        </span>
                        <span>{d}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Alamat Lengkap */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Alamat Lengkap
                </label>
                <textarea
                  rows="2"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF] resize-none"
                />
              </div>

              {/* Bagian Koordinat (Latitude & Longitude digabungkan dalam satu input) */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-[#CBD5E1]">
                  Latitude, Longitude
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Contoh: -0.8987, 119.8707"
                    value={koordinat}
                    onChange={(e) => setKoordinat(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#1677FF] font-mono tracking-wide"
                  />
                </div>
                <p className="text-[10px] text-[#64748B]">
                  Format koordinat: <span className="text-[#38BDF8] font-mono">Latitude, Longitude</span> (contoh: -0.8987, 119.8707). Disimpan otomatis ke kolom database yang sesuai.
                </p>
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
                    <span>Perbarui Lokasi</span>
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
// SUB-KOMPONEN: MODAL DETAIL LOKASI
// (Area sepenuhnya dihapus dari spesifikasi & grid)
// ============================================================
function DetailLocationModal({ item, loading, onClose }) {
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
                <span className="material-symbols-outlined text-[22px]">
                  location_on
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {item.nama_lokasi}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F294D] border border-[#1E4378] text-[#38BDF8]">
                    {item.district}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Informasi detail titik STO dan daftar perangkat terpasang
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
              <p className="text-xs mt-2">Memuat rincian lokasi...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Grid Detail Lokasi (Tanpa kolom Area) */}
              <div>
                <h4 className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider mb-2.5">
                  Spesifikasi & Identitas STO
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#071426] border border-[#1A2E4C] rounded-xl p-4 text-xs">
                  <div>
                    <span className="text-[#94A3B8] text-[11px] block">
                      Nama Lokasi
                    </span>
                    <span className="font-bold text-white">
                      {item.nama_lokasi}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] text-[11px] block">
                      District
                    </span>
                    <span className="font-semibold text-[#38BDF8]">
                      {item.district}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] text-[11px] block">
                      Alamat Lengkap
                    </span>
                    <span className="text-[#CBD5E1]">{item.alamat || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] text-[11px] block">
                      Koordinat (Latitude, Longitude)
                    </span>
                    <span className="font-mono text-[#38BDF8]">
                      {item.latitude && item.longitude
                        ? `${item.latitude}, ${item.longitude}`
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Daftar Perangkat Terpasang */}
              <div>
                <h4 className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider mb-2.5">
                  Perangkat Terpasang di Lokasi Ini (
                  {item.devices ? item.devices.length : item.device_count || 0})
                </h4>
                {item.devices && item.devices.length > 0 ? (
                  <div className="border border-[#1A2E4C] rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#09172A] text-[#94A3B8] text-[10px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Hostname</th>
                          <th className="py-2.5 px-3">Nama Perangkat</th>
                          <th className="py-2.5 px-3">Tipe</th>
                          <th className="py-2.5 px-3 font-mono">Serial Number</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#132845] text-[#CBD5E1]">
                        {item.devices.map((d) => (
                          <tr key={d.id} className="hover:bg-[#102444]/40">
                            <td className="py-2 px-3 font-mono font-bold text-white">
                              {d.hostname}
                            </td>
                            <td className="py-2 px-3 text-white">
                              {d.nama_perangkat || "-"}
                            </td>
                            <td className="py-2 px-3">{d.type}</td>
                            <td className="py-2 px-3 font-mono text-[#38BDF8]">
                              {d.serial_number}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                {d.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-[#071426] border border-[#1A2E4C] rounded-xl p-4 text-center text-xs text-[#94A3B8]">
                    Belum ada perangkat yang terdaftar di lokasi ini.
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
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
