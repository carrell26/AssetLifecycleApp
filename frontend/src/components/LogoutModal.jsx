import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function LogoutModal({ isOpen, onClose, user }) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogout = async () => {
    setLoading(true);
    try {
      try {
        localStorage.removeItem("cached_user");
      } catch {}
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        window.location.href = "/auth/login";
      }
    } catch (err) {
      console.error("Logout error:", err);
      window.location.href = "/auth/login";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md rounded-[28px] border shadow-2xl p-6 transition-all text-left ${
          isDark
            ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-[24px]">logout</span>
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-semibold">Konfirmasi Keluar</h3>
            <p
              className={`text-xs mt-1.5 leading-relaxed ${
                isDark ? "text-[#94A3B8]" : "text-slate-500"
              }`}
            >
              Anda yakin ingin keluar dari sistem Asset Lifecycle?
            </p>
          </div>
        </div>



        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
              isDark
                ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                : "border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Ya, Keluar"}
          </button>
        </div>
      </div>
    </div>
  );
}
