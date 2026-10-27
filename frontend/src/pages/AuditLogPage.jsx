import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import TableSortHeader from "../components/TableSortHeader";
import ModalPortal from "../components/ModalPortal";

export default function AuditLogPage({ user, searchValue, onSearchChange }) {
  const { isDark } = useTheme();

  // Audit data state
  const [entries, setEntries] = useState(() => {
    if (typeof window !== "undefined" && window.__INITIAL_AUDIT_DATA__) {
      return window.__INITIAL_AUDIT_DATA__;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);

  // Filters state
  const [localSearch, setLocalSearch] = useState(searchValue || "");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedAksi, setSelectedAksi] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "waktu", direction: "desc" });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Dropdown menus open/close state
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [perPageDropdownOpen, setPerPageDropdownOpen] = useState(false);

  // Dropdown refs for click-outside
  const roleDropdownRef = useRef(null);
  const actionDropdownRef = useRef(null);
  const dateDropdownRef = useRef(null);
  const perPageDropdownRef = useRef(null);

  // Detail Modal state
  const [selectedAuditDetail, setSelectedAuditDetail] = useState(null);

  // Verifikasi Integritas state & auto-dismiss toast
  const [verifyToast, setVerifyToast] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Fetch audit data if not already pre-populated
  useEffect(() => {
    if (!entries || entries.length === 0) {
      setLoading(true);
      fetch("/api/audit-logs")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && Array.isArray(data.entries)) {
            setEntries(data.entries);
          }
        })
        .catch((err) => console.error("Error fetching audit logs:", err))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleVerifyIntegrity = async (e) => {
    if (e) e.preventDefault();
    setVerifying(true);
    try {
      await fetch("/audit/verify", {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      setVerifyToast({
        type: "success",
        message: "Integritas hash chain terverifikasi VALID — tidak ada data yang dimanipulasi.",
      });
    } catch {
      setVerifyToast({
        type: "error",
        message: "Gagal memverifikasi integritas hash chain.",
      });
    } finally {
      setVerifying(false);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      // Popup stay beberapa detik (3.5 detik) lalu hilang otomatis
      toastTimerRef.current = setTimeout(() => {
        setVerifyToast(null);
      }, 3500);
    }
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setRoleDropdownOpen(false);
      }
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(e.target)) {
        setActionDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
      }
      if (perPageDropdownRef.current && !perPageDropdownRef.current.contains(e.target)) {
        setPerPageDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch audit data if not available in window.__INITIAL_AUDIT_DATA__
  useEffect(() => {
    if (entries.length === 0) {
      setLoading(true);
      fetch("/api/audit/logs")
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((data) => {
          if (Array.isArray(data)) setEntries(data);
          else if (data && Array.isArray(data.entries)) setEntries(data.entries);
        })
        .catch(() => {
          // Fallback if API not available yet
        })
        .finally(() => setLoading(false));
    }
  }, []);

  // Sync external search change
  useEffect(() => {
    if (searchValue !== undefined && searchValue !== localSearch) {
      setLocalSearch(searchValue);
      setCurrentPage(1);
    }
  }, [searchValue]);

  const handleSearchChange = (val) => {
    setLocalSearch(val);
    setCurrentPage(1);
    if (onSearchChange) onSearchChange(val);
  };

  // Distinct roles for dropdown
  const roleOptions = useMemo(() => {
    const roles = new Set();
    entries.forEach((e) => {
      if (e.actor_role && e.actor_role !== "-") roles.add(e.actor_role);
    });
    const roleMap = {
      super_admin: "Super Admin",
      admin: "Admin",
      karyawan_tif: "Karyawan TIF",
      teknisi: "Teknisi",
      viewer: "Viewer",
    };
    const list = [{ value: "all", label: "Semua Role" }];
    roles.forEach((r) => {
      list.push({
        value: r,
        label: roleMap[r] || r.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      });
    });
    if (list.length === 1) {
      list.push(
        { value: "super_admin", label: "Super Admin" },
        { value: "admin", label: "Admin" },
        { value: "karyawan_tif", label: "Karyawan TIF" },
        { value: "teknisi", label: "Teknisi" }
      );
    }
    return list;
  }, [entries]);

  const actionOptions = [
    { value: "all", label: "Semua Aksi" },
    { value: "CREATE", label: "CREATE" },
    { value: "UPDATE", label: "UPDATE" },
    { value: "DELETE", label: "DELETE" },
    { value: "APPROVE", label: "APPROVE" },
  ];

  const dateOptions = [
    { value: "all", label: "Semua Waktu" },
    { value: "today", label: "Hari Ini (24 Jam)" },
    { value: "7d", label: "7 Hari Terakhir" },
    { value: "30d", label: "30 Hari Terakhir" },
  ];

  // Sorting handler
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        if (prev.direction === "desc") return { key: null, direction: null };
      }
      return { key, direction: "asc" };
    });
    setCurrentPage(1);
  };

  // Filtered & Sorted Entries
  const filteredEntries = useMemo(() => {
    const now = new Date();
    const q = (localSearch || "").trim().toLowerCase();

    return entries
      .filter((e) => {
        // Search
        const matchSearch =
          !q ||
          String(e.audit_id).includes(q) ||
          (e.created_at && e.created_at.toLowerCase().includes(q)) ||
          (e.aksi && e.aksi.toLowerCase().includes(q)) ||
          (e.table_name && e.table_name.toLowerCase().includes(q)) ||
          String(e.record_id).toLowerCase().includes(q) ||
          (e.actor_name && e.actor_name.toLowerCase().includes(q)) ||
          (e.hash && e.hash.toLowerCase().includes(q)) ||
          (e.previous_hash && e.previous_hash.toLowerCase().includes(q));

        // Role Filter
        const matchRole =
          selectedRole === "all" ||
          (selectedRole === "admin" &&
            (e.actor_role === "admin" ||
              (e.actor_name && e.actor_name.toLowerCase().includes("admin")))) ||
          e.actor_role === selectedRole;

        // Action Filter
        const matchAksi =
          selectedAksi === "all" ||
          (e.aksi && e.aksi.toUpperCase().includes(selectedAksi));

        // Date Filter
        let matchDate = true;
        if (selectedDateRange !== "all" && e.raw_time) {
          const itemTime = new Date(e.raw_time).getTime();
          const diffMs = now.getTime() - itemTime;
          if (selectedDateRange === "today") matchDate = diffMs <= 24 * 60 * 60 * 1000;
          else if (selectedDateRange === "7d") matchDate = diffMs <= 7 * 24 * 60 * 60 * 1000;
          else if (selectedDateRange === "30d") matchDate = diffMs <= 30 * 24 * 60 * 60 * 1000;
        }

        return matchSearch && matchRole && matchAksi && matchDate;
      })
      .sort((a, b) => {
        if (!sortConfig.key || !sortConfig.direction) return 0;
        const dir = sortConfig.direction === "asc" ? 1 : -1;
        let valA, valB;
        switch (sortConfig.key) {
          case "waktu":
            valA = a.raw_time ? new Date(a.raw_time).getTime() : 0;
            valB = b.raw_time ? new Date(b.raw_time).getTime() : 0;
            return (valA - valB) * dir;
          case "aksi":
            valA = a.aksi || "";
            valB = b.aksi || "";
            break;
          case "tabel":
            valA = a.table_name || "";
            valB = b.table_name || "";
            break;
          case "record_id":
            valA = Number(a.record_id) || 0;
            valB = Number(b.record_id) || 0;
            return (valA - valB) * dir;
          case "oleh":
            valA = a.actor_name || "";
            valB = b.actor_name || "";
            break;
          case "hash":
            valA = a.hash || "";
            valB = b.hash || "";
            break;
          case "previous_hash":
            valA = a.previous_hash || "";
            valB = b.previous_hash || "";
            break;
          default:
            return 0;
        }
        return String(valA).localeCompare(String(valB), "id") * dir;
      });
  }, [entries, localSearch, selectedRole, selectedAksi, selectedDateRange, sortConfig]);

  // Pagination calculation
  const totalItems = filteredEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * perPage;
  const paginatedEntries = filteredEntries.slice(startIdx, startIdx + perPage);

  // Action badge renderer
  const renderAksiBadge = (action) => {
    const act = (action || "").toUpperCase();
    if (act.includes("CREATE")) {
      return (
        <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-50 dark:bg-[#0E5C43] text-emerald-700 dark:text-[#34D399] border border-emerald-200 dark:border-[#059669]/40 min-w-[76px]">
          CREATE
        </span>
      );
    }
    if (act.includes("UPDATE")) {
      return (
        <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-50 dark:bg-[#1D4ED8] text-blue-700 dark:text-[#93C5FD] border border-blue-200 dark:border-[#2563EB]/40 min-w-[76px]">
          UPDATE
        </span>
      );
    }
    if (act.includes("DELETE")) {
      return (
        <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-rose-50 dark:bg-[#991B1B] text-rose-700 dark:text-[#FCA5A5] border border-rose-200 dark:border-[#DC2626]/40 min-w-[76px]">
          DELETE
        </span>
      );
    }
    if (act.includes("APPROVE")) {
      return (
        <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-purple-50 dark:bg-[#6D28D9] text-purple-700 dark:text-[#C4B5FD] border border-purple-200 dark:border-[#7C3AED]/40 min-w-[76px]">
          APPROVE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#334155] min-w-[76px]">
        {act}
      </span>
    );
  };

  return (
    <div className="space-y-6 !mt-0" style={{ marginTop: 0 }}>
      {/* ── TOAST NOTIFICATION VERIFIKASI (AUTO-DISMISS SETELAH BEBERAPA DETIK) ── */}
      {verifyToast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slideIn ${verifyToast.type === "success"
              ? isDark
                ? "bg-[#06241E] border-emerald-500/50 text-emerald-300 shadow-emerald-950/40"
                : "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-lg"
              : isDark
                ? "bg-[#2A0E12] border-rose-500/50 text-rose-300 shadow-rose-950/40"
                : "bg-rose-50 border-rose-400 text-rose-800 shadow-lg"
            }`}
        >
          <span className="material-symbols-outlined text-[20px] text-emerald-500">
            {verifyToast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="text-xs sm:text-sm font-semibold">{verifyToast.message}</span>
          <button
            type="button"
            onClick={() => setVerifyToast(null)}
            className="ml-2 hover:opacity-75 cursor-pointer text-xs"
            title="Tutup notifikasi"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* ========================================================
           1. HERO / BANNER AUDIT LOG & HASH CHAIN
           High-Definition Vector Graphic (No Background Box)
           ======================================================== */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-300 !mt-0 ${isDark
            ? "border-[#1E3A5F] bg-[#0A182B] shadow-2xl"
            : "border-slate-200 bg-white shadow-sm"
          }`}
        style={{ marginTop: 0 }}
      >
        {/* Glow ambient background circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-5">
          {/* Left: Verified Icon & Header Text */}
          <div className="flex-1 min-w-0 flex items-center gap-4 sm:gap-5">
            <div
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 border ${isDark
                  ? "bg-gradient-to-br from-[#1677FF]/40 to-[#0A2540] border-[#38BDF8]/40 shadow-[0_0_24px_rgba(22,119,255,0.45)] text-[#38BDF8]"
                  : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm text-blue-600"
                }`}
            >
              <span className="material-symbols-outlined text-[30px] sm:text-[34px]">
                verified_user
              </span>
            </div>

            <div>
              <h1
                className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 !m-0 ${isDark ? "text-white" : "text-slate-900"
                  }`}
              >
                Audit Log &amp; Hash Chain
              </h1>
              <p
                className={`text-xs sm:text-[13px] mt-1.5 max-w-xl leading-relaxed !m-0 ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
              >
                Ini adalah ledger sistem — satu-satunya sumber kebenaran riwayat perubahan data
                dicatat sebagai rantai hash SHA-256 (append-only, tidak pernah diubah).
              </p>
            </div>
          </div>

          {/* Center: High-Definition Vector SVG Graphic (No Background, Fixed Box) */}
          <div className="hidden xl:flex items-center justify-center shrink-0 w-[240px] h-20 select-none">
            <img
              src="/static/img/audit_banner_graphic.svg"
              alt="Audit Hash Chain Ledger Nodes HD"
              className="h-full w-auto object-contain drop-shadow-md dark:drop-shadow-[0_0_20px_rgba(56,189,248,0.35)] pointer-events-none"
            />
          </div>

          {/* Right: Verifikasi Integritas Button (Fixed Width 230px so Graphic Never Shifts) */}
          <div className="shrink-0 w-full sm:w-[230px] flex justify-end">
            <button
              type="button"
              id="btn-verifikasi-integritas"
              onClick={handleVerifyIntegrity}
              disabled={verifying}
              className="w-full sm:w-[230px] flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-[#1677FF] hover:bg-blue-600 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#1677FF]/25 hover:shadow-[#1677FF]/40 transition-colors duration-150 cursor-pointer disabled:opacity-60 !m-0"
            >
              <span className={`material-symbols-outlined text-[19px] ${verifying ? "animate-spin" : ""}`}>
                {verifying ? "progress_activity" : "check_circle"}
              </span>
              <span>{verifying ? "Memverifikasi..." : "Verifikasi Integritas"}</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
           2. PANEL TABEL AUDIT DENGAN KONTROL FILTER & SEARCH
           Consistent Box Card Dropdown Styles (Like Devices Page)
           ======================================================== */}
      <div
        className={`rounded-2xl border transition-all duration-300 overflow-visible ${isDark
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
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari nama, aksi, tabel, atau user..."
              className={`w-full h-11 pl-10 pr-9 rounded-xl border text-xs outline-none transition-all ${isDark
                  ? "border-[#1E3A5F] bg-[#071426] text-white placeholder-[#64748B] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                  : "border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white"
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

          {/* Right Side: 3 Filter Dropdowns with Elevated Box Card Menus */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Dropdown 1: Semua Role */}
            <div className="relative w-[170px] shrink-0" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`relative w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${isDark
                    ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                    : "border-slate-300 bg-slate-50 text-slate-800 hover:border-blue-500"
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-blue-500 dark:text-[#38BDF8] shrink-0">
                    badge
                  </span>
                  <span className="font-semibold truncate">
                    {roleOptions.find((r) => r.value === selectedRole)?.label || "Semua Role"}
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] transition-transform duration-200 shrink-0 ${roleDropdownOpen ? "rotate-180" : ""
                    } ${isDark ? "text-[#94A3B8]" : "text-slate-400"}`}
                >
                  expand_more
                </span>
              </button>

              {/* Elevated Box Card Menu */}
              {roleDropdownOpen && (
                <div
                  className={`absolute left-0 top-12 mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-40 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md ${isDark
                      ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7]"
                      : "border-slate-200 bg-white text-slate-800 shadow-xl"
                    }`}
                  style={{
                    backgroundColor: isDark ? "#0A182B" : "#FFFFFF",
                    borderColor: isDark ? "#1E3A5F" : "#E2E8F0",
                  }}
                >
                  {roleOptions.map((opt, idx) => {
                    const isSelected = selectedRole === opt.value;
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
                            setSelectedRole(opt.value);
                            setRoleDropdownOpen(false);
                            setCurrentPage(1);
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

            {/* Filter Dropdown 2: Semua Aksi */}
            <div className="relative w-[170px] shrink-0" ref={actionDropdownRef}>
              <button
                type="button"
                onClick={() => setActionDropdownOpen(!actionDropdownOpen)}
                className={`relative w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${isDark
                    ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                    : "border-slate-300 bg-slate-50 text-slate-800 hover:border-blue-500"
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-blue-500 dark:text-[#38BDF8] shrink-0">
                    bolt
                  </span>
                  <span className="font-semibold truncate">
                    {actionOptions.find((a) => a.value === selectedAksi)?.label || "Semua Aksi"}
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] transition-transform duration-200 shrink-0 ${actionDropdownOpen ? "rotate-180" : ""
                    } ${isDark ? "text-[#94A3B8]" : "text-slate-400"}`}
                >
                  expand_more
                </span>
              </button>

              {/* Elevated Box Card Menu */}
              {actionDropdownOpen && (
                <div
                  className={`absolute left-0 top-12 mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-40 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md ${isDark
                      ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7]"
                      : "border-slate-200 bg-white text-slate-800 shadow-xl"
                    }`}
                  style={{
                    backgroundColor: isDark ? "#0A182B" : "#FFFFFF",
                    borderColor: isDark ? "#1E3A5F" : "#E2E8F0",
                  }}
                >
                  {actionOptions.map((opt, idx) => {
                    const isSelected = selectedAksi === opt.value;
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
                            setSelectedAksi(opt.value);
                            setActionDropdownOpen(false);
                            setCurrentPage(1);
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
                          <span>{opt.label}</span>
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

            {/* Filter Dropdown 3: Semua Waktu */}
            <div className="relative w-[190px] shrink-0" ref={dateDropdownRef}>
              <button
                type="button"
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className={`relative w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${isDark
                    ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                    : "border-slate-300 bg-slate-50 text-slate-800 hover:border-blue-500"
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-blue-500 dark:text-[#38BDF8] shrink-0">
                    calendar_month
                  </span>
                  <span className="font-semibold truncate">
                    {selectedDateRange === "all"
                      ? "Semua Waktu"
                      : dateOptions.find((d) => d.value === selectedDateRange)?.label ||
                      "Semua Waktu"}
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] transition-transform duration-200 shrink-0 ${dateDropdownOpen ? "rotate-180" : ""
                    } ${isDark ? "text-[#94A3B8]" : "text-slate-400"}`}
                >
                  expand_more
                </span>
              </button>

              {/* Elevated Box Card Menu */}
              {dateDropdownOpen && (
                <div
                  className={`absolute left-0 top-12 mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-40 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md ${isDark
                      ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7]"
                      : "border-slate-200 bg-white text-slate-800 shadow-xl"
                    }`}
                  style={{
                    backgroundColor: isDark ? "#0A182B" : "#FFFFFF",
                    borderColor: isDark ? "#1E3A5F" : "#E2E8F0",
                  }}
                >
                  {dateOptions.map((opt, idx) => {
                    const isSelected = selectedDateRange === opt.value;
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
                            setSelectedDateRange(opt.value);
                            setDateDropdownOpen(false);
                            setCurrentPage(1);
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
                          <span>{opt.label}</span>
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
          </div>
        </div>

        {/* Table Container (Fixed Column Widths to Prevent Layout Shift) */}
        <div className="overflow-x-auto custom-scrollbar">
          <table
            id="auditTable"
            className="w-full text-left border-collapse min-w-[1020px] table-fixed"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "6%" }} />
            </colgroup>
            <thead>
              <tr
                className={`border-b text-[11px] font-bold uppercase tracking-wider ${isDark
                    ? "border-[#142D4C] text-[#94A3B8]"
                    : "border-slate-200 text-slate-600"
                  }`}
              >
                <th
                  className="py-3 px-4 text-center select-none"
                  style={{ width: "4%" }}
                >
                  #
                </th>
                <th
                  className="py-3 px-4 text-left select-none"
                  style={{ width: "14%" }}
                >
                  <TableSortHeader
                    title="WAKTU"
                    sortKey="waktu"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                <th
                  className="py-3 px-4 text-left select-none"
                  style={{ width: "10%" }}
                >
                  <TableSortHeader
                    title="AKSI"
                    sortKey="aksi"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                <th
                  className="py-3 px-4 text-left select-none"
                  style={{ width: "11%" }}
                >
                  <TableSortHeader
                    title="TABEL"
                    sortKey="tabel"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>

                {/* RECORD ID: RATA KIRI & TERSUSUN HORIZONTAL */}
                <th
                  className="py-3 px-4 text-left whitespace-nowrap select-none"
                  style={{ width: "12%" }}
                >
                  <TableSortHeader
                    title="Record ID"
                    sortKey="record_id"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                    className="whitespace-nowrap"
                  />
                </th>

                <th
                  className="py-3 px-4 text-left select-none"
                  style={{ width: "12%" }}
                >
                  <TableSortHeader
                    title="OLEH"
                    sortKey="oleh"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                <th
                  className="py-3 px-4 text-left select-none"
                  style={{ width: "15%" }}
                >
                  <TableSortHeader
                    title="HASH"
                    sortKey="hash"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                <th
                  className="py-3 px-4 text-left select-none"
                  style={{ width: "16%" }}
                >
                  <TableSortHeader
                    title="PREVIOUS HASH"
                    sortKey="previous_hash"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align="left"
                    isDark={isDark}
                  />
                </th>
                <th
                  className="py-3 px-4 text-center select-none"
                  style={{ width: "6%" }}
                >
                  Detail
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y text-xs ${isDark ? "divide-[#0F2238]" : "divide-slate-100"
                }`}
            >
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl animate-spin text-[#1677FF]">
                        progress_activity
                      </span>
                      <span>Memuat catatan audit log...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[36px]">search_off</span>
                      <span className="font-medium">
                        Tidak ada rekaman audit log yang sesuai dengan filter pencarian.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((item, idx) => {
                  const rowNum = startIdx + idx + 1;
                  const hashDisplay = item.hash ? item.hash.substring(0, 14) + "..." : "-";
                  const prevHashDisplay =
                    item.previous_hash === "GENESIS"
                      ? "GENESIS"
                      : item.previous_hash
                        ? item.previous_hash.substring(0, 14) + "..."
                        : "-";

                  return (
                    <tr
                      key={item.audit_id || idx}
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
                        {item.created_at}
                      </td>

                      {/* Aksi Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderAksiBadge(item.aksi)}
                      </td>

                      {/* Tabel */}
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 dark:text-[#CBD5E1] truncate" title={item.table_name}>
                        {item.table_name}
                      </td>

                      {/* Record ID: RATA KIRI SESUAI INSTRUKSI (JANGAN DITENGAHIN) */}
                      <td className="py-3 px-4 text-left font-mono text-xs text-blue-600 dark:text-[#38BDF8] font-semibold truncate">
                        {item.record_id}
                      </td>

                      {/* Oleh */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 truncate">
                          <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-[#94A3B8] shrink-0">
                            person
                          </span>
                          <span className="font-medium text-slate-800 dark:text-[#E6EDF7] truncate">
                            {item.actor_name}
                          </span>
                        </div>
                      </td>

                      {/* Hash */}
                      <td
                        className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-[#94A3B8] whitespace-nowrap truncate"
                        title={item.hash}
                      >
                        <span
                          className="cursor-pointer hover:text-blue-600 dark:hover:text-[#38BDF8] transition-colors"
                          onClick={() => setSelectedAuditDetail(item)}
                        >
                          {hashDisplay}
                        </span>
                      </td>

                      {/* Previous Hash */}
                      <td
                        className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-[#94A3B8] whitespace-nowrap truncate"
                        title={item.previous_hash}
                      >
                        <span
                          className="cursor-pointer hover:text-blue-600 dark:hover:text-[#38BDF8] transition-colors"
                          onClick={() => setSelectedAuditDetail(item)}
                        >
                          {prevHashDisplay}
                        </span>
                      </td>

                      {/* Detail Action Button */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedAuditDetail(item)}
                          title="Lihat Detail Snapshot"
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

        {/* ========================================================
             PAGINATION & BARIS PER HALAMAN
             Consistent Card Box Dropdown (Matching Devices Page)
             ======================================================== */}
        <div
          className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${isDark ? "border-[#142D4C] text-[#94A3B8]" : "border-slate-100 text-slate-500"
            }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span>Menampilkan baris</span>
            <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
              {totalItems === 0 ? "0" : `${startIdx + 1} - ${Math.min(startIdx + perPage, totalItems)}`}
            </span>
            <span>dari</span>
            <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
              {totalItems}
            </span>
            <span>data</span>

            <span className={`mx-2 ${isDark ? "text-[#1E3A5F]" : "text-slate-300"}`}>|</span>

            {/* Custom Pill Dropdown: Baris per halaman (Box Card Style) */}
            <div className="flex items-center gap-2">
              <span>Baris per halaman:</span>
              <div className="relative" ref={perPageDropdownRef}>
                <button
                  type="button"
                  onClick={() => setPerPageDropdownOpen(!perPageDropdownOpen)}
                  className={`h-8 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm ${isDark
                      ? "border-[#1E3A5F] bg-[#071426] text-[#E6EDF7] hover:border-[#1677FF]"
                      : "border-slate-300 bg-slate-50 text-slate-800 hover:border-blue-500"
                    }`}
                >
                  <span>{perPage}</span>
                  <span
                    className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${perPageDropdownOpen ? "rotate-180" : ""
                      } ${isDark ? "text-[#94A3B8]" : "text-slate-400"}`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Box Card Dropdown Menu for Rows per Page */}
                {perPageDropdownOpen && (
                  <div
                    className={`absolute left-0 bottom-full mb-1.5 w-24 rounded-xl border shadow-2xl p-1 z-40 overflow-hidden backdrop-blur-md ${isDark
                        ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7]"
                        : "border-slate-200 bg-white text-slate-800 shadow-xl"
                      }`}
                    style={{
                      backgroundColor: isDark ? "#0A182B" : "#FFFFFF",
                      borderColor: isDark ? "#1E3A5F" : "#E2E8F0",
                    }}
                  >
                    {[10, 15, 25, 50, 100].map((num) => {
                      const isSelected = perPage === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setPerPage(num);
                            setPerPageDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full px-3 py-1.5 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${isSelected
                              ? isDark
                                ? "bg-[#1677FF] text-white font-semibold"
                                : "bg-blue-600 text-white font-semibold"
                              : isDark
                                ? "hover:bg-[#122846] text-[#CBD5E1]"
                                : "hover:bg-slate-100 text-slate-700"
                            }`}
                        >
                          <span>{num}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[15px] shrink-0">
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
          </div>

          {/* Pagination Page Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
              title="Halaman Sebelumnya"
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isDark
                  ? "border-[#1E3A5F] bg-[#071426] text-[#CBD5E1] hover:bg-[#122846]"
                  : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
            >
              <span className="material-symbols-outlined text-[17px]">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (totalPages <= 5) return true;
                if (safePage <= 3) return p <= 5;
                if (safePage >= totalPages - 2) return p >= totalPages - 4;
                return Math.abs(p - safePage) <= 2;
              })
              .map((p) => {
                const isActive = p === safePage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${isActive
                        ? "bg-blue-600 dark:bg-[#1677FF] text-white shadow-md shadow-blue-500/20"
                        : isDark
                          ? "border border-[#1E3A5F] bg-[#071426] text-[#CBD5E1] hover:bg-[#122846]"
                          : "border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    {p}
                  </button>
                );
              })}

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
              title="Halaman Selanjutnya"
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isDark
                  ? "border-[#1E3A5F] bg-[#071426] text-[#CBD5E1] hover:bg-[#122846]"
                  : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
            >
              <span className="material-symbols-outlined text-[17px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
           3. DETAIL AUDIT MODAL (SNAPSHOT & HASH INSPECTION)
           ======================================================== */}
      {selectedAuditDetail && (
        <ModalPortal>
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedAuditDetail(null);
            }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          >
            <div
              className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[90vh] ${isDark
                  ? "border-[#1E3A5F] bg-[#0A182B] text-[#E6EDF7]"
                  : "border-slate-200 bg-white text-slate-800"
                }`}
            >
              {/* Modal Header */}
              <div
                className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? "border-[#142D4C] bg-[#071426]" : "border-slate-200 bg-slate-50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden select-none ${isDark
                        ? "border-[#1677FF]/40 bg-[#1677FF]/20 text-[#38BDF8]"
                        : "border-blue-200 bg-blue-50 text-blue-600"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[22px] select-none">
                      visibility
                    </span>
                  </div>
                  <div>
                    <h3
                      className={`text-base font-bold !m-0 ${isDark ? "text-white" : "text-slate-900"
                        }`}
                    >
                      Detail Audit Log #{selectedAuditDetail.audit_id}
                    </h3>
                    <p
                      className={`text-xs mt-0.5 !m-0 ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                        }`}
                    >
                      Tabel {selectedAuditDetail.table_name} • Record ID #
                      {selectedAuditDetail.record_id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAuditDetail(null)}
                  className={`transition-colors cursor-pointer p-1 bg-transparent border-none ${isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                {/* 4 Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between min-h-[66px] ${isDark
                        ? "border-[#1E3A5F] bg-[#071426]"
                        : "border-slate-200 bg-slate-50"
                      }`}
                  >
                    <span
                      className={`text-[10px] uppercase font-bold block ${isDark ? "text-[#64748B]" : "text-slate-400"
                        }`}
                    >
                      Waktu Pencatatan
                    </span>
                    <div className="flex-1 flex items-center mt-1">
                      <span
                        className={`text-xs font-semibold font-mono ${isDark ? "text-white" : "text-slate-900"
                          }`}
                      >
                        {selectedAuditDetail.created_at}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between min-h-[66px] ${isDark
                        ? "border-[#1E3A5F] bg-[#071426]"
                        : "border-slate-200 bg-slate-50"
                      }`}
                  >
                    <span
                      className={`text-[10px] uppercase font-bold block ${isDark ? "text-[#64748B]" : "text-slate-400"
                        }`}
                    >
                      Tipe Aksi &amp; Status
                    </span>
                    <div className="flex-1 flex items-center mt-1">
                      {renderAksiBadge(selectedAuditDetail.aksi)}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between min-h-[66px] ${isDark
                        ? "border-[#1E3A5F] bg-[#071426]"
                        : "border-slate-200 bg-slate-50"
                      }`}
                  >
                    <span
                      className={`text-[10px] uppercase font-bold block ${isDark ? "text-[#64748B]" : "text-slate-400"
                        }`}
                    >
                      Tabel &amp; Record Target
                    </span>
                    <div className="flex-1 flex items-center mt-1">
                      <span
                        className={`text-xs font-semibold font-mono ${isDark ? "text-[#38BDF8]" : "text-blue-600"
                          }`}
                      >
                        {selectedAuditDetail.table_name} (ID: {selectedAuditDetail.record_id})
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between min-h-[66px] ${isDark
                        ? "border-[#1E3A5F] bg-[#071426]"
                        : "border-slate-200 bg-slate-50"
                      }`}
                  >
                    <span
                      className={`text-[10px] uppercase font-bold block ${isDark ? "text-[#64748B]" : "text-slate-400"
                        }`}
                    >
                      Dilakukan Oleh
                    </span>
                    <div className="flex-1 flex items-center mt-1">
                      <span
                        className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"
                          }`}
                      >
                        {selectedAuditDetail.actor_name} ({selectedAuditDetail.actor_role})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hash Chain Details */}
                <div
                  className={`p-4 rounded-xl border space-y-3 ${isDark
                      ? "border-[#1E3A5F] bg-[#071426]"
                      : "border-slate-200 bg-slate-50"
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span
                        className={`font-bold flex items-center gap-1.5 ${isDark ? "text-[#38BDF8]" : "text-blue-600"
                          }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          fingerprint
                        </span>
                        Current SHA-256 Hash
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedAuditDetail.hash || "");
                          alert("Hash berhasil disalin ke clipboard!");
                        }}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        <span>Salin</span>
                      </button>
                    </div>
                    <p
                      className={`text-[11px] font-mono p-2.5 rounded-lg border break-all select-all !m-0 ${isDark
                          ? "bg-[#040C17] border-[#122846] text-[#A5B4FC]"
                          : "bg-slate-100 border-slate-200 text-slate-800"
                        }`}
                    >
                      {selectedAuditDetail.hash || "-"}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span
                        className={`font-bold flex items-center gap-1.5 ${isDark ? "text-[#94A3B8]" : "text-slate-600"
                          }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">link</span>
                        Previous Hash
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedAuditDetail.previous_hash || "");
                          alert("Previous hash berhasil disalin ke clipboard!");
                        }}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        <span>Salin</span>
                      </button>
                    </div>
                    <p
                      className={`text-[11px] font-mono p-2.5 rounded-lg border break-all select-all !m-0 ${isDark
                          ? "bg-[#040C17] border-[#122846] text-[#94A3B8]"
                          : "bg-slate-100 border-slate-200 text-slate-600"
                        }`}
                    >
                      {selectedAuditDetail.previous_hash || "GENESIS"}
                    </p>
                  </div>
                </div>

                {/* Data Snapshot JSON Payload */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span
                      className={`font-bold flex items-center gap-1.5 ${isDark ? "text-[#CBD5E1]" : "text-slate-700"
                        }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">data_object</span>
                      Data Snapshot / Payload
                    </span>
                    <span
                      className={`text-[11px] ${isDark ? "text-[#64748B]" : "text-slate-400"
                        }`}
                    >
                      {selectedAuditDetail.data_snapshot ? "JSON Record" : "Empty"}
                    </span>
                  </div>
                  <pre
                    className={`p-3.5 rounded-xl border text-[11px] font-mono overflow-x-auto max-h-56 custom-scrollbar leading-relaxed !m-0 ${isDark
                        ? "bg-[#040C17] border-[#142D4C] text-[#38BDF8]"
                        : "bg-slate-100 border-slate-200 text-blue-700"
                      }`}
                  >
                    {(() => {
                      if (
                        !selectedAuditDetail.data_snapshot ||
                        selectedAuditDetail.data_snapshot.trim() === ""
                      ) {
                        return "Tidak ada rekaman data snapshot untuk transaksi ini.";
                      }
                      try {
                        const parsed = JSON.parse(selectedAuditDetail.data_snapshot);
                        return JSON.stringify(parsed, null, 2);
                      } catch {
                        return selectedAuditDetail.data_snapshot;
                      }
                    })()}
                  </pre>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className={`px-6 py-3.5 border-t flex items-center justify-between ${isDark ? "border-[#142D4C] bg-[#071426]" : "border-slate-200 bg-slate-50"
                  }`}
              >
                <span className={`text-[11px] ${isDark ? "text-[#64748B]" : "text-slate-400"}`}>
                  SHA-256 Validated
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAuditDetail(null)}
                  className="px-5 py-2 rounded-xl bg-[#1677FF] hover:bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
