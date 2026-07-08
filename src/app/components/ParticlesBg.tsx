import { useEffect, useRef } from 'react';

export function ParticlesBg() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return;

    const count = 8;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('div');
      dot.className = 'particle-dot';
      dot.style.setProperty('--p-size', `${2 + Math.random() * 3}px`);
      dot.style.setProperty('--p-x', `${Math.random() * 100}%`);
      dot.style.setProperty('--p-duration', `${20 + Math.random() * 30}s`);
      dot.style.setProperty('--p-delay', `${Math.random() * 20}s`);
      dot.style.setProperty('--p-opacity', `${0.15 + Math.random() * 0.15}`);
      container.appendChild(dot);
    }
  }, []);

  return <div id="particles-container" ref={containerRef} />;
}
