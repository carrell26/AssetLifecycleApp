import React, { useState, useEffect } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal Bantuan Admin
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [adminData, setAdminData] = useState({
    name: "Admin Asset",
    email: "adminasset@gmail.com",
    role: "Administrator Sistem",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/auth/admin-contact-api")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.admin) {
          setAdminData(data.admin);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/auth/login-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.user) {
          try {
            localStorage.setItem("cached_user", JSON.stringify(data.user));
          } catch {}
        }
        // Aktifkan tema tersimpan sebelum redirect agar transisi ke dashboard tanpa kedip/wink
        try {
          const savedTheme = localStorage.getItem("asset-app-theme") || "dark";
          if (savedTheme === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
          } else {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
          }
        } catch {}
        window.location.href = data.redirect || "/";
      } else {
        setError(data.message || "Email atau kata sandi salah.");
      }
    } catch {
      setError("Terjadi gangguan koneksi ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const copyAdminEmail = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(adminData.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    // Halaman login khusus: Hapus dark mode dari elemen root HTML secara permanen
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");

    // Kunci background body ke warna dasar #050e1a agar halaman login independen dari mode dark/light web
    const prevBodyBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#050e1a";
    return () => {
      document.body.style.backgroundColor = prevBodyBg;
    };
  }, []);

  return (
    <div style={styles.wrapper}>
      {/* CSS internal: input putih bersih permanen, tidak terpengaruh dark mode apapun */}
      <style>{`
        html.dark input.login-input:-webkit-autofill,
        html.dark input.login-input:-webkit-autofill:hover,
        html.dark input.login-input:-webkit-autofill:focus,
        html.dark input.login-input:-webkit-autofill:active,
        html input.login-input:-webkit-autofill,
        html input.login-input:-webkit-autofill:hover,
        html input.login-input:-webkit-autofill:focus,
        html input.login-input:-webkit-autofill:active,
        input.login-input:-webkit-autofill,
        input.login-input:-webkit-autofill:hover,
        input.login-input:-webkit-autofill:focus,
        input.login-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
          box-shadow: 0 0 0 1000px #ffffff inset !important;
          -webkit-text-fill-color: #0f172a !important;
          color: #0f172a !important;
          caret-color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
          background-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        html.dark .login-input,
        html .login-input,
        .login-input {
          background-color: #ffffff !important;
          color: #0f172a !important;
          -webkit-text-fill-color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
          outline: none !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        html.dark .login-input::placeholder,
        html .login-input::placeholder,
        .login-input::placeholder {
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
        }
        html.dark .login-input:hover,
        html .login-input:hover,
        .login-input:hover {
          border-color: #94a3b8 !important;
        }
        html.dark .login-input:focus,
        html .login-input:focus,
        .login-input:focus {
          border-color: #1677FF !important;
          box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.25) !important;
        }
        .login-custom-checkbox {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background-color: #0b1a2e;
          border: 1px solid #1e3a5f !important;
          border-radius: 4px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.2s ease;
          flex-shrink: 0;
          margin: 0;
        }
        .login-custom-checkbox:hover {
          box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.25);
          border-color: #1677FF !important;
        }
        .login-custom-checkbox:checked {
          background-color: #1677FF;
          border-color: #1677FF !important;
        }
        .login-custom-checkbox:checked::after {
          content: "";
          position: absolute;
          width: 4px;
          height: 8px;
          border: solid #ffffff;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          margin-top: -2px;
        }
      `}</style>

      <div style={styles.card}>
        {/* ── LEFT PANEL: Form Login ── */}
        <div style={styles.left}>
          {/* 1. Logo ditengahkan */}
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#fff" }}>
                hub
              </span>
            </div>
            <div>
              <div style={styles.logoTitle}>Asset Lifecycle</div>
              <div style={styles.logoSub}>TELKOM INFRASTRUCTURE</div>
            </div>
          </div>

          {/* Heading */}
          <h1 style={styles.heading}>Selamat datang kembali</h1>
          <p style={styles.subtext}>Masuk untuk mengelola aset jaringan</p>

          {/* Error flash */}
          {error && <div style={styles.flashError}>{error}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="on">
            {/* Email - Tanpa border */}
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="email">
                Email
              </label>
              <div style={styles.inputWrap}>
                <span className="material-symbols-outlined" style={styles.inputIcon}>
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  required
                  autoFocus
                  autoComplete="email"
                  className="login-input"
                  style={styles.input}
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="password">
                Password
              </label>
              <div style={styles.inputWrap}>
                <span className="material-symbols-outlined" style={styles.inputIcon}>
                  lock
                </span>
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  autoComplete="current-password"
                  className="login-input"
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={styles.togglePw}
                  aria-label="Toggle password"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {showPw ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            {/* Checkbox Ingat saya */}
            <div style={styles.formRow}>
              <label style={styles.checkboxWrap}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="login-custom-checkbox"
                />
                <span style={{ fontSize: 12, color: "#94A3B8", userSelect: "none" }}>Ingat saya</span>
              </label>
            </div>

            {/* Tombol Masuk */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.btnLogin,
                ...(loading ? { opacity: 0.7, cursor: "not-allowed" } : {}),
              }}
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Divider */}
          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>atau</span>
            <span style={styles.dividerLine} />
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              Butuh bantuan atau pembuatan akun?{" "}
              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                style={styles.footerActionBtn}
              >
                Hubungi admin sistem
              </button>
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL: Gambar Persis Sesuai Referensi & Kontras Tema Dark Blue ── */}
        <div style={styles.right}>
          <img
            src="/static/img/login_bg.png"
            alt="Data Center Server Corridor"
            style={styles.rightImg}
          />
          <div style={styles.rightOverlay} />
        </div>
      </div>

      {/* ========================================================
          MODAL: HUBUNGI ADMIN SISTEM
          ======================================================== */}
      {contactModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setContactModalOpen(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={styles.modalIconWrap}>
                  <span className="material-symbols-outlined" style={{ color: "#1677FF", fontSize: 20 }}>
                    support_agent
                  </span>
                </div>
                <div>
                  <h3 style={styles.modalTitle}>Bantuan Administrator</h3>
                  <p style={styles.modalSub}>Kontak resmi pengelola sistem Asset Lifecycle</p>
                </div>
              </div>
              <button
                onClick={() => setContactModalOpen(false)}
                style={styles.modalCloseBtn}
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <div style={styles.adminAvatar}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#1677FF" }}>
                  shield_person
                </span>
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: "#E6EDF7", margin: "10px 0 2px" }}>
                {adminData.name}
              </h4>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                {adminData.role || "Administrator Sistem"}
              </p>

              <div style={styles.adminInfoCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ color: "#38BDF8", fontSize: 20 }}>
                    alternate_email
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#E6EDF7", letterSpacing: "0.01em" }}>
                    {adminData.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyAdminEmail}
                  style={styles.btnCopy}
                  title="Salin Email"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {copied ? "done" : "content_copy"}
                  </span>
                  {copied ? "Tersalin" : "Salin"}
                </button>
              </div>

              <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 14, textAlign: "left", lineHeight: 1.6 }}>
                💡 Untuk aktivasi akun teknisi, kendala autentikasi, atau reset kata sandi, silakan kirimkan email langsung kepada administrator dengan menyertakan nama dan distrik kerja Anda.
              </p>

              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  style={{ ...styles.btnCancel, flex: 1 }}
                >
                  Tutup
                </button>
                <a
                  href={`mailto:${adminData.email}?subject=Permintaan%20Bantuan%20Akun%20Asset%20Lifecycle`}
                  style={{
                    ...styles.btnPrimary,
                    flex: 1.4,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    mail
                  </span>
                  Kirim Email Sekarang
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Inline styles ── */
const styles = {
  wrapper: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "#050e1a",
    fontFamily: "'Inter', sans-serif",
    boxSizing: "border-box",
  },
  card: {
    display: "flex",
    width: "100%",
    maxWidth: 960,
    minHeight: 520,
    borderRadius: 20,
    overflow: "hidden",
    border: "none", // 2. Border card dihilangkan
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)", // Shadow halus tanpa outline border
    background: "#071426",
  },
  left: {
    flex: 1,
    padding: "52px 48px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "#071426",
    minWidth: 0,
    boxSizing: "border-box",
  },
  // 1. Logo ditengahkan
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
    width: "100%",
    textAlign: "left",
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    background: "linear-gradient(135deg, #1677FF, #0a4aa3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 14px rgba(22,119,255,0.45)",
    flexShrink: 0,
  },
  logoTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#E6EDF7",
    letterSpacing: "-0.02em",
    lineHeight: 1.15,
  },
  logoSub: {
    fontSize: 9,
    fontWeight: 600,
    color: "#38BDF8",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  heading: {
    fontSize: 26,
    fontWeight: 700,
    color: "#E6EDF7",
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
    marginBottom: 6,
  },
  subtext: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 24,
  },
  flashError: {
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 500,
    background: "rgba(239,68,68,0.12)",
    color: "#FCA5A5",
    marginBottom: 16,
    lineHeight: 1.4,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "#94A3B8",
    marginBottom: 7,
  },
  inputWrap: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 13,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748B",
    fontSize: 18,
    pointerEvents: "none",
    userSelect: "none",
  },
  // Input email & password: latar putih bersih sesuai screenshot referensi, teks gelap kontras
  input: {
    width: "100%",
    height: 44,
    backgroundColor: "#ffffff",
    border: "1px solid #CBD5E1",
    borderRadius: 10,
    padding: "0 42px 0 40px",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: "#0F172A",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },
  togglePw: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748B",
    display: "flex",
    alignItems: "center",
    padding: 0,
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 20,
    marginTop: 6,
  },
  checkboxWrap: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
  },
  btnLogin: {
    width: "100%",
    height: 44,
    background: "#1677FF",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 18px rgba(22,119,255,0.4)",
    letterSpacing: "0.01em",
    transition: "background 0.2s, box-shadow 0.2s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "18px 0 14px",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#1A2E4C",
    display: "block",
  },
  dividerText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: 500,
  },
  footer: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 1.6,
  },
  footerLink: {
    color: "#1677FF",
    textDecoration: "none",
    fontWeight: 500,
  },
  footerActionBtn: {
    background: "none",
    border: "none",
    padding: 0,
    color: "#1677FF",
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 12,
  },
  // 3. Panel kanan dengan kontras dark blue
  right: {
    width: "48%",
    flexShrink: 0,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#030A14",
  },
  rightImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    display: "block",
  },
  rightOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to right, #071426 0%, rgba(7,20,38,0.45) 15%, transparent 40%)",
  },

  /* Modal Admin */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(5, 14, 26, 0.8)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: "#071426",
    borderRadius: 16,
    border: "none",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.75)",
    padding: 24,
    boxSizing: "border-box",
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottom: "1px solid #1A2E4C",
  },
  modalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(22, 119, 255, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#E6EDF7",
    margin: 0,
  },
  modalSub: {
    fontSize: 12,
    color: "#64748B",
    margin: "3px 0 0 0",
  },
  modalCloseBtn: {
    background: "none",
    border: "none",
    color: "#64748B",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    padding: "10px 18px",
    backgroundColor: "#1677FF",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 10px rgba(22, 119, 255, 0.35)",
  },
  btnCancel: {
    padding: "10px 18px",
    backgroundColor: "#0D1F36",
    color: "#94A3B8",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  adminAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#0D1F36",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  adminInfoCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0D1F36",
    borderRadius: 10,
    padding: "10px 14px",
    marginTop: 16,
  },
  btnCopy: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "5px 9px",
    borderRadius: 6,
    backgroundColor: "rgba(22, 119, 255, 0.15)",
    border: "none",
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
  },
};
