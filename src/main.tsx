import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
import { applyBrand } from "./app/config/brand";
import { applyThemeColors } from "./app/utils/siteSettingsStorage";

declare global {
  interface Window {
    __AOS_MOUNTED__?: boolean;
  }
}

applyBrand();
applyThemeColors();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
  });
}

createRoot(document.getElementById("root")!).render(<App />);

// The boot screen and the SEO fallback live inside #root, so the render above
// already replaced them. These flags only control the recovery helpers.
window.__AOS_MOUNTED__ = true;
try {
  sessionStorage.removeItem('aos-boot-retry');
  sessionStorage.removeItem('aos-chunk-reload');
} catch {
  /* storage can be unavailable in private mode */
}

// Vite fires this when a lazily loaded chunk disappeared after a deployment.
// Reload once with a cache-busting query instead of leaving a blank screen.
window.addEventListener('vite:preloadError' as any, () => {
  try {
    if (sessionStorage.getItem('aos-chunk-reload') === '1') return;
    sessionStorage.setItem('aos-chunk-reload', '1');
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href);
  url.searchParams.set('v', String(Date.now()));
  window.location.replace(url.toString());
});
