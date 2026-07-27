"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCached = getCached;
exports.setCache = setCache;
exports.clearCache = clearCache;
const cache = new Map();
const DEFAULT_TTL = 60_000; // 1 minute
function getCached(key) {
    const entry = cache.get(key);
    if (!entry)
        return undefined;
    if (Date.now() > entry.expiry) {
        cache.delete(key);
        return undefined;
    }
    return entry.data;
}
function setCache(key, data, ttl = DEFAULT_TTL) {
    cache.set(key, { data, expiry: Date.now() + ttl });
}
function clearCache(pattern) {
    if (!pattern) {
        cache.clear();
        return;
    }
    for (const key of cache.keys()) {
        if (key.startsWith(pattern))
            cache.delete(key);
    }
}
//# sourceMappingURL=cache.js.map