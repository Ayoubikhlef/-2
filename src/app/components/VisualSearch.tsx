import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { products as defaultProducts } from '../data/products';
import { getStoredProducts } from '../utils/productStorage';
import { Search, Camera, ImageUp, X, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function loadProducts() {
  return getStoredProducts(defaultProducts);
}

function extractColors(imageData: ImageData): string[] {
  const data = imageData.data;
  const colorCounts: Record<string, number> = {};
  const step = 10;

  for (let i = 0; i < data.length; i += step * 4) {
    const r = Math.round(data[i] / 30) * 30;
    const g = Math.round(data[i + 1] / 30) * 30;
    const b = Math.round(data[i + 2] / 30) * 30;
    const key = `${r},${g},${b}`;
    colorCounts[key] = (colorCounts[key] || 0) + 1;
  }

  const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
  const topColors = sorted.slice(0, 8).map(([key]) => {
    const [r, g, b] = key.split(',').map(Number);
    return rgbToColorName(r, g, b);
  });

  return [...new Set(topColors)];
}

function rgbToColorName(r: number, g: number, b: number): string {
  if (r > 200 && g > 200 && b > 200) return 'white';
  if (r < 50 && g < 50 && b < 50) return 'black';
  if (r > 200 && g < 100 && b < 100) return 'red';
  if (r < 100 && g > 150 && b < 100) return 'green';
  if (r < 100 && g < 100 && b > 180) return 'blue';
  if (r > 200 && g > 150 && b < 100) return 'orange';
  if (r > 180 && g > 180 && b < 100) return 'yellow';
  if (r > 150 && g < 100 && b > 150) return 'purple';
  if (r < 100 && g > 100 && b > 150) return 'teal';
  if (r > 150 && g > 150 && b > 150) return 'gray';
  if (r > 200 && g > 100 && b > 150) return 'pink';
  if (r > 150 && g < 60 && b < 60) return 'brown';
  if (r > 100 && r < 180 && g > 100 && g < 180 && b < 100) return 'olive';
  if (r < 80 && g < 80 && b > 100) return 'navy';
  if (r > 180 && g > 180 && b > 180) return 'silver';
  if (r > 200 && g > 200 && b < 50) return 'gold';
  return 'other';
}

const colorTranslations: Record<string, Record<string, string>> = {
  white: { ar: 'أبيض', fr: 'blanc', en: 'white' },
  black: { ar: 'أسود', fr: 'noir', en: 'black' },
  red: { ar: 'أحمر', fr: 'rouge', en: 'red' },
  green: { ar: 'أخضر', fr: 'vert', en: 'green' },
  blue: { ar: 'أزرق', fr: 'bleu', en: 'blue' },
  orange: { ar: 'برتقالي', fr: 'orange', en: 'orange' },
  yellow: { ar: 'أصفر', fr: 'jaune', en: 'yellow' },
  purple: { ar: 'بنفسجي', fr: 'violet', en: 'purple' },
  teal: { ar: 'سماوي', fr: 'cyan', en: 'teal' },
  gray: { ar: 'رمادي', fr: 'gris', en: 'gray' },
  pink: { ar: 'وردي', fr: 'rose', en: 'pink' },
  brown: { ar: 'بني', fr: 'marron', en: 'brown' },
  olive: { ar: 'زيتوني', fr: 'olive', en: 'olive' },
  navy: { ar: 'كحلي', fr: 'bleu marine', en: 'navy' },
  silver: { ar: 'فضي', fr: 'argenté', en: 'silver' },
  gold: { ar: 'ذهبي', fr: 'doré', en: 'gold' },
  other: { ar: 'آخر', fr: 'autre', en: 'other' },
};

export function VisualSearch({ onClose }: { onClose: () => void }) {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState(loadProducts);
  const [image, setImage] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [results, setResults] = useState<typeof products>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const refresh = () => setProducts(loadProducts());
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
  }, []);

  const processImage = useCallback((src: string) => {
    setImage(src);
    setLoading(true);
    setSearched(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 100, 100);
      const imageData = ctx.getImageData(0, 0, 100, 100);
      const detected = extractColors(imageData);
      setColors(detected);

      const matched = products.filter(p => !p.hidden).filter((p) => {
        const text = `${p.nameAr} ${p.nameFr} ${p.nameEn} ${p.descAr} ${p.descFr} ${p.descEn} ${p.brand || ''} ${p.category || ''}`.toLowerCase();
        return detected.some((c) => {
          const trans = colorTranslations[c];
          if (!trans) return false;
          return Object.values(trans).some((t) => text.includes(t.toLowerCase()));
        });
      });

      const scored = matched.map(p => {
        const text = `${p.nameAr} ${p.nameFr} ${p.nameEn} ${p.descAr} ${p.descFr} ${p.descEn} ${p.brand || ''}`.toLowerCase();
        let score = 0;
        detected.forEach((c) => {
          const trans = colorTranslations[c];
          if (trans) Object.values(trans).forEach(t => { if (text.includes(t.toLowerCase())) score += 10; });
        });
        const cat = p.category || '';
        if (detected.some(c => ['black', 'gray', 'white', 'silver'].includes(c)) && ['mice', 'monitors', 'printers'].includes(cat)) score += 5;
        if (detected.some(c => ['blue', 'red', 'green', 'orange'].includes(c)) && cat === 'accessories') score += 3;
        if (p.nameEn.toLowerCase().includes('wireless') || p.nameFr.toLowerCase().includes('sans fil')) score += 2;
        return { product: p, score };
      })
        .sort((a, b) => b.score - a.score)
        .map(s => s.product);

      setResults(scored.slice(0, 12));
      setLoading(false);
      setSearched(true);
      if (matched.length === 0) {
        toast.info(t({ ar: 'لم نجد منتجات بهذه الألوان', fr: 'Aucun produit trouvé avec ces couleurs', en: 'No products found with these colors' }));
      }
    };
    img.src = src;
  }, [t]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-[32px] border border-border bg-background shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t({ ar: 'بحث بالصورة', fr: 'Recherche par image', en: 'Visual Search' })}</h2>
              <p className="text-xs text-muted-foreground">{t({ ar: 'ارفع صورة للبحث عن منتجات مشابهة', fr: 'Téléchargez une image pour trouver des produits similaires', en: 'Upload an image to find similar products' })}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {!image ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
              <ImageUp className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {t({ ar: 'قم برفع صورة منتج أو التقاط صورة بالكاميرا', fr: 'Téléchargez une photo ou prenez-en une avec votre caméra', en: 'Upload a product photo or take one with your camera' })}
            </p>
            <div className="flex gap-3">
              <button onClick={() => fileRef.current?.click()} className="btn-liquid flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-6 py-3 font-semibold">
                <ImageUp className="w-4 h-4" />
                {t({ ar: 'رفع صورة', fr: 'Upload', en: 'Upload Image' })}
              </button>
              <button onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'environment';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => processImage(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }} className="flex items-center gap-2 rounded-2xl border border-border px-6 py-3 font-semibold hover:bg-muted transition-colors">
                <Camera className="w-4 h-4" />
                {t({ ar: 'كاميرا', fr: 'Caméra', en: 'Camera' })}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-border bg-muted flex-shrink-0">
                <img ref={imgRef} src={image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">{t({ ar: 'الألوان المكتشفة', fr: 'Couleurs détectées', en: 'Detected colors' })}</p>
                <div className="flex flex-wrap gap-1.5">
                  {colors.map((c) => (
                    <span key={c} className="text-[10px] px-2 py-1 rounded-full bg-muted font-medium">
                      {colorTranslations[c]?.[language] || c}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => { setImage(null); setResults([]); setSearched(false); }}
                className="text-xs text-primary font-semibold hover:underline flex-shrink-0">
                {t({ ar: 'جديد', fr: 'Nouvelle', en: 'New Search' })}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : searched && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  {results.length > 0
                    ? t({ ar: `تم العثور على ${results.length} منتج`, fr: `${results.length} produit(s) trouvé(s)`, en: `${results.length} product(s) found` })
                    : t({ ar: 'لا توجد نتائج', fr: 'Aucun résultat', en: 'No results' })}
                </p>
                {results.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                    {results.map((p) => (
                      <div key={p.id} className="rounded-xl border border-border bg-card p-3 hover:shadow-lg transition-all text-center">
                        <div className="w-full h-20 rounded-lg bg-muted overflow-hidden mb-2">
                          <img src={p.image} alt="" className="w-full h-full object-contain" loading="lazy" />
                        </div>
                        <p className="text-xs font-semibold truncate">{language === 'ar' ? p.nameAr : language === 'fr' ? p.nameFr : p.nameEn}</p>
                        <p className="text-xs text-primary font-bold mt-1">{p.price.toLocaleString()} د.ج</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
