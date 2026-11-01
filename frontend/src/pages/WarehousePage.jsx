import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

export default function WarehousePage({ user, searchValue, onSearchChange }) {
  const { isDark } = useTheme();

  // Active Tab: 'movements' | 'requests' | 'pivot'
  const [activeTab, setActiveTab] = useState("movements");

  // Overview Data (KPI, Dimensions, Last ETL, Filter Options)
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Tab 1: Movements OLAP state
  const [movementsData, setMovementsData] = useState(null);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movGranularity, setMovGranularity] = useState("month");
  const [movYear, setMovYear] = useState("");
  const [movLocation, setMovLocation] = useState("");
  const [movModuleType, setMovModuleType] = useState("");
  const [movJenis, setMovJenis] = useState("all");

  // Tab 2: Requests OLAP state
  const [requestsData, setRequestsData] = useState(null);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [reqYear, setReqYear] = useState("");
  const [reqStatus, setReqStatus] = useState("all");
  const [reqJenis, setReqJenis] = useState("all");

  // Tab 3: Pivot Table state
  const [pivotData, setPivotData] = useState(null);
  const [loadingPivot, setLoadingPivot] = useState(false);
  const [pivotSearch, setPivotSearch] = useState("");

  // ETL Pipeline State
  const [runningEtl, setRunningEtl] = useState(false);
  const [etlHistoryModalOpen, setEtlHistoryModalOpen] = useState(false);
  const [etlHistory, setEtlHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Chart Tooltip Hover State
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch Overview & Filter Options
  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await fetch("/warehouse/api/overview");
      if (!res.ok) throw new Error("Gagal mengambil data ringkasan Data Warehouse.");
      const data = await res.json();
      setOverview(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingOverview(false);
    }
  };

  // 2. Fetch Movements OLAP
  const fetchMovements = async () => {
    setLoadingMovements(true);
    try {
      const params = new URLSearchParams();
      if (movGranularity) params.set("granularity", movGranularity);
      if (movYear) params.set("year", movYear);
      if (movLocation) params.set("location_id", movLocation);
      if (movModuleType) params.set("module_type", movModuleType);
      if (movJenis && movJenis !== "all") params.set("jenis_perubahan", movJenis);

      const res = await fetch(`/warehouse/api/olap/movements?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil analisis mutasi modul.");
      const data = await res.json();
      setMovementsData(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingMovements(false);
    }
  };

  // 3. Fetch Requests OLAP
  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const params = new URLSearchParams();
      if (reqYear) params.set("year", reqYear);
      if (reqStatus && reqStatus !== "all") params.set("status", reqStatus);
      if (reqJenis && reqJenis !== "all") params.set("jenis_perubahan", reqJenis);

      const res = await fetch(`/warehouse/api/olap/requests?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data SLA permohonan.");
      const data = await res.json();
      setRequestsData(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingRequests(false);
    }
  };

  // 4. Fetch Pivot Matrix
  const fetchPivot = async () => {
    setLoadingPivot(true);
    try {
      const res = await fetch("/warehouse/api/olap/pivot");
      if (!res.ok) throw new Error("Gagal mengambil matriks pivot OLAP.");
      const data = await res.json();
      setPivotData(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingPivot(false);
    }
  };

  // 5. Trigger ETL Pipeline
  const handleRunEtl = async () => {
    if (runningEtl) return;
    setRunningEtl(true);
    showToast("Memulai eksekusi pipeline ETL Kimball...", "info");
    try {
      const res = await fetch("/warehouse/api/etl/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          `ETL Berhasil! ${data.records_loaded} rekor dimuat dalam ${data.duration_seconds}s (Hash: ${data.integrity_hash?.slice(0, 8)}...)`,
          "success"
        );
        fetchOverview();
        if (activeTab === "movements") fetchMovements();
        if (activeTab === "requests") fetchRequests();
        if (activeTab === "pivot") fetchPivot();
      } else {
        throw new Error(data.message || "Eksekusi ETL gagal.");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setRunningEtl(false);
    }
  };

  // 6. Fetch ETL History
  const fetchEtlHistory = async () => {
    setLoadingHistory(true);
    setEtlHistoryModalOpen(true);
    try {
      const res = await fetch("/warehouse/api/etl/history");
      if (!res.ok) throw new Error("Gagal mengambil riwayat ETL.");
      const data = await res.json();
      setEtlHistory(data.history || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === "movements") {
      fetchMovements();
    } else if (activeTab === "requests") {
      fetchRequests();
    } else if (activeTab === "pivot") {
      fetchPivot();
    }
  }, [activeTab, movGranularity, movYear, movLocation, movModuleType, movJenis, reqYear, reqStatus, reqJenis]);

  // Filtered rows for Pivot table
  const filteredPivotRows = useMemo(() => {
    if (!pivotData?.rows) return [];
    if (!pivotSearch.trim()) return pivotData.rows;
    const q = pivotSearch.toLowerCase();
    return pivotData.rows.filter((r) => r.module_type?.toLowerCase().includes(q));
  }, [pivotData, pivotSearch]);

  // Compute grand total and max for heatmap in pivot
  const { pivotColTotals, pivotMaxVal, pivotGrandTotal } = useMemo(() => {
    if (!pivotData?.rows || !pivotData?.column_headers) {
      return { pivotColTotals: {}, pivotMaxVal: 1, pivotGrandTotal: 0 };
    }
    const totals = {};
    let max = 1;
    let grand = 0;
    pivotData.column_headers.forEach((c) => {
      totals[c] = 0;
    });

    pivotData.rows.forEach((r) => {
      pivotData.column_headers.forEach((c) => {
        const val = r[c] || 0;
        totals[c] += val;
        grand += val;
        if (val > max) max = val;
      });
    });

    return { pivotColTotals: totals, pivotMaxVal: max, pivotGrandTotal: grand };
  }, [pivotData]);

  const kpi = overview?.kpi || {};
  const dimensions = overview?.dimensions || {};
  const lastEtl = overview?.last_etl || {};
  const filterOptions = overview?.filter_options || { years: [], locations: [], module_types: [] };

  return (
    <div className="flex flex-col space-y-6 w-full animate-fadeIn min-h-[calc(100vh-112px)] pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-2xl transition-all duration-300 animate-slideIn ${
            toast.type === "success"
              ? isDark
                ? "bg-[#06241E] border-emerald-500/50 text-emerald-300 shadow-emerald-950/40"
                : "bg-emerald-50 border-emerald-400 text-emerald-700"
              : toast.type === "info"
              ? isDark
                ? "bg-[#0A2540] border-[#38BDF8]/50 text-[#38BDF8] shadow-blue-950/40"
                : "bg-blue-50 border-blue-400 text-blue-700"
              : isDark
              ? "bg-[#2A0E12] border-rose-500/50 text-rose-300 shadow-rose-950/40"
              : "bg-rose-50 border-rose-400 text-rose-700"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === "success" ? "check_circle" : toast.type === "info" ? "sync" : "error"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* HERO BANNER DATA WAREHOUSE & BUSINESS INTELLIGENCE       */}
      {/* ======================================================== */}
      <div
        className={`relative overflow-hidden rounded-2xl border px-5 sm:px-6 h-[120px] min-h-[120px] max-h-[120px] flex items-center justify-between transition-all duration-300 shadow-sm !mt-0 shrink-0 ${
          isDark
            ? "border-[#1E3A5F] bg-gradient-to-r from-[#071426] via-[#0D2341] to-[#0A182B] shadow-2xl shadow-blue-950/60"
            : "border-blue-200 bg-gradient-to-r from-white via-blue-50 to-white shadow-md shadow-blue-100/80"
        }`}
        style={{ marginTop: 0, height: "120px", minHeight: "120px", maxHeight: "120px" }}
      >
        <div className="absolute -top-16 -left-16 w-80 h-80 bg-blue-500/30 dark:bg-blue-600/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-cyan-500/20 dark:bg-cyan-500/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 w-full h-full">
          {/* Kiri: Icon Box + Teks */}
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
            <div
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                isDark
                  ? "bg-gradient-to-br from-[#1677FF]/40 to-[#0A2540] border-[#38BDF8]/40 shadow-[0_0_24px_rgba(22,119,255,0.45)] text-[#38BDF8]"
                  : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm text-blue-600"
              }`}
            >
              <span className="material-symbols-outlined text-[26px] sm:text-[30px]">
                query_stats
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className={`text-xl sm:text-2xl font-bold tracking-tight !m-0 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Data Warehouse &amp; OLAP
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                    isDark
                      ? "bg-[#0A284D] text-[#38BDF8] border-[#18467A]"
                      : "bg-blue-50 text-blue-600 border-blue-200"
                  }`}
                >
                  Kimball Star Schema
                </span>
              </div>
              <p
                className={`text-xs font-normal mt-0.5 leading-relaxed !m-0 ${
                  isDark ? "text-[#94A3B8]" : "text-slate-500"
                }`}
              >
                Analisis multidimensi pergerakan modul transmisi, pemenuhan SLA, dan kubus data OLAP.
              </p>
            </div>
          </div>

          {/* Kanan: ETL Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={fetchEtlHistory}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isDark
                  ? "bg-[#071426] border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-[#38BDF8]/50"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
              title="Lihat riwayat eksekusi pipeline ETL"
            >
              <span className="material-symbols-outlined text-[17px]">history</span>
              <span className="hidden sm:inline">Riwayat ETL</span>
            </button>

            {user?.role !== "teknisi" && (
              <button
                type="button"
                onClick={handleRunEtl}
                disabled={runningEtl}
                className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-white bg-gradient-to-r from-[#1677FF] to-[#00E5FF] hover:from-[#1360cc] hover:to-[#00bcd4] shadow-lg shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                title="Jalankan ETL pipeline untuk mengekstrak data operasional ke dimensional star schema"
              >
                <span className={`material-symbols-outlined text-[17px] ${runningEtl ? "animate-spin" : ""}`}>
                  {runningEtl ? "autorenew" : "play_circle"}
                </span>
                <span>{runningEtl ? "Memproses ETL..." : "Jalankan ETL"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4 HIGH-LEVEL BI KPI CARDS                                */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Card 1: Total Fakta Tercatat */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 ${
            isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Total Rekor Fakta
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-[#38BDF8] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">table_rows</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">
              {loadingOverview ? "..." : (kpi.total_facts_recorded ?? 0).toLocaleString()}
            </span>
            <span className="text-xs text-[#94A3B8]">rekor</span>
          </div>
          <div className="mt-2 text-[11px] text-[#38BDF8] flex items-center gap-1">
            <span>{kpi.total_movements ?? 0} Mutasi</span>
            <span>•</span>
            <span>{kpi.total_requests ?? 0} Permohonan</span>
          </div>
        </div>

        {/* Card 2: Rata-Rata Umur Modul */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 ${
            isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Rata-rata Masa Pakai
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">timelapse</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
              {loadingOverview ? "..." : (kpi.avg_module_lifespan_days ?? 0)}
            </span>
            <span className="text-xs text-[#94A3B8]">hari / modul</span>
          </div>
          <div className="mt-2 text-[11px] text-[#94A3B8]">
            Siklus hidup sebelum lepas / mutasi
          </div>
        </div>

        {/* Card 3: SLA Lead Time */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 ${
            isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              SLA Lead Time Approval
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">timer</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-amber-400">
              {loadingOverview ? "..." : (kpi.avg_request_lead_time_hours ?? 0)}
            </span>
            <span className="text-xs text-[#94A3B8]">jam rata-rata</span>
          </div>
          <div className="mt-2 text-[11px] text-[#94A3B8]">
            Pengajuan hingga verifikasi TIF
          </div>
        </div>

        {/* Card 4: Acceptance Rate */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 ${
            isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Acceptance Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-indigo-400">
              {loadingOverview ? "..." : `${kpi.request_acceptance_rate ?? 100}%`}
            </span>
            <span className="text-xs text-[#94A3B8]">disetujui</span>
          </div>
          <div className="mt-2 text-[11px] text-[#94A3B8]">
            Rasio kelayakan permohonan modul
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DIMENSION COVERAGE & LAST ETL STATUS BAR                 */}
      {/* ======================================================== */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
          isDark ? "bg-[#0A182B] border-[#1A2E4C]" : "bg-slate-50 border-slate-200"
        }`}
      >
        {/* Dimensi Coverage */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <span className="text-[#94A3B8] font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#38BDF8]">view_in_ar</span>
            Dimensi Star Schema:
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#071426] border border-[#1E3A5F] text-[#E6EDF7] font-mono">
            <strong>{dimensions.dates ?? 0}</strong> Tanggal
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#071426] border border-[#1E3A5F] text-[#E6EDF7] font-mono">
            <strong>{dimensions.devices ?? 0}</strong> Perangkat
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#071426] border border-[#1E3A5F] text-[#E6EDF7] font-mono">
            <strong>{dimensions.modules ?? 0}</strong> Modul
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#071426] border border-[#1E3A5F] text-[#E6EDF7] font-mono">
            <strong>{dimensions.locations ?? 0}</strong> Lokasi
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#071426] border border-[#1E3A5F] text-[#E6EDF7] font-mono">
            <strong>{dimensions.users ?? 0}</strong> User
          </span>
        </div>

        {/* Last ETL Telemetry */}
        <div className="flex items-center gap-2 text-xs text-[#94A3B8] flex-wrap font-mono">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                lastEtl.status === "BERHASIL" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            ETL Terakhir:
          </span>
          <span className="text-white font-semibold">{lastEtl.run_timestamp || "-"}</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-[#38BDF8]">{lastEtl.records_loaded || 0} dimuat ({lastEtl.duration_seconds || 0}s)</span>
          {lastEtl.integrity_hash && lastEtl.integrity_hash !== "-" && (
            <span
              className="px-1.5 py-0.5 rounded bg-black/40 border border-slate-700 text-[10px] text-slate-400"
              title={`Integritas SHA-256: ${lastEtl.integrity_hash}`}
            >
              SHA: {lastEtl.integrity_hash.slice(0, 8)}...
            </span>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* NAVIGATION TABS                                          */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 border-b border-[#1E3A5F] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("movements")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "movements"
              ? "bg-[#1677FF] text-white shadow-lg shadow-blue-500/25"
              : isDark
              ? "text-[#94A3B8] hover:text-white hover:bg-[#0D1F36]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">sync_alt</span>
          <span>Data Mart 1: Mutasi &amp; Siklus Hidup Modul</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "requests"
              ? "bg-[#1677FF] text-white shadow-lg shadow-blue-500/25"
              : isDark
              ? "text-[#94A3B8] hover:text-white hover:bg-[#0D1F36]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">pending_actions</span>
          <span>Data Mart 2: Pemenuhan SLA Permohonan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pivot")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "pivot"
              ? "bg-[#1677FF] text-white shadow-lg shadow-blue-500/25"
              : isDark
              ? "text-[#94A3B8] hover:text-white hover:bg-[#0D1F36]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">pivot_table_chart</span>
          <span>Matriks Pivot OLAP</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DATA MART 1 - ANALISIS MUTASI & SIKLUS HIDUP      */}
      {/* ======================================================== */}
      {activeTab === "movements" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Multidimensional Filter Toolbar (Slice & Dice + Roll-up/Drill-down) */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A2E4C] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#38BDF8] text-[20px]">filter_alt</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Filter Multidimensi &amp; Granularitas Waktu
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <span>Tingkat Waktu:</span>
                {["month", "quarter", "year", "day"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setMovGranularity(g)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase transition-all ${
                      movGranularity === g
                        ? "bg-[#1677FF] text-white shadow-sm"
                        : isDark
                        ? "bg-[#071426] text-[#94A3B8] hover:text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {g === "month" ? "Bulan" : g === "quarter" ? "Triwulan" : g === "year" ? "Tahun" : "Hari"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Filter Tahun */}
              <div>
                <label className="block text-[11px] font-medium text-[#94A3B8] mb-1">Dimensi Tahun</label>
                <select
                  value={movYear}
                  onChange={(e) => setMovYear(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                    isDark ? "bg-[#071426] border-[#1E3A5F] text-white" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  <option value="">Semua Tahun</option>
                  {filterOptions.years?.map((y) => (
                    <option key={y} value={y}>Tahun {y}</option>
                  ))}
                </select>
              </div>

              {/* Filter Lokasi */}
              <div>
                <label className="block text-[11px] font-medium text-[#94A3B8] mb-1">Dimensi Lokasi STO</label>
                <select
                  value={movLocation}
                  onChange={(e) => setMovLocation(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                    isDark ? "bg-[#071426] border-[#1E3A5F] text-white" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  <option value="">Semua Lokasi STO</option>
                  {filterOptions.locations?.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter Tipe Modul */}
              <div>
                <label className="block text-[11px] font-medium text-[#94A3B8] mb-1">Dimensi Tipe Modul</label>
                <select
                  value={movModuleType}
                  onChange={(e) => setMovModuleType(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                    isDark ? "bg-[#071426] border-[#1E3A5F] text-white" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  <option value="">Semua Tipe Modul</option>
                  {filterOptions.module_types?.map((mt) => (
                    <option key={mt} value={mt}>{mt}</option>
                  ))}
                </select>
              </div>

              {/* Filter Jenis Perubahan */}
              <div>
                <label className="block text-[11px] font-medium text-[#94A3B8] mb-1">Jenis Aktivitas</label>
                <select
                  value={movJenis}
                  onChange={(e) => setMovJenis(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                    isDark ? "bg-[#071426] border-[#1E3A5F] text-white" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  <option value="all">Semua Jenis (Pasang, Pindah, Lepas)</option>
                  <option value="pasang">Hanya Pasang</option>
                  <option value="pindah">Hanya Pindah</option>
                  <option value="lepas">Hanya Lepas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Breakdown Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className={`p-3 rounded-xl border ${isDark ? "bg-[#071426] border-[#1E3A5F]" : "bg-slate-100"}`}>
              <span className="text-[#94A3B8] block text-[10px] uppercase">Total Pergerakan</span>
              <span className="text-lg font-bold text-white">
                {movementsData?.total_records ?? 0}
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? "bg-[#071426] border-emerald-500/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
              <span className="block text-[10px] uppercase">Pemasangan (Pasang)</span>
              <span className="text-lg font-bold">
                {movementsData?.breakdown_jenis?.pasang ?? 0}
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? "bg-[#071426] border-blue-500/30 text-[#38BDF8]" : "bg-blue-50 text-blue-700"}`}>
              <span className="block text-[10px] uppercase">Relokasi (Pindah)</span>
              <span className="text-lg font-bold">
                {movementsData?.breakdown_jenis?.pindah ?? 0}
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? "bg-[#071426] border-rose-500/30 text-rose-400" : "bg-rose-50 text-rose-700"}`}>
              <span className="block text-[10px] uppercase">Pelepasan (Lepas)</span>
              <span className="text-lg font-bold">
                {movementsData?.breakdown_jenis?.lepas ?? 0}
              </span>
            </div>
          </div>

          {/* Interactive Chart Series */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Tren Pergerakan Modul Berdasarkan {movGranularity.toUpperCase()}
                </h3>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  Agregasi deret waktu roll-up/drill-down dengan indikator durasi pakai
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Pasang
                </span>
                <span className="flex items-center gap-1.5 text-[#38BDF8]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]" /> Pindah
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Lepas
                </span>
              </div>
            </div>

            {loadingMovements ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#94A3B8]">
                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                Mengagregasi data OLAP kubus...
              </div>
            ) : !movementsData?.series || movementsData.series.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-xs text-[#94A3B8]">
                <span className="material-symbols-outlined text-[32px] text-slate-600 mb-1">query_stats</span>
                <span>Tidak ada data mutasi yang cocok dengan kombinasi filter ini.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* SVG Grouped Column Chart */}
                <div className="relative w-full h-64 flex items-end gap-2 sm:gap-4 pt-6 pb-6 px-2 border-b border-[#1A2E4C] overflow-x-auto">
                  {(() => {
                    const series = movementsData.series;
                    const maxVal = Math.max(...series.map((s) => s.total_movements || 1), 5);

                    return series.map((s, idx) => {
                      const totalH = (s.total_movements / maxVal) * 100;
                      const pasangH = (s.pasang / maxVal) * 100;
                      const pindahH = (s.pindah / maxVal) * 100;
                      const lepasH = (s.lepas / maxVal) * 100;

                      return (
                        <div
                          key={idx}
                          className="flex-1 min-w-[50px] max-w-[80px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white border border-[#1E3A5F] px-2.5 py-1 rounded-lg text-[10px] pointer-events-none whitespace-nowrap z-20 shadow-xl">
                            <p className="font-bold">{s.period}</p>
                            <p className="text-emerald-300">Pasang: {s.pasang}</p>
                            <p className="text-blue-300">Pindah: {s.pindah}</p>
                            <p className="text-rose-300">Lepas: {s.lepas}</p>
                            <p className="text-slate-400">Total: {s.total_movements} | Avg: {s.avg_duration} hari</p>
                          </div>

                          {/* Bar Columns Container */}
                          <div className="w-full h-full flex items-end justify-center gap-1">
                            {/* Pasang Bar */}
                            <div
                              className="w-2.5 sm:w-3.5 bg-emerald-400 rounded-t-sm transition-all duration-300 hover:brightness-125"
                              style={{ height: `${Math.max(pasangH, s.pasang > 0 ? 4 : 0)}%` }}
                              title={`Pasang: ${s.pasang}`}
                            />
                            {/* Pindah Bar */}
                            <div
                              className="w-2.5 sm:w-3.5 bg-[#38BDF8] rounded-t-sm transition-all duration-300 hover:brightness-125"
                              style={{ height: `${Math.max(pindahH, s.pindah > 0 ? 4 : 0)}%` }}
                              title={`Pindah: ${s.pindah}`}
                            />
                            {/* Lepas Bar */}
                            <div
                              className="w-2.5 sm:w-3.5 bg-rose-400 rounded-t-sm transition-all duration-300 hover:brightness-125"
                              style={{ height: `${Math.max(lepasH, s.lepas > 0 ? 4 : 0)}%` }}
                              title={`Lepas: ${s.lepas}`}
                            />
                          </div>

                          {/* Period Label */}
                          <span className="text-[10px] font-mono text-[#94A3B8] mt-2 truncate w-full text-center">
                            {s.period}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Table Data View */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#1A2E4C] text-[11px] font-semibold uppercase text-[#94A3B8]">
                        <th className="py-2.5 px-3">Periode</th>
                        <th className="py-2.5 px-3 text-right">Pasang</th>
                        <th className="py-2.5 px-3 text-right">Pindah</th>
                        <th className="py-2.5 px-3 text-right">Lepas</th>
                        <th className="py-2.5 px-3 text-right font-bold text-white">Total Mutasi</th>
                        <th className="py-2.5 px-3 text-right">Rata-rata Masa Pakai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A2E4C]/50 font-mono">
                      {movementsData.series.map((s, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 font-sans font-semibold text-white">{s.period}</td>
                          <td className="py-2 px-3 text-right text-emerald-400 font-semibold">{s.pasang}</td>
                          <td className="py-2 px-3 text-right text-[#38BDF8] font-semibold">{s.pindah}</td>
                          <td className="py-2 px-3 text-right text-rose-400 font-semibold">{s.lepas}</td>
                          <td className="py-2 px-3 text-right text-white font-bold">{s.total_movements}</td>
                          <td className="py-2 px-3 text-right text-[#94A3B8]">{s.avg_duration} hari</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DATA MART 2 - ANALISIS PEMENUHAN PERMOHONAN & SLA */}
      {/* ======================================================== */}
      {activeTab === "requests" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filter Toolbar */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A2E4C] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[20px]">tune</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Filter Analisis SLA &amp; Status Persetujuan
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#94A3B8] mb-1">Tahun Pengajuan</label>
                <select
                  value={reqYear}
                  onChange={(e) => setReqYear(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                    isDark ? "bg-[#071426] border-[#1E3A5F] text-white" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  <option value="">Semua Tahun</option>
                  {filterOptions.years?.map((y) => (
                    <option key={y} value={y}>Tahun {y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#94A3B8] mb-1">Status Permohonan</label>
                <select
                  value={reqStatus}
                  onChange={(e) => setReqStatus(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                    isDark ? "bg-[#071426] border-[#1E3A5F] text-white" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  <option value="all">Semua Status (Disetujui, Ditolak, Pending)</option>
                  <option value="APPROVED">Hanya Disetujui (APPROVED)</option>
                  <option value="REJECTED">Hanya Ditolak (REJECTED)</option>
                  <option value="PENDING">Menunggu Verifikasi (PENDING)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#94A3B8] mb-1">Jenis Aktivitas</label>
                <select
                  value={reqJenis}
                  onChange={(e) => setReqJenis(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                    isDark ? "bg-[#071426] border-[#1E3A5F] text-white" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  <option value="all">Semua Jenis Perubahan</option>
                  <option value="pasang">Pasang</option>
                  <option value="pindah">Pindah</option>
                  <option value="lepas">Lepas</option>
                </select>
              </div>
            </div>
          </div>

          {/* SLA Performance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
              }`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
                Total Permohonan
              </span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">
                {requestsData?.total_requests ?? 0}
              </span>
              <p className="text-[11px] text-[#94A3B8] mt-1">Permohonan masuk dalam filter</p>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
              }`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
                Rata-rata Lead Time Pemrosesan
              </span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                {requestsData?.avg_lead_time_hours ?? 0} jam
              </span>
              <p className="text-[11px] text-[#94A3B8] mt-1">Waktu dari pengajuan ke approval TIF</p>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
              }`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
                Distribusi Keputusan
              </span>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold">Disetujui:</span>
                  <span className="font-mono text-white">
                    {requestsData?.status_breakdown?.APPROVED ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-rose-400 font-semibold">Ditolak:</span>
                  <span className="font-mono text-white">
                    {requestsData?.status_breakdown?.REJECTED ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-semibold">Pending:</span>
                  <span className="font-mono text-white">
                    {requestsData?.status_breakdown?.PENDING ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Tren Bulanan Pemenuhan Permohonan Modul
                </h3>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  Rasio persetujuan vs penolakan permohonan per bulan
                </p>
              </div>
            </div>

            {loadingRequests ? (
              <div className="h-48 flex items-center justify-center text-xs text-[#94A3B8]">
                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                Memuat data SLA...
              </div>
            ) : !requestsData?.monthly_trend || requestsData.monthly_trend.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-[#94A3B8]">
                Tidak ada data tren permohonan.
              </div>
            ) : (
              <div className="space-y-3">
                {requestsData.monthly_trend.map((m, idx) => {
                  const total = m.total || 1;
                  const approvedPct = Math.round((m.approved / total) * 100);
                  const rejectedPct = Math.round((m.rejected / total) * 100);
                  const pendingPct = 100 - approvedPct - rejectedPct;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border ${
                        isDark ? "bg-[#071426] border-[#1A2E4C]" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 text-xs">
                        <span className="font-bold text-white">{m.period}</span>
                        <span className="text-xs font-mono text-[#94A3B8]">
                          {m.total} total ({m.approved} disetujui, {m.rejected} ditolak, {m.pending} pending)
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full overflow-hidden bg-slate-800 flex">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${approvedPct}%` }}
                          title={`Disetujui: ${m.approved} (${approvedPct}%)`}
                        />
                        <div
                          className="bg-rose-500 h-full transition-all"
                          style={{ width: `${rejectedPct}%` }}
                          title={`Ditolak: ${m.rejected} (${rejectedPct}%)`}
                        />
                        <div
                          className="bg-amber-500 h-full transition-all"
                          style={{ width: `${Math.max(0, pendingPct)}%` }}
                          title={`Pending: ${m.pending}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MATRIKS PIVOT OLAP (CROSS-TABULATION)             */}
      {/* ======================================================== */}
      {activeTab === "pivot" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Search & Heatmap Legend */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
            }`}
          >
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#94A3B8]">
                search
              </span>
              <input
                type="text"
                value={pivotSearch}
                onChange={(e) => setPivotSearch(e.target.value)}
                placeholder="Cari tipe modul..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                  isDark
                    ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-slate-500 focus:border-[#38BDF8]"
                    : "bg-slate-50 border-slate-300 text-slate-900"
                }`}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
              <span>Kerapatan Mutasi (Heatmap):</span>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-[#1677FF]/20 border border-[#1677FF]/40" title="Rendah" />
                <span className="w-3.5 h-3.5 rounded bg-[#1677FF]/50 border border-[#1677FF]/60" title="Sedang" />
                <span className="w-3.5 h-3.5 rounded bg-[#00E5FF]/80 text-black font-bold text-[9px] flex items-center justify-center" title="Tinggi">
                  ▲
                </span>
              </div>
              <span className="font-mono text-white">Grand Total: {pivotGrandTotal}</span>
            </div>
          </div>

          {/* Pivot Matrix Table */}
          <div
            className={`p-5 rounded-2xl border overflow-hidden transition-all ${
              isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
            }`}
          >
            <div className="mb-3">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Matriks Sebaran Mutasi: Tipe Modul (Baris) × Tipe Perangkat (Kolom)
              </h3>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                Cross-tabulation OLAP 2D agregasi frekuensi perpindahan dan alokasi perangkat
              </p>
            </div>

            {loadingPivot ? (
              <div className="h-48 flex items-center justify-center text-xs text-[#94A3B8]">
                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                Menyusun matriks cross-tabulation...
              </div>
            ) : !pivotData?.column_headers || pivotData.column_headers.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-[#94A3B8]">
                Belum ada data pergerakan di dimensi ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#1A2E4C] text-[11px] font-semibold uppercase text-[#94A3B8]">
                      <th className="py-2.5 px-3 bg-[#071426]/70 sticky left-0 z-10">Tipe Modul</th>
                      {pivotData.column_headers.map((col) => (
                        <th key={col} className="py-2.5 px-3 text-right whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-right bg-[#1677FF]/20 text-[#38BDF8] font-bold">
                        Total Baris
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2E4C]/50 font-mono">
                    {filteredPivotRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-2 px-3 font-sans font-semibold text-white bg-[#071426]/70 sticky left-0 z-10 whitespace-nowrap">
                          {r.module_type}
                        </td>
                        {pivotData.column_headers.map((col) => {
                          const val = r[col] || 0;
                          const ratio = pivotMaxVal > 0 ? val / pivotMaxVal : 0;
                          const bgStyle =
                            val > 0
                              ? {
                                  backgroundColor: `rgba(22, 119, 255, ${Math.max(0.15, ratio * 0.75)})`,
                                  color: ratio > 0.5 ? "#00E5FF" : "#E6EDF7",
                                }
                              : {};

                          return (
                            <td
                              key={col}
                              className="py-2 px-3 text-right transition-colors"
                              style={bgStyle}
                            >
                              {val > 0 ? val : <span className="text-slate-600">-</span>}
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-right font-bold text-[#38BDF8] bg-[#1677FF]/10">
                          {r._total || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#1E3A5F] font-bold font-mono text-white bg-[#071426]/80">
                      <td className="py-2.5 px-3 font-sans sticky left-0 z-10">Total Kolom</td>
                      {pivotData.column_headers.map((col) => (
                        <td key={col} className="py-2.5 px-3 text-right text-emerald-400">
                          {pivotColTotals[col] || 0}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right text-[#00E5FF] text-sm bg-[#1677FF]/30">
                        {pivotGrandTotal}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RIWAYAT EKSEKUSI ETL & AUDIT INTEGRITAS           */}
      {/* ======================================================== */}
      {etlHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-4xl max-h-[85vh] rounded-2xl border flex flex-col overflow-hidden shadow-2xl ${
              isDark ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7]" : "bg-white border-slate-300"
            }`}
          >
            <div className="p-4 sm:p-5 border-b border-[#1A2E4C] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-[#38BDF8] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">history_edu</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Riwayat Eksekusi Pipeline ETL</h3>
                  <p className="text-xs text-[#94A3B8]">Audit log validasi kualitas data dan SHA-256 hash integritas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEtlHistoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
              {loadingHistory ? (
                <div className="py-12 flex items-center justify-center text-xs text-[#94A3B8]">
                  <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                  Memuat riwayat log ETL...
                </div>
              ) : etlHistory.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#94A3B8]">
                  Belum ada log eksekusi ETL tercatat.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#1A2E4C] text-[11px] font-semibold uppercase text-[#94A3B8]">
                        <th className="py-2.5 px-3">Waktu Run</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Ekstraksi</th>
                        <th className="py-2.5 px-3 text-right">Dimuat</th>
                        <th className="py-2.5 px-3 text-right">Durasi</th>
                        <th className="py-2.5 px-3">Hash Integritas (SHA-256)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A2E4C]/50 font-mono">
                      {etlHistory.map((item) => (
                        <tr key={item.etl_id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-3 text-white whitespace-nowrap">{item.timestamp}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                item.status === "BERHASIL"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#94A3B8]">{item.records_extracted}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400">{item.records_loaded}</td>
                          <td className="py-2.5 px-3 text-right text-[#38BDF8]">{item.duration_seconds}s</td>
                          <td className="py-2.5 px-3">
                            <span
                              className="font-mono text-[11px] text-slate-400 bg-black/40 px-2 py-1 rounded border border-slate-700/60 block truncate max-w-[200px]"
                              title={item.integrity_hash}
                            >
                              {item.integrity_hash}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#1A2E4C] flex justify-end">
              <button
                type="button"
                onClick={() => setEtlHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
