// Mileage is available with the Google key alone; no database gates this API.
// External routing calls are mocked so these checks cannot send a message.
import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/quote-route.js";
test("live route handler calculates gas without Redis or private-photo storage", async () => {
  const original = globalThis.fetch;
  const originalKey = process.env.GOOGLE_MAPS_API_KEY;
  process.env.GOOGLE_MAPS_API_KEY = "test-google-key";
  let googleCalls = 0;
  globalThis.fetch = async (url) => {
    assert.match(url, /^https:\/\/routes.googleapis.com\//);
    googleCalls++;
    return Response.json({
      routes: [
        {
          legs: [
            { distanceMeters: 16093.44 },
            { distanceMeters: 16093.44 },
            { distanceMeters: 16093.44 },
          ],
        },
      ],
    });
  };
  const req = {
    method: "POST",
    headers: {
      host: "splendidmoving.com",
      origin: "https://splendidmoving.com",
      "x-forwarded-for": "127.0.0.99",
    },
    body: { pickup: "test pickup route", dropoff: "test dropoff route" },
  };
  const res = {
    setHeader() {},
    status(code) {
      this.code = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
  };
  try {
    await handler(req, res);
    assert.equal(res.code, 200);
    assert.equal(res.data.classification, "local");
    assert.equal(res.data.gasFee, 30);
    assert.equal(res.data.roundedMiles, 30);
    assert.equal(googleCalls, 1);
    await handler(req, res);
    assert.equal(googleCalls, 1);
  } finally {
    globalThis.fetch = original;
    if (originalKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = originalKey;
  }
});
