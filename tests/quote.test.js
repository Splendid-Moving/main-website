// These tests exercise the business rules before contacting any real services.
// All customer fixtures use the one phone number authorized by Nikita.
import test from "node:test";
import assert from "node:assert/strict";
import {
  crewFor,
  priceDistance,
  formatQuote,
  GAS_FIELD_ID,
} from "../lib/quote/pricing.js";
import { calculateRoute } from "../lib/quote/routing.js";
import { processQuote } from "../lib/quote/automation.js";

const phone = "8185054576";
const input = {
  requestId: "12345678-1234-4234-8234-123456789012",
  firstName: "Nikita",
  lastName: "Test",
  phone,
  email: "test@example.com",
  pickupZip: "90015",
  dropoffZip: "90401",
  addressFromFull: "1201 S Figueroa St, Los Angeles CA 90015",
  addressToFull: "1685 Main St, Santa Monica CA 90401",
  moveSize: "2-bedroom",
  moveDate: "2026-11-01",
  additionalDetails: "",
};
const route = (miles) => ({
  status: "ok",
  totalMiles: miles,
  roundedMiles: Math.round(miles),
  ...priceDistance(miles),
});
function setup(overrides = {}) {
  const calls = [];
  const records = new Map();
  const deps = {
    enabled: true,
    route: async () => route(45),
    findContact: async () => ({ id: "authorized-test-contact" }),
    getRequest: async (contactId, requestId) => records.get(requestId),
    recordRequest: async (contactId, requestId, value) =>
      records.set(requestId, value),
    saveContact: async (data) => {
      calls.push(["save", data]);
      return { id: "authorized-test-contact", firstName: "Nikita", dnd: false };
    },
    notify: async (id, reason) => calls.push(["notify", reason]),
    sendSms: async (id, message) => {
      calls.push(["sms", message]);
      return { messageId: "mock-message" };
    },
    verifyPhotos: async (input) => input.photos ?? [],
    sendLongDistanceEmail: async (...args) => {
      calls.push(["email", ...args]);
      return { id: "office-email" };
    },
    report: () => {},
    ...overrides,
  };
  return { deps, calls };
}
test("all crew sizes and rates match the agreed mapping", () => {
  for (const size of ["studio", "1-bedroom"])
    assert.deepEqual(crewFor(size), { movers: 2, cash: 115, card: 125 });
  assert.deepEqual(crewFor("2-bedroom"), { movers: 3, cash: 145, card: 155 });
  for (const size of ["3-bedroom", "4-bedroom"])
    assert.deepEqual(crewFor(size), { movers: 4, cash: 180, card: 190 });
  assert.equal(crewFor("office-large"), null);
});
for (const [miles, fee] of [
  [0, 30],
  [35.49, 30],
  [35.5, 50],
  [55.49, 50],
  [55.5, 60],
  [75.49, 60],
  [75.5, 70],
  [120.49, 70],
  [120.5, 80],
  [170.49, 80],
  [170.5, 100],
  [250, 100],
]) {
  test(`round total ${miles} miles once → $${fee}`, () =>
    assert.equal(priceDistance(miles).gasFee, fee));
}
test("raw total over 250 is long-distance even if rounding gives 250", () => {
  assert.deepEqual(priceDistance(250.01), {
    classification: "long-distance",
    gasFee: null,
  });
  for (const bad of [null, undefined, NaN, Infinity, -1, "45"])
    assert.equal(priceDistance(bad).classification, "unknown");
});
test("quote preserves rates, minimum, inclusion text and omits the entire gas line on failure", () => {
  const text = formatQuote("Nikita", crewFor("studio"), 30);
  assert.match(text, /Hi Nikita!/);
  assert.match(text, /Cash: \$115 per hour/);
  assert.match(text, /Card: \$125 per hour/);
  assert.match(text, /Minimum charge: 3 hours/);
  assert.match(text, /Gas fee: \$30/);
  assert.match(text, /\$0.60 per pound per article/);
  assert.match(text, /Double Drive Time:/);
  assert.ok(
    !formatQuote("Nikita", crewFor("studio"), null).includes("Gas fee"),
  );
  assert.equal(GAS_FIELD_ID, "2nEnIoqxsJhlJQx74RJm");
});
test("Routes uses the ordered full circuit and sums all three legs before rounding", async () => {
  let body;
  const result = await calculateRoute("pickup", "dropoff", {
    key: "mock-key",
    fetch: async (url, options) => {
      body = JSON.parse(options.body);
      return new Response(
        JSON.stringify({
          routes: [
            {
              legs: [
                { distanceMeters: 16093.44 },
                { distanceMeters: 16093.44 },
                { distanceMeters: 16093.44 },
              ],
            },
          ],
        }),
      );
    },
  });
  assert.equal(body.origin.address, "90015, Los Angeles, CA, USA");
  assert.deepEqual(body.origin, body.destination);
  assert.deepEqual(body.intermediates, [
    { address: "pickup" },
    { address: "dropoff" },
  ]);
  assert.equal(body.travelMode, "DRIVE");
  assert.equal(result.roundedMiles, 30);
  assert.equal(result.gasFee, 30);
});
test("Maps failure/invalid/incomplete results never invent a fee", async () => {
  for (const fetch of [
    async () => {
      throw Error("timeout");
    },
    async () => new Response("{}"),
    async () => new Response('{"routes":[{"legs":[{"distanceMeters":10}]}]}'),
    async () => new Response('{"error":{}}', { status: 429 }),
  ]) {
    assert.equal(
      (await calculateRoute("from", "to", { key: "mock-key", fetch })).status,
      "unavailable",
    );
  }
});
test("local quote saves numeric gas field data and sends through GHL", async () => {
  const { deps, calls } = setup();
  const result = await processQuote(input, deps);
  assert.equal(result.quoteStatus, "accepted");
  assert.equal(calls.find((c) => c[0] === "save")[1].gasFee, 50);
  assert.match(calls.find((c) => c[0] === "sms")[1], /3 movers/);
});
test("Maps outage sends no-gas quote AND requests manual gas follow-up", async () => {
  const { deps, calls } = setup({
    route: async () => ({
      status: "unavailable",
      classification: "unknown",
      gasFee: null,
    }),
  });
  await processQuote(input, deps);
  assert.equal(calls.find((c) => c[0] === "save")[1].gasFee, null);
  assert.ok(calls.some((c) => c[0] === "notify"));
  assert.ok(!calls.find((c) => c[0] === "sms")[1].includes("Gas fee"));
});
test("long-distance requires inventory, creates manual task, and never sends hourly SMS", async () => {
  const { deps, calls } = setup({ route: async () => route(300) });
  await assert.rejects(() => processQuote(input, deps), /inventory/i);
  const result = await processQuote(
    { ...input, inventory: "Sofa, queen bed, 20 boxes" },
    deps,
  );
  assert.equal(result.quoteStatus, "manual");
  assert.equal(result.emailStatus, "accepted");
  assert.ok(calls.some((c) => c[0] === "email"));
  assert.ok(calls.some((c) => c[0] === "notify"));
  assert.ok(!calls.some((c) => c[0] === "sms"));
});
test("concurrent and repeated submissions do not send a second quote", async () => {
  const { deps, calls } = setup();
  const results = await Promise.allSettled([
    processQuote(input, deps),
    processQuote(input, deps),
  ]);
  assert.ok(results.some((r) => r.status === "fulfilled"));
  await processQuote(input, deps);
  assert.equal(calls.filter((c) => c[0] === "sms").length, 1);
});
test("a returning customer can request a fresh quote immediately, even with identical details", async () => {
  const { deps, calls } = setup();
  const first = await processQuote(input, deps);
  const second = await processQuote(
    { ...input, requestId: "new-genuine-request" },
    deps,
  );
  const updated = await processQuote(
    { ...input, requestId: "new-updated-request", moveSize: "studio" },
    deps,
  );
  assert.equal(first.contactId, second.contactId);
  assert.equal(second.contactId, updated.contactId);
  assert.equal(calls.filter((c) => c[0] === "save").length, 3);
  assert.equal(calls.filter((c) => c[0] === "sms").length, 3);
  assert.match(calls.filter((c) => c[0] === "sms").at(-1)[1], /2 movers/);
});
test("retry tracking works through the CRM without a separate database", async () => {
  const { deps, calls } = setup();
  const records = new Map();
  deps.getRequest = async (contact, id) => records.get(id);
  deps.recordRequest = async (contact, id, data) => records.set(id, data);
  assert.equal((await processQuote(input, deps)).quoteStatus, "accepted");
  assert.equal((await processQuote(input, deps)).quoteStatus, "accepted");
  assert.equal(calls.filter((c) => c[0] === "sms").length, 1);
});
test("an uncertain SMS timeout is recorded and is never retried blindly", async () => {
  const { deps, calls } = setup({
    sendSms: async () => {
      calls.push(["sms"]);
      throw Error("timeout");
    },
  });
  assert.equal((await processQuote(input, deps)).quoteStatus, "uncertain");
  await processQuote(input, deps);
  assert.equal(calls.filter((c) => c[0] === "sms").length, 1);
});
test("DND and unsupported crew sizes receive manual follow-up without SMS", async () => {
  for (const overrides of [
    { saveContact: async () => ({ id: "authorized-test-contact", dnd: true }) },
    {},
  ]) {
    const { deps, calls } = setup(overrides);
    await processQuote(
      { ...input, moveSize: overrides.saveContact ? "studio" : "office-large" },
      deps,
    );
    assert.ok(!calls.some((c) => c[0] === "sms"));
    assert.ok(calls.some((c) => c[0] === "notify"));
  }
});
test("disabled auto-sending still saves the request but sends no SMS", async () => {
  const { deps, calls } = setup({ enabled: false });
  await processQuote(input, deps);
  assert.ok(calls.some((c) => c[0] === "save"));
  assert.ok(!calls.some((c) => c[0] === "sms"));
});
test("a failed CRM save can be retried safely before any SMS starts", async () => {
  const { deps, calls } = setup();
  const save = deps.saveContact;
  let attempts = 0;
  deps.saveContact = async (data) => {
    if (attempts++ === 0) throw Error("CRM temporarily down");
    return save(data);
  };
  await assert.rejects(() => processQuote(input, deps), /temporarily/);
  assert.equal((await processQuote(input, deps)).quoteStatus, "accepted");
  assert.equal(calls.filter((c) => c[0] === "sms").length, 1);
});
test("missing durable tracking saves the lead and flags manual handling without sending", async () => {
  const { deps, calls } = setup({
    getRequest: undefined,
    recordRequest: undefined,
  });
  await processQuote(input, deps);
  assert.ok(calls.some((c) => c[0] === "save"));
  assert.ok(calls.some((c) => c[0] === "notify"));
  assert.ok(!calls.some((c) => c[0] === "sms"));
});
test("reusing an already submitted request ID cannot silently reuse a quote for different details", async () => {
  const { deps } = setup();
  await processQuote(input, deps);
  await assert.rejects(
    () => processQuote({ ...input, moveSize: "studio" }, deps),
    /already submitted/,
  );
});

