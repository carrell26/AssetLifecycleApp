import React from "react";
import { useTheme } from "../context/ThemeContext";
import UserProfileMenu from "./UserProfileMenu";

export default function Header({
  user,
  onAvatarUpdated,
  onOpenLogoutModal,
  onOpenAvatarModal,
  searchValue = "",
  onSearchChange,
  showSearch = true,
}) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header
      className={`w-full h-[64px] shrink-0 z-40 px-6 flex items-center justify-between border-b gap-6 transition-colors duration-300 ${isDark
          ? "bg-[#071426] border-[#1A2E4C] shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
          : "bg-white border-slate-200 shadow-sm"
        }`}
    >
      {/* Search Input - Expanding to fill available space */}
      {showSearch ? (
        <div className="relative flex items-center w-full flex-1">
          <span
            className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] ${isDark ? "text-[#64748B]" : "text-slate-400"
              }`}
          >
            search
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Cari perangkat, modul, lokasi, atau nomor seri..."
            className={`w-full max-w-xl h-10 pl-10 pr-4 rounded-full border text-xs font-normal transition-all duration-200 outline-none ${isDark
                ? "bg-[#0B172B] border-[#1E3A5F] text-[#E6EDF7] placeholder-[#64748B] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              }`}
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Right Controls: Theme Toggle & User Profile */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Modern Theme Switcher Button */}
        <div className="flex items-center">
          <button
            type="button"
            id="global-theme-btn"
            onClick={toggleTheme}
            title={
              isDark
                ? "Beralih ke Mode Terang (Light Mode)"
                : "Beralih ke Mode Gelap (Dark Mode)"
            }
            className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 border cursor-pointer group ${isDark
                ? "bg-[#0D1F36] border-[#1E3A5F] text-amber-400 hover:border-amber-400/50 hover:bg-[#122846] shadow-sm hover:shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                : "bg-slate-50 border-slate-200 text-amber-600 hover:border-amber-500/50 hover:bg-slate-100 shadow-sm hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              }`}
          >
            <span
              className={`material-symbols-outlined text-[21px] transition-transform duration-300 group-hover:rotate-45 ${isDark ? "text-amber-400" : "text-amber-500"
                }`}
            >
              {isDark ? "light_mode" : "dark_mode"}
            </span>

            {/* Glowing theme indicator dot */}
            <span
              className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 transition-all duration-300 ${isDark
                  ? "bg-amber-400 ring-[#071426] shadow-[0_0_6px_#fbbf24]"
                  : "bg-amber-500 ring-white shadow-[0_0_6px_#f59e0b]"
                }`}
            ></span>
          </button>
        </div>

        <div
          className={`h-5 w-px ${isDark ? "bg-[#1A2E4C]" : "bg-slate-200"}`}
        ></div>

        {/* Global Standardized User Profile Menu (Dashboard Reference) */}
        <UserProfileMenu
          user={user}
          onOpenAvatarModal={onOpenAvatarModal}
          onOpenLogoutModal={onOpenLogoutModal}
        />
      </div>
    </header>
  );
}
