
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
  