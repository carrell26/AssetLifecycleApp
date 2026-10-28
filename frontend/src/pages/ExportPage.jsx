import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

export default function ExportPage({ user }) {
  const { isDark } = useTheme();

  // Filter States
  const [locations, setLocations] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [moduleTypes, setModuleTypes] = useState([]);

  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState("");
  const [selectedModuleTypeId, setSelectedModuleTypeId] = useState("");
  const [moduleTypeInput, setModuleTypeInput] = useState("");
  const [moduleTypeDropdownOpen, setModuleTypeDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [deviceTypeDropdownOpen, setDeviceTypeDropdownOpen] = useState(false);
  const moduleTypeDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);
  const deviceTypeDropdownRef = useRef(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Refs for Date Inputs
  const dateFromRef = useRef(null);
  const dateToRef = useRef(null);

  // Summary & Format States
  const [totalMovements, setTotalMovements] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [estimatedSize, setEstimatedSize] = useState("< 1 MB");
  const [fileFormat, setFileFormat] = useState("xlsx"); // "xlsx" | "csv"

  // UI States
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        moduleTypeDropdownRef.current &&
        !moduleTypeDropdownRef.current.contains(e.target)
      ) {
        setModuleTypeDropdownOpen(false);
      }
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(e.target)
      ) {
        setLocationDropdownOpen(false);
      }
      if (
        deviceTypeDropdownRef.current &&
        !deviceTypeDropdownRef.current.contains(e.target)
      ) {
        setDeviceTypeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered module types based on user input
  const filteredModuleTypes = useMemo(() => {
    const q = (moduleTypeInput || "").trim().toLowerCase();
    if (!q) return moduleTypes;
    return moduleTypes.filter((mt) =>
      (mt.nama_tipe || "").toLowerCase().includes(q)
    );
  }, [moduleTypes, moduleTypeInput]);

  // Fetch initial master data & count from backend API
  const fetchFilterData = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);

        const params = new URLSearchParams();
        params.append("format", "json");
        if (selectedLocationId) params.append("location_id", selectedLocationId);
        if (selectedDeviceTypeId)
          params.append("device_type_id", selectedDeviceTypeId);
        if (selectedModuleTypeId)
          params.append("module_type_id", selectedModuleTypeId);
        if (dateFrom) params.append("date_from", dateFrom);
        if (dateTo) params.append("date_to", dateTo);

        const res = await fetch(`/export/?${params.toString()}`, {
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        if (res.status === 401) {
          window.location.href = "/auth/login";
          return;
        }

        const data = await res.json();
        if (data.success) {
          if (isInitial) {
            setLocations(data.locations || []);
            setDeviceTypes(data.device_types || []);
            setModuleTypes(data.module_types || []);
            setTotalMovements(data.total_movements || 0);
          }
          setFilteredCount(data.filtered_count ?? data.total_movements ?? 0);
          setEstimatedSize(data.estimated_size || "< 1 MB");
        } else {
          showToast(data.error || "Gagal memuat data filter export.", "error");
        }
      } catch (err) {
        console.error("Gagal mengambil data export:", err);
        showToast("Terjadi gangguan koneksi saat mengambil data export.", "error");
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [selectedLocationId, selectedDeviceTypeId, selectedModuleTypeId, dateFrom, dateTo]
  );

  // Initial load
  useEffect(() => {
    fetchFilterData(true);
  }, []);

  // Update count when filters change
  useEffect(() => {
    fetchFilterData(false);
  }, [
    selectedLocationId,
    selectedDeviceTypeId,
    selectedModuleTypeId,
    dateFrom,
    dateTo,
    fetchFilterData,
  ]);

  // Handle Reset Filter
  const handleResetFilter = () => {
    setSelectedLocationId("");
    setSelectedDeviceTypeId("");
    setSelectedModuleTypeId("");
    setModuleTypeInput("");
    setLocationDropdownOpen(false);
    setDeviceTypeDropdownOpen(false);
    setModuleTypeDropdownOpen(false);
    setDateFrom("");
    setDateTo("");
    setFileFormat("xlsx");
    showToast("Filter berhasil dikembalikan ke kondisi awal.", "success");
  };

  // Handle Download (Excel or CSV)
  const handleDownload = async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      showToast(
        "Rentang tanggal tidak valid: 'Dari Tanggal' melebihi 'Sampai Tanggal'.",
        "error"
      );
      return;
    }

    try {
      setDownloading(true);
      const params = new URLSearchParams();
      params.append("format", fileFormat);
      if (selectedLocationId) params.append("location_id", selectedLocationId);
      if (selectedDeviceTypeId)
        params.append("device_type_id", selectedDeviceTypeId);
      if (selectedModuleTypeId)
        params.append("module_type_id", selectedModuleTypeId);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const downloadUrl = `/export/download?${params.toString()}`;

      // Trigger native browser download via anchor element
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(
        `Mengunduh data riwayat modul (${fileFormat.toUpperCase()})...`,
        "success"
      );
    } catch (err) {
      console.error("Gagal mengunduh file:", err);
      showToast("Gagal mengunduh file ekspor.", "error");
    } finally {
      setTimeout(() => {
        setDownloading(false);
      }, 1000);
    }
  };

    return (
      <div className="space-y-6 !mt-0 w-full" style={{ marginTop: 0 }}>
        {/* Toast Notification (Gaya & Animasi Muncul/Hilang Identik Halaman Import Data) */}
        {toast && (
          <div
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slideIn ${toast.type === "success" || toast.type === "info"
              ? isDark
                ? "bg-[#06241E] border-emerald-500/50 text-emerald-300 shadow-emerald-950/40"
                : "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-lg"
              : isDark
                ? "bg-[#2A0E12] border-rose-500/50 text-rose-300 shadow-rose-950/40"
                : "bg-rose-50 border-rose-400 text-rose-700 shadow-lg"
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {toast.type === "error" ? "error" : "check_circle"}
            </span>
            <span className="text-xs font-semibold">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-75 cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2-Column Layout Mengikuti Gaya Dashboard (Efek Animasi Pergerakan Konten Saat Popup Muncul/Hilang) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full transition-all duration-300">
          {/* ======================================================== */}
          {/* KOLOM KIRI: CONTAINER BOX FILTER EXPORT                   */}
          {/* ======================================================== */}
          <div
            className={`rounded-2xl border shadow-sm p-5 sm:p-6 transition-colors duration-300 flex flex-col justify-between h-full ${isDark
              ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
              : "bg-white border-slate-200 text-slate-900"
              }`}
          >
            <div>
              {/* Header Filter Export - Mengikuti Style Dashboard Cards */}
              <div
                className={`flex items-center justify-between pb-4 mb-5 border-b ${isDark ? "border-[#1A2E4C]" : "border-slate-100"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${isDark
                      ? "bg-[#1677FF]/15 border-[#1677FF]/40 text-[#38BDF8]"
                      : "bg-blue-50 border-blue-200 text-blue-600"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      tune
                    </span>
                  </div>
                  <div>
                    <h2
                      className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"
                        }`}
                    >
                      Filter Export
                    </h2>
                    <p
                      className={`text-[11px] mt-0.5 ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                        }`}
                    >
                      Sesuaikan parameter filter riwayat perpindahan modul
                    </p>
                  </div>
                </div>
              </div>

              {/* Kotak Bagian 1: Master Dropdowns (Lokasi, Tipe Perangkat, Tipe Modul) */}
              <div
                className={`rounded-2xl border p-5 space-y-4 transition-colors ${isDark
                  ? "bg-[#071426] border-[#1E3A5F]"
                  : "bg-slate-50 border-slate-200"
                  }`}
              >
                {/* Field 1: Lokasi */}
                <div className="relative" ref={locationDropdownRef}>
                  <label
                    htmlFor="export-location"
                    className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#94A3B8]" : "text-slate-600"
                      }`}
                  >
                    Lokasi
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      id="export-location-btn"
                      onClick={() => {
                        setLocationDropdownOpen((prev) => !prev);
                        setDeviceTypeDropdownOpen(false);
                        setModuleTypeDropdownOpen(false);
                      }}
                      className={`relative w-full h-11 pl-10 pr-9 rounded-xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer outline-none ${isDark
                        ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                        : "bg-white border-slate-300 text-slate-800 hover:border-blue-500"
                        }`}
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#38BDF8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none select-none">
                        location_on
                      </span>
                      <span className="truncate font-semibold">
                        {selectedLocationId
                          ? locations.find(
                            (l) => String(l.location_id) === String(selectedLocationId)
                          )?.nama_lokasi || "Lokasi Terpilih"
                          : "Semua lokasi"}
                      </span>
                      <span
                        className={`material-symbols-outlined text-[18px] text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none select-none transition-transform duration-200 ${locationDropdownOpen ? "rotate-180" : ""
                          }`}
                      >
                        expand_more
                      </span>
                    </button>

                    {/* Pop-up Menu Dropdown Lokasi */}
                    {locationDropdownOpen && (
                      <div
                        className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl z-40 backdrop-blur-md overflow-hidden ${isDark
                          ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                          : "bg-white border-slate-200 text-slate-800 shadow-xl"
                          }`}
                      >
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLocationId("");
                              setLocationDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${selectedLocationId === ""
                              ? isDark
                                ? "bg-[#1677FF] text-white font-semibold"
                                : "bg-blue-600 text-white font-semibold"
                              : isDark
                                ? "hover:bg-[#122846] text-[#CBD5E1]"
                                : "hover:bg-slate-100 text-slate-700"
                              }`}
                          >
                            <span>Semua lokasi</span>
                            {selectedLocationId === "" && (
                              <span className="material-symbols-outlined text-[16px] shrink-0">
                                check
                              </span>
                            )}
                          </button>

                          <div
                            className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"
                              }`}
                          />

                          {locations.map((loc) => {
                            const isSelected =
                              String(selectedLocationId) === String(loc.location_id);
                            return (
                              <button
                                key={loc.location_id}
                                type="button"
                                onClick={() => {
                                  setSelectedLocationId(String(loc.location_id));
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
                                <span className="truncate pr-2">{loc.nama_lokasi}</span>
                                {isSelected && (
                                  <span className="material-symbols-outlined text-[16px] shrink-0">
                                    check
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Hidden Native Select untuk Kompatibilitas Otomatisasi & Pengujian */}
                    <select
                      id="export-location"
                      value={selectedLocationId}
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <option value="">Semua lokasi</option>
                      {locations.map((loc) => (
                        <option key={loc.location_id} value={loc.location_id}>
                          {loc.nama_lokasi}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Field 2: Tipe Perangkat */}
                <div className="relative" ref={deviceTypeDropdownRef}>
                  <label
                    htmlFor="export-device-type"
                    className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#94A3B8]" : "text-slate-600"
                      }`}
                  >
                    Tipe Perangkat
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      id="export-device-type-btn"
                      onClick={() => {
                        setDeviceTypeDropdownOpen((prev) => !prev);
                        setLocationDropdownOpen(false);
                        setModuleTypeDropdownOpen(false);
                      }}
                      className={`relative w-full h-11 pl-10 pr-9 rounded-xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer outline-none ${isDark
                        ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                        : "bg-white border-slate-300 text-slate-800 hover:border-blue-500"
                        }`}
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#38BDF8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none select-none">
                        desktop_windows
                      </span>
                      <span className="truncate font-semibold">
                        {selectedDeviceTypeId
                          ? deviceTypes.find(
                            (t) => String(t.device_type_id) === String(selectedDeviceTypeId)
                          )?.nama_tipe || "Tipe Perangkat Terpilih"
                          : "Semua tipe perangkat"}
                      </span>
                      <span
                        className={`material-symbols-outlined text-[18px] text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none select-none transition-transform duration-200 ${deviceTypeDropdownOpen ? "rotate-180" : ""
                          }`}
                      >
                        expand_more
                      </span>
                    </button>

                    {/* Pop-up Menu Dropdown Tipe Perangkat */}
                    {deviceTypeDropdownOpen && (
                      <div
                        className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl z-40 backdrop-blur-md overflow-hidden ${isDark
                          ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                          : "bg-white border-slate-200 text-slate-800 shadow-xl"
                          }`}
                      >
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDeviceTypeId("");
                              setDeviceTypeDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${selectedDeviceTypeId === ""
                              ? isDark
                                ? "bg-[#1677FF] text-white font-semibold"
                                : "bg-blue-600 text-white font-semibold"
                              : isDark
                                ? "hover:bg-[#122846] text-[#CBD5E1]"
                                : "hover:bg-slate-100 text-slate-700"
                              }`}
                          >
                            <span>Semua tipe perangkat</span>
                            {selectedDeviceTypeId === "" && (
                              <span className="material-symbols-outlined text-[16px] shrink-0">
                                check
                              </span>
                            )}
                          </button>

                          <div
                            className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"
                              }`}
                          />

                          {deviceTypes.map((type) => {
                            const isSelected =
                              String(selectedDeviceTypeId) === String(type.device_type_id);
                            return (
                              <button
                                key={type.device_type_id}
                                type="button"
                                onClick={() => {
                                  setSelectedDeviceTypeId(String(type.device_type_id));
                                  setDeviceTypeDropdownOpen(false);
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
                                <span className="truncate pr-2">{type.nama_tipe}</span>
                                {isSelected && (
                                  <span className="material-symbols-outlined text-[16px] shrink-0">
                                    check
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Hidden Native Select untuk Kompatibilitas Otomatisasi & Pengujian */}
                    <select
                      id="export-device-type"
                      value={selectedDeviceTypeId}
                      onChange={(e) => setSelectedDeviceTypeId(e.target.value)}
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <option value="">Semua tipe perangkat</option>
                      {deviceTypes.map((type) => (
                        <option key={type.device_type_id} value={type.device_type_id}>
                          {type.nama_tipe}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Field 3: Tipe Modul (Input Searchable + Pop-up Dropdown Sesuai Referensi Gambar 1) */}
                <div className="relative" ref={moduleTypeDropdownRef}>
                  <label
                    htmlFor="export-module-type-input"
                    className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#94A3B8]" : "text-slate-600"
                      }`}
                  >
                    Tipe Modul
                  </label>

                  {/* Input Field dengan Icon & Tombol Pop-up Dropdown */}
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[18px] text-[#38BDF8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none select-none">
                      memory
                    </span>

                    <input
                      type="text"
                      id="export-module-type-input"
                      value={moduleTypeInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModuleTypeInput(val);
                        setModuleTypeDropdownOpen(true);

                        // Jika input cocok dengan nama tipe modul, otomatis pilih
                        const match = moduleTypes.find(
                          (mt) =>
                            mt.nama_tipe.toLowerCase() === val.trim().toLowerCase()
                        );
                        if (match) {
                          setSelectedModuleTypeId(String(match.module_type_id));
                        } else if (!val.trim()) {
                          setSelectedModuleTypeId("");
                        }
                      }}
                      onFocus={() => setModuleTypeDropdownOpen(true)}
                      placeholder="Ketik atau pilih tipe modul..."
                      autoComplete="off"
                      className={`w-full h-11 pl-10 pr-16 rounded-xl border text-xs font-medium transition-all outline-none ${isDark
                        ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] placeholder-[#64748B] hover:border-[#1677FF] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                        : "bg-white border-slate-300 text-slate-800 placeholder-slate-400 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        }`}
                    />

                    {/* Right Action Icons: Clear (jika ada input) & Chevron Dropdown */}
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {moduleTypeInput && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModuleTypeInput("");
                            setSelectedModuleTypeId("");
                          }}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${isDark
                            ? "text-[#64748B] hover:text-white"
                            : "text-slate-400 hover:text-slate-700"
                            }`}
                          title="Hapus filter tipe modul"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            close
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setModuleTypeDropdownOpen((prev) => !prev)
                        }
                        className={`p-1 rounded-md transition-colors cursor-pointer ${isDark
                          ? "text-[#94A3B8] hover:text-white"
                          : "text-slate-400 hover:text-slate-700"
                          }`}
                        title="Buka dropdown tipe modul"
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${moduleTypeDropdownOpen ? "rotate-180" : ""
                            }`}
                        >
                          expand_more
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Pop-up Menu Dropdown (Desain Persis Mengikuti Gambar 1) */}
                  {moduleTypeDropdownOpen && (
                    <div
                      className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl z-40 backdrop-blur-md overflow-hidden ${isDark
                        ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                        : "bg-white border-slate-200 text-slate-800 shadow-xl"
                        }`}
                    >
                      <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                        {/* Opsi 1: Semua tipe modul */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedModuleTypeId("");
                            setModuleTypeInput("");
                            setModuleTypeDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${selectedModuleTypeId === "" && !moduleTypeInput
                            ? isDark
                              ? "bg-[#1677FF] text-white font-semibold"
                              : "bg-blue-600 text-white font-semibold"
                            : isDark
                              ? "hover:bg-[#122846] text-[#CBD5E1]"
                              : "hover:bg-slate-100 text-slate-700"
                            }`}
                        >
                          <span>Semua tipe modul</span>
                          {selectedModuleTypeId === "" && !moduleTypeInput && (
                            <span className="material-symbols-outlined text-[16px] shrink-0">
                              check
                            </span>
                          )}
                        </button>

                        {/* Garis Pemisah (Divider Line) */}
                        <div
                          className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"
                            }`}
                        />

                        {/* Daftar Opsi Tipe Modul (Dapat difilter secara langsung lewat input) */}
                        {filteredModuleTypes.length > 0 ? (
                          filteredModuleTypes.map((mt) => {
                            const isSelected =
                              String(selectedModuleTypeId) ===
                              String(mt.module_type_id);
                            return (
                              <button
                                key={mt.module_type_id}
                                type="button"
                                onClick={() => {
                                  setSelectedModuleTypeId(
                                    String(mt.module_type_id)
                                  );
                                  setModuleTypeInput(mt.nama_tipe);
                                  setModuleTypeDropdownOpen(false);
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
                                <span className="truncate pr-2">{mt.nama_tipe}</span>
                                {isSelected && (
                                  <span className="material-symbols-outlined text-[16px] shrink-0">
                                    check
                                  </span>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div
                            className={`px-3 py-2.5 text-xs text-center italic ${isDark ? "text-[#64748B]" : "text-slate-400"
                              }`}
                          >
                            Tidak ada tipe modul yang cocok
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hidden Native Select untuk Kompatibilitas Otomatisasi & Pengujian */}
                  <select
                    id="export-module-type"
                    value={selectedModuleTypeId}
                    onChange={(e) => {
                      setSelectedModuleTypeId(e.target.value);
                      const mt = moduleTypes.find(
                        (m) => String(m.module_type_id) === String(e.target.value)
                      );
                      setModuleTypeInput(mt ? mt.nama_tipe : "");
                    }}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <option value="">Semua tipe modul</option>
                    {moduleTypes.map((mt) => (
                      <option key={mt.module_type_id} value={mt.module_type_id}>
                        {mt.nama_tipe}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kotak Bagian 2: Rentang Tanggal (Ikon Persis Halaman Audit Log - calendar_month) */}
              <div
                className={`mt-4 rounded-2xl border p-5 transition-colors ${isDark
                  ? "bg-[#071426] border-[#1E3A5F]"
                  : "bg-slate-50 border-slate-200"
                  }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dari Tanggal: Ikon calendar_month Persis Halaman Audit Log */}
                  <div>
                    <label
                      htmlFor="export-date-from"
                      className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#94A3B8]" : "text-slate-600"
                        }`}
                    >
                      Dari Tanggal
                    </label>
                    <div className="relative flex items-center group">
                      <span className="material-symbols-outlined text-[18px] text-blue-500 dark:text-[#38BDF8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none select-none shrink-0 transition-colors group-hover:text-blue-600 dark:group-hover:text-[#00BFFF]">
                        calendar_month
                      </span>
                      <input
                        type="date"
                        id="export-date-from"
                        ref={dateFromRef}
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        onClick={(e) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch (err) { }
                        }}
                        className={`export-date-input w-full h-11 pl-10 pr-3 rounded-xl border text-xs font-medium transition-all outline-none cursor-pointer ${isDark
                          ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                          : "bg-white border-slate-300 text-slate-800 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          }`}
                      />
                    </div>
                  </div>

                  {/* Sampai Tanggal: Ikon calendar_month Persis Halaman Audit Log */}
                  <div>
                    <label
                      htmlFor="export-date-to"
                      className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#94A3B8]" : "text-slate-600"
                        }`}
                    >
                      Sampai Tanggal
                    </label>
                    <div className="relative flex items-center group">
                      <span className="material-symbols-outlined text-[18px] text-blue-500 dark:text-[#38BDF8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none select-none shrink-0 transition-colors group-hover:text-blue-600 dark:group-hover:text-[#00BFFF]">
                        calendar_month
                      </span>
                      <input
                        type="date"
                        id="export-date-to"
                        ref={dateToRef}
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        onClick={(e) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch (err) { }
                        }}
                        className={`export-date-input w-full h-11 pl-10 pr-3 rounded-xl border text-xs font-medium transition-all outline-none cursor-pointer ${isDark
                          ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                          : "bg-white border-slate-300 text-slate-800 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* KOLOM KANAN: PRATINJAU & RINGKASAN                       */}
          {/* ======================================================== */}
          <div
            className={`rounded-2xl border shadow-sm p-5 sm:p-6 transition-colors duration-300 flex flex-col justify-between h-full ${isDark
              ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
              : "bg-white border-slate-200 text-slate-900"
              }`}
          >
            <div>
              {/* Header Pratinjau & Ringkasan */}
              <div
                className={`flex items-center justify-between pb-4 mb-5 border-b ${isDark ? "border-[#1A2E4C]" : "border-slate-100"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${isDark
                      ? "bg-[#1677FF]/15 border-[#1677FF]/40 text-[#38BDF8]"
                      : "bg-blue-50 border-blue-200 text-blue-600"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      visibility
                    </span>
                  </div>
                  <div>
                    <h2
                      className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"
                        }`}
                    >
                      Pratinjau &amp; Ringkasan
                    </h2>
                    <p
                      className={`text-[11px] mt-0.5 ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                        }`}
                    >
                      Estimasi jumlah data dan ukuran file hasil ekspor
                    </p>
                  </div>
                </div>
              </div>

              {/* Kotak Pratinjau Utama: Count + Info Card */}
              <div
                className={`rounded-2xl border p-6 transition-colors ${isDark
                  ? "bg-[#071426] border-[#1E3A5F]"
                  : "bg-slate-50 border-slate-200"
                  }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                  {/* Bagian Kiri Kotak: Pratinjau Status Riwayat & Angka */}
                  <div className="flex flex-col justify-center">
                    <span
                      className={`text-xs font-semibold ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                        }`}
                    >
                      Pratinjau Status Riwayat
                    </span>
                    <div className="text-[52px] font-black text-[#00BFFF] tracking-tight my-1.5 leading-none">
                      {loading ? (
                        <span className="animate-pulse opacity-60">...</span>
                      ) : (
                        filteredCount
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                        }`}
                    >
                      Total Aktivitas Tercatat
                    </span>
                  </div>

                  {/* Bagian Kanan Kotak: Info Card Notifikasi */}
                  <div
                    className={`rounded-xl p-4 border flex flex-col justify-center transition-all ${isDark
                      ? "bg-[#0A1F3B]/80 border-[#1E3A5F] text-[#94A3B8]"
                      : "bg-blue-50/70 border-blue-200 text-slate-600"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#38BDF8] shrink-0">
                        info
                      </span>
                      <span
                        className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-800"
                          }`}
                      >
                        Info
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Membatasi data berdasarkan rentang waktu dapat mempercepat
                      pengunduhan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Estimasi Ukuran File */}
              <div className="mt-6 flex items-center text-xs font-medium text-[#94A3B8]">
                <span>Estimasi Ukuran File:&nbsp;</span>
                <strong
                  className={
                    isDark ? "text-white font-bold" : "text-slate-900 font-bold"
                  }
                >
                  {estimatedSize}
                </strong>
              </div>

              {/* Pilihan Format File: XLSX | CSV */}
              <div className="mt-5 flex items-center justify-between">
                <span
                  className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-700"
                    }`}
                >
                  Format File
                </span>
                <div
                  className={`inline-flex rounded-xl p-1 border gap-1 transition-colors ${isDark
                    ? "bg-[#071426] border-[#1E3A5F]"
                    : "bg-slate-100 border-slate-200"
                    }`}
                >
                  <button
                    type="button"
                    id="btn-format-xlsx"
                    onClick={() => setFileFormat("xlsx")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${fileFormat === "xlsx"
                      ? "bg-[#1677FF] text-white shadow-sm shadow-[#1677FF]/40"
                      : isDark
                        ? "text-[#94A3B8] hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    XLSX
                  </button>
                  <button
                    type="button"
                    id="btn-format-csv"
                    onClick={() => setFileFormat("csv")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${fileFormat === "csv"
                      ? "bg-[#1677FF] text-white shadow-sm shadow-[#1677FF]/40"
                      : isDark
                        ? "text-[#94A3B8] hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Tombol Aksi: Download (Ikon Download) & Reset Filter */}
            <div
              className="mt-8 flex items-center justify-center gap-3.5"
            >
              <button
                type="button"
                id="btn-download-export"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#1677FF] hover:bg-blue-600 active:bg-blue-700 shadow-md shadow-[#1677FF]/25 hover:shadow-[#1677FF]/40 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <span
                  className={`material-symbols-outlined text-[18px] shrink-0 ${downloading ? "animate-spin" : ""
                    }`}
                >
                  {downloading ? "progress_activity" : "download"}
                </span>
                <span>
                  {downloading
                    ? "Mengunduh..."
                    : fileFormat === "csv"
                      ? "Download CSV"
                      : "Download Excel"}
                </span>
              </button>
              <button
                type="button"
                id="btn-reset-filter"
                onClick={handleResetFilter}
                className={`inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer active:scale-95 ${isDark
                  ? "bg-[#0A182B] hover:bg-[#0E2038] border-[#1E3A5F] hover:border-[#1677FF] text-[#94A3B8] hover:text-white"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  restart_alt
                </span>
                <span>Reset Filter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
