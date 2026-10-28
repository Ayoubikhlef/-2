
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
import { applyBrand } from "./app/config/brand";
import { applyThemeColors } from "./app/utils/siteSettingsStorage";

applyBrand();
applyThemeColors();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
  