import React from "react";
import { useTheme } from "../context/ThemeContext";
import dashboardBannerImg from "../assets/dashboard_banner.jpg";

export default function HeroBanner({ userName, userRole }) {
  const { isDark } = useTheme();
  const isTeknisi = userRole === "teknisi";

  const bannerBackground = isDark
    ? `linear-gradient(to right, #071426 0%, #071426 28%, rgba(7, 20, 38, 0.92) 38%, rgba(7, 20, 38, 0.45) 55%, transparent 72%), url(${dashboardBannerImg})`
    : `linear-gradient(to right, #ffffff 0%, #ffffff 28%, rgba(255, 255, 255, 0.92) 38%, rgba(255, 255, 255, 0.45) 55%, transparent 72%), url(${dashboardBannerImg})`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl px-6 h-[120px] min-h-[120px] max-h-[120px] flex items-center justify-between w-full !mt-0 select-none transition-colors duration-300 ${
        isDark
          ? "border border-[#1E3A5F] bg-[#071426] shadow-2xl"
          : "border border-slate-200 bg-white shadow-md"
      }`}
      style={{
        marginTop: 0,
        height: "120px",
        minHeight: "120px",
        maxHeight: "120px",
        backgroundImage: bannerBackground,
        backgroundPosition: "right center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-xs font-normal ${
              isDark ? "text-[#94A3B8]" : "text-slate-500"
            }`}
          >
            Selamat Datang,
          </span>
          <span
            className={`text-2xl font-bold tracking-tight ${
              isDark ? "text-[#E6EDF7]" : "text-slate-900"
            }`}
          >
            {userName || "User"}
          </span>
        </div>
        <p
          className={`text-xs mt-1.5 max-w-xl font-normal leading-relaxed ${
            isDark ? "text-[#94A3B8]" : "text-slate-600"
          }`}
        >
          {isTeknisi
            ? "Kelola pengajuan perpindahan modul dan pantau statusnya melalui sistem."
            : "Kelola data perangkat, modul, dan lokasi Telkom secara terintegrasi, aman, dan efisien dengan teknologi ledger audit modern."}
        </p>
      </div>
    </div>
  );
}
