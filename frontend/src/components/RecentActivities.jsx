import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";

const CATEGORY_ICONS = {
  request: "assignment",
  movement: "sync_alt",
  device: "router",
  audit: "verified_user",
  system: "info",
};

export default function RecentActivities({ activities }) {
  const { isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const list = activities && activities.length > 0 ? activities : [];
  const displayItems = expanded ? list : list.slice(0, 5);

  const getThemeStyles = (colorType) => {
    switch (colorType) {
      case "amber":
        return {
          iconClass: isDark
            ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
            : "bg-amber-50 border-amber-200 text-amber-600",
          badgeClass: isDark
            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
            : "bg-amber-50 text-amber-700 border border-amber-200",
          dotColor: "bg-amber-400",
        };
      case "emerald":
        return {
          iconClass: isDark
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            : "bg-emerald-50 border-emerald-200 text-emerald-600",
          badgeClass: isDark
            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200",
          dotColor: "bg-emerald-400",
        };
      case "rose":
        return {
          iconClass: isDark
            ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
            : "bg-rose-50 border-rose-200 text-rose-600",
          badgeClass: isDark
            ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
            : "bg-rose-50 text-rose-700 border border-rose-200",
          dotColor: "bg-rose-400",
        };
      case "purple":
        return {
          iconClass: isDark
            ? "bg-purple-500/15 border-purple-500/30 text-purple-400"
            : "bg-purple-50 border-purple-200 text-purple-600",
          badgeClass: isDark
            ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
            : "bg-purple-50 text-purple-700 border border-purple-200",
          dotColor: "bg-purple-400",
        };
      case "blue":
      default:
        return {
          iconClass: isDark
            ? "bg-[#1677FF]/15 border-[#1677FF]/30 text-[#38BDF8]"
            : "bg-blue-50 border-blue-200 text-blue-600",
          badgeClass: isDark
            ? "bg-[#1677FF]/15 text-[#38BDF8] border border-[#1677FF]/30"
            : "bg-blue-50 text-blue-700 border border-blue-200",
          dotColor: isDark ? "bg-[#38BDF8]" : "bg-blue-500",
        };
    }
  };

  const getSpecificIcon = (act) => {
    const title = (act.title || "").toLowerCase();
    if (title.includes("kerusakan") || title.includes("rusak")) return "warning";
    if (title.includes("perangkat")) return "router";
    if (title.includes("import")) return "upload_file";
    if (title.includes("audit") || title.includes("integritas") || title.includes("ledger")) return "verified_user";
    if (title.includes("pemasangan")) return "build";
    if (title.includes("mutasi")) return "sync_alt";
    if (title.includes("pengajuan")) return "assignment";
    return CATEGORY_ICONS[act.category] || "info";
  };

  return (
    <div
      className={`rounded-2xl border shadow-sm p-5 transition-colors duration-300 overflow-hidden ${
        isDark
          ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
          : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      <div
        className={`flex items-center justify-between pb-3 border-b ${
          isDark ? "border-[#1A2E4C]" : "border-slate-100"
        }`}
      >
        <div>
          <h2 className="text-sm font-semibold">Aktivitas Terbaru</h2>
          <p
            className={`text-[11px] mt-0.5 ${
              isDark ? "text-[#94A3B8]" : "text-slate-500"
            }`}
          >
            Log pembaruan sistem dan mutasi modul secara real-time
          </p>
        </div>
        {list.length > 5 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
              isDark
                ? "text-[#1677FF] hover:text-[#38BDF8]"
                : "text-blue-600 hover:text-blue-700"
            }`}
          >
            <span>{expanded ? "Tampilkan Lebih Sedikit" : "Lihat Semua"}</span>
            <span
              className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </button>
        )}
      </div>

      <div
        className={`divide-y ${
          isDark ? "divide-[#1A2E4C]" : "divide-slate-100"
        }`}
      >
        {displayItems.map((act) => {
          const icon = getSpecificIcon(act);
          const { iconClass, badgeClass, dotColor } = getThemeStyles(act.badge_color);

          return (
            <div
              key={act.id}
              className={`py-3 px-3 flex items-center justify-between rounded-xl transition-colors gap-3 sm:gap-4 ${
                isDark ? "hover:bg-[#122846]/60" : "hover:bg-slate-50"
              }`}
            >
              {/* Kolom Kiri: Ikon (warna mengikuti status) + Judul & Deskripsi */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${iconClass}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {icon}
                  </span>
                </div>
                <div className="min-w-0 flex-1 truncate">
                  <p className="text-xs font-semibold leading-snug truncate">
                    {act.title}
                  </p>
                  <p
                    className={`text-[11px] leading-none mt-1 truncate ${
                      isDark ? "text-[#94A3B8]" : "text-slate-500"
                    }`}
                  >
                    {act.description}
                  </p>
                </div>
              </div>

              {/* Kolom Kanan: Tanggal & Waktu Sejajar Rapi + Badge Status (Auto-fit, tidak pernah terpotong/terkeluar) */}
              <div className="flex items-center gap-3 sm:gap-4 shrink-0 pl-2">
                {/* Tanggal & Waktu */}
                <span
                  className={`text-[11px] font-mono whitespace-nowrap shrink-0 text-right ${
                    isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
                >
                  {act.date}
                </span>

                {/* Badge Keterangan Status */}
                <div className="min-w-[80px] max-w-[140px] flex justify-end shrink-0">
                  <span
                    title={act.badge}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1.5 max-w-full truncate ${badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}></span>
                    <span className="truncate">{act.badge}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
