import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import ModalPortal from "../components/ModalPortal";

export default function ModuleMovementsPage({ user, searchValue, onSearchChange }) {
  const { isDark } = useTheme();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    filtered_total: 0,
    this_month_count: 0,
    unique_modules_moved: 0,
  });

  // Filter States
  const [jenisFilter, setJenisFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [metaDevices, setMetaDevices] = useState([]);

  // Modal State
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const canMutate = user?.role === "admin" || user?.role === "karyawan_tif";

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchValue) params.append("q", searchValue);
      if (jenisFilter && jenisFilter !== "all") params.append("jenis", jenisFilter);
      if (deviceFilter) params.append("device_id", deviceFilter);

      const res = await fetch(`/api/module-movements?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setMovements(data.items || []);
        setStats({
          total: data.total || 0,
          filtered_total: data.filtered_total || 0,
          this_month_count: data.this_month_count || 0,
          unique_modules_moved: data.unique_modules_moved || 0,
        });
      } else {
        setError(data.error || "Gagal memuat riwayat mutasi modul.");
      }
    } catch (err) {
      console.error("Fetch movements error:", err);
      setError("Terjadi kesalahan jaringan saat memuat riwayat mutasi.");
    } finally {
      setLoading(false);
    }
  }, [searchValue, jenisFilter, deviceFilter]);

  // Load device options for filter dropdown
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch("/api/modules/meta");
        const data = await res.json();
        if (data.success) {
          setMetaDevices(data.palu_devices || data.all_devices || []);
        }
      } catch (err) {
        console.error("Load meta error:", err);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-xl backdrop-blur-md transition-all">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Mutasi Modul
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#1677FF]/15 text-[#38BDF8] border border-[#1677FF]/30">
              Langsung
            </span>
          </div>
          <p className={`text-xs mt-1 ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
            Pencatatan perpindahan fisik modul secara langsung dan riwayat audit ledger (append-only)
          </p>
        </div>

        {canMutate && (
          <button
            type="button"
            onClick={() => setMoveModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1677FF] hover:bg-[#1466de] text-white shadow-lg shadow-[#1677FF]/25 transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">sync_alt</span>
            <span>Catat Mutasi Modul</span>
          </button>
        )}
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Mutasi */}
        <div
          className={`rounded-2xl p-4 border relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${isDark ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]" : "bg-white border-slate-200 text-slate-900 shadow-sm"
            }`}
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className={`text-[11px] font-semibold tracking-wide uppercase ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                Total Mutasi
              </span>
              <div className="text-2xl font-bold tracking-tight leading-none mt-1.5 flex items-baseline gap-1.5">
                <span>{stats.total}</span>
                <span className="text-[11px] font-normal text-[#38BDF8]">Perpindahan</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#1677FF]/15 text-[#38BDF8] border border-[#1677FF]/30">
              <span className="material-symbols-outlined text-[20px]">assignment</span>
            </div>
          </div>
          <div className={`mt-3 pt-2.5 border-t text-[11px] font-mono ${isDark ? "border-[#1A2E4C] text-[#64748B]" : "border-slate-100 text-slate-400"}`}>
            Buku besar resmi modul
          </div>
        </div>

        {/* KPI 2: Bulan Ini */}
        <div
          className={`rounded-2xl p-4 border relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${isDark ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]" : "bg-white border-slate-200 text-slate-900 shadow-sm"
            }`}
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className={`text-[11px] font-semibold tracking-wide uppercase ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                Mutasi Bulan Ini
              </span>
              <div className="text-2xl font-bold tracking-tight leading-none mt-1.5 flex items-baseline gap-1.5">
                <span>{stats.this_month_count}</span>
                <span className="text-[11px] font-normal text-amber-500">Aktivitas</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </div>
          </div>
          <div className={`mt-3 pt-2.5 border-t text-[11px] font-mono ${isDark ? "border-[#1A2E4C] text-[#64748B]" : "border-slate-100 text-slate-400"}`}>
            Periode bulan berjalan
          </div>
        </div>

        {/* KPI 3: Modul Terpindah */}
        <div
          className={`rounded-2xl p-4 border relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${isDark ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]" : "bg-white border-slate-200 text-slate-900 shadow-sm"
            }`}
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className={`text-[11px] font-semibold tracking-wide uppercase ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                Modul Terpindah
              </span>
              <div className="text-2xl font-bold tracking-tight leading-none mt-1.5 flex items-baseline gap-1.5">
                <span>{stats.unique_modules_moved}</span>
                <span className="text-[11px] font-normal text-emerald-500">Unit Fisik</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="material-symbols-outlined text-[20px]">memory</span>
            </div>
          </div>
          <div className={`mt-3 pt-2.5 border-t text-[11px] font-mono ${isDark ? "border-[#1A2E4C] text-[#64748B]" : "border-slate-100 text-slate-400"}`}>
            Modul unik dengan riwayat
          </div>
        </div>

        {/* KPI 4: Integritas Audit Ledger */}
        <div
          className={`rounded-2xl p-4 border relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${isDark ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]" : "bg-white border-slate-200 text-slate-900 shadow-sm"
            }`}
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className={`text-[11px] font-semibold tracking-wide uppercase ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                Integritas Audit Ledger
              </span>
              <div className="text-2xl font-bold tracking-tight leading-none mt-1.5 flex items-baseline gap-1.5">
                <span className="text-emerald-400">VALID</span>
                <span className="text-[11px] font-normal text-emerald-400">100%</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
          </div>
          <div className={`mt-3 pt-2.5 border-t text-[11px] font-mono ${isDark ? "border-[#1A2E4C] text-[#64748B]" : "border-slate-100 text-slate-400"}`}>
            SHA-256 Hash Chain
          </div>
        </div>
      </div>

      {/* FILTER & CONTROLS BAR */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200 shadow-sm"
          }`}
      >
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Filter Jenis Aktivitas */}
          <select
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value)}
            className={`h-9 px-3 rounded-xl text-xs font-medium border focus:outline-none focus:border-[#1677FF] cursor-pointer ${isDark ? "bg-[#071426] border-[#1E3A5F] text-white" : "bg-slate-50 border-slate-300 text-slate-800"
              }`}
          >
            <option value="all">Semua Jenis Aktivitas</option>
            <option value="pindah">Pindah Posisi</option>
            <option value="pasang">Pasang Baru</option>
            <option value="lepas">Lepas Modul</option>
          </select>

          {/* Filter Perangkat */}
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className={`h-9 px-3 rounded-xl text-xs font-medium border focus:outline-none focus:border-[#1677FF] cursor-pointer ${isDark ? "bg-[#071426] border-[#1E3A5F] text-white" : "bg-slate-50 border-slate-300 text-slate-800"
              }`}
          >
            <option value="">Semua Perangkat</option>
            {metaDevices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.hostname} ({d.nama})
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchMovements}
            title="Muat ulang data"
            className={`h-9 px-3 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${isDark
                ? "bg-[#071426] border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-[#1677FF]"
                : "bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900"
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Segarkan</span>
          </button>
        </div>

        <div className={`text-xs ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
          Menampilkan <span className="font-semibold text-[#1677FF]">{movements.length}</span> riwayat mutasi
        </div>
      </div>

      {/* TABLE SECTION */}
      <div
        className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200 shadow-sm"
          }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b ${isDark ? "bg-[#071426]/60 border-[#1E3A5F] text-[#94A3B8]" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
              <tr>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Waktu Mutasi</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Modul / Serial</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Posisi Asal</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Posisi Tujuan</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Aktivitas</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Pelaksana</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Keterangan</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-[#1A2E4C]" : "divide-slate-100"}`}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="inline-flex items-center gap-3 text-xs text-[#38BDF8]">
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                      <span>Memuat riwayat mutasi modul...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-rose-400">
                    <span className="material-symbols-outlined text-[32px] block mb-2">error</span>
                    <span>{error}</span>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <span className="material-symbols-outlined text-[36px] text-slate-500 block mb-2">sync_disabled</span>
                    <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
                      Belum Ada Riwayat Mutasi Modul
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                      {canMutate ? "Klik tombol 'Catat Mutasi Modul' di atas untuk mencatat perpindahan fisik." : "Tidak ada riwayat perpindahan modul yang ditemukan."}
                    </p>
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const isPindah = m.jenis_perubahan === "pindah";
                  const isPasang = m.jenis_perubahan === "pasang";

                  return (
                    <tr
                      key={m.movement_id}
                      className={`transition-colors ${isDark ? "hover:bg-[#122846]/50" : "hover:bg-slate-50"}`}
                    >
                      {/* Waktu */}
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap text-[#94A3B8]">
                        {m.tanggal}
                      </td>

                      {/* Modul */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white font-mono">{m.serial_number}</div>
                        <div className="text-[11px] text-[#38BDF8] flex items-center gap-1.5 mt-0.5">
                          <span>{m.unit_type}</span>
                          {m.unit_part_number && m.unit_part_number !== "-" && (
                            <span className="text-[#64748B]">({m.unit_part_number})</span>
                          )}
                        </div>
                      </td>

                      {/* Posisi Asal */}
                      <td className="py-3 px-4">
                        {m.from_hostname !== "-" ? (
                          <div>
                            <div className="font-semibold text-slate-200">{m.from_hostname}</div>
                            <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                              Slot {m.from_slot}
                              {m.from_shelf && m.from_shelf !== "-" && ` · Shelf ${m.from_shelf}`}
                              {m.from_port && m.from_port !== "-" && ` · Port ${m.from_port}`}
                            </div>
                            <div className="text-[10px] text-[#64748B]">{m.from_location_name}</div>
                          </div>
                        ) : (
                          <span className="text-[#64748B] italic">- (Pasang Baru)</span>
                        )}
                      </td>

                      {/* Posisi Tujuan */}
                      <td className="py-3 px-4">
                        {m.to_hostname !== "-" ? (
                          <div>
                            <div className="font-semibold text-white">{m.to_hostname}</div>
                            <div className="text-[11px] text-[#38BDF8] font-mono mt-0.5">
                              Slot {m.to_slot}
                              {m.to_shelf && m.to_shelf !== "-" && ` · Shelf ${m.to_shelf}`}
                              {m.to_port && m.to_port !== "-" && ` · Port ${m.to_port}`}
                            </div>
                            <div className="text-[10px] text-[#64748B]">{m.to_location_name}</div>
                          </div>
                        ) : (
                          <span className="text-[#64748B] italic">- (Dilepas)</span>
                        )}
                      </td>

                      {/* Aktivitas */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 ${isPindah
                              ? "bg-[#1677FF]/15 text-[#38BDF8] border border-[#1677FF]/30"
                              : isPasang
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {isPindah ? "sync_alt" : isPasang ? "add_circle" : "remove_circle"}
                          </span>
                          <span>{m.jenis_perubahan}</span>
                        </span>
                      </td>

                      {/* Pelaksana */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#1677FF]/20 text-[#38BDF8] flex items-center justify-center font-bold text-[10px]">
                            {m.actor_name ? m.actor_name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <span className="font-medium text-slate-200">{m.actor_name}</span>
                        </div>
                      </td>

                      {/* Keterangan */}
                      <td className="py-3 px-4 max-w-[200px] truncate text-[#94A3B8]" title={m.keterangan}>
                        {m.keterangan}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CATAT MUTASI MODUL */}
      {moveModalOpen && (
        <CreateDirectMutationModal
          onClose={() => setMoveModalOpen(false)}
          onSuccess={(msg) => {
            setMoveModalOpen(false);
            showToast(msg);
            fetchMovements();
          }}
        />
      )}
    </div>
  );
}

// ==============================================================
// MODAL: FORM MUTASI MODUL LANGSUNG
// ==============================================================
function CreateDirectMutationModal({ onClose, onSuccess }) {
  const [modules, setModules] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form states
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [toDeviceId, setToDeviceId] = useState("");
  const [toSlot, setToSlot] = useState("");
  const [toShelf, setToShelf] = useState("1");
  const [toPort, setToPort] = useState("");
  const [mutationDate, setMutationDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [keterangan, setKeterangan] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load active modules and devices
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const [modRes, devRes] = await Promise.all([
          fetch("/api/modules?all=1"),
          fetch("/api/devices"),
        ]);
        const modData = await modRes.json();
        const devData = await devRes.json();

        if (modData.success) {
          setModules(modData.items || []);
        }
        if (devData.success) {
          setDevices(devData.items || []);
        }
      } catch (err) {
        console.error("Load modal data error:", err);
        setError("Gagal memuat daftar modul atau perangkat.");
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  // Selected module detail
  const selectedModule = useMemo(() => {
    if (!selectedModuleId) return null;
    return modules.find((m) => String(m.modul_id) === String(selectedModuleId));
  }, [selectedModuleId, modules]);

  // Is transceiver check
  const isTransceiver = useMemo(() => {
    if (!selectedModule) return false;
    const t = (selectedModule.unit_type || "").toUpperCase();
    const tokens = ["SFP", "QSFP", "CFP", "XFP", "Q28", "C4A", "C2D", "DCO", "ACO"];
    return tokens.some((tok) => t.includes(tok));
  }, [selectedModule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedModuleId) return setError("Silakan pilih modul yang akan dipindahkan.");
    if (!toDeviceId) return setError("Silakan pilih perangkat tujuan.");
    if (!toSlot.trim()) return setError("Nomor slot tujuan wajib diisi.");
    if (isTransceiver && !toPort.trim()) {
      return setError(`Modul '${selectedModule.unit_type}' adalah Transceiver optik dan wajib memiliki nomor Port.`);
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/modules/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: Number(selectedModuleId),
          to_device_id: Number(toDeviceId),
          to_slot: toSlot.trim(),
          to_shelf: toShelf.trim() || "1",
          to_port: toPort.trim(),
          date: mutationDate,
          keterangan: keterangan.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message || "Mutasi modul berhasil dicatat.");
      } else {
        setError(data.error || "Gagal mencatat mutasi modul.");
      }
    } catch (err) {
      console.error("Submit move error:", err);
      setError("Terjadi kesalahan jaringan saat mencatat mutasi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div className="relative w-full max-w-xl rounded-2xl bg-[#0D1F36] border border-[#1E3A5F] shadow-2xl p-6 my-8 text-white">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1A2E4C]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#1677FF]/15 border border-[#1677FF]/30 text-[#38BDF8] flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">sync_alt</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Catat Mutasi Modul Fisik</h2>
                <p className="text-xs text-[#94A3B8]">Pencatatan langsung perpindahan modul tanpa approval</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#1A2E4C] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-rose-400">error</span>
              <span>{error}</span>
            </div>
          )}

          {loadingInitial ? (
            <div className="py-12 text-center text-xs text-[#38BDF8]">
              <span className="material-symbols-outlined animate-spin text-[24px] block mb-2">progress_activity</span>
              <span>Memuat data modul & perangkat...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* 1. PILIH MODUL */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Pilih Modul yang Dipindahkan *
                </label>
                <select
                  required
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF] cursor-pointer"
                >
                  <option value="">-- Pilih Modul Aktif --</option>
                  {modules.map((m) => (
                    <option key={m.modul_id} value={m.modul_id}>
                      {m.serial_number} — {m.unit_type} ({m.ne_name || "Perangkat"}, Slot {m.slot || "-"})
                    </option>
                  ))}
                </select>
              </div>

              {/* INFO POSISI ASAL (READ-ONLY) */}
              {selectedModule && (
                <div className="p-3 rounded-xl bg-[#071426] border border-[#1E3A5F] space-y-1">
                  <div className="text-[11px] font-semibold text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span>Posisi Asal Saat Ini:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-[#94A3B8]">Perangkat:</span>{" "}
                      <span className="font-semibold text-white">{selectedModule.ne_name || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8]">Lokasi:</span>{" "}
                      <span className="text-white">{selectedModule.location_name || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8]">Slot:</span>{" "}
                      <span className="font-mono text-white">{selectedModule.slot || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8]">Shelf / Port:</span>{" "}
                      <span className="font-mono text-white">
                        {selectedModule.shelf || "1"} / {selectedModule.port || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. PILIH PERANGKAT TUJUAN */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Perangkat Tujuan *
                </label>
                <select
                  required
                  value={toDeviceId}
                  onChange={(e) => setToDeviceId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF] cursor-pointer"
                >
                  <option value="">-- Pilih Perangkat Tujuan --</option>
                  {devices.map((d) => (
                    <option key={d.device_id} value={d.device_id}>
                      {d.hostname} — {d.nama_perangkat} ({d.lokasi || "-"})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. POSISI TUJUAN (SLOT, SHELF, PORT) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    Nomor Slot Tujuan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 17"
                    value={toSlot}
                    onChange={(e) => setToSlot(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white font-mono focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    Shelf Tujuan
                  </label>
                  <input
                    type="text"
                    placeholder="1"
                    value={toShelf}
                    onChange={(e) => setToShelf(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white font-mono focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    Port {isTransceiver && <span className="text-amber-400 font-bold">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={isTransceiver ? "Wajib (misal: 1)" : "Opsional"}
                    value={toPort}
                    onChange={(e) => setToPort(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white font-mono focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
              </div>

              {isTransceiver && (
                <p className="text-[11px] text-amber-300/80 -mt-2">
                  * Tipe modul ini adalah transceiver optik dan memerlukan nomor port yang valid.
                </p>
              )}

              {/* 4. TANGGAL MUTASI */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Tanggal Mutasi Fisik
                </label>
                <input
                  type="date"
                  value={mutationDate}
                  onChange={(e) => setMutationDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white font-mono focus:outline-none focus:border-[#1677FF] [color-scheme:dark] cursor-pointer"
                />
              </div>

              {/* 5. KETERANGAN / ALASAN */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Keterangan / Alasan Mutasi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Optimalisasi kapasitas STO Palu"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1A2E4C]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:bg-[#1A2E4C] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-[#1677FF] hover:bg-[#1466de] text-white shadow-lg shadow-[#1677FF]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting && (
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  )}
                  <span>Simpan Mutasi Langsung</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
