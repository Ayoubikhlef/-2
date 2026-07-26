const cache = new Map<string, { data: any; expiry: number }>();

const DEFAULT_TTL = 60_000; // 1 minute

export function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

export function setCache(key: string, data: any, ttl = DEFAULT_TTL) {
  cache.set(key, { data, expiry: Date.now() + ttl });
}

export function clearCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) cache.delete(key);
  }
}