test("a long-distance email failure preserves the saved lead and allows an idempotent retry", async () => {
  let attempts = 0;
  const { deps, calls } = setup({
    route: async () => route(768),
    sendLongDistanceEmail: async () => {
      if (attempts++ === 0) throw Error("timeout");
      return { id: "office-retry" };
    },
  });
  const data = { ...input, inventory: "Sofa, bed, 20 boxes" };
  await assert.rejects(
    processQuote(data, deps),
    (error) => error.leadSaved === true,
  );
  const result = await processQuote(data, deps);
  assert.equal(result.emailStatus, "accepted");
  await processQuote(data, deps);
  assert.equal(attempts, 2);
  assert.ok(!calls.some((c) => c[0] === "sms"));
});
test("long-distance photos are handed to the office email and never get the hourly SMS", async () => {
  const { deps, calls } = setup({ route: async () => route(768) });
  const result = await processQuote(
    {
      ...input,
      photos: [
        {
          filename: "inventory-01.jpg",
          content: "mock-validated-image",
          size: 100,
        },
      ],
    },
    deps,
  );
  assert.equal(result.emailStatus, "accepted");
  assert.equal(calls.find((c) => c[0] === "email")[4].length, 1);
  assert.ok(!calls.some((c) => c[0] === "sms"));
});
