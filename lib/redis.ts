// Upstash Redis client — used for metadata cache (Sprint 3)
// Placeholder until UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are configured

let redis: { get: (key: string) => Promise<string | null>; set: (key: string, value: string, options?: { ex?: number }) => Promise<void> } | null = null;

export async function getRedis() {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  redis = {
    async get(key: string) {
      const res = await fetch(`${url}/get/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data?.result ?? null;
    },
    async set(key: string, value: string, options?: { ex?: number }) {
      const ex = options?.ex ? `?ex=${options.ex}` : "";
      await fetch(`${url}/set/${key}/${encodeURIComponent(value)}${ex}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  };

  return redis;
}
