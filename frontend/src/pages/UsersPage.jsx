import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import TablePagination from "../components/TablePagination";

const DISTRICT_OPTIONS = [
  "PALU1",
  "PALU2",
  "PALU3",
  "DONGGALA",
  "SIGI",
  "PARIGI",
  "TOLITOLI",
  "BUOL",
];

// Helper warna avatar dinamis agar persis dengan palet referensi
const getAvatarColor = (name = "") => {
  const n = (name || "").trim().toLowerCase();
  if (n.startsWith("amalia")) return "bg-[#F59E0B]"; // Amber / Oranye
  if (n.startsWith("ahdayani")) return "bg-[#E11D48]"; // Rose / Merah muda
  if (n.startsWith("rizky")) return "bg-[#0891B2]"; // Teal / Cyan
  if (n.startsWith("jasmin")) return "bg-[#7C3AED]"; // Purple / Ungu
  if (n.startsWith("niki")) return "bg-[#059669]"; // Emerald / Hijau
  if (n.startsWith("test")) return "bg-[#1677FF]"; // Bright Blue

  const colors = [
    "bg-[#1677FF]", // Biru
    "bg-[#0891B2]", // Cyan/Teal
    "bg-[#F59E0B]", // Amber
    "bg-[#E11D48]", // Rose/Pink
    "bg-[#7C3AED]", // Ungu
    "bg-[#059669]", // Emerald
    "bg-[#6366F1]", // Indigo
    "bg-[#EA580C]", // Oranye
  ];
  let hash = 0;
  for (let i = 0; i < n.length; i++) {
    hash = n.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Helper format tanggal: YYYY-MM-DD HH:mm
const formatDateTime = (dateStr) => {
  if (!dateStr || dateStr === "-") return "-";
  const clean = String(dateStr).trim().replace("T", " ");
  const match = clean.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
  if (match) return match[1];
  return clean;
};

export default function UsersPage({ user: currentUser, searchValue = "", onSearchChange }) {
  const { isDark } = useTheme();

  // State Data Pengguna
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Search & Filter State
  const [localSearch, setLocalSearch] = useState(searchValue || "");
  const [roleFilter, setRoleFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");

  // Sorting & Pagination State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // View Mode: 'list' | 'register'
  const [viewMode, setViewMode] = useState("list");

  // Registration Form State
  const [regRole, setRegRole] = useState("karyawan_tif");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDistrict, setRegDistrict] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState("");

  // Modals State
  const [detailUser, setDetailUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", district: "", status: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState("");

  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Sync external search value
  useEffect(() => {
    if (searchValue !== undefined && searchValue !== localSearch) {
      setLocalSearch(searchValue);
    }
  }, [searchValue]);

  // Toast auto-hide
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        setErrorMsg("Akses ditolak. Fitur ini hanya dapat dibuka oleh Admin.");
        setLoading(false);
        return;
      }
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setErrorMsg(data.error || "Gagal memuat daftar pengguna.");
      }
    } catch {
      setErrorMsg("Terjadi gangguan koneksi ke server saat memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // District options gabungan default dan data dari server
  const districtOptions = useMemo(() => {
    const set = new Set(DISTRICT_OPTIONS);
    users.forEach((u) => {
      if (u.district && u.district.trim() && u.district !== "-") {
        set.add(u.district.trim());
      }
    });
    return Array.from(set).sort();
  }, [users]);

  // Handle Search Input Change
  const handleSearchChange = (val) => {
    setLocalSearch(val);
    if (onSearchChange) onSearchChange(val);
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    if (onSearchChange) onSearchChange("");
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = (localSearch || "").trim().toLowerCase();

      const statusLabel = u.status === "aktif" ? "aktif" : u.status === "pending" ? "pending menunggu" : "nonaktif";
      const roleLabel = u.role === "admin" ? "super admin" : u.role === "karyawan_tif" ? "karyawan tif" : "teknisi";

      const matchSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.district && u.district.toLowerCase().includes(q)) ||
        roleLabel.includes(q) ||
        (u.role && u.role.toLowerCase().includes(q)) ||
        statusLabel.includes(q) ||
        (u.status && u.status.toLowerCase().includes(q));

      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchDistrict = districtFilter === "all" || (u.district && u.district.toLowerCase() === districtFilter.toLowerCase());

      return matchSearch && matchRole && matchDistrict;
    });
  }, [users, localSearch, roleFilter, districtFilter]);

  // Interactive Sorting
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return { key: null, direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedUsers = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredUsers;
    const { key, direction } = sortConfig;
    return [...filteredUsers].sort((a, b) => {
      const valA = a[key] || "";
      const valB = b[key] || "";
      if (key === "created_at") {
        const timeA = new Date(valA).getTime() || 0;
        const timeB = new Date(valB).getTime() || 0;
        return direction === "asc" ? timeA - timeB : timeB - timeA;
      }
      const cmp = String(valA).localeCompare(String(valB), "id", { sensitivity: "base" });
      return direction === "asc" ? cmp : -cmp;
    });
  }, [filteredUsers, sortConfig]);

  // Reset pagination saat filter/search berubah
  useEffect(() => {
    setPage(1);
  }, [localSearch, roleFilter, districtFilter, sortConfig]);

  // Paginated Users
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedUsers.slice(start, start + perPage);
  }, [sortedUsers, page, perPage]);

  // Handle Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError("");

    if (!regName.trim() || !regEmail.trim() || !regDistrict || !regPassword) {
      setRegError("Semua field bertanda bintang (*) wajib diisi.");
      return;
    }

    if (regPassword.length < 8) {
      setRegError("Password awal minimal harus 8 karakter.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError("Konfirmasi password tidak sesuai.");
      return;
    }

    setRegSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          role: regRole,
          district: regDistrict,
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || `Akun ${regName} berhasil didaftarkan.`);
        setRegName("");
        setRegEmail("");
        setRegDistrict("");
        setRegPassword("");
        setRegConfirmPassword("");
        setViewMode("list");
        fetchUsers();
      } else {
        setRegError(data.error || "Gagal mendaftarkan user baru.");
      }
    } catch {
      setRegError("Terjadi kesalahan jaringan saat mendaftarkan user.");
    } finally {
      setRegSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (u) => {
    setEditUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      district: u.district === "-" ? "" : u.district,
      status: u.status,
    });
    setEditError("");
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setEditError("");

    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.district) {
      setEditError("Nama, Email, dan District wajib diisi.");
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || "Data user berhasil diperbarui.");
        setEditUser(null);
        fetchUsers();
      } else {
        setEditError(data.error || "Gagal memperbarui data user.");
      }
    } catch {
      setEditError("Terjadi kendala jaringan saat memperbarui data user.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetUser) return;
    setResetError("");

    if (!newPassword || newPassword.length < 8) {
      setResetError("Password baru minimal harus 8 karakter.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetUser.user_id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || `Password untuk ${resetUser.name} berhasil direset.`);
        setResetUser(null);
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setResetError(data.error || "Gagal mereset password pengguna.");
      }
    } catch {
      setResetError("Terjadi kendala koneksi saat mereset password.");
    } finally {
      setResetSubmitting(false);
    }
  };

  // Handle Quick Approve
  const handleApproveUser = async (u) => {
    try {
      const res = await fetch(`/api/admin/users/${u.user_id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || `Akun ${u.name} berhasil disetujui.`);
        fetchUsers();
      } else {
        alert(data.error || "Gagal menyetujui akun.");
      }
    } catch {
      alert("Terjadi kendala jaringan saat menyetujui akun.");
    }
  };

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!deleteUser) return;
    setDeleteError("");
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteUser.user_id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || `Pengguna ${deleteUser.name} berhasil dihapus.`);
        setDeleteUser(null);
        fetchUsers();
      } else {
        setDeleteError(data.error || "Gagal menghapus pengguna.");
      }
    } catch {
      setDeleteError("Terjadi gangguan koneksi ke server saat menghapus.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Helper password strength score
  const getPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const pwScore = getPasswordStrength(regPassword);

  return (
    <div className="space-y-5">
      {/* ── TOAST NOTIFICATION ── */}
      {successToast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-bounce-short ${
            isDark
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-emerald-50 border-emerald-300 text-emerald-800"
          }`}
        >
          <span className="material-symbols-outlined text-[20px] text-emerald-500">check_circle</span>
          <span className="text-sm font-medium">{successToast}</span>
          <button
            onClick={() => setSuccessToast("")}
            className={`ml-2 cursor-pointer transition-colors ${
              isDark ? "text-emerald-400 hover:text-emerald-200" : "text-emerald-600 hover:text-emerald-900"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* ── HEADER CARD PERSIS DENGAN REFERENSI (ADAPTIF DARK/LIGHT) ── */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-colors duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? "bg-[#061427] border-[#0d2746] shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
            : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Ikon Box Biru Solid Squircle */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#1677FF] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25 text-white">
            <span className="material-symbols-outlined text-[28px] sm:text-[32px]">
              group
            </span>
          </div>

          <div>
            <h1
              className={`text-xl sm:text-2xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Kelola User
            </h1>
            <p
              className={`text-xs sm:text-[13px] mt-1 ${
                isDark ? "text-[#7a94b3]" : "text-slate-500"
              }`}
            >
              Pusat kendali akun pengguna, otorisasi role, dan pendaftaran personil Telkom.
            </p>
          </div>
        </div>

        {/* Primary Action Button: Daftarkan User */}
        <div>
          {viewMode === "register" ? (
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setRegError("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                isDark
                  ? "bg-[#08182f] border-[#142e52] text-[#94A3B8] hover:text-white hover:border-[#1677FF]"
                  : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Kembali ke Daftar Akun</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-daftarkan-user"
              onClick={() => {
                setViewMode("register");
                setRegError("");
              }}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#1677FF] hover:bg-blue-600 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#1677FF]/25 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>Daftarkan User</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          MODE 1: FORMULIR DAFTARKAN USER (INTEGRATED FORM)
          ======================================================== */}
      {viewMode === "register" && (
        <div
          className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl ${
            isDark ? "bg-[#061427] border-[#0d2746]" : "bg-white border-slate-200"
          }`}
        >
          {/* Header Form */}
          <div
            className={`px-7 py-5 border-b flex items-center justify-between ${
              isDark ? "border-[#0f2747] bg-[#040e1c]/60" : "border-slate-100 bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isDark
                    ? "bg-[#1677FF]/20 border border-[#1677FF]/40 text-[#38BDF8]"
                    : "bg-blue-100 text-[#1677FF]"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">badge</span>
              </div>
              <div>
                <h2
                  className={`text-base font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Formulir Pendaftaran Pengguna Baru
                </h2>
                <p className={`text-xs ${isDark ? "text-[#7a94b3]" : "text-slate-500"}`}>
                  Akun yang dibuat Admin akan langsung berstatus aktif dan siap digunakan login
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? "text-[#64748B] hover:text-white hover:bg-[#08182f]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleRegisterSubmit} className="p-7 space-y-6">
            {regError && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                  isDark
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span>{regError}</span>
              </div>
            )}

            {/* 1. Pilih Role */}
            <div>
              <label
                className={`block text-[11px] font-bold uppercase tracking-wider mb-2.5 ${
                  isDark ? "text-[#7a94b3]" : "text-slate-600"
                }`}
              >
                Pilih Role Akun *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Opsi Karyawan TIF */}
                <div
                  onClick={() => setRegRole("karyawan_tif")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    regRole === "karyawan_tif"
                      ? isDark
                        ? "bg-[#1f143d] border-[#7c3aed] text-white ring-1 ring-[#7c3aed]"
                        : "bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-500"
                      : isDark
                      ? "bg-[#051122] border-[#0f2848] text-[#8fa0b5] hover:border-[#1677FF]/50"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      regRole === "karyawan_tif"
                        ? "bg-[#7c3aed] text-white"
                        : isDark
                        ? "bg-[#08182f] text-slate-400"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Karyawan TIF</span>
                      {regRole === "karyawan_tif" && (
                        <span className="material-symbols-outlined text-[18px] text-[#c084fc]">
                          check_circle
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isDark ? "text-[#7a94b3]" : "text-slate-500"}`}>
                      Akses mutasi langsung, manajemen modul, lokasi, dan perangkat
                    </p>
                  </div>
                </div>

                {/* Opsi Teknisi */}
                <div
                  onClick={() => setRegRole("teknisi")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    regRole === "teknisi"
                      ? isDark
                        ? "bg-[#072440] border-[#0ea5e9] text-white ring-1 ring-[#0ea5e9]"
                        : "bg-sky-50 border-sky-500 text-sky-900 ring-1 ring-sky-500"
                      : isDark
                      ? "bg-[#051122] border-[#0f2848] text-[#8fa0b5] hover:border-[#1677FF]/50"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      regRole === "teknisi"
                        ? "bg-[#0ea5e9] text-white"
                        : isDark
                        ? "bg-[#08182f] text-slate-400"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">build</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Teknisi</span>
                      {regRole === "teknisi" && (
                        <span className="material-symbols-outlined text-[18px] text-[#38BDF8]">
                          check_circle
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isDark ? "text-[#7a94b3]" : "text-slate-500"}`}>
                      Akses operasional lapangan view-only untuk data perangkat dan modul
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Baris Nama & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reg-name"
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                    isDark ? "text-[#7a94b3]" : "text-slate-600"
                  }`}
                >
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">
                    person
                  </span>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all outline-none ${
                      isDark
                        ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                    isDark ? "text-[#7a94b3]" : "text-slate-600"
                  }`}
                >
                  Email / Akun *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">
                    mail
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@telkom.co.id"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all outline-none ${
                      isDark
                        ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 3. District Penugasan */}
            <div>
              <label
                htmlFor="reg-district"
                className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                  isDark ? "text-[#7a94b3]" : "text-slate-600"
                }`}
              >
                District Penugasan *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">
                  location_on
                </span>
                <select
                  id="reg-district"
                  required
                  value={regDistrict}
                  onChange={(e) => setRegDistrict(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm transition-all outline-none cursor-pointer appearance-none ${
                    isDark
                      ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500"
                  }`}
                >
                  <option value="" disabled>
                    Pilih District Penugasan
                  </option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* 4. Password Awal & Konfirmasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reg-password"
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                    isDark ? "text-[#7a94b3]" : "text-slate-600"
                  }`}
                >
                  Password Awal *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">
                    lock
                  </span>
                  <input
                    id="reg-password"
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm transition-all outline-none ${
                      isDark
                        ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showRegPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>

                {/* Password strength bar */}
                <div className="flex gap-1.5 mt-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        pwScore >= step
                          ? pwScore <= 2
                            ? "bg-amber-400"
                            : "bg-emerald-500"
                          : isDark
                          ? "bg-[#0f2848]"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                    isDark ? "text-[#7a94b3]" : "text-slate-600"
                  }`}
                >
                  Konfirmasi Password *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">
                    lock_reset
                  </span>
                  <input
                    id="reg-confirm-password"
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password awal"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all outline-none ${
                      isDark
                        ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Tombol Aksi Form */}
            <div
              className={`pt-5 border-t flex items-center justify-end gap-3 ${
                isDark ? "border-[#0f2747]" : "border-slate-100"
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  isDark
                    ? "bg-[#051122] border-[#0f2848] text-[#8fa0b5] hover:text-white"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Batal / Kembali
              </button>
              <button
                type="submit"
                disabled={regSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1677FF] hover:bg-blue-600 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#1677FF]/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {regSubmitting ? "sync" : "person_add"}
                </span>
                <span>{regSubmitting ? "Menyimpan Akun..." : "Daftarkan User Sekarang"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODE 2: TABEL DAFTAR PENGGUNA (SESUAI GAMBAR REFERENSI)
          ======================================================== */}
      {viewMode === "list" && (
        <div
          className={`rounded-2xl border transition-colors duration-300 overflow-hidden ${
            isDark ? "bg-[#061427] border-[#0d2746] shadow-xl" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          {/* Bar Filter & Search */}
          <div className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Search Input dengan ikon search dan tombol clear 'X' */}
            <div className="relative w-full md:max-w-md lg:max-w-lg">
              <span
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] pointer-events-none ${
                  isDark ? "text-[#4d6686]" : "text-slate-400"
                }`}
              >
                search
              </span>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari nama, email, role, district, atau status..."
                className={`w-full pl-10 pr-9 py-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-all ${
                  isDark
                    ? "bg-[#051122] border-[#0f2848] text-white placeholder-[#4d6686] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                    : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white"
                }`}
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  title="Hapus pencarian"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${
                    isDark ? "text-[#4d6686] hover:text-white" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Dropdowns: Semua Role & Semua District */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Dropdown 1: Semua Role */}
              <div className="relative flex-1 md:w-44">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`w-full pl-3.5 pr-8 py-2.5 rounded-xl border text-xs sm:text-sm outline-none cursor-pointer appearance-none transition-all ${
                    isDark
                      ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500 focus:bg-white"
                  }`}
                >
                  <option value="all">Semua Role</option>
                  <option value="admin">Super Admin</option>
                  <option value="karyawan_tif">Karyawan TIF</option>
                  <option value="teknisi">Teknisi</option>
                </select>
                <span
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] pointer-events-none ${
                    isDark ? "text-[#4d6686]" : "text-slate-400"
                  }`}
                >
                  expand_more
                </span>
              </div>

              {/* Dropdown 2: Semua District */}
              <div className="relative flex-1 md:w-48">
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className={`w-full pl-3.5 pr-8 py-2.5 rounded-xl border text-xs sm:text-sm outline-none cursor-pointer appearance-none transition-all ${
                    isDark
                      ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500 focus:bg-white"
                  }`}
                >
                  <option value="all">Semua District</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <span
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] pointer-events-none ${
                    isDark ? "text-[#4d6686]" : "text-slate-400"
                  }`}
                >
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Loading or Error */}
          {loading ? (
            <div className={`p-16 text-center text-xs flex flex-col items-center justify-center gap-2 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}>
              <span className="material-symbols-outlined text-[32px] animate-spin text-[#1677FF]">
                sync
              </span>
              <span>Memuat data pengguna...</span>
            </div>
          ) : errorMsg ? (
            <div className={`p-10 text-center text-xs flex flex-col items-center justify-center gap-2 ${
              isDark ? "text-rose-400" : "text-rose-600"
            }`}>
              <span className="material-symbols-outlined text-[32px]">gpp_bad</span>
              <span>{errorMsg}</span>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className={`p-16 text-center text-xs flex flex-col items-center justify-center gap-2 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}>
              <span className="material-symbols-outlined text-[36px] text-slate-400">
                group_off
              </span>
              <span>Tidak ada akun pengguna yang sesuai dengan filter pencarian.</span>
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className={`border-t border-b text-[11px] font-bold uppercase tracking-wider ${
                      isDark
                        ? "border-[#0f2747] bg-[#061427] text-[#5b7699]"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {/* 1. NAMA & IDENTITAS (Tetap rata kiri) */}
                    <th className="py-3 px-5 text-left">
                      <button
                        type="button"
                        onClick={() => handleSort("name")}
                        className={`flex items-center gap-1.5 uppercase font-bold text-[11px] tracking-wider transition-colors cursor-pointer ${
                          isDark ? "hover:text-white" : "hover:text-slate-900"
                        }`}
                      >
                        <span>NAMA & IDENTITAS</span>
                        <span className="material-symbols-outlined text-[14px]">
                          {sortConfig.key === "name"
                            ? sortConfig.direction === "asc"
                              ? "arrow_upward"
                              : "arrow_downward"
                            : "unfold_more"}
                        </span>
                      </button>
                    </th>

                    {/* 2. ROLE (DITENGAHKAN) */}
                    <th className="py-3 px-4 text-center">
                      <span className="block text-center">ROLE</span>
                    </th>

                    {/* 3. DISTRICT (DITENGAHKAN) */}
                    <th className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleSort("district")}
                        className={`inline-flex items-center justify-center gap-1.5 uppercase font-bold text-[11px] tracking-wider transition-colors mx-auto cursor-pointer ${
                          isDark ? "hover:text-white" : "hover:text-slate-900"
                        }`}
                      >
                        <span>DISTRICT</span>
                        <span className="material-symbols-outlined text-[14px]">
                          {sortConfig.key === "district"
                            ? sortConfig.direction === "asc"
                              ? "arrow_upward"
                              : "arrow_downward"
                            : "unfold_more"}
                        </span>
                      </button>
                    </th>

                    {/* 4. STATUS (DITENGAHKAN) */}
                    <th className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleSort("status")}
                        className={`inline-flex items-center justify-center gap-1.5 uppercase font-bold text-[11px] tracking-wider transition-colors mx-auto cursor-pointer ${
                          isDark ? "hover:text-white" : "hover:text-slate-900"
                        }`}
                      >
                        <span>STATUS</span>
                        <span className="material-symbols-outlined text-[14px]">
                          {sortConfig.key === "status"
                            ? sortConfig.direction === "asc"
                              ? "arrow_upward"
                              : "arrow_downward"
                            : "unfold_more"}
                        </span>
                      </button>
                    </th>

                    {/* 5. DIBUAT PADA (DITENGAHKAN) */}
                    <th className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleSort("created_at")}
                        className={`inline-flex items-center justify-center gap-1.5 uppercase font-bold text-[11px] tracking-wider transition-colors mx-auto cursor-pointer ${
                          isDark ? "hover:text-white" : "hover:text-slate-900"
                        }`}
                      >
                        <span>DIBUAT PADA</span>
                        <span className="material-symbols-outlined text-[14px]">
                          {sortConfig.key === "created_at"
                            ? sortConfig.direction === "asc"
                              ? "arrow_upward"
                              : "arrow_downward"
                            : "unfold_more"}
                        </span>
                      </button>
                    </th>

                    {/* 6. AKSI (DITENGAHKAN) */}
                    <th className="py-3 px-4 text-center">
                      <span className="block text-center">AKSI</span>
                    </th>
                  </tr>
                </thead>

                <tbody
                  className={`divide-y text-xs ${
                    isDark ? "divide-[#0d213b]" : "divide-slate-200"
                  }`}
                >
                  {paginatedUsers.map((u) => {
                    const isSelf = currentUser && currentUser.id === u.user_id;
                    const avatarBg = getAvatarColor(u.name);
                    const initial = (u.name || "U").trim()[0].toUpperCase();

                    return (
                      <tr
                        key={u.user_id}
                        className={`transition-colors ${
                          isDark ? "hover:bg-[#0b213d]/60" : "hover:bg-slate-50/80 even:bg-slate-50/30"
                        }`}
                      >
                        {/* 1. Nama & Identitas (Rata Kiri) */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-sm ${avatarBg}`}
                            >
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-semibold text-[13px] truncate max-w-[190px] sm:max-w-[240px] ${
                                    isDark ? "text-white" : "text-slate-900"
                                  }`}
                                >
                                  {u.name}
                                </span>
                                {isSelf && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                      isDark
                                        ? "bg-[#1677FF]/20 text-[#38BDF8]"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[11px] block truncate max-w-[190px] sm:max-w-[240px] mt-0.5 ${
                                  isDark ? "text-[#5d799b]" : "text-slate-500"
                                }`}
                              >
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Role Badge (DITENGAHKAN) */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            {u.role === "admin" && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                  isDark
                                    ? "bg-[#2d153d] border-[#7e22ce] text-[#F472B6]"
                                    : "bg-purple-50 border-purple-200 text-purple-700"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[14px]">shield_person</span>
                                <span>Super Admin</span>
                              </span>
                            )}
                            {u.role === "karyawan_tif" && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                  isDark
                                    ? "bg-[#1f143d] border-[#5521b5] text-[#C084FC]"
                                    : "bg-indigo-50 border-indigo-200 text-indigo-700"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[14px]">person</span>
                                <span>Karyawan TIF</span>
                              </span>
                            )}
                            {u.role === "teknisi" && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                  isDark
                                    ? "bg-[#072440] border-[#0d538e] text-[#38BDF8]"
                                    : "bg-sky-50 border-sky-200 text-sky-700"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[14px]">build</span>
                                <span>Teknisi</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. District (DITENGAHKAN) */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <span
                              className={`material-symbols-outlined text-[16px] ${
                                isDark ? "text-[#4c678a]" : "text-slate-400"
                              }`}
                            >
                              location_on
                            </span>
                            <span
                              className={`text-xs font-medium uppercase ${
                                isDark ? "text-[#829bb8]" : "text-slate-700"
                              }`}
                            >
                              {u.district || "-"}
                            </span>
                          </div>
                        </td>

                        {/* 4. Status (DITENGAHKAN) */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            {u.status === "aktif" && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                  isDark
                                    ? "bg-[#062420] border-[#0d544b] text-[#10B981]"
                                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>
                                <span>Aktif</span>
                              </span>
                            )}
                            {u.status === "pending" && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                  isDark
                                    ? "bg-[#2b1f0e] border-[#6b4713] text-[#F59E0B]"
                                    : "bg-amber-50 border-amber-200 text-amber-700"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B] animate-pulse"></span>
                                <span>Pending</span>
                              </span>
                            )}
                            {u.status === "nonaktif" && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                  isDark
                                    ? "bg-[#2c1017] border-[#6d1b28] text-[#EF4444]"
                                    : "bg-rose-50 border-rose-200 text-rose-700"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]"></span>
                                <span>Nonaktif</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Dibuat Pada (DITENGAHKAN) */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <span
                            className={`text-xs font-mono ${
                              isDark ? "text-[#6d88a9]" : "text-slate-600"
                            }`}
                          >
                            {formatDateTime(u.created_at)}
                          </span>
                        </td>

                        {/* 6. Aksi (DITENGAHKAN, IKON LEBIH KECIL & MENGIKUTI WARNA HALAMAN PERANGKAT) */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-nowrap shrink-0 mx-auto">
                            {/* Tombol Cepat Setujui jika akun pending */}
                            {u.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => handleApproveUser(u)}
                                title="Setujui Akun"
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                              >
                                <span className="material-symbols-outlined text-[13px]">check</span>
                                <span>Setujui</span>
                              </button>
                            )}

                            {/* 1. Detail / View (Eye) - Mengikuti warna cyan/teal di halaman perangkat */}
                            <button
                              type="button"
                              onClick={() => setDetailUser(u)}
                              title="Lihat Detail Akun"
                              className={`w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                                isDark
                                  ? "bg-[#07383E] hover:bg-[#0A4E57] text-[#00E5FF] border-[#0A545E]"
                                  : "bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[15px] leading-none select-none flex items-center justify-center pointer-events-none">
                                visibility
                              </span>
                            </button>

                            {/* 2. Edit (Pencil) - Mengikuti warna amber/kuning di halaman perangkat */}
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              title="Edit Pengguna"
                              className={`w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                                isDark
                                  ? "bg-[#3D2C0D] hover:bg-[#523B11] text-[#FBBF24] border-[#5E4413]"
                                  : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[15px] leading-none select-none flex items-center justify-center pointer-events-none">
                                edit
                              </span>
                            </button>

                            {/* 3. Reset Password (Key) - Nuansa indigo/purple serasi */}
                            <button
                              type="button"
                              onClick={() => {
                                setResetUser(u);
                                setNewPassword("");
                                setConfirmNewPassword("");
                                setResetError("");
                              }}
                              title="Reset Password Akun"
                              className={`w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                                isDark
                                  ? "bg-[#241A4C] hover:bg-[#34266D] text-[#A78BFA] border-[#3B2C78]"
                                  : "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[15px] leading-none select-none flex items-center justify-center pointer-events-none">
                                key
                              </span>
                            </button>

                            {/* 4. Delete (Trash) - Mengikuti warna rose/merah di halaman perangkat */}
                            {!isSelf ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteUser(u);
                                  setDeleteError("");
                                }}
                                title="Hapus Akun Pengguna"
                                className={`w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                                  isDark
                                    ? "bg-[#3C1318] hover:bg-[#541B22] text-[#F43F5E] border-[#5C1D25]"
                                    : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[15px] leading-none select-none flex items-center justify-center pointer-events-none">
                                  delete
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                title="Tidak dapat menghapus akun Anda sendiri"
                                className={`w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] p-0 shrink-0 rounded-lg flex items-center justify-center border cursor-not-allowed opacity-30 ${
                                  isDark
                                    ? "bg-slate-800/40 border-slate-700 text-slate-500"
                                    : "bg-slate-100 border-slate-200 text-slate-400"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[15px] leading-none select-none flex items-center justify-center pointer-events-none">
                                  delete
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination */}
          {!loading && sortedUsers.length > 0 && (
            <div className="px-5 pb-4">
              <TablePagination
                page={page}
                perPage={perPage}
                totalCount={sortedUsers.length}
                onPageChange={setPage}
                onPerPageChange={(newPerPage) => {
                  setPerPage(newPerPage);
                  setPage(1);
                }}
                isDark={isDark}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL 1: DETAIL PENGGUNA (ADAPTIF DARK & LIGHT MODE)
          ======================================================== */}
      {detailUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDetailUser(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark
                ? "bg-[#061427] border-[#0d2746] text-[#E6EDF7]"
                : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between pb-4 border-b ${
                isDark ? "border-[#0f2747]" : "border-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDark
                      ? "bg-[#1677FF]/20 border border-[#1677FF]/40 text-[#38BDF8]"
                      : "bg-blue-50 border border-blue-200 text-blue-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">account_circle</span>
                </div>
                <div>
                  <h3 className="text-base font-bold">Detail Akun Pengguna</h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Informasi profil dan penugasan personil
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailUser(null)}
                className={`cursor-pointer transition-colors ${
                  isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-5 space-y-3.5 text-xs">
              <div
                className={`flex justify-between py-1.5 border-b ${
                  isDark ? "border-slate-800/40" : "border-slate-100"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>ID Pengguna</span>
                <span className="font-mono font-semibold">#{detailUser.user_id}</span>
              </div>
              <div
                className={`flex justify-between py-1.5 border-b ${
                  isDark ? "border-slate-800/40" : "border-slate-100"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>Nama Lengkap</span>
                <span className="font-semibold">{detailUser.name}</span>
              </div>
              <div
                className={`flex justify-between py-1.5 border-b ${
                  isDark ? "border-slate-800/40" : "border-slate-100"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>Email Akun</span>
                <span className="font-mono font-semibold">{detailUser.email}</span>
              </div>
              <div
                className={`flex justify-between py-1.5 border-b ${
                  isDark ? "border-slate-800/40" : "border-slate-100"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>Role Otorisasi</span>
                <span className="font-semibold capitalize">{detailUser.role}</span>
              </div>
              <div
                className={`flex justify-between py-1.5 border-b ${
                  isDark ? "border-slate-800/40" : "border-slate-100"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>District Penugasan</span>
                <span className="font-semibold">{detailUser.district || "-"}</span>
              </div>
              <div
                className={`flex justify-between py-1.5 border-b ${
                  isDark ? "border-slate-800/40" : "border-slate-100"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>Status Akun</span>
                <span className="font-semibold capitalize">{detailUser.status}</span>
              </div>
              <div
                className={`flex justify-between py-1.5 border-b ${
                  isDark ? "border-slate-800/40" : "border-slate-100"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>Tanggal Didaftarkan</span>
                <span className="font-mono">{formatDateTime(detailUser.created_at)}</span>
              </div>
              <div
                className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-center gap-2.5 ${
                  isDark
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-300"
                    : "bg-blue-50 border-blue-200 text-blue-700"
                }`}
              >
                <span className="material-symbols-outlined text-[18px] text-[#1677FF]">shield_locked</span>
                <span>Password dienkripsi secara aman dan tidak dapat dilihat oleh siapa pun demi privasi akun.</span>
              </div>
            </div>

            <div
              className={`pt-3 border-t flex justify-end ${
                isDark ? "border-[#0f2747]" : "border-slate-100"
              }`}
            >
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="px-5 py-2 rounded-xl bg-[#1677FF] text-white text-xs font-semibold hover:bg-blue-600 cursor-pointer shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: EDIT PENGGUNA (ADAPTIF DARK & LIGHT MODE)
          ======================================================== */}
      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setEditUser(null)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark
                ? "bg-[#061427] border-[#0d2746] text-[#E6EDF7]"
                : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between pb-4 border-b ${
                isDark ? "border-[#0f2747]" : "border-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDark
                      ? "bg-[#1677FF]/20 border border-[#1677FF]/40 text-[#38BDF8]"
                      : "bg-blue-50 border border-blue-200 text-blue-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                </div>
                <div>
                  <h3 className="text-base font-bold">Edit Akun Pengguna</h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Ubah informasi akun #{editUser.user_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditUser(null)}
                className={`cursor-pointer transition-colors ${
                  isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {editError && (
              <div
                className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  isDark
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="py-5 space-y-4 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs sm:text-sm ${
                    isDark
                      ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white"
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Email Akun *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs sm:text-sm ${
                    isDark
                      ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Role Otorisasi *
                  </label>
                  <select
                    value={editForm.role}
                    disabled={currentUser && currentUser.id === editUser.user_id}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs sm:text-sm cursor-pointer ${
                      isDark
                        ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500"
                    }`}
                  >
                    <option value="admin">Super Admin</option>
                    <option value="karyawan_tif">Karyawan TIF</option>
                    <option value="teknisi">Teknisi</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Status Akun *
                  </label>
                  <select
                    value={editForm.status}
                    disabled={currentUser && currentUser.id === editUser.user_id}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs sm:text-sm cursor-pointer ${
                      isDark
                        ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500"
                    }`}
                  >
                    <option value="aktif">Aktif</option>
                    <option value="pending">Pending</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  District Penugasan *
                </label>
                <select
                  value={editForm.district}
                  onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs sm:text-sm cursor-pointer ${
                    isDark
                      ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500"
                  }`}
                >
                  <option value="" disabled>
                    Pilih District
                  </option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`pt-4 border-t flex justify-end gap-2.5 ${
                  isDark ? "border-[#0f2747]" : "border-slate-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className={`px-4 py-2 rounded-xl border cursor-pointer ${
                    isDark
                      ? "border-slate-600 text-slate-400 hover:text-white"
                      : "border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#1677FF] text-white font-semibold hover:bg-blue-600 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {editSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: RESET PASSWORD (ADAPTIF DARK & LIGHT MODE)
          ======================================================== */}
      {resetUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setResetUser(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark
                ? "bg-[#061427] border-[#0d2746] text-[#E6EDF7]"
                : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between pb-4 border-b ${
                isDark ? "border-[#0f2747]" : "border-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDark
                      ? "bg-[#6366F1]/20 border border-[#6366F1]/40 text-[#A78BFA]"
                      : "bg-purple-50 border border-purple-200 text-purple-700"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">key</span>
                </div>
                <div>
                  <h3 className="text-base font-bold">Reset Password Pengguna</h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Tetapkan password baru untuk {resetUser.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetUser(null)}
                className={`cursor-pointer transition-colors ${
                  isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {resetError && (
              <div
                className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  isDark
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="py-5 space-y-4 text-xs">
              <div
                className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                  isDark
                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                    : "bg-purple-50 border-purple-200 text-purple-700"
                }`}
              >
                Password lama pengguna tidak dapat dilihat dan langsung digantikan dengan password baru
                yang di-hash sebelum disimpan.
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Password Baru *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none pr-10 text-xs sm:text-sm ${
                      isDark
                        ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showNewPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Konfirmasi Password Baru *
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs sm:text-sm ${
                    isDark
                      ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white"
                  }`}
                />
              </div>

              <div
                className={`pt-4 border-t flex justify-end gap-2.5 ${
                  isDark ? "border-[#0f2747]" : "border-slate-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className={`px-4 py-2 rounded-xl border cursor-pointer ${
                    isDark
                      ? "border-slate-600 text-slate-400 hover:text-white"
                      : "border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#6366F1] text-white font-bold hover:bg-indigo-600 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {resetSubmitting ? "Mereset..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: HAPUS PENGGUNA (ADAPTIF DARK & LIGHT MODE)
          ======================================================== */}
      {deleteUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDeleteUser(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark
                ? "bg-[#061427] border-[#0d2746] text-[#E6EDF7]"
                : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center gap-3 pb-4 border-b ${
                isDark ? "border-[#0f2747]" : "border-slate-100"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark
                    ? "bg-rose-500/20 border border-rose-500/40 text-rose-400"
                    : "bg-rose-50 border border-rose-200 text-rose-600"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Konfirmasi Hapus Pengguna</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            {deleteError && (
              <div
                className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  isDark
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{deleteError}</span>
              </div>
            )}

            <div className="py-5 text-xs space-y-3 leading-relaxed">
              <p>
                Apakah Anda yakin ingin menghapus akun pengguna <strong>{deleteUser.name}</strong> (
                {deleteUser.email})?
              </p>
              <div
                className={`p-3 rounded-xl border text-[11px] ${
                  isDark
                    ? "bg-[#051122] border-[#0f2848] text-slate-400"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                💡 <strong>Catatan Integritas:</strong> Sistem akan memeriksa apakah pengguna memiliki
                riwayat transaksi modul, mutasi, atau audit log. Jika ada, penghapusan permanen akan
                dicegah agar riwayat audit sistem tetap utuh.
              </div>
            </div>

            <div
              className={`pt-4 border-t flex justify-end gap-2.5 text-xs ${
                isDark ? "border-[#0f2747]" : "border-slate-100"
              }`}
            >
              <button
                type="button"
                onClick={() => setDeleteUser(null)}
                className={`px-4 py-2 rounded-xl border cursor-pointer ${
                  isDark
                    ? "border-slate-600 text-slate-400 hover:text-white"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDeleteSubmit}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {deleteSubmitting ? "Memeriksa & Menghapus..." : "Ya, Hapus Pengguna"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
