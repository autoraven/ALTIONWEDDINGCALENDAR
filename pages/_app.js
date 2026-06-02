import "../styles/globals.css";
import { useEffect } from "react";

// ── Anti-flash: runs SYNCHRONOUSLY before first paint ──────────────────────
// Sets data-theme on <html> from localStorage before React hydrates.
const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('altion-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = saved ? saved === 'dark' : prefersDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } catch(e) {}
})();
`;

// ── BFCache fix: re-apply theme when browser restores from back/forward cache
// Without this, navigating back causes a flash where CSS vars haven't resolved yet.
function BFCacheThemeFix() {
  useEffect(() => {
    function handlePageShow(e) {
      // e.persisted = true means restored from BFCache
      if (e.persisted) {
        try {
          const saved = localStorage.getItem('altion-theme');
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const isDark = saved ? saved === 'dark' : prefersDark;
          document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } catch (_) {}
      }
    }
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);
  return null;
}

export default function App({ Component, pageProps }) {
  return (
    <>
      {/* Inline script — runs sync before render, prevents theme flash */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <BFCacheThemeFix />
      <Component {...pageProps} />
    </>
  );
}
