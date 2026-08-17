import { useEffect, useState } from 'react';

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[80] h-[3px] pointer-events-none print:hidden">
      <div
        className="h-full bg-gradient-to-r from-primary via-blue-500 to-cyan-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}