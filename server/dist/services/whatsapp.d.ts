export declare function sendWhatsAppNotification(phone: string, customer: string, orderId: string, status: string, total?: number): Promise<string>;
export declare function sendNewOrderAlert(order: {
    id: string;
    customer: string;
    phone: string;
    wilaya: string;
    municipality: string;
    address: string;
    total: number;
    items: {
        name: string;
        quantity: number;
    }[];
}): Promise<void>;
//# sourceMappingURL=whatsapp.d.ts.map