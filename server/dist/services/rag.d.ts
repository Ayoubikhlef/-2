export interface ProductRecord {
    id: number;
    nameAr: string;
    nameFr: string;
    nameEn: string;
    descAr: string;
    descFr: string;
    descEn: string;
    price: number;
    image: string;
    brand?: string;
    category: string;
    hidden?: boolean;
}
export declare function isReady(): boolean;
export declare function initRAG(): Promise<void>;
export declare function syncProducts(products: ProductRecord[]): Promise<void>;
export declare function cosineSimilarity(a: number[], b: number[]): number;
export declare function semanticSearch(query: string, topK?: number): Promise<{
    product: ProductRecord;
    score: number;
}[]>;
//# sourceMappingURL=rag.d.ts.map