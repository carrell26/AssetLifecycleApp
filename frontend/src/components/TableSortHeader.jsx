import React from "react";

export default function TableSortHeader({
  title,
  sortKey,
  currentSort = { key: null, direction: null },
  onSort,
  align = "left",
  isDark = true,
  className = "",
}) {
  const isSorted = currentSort.key === sortKey;
  const direction = isSorted ? currentSort.direction : null;

  const handleClick = (e) => {
    e.stopPropagation();
    if (onSort) onSort(sortKey);
  };

  const getSortTooltip = () => {
    if (!isSorted) return `Urutkan berdasarkan ${title} (A-Z / terkecil / terlama)`;
    if (direction === "asc") return `${title}: Ascending (klik untuk Descending)`;
    return `${title}: Descending (klik untuk mereset urutan)`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={getSortTooltip()}
      className={`group inline-flex items-center gap-1.5 cursor-pointer select-none transition-colors max-w-full whitespace-nowrap flex-nowrap ${
        align === "center"
          ? "justify-center mx-auto"
          : align === "right"
          ? "justify-end ml-auto"
          : "justify-start"
      } ${className}`}
    >
      <span
        className={`whitespace-nowrap font-extrabold uppercase tracking-wider text-[11px] transition-colors duration-150 ${
          isSorted
            ? isDark
              ? "text-[#00E5FF]"
              : "text-blue-600"
            : isDark
            ? "text-[#38BDF8] group-hover:text-white"
            : "text-blue-600 group-hover:text-blue-800"
        }`}
      >
        {title}
      </span>

      {/* Ruang ikon dengan ukuran tetap (14x14px), tidak berubah ukuran atau menambah elemen aktif yang memperlebar header */}
      <span
        className="w-3.5 h-3.5 min-w-[14px] max-w-[14px] flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        <span
          className={`material-symbols-outlined text-[13px] leading-none select-none transition-colors duration-150 ${
            isSorted
              ? isDark
                ? "text-[#00E5FF]"
                : "text-blue-600"
              : isDark
              ? "text-[#64748B] group-hover:text-[#38BDF8]"
              : "text-slate-400 group-hover:text-blue-600"
          }`}
        >
          {direction === "asc"
            ? "arrow_upward"
            : direction === "desc"
            ? "arrow_downward"
            : "unfold_more"}
        </span>
      </span>
    </button>
  );
}
