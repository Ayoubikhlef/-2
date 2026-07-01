import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { processMessage } from '../services/ai';
import { semanticSearch, isReady } from '../services/rag';

export const chatRouter = Router();

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  language: z.enum(['ar', 'fr', 'en']).optional(),
});

chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { message, language } = chatSchema.parse(req.body);

    const lang = language || ( /[\u0600-\u06FF]/.test(message) ? 'ar' : /[a-z]/i.test(message) ? 'en' : 'fr' );

    if (isReady()) {
      const results = await semanticSearch(message, 5);
      if (results.length > 0) {
        const maxScore = results[0].score;
        if (maxScore > 0.3) {
          const products = results.map(r => ({
            id: r.product.id,
            nameAr: r.product.nameAr,
            nameFr: r.product.nameFr,
            nameEn: r.product.nameEn,
            descAr: r.product.descAr,
            descFr: r.product.descFr,
            descEn: r.product.descEn,
            price: r.product.price,
            image: r.product.image,
            brand: r.product.brand,
            score: Math.round(r.score * 100),
          }));

          const nameKey = `name${lang.charAt(0).toUpperCase() + lang.slice(1)}` as 'nameAr' | 'nameFr' | 'nameEn';
          const names = products.map((p, i) => `${i + 1}. **${p[nameKey]}** — ${p.price.toLocaleString()} د.ج`).join('\n');

          const replies: Record<string, string> = {
            ar: `🎯 وجدت ${products.length} منتج${products.length > 1 ? 'ات' : ''} مناسبة:\n\n${names}\n\nاختر منتج للإضافة إلى السلة 🛒`,
            fr: `🎯 ${products.length} produit${products.length > 1 ? 's' : ''} trouvé${products.length > 1 ? 's' : ''}:\n\n${names}\n\nChoisissez pour ajouter au panier 🛒`,
            en: `🎯 Found ${products.length} relevant product${products.length > 1 ? 's' : ''}:\n\n${names}\n\nClick to add to cart 🛒`,
          };

          return res.json({ reply: replies[lang], products, type: 'products' });
        }
      }
    }

    const result = await processMessage(message, language);
    res.json({
      reply: result.reply,
      products: result.matchedProducts,
      type: result.type,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Chat Error]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
