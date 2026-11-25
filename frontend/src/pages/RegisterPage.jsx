import React, { useState } from "react";
import infranexiaLogo from "../assets/infranexia_logo.png";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [district, setDistrict] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("Silakan setujui Syarat dan Ketentuan & Kebijakan Privasi terlebih dahulu.");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal harus 8 karakter.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/auth/register-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          district,
          password,
          confirm_password: password,
          terms: agreeTerms,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(
          data.message ||
            "Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Admin."
        );
        setTimeout(() => {
          window.location.href = data.redirect || "/auth/login";
        }, 2200);
      } else {
        setError(data.message || "Gagal melakukan pendaftaran. Silakan coba lagi.");
      }
    } catch {
      setError("Terjadi gangguan koneksi ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* CSS internal: override autofill & checkbox agar konsisten dengan tema dark navy */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #0D1F36 inset !important;
          -webkit-text-fill-color: #E6EDF7 !important;
          caret-color: #E6EDF7 !important;
          border: 1px solid #162B48 !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        /* Sembunyikan tombol reveal bawaan browser (Edge/Chrome) pada input password */
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none !important;
        }
        input[type="password"]::-webkit-contacts-auto-fill-button,
        input[type="password"]::-webkit-credentials-auto-fill-button {
          visibility: hidden;
          display: none !important;
          pointer-events: none;
          height: 0;
          width: 0;
          margin: 0;
        }
        .register-dark-input {
          border: 1px solid #162B48 !important;
          outline: none !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        .register-dark-input::placeholder {
          color: #475569;
        }
        .register-dark-input:hover {
          border-color: #203A5F !important;
        }
        .register-dark-input:focus {
          border-color: #1677FF !important;
          box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.25) !important;
        }
        .register-custom-checkbox {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background-color: #0D1F36;
          border: 1px solid #162B48;
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
        .register-custom-checkbox:hover {
          border-color: #1677FF;
          box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.25);
        }
        .register-custom-checkbox:checked {
          background-color: #1677FF;
          border-color: #1677FF;
        }
        .register-custom-checkbox:checked::after {
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
        {/* ── LEFT PANEL: Form Registrasi ── */}
        <div style={styles.left}>
          {/* Logo Header */}
          <div style={styles.logo}>
            <div
              style={{
                width: 38,
                height: 38,
                padding: 2,
                borderRadius: 11,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              <img
                src={infranexiaLogo}
                alt="infraNexia by Telkom Indonesia"
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            </div>
            <div>
              <div style={styles.logoTitle}>Asset Lifecycle</div>
              <div style={styles.logoSub}>PT TELKOM INFRASTRUKTUR</div>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h1 style={styles.heading}>Buat Akun Baru</h1>
          <p style={styles.subtext}>Daftarkan akun Anda untuk mengelola aset jaringan</p>

          {/* Error Banner */}
          {error && (
            <div style={styles.flashError}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div style={styles.flashSuccess}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                check_circle
              </span>
              <span>{successMsg} Mengalihkan ke login...</span>
            </div>
          )}

          {/* Form Registrasi */}
          <form onSubmit={handleSubmit} autoComplete="on">
            {/* 1. Nama Lengkap */}
            <div style={styles.formGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label} htmlFor="name">
                  Nama Lengkap
                </label>
                <span style={styles.badgeHint}>Wajib</span>
              </div>
              <div style={styles.inputWrap}>
                <span className="material-symbols-outlined" style={styles.inputIcon}>
                  person
                </span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  required
                  autoFocus
                  autoComplete="name"
                  className="register-dark-input"
                  style={styles.input}
                />
              </div>
            </div>

            {/* 2. Email */}
            <div style={styles.formGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label} htmlFor="email">
                  Email
                </label>
                <span style={styles.badgeHint}>Wajib</span>
              </div>
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
                  autoComplete="email"
                  className="register-dark-input"
                  style={styles.input}
                />
              </div>
            </div>

            {/* 3. District */}
            <div style={styles.formGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label} htmlFor="district">
                  District
                </label>
                <span style={styles.badgeHint}>Wajib</span>
              </div>
              <div style={styles.inputWrap}>
                <span className="material-symbols-outlined" style={styles.inputIcon}>
                  location_on
                </span>
                <input
                  id="district"
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Masukkan district misal: Palu"
                  required
                  className="register-dark-input"
                  style={styles.input}
                />
              </div>
            </div>

            {/* 4. Password */}
            <div style={styles.formGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label} htmlFor="password">
                  Password
                </label>
                <span style={styles.badgeHint}>Min. 8 Karakter</span>
              </div>
              <div style={styles.inputWrap}>
                <span className="material-symbols-outlined" style={styles.inputIcon}>
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  autoComplete="new-password"
                  className="register-dark-input"
                  style={styles.inputWithToggle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.togglePw}
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>



            {/* 6. Checkbox Syarat & Ketentuan */}
            <div style={styles.checkboxRow}>
              <label style={styles.checkboxWrap}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="register-custom-checkbox"
                />
                <span style={styles.checkboxText}>
                  Saya menyetujui{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setTermsModalOpen(true);
                    }}
                    style={styles.termsLink}
                  >
                    Syarat dan Ketentuan &amp; Kebijakan Privasi
                  </button>
                </span>
              </label>
            </div>

            {/* 7. Tombol Daftar Akun */}
            <button
              type="submit"
              disabled={loading || !!successMsg}
              style={{
                ...styles.btnSubmit,
                ...(loading || successMsg ? { opacity: 0.75, cursor: "not-allowed" } : {}),
              }}
            >
              {loading ? "Mendaftarkan Akun..." : "Daftar Akun"}
            </button>
          </form>

          {/* 8. Divider ATAU */}
          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>ATAU</span>
            <span style={styles.dividerLine} />
          </div>

          {/* 9. Footer Masuk */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              Sudah memiliki akun?{" "}
              <a href="/auth/login" style={styles.footerLink}>
                Masuk
              </a>
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL: Gambar HD Data Center Corridor ── */}
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
          MODAL: SYARAT & KETENTUAN DAN KEBIJAKAN PRIVASI
          ======================================================== */}
      {termsModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setTermsModalOpen(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={styles.modalIconWrap}>
                  <span className="material-symbols-outlined" style={{ color: "#1677FF", fontSize: 20 }}>
                    verified_user
                  </span>
                </div>
                <div>
                  <h3 style={styles.modalTitle}>Syarat &amp; Kebijakan Privasi</h3>
                  <p style={styles.modalSub}>Ketentuan penggunaan sistem Asset Lifecycle</p>
                </div>
              </div>
              <button
                onClick={() => setTermsModalOpen(false)}
                style={styles.modalCloseBtn}
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>

            <div style={styles.modalBody}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#E6EDF7", marginBottom: 6 }}>
                1. Registrasi Akun Teknisi
              </h4>
              <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6, marginBottom: 12 }}>
                Pendaftaran akun baru ini diperuntukkan bagi teknisi resmi Telkom Infrastructure. Setiap permohonan akun akan ditinjau dan diverifikasi oleh Administrator sebelum dapat digunakan untuk login.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#E6EDF7", marginBottom: 6 }}>
                2. Kerahasiaan Data &amp; Kredensial
              </h4>
              <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6, marginBottom: 12 }}>
                Anda bertanggung jawab penuh atas keamanan kata sandi dan aktivitas yang dilakukan melalui akun Anda. Dilarang membagikan kredensial login kepada pihak lain tanpa otorisasi.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#E6EDF7", marginBottom: 6 }}>
                3. Integritas Data Aset Jaringan
              </h4>
              <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6, marginBottom: 16 }}>
                Seluruh aktivitas pencatatan, pemindahan, maupun pelaporan status modul perangkat akan tercatat dalam audit log sistem demi akurasi dan kepatuhan operasional.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                type="button"
                onClick={() => {
                  setAgreeTerms(true);
                  setTermsModalOpen(false);
                }}
                style={styles.btnPrimary}
              >
                Saya Mengerti &amp; Setujui
              </button>
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
    padding: "24px 16px",
    background: "#050e1a",
    fontFamily: "'Inter', sans-serif",
    boxSizing: "border-box",
  },
  card: {
    display: "flex",
    width: "100%",
    maxWidth: 960,
    minHeight: 620,
    borderRadius: 20,
    overflow: "hidden",
    border: "none",
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)",
    background: "#071426",
  },
  left: {
    width: "53%",
    padding: "40px 44px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "#071426",
    minWidth: 0,
    boxSizing: "border-box",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
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
    color: "#FFFFFF",
    letterSpacing: "-0.02em",
    lineHeight: 1.15,
  },
  logoSub: {
    fontSize: 9,
    fontWeight: 700,
    color: "#38BDF8",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  heading: {
    fontSize: 24,
    fontWeight: 700,
    color: "#FFFFFF",
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
    marginBottom: 4,
  },
  subtext: {
    fontSize: 12.5,
    color: "#64748B",
    marginBottom: 20,
    lineHeight: 1.4,
  },
  flashError: {
    padding: "10px 14px",
    borderRadius: 9,
    fontSize: 12,
    fontWeight: 500,
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    color: "#FCA5A5",
    marginBottom: 16,
    lineHeight: 1.4,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  flashSuccess: {
    padding: "10px 14px",
    borderRadius: 9,
    fontSize: 12,
    fontWeight: 500,
    background: "rgba(16, 185, 129, 0.12)",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    color: "#6EE7B7",
    marginBottom: 16,
    lineHeight: 1.4,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  formGroup: {
    marginBottom: 12,
  },
  labelRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#E2E8F0",
  },
  badgeHint: {
    fontSize: 11,
    color: "#475569",
    fontFamily: "ui-monospace, monospace, sans-serif",
    fontWeight: 500,
  },
  inputWrap: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#475569",
    fontSize: 18,
    pointerEvents: "none",
    userSelect: "none",
  },
  input: {
    width: "100%",
    height: 42,
    backgroundColor: "#0D1F36",
    border: "1px solid #162B48",
    borderRadius: 9,
    padding: "0 14px 0 38px",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: "#E6EDF7",
    outline: "none",
    boxSizing: "border-box",
  },
  inputWithToggle: {
    width: "100%",
    height: 42,
    backgroundColor: "#0D1F36",
    border: "1px solid #162B48",
    borderRadius: 9,
    padding: "0 40px 0 38px",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: "#E6EDF7",
    outline: "none",
    boxSizing: "border-box",
  },
  togglePw: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    padding: 0,
    transition: "color 0.2s",
  },
  checkboxRow: {
    marginTop: 10,
    marginBottom: 16,
  },
  checkboxWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  },
  checkboxText: {
    fontSize: 12,
    color: "#94A3B8",
    userSelect: "none",
    lineHeight: 1.4,
  },
  termsLink: {
    background: "none",
    border: "none",
    padding: 0,
    color: "#38BDF8",
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 12,
    textDecoration: "underline",
    display: "inline",
  },
  btnSubmit: {
    width: "100%",
    height: 44,
    background: "#1677FF",
    border: "none",
    borderRadius: 9,
    color: "#FFFFFF",
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 18px rgba(22, 119, 255, 0.4)",
    letterSpacing: "0.01em",
    transition: "background 0.2s, box-shadow 0.2s, transform 0.1s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "16px 0 12px",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#1A2E4C",
    display: "block",
  },
  dividerText: {
    fontSize: 10,
    color: "#475569",
    fontWeight: 600,
    letterSpacing: "0.08em",
  },
  footer: {
    textAlign: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#64748B",
    margin: 0,
  },
  footerLink: {
    color: "#1677FF",
    textDecoration: "none",
    fontWeight: 600,
    transition: "color 0.2s",
  },
  right: {
    width: "47%",
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
    background: "linear-gradient(to right, #071426 0%, rgba(7, 20, 38, 0.45) 15%, transparent 40%)",
  },
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
    maxWidth: 500,
    backgroundColor: "#071426",
    borderRadius: 16,
    border: "1px solid #162B48",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.75)",
    padding: 24,
    boxSizing: "border-box",
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 14,
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
    fontSize: 15,
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
  modalBody: {
    marginTop: 16,
    maxHeight: 280,
    overflowY: "auto",
    paddingRight: 6,
  },
  btnPrimary: {
    width: "100%",
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
};
