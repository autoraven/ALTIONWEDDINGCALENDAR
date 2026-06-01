// lib/useTheme.js
// Shared dark mode hook — sync via localStorage + data-theme on <html>
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "altion-theme";

export function useTheme() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  const toggle = useCallback(() => {
    setDark(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { dark, toggle, mounted };
}

// Standalone toggle button — drop anywhere in a header
export function ThemeToggle({ style = {} }) {
  const { dark, toggle, mounted } = useTheme();
  if (!mounted) return null;
  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{
        width: 38, height: 38,
        borderRadius: 12,
        border: "1.5px solid var(--border)",
        background: "var(--card)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
        color: "var(--dark)",
        transition: "all 0.2s",
        flexShrink: 0,
        boxShadow: "var(--shadow-sm)",
        ...style,
      }}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
