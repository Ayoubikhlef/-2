import { Server as SocketServer } from 'socket.io';
export declare function initLive(httpServer: any): SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare function emitNewOrder(order: any): void;
export declare function emitStatsUpdate(stats: any): void;
export declare function emitActivity(activity: string): void;
//# sourceMappingURL=live.d.ts.map