export interface ProductResult {
    id: string;
    nameAr: string;
    nameFr: string;
    nameEn: string;
    descAr: string;
    descFr: string;
    descEn: string;
    price: number;
    salePrice: number | null;
    saleEnd: Date | null;
    sku: string;
    stock: number;
    brand: string | null;
    warranty: string | null;
    image: string | null;
}
export interface ChatResponse {
    reply: string;
    matchedProducts: ProductResult[];
    type: 'products' | 'greeting' | 'info' | 'unknown';
}
export declare function processMessage(message: string, language?: 'ar' | 'fr' | 'en'): Promise<ChatResponse>;
//# sourceMappingURL=ai.d.ts.map