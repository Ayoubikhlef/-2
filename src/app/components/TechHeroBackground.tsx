import { useEffect, useRef } from 'react';
import './TechHeroBackground.css';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
};

/**
 * Lightweight animated technology background for the main hero.
 *
 * A canvas constellation (drifting nodes + connecting lines) sits on top of
 * CSS-only gradients, a slowly drifting circuit grid and a scan line. No video
 * or image download, and animation is paused when the tab is hidden or when
 * the visitor asks for reduced motion.
 */
export function TechHeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = media.matches;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let startTime = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(64, Math.max(24, (width * height) / 24_000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        radius: 0.8 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
      }));

      draw(0, true);
    };

    const draw = (time: number, staticFrame = false) => {
      ctx.clearRect(0, 0, width, height);
      const linkDistance = Math.min(150, Math.max(95, width / 11));
      const linkDistanceSq = linkDistance * linkDistance;

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        if (!staticFrame) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (particle.x < -20) particle.x = width + 20;
          else if (particle.x > width + 20) particle.x = -20;
          if (particle.y < -20) particle.y = height + 20;
          else if (particle.y > height + 20) particle.y = -20;
        }

        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq > linkDistanceSq) continue;
          const alpha = (1 - Math.sqrt(distanceSq) / linkDistance) * 0.4;
          ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }

        const twinkle = staticFrame
          ? 0.8
          : 0.65 + Math.sin(time / 1100 + particle.phase) * 0.3;
        // Soft halo first, then the bright core: gives the nodes a glow
        // without the cost of canvas shadows.
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${twinkle * 0.14})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${twinkle})`;
        ctx.fill();
      }
    };

    const loop = (time: number) => {
      if (!startTime) startTime = time;
      draw(time - startTime);
      raf = window.requestAnimationFrame(loop);
    };

    const start = () => {
      if (raf || reducedMotion || document.hidden) return;
      raf = window.requestAnimationFrame(loop);
    };

    const stop = () => {
      if (!raf) return;
      window.cancelAnimationFrame(raf);
      raf = 0;
      startTime = 0;
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const onMotionPreference = () => {
      reducedMotion = media.matches;
      if (reducedMotion) {
        stop();
        draw(0, true);
      } else {
        start();
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    start();

    document.addEventListener('visibilitychange', onVisibility);
    media.addEventListener('change', onMotionPreference);
    window.addEventListener('resize', resize);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      media.removeEventListener('change', onMotionPreference);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="tech-hero pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="tech-hero-base absolute inset-0" />
      <div className="tech-hero-grid" />
      <div className="tech-hero-orb tech-hero-orb-one" />
      <div className="tech-hero-orb tech-hero-orb-two" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="tech-hero-scan" />
    </div>
  );
}
