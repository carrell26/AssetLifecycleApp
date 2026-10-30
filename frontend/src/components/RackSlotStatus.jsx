import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function RackSlotStatus({ data }) {
  const { isDark } = useTheme();
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const racks = data && data.length > 0 ? data : [
    {
      device_id: 1,
      nama_perangkat: "WN-24X-SUL-PAL11",
      hostname: "WN-24X-SUL-PAL11",
      sto_nama: "STO Palu 1",
      tipe: "PSS-24x Shelf",
      vendor: "Nokia",
      total_slots: 24,
      occupied_slots: 24,
      percentage: 100,
      status: "aktif",
      slots: Array.from({ length: 24 }, (_, i) => ({
        slot_number: i + 1,
        occupied: true,
        module: {
          serial_number: `1MN84841AB0${i + 1}`,
          unit_part_number: "3HE09395AA",
          unit_type: "Card Transmisi PSS",
          kondisi: "AKTIF",
          port: "N/A",
        },
      })),
    },
    {
      device_id: 2,
      nama_perangkat: "WN-24X-SUL-PAL211",
      hostname: "WN-24X-SUL-PAL211",
      sto_nama: "STO Palu 2",
      tipe: "PSS-24x Shelf",
      vendor: "Nokia",
      total_slots: 24,
      occupied_slots: 24,
      percentage: 100,
      status: "aktif",
      slots: Array.from({ length: 24 }, (_, i) => ({
        slot_number: i + 1,
        occupied: true,
        module: {
          serial_number: `1MN95952BC0${i + 1}`,
          unit_part_number: "3HE09395AA",
          unit_type: "Card Transmisi PSS",
          kondisi: "AKTIF",
          port: "N/A",
        },
      })),
    },
  ];

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

  return (
    <div
      className={`rounded-2xl border shadow-sm p-5 transition-colors duration-300 relative ${
        isDark
          ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
          : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-2 border-slate-100 dark:border-[#1A2E4C]">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#38BDF8]">
              dns
            </span>
            <h2 className="text-sm font-semibold tracking-tight">
              Status Rak &amp; Okupansi Slot Per STO
            </h2>
          </div>
          <p
            className={`text-[11px] mt-0.5 ${
              isDark ? "text-[#94A3B8]" : "text-slate-500"
            }`}
          >
            Posisi modul optik terpasang pada rak transmisi (Slot dalam status terisi)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#1677FF] border border-[#38BDF8]"></span>
            <span className={isDark ? "text-[#94A3B8]" : "text-slate-600"}>
              Slot Terisi
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-sm border ${
                isDark ? "bg-[#071426] border-[#1E3A5F]" : "bg-slate-100 border-slate-300"
              }`}
            ></span>
            <span className={isDark ? "text-[#64748B]" : "text-slate-400"}>
              Slot Kosong
            </span>
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {hoveredSlot && (
        <div
          className={`fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full text-[11px] p-3 rounded-xl shadow-2xl border transition-all duration-75 min-w-[200px] ${
            isDark
              ? "bg-[#071426] border-[#38BDF8]/50 text-[#E6EDF7] shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
              : "bg-white border-blue-400 text-slate-800 shadow-xl"
          }`}
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-[#1E3A5F] mb-1.5">
            <span className="font-bold text-xs text-[#38BDF8]">
              Slot #{String(hoveredSlot.slot_number).padStart(2, "0")}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                hoveredSlot.occupied
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
              }`}
            >
              {hoveredSlot.occupied ? "TERISI" : "KOSONG"}
            </span>
          </div>
          {hoveredSlot.occupied && hoveredSlot.module ? (
            <div className="space-y-1 text-[10px]">
              <div>
                <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                  Serial No:{" "}
                </span>
                <span className="font-mono font-semibold">
                  {hoveredSlot.module.serial_number || "-"}
                </span>
              </div>
              <div>
                <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                  Part No:{" "}
                </span>
                <span className="font-mono">
                  {hoveredSlot.module.unit_part_number || "-"}
                </span>
              </div>
              <div>
                <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                  Tipe:{" "}
                </span>
                <span>{hoveredSlot.module.unit_type || "Card Utama"}</span>
              </div>
              <div>
                <span className={isDark ? "text-[#94A3B8]" : "text-slate-500"}>
                  Status:{" "}
                </span>
                <span className="text-emerald-400 font-semibold">
                  {hoveredSlot.module.kondisi || "AKTIF"}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 italic">
              Slot belum terpasang modul
            </div>
          )}
        </div>
      )}

      {/* Rack Shelves Grid (STO Palu 1 & STO Palu 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
        {racks.map((rack) => {
          const slots = rack.slots || [];
          // Group 24 slots into 4 columns of 6 slots each (matching user layout)
          const colsCount = 4;
          const slotsPerCol = Math.ceil(slots.length / colsCount) || 6;
          const columnGroups = Array.from({ length: colsCount }, (_, colIdx) => {
            return slots.slice(colIdx * slotsPerCol, (colIdx + 1) * slotsPerCol);
          });

          return (
            <div
              key={rack.device_id}
              className={`rounded-xl border p-4 transition-all duration-300 relative ${
                isDark
                  ? "bg-[#0A182B] border-[#1E3A5F] hover:border-[#1677FF]/60"
                  : "bg-slate-50 border-slate-200 hover:border-blue-400"
              }`}
            >
              {/* Rack Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isDark
                        ? "bg-[#1677FF]/15 text-[#38BDF8]"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      router
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold leading-tight">
                      {rack.sto_nama}
                    </h3>
                    <p
                      className={`text-[10px] font-mono ${
                        isDark ? "text-[#94A3B8]" : "text-slate-500"
                      }`}
                    >
                      {rack.hostname} · {rack.vendor} {rack.tipe}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow"></span>
                  <span>Online</span>
                </div>
              </div>

              {/* Physical Shelf Chassis Representation */}
              <div
                className={`rounded-xl p-3 border mb-3 relative overflow-hidden ${
                  isDark
                    ? "bg-[#06101E] border-[#162D4A] shadow-inner"
                    : "bg-white border-slate-200"
                }`}
              >
                {/* 4 Bay Shelf Grid */}
                <div className="grid grid-cols-4 gap-2.5">
                  {columnGroups.map((group, colIdx) => (
                    <div
                      key={colIdx}
                      className={`flex flex-col gap-1.5 p-1.5 rounded-lg border ${
                        isDark
                          ? "bg-[#091729]/70 border-[#1A3353]"
                          : "bg-slate-50/70 border-slate-200"
                      }`}
                    >
                      {group.map((slot) => {
                        const isOccupied = slot.occupied;
                        return (
                          <div
                            key={slot.slot_number}
                            onMouseEnter={(e) =>
                              handleMouseEnter(e, slot, rack.sto_nama)
                            }
                            onMouseLeave={handleMouseLeave}
                            className={`h-4 rounded-[4px] border transition-all duration-200 cursor-pointer flex items-center justify-between px-1.5 ${
                              isOccupied
                                ? isDark
                                  ? "bg-[#1677FF]/20 border-[#1677FF]/60 hover:bg-[#1677FF]/40 hover:border-[#38BDF8] shadow-[0_0_8px_rgba(22,119,255,0.2)]"
                                  : "bg-blue-100 border-blue-400 hover:bg-blue-200 text-blue-900"
                                : isDark
                                ? "bg-[#071426] border-[#1A2E4C]/50 hover:border-[#1E3A5F]"
                                : "bg-slate-100 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <span
                              className={`text-[8px] font-mono leading-none ${
                                isOccupied
                                  ? isDark
                                    ? "text-[#38BDF8] font-bold"
                                    : "text-blue-800 font-bold"
                                  : isDark
                                  ? "text-[#475569]"
                                  : "text-slate-400"
                              }`}
                            >
                              S{String(slot.slot_number).padStart(2, "0")}
                            </span>

                            {isOccupied ? (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isDark ? "bg-[#38BDF8]" : "bg-blue-600"
                                }`}
                              ></span>
                            ) : (
                              <span className="w-1 h-1 rounded-full bg-transparent"></span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Shelf Footer & Occupancy Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-semibold text-emerald-400">
                    {rack.occupied_slots}/{rack.total_slots} Slot Terisi
                  </span>
                  <span className="font-bold text-emerald-400">
                    {rack.percentage}%
                  </span>
                </div>

                <div
                  className={`w-full h-1.5 rounded-full overflow-hidden border ${
                    isDark
                      ? "bg-[#071426] border-[#1A2E4C]"
                      : "bg-slate-200 border-slate-300"
                  }`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{ width: `${Math.min(rack.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
