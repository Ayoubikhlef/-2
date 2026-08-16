export declare function sendTelegramMessage(text: string): Promise<boolean>;
export declare function sendNewOrderTelegramAlert(order: {
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
}): Promise<boolean>;
export declare function sendDiscordWebhook(text: string): Promise<boolean>;
export declare function sendNewOrderDiscordAlert(order: {
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
}): Promise<boolean>;
//# sourceMappingURL=telegram.d.ts.map