// CRM contract checks use a mocked network and only the authorized test phone.
// They pin gas-field writes and the returning-customer fix against regressions.
import test from "node:test";
import assert from "node:assert/strict";
import {
  saveContact,
  findContact,
  getRequest,
  recordRequest,
} from "../lib/quote/crm.js";
import { GAS_FIELD_ID } from "../lib/quote/pricing.js";
import { validateQuote } from "../lib/quote/http.js";
import { validatePhotos } from "../lib/quote/photos.js";
const input = {
  requestId: "12345678-1234-4234-8234-123456789012",
  firstName: "Nikita",
  lastName: "Test",
  phone: "8185054576",
  email: "test@example.com",
  moveSize: "studio",
  pickupZip: "90015",
  dropoffZip: "90401",
  addressFromFull: "1201 S Figueroa St, Los Angeles CA 90015",
  addressToFull: "1685 Main St, Santa Monica CA 90401",
  route: { classification: "local", totalMiles: 45 },
  gasFee: 50,
};
test("new contacts receive the numerical gas field without booking triggers", async () => {
  const original = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, ...options });
    if (url.includes("/contacts/search/duplicate"))
      return Response.json({ contact: null });
    return new Response(
      JSON.stringify({
        contact: { id: "authorized-test-contact", dnd: false },
      }),
    );
  };
  try {
    await saveContact(input);
    const body = JSON.parse(
      requests.find((r) => r.url.endsWith("/contacts/") && r.method === "POST")
        .body,
    );
    assert.equal(body.phone, "8185054576");
    assert.deepEqual(
      body.customFields.find((f) => f.id === GAS_FIELD_ID),
      { id: GAS_FIELD_ID, value: 50 },
    );
    assert.ok(!body.customFields.some((f) => f.id === "F1qpj7jFGQCu03rqgnP8"));
  } finally {
    globalThis.fetch = original;
  }
});
test("returning contacts clear old gas and preserve tags/location update rules", async () => {
  const original = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, ...options });
    if (url.includes("/contacts/search/duplicate"))
      return Response.json({
        contact: { id: "authorized-test-contact", phone: "+18185054576" },
      });
    if (options.method === "POST" && url.endsWith("/contacts/"))
      return new Response(
        JSON.stringify({
          message: "This location does not allow duplicated contacts.",
          meta: { contactId: "authorized-test-contact" },
        }),
        { status: 400 },
      );
    return new Response(
      JSON.stringify({
        contact: { id: "authorized-test-contact", dnd: false },
      }),
    );
  };
  try {
    await saveContact({
      ...input,
      moveDate: "",
      gasFee: null,
      route: { classification: "unknown", totalMiles: null },
    });
    assert.ok(
      !requests.some(
        (r) => r.method === "POST" && r.url.endsWith("/contacts/"),
      ),
    );
    const update = JSON.parse(requests.find((r) => r.method === "PUT").body);
    assert.deepEqual(
      update.customFields.find((f) => f.id === "VuatzebiX5qPrzGjl4d4"),
      { id: "VuatzebiX5qPrzGjl4d4", value: "" },
    );
    assert.ok(!("locationId" in update));
    assert.ok(!("tags" in update));
    assert.deepEqual(
      update.customFields.find((f) => f.id === GAS_FIELD_ID),
      { id: GAS_FIELD_ID, value: "" },
    );
    assert.ok(
      requests.some((r) => r.url.endsWith("/tags") && r.method === "POST"),
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("messaging-preference lookup failure still returns the saved contact for manual follow-up", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) =>
    url.includes("/contacts/search/duplicate")
      ? Response.json({ contact: null })
      : options.method === "POST"
        ? new Response('{"contact":{"id":"authorized-test-contact"}}')
        : new Response("{}", { status: 503 });
  try {
    const contact = await saveContact(input);
    assert.equal(contact.id, "authorized-test-contact");
    assert.equal(contact.dnd, true);
    assert.ok(contact.intakeWarning);
  } finally {
    globalThis.fetch = original;
  }
});
test("server validates required data and ignores client pricing/classification claims", () => {
  const data = validateQuote({
    ...input,
    gasFee: 0,
    classification: "local",
    email: "TEST@example.com",
  });
  assert.equal(data.phone, "+18185054576");
  assert.equal(data.email, "test@example.com");
  assert.ok(!("gasFee" in data));
  assert.ok(!("classification" in data));
  assert.throws(() => validateQuote({ ...input, pickupZip: "9" }), /ZIP/);
  assert.throws(() => validateQuote({ ...input, email: "invalid" }), /email/);
});

test("request receipts are kept in CRM notes per submission, not per customer", async () => {
  const original = globalThis.fetch;
  let notes = [];
  const writes = [];
  globalThis.fetch = async (url, options) => {
    if (options.method === "GET") return Response.json({ notes });
    const body = JSON.parse(options.body).body;
    writes.push({ url, method: options.method, body });
    if (options.method === "POST")
      notes.push({ id: `note-${notes.length}`, body });
    else notes.find((n) => url.endsWith(n.id)).body = body;
    return Response.json({ note: notes.at(-1) });
  };
  try {
    await recordRequest("authorized-test-contact", "first", {
      phase: "sending",
      fingerprint: "one",
    });
    await recordRequest("authorized-test-contact", "first", {
      phase: "finished",
      fingerprint: "one",
      result: { quoteStatus: "accepted" },
    });
    await recordRequest("authorized-test-contact", "second", {
      phase: "sending",
      fingerprint: "one",
    });
    assert.equal(notes.length, 2);
    assert.equal(
      (await getRequest("authorized-test-contact", "first")).result.quoteStatus,
      "accepted",
    );
    assert.equal(
      (await getRequest("authorized-test-contact", "second")).phase,
      "sending",
    );
    assert.ok(writes.some((w) => w.method === "PUT"));
  } finally {
    globalThis.fetch = original;
  }
});
