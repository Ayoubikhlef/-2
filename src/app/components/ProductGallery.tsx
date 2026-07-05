import { useState, useRef, type MouseEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const allImages = images.length > 0 ? images : [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLDivElement>(null);

  if (allImages.length === 0) return null;

  const currentSrc = allImages[selectedIndex];

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const prev = () => setSelectedIndex((i) => (i === 0 ? allImages.length - 1 : i - 1));
  const next = () => setSelectedIndex((i) => (i === allImages.length - 1 ? 0 : i + 1));

  return (
    <div className="space-y-3">
      <div
        ref={imgRef}
        className="relative h-64 sm:h-80 overflow-hidden bg-muted cursor-crosshair select-none"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={currentSrc}
          alt={name}
          className="w-full h-full object-contain bg-white/50 dark:bg-white/5 pointer-events-none"
          style={
            zoom
              ? { transform: 'scale(2)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
              : undefined
          }
        />
        {allImages.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" dir="ltr">
          {allImages.map((src, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                idx === selectedIndex ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-muted-foreground'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
