const cache = new Map();

export function get(key) {
    const entry = cache.get(key);
    if (!!entry && entry.expires > Date.now()) {
        return entry.value;
    }
    return undefined;
}

export function set(key, val, ttl) {
    if (!ttl) {
        ttl = 9 * 365 * 86400 * 1000;
    }
    cache.set(key, {
        value: val,
        expires: Date.now() + ttl,
    });
}