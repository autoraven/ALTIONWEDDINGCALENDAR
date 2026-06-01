import "../styles/globals.css";

// Inject theme BEFORE first paint to prevent flash
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

export default function App({ Component, pageProps }) {
  return (
    <>
      {/* Inline script runs synchronously before render — zero flash */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <Component {...pageProps} />
    </>
  );
}
