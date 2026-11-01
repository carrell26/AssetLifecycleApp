import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import TablePagination from "../components/TablePagination";
import ModalPortal from "../components/ModalPortal";
import TableSortHeader from "../components/TableSortHeader";
import kelolaUserBanner from "../assets/kelola_user_banner.svg";

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

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "Semua Role" },
  { value: "admin", label: "Super Admin" },
  { value: "karyawan_tif", label: "Karyawan TIF" },
  { value: "teknisi", label: "Teknisi" },
];

const EDIT_ROLE_OPTIONS = [
  { value: "karyawan_tif", label: "Karyawan TIF", icon: "badge" },
  { value: "teknisi", label: "Teknisi", icon: "engineering" },
];

const EDIT_STATUS_OPTIONS = [
  { value: "aktif", label: "Aktif", dotColor: "bg-emerald-400" },
  { value: "pending", label: "Pending", dotColor: "bg-amber-400" },
  { value: "nonaktif", label: "Nonaktif", dotColor: "bg-rose-400" },
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
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [regDistrictDropdownOpen, setRegDistrictDropdownOpen] = useState(false);
  const [editRoleDropdownOpen, setEditRoleDropdownOpen] = useState(false);
  const [editStatusDropdownOpen, setEditStatusDropdownOpen] = useState(false);
  const [editDistrictDropdownOpen, setEditDistrictDropdownOpen] = useState(false);

  const roleDropdownRef = useRef(null);
  const districtDropdownRef = useRef(null);
  const regDistrictDropdownRef = useRef(null);
  const editRoleDropdownRef = useRef(null);
  const editStatusDropdownRef = useRef(null);
  const editDistrictDropdownRef = useRef(null);

  // Close dropdowns when clicked outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(e.target)
      ) {
        setRoleDropdownOpen(false);
      }
      if (
        districtDropdownRef.current &&
        !districtDropdownRef.current.contains(e.target)
      ) {
        setDistrictDropdownOpen(false);
      }
      if (
        regDistrictDropdownRef.current &&
        !regDistrictDropdownRef.current.contains(e.target)
      ) {
        setRegDistrictDropdownOpen(false);
      }
      if (
        editRoleDropdownRef.current &&
        !editRoleDropdownRef.current.contains(e.target)
      ) {
        setEditRoleDropdownOpen(false);
      }
      if (
        editStatusDropdownRef.current &&
        !editStatusDropdownRef.current.contains(e.target)
      ) {
        setEditStatusDropdownOpen(false);
      }
      if (
        editDistrictDropdownRef.current &&
        !editDistrictDropdownRef.current.contains(e.target)
      ) {
        setEditDistrictDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

    // Auto-sync saat window fokus kembali agar pembaruan foto profil selalu terkini
    const handleFocus = () => {
      fetchUsers();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Sinkronisasi otomatis secara instan jika currentUser mengganti foto profil via AvatarModal
  useEffect(() => {
    if (currentUser?.avatar_url) {
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          const isCurrent =
            (currentUser.id && u.user_id === currentUser.id) ||
            (currentUser.user_id && u.user_id === currentUser.user_id);
          if (isCurrent && u.avatar_url !== currentUser.avatar_url) {
            return { ...u, avatar_url: currentUser.avatar_url };
          }
          return u;
        })
      );
    }
  }, [currentUser?.avatar_url]);

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
      let valA = a[key] || "";
      let valB = b[key] || "";
      if (key === "created_at") {
        const timeA = new Date(valA).getTime() || 0;
        const timeB = new Date(valB).getTime() || 0;
        return direction === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (key === "role") {
        const roleLabels = { admin: "Super Admin", karyawan_tif: "Karyawan TIF", teknisi: "Teknisi" };
        valA = roleLabels[a.role] || a.role || "";
        valB = roleLabels[b.role] || b.role || "";
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
    setEditRoleDropdownOpen(false);
    setEditStatusDropdownOpen(false);
    setEditDistrictDropdownOpen(false);
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
    <div className="space-y-6 !mt-0 w-full" style={{ marginTop: 0 }}>
      {/* ── TOAST NOTIFICATION ── */}
      {successToast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-bounce-short ${isDark
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
            : "bg-emerald-50 border-emerald-300 text-emerald-800"
            }`}
        >
          <span className="material-symbols-outlined text-[20px] text-emerald-500">check_circle</span>
          <span className="text-sm font-medium">{successToast}</span>
          <button
            onClick={() => setSuccessToast("")}
            className={`ml-2 cursor-pointer transition-colors ${isDark ? "text-emerald-400 hover:text-emerald-200" : "text-emerald-600 hover:text-emerald-900"
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* ── HEADER HERO BANNER KELOLA USER (STRICTLY LOCKED TO 120px MATCHING DASHBOARD) ── */}
      <div
        className={`relative overflow-hidden rounded-2xl border px-5 sm:px-6 h-[120px] min-h-[120px] max-h-[120px] flex items-center justify-between transition-all duration-300 shadow-sm !mt-0 ${isDark
          ? "border-[#1E3A5F] bg-[#0A182B] shadow-2xl"
          : "border-slate-200 bg-white shadow-sm"
          }`}
        style={{ marginTop: 0, height: "120px", minHeight: "120px", maxHeight: "120px" }}
      >
        {/* Glow ambient background circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 w-full">
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
            {/* Ikon Box Mengikuti Style Halaman Audit Log */}
            <div
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border ${isDark
                ? "bg-gradient-to-br from-[#1677FF]/40 to-[#0A2540] border-[#38BDF8]/40 shadow-[0_0_24px_rgba(22,119,255,0.45)] text-[#38BDF8]"
                : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm text-blue-600"
                }`}
            >
              <span className="material-symbols-outlined text-[26px] sm:text-[30px]">
                manage_accounts
              </span>
            </div>

            <div>
              <h1
                className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 !m-0 ${isDark ? "text-white" : "text-slate-900"
                  }`}
              >
                Kelola User
              </h1>
              <p
                className={`text-xs font-normal mt-0.5 leading-relaxed !m-0 whitespace-nowrap ${isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
              >
                Pusat kendali akun pengguna, otorisasi role, dan pendaftaran personil TIF.
              </p>
            </div>
          </div>

          {/* Tengah: Ilustrasi Vector SVG Banner Kelola User Berukuran Besar & Rapi di Dalam Box 120px */}
          <div className="hidden md:flex items-center justify-center flex-1 px-2 select-none pointer-events-none h-full overflow-hidden">
            <img
              src={kelolaUserBanner}
              alt="Kelola User Vector Illustration"
              className="h-[108px] lg:h-[114px] w-auto max-h-[114px] object-contain drop-shadow-[0_8px_20px_rgba(22,119,255,0.25)] dark:drop-shadow-[0_0_28px_rgba(56,189,248,0.5)] transition-all duration-300 pointer-events-none select-none"
            />
          </div>

          {/* Primary Action Button: Daftarkan User / Kembali */}
          <div className="shrink-0 w-full sm:w-auto flex justify-end">
            {viewMode === "register" ? (
              <button
                type="button"
                onClick={() => {
                  setViewMode("list");
                  setRegError("");
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-[#1677FF] hover:bg-blue-600 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#1677FF]/25 hover:shadow-[#1677FF]/40 transition-all duration-150 cursor-pointer !m-0"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
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
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-[#1677FF] hover:bg-blue-600 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#1677FF]/25 hover:shadow-[#1677FF]/40 transition-all duration-150 cursor-pointer !m-0"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                <span>Daftarkan User</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          MODE 1: FORMULIR DAFTARKAN USER (INTEGRATED FORM)
          ======================================================== */}
      {viewMode === "register" && (
        <div
          className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl ${isDark ? "bg-[#061427] border-[#0d2746]" : "bg-white border-slate-200"
            }`}
        >
          {/* Header Form */}
          <div
            className={`px-7 py-5 border-b flex items-center justify-between ${isDark ? "border-[#0f2747] bg-[#040e1c]/60" : "border-slate-100 bg-slate-50"
              }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark
                  ? "bg-[#1677FF]/20 border border-[#1677FF]/40 text-[#38BDF8]"
                  : "bg-blue-100 text-[#1677FF]"
                  }`}
              >
                <span className="material-symbols-outlined text-[22px]">badge</span>
              </div>
              <div>
                <h2
                  className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"
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
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? "text-[#64748B] hover:text-white hover:bg-[#08182f]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                }`}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleRegisterSubmit} className="p-7 space-y-6">
            {regError && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${isDark
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
                className={`block text-[11px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? "text-[#7a94b3]" : "text-slate-600"
                  }`}
              >
                Pilih Role Akun *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Opsi Karyawan TIF */}
                <div
                  onClick={() => setRegRole("karyawan_tif")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${regRole === "karyawan_tif"
                    ? isDark
                      ? "bg-[#1f143d] border-[#7c3aed] text-white ring-1 ring-[#7c3aed]"
                      : "bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-500"
                    : isDark
                      ? "bg-[#051122] border-[#0f2848] text-[#8fa0b5] hover:border-[#1677FF]/50"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${regRole === "karyawan_tif"
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
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${regRole === "teknisi"
                    ? isDark
                      ? "bg-[#072440] border-[#0ea5e9] text-white ring-1 ring-[#0ea5e9]"
                      : "bg-sky-50 border-sky-500 text-sky-900 ring-1 ring-sky-500"
                    : isDark
                      ? "bg-[#051122] border-[#0f2848] text-[#8fa0b5] hover:border-[#1677FF]/50"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${regRole === "teknisi"
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
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-[#7a94b3]" : "text-slate-600"
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
                    placeholder="Masukkan nama"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all outline-none ${isDark
                      ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white"
                      }`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-[#7a94b3]" : "text-slate-600"
                    }`}
                >
                  Email *
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
                    placeholder="Masukkan email"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all outline-none ${isDark
                      ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white"
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* 3. District (Style Popup Menu Konsisten dengan Halaman Export) */}
            <div>
              <label
                htmlFor="reg-district-btn"
                className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-[#7a94b3]" : "text-slate-600"
                  }`}
              >
                District *
              </label>
              <div className="relative" ref={regDistrictDropdownRef}>
                <button
                  type="button"
                  id="reg-district-btn"
                  onClick={() => setRegDistrictDropdownOpen((prev) => !prev)}
                  className={`relative w-full h-11 pl-10 pr-9 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer outline-none ${isDark
                    ? "bg-[#051122] border-[#0f2848] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#071933]"
                    : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500 focus:bg-white"
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#38BDF8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none select-none">
                    location_on
                  </span>
                  <span className={`truncate font-semibold ${!regDistrict ? (isDark ? "text-slate-400" : "text-slate-500") : ""}`}>
                    {regDistrict || "Pilih District"}
                  </span>
                  <span
                    className={`material-symbols-outlined text-[18px] text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none select-none transition-transform duration-200 ${regDistrictDropdownOpen ? "rotate-180" : ""
                      }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Pop-up Menu Dropdown District (Style Konsisten Export Page) */}
                {regDistrictDropdownOpen && (
                  <div
                    className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl z-40 backdrop-blur-md overflow-hidden ${isDark
                      ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                      : "bg-white border-slate-200 text-slate-800 shadow-xl"
                      }`}
                  >
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                      {districtOptions.map((d) => {
                        const isSelected = regDistrict === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              setRegDistrict(d);
                              setRegDistrictDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${isSelected
                              ? isDark
                                ? "bg-[#1677FF] text-white font-semibold"
                                : "bg-blue-600 text-white font-semibold"
                              : isDark
                                ? "hover:bg-[#122846] text-[#CBD5E1]"
                                : "hover:bg-slate-100 text-slate-700"
                              }`}
                          >
                            <span className="truncate pr-2">{d}</span>
                            {isSelected && (
                              <span className="material-symbols-outlined text-[16px] shrink-0">
                                check
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Hidden Native Select untuk Kompatibilitas Form & Testing */}
                <select
                  id="reg-district"
                  name="district"
                  value={regDistrict}
                  onChange={(e) => setRegDistrict(e.target.value)}
                  required
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <option value="" disabled>Pilih District</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Password Awal & Konfirmasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reg-password"
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-[#7a94b3]" : "text-slate-600"
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
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm transition-all outline-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${isDark
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
                      className={`h-1 flex-1 rounded-full transition-colors ${pwScore >= step
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
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-[#7a94b3]" : "text-slate-600"
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
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all outline-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${isDark
                      ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500"
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* Tombol Aksi Form */}
            <div
              className={`pt-5 border-t flex items-center justify-end gap-3 ${isDark ? "border-[#0f2747]" : "border-slate-100"
                }`}
            >
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${isDark
                  ? "bg-[#051122] border-[#0f2848] text-[#8fa0b5] hover:text-white"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={regSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1677FF] hover:bg-blue-600 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#1677FF]/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {regSubmitting ? "sync" : "person_add"}
                </span>
                <span>{regSubmitting ? "Menyimpan Akun..." : "Daftarkan User"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODE 2: TABEL DAFTAR PENGGUNA (SESUAI STANDAR AUDIT LOG)
          ======================================================== */}
      {viewMode === "list" && (
        <div
          className={`rounded-2xl border transition-all duration-300 overflow-visible w-full ${isDark
            ? "border-[#162F52] bg-[#0A182B] shadow-2xl"
            : "border-slate-200 bg-white shadow-sm"
            }`}
        >
          {/* Controls Toolbar: Search & Dropdowns dengan Top Border Separator */}
          <div
            className={`p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 border-b ${isDark ? "border-[#142D4C]" : "border-slate-100"
              }`}
          >
            {/* Search Input dengan ikon search dan tombol clear 'X' */}
            <div className="relative w-full md:max-w-md lg:max-w-lg">
              <span
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] pointer-events-none ${isDark ? "text-[#4d6686]" : "text-slate-400"
                  }`}
              >
                search
              </span>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari nama, email, role, district, atau status..."
                className={`w-full h-11 pl-10 pr-9 rounded-xl border text-xs sm:text-sm outline-none transition-all ${isDark
                  ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] placeholder-[#4d6686] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white"
                  }`}
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  title="Hapus pencarian"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${isDark ? "text-[#4d6686] hover:text-white" : "text-slate-400 hover:text-slate-700"
                    }`}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Dropdowns: Semua Role & Semua District */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {/* Filter Dropdown 1: Semua Role */}
              <div className="relative min-w-[170px]" ref={roleDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setRoleDropdownOpen(!roleDropdownOpen);
                    setDistrictDropdownOpen(false);
                  }}
                  className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${isDark
                    ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                    : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500"
                    }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="material-symbols-outlined text-[18px] text-[#38BDF8] shrink-0">
                      badge
                    </span>
                    <span className="truncate font-semibold">
                      {ROLE_FILTER_OPTIONS.find((r) => r.value === roleFilter)?.label || "Semua Role"}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${roleDropdownOpen ? "rotate-180" : ""
                      }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Menu Dropdown Role */}
                {roleDropdownOpen && (
                  <div
                    className={`absolute left-0 top-12 mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-30 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md ${isDark
                      ? "bg-[#0A182B]/95 border-[#1E3A5F] text-[#E6EDF7]"
                      : "bg-white border-slate-200 text-slate-800 shadow-xl"
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setRoleFilter("all");
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${roleFilter === "all"
                        ? isDark
                          ? "bg-[#1677FF] text-white"
                          : "bg-blue-600 text-white"
                        : isDark
                          ? "hover:bg-[#122846] text-[#CBD5E1]"
                          : "hover:bg-slate-100 text-slate-700"
                        }`}
                    >
                      <span>Semua Role</span>
                      {roleFilter === "all" && (
                        <span className="material-symbols-outlined text-[16px] shrink-0">
                          check
                        </span>
                      )}
                    </button>

                    <div className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"}`} />

                    {ROLE_FILTER_OPTIONS.filter((r) => r.value !== "all").map((opt) => {
                      const isSelected = roleFilter === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setRoleFilter(opt.value);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${isSelected
                            ? isDark
                              ? "bg-[#1677FF] text-white"
                              : "bg-blue-600 text-white"
                            : isDark
                              ? "hover:bg-[#122846] text-[#CBD5E1]"
                              : "hover:bg-slate-100 text-slate-700"
                            }`}
                        >
                          <span className="truncate pr-2">{opt.label}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[16px] shrink-0">
                              check
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Filter Dropdown 2: Semua District */}
              <div className="relative min-w-[170px]" ref={districtDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setDistrictDropdownOpen(!districtDropdownOpen);
                    setRoleDropdownOpen(false);
                  }}
                  className={`relative w-full h-11 px-4 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${isDark
                    ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#0E2038]"
                    : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500"
                    }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="material-symbols-outlined text-[18px] text-[#38BDF8] shrink-0">
                      location_on
                    </span>
                    <span className="truncate font-semibold">
                      {districtFilter !== "all" ? districtFilter : "Semua District"}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${districtDropdownOpen ? "rotate-180" : ""
                      }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Menu Dropdown District */}
                {districtDropdownOpen && (
                  <div
                    className={`absolute left-0 top-12 mt-1.5 w-full rounded-xl border shadow-2xl p-1.5 z-30 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md ${isDark
                      ? "bg-[#0A182B]/95 border-[#1E3A5F] text-[#E6EDF7]"
                      : "bg-white border-slate-200 text-slate-800 shadow-xl"
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDistrictFilter("all");
                        setDistrictDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${districtFilter === "all"
                        ? isDark
                          ? "bg-[#1677FF] text-white"
                          : "bg-blue-600 text-white"
                        : isDark
                          ? "hover:bg-[#122846] text-[#CBD5E1]"
                          : "hover:bg-slate-100 text-slate-700"
                        }`}
                    >
                      <span>Semua District</span>
                      {districtFilter === "all" && (
                        <span className="material-symbols-outlined text-[16px] shrink-0">
                          check
                        </span>
                      )}
                    </button>

                    <div className={`h-px my-1 ${isDark ? "bg-[#1A3358]" : "bg-slate-100"}`} />

                    {districtOptions.map((d) => {
                      const isSelected = districtFilter === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setDistrictFilter(d);
                            setDistrictDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${isSelected
                            ? isDark
                              ? "bg-[#1677FF] text-white"
                              : "bg-blue-600 text-white"
                            : isDark
                              ? "hover:bg-[#122846] text-[#CBD5E1]"
                              : "hover:bg-slate-100 text-slate-700"
                            }`}
                        >
                          <span className="truncate pr-2">{d}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[16px] shrink-0">
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

          {/* Loading or Error */}
          {loading ? (
            <div className={`p-16 text-center text-xs flex flex-col items-center justify-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"
              }`}>
              <span className="material-symbols-outlined text-[32px] animate-spin text-[#1677FF]">
                sync
              </span>
              <span>Memuat data pengguna...</span>
            </div>
          ) : errorMsg ? (
            <div className={`p-10 text-center text-xs flex flex-col items-center justify-center gap-2 ${isDark ? "text-rose-400" : "text-rose-600"
              }`}>
              <span className="material-symbols-outlined text-[32px]">gpp_bad</span>
              <span>{errorMsg}</span>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className={`p-16 text-center text-xs flex flex-col items-center justify-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"
              }`}>
              <span className="material-symbols-outlined text-[36px] text-slate-400">
                group_off
              </span>
              <span>Tidak ada akun pengguna yang sesuai dengan filter pencarian.</span>
            </div>
          ) : (
            /* Table Container - Rounded-t-xl Card Header Wrapper & Overflow-hidden (No Scrollbar) */
            <div className="w-full overflow-hidden rounded-t-xl">
              <table
                id="usersTable"
                className="w-full text-left border-collapse table-fixed"
                style={{ tableLayout: "fixed", width: "100%" }}
              >
                <colgroup>
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "27%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "15%" }} />
                </colgroup>
                <thead className={`rounded-t-xl ${isDark ? "bg-[#071426]" : "bg-slate-50"}`}>
                  <tr
                    className={`border-b text-[11px] font-bold uppercase tracking-wider ${isDark
                      ? "bg-[#071426] border-[#142D4C] text-[#94A3B8]"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                      } rounded-t-xl`}
                  >
                    {/* 0. # Index (DITENGAHKAN) */}
                    <th className="py-3 px-2 text-center select-none rounded-tl-xl" style={{ width: "4%" }}>
                      <span className={`font-extrabold uppercase tracking-wider text-[11px] block text-center ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                        #
                      </span>
                    </th>

                    {/* 1. NAMA & IDENTITAS (Rata Kiri) */}
                    <th className="py-3 px-4 text-left select-none" style={{ width: "27%" }}>
                      <TableSortHeader
                        title="NAMA & IDENTITAS"
                        sortKey="name"
                        currentSort={sortConfig}
                        onSort={handleSort}
                        align="left"
                        isDark={isDark}
                      />
                    </th>

                    {/* 2. ROLE (Rata Kiri) */}
                    <th className="py-3 px-4 text-left select-none" style={{ width: "14%" }}>
                      <TableSortHeader
                        title="ROLE"
                        sortKey="role"
                        currentSort={sortConfig}
                        onSort={handleSort}
                        align="left"
                        isDark={isDark}
                      />
                    </th>

                    {/* 3. DISTRICT (Rata Kiri) */}
                    <th className="py-3 px-4 text-left select-none" style={{ width: "12%" }}>
                      <TableSortHeader
                        title="DISTRICT"
                        sortKey="district"
                        currentSort={sortConfig}
                        onSort={handleSort}
                        align="left"
                        isDark={isDark}
                      />
                    </th>

                    {/* 4. STATUS (DITENGAHKAN SECARA PRESISI DI ATAS BADGE STATUS) */}
                    <th className="py-3 px-3 text-center select-none" style={{ width: "12%" }}>
                      <div className="flex items-center justify-center w-full">
                        <TableSortHeader
                          title="STATUS"
                          sortKey="status"
                          currentSort={sortConfig}
                          onSort={handleSort}
                          align="center"
                          isDark={isDark}
                        />
                      </div>
                    </th>

                    {/* 5. DIBUAT PADA (DITENGAHKAN) */}
                    <th className="py-3 px-3 text-center select-none" style={{ width: "16%" }}>
                      <div className="flex items-center justify-center w-full">
                        <TableSortHeader
                          title="DIBUAT PADA"
                          sortKey="created_at"
                          currentSort={sortConfig}
                          onSort={handleSort}
                          align="center"
                          isDark={isDark}
                        />
                      </div>
                    </th>

                    {/* 6. AKSI (DITENGAHKAN) */}
                    <th className="py-3 px-3 text-center select-none rounded-tr-xl" style={{ width: "15%" }}>
                      <span className={`font-extrabold uppercase tracking-wider text-[11px] block text-center ${isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                        AKSI
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody
                  className={`divide-y text-xs ${isDark ? "divide-[#0d213b]" : "divide-slate-200"
                    }`}
                >
                  {paginatedUsers.map((u, idx) => {
                    const isSelf = currentUser && (currentUser.id === u.user_id || currentUser.user_id === u.user_id);
                    const avatarBg = getAvatarColor(u.name);
                    const initial = (u.name || "U").trim()[0].toUpperCase();
                    const rowNum = (page - 1) * perPage + idx + 1;
                    const avatarSrc = (isSelf && currentUser?.avatar_url) ? currentUser.avatar_url : u.avatar_url;

                    return (
                      <tr
                        key={u.user_id}
                        className={`transition-colors ${isDark ? "hover:bg-[#0b213d]/60" : "hover:bg-slate-50/80 even:bg-slate-50/30"
                          }`}
                      >
                        {/* 0. # Index */}
                        <td className="py-3.5 px-2 text-center font-mono text-slate-400 dark:text-[#64748B] text-xs font-semibold">
                          {rowNum}
                        </td>

                        {/* 1. Nama & Identitas (Rata Kiri) */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0 w-9 h-9 sm:w-10 sm:h-10">
                              {avatarSrc ? (
                                <img
                                  src={avatarSrc}
                                  alt={u.name || "User Avatar"}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fb = e.currentTarget.nextElementSibling;
                                    if (fb) fb.style.display = "flex";
                                  }}
                                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-[#1677FF]/40 shadow-sm shrink-0 transition-transform duration-200 hover:scale-105"
                                />
                              ) : null}
                              <div
                                style={{ display: avatarSrc ? "none" : "flex" }}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full items-center justify-center font-bold text-sm text-white shrink-0 shadow-sm ${avatarBg}`}
                              >
                                {initial}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-semibold text-[13px] truncate max-w-[170px] sm:max-w-[210px] ${isDark ? "text-white" : "text-slate-900"
                                    }`}
                                >
                                  {u.name}
                                </span>
                                {isSelf && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${isDark
                                      ? "bg-[#1677FF]/20 text-[#38BDF8]"
                                      : "bg-blue-100 text-blue-700"
                                      }`}
                                  >
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[11px] block truncate max-w-[170px] sm:max-w-[210px] mt-0.5 ${isDark ? "text-[#5d799b]" : "text-slate-500"
                                  }`}
                              >
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Role Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-left">
                          <div className="flex items-center justify-start">
                            {u.role === "admin" && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${isDark
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
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${isDark
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
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${isDark
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

                        {/* 3. District */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-left">
                          <div className="inline-flex items-center justify-start gap-1.5">
                            <span
                              className={`material-symbols-outlined text-[16px] ${isDark ? "text-[#4c678a]" : "text-slate-400"
                                }`}
                            >
                              location_on
                            </span>
                            <span
                              className={`text-xs font-medium uppercase ${isDark ? "text-[#829bb8]" : "text-slate-700"
                                }`}
                            >
                              {u.district || "-"}
                            </span>
                          </div>
                        </td>

                        {/* 4. Status (DITENGAHKAN SECARA PRESISI DI BAWAH JUDUL STATUS) */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center w-full">
                            {u.status === "aktif" && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${isDark
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
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${isDark
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
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${isDark
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
                        <td className="py-3.5 px-3 whitespace-nowrap text-center">
                          <span
                            className={`text-xs font-mono block text-center ${isDark ? "text-[#6d88a9]" : "text-slate-600"
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
                              className={`w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${isDark
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
                              className={`w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${isDark
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
                              className={`w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${isDark
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
                                className={`w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] p-0 shrink-0 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${isDark
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
                                className={`w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] p-0 shrink-0 rounded-lg flex items-center justify-center border cursor-not-allowed opacity-30 ${isDark
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
            <TablePagination
              page={page}
              perPage={perPage}
              totalCount={sortedUsers.length}
              itemLabel="pengguna"
              onPageChange={setPage}
              onPerPageChange={(newPerPage) => {
                setPerPage(newPerPage);
                setPage(1);
              }}
              isDark={isDark}
            />
          )}
        </div>
      )}

      {/* ========================================================
          MODAL 1: DETAIL PENGGUNA (ADAPTIF DARK & LIGHT MODE)
          ======================================================== */}
      {detailUser && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setDetailUser(null)}
          >
            <div
              className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${isDark
                ? "bg-[#061427] border-[#0d2746] text-[#E6EDF7]"
                : "bg-white border-slate-200 text-slate-900"
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex items-center justify-between pb-4 border-b ${isDark ? "border-[#0f2747]" : "border-slate-100"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark
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
                  className={`cursor-pointer transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="py-5 space-y-3.5 text-xs">
                {/* Header Profile Avatar di Detail Modal */}
                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-3.5 ${
                    isDark ? "bg-[#0b1c33] border-[#162f52]" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="relative shrink-0 w-12 h-12">
                    {detailUser.avatar_url ? (
                      <img
                        src={detailUser.avatar_url}
                        alt={detailUser.name || "User Avatar"}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fb = e.currentTarget.nextElementSibling;
                          if (fb) fb.style.display = "flex";
                        }}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-[#1677FF] shadow-md shrink-0"
                      />
                    ) : null}
                    <div
                      style={{ display: detailUser.avatar_url ? "none" : "flex" }}
                      className={`w-12 h-12 rounded-full items-center justify-center font-bold text-base text-white shadow-md shrink-0 ${getAvatarColor(
                        detailUser.name
                      )}`}
                    >
                      {(detailUser.name || "U").trim()[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm truncate">{detailUser.name}</h4>
                    <p className={`text-[11px] truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {detailUser.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          detailUser.role === "admin"
                            ? isDark
                              ? "bg-purple-900/40 text-purple-300 border border-purple-700/50"
                              : "bg-purple-100 text-purple-700"
                            : detailUser.role === "teknisi"
                            ? isDark
                              ? "bg-cyan-900/40 text-cyan-300 border border-cyan-700/50"
                              : "bg-cyan-100 text-cyan-700"
                            : isDark
                            ? "bg-blue-900/40 text-blue-300 border border-blue-700/50"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {detailUser.role === "karyawan_tif" ? "Karyawan TIF" : detailUser.role}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                          detailUser.status === "aktif"
                            ? isDark
                              ? "bg-emerald-900/40 text-emerald-300"
                              : "bg-emerald-100 text-emerald-700"
                            : isDark
                            ? "bg-amber-900/40 text-amber-300"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {detailUser.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className={`flex justify-between py-1.5 border-b ${isDark ? "border-slate-800/40" : "border-slate-100"
                    }`}
                >
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>ID Pengguna</span>
                  <span className="font-mono font-semibold">#{detailUser.user_id}</span>
                </div>
                <div
                  className={`flex justify-between py-1.5 border-b ${isDark ? "border-slate-800/40" : "border-slate-100"
                    }`}
                >
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Nama Lengkap</span>
                  <span className="font-semibold">{detailUser.name}</span>
                </div>
                <div
                  className={`flex justify-between py-1.5 border-b ${isDark ? "border-slate-800/40" : "border-slate-100"
                    }`}
                >
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Email Akun</span>
                  <span className="font-mono font-semibold">{detailUser.email}</span>
                </div>
                <div
                  className={`flex justify-between py-1.5 border-b ${isDark ? "border-slate-800/40" : "border-slate-100"
                    }`}
                >
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Role Otorisasi</span>
                  <span className="font-semibold capitalize">{detailUser.role}</span>
                </div>
                <div
                  className={`flex justify-between py-1.5 border-b ${isDark ? "border-slate-800/40" : "border-slate-100"
                    }`}
                >
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>District Penugasan</span>
                  <span className="font-semibold">{detailUser.district || "-"}</span>
                </div>
                <div
                  className={`flex justify-between py-1.5 border-b ${isDark ? "border-slate-800/40" : "border-slate-100"
                    }`}
                >
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Status Akun</span>
                  <span className="font-semibold capitalize">{detailUser.status}</span>
                </div>
                <div
                  className={`flex justify-between py-1.5 border-b ${isDark ? "border-slate-800/40" : "border-slate-100"
                    }`}
                >
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Tanggal Didaftarkan</span>
                  <span className="font-mono">{formatDateTime(detailUser.created_at)}</span>
                </div>
                <div
                  className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-center gap-2.5 ${isDark
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-300"
                    : "bg-blue-50 border-blue-200 text-blue-700"
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#1677FF]">shield_locked</span>
                  <span>Password dienkripsi secara aman dan tidak dapat dilihat oleh siapa pun demi privasi akun.</span>
                </div>
              </div>

              <div
                className={`pt-3 border-t flex justify-end ${isDark ? "border-[#0f2747]" : "border-slate-100"
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
        </ModalPortal>
      )}

      {/* ========================================================
          MODAL 2: EDIT PENGGUNA (ADAPTIF DARK & LIGHT MODE)
          ======================================================== */}
      {editUser && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setEditUser(null)}
          >
            <div
              className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${isDark
                ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                : "bg-white border-slate-200 text-slate-900"
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex items-center justify-between pb-4 border-b ${isDark ? "border-[#142D4C]" : "border-slate-100"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark
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
                  type="button"
                  onClick={() => {
                    setEditUser(null);
                    setEditRoleDropdownOpen(false);
                    setEditStatusDropdownOpen(false);
                    setEditDistrictDropdownOpen(false);
                  }}
                  className={`cursor-pointer transition-colors p-1 rounded-lg ${isDark ? "text-slate-400 hover:text-white hover:bg-[#071933]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {editError && (
                <div
                  className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${isDark
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="py-5 space-y-4 text-xs overflow-visible">
                {/* Nama Lengkap */}
                <div>
                  <label className={`block font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Nama Lengkap *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined text-[18px] text-[#38BDF8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none select-none">
                      person
                    </span>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                      className={`w-full h-11 pl-10 pr-3.5 rounded-xl border outline-none text-xs sm:text-sm font-medium transition-all ${isDark
                        ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white"
                        }`}
                    />
                  </div>
                </div>

                {/* Email Akun */}
                <div>
                  <label className={`block font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Email Akun *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined text-[18px] text-[#38BDF8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none select-none">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Masukkan email akun"
                      className={`w-full h-11 pl-10 pr-3.5 rounded-xl border outline-none text-xs sm:text-sm font-medium transition-all ${isDark
                        ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white"
                        }`}
                    />
                  </div>
                </div>

                {/* Grid 2 Kolom: Role Otorisasi & Status Akun */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Dropdown 1: Role Otorisasi (Custom Box Container & Popup Menu) */}
                  <div className="relative" ref={editRoleDropdownRef}>
                    <label className={`block font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Role Otorisasi *
                    </label>
                    <button
                      type="button"
                      id="edit-role-btn"
                      disabled={editUser.role === "admin" || (currentUser && currentUser.id === editUser.user_id)}
                      onClick={() => {
                        setEditRoleDropdownOpen(!editRoleDropdownOpen);
                        setEditStatusDropdownOpen(false);
                        setEditDistrictDropdownOpen(false);
                      }}
                      className={`relative w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium transition-all outline-none ${
                        (editUser.role === "admin" || (currentUser && currentUser.id === editUser.user_id))
                          ? isDark
                            ? "bg-[#051122]/60 border-[#0f2848] text-slate-400 cursor-not-allowed opacity-75"
                            : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75"
                          : editRoleDropdownOpen
                          ? isDark
                            ? "bg-[#0A182B] border-2 border-[#1677FF] text-[#E6EDF7] shadow-[0_0_12px_rgba(22,119,255,0.25)] cursor-pointer"
                            : "bg-white border-2 border-blue-600 text-slate-900 shadow-sm cursor-pointer"
                          : isDark
                          ? "bg-[#051122] border-[#0f2848] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#071933] cursor-pointer"
                          : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500 cursor-pointer"
                      }`}
                      title={
                        currentUser && currentUser.id === editUser.user_id
                          ? "Tidak dapat mengubah role akun sendiri yang sedang aktif"
                          : editUser.role === "admin"
                          ? "Role Super Admin tidak dapat diubah dari menu ini"
                          : ""
                      }
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="material-symbols-outlined text-[18px] text-[#38BDF8] shrink-0">
                          {editForm.role === "admin"
                            ? "security"
                            : EDIT_ROLE_OPTIONS.find((r) => r.value === editForm.role)?.icon || "badge"}
                        </span>
                        <span className="truncate font-semibold">
                          {editForm.role === "admin"
                            ? "Super Admin"
                            : EDIT_ROLE_OPTIONS.find((r) => r.value === editForm.role)?.label || "Pilih Role"}
                        </span>
                      </div>
                      <span
                        className={`material-symbols-outlined text-[18px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${
                          editRoleDropdownOpen ? "rotate-180" : ""
                        }`}
                      >
                        expand_more
                      </span>
                    </button>

                    {/* Pop-up Menu Filter Role */}
                    {editRoleDropdownOpen && (
                      <div
                        className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl p-1.5 z-50 backdrop-blur-md overflow-hidden ${
                          isDark
                            ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                            : "bg-white border-slate-200 text-slate-800 shadow-xl"
                        }`}
                        style={{
                          backgroundColor: isDark ? "#0A182B" : "#FFFFFF",
                          borderColor: isDark ? "#1E3A5F" : "#E2E8F0",
                        }}
                      >
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                          {EDIT_ROLE_OPTIONS.map((opt) => {
                            const isSelected = editForm.role === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setEditForm({ ...editForm, role: opt.value });
                                  setEditRoleDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? isDark
                                      ? "bg-[#1677FF] text-white font-semibold shadow-sm"
                                      : "bg-blue-600 text-white font-semibold shadow-sm"
                                    : isDark
                                    ? "hover:bg-[#122846] text-[#CBD5E1]"
                                    : "hover:bg-slate-100 text-slate-700"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <span className={`material-symbols-outlined text-[16px] ${isSelected ? "text-white" : isDark ? "text-[#38BDF8]" : "text-blue-600"}`}>
                                    {opt.icon}
                                  </span>
                                  <span className="truncate">{opt.label}</span>
                                </div>
                                {isSelected && (
                                  <span className="material-symbols-outlined text-[16px] shrink-0">check</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Hidden native select untuk compatibility */}
                    <select
                      id="edit-role"
                      name="role"
                      value={editForm.role}
                      disabled={editUser.role === "admin" || (currentUser && currentUser.id === editUser.user_id)}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      {editForm.role === "admin" && <option value="admin">Super Admin</option>}
                      <option value="karyawan_tif">Karyawan TIF</option>
                      <option value="teknisi">Teknisi</option>
                    </select>
                  </div>

                  {/* Dropdown 2: Status Akun (Custom Box Container & Popup Menu) */}
                  <div className="relative" ref={editStatusDropdownRef}>
                    <label className={`block font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Status Akun *
                    </label>
                    <button
                      type="button"
                      id="edit-status-btn"
                      disabled={currentUser && currentUser.id === editUser.user_id}
                      onClick={() => {
                        setEditStatusDropdownOpen(!editStatusDropdownOpen);
                        setEditRoleDropdownOpen(false);
                        setEditDistrictDropdownOpen(false);
                      }}
                      className={`relative w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium transition-all outline-none ${
                        currentUser && currentUser.id === editUser.user_id
                          ? isDark
                            ? "bg-[#051122]/60 border-[#0f2848] text-slate-400 cursor-not-allowed opacity-75"
                            : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75"
                          : editStatusDropdownOpen
                          ? isDark
                            ? "bg-[#0A182B] border-2 border-[#1677FF] text-[#E6EDF7] shadow-[0_0_12px_rgba(22,119,255,0.25)] cursor-pointer"
                            : "bg-white border-2 border-blue-600 text-slate-900 shadow-sm cursor-pointer"
                          : isDark
                          ? "bg-[#051122] border-[#0f2848] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#071933] cursor-pointer"
                          : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500 cursor-pointer"
                      }`}
                      title={currentUser && currentUser.id === editUser.user_id ? "Tidak dapat menonaktifkan akun sendiri yang sedang aktif" : ""}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          editForm.status === "aktif" ? "bg-emerald-400" :
                          editForm.status === "pending" ? "bg-amber-400" :
                          "bg-rose-400"
                        }`} />
                        <span className="truncate font-semibold capitalize">
                          {EDIT_STATUS_OPTIONS.find((s) => s.value === editForm.status)?.label || "Pilih Status"}
                        </span>
                      </div>
                      <span
                        className={`material-symbols-outlined text-[18px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${
                          editStatusDropdownOpen ? "rotate-180" : ""
                        }`}
                      >
                        expand_more
                      </span>
                    </button>

                    {/* Pop-up Menu Filter Status */}
                    {editStatusDropdownOpen && (
                      <div
                        className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl p-1.5 z-50 backdrop-blur-md overflow-hidden ${
                          isDark
                            ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                            : "bg-white border-slate-200 text-slate-800 shadow-xl"
                        }`}
                        style={{
                          backgroundColor: isDark ? "#0A182B" : "#FFFFFF",
                          borderColor: isDark ? "#1E3A5F" : "#E2E8F0",
                        }}
                      >
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                          {EDIT_STATUS_OPTIONS.map((opt) => {
                            const isSelected = editForm.status === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setEditForm({ ...editForm, status: opt.value });
                                  setEditStatusDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? isDark
                                      ? "bg-[#1677FF] text-white font-semibold shadow-sm"
                                      : "bg-blue-600 text-white font-semibold shadow-sm"
                                    : isDark
                                    ? "hover:bg-[#122846] text-[#CBD5E1]"
                                    : "hover:bg-slate-100 text-slate-700"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                                    opt.value === "aktif" ? "bg-emerald-400" :
                                    opt.value === "pending" ? "bg-amber-400" :
                                    "bg-rose-400"
                                  }`} />
                                  <span className="truncate">{opt.label}</span>
                                </div>
                                {isSelected && (
                                  <span className="material-symbols-outlined text-[16px] shrink-0">check</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Hidden native select untuk compatibility */}
                    <select
                      id="edit-status"
                      name="status"
                      value={editForm.status}
                      disabled={currentUser && currentUser.id === editUser.user_id}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="pending">Pending</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>

                {/* Dropdown 3: District Penugasan (Custom Box Container & Popup Menu) */}
                <div className="relative" ref={editDistrictDropdownRef}>
                  <label className={`block font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    District Penugasan *
                  </label>
                  <button
                    type="button"
                    id="edit-district-btn"
                    onClick={() => {
                      setEditDistrictDropdownOpen(!editDistrictDropdownOpen);
                      setEditRoleDropdownOpen(false);
                      setEditStatusDropdownOpen(false);
                    }}
                    className={`relative w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium transition-all cursor-pointer outline-none ${
                      editDistrictDropdownOpen
                        ? isDark
                          ? "bg-[#0A182B] border-2 border-[#1677FF] text-[#E6EDF7] shadow-[0_0_12px_rgba(22,119,255,0.25)]"
                          : "bg-white border-2 border-blue-600 text-slate-900 shadow-sm"
                        : isDark
                        ? "bg-[#051122] border-[#0f2848] text-[#E6EDF7] hover:border-[#1677FF] hover:bg-[#071933]"
                        : "bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="material-symbols-outlined text-[18px] text-[#38BDF8] shrink-0">
                        location_on
                      </span>
                      <span className={`truncate font-semibold ${!editForm.district ? (isDark ? "text-slate-400" : "text-slate-500") : ""}`}>
                        {editForm.district || "Pilih District"}
                      </span>
                    </div>
                    <span
                      className={`material-symbols-outlined text-[18px] text-[#94A3B8] transition-transform duration-200 shrink-0 ${
                        editDistrictDropdownOpen ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Pop-up Menu Filter District */}
                  {editDistrictDropdownOpen && (
                    <div
                      className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl p-1.5 z-50 backdrop-blur-md overflow-hidden ${
                        isDark
                          ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7]"
                          : "bg-white border-slate-200 text-slate-800 shadow-xl"
                      }`}
                      style={{
                        backgroundColor: isDark ? "#0A182B" : "#FFFFFF",
                        borderColor: isDark ? "#1E3A5F" : "#E2E8F0",
                      }}
                    >
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {districtOptions.map((d) => {
                          const isSelected = editForm.district === d;
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                setEditForm({ ...editForm, district: d });
                                setEditDistrictDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? isDark
                                    ? "bg-[#1677FF] text-white font-semibold shadow-sm"
                                    : "bg-blue-600 text-white font-semibold shadow-sm"
                                  : isDark
                                  ? "hover:bg-[#122846] text-[#CBD5E1]"
                                  : "hover:bg-slate-100 text-slate-700"
                              }`}
                            >
                              <span className="truncate pr-2">{d}</span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[16px] shrink-0">check</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Hidden native select untuk compatibility */}
                  <select
                    id="edit-district"
                    name="district"
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    required
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <option value="" disabled>Pilih District</option>
                    {districtOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Footer Buttons */}
                <div
                  className={`pt-4 border-t flex justify-end gap-2.5 ${isDark ? "border-[#142D4C]" : "border-slate-100"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEditUser(null);
                      setEditRoleDropdownOpen(false);
                      setEditStatusDropdownOpen(false);
                      setEditDistrictDropdownOpen(false);
                    }}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${isDark
                      ? "border-[#1E3A5F] text-slate-400 hover:text-white hover:bg-[#071933]"
                      : "border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#1677FF] text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50 cursor-pointer shadow-lg shadow-[#1677FF]/25 hover:shadow-[#1677FF]/40 transition-all flex items-center gap-2"
                  >
                    {editSubmitting && (
                      <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    )}
                    <span>{editSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================
          MODAL 3: RESET PASSWORD (ADAPTIF DARK & LIGHT MODE)
          ======================================================== */}
      {resetUser && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setResetUser(null)}
          >
            <div
              className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${isDark
                ? "bg-[#061427] border-[#0d2746] text-[#E6EDF7]"
                : "bg-white border-slate-200 text-slate-900"
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex items-center justify-between pb-4 border-b ${isDark ? "border-[#0f2747]" : "border-slate-100"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark
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
                  className={`cursor-pointer transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {resetError && (
                <div
                  className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${isDark
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
                  className={`p-3 rounded-xl border text-[11px] leading-relaxed ${isDark
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
                      className={`w-full px-3.5 py-2.5 rounded-xl border outline-none pr-10 text-xs sm:text-sm ${isDark
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
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs sm:text-sm ${isDark
                      ? "bg-[#051122] border-[#0f2848] text-white focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white"
                      }`}
                  />
                </div>

                <div
                  className={`pt-4 border-t flex justify-end gap-2.5 ${isDark ? "border-[#0f2747]" : "border-slate-100"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => setResetUser(null)}
                    className={`px-4 py-2 rounded-xl border cursor-pointer ${isDark
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
        </ModalPortal>
      )}

      {/* ========================================================
          MODAL 4: HAPUS PENGGUNA (ADAPTIF DARK & LIGHT MODE)
          ======================================================== */}
      {deleteUser && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setDeleteUser(null)}
          >
            <div
              className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${isDark
                ? "bg-[#061427] border-[#0d2746] text-[#E6EDF7]"
                : "bg-white border-slate-200 text-slate-900"
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex items-center gap-3 pb-4 border-b ${isDark ? "border-[#0f2747]" : "border-slate-100"
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark
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
                  className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${isDark
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
                  className={`p-3 rounded-xl border text-[11px] ${isDark
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
                className={`pt-4 border-t flex justify-end gap-2.5 text-xs ${isDark ? "border-[#0f2747]" : "border-slate-100"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setDeleteUser(null)}
                  className={`px-4 py-2 rounded-xl border cursor-pointer ${isDark
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
        </ModalPortal>
      )}
    </div>
  );
}
