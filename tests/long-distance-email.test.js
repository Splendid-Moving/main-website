// Long-distance requests go only to the office, with private email attachments.
// All network calls are mocked and every customer fixture uses the authorized phone.
import test from "node:test";
import assert from "node:assert/strict";
import { validatePhotos, MAX_PHOTO_BYTES } from "../lib/quote/photos.js";
import { sendLongDistanceEmail } from "../lib/quote/long-distance-email.js";
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWAAAAABJRU5ErkJggg==";
const input = {
  requestId: "12345678-1234-4234-8234-123456789012",
  firstName: "Quote Form",
  lastName: "Test",
  phone: "+18185054576",
  email: "quote-test-8185054576@example.com",
  addressFromFull: "1201 S Figueroa St, Los Angeles CA 90015",
  addressToFull: "1 Dr Carlton B Goodlett Pl, San Francisco CA 94102",
  moveSize: "4-bedroom",
  moveDate: "2026-11-15",
  inventory: "Sofa, bed, 20 boxes",
  accessDetails: "Elevator at pickup",
  additionalDetails: "Office email test",
};
const photo = {
  content: png,
  contentType: "image/png",
  filename: "inventory-01.png",
};
test("photos validate by real bytes, with no browser-supplied URLs", () => {
  const [result] = validatePhotos([photo]);
  assert.equal(result.content, png);
  assert.equal(result.contentType, "image/png");
  assert.equal(result.size, Buffer.from(png, "base64").length);
  assert.throws(
    () => validatePhotos([{ ...photo, contentType: "image/jpeg" }]),
    /photo|image/i,
  );
  assert.throws(
    () =>
      validatePhotos([{ content: "", path: "https://example.com/file.png" }]),
    /photo|image/i,
  );
  assert.throws(() => validatePhotos(Array(11).fill(photo)), /10/);
  assert.throws(
    () =>
      validatePhotos([
        {
          ...photo,
          content: Buffer.alloc(MAX_PHOTO_BYTES + 1).toString("base64"),
        },
      ]),
    /large|size|limit/i,
  );
  assert.throws(
    () => validatePhotos([{ ...photo, content: "<script>" }]),
    /photo|image/i,
  );
});
test("office email contains the move and attached photos, with customer reply-to", async () => {
  const calls = [];
  const request = async (url, options) => {
    calls.push({ url, ...options });
    return Response.json({ id: "test-office-email" });
  };
  const config = {
    key: "mock-resend-key",
    from: "Splendid Moving <reports@mail.splendidmoving.com>",
    to: "info@splendidmoving.com",
    fetch: request,
  };
  const result = await sendLongDistanceEmail(
    input,
    { id: "authorized-test-contact" },
    { totalMiles: 768 },
    validatePhotos([photo]),
    config,
  );
  assert.equal(result.id, "test-office-email");
  const payload = JSON.parse(calls[0].body);
  assert.deepEqual(payload.to, ["info@splendidmoving.com"]);
  assert.equal(payload.reply_to, input.email);
  for (const value of [
    input.phone,
    input.addressFromFull,
    input.addressToFull,
    input.inventory,
    input.accessDetails,
    input.moveDate,
  ])
    assert.ok(payload.text.includes(value));
  assert.match(payload.subject, /Long-distance/);
  assert.match(payload.text, /768/);
  assert.equal(payload.attachments.length, 1);
  assert.equal(payload.attachments[0].content, png);
  assert.ok(!payload.attachments[0].path);
  assert.ok(JSON.stringify(payload).length < 4000000);
  const key = calls[0].headers["Idempotency-Key"];
  await sendLongDistanceEmail(
    input,
    { id: "authorized-test-contact" },
    { totalMiles: 768 },
    [],
    config,
  );
  assert.equal(calls[1].headers["Idempotency-Key"], key);
  await sendLongDistanceEmail(
    { ...input, requestId: "another-genuine-request" },
    { id: "authorized-test-contact" },
    { totalMiles: 768 },
    [],
    config,
  );
  assert.notEqual(calls[2].headers["Idempotency-Key"], key);
});
test("provider rejection is surfaced without logging the email body or key", async () => {
  await assert.rejects(
    sendLongDistanceEmail(
      input,
      { id: "authorized-test-contact" },
      { totalMiles: 768 },
      [],
      {
        key: "private-key",
        from: "reports@mail.splendidmoving.com",
        to: "info@splendidmoving.com",
        fetch: async () =>
          Response.json({ message: "rejected" }, { status: 403 }),
      },
    ),
    (error) =>
      error.status === 403 &&
      !error.message.includes("private-key") &&
      !error.message.includes(input.phone),
  );
});
test("customer content is escaped in HTML", async () => {
  let payload;
  await sendLongDistanceEmail(
    { ...input, inventory: "<img src=x onerror=alert(1)>" },
    { id: "authorized-test-contact" },
    { totalMiles: 768 },
    [],
    {
      key: "mock",
      from: "reports@mail.splendidmoving.com",
      to: "info@splendidmoving.com",
      fetch: async (url, options) => {
        payload = JSON.parse(options.body);
        return Response.json({ id: "email" });
      },
    },
  );
  assert.ok(!payload.html.includes("<img src=x"));
  assert.ok(payload.html.includes("&lt;img"));
});

test("combined attachment bytes cannot exceed the request budget", () => {
  const bytes = Buffer.alloc(Math.floor(MAX_PHOTO_BYTES / 2) + 1);
  bytes.set([255, 216, 255]);
  const photo = {
    content: bytes.toString("base64"),
    contentType: "image/jpeg",
  };
  assert.equal(validatePhotos([photo]).length, 1);
  assert.throws(() => validatePhotos([photo, photo]), /size|limit/i);
});
