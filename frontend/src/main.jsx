import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#071426",
          color: "#E6EDF7",
          fontFamily: "Inter, sans-serif",
          padding: "20px",
          boxSizing: "border-box"
        }}>
          <div style={{
            maxWidth: "520px",
            width: "100%",
            backgroundColor: "#0D2341",
            border: "1px solid #1E3A5F",
            borderRadius: "16px",
            padding: "28px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            textAlign: "center"
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              backgroundColor: "rgba(244,63,94,0.15)",
              border: "1px solid rgba(244,63,94,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "#F43F5E",
              fontSize: "30px"
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px", color: "#FFFFFF" }}>
              Terjadi Kendala Memuat Halaman
            </h2>
            <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "20px", lineHeight: "1.5" }}>
              Sistem mendeteksi adanya pembaruan komponen atau sesi aplikasi yang perlu disegarkan.
            </p>
            {this.state.error && (
              <div style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid #1E3A5F",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#F87171",
                textAlign: "left",
                marginBottom: "20px",
                overflowX: "auto"
              }}>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  backgroundColor: "#0284C7",
                  color: "#FFFFFF",
                  fontWeight: "600",
                  fontSize: "13px",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = "/"; }}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "#CBD5E1",
                  fontWeight: "600",
                  fontSize: "13px",
                  border: "1px solid #334155",
                  cursor: "pointer"
                }}
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
