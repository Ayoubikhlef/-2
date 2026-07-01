import { useEffect, useRef } from 'react';

const COLORS = ['rgba(59,130,246,0.3)', 'rgba(245,158,11,0.2)', 'rgba(99,102,241,0.2)'];
const DARK_COLORS = ['rgba(59,130,246,0.12)', 'rgba(245,158,11,0.08)', 'rgba(99,102,241,0.08)'];

export function ParticlesBg() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isDark = document.documentElement.classList.contains('dark');
    const colors = isDark ? DARK_COLORS : COLORS;
    const count = 30;

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('div');
      dot.className = 'particle-dot';
      const size = 2 + Math.random() * 4;
      dot.style.setProperty('--p-size', `${size}px`);
      dot.style.setProperty('--p-x', `${Math.random() * 100}%`);
      dot.style.setProperty('--p-duration', `${10 + Math.random() * 20}s`);
      dot.style.setProperty('--p-delay', `${Math.random() * 15}s`);
      dot.style.setProperty('--p-opacity', `${0.2 + Math.random() * 0.4}`);
      dot.style.setProperty('--p-color', colors[Math.floor(Math.random() * colors.length)]);
      container.appendChild(dot);
    }

    const observer = new MutationObserver(() => {
      const darkNow = document.documentElement.classList.contains('dark');
      const newColors = darkNow ? DARK_COLORS : COLORS;
      container.querySelectorAll('.particle-dot').forEach((el) => {
        const idx = Math.floor(Math.random() * newColors.length);
        (el as HTMLElement).style.setProperty('--p-color', newColors[idx]);
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      container.innerHTML = '';
    };
  }, []);

  return <div id="particles-container" ref={containerRef} />;
}
