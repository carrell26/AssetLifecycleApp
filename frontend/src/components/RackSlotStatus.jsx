import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import ChassisSubrackModal from "./ChassisSubrackModal";

/**
 * Executive Status Rak & Okupansi Slot Per STO
 * Always strictly renders 29 physical slots (Nokia 1830 PSS-24 front shelf architecture).
 * Fully optimized for both Dark Mode and Light Mode with Telkom corporate theme tokens.
 */
const TOTAL_PHYSICAL_SLOTS = 29;

export default function RackSlotStatus({ data }) {
  const { isDark } = useTheme();
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedRackForModal, setSelectedRackForModal] = useState(null);

  const rawRacks = Array.isArray(data) ? data : [];

  const handleMouseEnter = (e, slot, rackName) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setHoveredSlot({ ...slot, rackName });
  };

  const handleMouseLeave = () => {
    setHoveredSlot(null);
  };

  // SVG Circular progress metrics (Radius = 38, Circumference = 2 * PI * 38 = 238.76)
  const radius = 38;
  const strokeWidth = 7.5;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={`rounded-2xl border shadow-sm p-5 sm:p-6 transition-colors duration-300 relative ${
        isDark
          ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
          : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3 border-slate-100 dark:border-slate-800/80 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isDark
                  ? "bg-blue-500/10 text-blue-400 border border-blue-400/30"
                  : "bg-blue-50 text-blue-600 border border-blue-200"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">dns</span>
            </span>
            <h2 className="text-sm sm:text-base font-bold tracking-tight">
              Status Rak &amp; Okupansi Slot Per STO
            </h2>
          </div>
          <p
            className={`text-xs mt-1 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Ringkasan utilisasi kapasitas 29 slot fisik rak transmisi Nokia 1830 PSS-24x
          </p>
        </div>

        {/* Global Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span
              className={`w-3.5 h-3.5 rounded-[4px] ${
                isDark
                  ? "bg-[#3B82F6] shadow-xs"
                  : "bg-[#2563EB] shadow-xs"
              }`}
            ></span>
            <span className={isDark ? "text-slate-200" : "text-slate-700"}>
              Slot Terpakai
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-3.5 h-3.5 rounded-[4px] border ${
                isDark
                  ? "bg-[#0B1A2E] border-slate-700"
                  : "bg-slate-100 border-slate-300"
              }`}
            ></span>
            <span className={isDark ? "text-slate-400" : "text-slate-500"}>
              Slot Tersedia
            </span>
          </div>
        </div>
      </div>

      {/* Floating Tooltip for Balok & Slots */}
      {hoveredSlot && (
        <div
          className={`fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full text-[11px] p-3 rounded-xl shadow-2xl border transition-all duration-75 min-w-[220px] ${
            isDark
              ? "bg-[#071426] border-blue-400/60 text-[#E6EDF7] shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
              : "bg-white border-blue-400 text-slate-800 shadow-xl"
          }`}
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                Slot #{String(hoveredSlot.slot_number).padStart(2, "0")}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({hoveredSlot.rackName})
              </span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                hoveredSlot.occupied
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-500/20 text-slate-500 dark:text-slate-400 border border-slate-500/30"
              }`}
            >
              {hoveredSlot.occupied ? "TERPAKAI" : "TERSEDIA"}
            </span>
          </div>

          {hoveredSlot.occupied && hoveredSlot.module ? (
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                  Tipe Card:
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {hoveredSlot.module.unit_type || "Card Utama"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                  Serial No:
                </span>
                <span className="font-mono font-medium">
                  {hoveredSlot.module.serial_number || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                  Part No:
                </span>
                <span className="font-mono">
                  {hoveredSlot.module.unit_part_number || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                  Status Fisik:
                </span>
                <span className="text-emerald-500 dark:text-emerald-400 font-bold">
                  {hoveredSlot.module.kondisi || "AKTIF"}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 italic">
              Slot kosong (tersedia untuk pemasangan card transmisi baru)
            </div>
          )}
        </div>
      )}

      {/* Grid STO Palu 1 & STO Palu 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {rawRacks.length === 0 && (
          <div className={`col-span-full py-10 text-center text-xs rounded-2xl border border-dashed ${isDark ? "border-[#1E3A5F] text-slate-400" : "border-slate-300 text-slate-500"}`}>
            Data perangkat &amp; okupansi slot sedang dimuat atau belum tersedia di database.
          </div>
        )}
        {rawRacks.map((rack) => {
          // Normalize slots to ALWAYS strictly contain all 29 physical slots
          const slotsMap = new Map();
          (rack.slots || []).forEach((s) => {
            if (s && s.slot_number) {
              slotsMap.set(Number(s.slot_number), s);
            }
          });

          const slots = Array.from({ length: TOTAL_PHYSICAL_SLOTS }, (_, idx) => {
            const slotNum = idx + 1;
            if (slotsMap.has(slotNum)) {
              return slotsMap.get(slotNum);
            }
            return {
              slot_number: slotNum,
              occupied: false,
              module: null,
            };
          });

          const occupiedCount = slots.filter((s) => s.occupied).length;
          const emptyCount = TOTAL_PHYSICAL_SLOTS - occupiedCount;
          const percentage = Number(
            ((occupiedCount / TOTAL_PHYSICAL_SLOTS) * 100).toFixed(1)
          );

          // SVG Donut calculation
          const strokeDashoffset =
            circumference - (circumference * Math.min(percentage, 100)) / 100;

          return (
            <div
              key={rack.device_id}
              className={`rounded-[22px] border transition-all duration-300 relative flex flex-col justify-between p-5 sm:p-6 ${
                isDark
                  ? "bg-[#071426] border-[#1E3A5F] shadow-md hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10"
                  : "bg-white border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/5"
              }`}
            >
              {/* STO Header Bar */}
              <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-slate-100 dark:border-[#14263F]">
                <div>
                  <h3 className="text-base sm:text-[17px] font-bold leading-tight text-slate-900 dark:text-white">
                    {rack.sto_nama}
                  </h3>
                  <p className="text-xs font-mono tracking-wider mt-1 text-slate-400 dark:text-slate-400">
                    {rack.hostname}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Status Online Pill */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                      isDark
                        ? "bg-[#06241C] text-emerald-400 border-emerald-500/30"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Online • Normal
                  </span>

                  {/* Button to open Subrack Modal */}
                  <button
                    onClick={() => setSelectedRackForModal(rack)}
                    title="Buka tampilan interaktif 29 slot subrack"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                      isDark
                        ? "bg-blue-500/15 border-blue-400/40 text-[#38BDF8] hover:bg-blue-500/25 hover:border-blue-400/60 hover:text-cyan-200"
                        : "bg-blue-50/70 border-blue-200 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                    }`}
                  >
                    <span>Lihat Subrack 29 Slot</span>
                    <span className="text-xs font-bold leading-none">↗</span>
                  </button>
                </div>
              </div>

              {/* Main Executive Body: Gauge + 29 Capacity Balok */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Left: Circular Occupancy Gauge */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={isDark ? "#162842" : "#EDF2F7"}
                        strokeWidth={strokeWidth}
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={isDark ? "#3B82F6" : "#2563EB"}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>

                    {/* Gauge Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                        {percentage}%
                      </span>
                      <span
                        className="text-[10px] font-semibold mt-1 text-slate-400"
                      >
                        {occupiedCount}/{TOTAL_PHYSICAL_SLOTS} Slot
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Metrics & 29 Capacity Balok */}
                <div className="flex-1 w-full min-w-0">
                  {/* Legend / Metrics Row */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isDark
                            ? "bg-[#3B82F6]"
                            : "bg-[#2563EB]"
                        }`}
                      ></span>
                      <span
                        className={`text-xs ${
                          isDark ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        Slot Terpakai:
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono ml-0.5">
                        {occupiedCount} Slot
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full border ${
                          isDark
                            ? "bg-[#0B1A2E] border-slate-700"
                            : "bg-slate-100 border-slate-300"
                        }`}
                      ></span>
                      <span
                        className={`text-xs ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Slot Tersedia:
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono ml-0.5">
                        {emptyCount} Slot
                      </span>
                    </div>
                  </div>

                  {/* Title of Capacity Balok */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-2">
                    <span>Kapasitas Balok (29 Slot Fisik)</span>
                    <span className="text-xs font-mono text-slate-400 font-normal">
                      Slot 01 - 29
                    </span>
                  </div>

                  {/* The EXACTLY 29 Capacity Balok (Segmented Bar) */}
                  <div
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-[2.5px] sm:gap-[3.5px] ${
                      isDark
                        ? "bg-[#050F1E] border-[#14263F]"
                        : "bg-slate-50/60 border-slate-100 shadow-[inset_0_1px_3px_rgba(0,0,0,0.03)]"
                    }`}
                  >
                    {slots.map((slot) => {
                      const isOccupied = slot.occupied;
                      return (
                        <div
                          key={slot.slot_number}
                          onMouseEnter={(e) =>
                            handleMouseEnter(e, slot, rack.sto_nama)
                          }
                          onMouseLeave={handleMouseLeave}
                          title={`Slot #${String(slot.slot_number).padStart(2, "0")}: ${
                            isOccupied
                              ? slot.module?.unit_type || "Terpakai"
                              : "Kosong (Tersedia)"
                          }`}
                          className={`flex-1 h-7 min-w-[6px] max-w-[12px] rounded-[4px] transition-all duration-200 cursor-pointer relative flex flex-col justify-end overflow-hidden ${
                            isOccupied
                              ? isDark
                                ? "bg-[#3B82F6] hover:bg-blue-400 shadow-xs"
                                : "bg-[#2563EB] hover:bg-[#1D4ED8]"
                              : isDark
                              ? "bg-[#0B1A2E] hover:bg-[#132A4A] border border-[#162B46]"
                              : "bg-slate-100/80 hover:bg-slate-200 border border-slate-200/70"
                          }`}
                        >
                          {/* Distinctive Bottom Base Accent Cap (Image 1 & 2 signature) */}
                          {isOccupied && (
                            <span
                              className={`w-full h-1.5 rounded-b-[3px] block shrink-0 mt-auto ${
                                isDark ? "bg-[#60A5FA]" : "bg-[#7CA1F3]"
                              }`}
                            ></span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Balok Number Axis Guide */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1.5 px-0.5">
                    <span>#01</span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                      {occupiedCount} dari 29 Slot Terisi ({percentage}%)
                    </span>
                    <span>#29</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Modal when clicking "Lihat Subrack 29 Slot" */}
      {selectedRackForModal && (
        <ChassisSubrackModal
          item={{
            id: selectedRackForModal.device_id,
            device_id: selectedRackForModal.device_id,
            hostname: selectedRackForModal.hostname,
            nama_perangkat: selectedRackForModal.nama_perangkat,
            lokasi: selectedRackForModal.sto_nama,
            location_name: selectedRackForModal.sto_nama,
            sto_nama: selectedRackForModal.sto_nama,
            site_code: selectedRackForModal.device_id === 17 || (selectedRackForModal.hostname || "").includes("PAL2") ? "PLB" : "PLA",
            total_positions: selectedRackForModal.device_id === 17 || (selectedRackForModal.hostname || "").includes("PAL2") ? 34 : 70,
            slots: selectedRackForModal.slots,
          }}
          onClose={() => setSelectedRackForModal(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
}
