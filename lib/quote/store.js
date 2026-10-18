// Small, temporary caches reduce repeat mileage lookups and obvious form spam.
// Quote receipts live in GoHighLevel; this cache never decides whether a
// returning customer can receive a new quote and requires no database.
import { createHash } from "node:crypto";
const cache = new Map();
export const hash = (value) =>
  createHash("sha256").update(String(value)).digest("hex");
export function read(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expires <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}
export function write(key, value, seconds = 300) {
  if (cache.size >= 2000) cache.delete(cache.keys().next().value);
  cache.set(key, { value, expires: Date.now() + seconds * 1000 });
}
export async function rateLimit(req, limit = 30) {
  const ip = String(
    req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "unknown",
  )
    .split(",")[0]
    .trim();
  const key = `limit:${hash(ip)}:${Math.floor(Date.now() / 60000)}`;
  const count = (read(key) ?? 0) + 1;
  write(key, count, 120);
  if (count > limit)
    throw Object.assign(
      Error("Too many requests. Please wait a minute or call us."),
      { status: 429 },
    );
}
