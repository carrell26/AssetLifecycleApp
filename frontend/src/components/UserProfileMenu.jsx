import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

export default function UserProfileMenu({ user, onOpenAvatarModal, onOpenLogoutModal }) {
  const { isDark } = useTheme();
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const defaultAvatar =
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256";
  const avatarSrc = user?.avatar_url || defaultAvatar;

  return (
    <div className="relative" ref={dropdownRef} id="profile-container">
      {/* Topbar Profile Trigger Button */}
      <button
        type="button"
        id="profileTriggerBtn"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center gap-2.5 p-1 rounded-full transition-colors cursor-pointer ${
          isDark ? "hover:bg-[#0D1F36]" : "hover:bg-slate-100"
        }`}
      >
        <div className="relative shrink-0">
          <img
            src={avatarSrc}
            alt={user?.name || "User Avatar"}
            className="w-9 h-9 rounded-full object-cover object-top ring-2 shadow-sm ring-[#1677FF]"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#071426]"></span>
        </div>
        <div className="flex flex-col text-left justify-center min-w-0 pr-1">
          <div className="flex items-center gap-1 leading-tight">
            <span
              className={`text-xs font-semibold max-w-[130px] truncate ${
                isDark ? "text-[#E6EDF7]" : "text-slate-800"
              }`}
            >
              {user?.name || "Memuat..."}
            </span>
            <span
              id="profile-chevron"
              className={`material-symbols-outlined text-[17px] transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              } ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}
            >
              expand_more
            </span>
          </div>
          <span
            className={`text-[11px] leading-none mt-0.5 capitalize ${
              isDark ? "text-[#38BDF8]" : "text-blue-600"
            }`}
          >
            {user?.role?.replace("_", " ") || "Admin"}
          </span>
        </div>
      </button>

      {/* User Profile Dropdown Popover */}
      {dropdownOpen && (
        <div
          id="userProfileDropdown"
          className={`absolute right-0 top-12 mt-2 w-[340px] rounded-2xl shadow-2xl p-5 z-50 border backdrop-blur-md transition-all duration-200 ${
            isDark
              ? "bg-[#0D1F36]/95 border-[#1E3653] text-[#E6EDF7]"
              : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-200"
          }`}
        >
          {/* Header inside dropdown with Avatar */}
          <div
            className={`flex items-center gap-3.5 pb-4 border-b relative ${
              isDark ? "border-[#1A2E4C]" : "border-slate-100"
            }`}
          >
            <div className="relative group">
              <img
                src={avatarSrc}
                alt={user?.name}
                className="w-12 h-12 rounded-full object-cover object-top ring-2 shadow-md ring-[#1677FF]/40"
              />
              {/* Camera action button on avatar */}
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenAvatarModal?.();
                }}
                title="Ubah Foto Profil (Kamera / Galeri)"
                className="avatar-camera-btn absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-white flex items-center justify-center shadow-md border transition-transform hover:scale-110 cursor-pointer bg-[#1677FF] hover:bg-[#38BDF8] border-white dark:border-[#071426]"
              >
                <span className="material-symbols-outlined text-[13px]">
                  photo_camera
                </span>
              </button>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <h4
                className={`text-sm font-semibold truncate ${
                  isDark ? "text-[#E6EDF7]" : "text-slate-900"
                }`}
              >
                {user?.name}
              </h4>
              <p
                className={`text-[11px] font-medium leading-tight mt-0.5 capitalize ${
                  isDark ? "text-[#38BDF8]" : "text-blue-600"
                }`}
              >
                {user?.role?.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Account Information Details */}
          <div className="py-3.5 space-y-2.5">
            <span
              className={`text-[10px] font-semibold tracking-wide uppercase font-mono ${
                isDark ? "text-[#94A3B8]" : "text-slate-500"
              }`}
            >
              Informasi Akun
            </span>
            <div
              className={`rounded-xl p-3 border space-y-2 text-xs ${
                isDark
                  ? "bg-[#071426] border-[#1A2E4C]"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`text-[11px] shrink-0 ${
                    isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
                >
                  District
                </span>
                <span
                  className={`font-medium text-right truncate text-[11px] ${
                    isDark ? "text-[#E6EDF7]" : "text-slate-800"
                  }`}
                >
                  {user?.district || "—"}
                </span>
              </div>
              <div
                className={`flex items-start justify-between gap-2 pt-1 border-t ${
                  isDark ? "border-[#1A2E4C]/60" : "border-slate-200"
                }`}
              >
                <span
                  className={`text-[11px] shrink-0 ${
                    isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
                >
                  Email
                </span>
                <span
                  className={`font-mono text-right truncate text-[11px] ${
                    isDark ? "text-[#38BDF8]" : "text-blue-600"
                  }`}
                >
                  {user?.email}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className={`pt-3 border-t flex flex-col gap-2 ${
              isDark ? "border-[#1A2E4C]" : "border-slate-100"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                onOpenAvatarModal?.();
              }}
              className={`btn-change-avatar rounded-xl px-4 py-2 w-full flex items-center justify-center gap-2 font-medium text-xs transition-colors cursor-pointer border ${
                isDark
                  ? "bg-[#1677FF]/15 text-[#38BDF8] border-[#1677FF]/30 hover:bg-[#1677FF]/25"
                  : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                photo_camera
              </span>
              Ganti Foto Profil
            </button>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                onOpenLogoutModal?.();
              }}
              className={`btn-logout rounded-xl px-4 py-2 w-full flex items-center justify-center gap-2 font-medium text-xs transition duration-200 cursor-pointer shadow-sm active:scale-[0.98] border ${
                isDark
                  ? "text-rose-400 bg-rose-500/10 hover:bg-rose-600 hover:text-white border-rose-500/25"
                  : "text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border-rose-200"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                logout
              </span>
              Keluar dari akun
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
