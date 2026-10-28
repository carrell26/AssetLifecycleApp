import React, { useState, useEffect, useRef } from "react";

export default function TablePagination({
  page = 1,
  perPage = 15,
  totalCount = 0,
  onPageChange,
  onPerPageChange,
  isDark = true,
}) {
  const [perPageOpen, setPerPageOpen] = useState(false);
  const perPageRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (perPageRef.current && !perPageRef.current.contains(event.target)) {
        setPerPageOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const startItem = totalCount === 0 ? 0 : (safePage - 1) * perPage + 1;
  const endItem = Math.min(totalCount, safePage * perPage);

  // Generate page numbers (max 5 visible)
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage <= 3) {
      return [1, 2, 3, 4, 5];
    }
    if (safePage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      safePage - 2,
      safePage - 1,
      safePage,
      safePage + 1,
      safePage + 2,
    ];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 pt-3 border-t text-xs ${
        isDark ? "border-[#162F52] text-[#94A3B8]" : "border-slate-200 text-slate-500"
      }`}
    >
      {/* Range Info & Per Page selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span>Menampilkan baris</span>
        <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
          {startItem} - {endItem}
        </span>
        <span>dari</span>
        <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
          {totalCount}
        </span>
        <span>data</span>

        <span className={`mx-2 ${isDark ? "text-[#1E3A5F]" : "text-slate-300"}`}>|</span>

        {/* Custom Pill Dropdown: Baris per halaman (Box Card Style - Matching Audit Log) */}
        <div className="flex items-center gap-2">
          <span>Baris per halaman:</span>
          <div className="relative" ref={perPageRef}>
            <button
              type="button"
              onClick={() => setPerPageOpen(!perPageOpen)}
              className={`h-8 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                isDark
                  ? "border-[#1E3A5F] bg-[#071426] text-[#E6EDF7] hover:border-[#1677FF]"
                  : "border-slate-300 bg-slate-50 text-slate-800 hover:border-blue-500"
              }`}
            >
              <span>{perPage}</span>
              <span
                className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                  perPageOpen ? "rotate-180" : ""
                } ${isDark ? "text-[#94A3B8]" : "text-slate-400"}`}
              >
                expand_more
              </span>
            </button>

            {/* Box Card Dropdown Menu for Rows per Page */}
            {perPageOpen && (
              <div
                className={`absolute left-0 bottom-full mb-1.5 w-24 rounded-xl border shadow-2xl p-1 z-40 overflow-hidden backdrop-blur-md ${
                  isDark
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
                        onPerPageChange(num);
                        setPerPageOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
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

      {/* Pagination page controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          title="Halaman Sebelumnya"
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isDark
              ? "bg-[#0A182B] border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846]"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">chevron_left</span>
        </button>

        {pageNumbers.map((p) => {
          const isActive = p === safePage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/30 border border-[#1677FF]"
                  : isDark
                  ? "bg-[#0A182B] border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846]"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          title="Halaman Berikutnya"
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isDark
              ? "bg-[#0A182B] border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846]"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
