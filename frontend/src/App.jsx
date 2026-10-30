import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import HeroBanner from "./components/HeroBanner";
import KpiCards from "./components/KpiCards";
import DeviceDistributionChart from "./components/DeviceDistributionChart";
import OpticalAssetComposition from "./components/OpticalAssetComposition";
import RackSlotStatus from "./components/RackSlotStatus";
import RecentActivities from "./components/RecentActivities";
import AvatarModal from "./components/AvatarModal";
import LogoutModal from "./components/LogoutModal";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import ModulesPage from "./pages/ModulesPage";
import ModuleMovementsPage from "./pages/ModuleMovementsPage";
import LocationsPage from "./pages/LocationsPage";
import DevicesPage from "./pages/DevicesPage";
import ImportPage from "./pages/ImportPage";
import ExportPage from "./pages/ExportPage";
import AuditLogPage from "./pages/AuditLogPage";

export default function App() {
  // Simple client-side routing based on pathname
  const path = window.location.pathname;
  if (path === "/auth/login" || path === "/auth/login/") {
    return <LoginPage />;
  }
  if (path === "/auth/register" || path === "/auth/register/") {
    // Pendaftaran mandiri telah dihapus, alihkan ke login
    window.location.href = "/auth/login";
    return null;
  }

  const isUsersPage = path.startsWith("/auth/admin/users") || path.startsWith("/auth/admin/register-karyawan");
  const isMutasiPage = path.startsWith("/modules/requests") || path.startsWith("/modules/movements") || path.startsWith("/modules/mutasi");
  const isModulesPage = path.startsWith("/modules") && !isMutasiPage;
  const isLocationsPage = path.startsWith("/device/locations");
  const isDevicesPage = path.startsWith("/device/devices") || path === "/devices";
  const isImportPage = path.startsWith("/import");
  const isExportPage = path.startsWith("/export");
  const isAuditPage = path.startsWith("/audit");

  const { isDark } = useTheme();
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("cached_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Fetch User Profile
  const fetchUser = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.status === 401) {
        try {
          localStorage.removeItem("cached_user");
        } catch {}
        window.location.href = "/auth/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        try {
          localStorage.setItem("cached_user", JSON.stringify(data.user));
        } catch {}
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  };

  // Fetch Dashboard Stats
  const fetchStats = async (p = period) => {
    try {
      const res = await fetch(`/api/dashboard/stats?period=${p}`);
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    if (!isModulesPage && !isMutasiPage && !isLocationsPage && !isDevicesPage && !isImportPage && !isExportPage && !isUsersPage && !isAuditPage) {
      fetchStats("30d");
    }
  }, [isModulesPage, isMutasiPage, isLocationsPage, isDevicesPage, isImportPage, isExportPage, isUsersPage, isAuditPage]);

  const mainRef = useRef(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  // Monitor dynamic scrollbar width agar tepi kanan Card selalu 100% rata presisi dengan halaman lain
  useEffect(() => {
    const updateScrollbar = () => {
      if (mainRef.current) {
        const el = mainRef.current;
        // offsetWidth mencakup scrollbar, clientWidth tidak mencakup scrollbar
        // Selisihnya adalah lebar scrollbar presisi (0px jika tidak ada scrollbar, 14px-17px jika aktif)
        const sbWidth = Math.max(0, el.offsetWidth - el.clientWidth);
        setScrollbarWidth(sbWidth);
      }
    };

    updateScrollbar();
    const timer1 = setTimeout(updateScrollbar, 50);
    const timer2 = setTimeout(updateScrollbar, 200);

    let observer = null;
    if (typeof ResizeObserver !== "undefined" && mainRef.current) {
      observer = new ResizeObserver(() => {
        updateScrollbar();
      });
      observer.observe(mainRef.current);
      if (mainRef.current.firstElementChild) {
        observer.observe(mainRef.current.firstElementChild);
      }
    }

    window.addEventListener("resize", updateScrollbar);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (observer) observer.disconnect();
      window.removeEventListener("resize", updateScrollbar);
    };
  }, [path, isUsersPage, isMutasiPage, isModulesPage, isLocationsPage, isDevicesPage, isImportPage, isExportPage, isAuditPage, searchValue]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    fetchStats(newPeriod);
  };

  const handleAvatarUpdated = (newAvatarUrl) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, avatar_url: newAvatarUrl } : prev;
      try {
        if (updated) localStorage.setItem("cached_user", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isTeknisi = user?.role === "teknisi";

  return (
    <div
      className={`h-screen w-full flex overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#071426] text-[#E6EDF7]" : "bg-slate-50 text-slate-900"
        }`}
    >
      {/* Sidebar with role-specific menu filtering */}
      <Sidebar user={user} />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Header with Theme Switcher & Profile */}
        <Header
          user={user}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onOpenLogoutModal={() => setLogoutModalOpen(true)}
          onOpenAvatarModal={() => setAvatarModalOpen(true)}
          showSearch={false}
        />

        {/* Main Content: Padding kanan terkompensasi dinamis (24px - lebar scrollbar) agar tepi kanan Card selalu rata presisi */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar w-full"
          style={{
            paddingRight: `${Math.max(0, 24 - scrollbarWidth)}px`,
          }}
        >
          {isUsersPage ? (
            /* ======================================================== */
            /* HALAMAN KELOLA USER (INTEGRASI DAFTARKAN KARYAWAN)        */
            /* ======================================================== */
            <UsersPage
              user={user}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
            />
          ) : isMutasiPage ? (
            /* ======================================================== */
            /* HALAMAN MUTASI MODUL (LANGSUNG & RIWAYAT AUDIT LEDGER)    */
            /* ======================================================== */
            <ModuleMovementsPage
              user={user}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
            />
          ) : isModulesPage ? (
            /* ======================================================== */
            /* HALAMAN MODUL (REDESIGN SESUAI GAMBAR REFERENSI USER)     */
            /* ======================================================== */
            <ModulesPage
              user={user}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
            />
          ) : isLocationsPage ? (
            /* ======================================================== */
            /* HALAMAN LOKASI (REDESIGN SESUAI GAMBAR REFERENSI USER)    */
            /* ======================================================== */
            <LocationsPage
              user={user}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
            />
          ) : isDevicesPage ? (
            /* ======================================================== */
            /* HALAMAN PERANGKAT (REDESIGN SESUAI GAMBAR REFERENSI USER) */
            /* ======================================================== */
            <DevicesPage
              user={user}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
            />
          ) : isImportPage ? (
            /* ======================================================== */
            /* HALAMAN IMPORT DATA (REDESIGN SESUAI GAMBAR REFERENSI USER)*/
            /* ======================================================== */
            <ImportPage
              user={user}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
            />
          ) : isExportPage ? (
            /* ======================================================== */
            /* HALAMAN EXPORT DATA (REDESIGN SESUAI GAMBAR REFERENSI USER)*/
            /* ======================================================== */
            <ExportPage
              user={user}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
            />
          ) : isAuditPage ? (
            /* ======================================================== */
            /* HALAMAN AUDIT LOG & HASH CHAIN LEDGER (REDESIGN REACT)   */
            /* ======================================================== */
            <AuditLogPage
              user={user}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
            />
          ) : (
            /* ======================================================== */
            /* HALAMAN DASHBOARD UTAMA                                  */
            /* ======================================================== */
            <div className="space-y-6 !mt-0 w-full" style={{ marginTop: 0 }}>
              {/* Welcome Banner */}
              <HeroBanner userName={user?.name} userRole={user?.role} />

              {/* Dashboard Utama: 4 KPI Cards, Distribusi & Komposisi Optik, Status Rak STO, Aktivitas Terbaru */}
              <KpiCards kpi={stats?.kpi} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <DeviceDistributionChart data={stats?.device_distribution} />
                <OpticalAssetComposition data={stats?.optical_composition} />
              </div>
              <RackSlotStatus data={stats?.rack_status} />
              <RecentActivities activities={stats?.recent_activities} />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AvatarModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onAvatarUpdated={handleAvatarUpdated}
      />
      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        user={user}
      />
    </div>
  );
}
