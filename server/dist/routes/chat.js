"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const ai_1 = require("../services/ai");
const rag_1 = require("../services/rag");
exports.chatRouter = (0, express_1.Router)();
const chatSchema = zod_1.z.object({
    message: zod_1.z.string().min(1, 'Message is required').max(800, 'Message is too long'),
    language: zod_1.z.enum(['ar', 'fr', 'en']).optional(),
});
exports.chatRouter.post('/', async (req, res) => {
    try {
        const { message, language } = chatSchema.parse(req.body);
        const lang = language || (/[\u0600-\u06FF]/.test(message) ? 'ar' : /[a-z]/i.test(message) ? 'en' : 'fr');
        if ((0, rag_1.isReady)()) {
            const results = await (0, rag_1.semanticSearch)(message, 5);
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
                    const nameKey = `name${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
                    const names = products.map((p, i) => `${i + 1}. **${p[nameKey]}** — ${p.price.toLocaleString()} د.ج`).join('\n');
                    const replies = {
                        ar: `🎯 وجدت ${products.length} منتج${products.length > 1 ? 'ات' : ''} مناسبة:\n\n${names}\n\nاختر منتج للإضافة إلى السلة 🛒`,
                        fr: `🎯 ${products.length} produit${products.length > 1 ? 's' : ''} trouvé${products.length > 1 ? 's' : ''}:\n\n${names}\n\nChoisissez pour ajouter au panier 🛒`,
                        en: `🎯 Found ${products.length} relevant product${products.length > 1 ? 's' : ''}:\n\n${names}\n\nClick to add to cart 🛒`,
                    };
                    return res.json({ reply: replies[lang], products, type: 'products' });
                }
            }
        }
        const result = await (0, ai_1.processMessage)(message, language);
        res.json({
            reply: result.reply,
            products: result.matchedProducts,
            type: result.type,
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        console.error('[Chat Error]', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
//# sourceMappingURL=chat.js.map