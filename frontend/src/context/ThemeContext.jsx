import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("asset-app-theme") || localStorage.getItem("theme");
        if (saved === "light" || saved === "dark") return saved;
      } catch {}
    }
    return "dark"; // Default dark mode (navy)
  });

  useEffect(() => {
    const isLoginPage = window.location.pathname.startsWith("/auth/login");
    const root = document.documentElement;

    if (isLoginPage) {
      // Halaman login khusus: tidak pernah ada dark mode dan selalu light mode tanpa merusak preferensi tema aplikasi
      root.classList.remove("dark");
      root.classList.add("light");
      return;
    }

    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    try {
      localStorage.setItem("asset-app-theme", theme);
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  // Sinkronisasi jika tema diubah dari tab/halaman lain
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "asset-app-theme" || e.key === "theme") {
        if (e.newValue === "light" || e.newValue === "dark") {
          setTheme(e.newValue);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      const root = document.documentElement;
      if (next === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
      try {
        localStorage.setItem("asset-app-theme", next);
        localStorage.setItem("theme", next);
      } catch {}
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
