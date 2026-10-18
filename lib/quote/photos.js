// Home photos stay in private Blob storage. Customer upload sessions are signed;
// staff review requires a separate password and uses short-lived image links.
import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";
import { head, issueSignedToken, presignUrl } from "@vercel/blob";
import { read, write, storeReady } from "./store.js";
const types = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};
const maxBytes = 15 * 1024 * 1024;
export const photosReady = () =>
  Boolean(
    storeReady() &&
      process.env.BLOB_READ_WRITE_TOKEN &&
      process.env.QUOTE_SIGNING_SECRET &&
      process.env.QUOTE_PHOTO_REVIEW_PASSWORD,
  );
const sign = (value) =>
  createHmac("sha256", process.env.QUOTE_SIGNING_SECRET)
    .update(value)
    .digest("hex");
export function validToken(id, token) {
  if (!process.env.QUOTE_SIGNING_SECRET || typeof token !== "string")
    return false;
  const [expires, signature] = token.split(".");
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now() || !signature)
    return false;
  const expected = sign(`${id}.${expires}`);
  return (
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  );
}
export async function photoUrl(pathname, operation = "get", type) {
  const validUntil = Date.now() + 10 * 60000;
  const token = await issueSignedToken({
    pathname,
    operations: [operation],
    validUntil,
    abortSignal: AbortSignal.timeout(6000),
    ...(type
      ? { allowedContentTypes: [type], maximumSizeInBytes: maxBytes }
      : {}),
  });
  return (
    await presignUrl(token, {
      pathname,
      operation,
      access: "private",
      validUntil,
      ...(type
        ? {
            allowedContentTypes: [type],
            maximumSizeInBytes: maxBytes,
            addRandomSuffix: false,
            allowOverwrite: false,
          }
        : {}),
    })
  ).presignedUrl;
}
export async function preparePhotos(files) {
  if (!photosReady())
    throw Object.assign(
      Error(
        "Photo uploads are unavailable. Please add an item list or email your photos.",
      ),
      { status: 503 },
    );
  if (!Array.isArray(files) || !files.length || files.length > 10)
    throw Object.assign(Error("Choose between 1 and 10 photos."), {
      status: 400,
    });
  for (const file of files)
    if (
      !types[file.type] ||
      !Number.isInteger(file.size) ||
      file.size < 1 ||
      file.size > maxBytes
    )
      throw Object.assign(
        Error("Use JPEG, PNG, WebP, HEIC or HEIF photos up to 15 MB each."),
        { status: 400 },
      );
  const id = randomUUID();
  const expires = Date.now() + 86400000;
  const entries = files.map((file) => ({
    pathname: `quote-photos/${id}/${randomUUID()}.${types[file.type]}`,
    type: file.type,
    size: file.size,
  }));
  await write(
    `quote:photos:${id}`,
    { files: entries, submitted: false, createdAt: Date.now() },
    86400,
  );
  const uploads = await Promise.all(
    entries.map(async (file) => ({
      ...file,
      url: await photoUrl(file.pathname, "put", file.type),
    })),
  );
  return {
    sessionId: id,
    token: `${expires}.${sign(`${id}.${expires}`)}`,
    uploads,
  };
}
function isImage(bytes, type) {
  if (type === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === "image/png")
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "image/webp")
    return (
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    );
  return (
    bytes.toString("ascii", 4, 8) === "ftyp" &&
    /heic|heix|hevc|hevx|mif1|msf1/.test(bytes.toString("ascii", 8, 32))
  );
}
export async function verifyPhotos(input) {
  if (!input.photoSessionId) return [];
  if (!validToken(input.photoSessionId, input.photoSessionToken))
    throw Object.assign(
      Error("Your photo upload session expired. Please upload again."),
      { status: 400 },
    );
  const session = await read(`quote:photos:${input.photoSessionId}`);
  if (!session?.files?.length)
    throw Object.assign(
      Error(
        "Photos could not be found. Please upload again or add an item list.",
      ),
      { status: 400 },
    );
  if (session.verified) return session.files;
  await Promise.all(
    session.files.map(async (file) => {
      const metadata = await head(file.pathname, {
        abortSignal: AbortSignal.timeout(6000),
      });
      if (metadata.size !== file.size || metadata.contentType !== file.type)
        throw Object.assign(
          Error("A photo upload is incomplete. Please upload again."),
          { status: 400 },
        );
      const response = await fetch(await photoUrl(file.pathname), {
        headers: { Range: "bytes=0-31" },
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw Error("Photo verification failed");
      const reader = response.body.getReader();
      const chunks = [];
      let length = 0;
      while (length < 32) {
        const part = await reader.read();
        if (part.done) break;
        chunks.push(Buffer.from(part.value));
        length += part.value.length;
      }
      await reader.cancel();
      if (!length || !isImage(Buffer.concat(chunks).subarray(0, 32), file.type))
        throw Object.assign(
          Error(
            "One file is not a supported photo. Please choose a different image.",
          ),
          { status: 400 },
        );
    }),
  );
  await write(
    `quote:photos:${input.photoSessionId}`,
    { ...session, verified: true },
    86400,
  );
  return session.files;
}
export async function markPhotosSubmitted(input) {
  if (!input.photoSessionId) return;
  const key = `quote:photos:${input.photoSessionId}`;
  const session = await read(key);
  if (session) await write(key, { ...session, submitted: true }, 30 * 86400);
}
