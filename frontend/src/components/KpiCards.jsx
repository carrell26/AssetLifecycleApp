import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function KpiCards({ kpi }) {
  const { isDark } = useTheme();

  const totalDevices = kpi?.total_devices ?? 0;
  const totalLocations = kpi?.total_locations ?? 2;
  const modulTerpasang = kpi?.modul_terpasang ?? 0;
  const totalMutasi = kpi?.total_mutasi ?? 0;
  const activePercentage = kpi?.active_percentage ?? 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Total Perangkat */}
      <div
        className={`rounded-2xl p-4 border shadow-sm relative overflow-hidden flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
          isDark
            ? "bg-[#0D1F36] border-[#1E3A5F] hover:border-[#1677FF] hover:shadow-[0_10px_25px_rgba(22,119,255,0.25)] text-[#E6EDF7]"
            : "bg-white border-slate-200 hover:border-blue-500 hover:shadow-[0_10px_25px_rgba(22,119,255,0.15)] text-slate-900"
        }`}
      >
        <div
          className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity opacity-40 group-hover:opacity-80 ${
            isDark ? "bg-[#1677FF]/30" : "bg-[#1677FF]/15"
          }`}
        ></div>
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full pulse-glow ${
                  isDark ? "bg-[#1677FF]" : "bg-blue-500"
                }`}
              ></span>
              <span
                className={`text-[11px] font-semibold tracking-wide uppercase ${
                  isDark ? "text-[#94A3B8]" : "text-slate-500"
                }`}
              >
                Total Perangkat
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight leading-none mt-1 flex items-baseline gap-1.5">
              <span>{totalDevices}</span>
              <span
                className={`text-[11px] font-normal ${
                  isDark ? "text-[#38BDF8]" : "text-blue-600"
                }`}
              >
                Unit
              </span>
            </div>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm border transition-all duration-300 ${
              isDark
                ? "bg-[#1677FF]/15 border-[#1677FF]/40 text-[#38BDF8] group-hover:border-[#38BDF8]"
                : "bg-blue-50 border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[23px]">router</span>
          </div>
        </div>

        <div
          className={`mt-3 pt-2.5 border-t space-y-2 relative z-10 ${
            isDark ? "border-[#1A2E4C]" : "border-slate-100"
          }`}
        >
          <div>
            <div
              className={`flex items-center justify-between text-[10px] mb-1 font-mono ${
                isDark ? "text-[#94A3B8]" : "text-slate-500"
              }`}
            >
              <span>Kapasitas Rak</span>
              <span
                className={`font-semibold ${
                  isDark ? "text-[#38BDF8]" : "text-blue-600"
                }`}
              >
                100%
              </span>
            </div>
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden border ${
                isDark
                  ? "bg-[#071426] border-[#1A2E4C]"
                  : "bg-slate-100 border-slate-200"
              }`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDark
                    ? "bg-gradient-to-r from-[#1677FF] to-[#38BDF8]"
                    : "bg-gradient-to-r from-[#1677FF] to-blue-400"
                }`}
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] text-emerald-600 font-semibold">
              <span className="material-symbols-outlined text-[13px]">trending_up</span>
              <span>Aktif</span>
            </div>
            <span
              className={`text-[10px] font-mono ${
                isDark ? "text-[#64748B]" : "text-slate-400"
              }`}
            >
              Transmisi PSS-24x
            </span>
          </div>
        </div>
      </div>

      {/* KPI 2: Titik Lokasi (Warna Ungu/Purple Unik) */}
      <div
        className={`rounded-2xl p-4 border shadow-sm relative overflow-hidden flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
          isDark
            ? "bg-[#0D1F36] border-[#1E3A5F] hover:border-purple-500/70 hover:shadow-[0_10px_25px_rgba(168,85,247,0.25)] text-[#E6EDF7]"
            : "bg-white border-slate-200 hover:border-purple-500 hover:shadow-[0_10px_25px_rgba(168,85,247,0.18)] text-slate-900"
        }`}
      >
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity bg-purple-500/15 opacity-40 group-hover:opacity-80"></div>
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 pulse-glow"></span>
              <span
                className={`text-[11px] font-semibold tracking-wide uppercase ${
                  isDark ? "text-[#94A3B8]" : "text-slate-500"
                }`}
              >
                Titik Lokasi
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight leading-none mt-1 flex items-baseline gap-1.5">
              <span>{totalLocations}</span>
              <span className={`text-[11px] font-normal ${isDark ? "text-[#C084FC]" : "text-purple-600"}`}>
                Lokasi
              </span>
            </div>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm border transition-all duration-300 ${
              isDark
                ? "bg-purple-500/15 border-purple-500/30 text-purple-400 group-hover:border-purple-400"
                : "bg-purple-50 border-purple-200 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[23px]">location_on</span>
          </div>
        </div>

        <div
          className={`mt-3 pt-2.5 border-t space-y-2 relative z-10 ${
            isDark ? "border-[#1A2E4C]" : "border-slate-100"
          }`}
        >
          <div>
            <div
              className={`flex items-center justify-between text-[10px] mb-1 font-mono ${
                isDark ? "text-[#94A3B8]" : "text-slate-500"
              }`}
            >
              <span>Konektivitas STO</span>
              <span className="text-purple-500 font-semibold">100% Aktif</span>
            </div>
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden border ${
                isDark
                  ? "bg-[#071426] border-[#1A2E4C]"
                  : "bg-slate-100 border-slate-200"
              }`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-500"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isDark
                ? "bg-purple-500/15 border border-purple-500/30 text-purple-300"
                : "bg-purple-50 border border-purple-200 text-purple-700"
            }`}>
              <span className="material-symbols-outlined text-[13px]">hub</span>
              <span>Kota Palu</span>
            </div>
            <span
              className={`text-[10px] font-mono ${
                isDark ? "text-[#64748B]" : "text-slate-400"
              }`}
            >
              STO Palu 1 &amp; 2
            </span>
          </div>
        </div>
      </div>

      {/* KPI 3: Modul Terpasang */}
      <div
        className={`rounded-2xl p-4 border shadow-sm relative overflow-hidden flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
          isDark
            ? "bg-[#0D1F36] border-[#1E3A5F] hover:border-emerald-500/70 hover:shadow-[0_10px_25px_rgba(16,185,129,0.2)] text-[#E6EDF7]"
            : "bg-white border-slate-200 hover:border-emerald-500 hover:shadow-[0_10px_25px_rgba(16,185,129,0.15)] text-slate-900"
        }`}
      >
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity bg-emerald-500/15 opacity-40 group-hover:opacity-80"></div>
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-glow"></span>
              <span
                className={`text-[11px] font-semibold tracking-wide uppercase ${
                  isDark ? "text-[#94A3B8]" : "text-slate-500"
                }`}
              >
                Modul Terpasang
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight leading-none mt-1 flex items-baseline gap-1.5">
              <span>{modulTerpasang}</span>
              <span className="text-[11px] font-normal text-emerald-500">Aktif</span>
            </div>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm border transition-all duration-300 ${
              isDark
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 group-hover:border-emerald-400"
                : "bg-emerald-50 border-emerald-200 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[23px]">check_circle</span>
          </div>
        </div>

        <div
          className={`mt-3 pt-2.5 border-t space-y-2 relative z-10 ${
            isDark ? "border-[#1A2E4C]" : "border-slate-100"
          }`}
        >
          <div>
            <div
              className={`flex items-center justify-between text-[10px] mb-1 font-mono ${
                isDark ? "text-[#94A3B8]" : "text-slate-500"
              }`}
            >
              <span>Operasional</span>
              <span className="text-emerald-500 font-semibold">{activePercentage}% Aktif</span>
            </div>
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden border ${
                isDark
                  ? "bg-[#071426] border-[#1A2E4C]"
                  : "bg-slate-100 border-slate-200"
              }`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${Math.min(activePercentage, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] text-emerald-600 font-semibold">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              <span>100% Terverifikasi</span>
            </div>
            <span
              className={`text-[10px] font-mono ${
                isDark ? "text-[#64748B]" : "text-slate-400"
              }`}
            >
              Real-time
            </span>
          </div>
        </div>
      </div>

      {/* KPI 4: Total Mutasi (30 Hari Terakhir) */}
      <div
        className={`rounded-2xl p-4 border shadow-sm relative overflow-hidden flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
          isDark
            ? "bg-[#0D1F36] border-[#1E3A5F] hover:border-amber-500/70 hover:shadow-[0_10px_25px_rgba(245,158,11,0.2)] text-[#E6EDF7]"
            : "bg-white border-slate-200 hover:border-amber-500 hover:shadow-[0_10px_25px_rgba(245,158,11,0.15)] text-slate-900"
        }`}
      >
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity bg-amber-500/15 opacity-40 group-hover:opacity-80"></div>
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 pulse-glow"></span>
              <span
                className={`text-[11px] font-semibold tracking-wide uppercase ${
                  isDark ? "text-[#94A3B8]" : "text-slate-500"
                }`}
              >
                Total Mutasi
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight leading-none mt-1 flex items-baseline gap-1.5">
              <span>{totalMutasi}</span>
              <span className="text-[11px] font-normal text-amber-500">Aktivitas</span>
            </div>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm border transition-all duration-300 ${
              isDark
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400 group-hover:border-amber-400"
                : "bg-amber-50 border-amber-200 text-amber-600 group-hover:bg-amber-500 group-hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[23px]">swap_horiz</span>
          </div>
        </div>

        <div
          className={`mt-3 pt-2.5 border-t space-y-2 relative z-10 ${
            isDark ? "border-[#1A2E4C]" : "border-slate-100"
          }`}
        >
          <div>
            <div
              className={`flex items-center justify-between text-[10px] mb-1 font-mono ${
                isDark ? "text-[#94A3B8]" : "text-slate-500"
              }`}
            >
              <span>Periode Aktivitas</span>
              <span className="text-amber-500 font-semibold">
                30 Hari Terakhir
              </span>
            </div>
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden border ${
                isDark
                  ? "bg-[#071426] border-[#1A2E4C]"
                  : "bg-slate-100 border-slate-200"
              }`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                style={{ width: `${Math.min(totalMutasi * 10, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] text-amber-600 font-semibold">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              <span>Ledger Tercatat</span>
            </div>
            <span
              className={`text-[10px] font-mono ${
                isDark ? "text-[#64748B]" : "text-slate-400"
              }`}
            >
              {totalMutasi > 0 ? `${totalMutasi} Mutasi` : "0 Mutasi"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
