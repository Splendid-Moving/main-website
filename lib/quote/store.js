// Durable request claims prevent concurrent or repeated submissions from
// sending the same quote twice. Keys contain hashes, not customer information.
import { createHash } from "node:crypto";
export const storeReady = () =>
  Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
export const hash = (value) =>
  createHash("sha256").update(String(value)).digest("hex");
export async function redis(...command) {
  if (!storeReady()) throw Error("Quote storage is not configured");
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw Error("Quote storage unavailable");
  const result = await response.json();
  if (result.error) throw Error("Quote storage command failed");
  return result.result;
}
export async function claim(key, fingerprint) {
  // Stable request IDs remain protected for 30 days. Identical new requests
  // share that result for ten minutes, allowing genuine later re-quoting.
  const result = await redis(
    "EVAL",
    "if redis.call('EXISTS',KEYS[1])==1 then return KEYS[1] end; local old=redis.call('GET',KEYS[2]); if old and redis.call('EXISTS',old)==1 then return old end; redis.call('SET',KEYS[1],ARGV[1],'EX',2592000); redis.call('SET',KEYS[2],KEYS[1],'EX',600); return 1",
    2,
    key,
    `quote:payload:${fingerprint}`,
    JSON.stringify({ phase: "processing", fingerprint }),
  );
  return result === 1 ? true : result;
}
export const read = async (key) => {
  const value = await redis("GET", key);
  return value ? JSON.parse(value) : null;
};
export const release = (key) => redis("DEL", key);
export const write = (key, value, seconds = 30 * 86400) =>
  redis("SET", key, JSON.stringify(value), "EX", seconds);
export async function rateLimit(req, limit = 30) {
  if (!storeReady()) return;
  const ip = String(
    req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "unknown",
  )
    .split(",")[0]
    .trim();
  const key = `quote:limit:${hash(ip)}:${Math.floor(Date.now() / 60000)}`;
  // Lua keeps expiry and increment atomic, including on the first request.
  const count = await redis(
    "EVAL",
    "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],120) end; return n",
    1,
    key,
  );
  if (count > limit)
    throw Object.assign(
      Error("Too many requests. Please wait a minute or call us."),
      { status: 429 },
    );
}
