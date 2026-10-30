import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function OpticalAssetComposition({ data }) {
  const { isDark } = useTheme();

  const cardsCount = data?.cards_count ?? 45;
  const sfpsCount = data?.transceivers_count ?? 60;
  const totalAssets = data?.total_assets ?? (cardsCount + sfpsCount);

  const cardsPct = totalAssets > 0 ? ((cardsCount / totalAssets) * 100).toFixed(1) : "42.9";
  const sfpsPct = totalAssets > 0 ? ((sfpsCount / totalAssets) * 100).toFixed(1) : "57.1";

  return (
    <div
      className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-between relative transition-colors duration-300 ${
        isDark
          ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
          : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Komposisi Aset Optik</h2>
          <p
            className={`text-[11px] mt-0.5 ${
              isDark ? "text-[#94A3B8]" : "text-slate-500"
            }`}
          >
            Koleksi tipe modul transmisi optik aktif di rak shelf
          </p>
        </div>
        <div
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium border flex items-center gap-1.5 ${
            isDark
              ? "bg-[#071426] border-[#1E3A5F] text-[#38BDF8]"
              : "bg-slate-50 border-slate-200 text-blue-600"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow"></span>
          <span>{totalAssets} Total Unit</span>
        </div>
      </div>

      {/* Progress Bars Section */}
      <div className="py-4 space-y-4">
        {/* Item 1: Card Utama */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isDark
              ? "bg-[#071426]/50 border-[#1A2E4C] hover:border-[#1677FF]/50"
              : "bg-slate-50 border-slate-200 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1677FF]"></span>
              <span className="text-xs font-semibold">Card Utama</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold font-mono text-[#38BDF8]">
                {cardsCount}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  isDark ? "text-[#94A3B8]" : "text-slate-500"
                }`}
              >
                Unit
              </span>
            </div>
          </div>

          <div
            className={`w-full h-2 rounded-full overflow-hidden border ${
              isDark ? "bg-[#071426] border-[#1A2E4C]" : "bg-slate-200 border-slate-300"
            }`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1677FF] to-[#38BDF8] transition-all duration-700 shadow-[0_0_10px_rgba(56,189,248,0.4)]"
              style={{ width: `${cardsPct}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px]">
            <span className={isDark ? "text-[#64748B]" : "text-slate-400"}>
              Modul Transponder &amp; Matrix PSS-24x
            </span>
            <span className="font-mono font-semibold text-[#38BDF8]">
              {cardsPct}% dari total
            </span>
          </div>
        </div>

        {/* Item 2: Transceiver SFP */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isDark
              ? "bg-[#071426]/50 border-[#1A2E4C] hover:border-cyan-500/50"
              : "bg-slate-50 border-slate-200 hover:border-cyan-300"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span className="text-xs font-semibold">Transceiver SFP</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold font-mono text-cyan-400">
                {sfpsCount}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  isDark ? "text-[#94A3B8]" : "text-slate-500"
                }`}
              >
                Unit
              </span>
            </div>
          </div>

          <div
            className={`w-full h-2 rounded-full overflow-hidden border ${
              isDark ? "bg-[#071426] border-[#1A2E4C]" : "bg-slate-200 border-slate-300"
            }`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700 shadow-[0_0_10px_rgba(34,211,238,0.4)]"
              style={{ width: `${sfpsPct}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px]">
            <span className={isDark ? "text-[#64748B]" : "text-slate-400"}>
              Plug-in Optical SFP/SFP+/QSFP
            </span>
            <span className="font-mono font-semibold text-cyan-400">
              {sfpsPct}% dari total
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div
        className={`pt-3 border-t flex items-center justify-between text-[11px] ${
          isDark ? "border-[#1A2E4C] text-[#94A3B8]" : "border-slate-100 text-slate-500"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-emerald-500">
            verified
          </span>
          <span>Perhitungan Terhubung Real-Time</span>
        </div>
        <span className="font-mono text-[10px]">
          {cardsCount} Card + {sfpsCount} SFP
        </span>
      </div>
    </div>
  );
}
