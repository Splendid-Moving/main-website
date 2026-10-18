// A broken server response must leave the customer with a readable retry message.
// These checks use local response fixtures and never contact the CRM.
import test from "node:test";
import assert from "node:assert/strict";
import { readQuoteResponse } from "../scripts/quote-response.js";

for (const status of [200, 501]) {
  test(`HTML response (${status}) shows the friendly error`, async () => {
    await assert.rejects(
      readQuoteResponse(new Response("<!DOCTYPE html><title>Error</title>", { status }), "Please try again"),
      { message: "Please try again" },
    );
  });
}
test("malformed JSON and non-object JSON show the friendly error", async () => {
  for (const body of ["{", "null", "[]", '"ok"'])
    await assert.rejects(readQuoteResponse(new Response(body), "Please try again"), { message: "Please try again" });
});
test("API validation errors retain the inventory recovery flag", async () => {
  await assert.rejects(
    readQuoteResponse(new Response(JSON.stringify({ error: "Add an item list", needsInventory: true }), { status: 400 }), "Please try again"),
    { message: "Add an item list", needsInventory: true },
  );
});
test("successful JSON passes through without changing route or quote data", async () => {
  for (const value of [{ classification: "unknown" }, { success: true, quoteStatus: "manual" }])
    assert.deepEqual(await readQuoteResponse(Response.json(value), "Please try again"), value);
});
