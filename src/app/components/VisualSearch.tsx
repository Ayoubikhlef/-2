import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { products as defaultProducts } from '../data/products';
import { getStoredProducts } from '../utils/productStorage';
import { Search, Camera, ImageUp, X, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function loadProducts() {
  return getStoredProducts(defaultProducts);
}

type DominantColor = { hex: string; name: string; weight: number };

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0, l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function extractDominantColors(imageData: ImageData): DominantColor[] {
  const data = imageData.data;
  const buckets: Map<string, { r: number; g: number; b: number; count: number }> = new Map();

  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 20) * 20;
    const g = Math.round(data[i + 1] / 20) * 20;
    const b = Math.round(data[i + 2] / 20) * 20;
    const key = `${r},${g},${b}`;
    const existing = buckets.get(key);
    if (existing) existing.count++;
    else buckets.set(key, { r, g, b, count: 1 });
  }

  const total = Array.from(buckets.values()).reduce((s, v) => s + v.count, 0);
  return Array.from(buckets.entries())
    .map(([key, v]) => ({
      hex: rgbToHex(v.r, v.g, v.b),
      name: rgbToColorName(v.r, v.g, v.b),
      weight: v.count / total,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);
}

function rgbToColorName(r: number, g: number, b: number): string {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (l > 92) return 'white';
  if (l < 8) return 'black';
  if (s < 12) return l > 60 ? 'gray' : 'charcoal';
  if (h >= 345 || h < 15) return 'red';
  if (h >= 15 && h < 40) return s > 60 ? 'orange' : 'brown';
  if (h >= 40 && h < 60) return 'yellow';
  if (h >= 60 && h < 95) return l > 50 ? 'olive' : 'green';
  if (h >= 95 && h < 165) return 'green';
  if (h >= 165 && h < 200) return 'teal';
  if (h >= 200 && h < 260) return 'blue';
  if (h >= 260 && h < 300) return 'purple';
  if (h >= 300 && h < 345) return 'pink';
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
  charcoal: { ar: 'فحمي', fr: 'charbon', en: 'charcoal' },
  other: { ar: 'آخر', fr: 'autre', en: 'other' },
};

const categoryColorAffinity: Record<string, string[]> = {
  mice: ['black', 'gray', 'white', 'charcoal', 'silver'],
  monitors: ['black', 'gray', 'white', 'silver', 'charcoal'],
  printers: ['white', 'gray', 'black', 'charcoal'],
  laptops: ['black', 'gray', 'silver', 'charcoal', 'white'],
  storage: ['black', 'blue', 'white', 'gray'],
  accessories: ['black', 'white', 'red', 'blue', 'pink', 'purple', 'green', 'orange', 'yellow', 'teal'],
  networking: ['black', 'white', 'gray', 'blue'],
};

export function VisualSearch({ onClose }: { onClose: () => void }) {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState(loadProducts);
  const [image, setImage] = useState<string | null>(null);
  const [dominantColors, setDominantColors] = useState<DominantColor[]>([]);
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
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 200, 200);
      const imageData = ctx.getImageData(0, 0, 200, 200);
      const detected = extractDominantColors(imageData);
      setDominantColors(detected);

      const colorNames = [...new Set(detected.map(d => d.name))];
      const topColor = detected[0]?.name || 'other';

      const scored = products.filter(p => !p.hidden).map(p => {
        const text = `${p.nameAr} ${p.nameFr} ${p.nameEn} ${p.descAr} ${p.descFr} ${p.descEn} ${p.brand || ''} ${p.category || ''}`.toLowerCase();
        let score = 0;

        detected.forEach((dc) => {
          const trans = colorTranslations[dc.name];
          if (!trans) return;
          const matched = Object.values(trans).some(tv => text.includes(tv.toLowerCase()));
          if (matched) score += dc.weight * 30;
        });

        const cat = p.category || '';
        const affinity = categoryColorAffinity[cat] || [];
        if (affinity.includes(topColor)) score += 15;
        if (detected.some(d => affinity.includes(d.name))) score += 8;

        if (colorNames.some(c => ['black', 'charcoal', 'gray', 'white'].includes(c)) &&
            ['monitors', 'mice', 'printers', 'laptops', 'networking'].includes(cat)) score += 10;

        return { product: p, score };
      })
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(s => s.product);

      setResults(scored.slice(0, 12));
      setLoading(false);
      setSearched(true);
      if (scored.length === 0) {
        toast.info(t({ ar: 'لم نجد منتجات مطابقة لهذه الصورة', fr: 'Aucun produit correspondant trouvé', en: 'No matching products found' }));
      }
    };
    img.src = src;
  }, [t, products]);

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
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-6 py-3 font-semibold">
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
                <img src={image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-2">{t({ ar: 'الألوان السائدة', fr: 'Couleurs dominantes', en: 'Dominant colors' })}</p>
                <div className="flex flex-wrap gap-1.5">
                  {dominantColors.map((dc, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full bg-muted font-medium">
                      <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: dc.hex }} />
                      {colorTranslations[dc.name]?.[language] || dc.name}
                    </div>
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
