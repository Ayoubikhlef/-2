"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReady = isReady;
exports.initRAG = initRAG;
exports.syncProducts = syncProducts;
exports.cosineSimilarity = cosineSimilarity;
exports.semanticSearch = semanticSearch;
let extractor = null;
let vectors = [];
let ready = false;
function isReady() { return ready; }
async function initRAG() {
    try {
        const { pipeline } = await Promise.resolve().then(() => __importStar(require('@xenova/transformers')));
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        ready = true;
        console.log('[RAG] Model loaded');
    }
    catch (err) {
        console.error('[RAG] Failed to load model:', err);
    }
}
function productToText(p) {
    return `${p.nameAr} ${p.nameFr} ${p.nameEn} ${p.descAr} ${p.descFr} ${p.descEn} ${p.brand || ''} ${p.category}`;
}
async function syncProducts(products) {
    if (!ready) {
        console.warn('[RAG] Not ready, skipping sync');
        return;
    }
    const existing = new Set(vectors.map(v => v.id));
    const toAdd = products.filter(p => !p.hidden && !existing.has(p.id));
    for (const p of toAdd) {
        const text = productToText(p);
        const result = await extractor(text, { pooling: 'mean', normalize: true });
        vectors.push({ id: p.id, text, embedding: Array.from(result.data), product: p });
    }
    vectors = vectors.filter(v => !products.some(p => p.id === v.id && p.hidden));
    console.log(`[RAG] ${vectors.length} products indexed`);
}
function cosineSimilarity(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}
async function semanticSearch(query, topK = 5) {
    if (!ready || vectors.length === 0)
        return [];
    const result = await extractor(query, { pooling: 'mean', normalize: true });
    const queryEmb = Array.from(result.data);
    const scored = vectors
        .map(v => ({ product: v.product, score: cosineSimilarity(queryEmb, v.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    return scored;
}
//# sourceMappingURL=rag.js.map