import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const isLogin = window.location.pathname.startsWith("/auth/login");
      if (isLogin) return "light";
      try {
        const saved = localStorage.getItem("asset-app-theme");
        if (saved) return saved;
      } catch {}
    }
    return "dark"; // Default dark mode (navy)
  });

  useEffect(() => {
    const isLoginPage = window.location.pathname.startsWith("/auth/login");
    const root = document.documentElement;

    if (isLoginPage) {
      // Halaman login khusus: tidak pernah ada dark mode dan selalu light mode
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
    } catch {}
  }, [theme]);

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
