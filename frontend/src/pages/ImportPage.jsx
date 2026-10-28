import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

// Helper untuk format ukuran file
function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `(${bytes} B)`;
  if (bytes < 1024 * 1024) return `(${(bytes / 1024).toFixed(0)} KB)`;
  return `(${(bytes / (1024 * 1024)).toFixed(1)} MB)`;
}

// Helper deteksi format dari nama file
function getFileFormat(filename) {
  if (!filename) return "XLSX";
  const ext = filename.split(".").pop().toUpperCase();
  return ext === "CSV" ? "CSV" : "XLSX";
}

// Komponen Ikon Excel Otentik persis sesuai screenshot referensi
function ExcelIcon({ size = 48, withBadge = true }) {
  const badgeSize = Math.round(size * 0.44);
  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0 select-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        {/* Document body with cut top-right corner for folded flap */}
        <path
          d="M14 6C12.3431 6 11 7.34315 11 9V39C11 40.6569 12.3431 42 14 42H34C35.6569 42 37 40.6569 37 39V15L28 6H14Z"
          fill="#0E8A4B"
        />

        {/* Dog-ear fold triangular flap at top-right */}
        <path
          d="M28 6V13C28 14.1046 28.8954 15 30 15H37L28 6Z"
          fill="#2FD078"
        />
        {/* Subtle fold border */}
        <path
          d="M28 14.5L36.5 14.5"
          stroke="#095C32"
          strokeWidth="0.8"
          strokeOpacity="0.35"
        />

        {/* 3 Horizontal light cyan data lines */}
        <rect x="22" y="19" width="11" height="2.5" rx="1.25" fill="#38BDF8" fillOpacity="0.9" />
        <rect x="22" y="24" width="11" height="2.5" rx="1.25" fill="#38BDF8" fillOpacity="0.9" />
        <rect x="22" y="29" width="11" height="2.5" rx="1.25" fill="#38BDF8" fillOpacity="0.9" />

        {/* Floating Green Tile with 'X' on lower left */}
        <g filter="url(#excelTileShadow)">
          <rect
            x="6.5"
            y="15"
            width="20"
            height="20"
            rx="4.5"
            fill="url(#excelTileGradient)"
          />
          {/* Crisp White X */}
          <path
            d="M12 20.5L21 29.5M21 20.5L12 29.5"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        <defs>
          <filter id="excelTileShadow" x="3.5" y="13" width="26" height="26" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.3" />
          </filter>
          <linearGradient id="excelTileGradient" x1="6.5" y1="15" x2="26.5" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22C55E" />
            <stop offset="1" stopColor="#15803D" />
          </linearGradient>
        </defs>
      </svg>

      {/* Bottom-right Blue Glowing Badge with Upward Arrow */}
      {withBadge && (
        <div
          className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center text-white bg-gradient-to-tr from-[#1D4ED8] to-[#3B82F6] ring-2 ring-[#0D1F36] shadow-[0_2px_8px_rgba(59,130,246,0.6)] pointer-events-none"
          style={{ width: badgeSize, height: badgeSize }}
        >
          <svg
            width={badgeSize * 0.58}
            height={badgeSize * 0.58}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 12.5V3.5M8 3.5L4 7.5M8 3.5L12 7.5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function ImportPage({ user, searchValue = "", onSearchChange }) {
  const { isDark } = useTheme();

  // Data State - Default belum terpilih (Pilih type)
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState("");
  const [deviceTypes, setDeviceTypes] = useState([{ device_type_id: 1, nama_tipe: "PSS24" }]);
  const [deviceTypeDropdownOpen, setDeviceTypeDropdownOpen] = useState(false);
  const deviceTypeDropdownRef = useRef(null);
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
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

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const fileInputRef = useRef(null);

  // Modal & Toast States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  // Tampilkan notifikasi toast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch data dari backend Flask: histori import
  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/import/?format=json", {
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
        setImports(data.imports || []);
        if (data.device_types && Array.isArray(data.device_types) && data.device_types.length > 0) {
          setDeviceTypes(data.device_types);
        }
        if (isManualRefresh) {
          showToast("Data histori import berhasil diperbarui.", "success");
        }
      } else {
        showToast(data.error || "Gagal memuat data import.", "error");
      }
    } catch (err) {
      console.error("Gagal memuat data import:", err);
      showToast("Terjadi kesalahan jaringan saat memuat data.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler pemilihan file
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
      showToast("Pastikan file dalam format Excel (.xlsx, .xls) atau .csv", "error");
      return;
    }
    setSelectedFile(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  // Hapus file yang dipilih
  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Buka dialog pilih file
  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Eksekusi Import Data ke backend Flask
  const handleImportSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!selectedFile) {
      showToast("Pilih file Excel terlebih dahulu.", "error");
      return;
    }

    if (!selectedDeviceTypeId) {
      showToast("Pilih Device Type tujuan terlebih dahulu.", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Mengunggah dan memproses file Excel...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("device_type_id", selectedDeviceTypeId);

      const res = await fetch("/import/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || "Import data berhasil diselesaikan!", "success");
        handleClearFile();
        fetchData();
      } else {
        showToast(data.error || "Gagal melakukan import data. Periksa format file Anda.", "error");
      }
    } catch (err) {
      console.error("Kesalahan saat import:", err);
      showToast("Terjadi gangguan koneksi saat melakukan import data.", "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Handler Hapus Histori Import
  const handleConfirmDelete = async () => {
    if (!selectedForDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/import/${selectedForDelete.import_id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Histori import berhasil dihapus.", "success");
        setDeleteModalOpen(false);
        setSelectedForDelete(null);
        fetchData();
      } else {
        showToast(data.error || "Gagal menghapus histori import.", "error");
      }
    } catch (err) {
      console.error("Gagal menghapus histori:", err);
      showToast("Terjadi kesalahan jaringan saat menghapus histori.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter histori berdasarkan search bar di Top Header
  const filteredImports = imports.filter((imp) => {
    if (!searchValue || !searchValue.trim()) return true;
    const query = searchValue.toLowerCase().trim();
    return (
      (imp.nama_file && imp.nama_file.toLowerCase().includes(query)) ||
      (imp.status && imp.status.toLowerCase().includes(query)) ||
      (imp.created_at && imp.created_at.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 !mt-0 w-full" style={{ marginTop: 0 }}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slideIn ${toast.type === "success"
            ? isDark
              ? "bg-[#06241E] border-emerald-500/50 text-emerald-300 shadow-emerald-950/40"
              : "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-lg"
            : isDark
              ? "bg-[#2A0E12] border-rose-500/50 text-rose-300 shadow-rose-950/40"
              : "bg-rose-50 border-rose-400 text-rose-700 shadow-lg"
            }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === "success" ? "check_circle" : "error"}
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

      {/* ======================================================== */}
      {/* KARTU 1: UNGGAH FILE EXCEL                                */}
      {/* ======================================================== */}
      <div
        className={`rounded-2xl border p-6 transition-all duration-300 ${isDark
          ? "bg-[#0D1F36] border-[#1E3A5F] shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          : "bg-white border-slate-200 shadow-sm"
          }`}
      >
        {/* Header Kartu */}
        <div className="flex items-center gap-3.5 mb-5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors shrink-0 ${isDark
              ? "bg-[#1677FF]/15 text-[#38BDF8] border border-[#1677FF]/30 shadow-[0_0_15px_rgba(22,119,255,0.15)]"
              : "bg-blue-50 text-blue-600 border border-blue-200 shadow-sm"
              }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              cloud_upload
            </span>
          </div>
          <div>
            <h2
              className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"
                }`}
            >
              Unggah File Excel
            </h2>
            <p
              className={`text-xs mt-0.5 leading-relaxed ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                }`}
            >
              Pastikan file dalam format Excel (.xlsx) dan sesuai dengan template yang telah ditentukan.
            </p>
          </div>
        </div>

        {/* Form & Upload Layout: 2 Kolom Sejajar dengan Tinggi Konsisten (Revisi 3: items-stretch) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Kolom Kiri: Dropzone File Excel (7 Kolom) */}
          <div className="lg:col-span-7 flex flex-col">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleTriggerFileInput}
              className={`flex-1 h-full border-2 border-dashed rounded-2xl py-5 px-4 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer relative group ${isDragging
                ? isDark
                  ? "border-[#1677FF] bg-[#1677FF]/10 scale-[0.99]"
                  : "border-blue-500 bg-blue-50 scale-[0.99]"
                : isDark
                  ? "border-[#1E3A5F] hover:border-[#1677FF]/70 bg-[#071426]/50 hover:bg-[#071426]/80"
                  : "border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-slate-50"
                }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />

              {/* Ikon Excel Sesuai Gambar Patokan (Revisi 1) */}
              <div className="mb-2">
                <ExcelIcon size={50} withBadge={true} />
              </div>

              {/* Dropzone Text */}
              <h3
                className={`text-sm font-semibold tracking-tight transition-colors ${isDark ? "text-[#E6EDF7] group-hover:text-white" : "text-slate-800"
                  }`}
              >
                Pilih file Excel atau seret ke sini
              </h3>
              <p
                className={`text-xs mt-0.5 leading-relaxed max-w-sm ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
              >
                Pilih file dari perangkat Anda untuk memulai import
              </p>

              {/* Tombol Pilih File */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerFileInput();
                }}
                className="mt-3 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#1677FF] hover:bg-blue-600 active:scale-95 transition-all shadow-md shadow-[#1677FF]/25 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  folder_open
                </span>
                <span>Pilih File</span>
              </button>
            </div>
          </div>

          {/* Kolom Kanan: Device Type Tujuan, File Preview, dan Tombol Import (5 Kolom, Tinggi Konsisten) */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full gap-3">
            {/* Dropdown Device Type (Style Popup Menu Konsisten dengan Halaman Export) */}
            <div className="relative" ref={deviceTypeDropdownRef}>
              <label
                htmlFor="device-type-select-btn"
                className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                  }`}
              >
                Device Type tujuan
              </label>
              <div className="relative">
                <button
                  type="button"
                  id="device-type-select-btn"
                  onClick={() => setDeviceTypeDropdownOpen((prev) => !prev)}
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
                      )?.nama_tipe || "PSS24"
                      : "Pilih type"}
                  </span>
                  <span
                    className={`material-symbols-outlined text-[18px] text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none select-none transition-transform duration-200 ${deviceTypeDropdownOpen ? "rotate-180" : ""
                      }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Pop-up Menu Dropdown Tipe Perangkat (Style Konsisten Export Page) */}
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
                        <span>Pilih type</span>
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

                {/* Hidden Native Select untuk Kompatibilitas Otomatisasi & Form Testing */}
                <select
                  id="device-type-select"
                  name="device_type_id"
                  value={selectedDeviceTypeId}
                  onChange={(e) => setSelectedDeviceTypeId(e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <option value="">Pilih type</option>
                  {deviceTypes.map((type) => (
                    <option key={type.device_type_id} value={type.device_type_id}>
                      {type.nama_tipe}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* File Preview Box (Revisi 4: Ikon delete konsisten dengan di bawah, tinggi proporsional) */}
            {selectedFile ? (
              <div
                className={`h-[54px] px-3.5 rounded-xl border flex items-center justify-between gap-3 animate-fadeIn ${isDark
                  ? "bg-[#071426] border-[#1E3A5F]"
                  : "bg-slate-50 border-slate-200"
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ExcelIcon size={34} withBadge={true} />
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-xs font-semibold truncate ${isDark ? "text-[#E6EDF7]" : "text-slate-800"
                        }`}
                      title={selectedFile.name}
                    >
                      {selectedFile.name}
                    </span>
                    <span
                      className={`text-[11px] ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                        }`}
                    >
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                </div>

                {/* Tombol aksi: Ikon refresh dan delete konsisten berwarna */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleTriggerFileInput}
                    title="Ganti file"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-sm ${isDark
                      ? "bg-[#162746] hover:bg-[#1E3660] text-[#38BDF8] border-[#203D6E]"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      refresh
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    title="Hapus file"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-sm ${isDark
                      ? "bg-[#3C1318] hover:bg-[#541B22] text-[#F43F5E] border-[#5C1D25]"
                      : "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`h-[54px] px-3.5 rounded-xl border border-dashed flex items-center gap-2.5 text-xs ${isDark
                  ? "bg-[#071426]/40 border-[#1E3A5F]/70 text-[#94A3B8]"
                  : "bg-slate-50/70 border-slate-200 text-slate-500"
                  }`}
              >
                <span className="material-symbols-outlined text-[18px] text-[#38BDF8]">
                  info
                </span>
                <span>Belum ada file yang dipilih</span>
              </div>
            )}

            {/* Tombol Submit Import Data */}
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={!selectedFile || isUploading}
              className={`w-full h-11 px-6 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${!selectedFile || isUploading
                ? isDark
                  ? "bg-[#1E3A5F]/70 text-[#64748B] cursor-not-allowed shadow-none"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-[#1677FF] hover:bg-blue-600 shadow-[#1677FF]/30 active:scale-[0.99] cursor-pointer"
                }`}
            >
              {isUploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>{uploadProgress || "Mengimpor data..."}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    upload
                  </span>
                  <span>Import Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* KARTU 2: HISTORI IMPORT DATA (Revisi 5: Card di dalam Card) */}
      {/* ======================================================== */}
      <div
        className={`rounded-2xl border p-6 transition-all duration-300 ${isDark
          ? "bg-[#0D1F36] border-[#1E3A5F] shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          : "bg-white border-slate-200 shadow-sm"
          }`}
      >
        {/* Header Histori */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark
                ? "bg-[#1677FF]/15 text-[#38BDF8] border border-[#1677FF]/30"
                : "bg-blue-50 text-blue-600 border border-blue-200"
                }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                schedule
              </span>
            </div>
            <div>
              <h3
                className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"
                  }`}
              >
                Histori Import Data
              </h3>
            </div>
          </div>

          {/* Tombol Refresh */}
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${isDark
              ? "bg-[#071426] border-[#1E3A5F] text-[#CBD5E1] hover:text-white hover:bg-[#122846] hover:border-[#1677FF]/50"
              : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400"
              }`}
          >
            <span
              className={`material-symbols-outlined text-[16px] ${refreshing ? "animate-spin text-[#1677FF]" : ""
                }`}
            >
              refresh
            </span>
            <span>Refresh</span>
          </button>
        </div>

        {/* KARTU DALAM YANG MENAUNGI TABEL HISTORI (Revisi 5) */}
        <div
          className={`rounded-xl border overflow-hidden transition-colors ${isDark
            ? "border-[#1E3A5F] bg-[#071426]"
            : "border-slate-200 bg-white"
            }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr
                  className={`text-[11px] font-bold tracking-wider uppercase border-b ${isDark
                    ? "bg-[#08172C] border-[#18355C] text-[#38BDF8]"
                    : "bg-slate-50 border-slate-200 text-blue-600"
                    }`}
                >
                  <th className="py-3 px-5">Nama File</th>
                  <th className="py-3 px-4 text-center">Jumlah Baris</th>
                  <th className="py-3 px-4 text-center">Berhasil</th>
                  <th className="py-3 px-4 text-center">Gagal</th>
                  <th className="py-3 px-4 text-center">Format</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-center">Waktu</th>
                  <th className="py-3 px-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y text-xs ${isDark ? "divide-[#132845]" : "divide-slate-100"
                  }`}
              >
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="w-7 h-7 border-2 border-[#1677FF]/30 border-t-[#1677FF] rounded-full animate-spin"></span>
                        <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                          Memuat riwayat import data...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredImports.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[36px] text-[#64748B]">
                          folder_off
                        </span>
                        <p
                          className={`font-semibold ${isDark ? "text-[#E6EDF7]" : "text-slate-700"
                            }`}
                        >
                          {searchValue
                            ? `Tidak ditemukan riwayat import yang cocok dengan "${searchValue}"`
                            : "Belum ada riwayat import data"}
                        </p>
                        <p
                          className={`text-xs max-w-sm ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                            }`}
                        >
                          {searchValue
                            ? "Coba gunakan kata kunci pencarian yang lain."
                            : "Upload file Excel pada form di atas untuk memulai import data modul atau perangkat."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredImports.map((imp) => {
                    const format = getFileFormat(imp.nama_file);
                    const isSelesai = (imp.status || "").toLowerCase() === "selesai";

                    return (
                      <tr
                        key={imp.import_id}
                        className={`transition-colors duration-150 ${isDark ? "hover:bg-[#102444]/60" : "hover:bg-blue-50/50"
                          }`}
                      >
                        {/* NAMA FILE */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-[19px] text-emerald-400 shrink-0">
                              description
                            </span>
                            <span
                              className={`font-medium max-w-[280px] truncate ${isDark ? "text-[#E6EDF7]" : "text-slate-800"
                                }`}
                              title={imp.nama_file}
                            >
                              {imp.nama_file}
                            </span>
                          </div>
                        </td>

                        {/* JUMLAH BARIS */}
                        <td
                          className={`py-3.5 px-4 text-center font-medium ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                            }`}
                        >
                          {imp.jumlah_data ?? 0}
                        </td>

                        {/* BERHASIL */}
                        <td className="py-3.5 px-4 text-center font-semibold text-emerald-400">
                          {imp.jumlah_berhasil ?? 0}
                        </td>

                        {/* GAGAL */}
                        <td
                          className={`py-3.5 px-4 text-center font-medium ${(imp.jumlah_gagal ?? 0) > 0
                            ? "text-rose-400 font-semibold"
                            : isDark
                              ? "text-[#94A3B8]"
                              : "text-slate-500"
                            }`}
                        >
                          {imp.jumlah_gagal ?? 0}
                        </td>

                        {/* FORMAT */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${format === "CSV"
                              ? isDark
                                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                                : "bg-cyan-50 text-cyan-600 border border-cyan-200"
                              : isDark
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              }`}
                          >
                            {format}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${isSelesai
                              ? isDark
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : isDark
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                : "bg-rose-50 text-rose-600 border border-rose-200"
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isSelesai ? "bg-emerald-400" : "bg-rose-400"
                                }`}
                            ></span>
                            <span>{isSelesai ? "Selesai" : imp.status || "Gagal"}</span>
                          </span>
                        </td>

                        {/* WAKTU (Ditengahin) */}
                        <td
                          className={`py-3.5 px-5 text-xs text-center whitespace-nowrap ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                            }`}
                        >
                          {imp.created_at || "-"}
                        </td>

                        {/* AKSI (Ditengahin, Ikon berwarna jelas) */}
                        <td className="py-3.5 px-5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* Tombol Unduh File Excel Asli */}
                            <a
                              href={`/import/${imp.import_id}/download`}
                              download={imp.nama_file}
                              title={`Unduh ${imp.nama_file}`}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-sm ${isDark
                                ? "bg-[#162746] hover:bg-[#1E3660] text-[#38BDF8] border-[#203D6E]"
                                : "bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                                }`}
                            >
                              <span className="material-symbols-outlined text-[17px]">
                                download
                              </span>
                            </a>

                            {/* Tombol Hapus Histori (Ikon delete berwarna) */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedForDelete(imp);
                                setDeleteModalOpen(true);
                              }}
                              title="Hapus Histori Ini"
                              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-sm ${isDark
                                ? "bg-[#3C1318] hover:bg-[#541B22] text-[#F43F5E] border-[#5C1D25]"
                                : "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200"
                                }`}
                            >
                              <span className="material-symbols-outlined text-[17px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL KONFIRMASI HAPUS HISTORI                           */}
      {/* ======================================================== */}
      {deleteModalOpen && selectedForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl transition-all duration-200 text-center ${isDark
              ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
              : "bg-white border-slate-200 text-slate-800 shadow-xl"
              }`}
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">
                warning
              </span>
            </div>

            <h3
              className={`text-base sm:text-lg font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"
                }`}
            >
              Hapus Import Data?
            </h3>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedForDelete(null);
                }}
                disabled={isDeleting}
                className={`min-w-[90px] px-5 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${isDark
                  ? "border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846]"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="min-w-[90px] px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
