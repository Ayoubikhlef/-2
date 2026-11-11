import { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './TechHeroBackground.css';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
};

type Glow = {
  ax: number;
  ay: number;
  radius: number;
  color: string;
  ampX: number;
  ampY: number;
  speed: number;
  phase: number;
};

type Palette = {
  link: string;
  halo: string;
  core: string;
  glows: Array<{ color: string; strength: number }>;
};

const DARK_PALETTE: Palette = {
  link: '96, 165, 250',
  halo: '56, 189, 248',
  core: '191, 219, 254',
  glows: [
    { color: '14, 165, 233', strength: 0.42 },
    { color: '37, 99, 235', strength: 0.4 },
    { color: '56, 189, 248', strength: 0.34 },
  ],
};

const LIGHT_PALETTE: Palette = {
  link: '37, 99, 235',
  halo: '14, 165, 233',
  core: '30, 64, 175',
  glows: [
    { color: '56, 189, 248', strength: 0.3 },
    { color: '59, 130, 246', strength: 0.26 },
    { color: '14, 165, 233', strength: 0.2 },
  ],
};

/**
 * Lightweight animated technology background for the main hero.
 *
 * A canvas constellation (drifting nodes + connecting lines) sits on top of
 * CSS-only gradients, a slowly drifting circuit grid and a scan line. No video
 * or image download, and animation is paused when the tab is hidden.
 *
 * The palette follows the active theme so light mode keeps the same motion
 * without a dark block breaking the page. Visitors who ask for reduced motion
 * get the scene at a much slower pace instead of a frozen picture.
 */
export function TechHeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = theme === 'light' ? LIGHT_PALETTE : DARK_PALETTE;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let motionScale = media.matches ? 0.3 : 1;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let glows: Glow[] = [];
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

      const count = Math.round(Math.min(105, Math.max(40, (width * height) / 14_000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.62,
        vy: (Math.random() - 0.5) * 0.62,
        radius: 1.1 + Math.random() * 1.7,
        phase: Math.random() * Math.PI * 2,
      }));

      glows = [
        { ax: 0.78, ay: 0.24, radius: 0.5, ampX: 90, ampY: 55, speed: 0.00019, phase: 0 },
        { ax: 0.16, ay: 0.8, radius: 0.46, ampX: 70, ampY: 60, speed: 0.00015, phase: 2.1 },
        { ax: 0.5, ay: 0.5, radius: 0.34, ampX: 120, ampY: 45, speed: 0.00023, phase: 4.2 },
      ].map((glow, index) => ({
        ...glow,
        color: palette.glows[index]?.color ?? palette.glows[0].color,
      }));

      draw(0, true);
    };

    const draw = (time: number, staticFrame = false) => {
      const motionTime = staticFrame ? 0 : time;
      ctx.clearRect(0, 0, width, height);

      // Slow moving light blooms. They are drawn in canvas (not only CSS) so
      // the background keeps breathing even when CSS animations are reduced.
      glows.forEach((glow, index) => {
        const sway = staticFrame ? 0 : motionTime * glow.speed;
        const cx = glow.ax * width + Math.cos(sway + glow.phase) * glow.ampX;
        const cy = glow.ay * height + Math.sin(sway * 1.35 + glow.phase * 1.7) * glow.ampY;
        const radius = glow.radius * Math.min(width, height);
        const strength = palette.glows[index]?.strength ?? 0.3;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, `rgba(${glow.color}, ${strength})`);
        gradient.addColorStop(0.55, `rgba(${glow.color}, ${strength * 0.38})`);
        gradient.addColorStop(1, `rgba(${glow.color}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      const linkDistance = Math.min(170, Math.max(110, width / 9));
      const linkDistanceSq = linkDistance * linkDistance;

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        if (!staticFrame) {
          particle.x += particle.vx * motionScale;
          particle.y += particle.vy * motionScale;
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
          const alpha = (1 - Math.sqrt(distanceSq) / linkDistance) * 0.55;
          ctx.strokeStyle = `rgba(${palette.link}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }

        const twinkle = staticFrame
          ? 0.85
          : 0.75 + Math.sin(motionTime / 900 + particle.phase) * 0.25;
        // Soft halo first, then the bright core: gives the nodes a glow
        // without the cost of canvas shadows.
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 3.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${palette.halo}, ${twinkle * 0.22})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${palette.core}, ${twinkle})`;
        ctx.fill();
      }
    };

    const loop = (time: number) => {
      if (!startTime) startTime = time;
      draw(time - startTime);
      raf = window.requestAnimationFrame(loop);
    };

    const start = () => {
      if (raf || document.hidden) return;
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
      // Slow the scene down instead of freezing it, then let the running loop
      // pick up the new pace on its next frame.
      motionScale = media.matches ? 0.3 : 1;
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
  }, [theme]);

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
