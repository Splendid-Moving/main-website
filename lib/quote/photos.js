// Validate optimized inventory photos before they become office email attachments.
// Images stay in the browser until final submission and are never published as URLs.
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const invalid = (message) => Object.assign(Error(message), { status: 400 });
export function validatePhotos(photos = []) {
  if (!Array.isArray(photos) || photos.length > 10)
    throw invalid("Choose up to 10 photos.");
  let total = 0;
  return photos.map((photo, index) => {
    if (
      !photo ||
      typeof photo.content !== "string" ||
      !photo.content.length ||
      photo.content.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4
    )
      throw invalid(
        "Photo size limit exceeded. Please choose smaller photos or write an item list.",
      );
    if (
      photo.content.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(photo.content)
    )
      throw invalid("Please choose a valid photo.");
    const bytes = Buffer.from(photo.content, "base64");
    total += bytes.length;
    if (total > MAX_PHOTO_BYTES)
      throw invalid(
        "Photo size limit exceeded. Please optimize your photos again.",
      );
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const png = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp =
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP";
    const type = jpeg
      ? "image/jpeg"
      : png
        ? "image/png"
        : webp
          ? "image/webp"
          : null;
    if (!type || photo.contentType !== type)
      throw invalid("One photo is not a valid supported image.");
    return {
      filename: `inventory-${String(index + 1).padStart(2, "0")}.${jpeg ? "jpg" : png ? "png" : "webp"}`,
      contentType: type,
      content: photo.content,
      size: bytes.length,
    };
  });
}
export const verifyPhotos = async (input) => validatePhotos(input.photos);
export const photosReady = () =>
  Boolean(
    process.env.RESEND_API_KEY &&
    process.env.RESEND_FROM &&
    process.env.LONG_DISTANCE_QUOTE_TO,
  );
