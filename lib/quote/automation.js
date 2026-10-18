// Coordinates lead intake, manual-review cases, and the outgoing local quote.
// Provider acceptance is recorded separately from delivery; uncertain sends
// are never repeated automatically.
import { crewFor, formatQuote } from "./pricing.js";
import { hash } from "./store.js";
const inFlight = new Map();
export async function processQuote(input, deps) {
  const key = `${input.phone}:${input.requestId}`;
  const fingerprint = hash(JSON.stringify(input));
  const running = inFlight.get(key);
  if (running) {
    if (running.fingerprint !== fingerprint)
      throw Object.assign(
        Error("This request is already processing with different details."),
        { status: 409 },
      );
    return running.promise;
  }
  const promise = runQuote(input, deps);
  inFlight.set(key, { fingerprint, promise });
  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}
async function runQuote(input, deps) {
  const distance = await deps.route(input.addressFromFull, input.addressToFull);
  const photos = await deps.verifyPhotos(input);
  if (
    distance.classification === "long-distance" &&
    !input.inventory?.trim() &&
    !photos.length
  )
    throw Object.assign(
      Error(
        "Please add photos or an inventory list for your flat-price estimate.",
      ),
      { status: 422, needsInventory: true },
    );
  const fingerprint = hash(
    JSON.stringify({ ...input, photoSessionToken: undefined }),
  );
  let contact = deps.findContact ? await deps.findContact(input.phone) : null;
  const tracking = Boolean(deps.getRequest && deps.recordRequest);
  if (contact && tracking) {
    const previous = await deps.getRequest(contact.id, input.requestId);
    if (previous) {
      if (previous.fingerprint !== fingerprint)
        throw Object.assign(
          Error(
            "This request was already submitted. Start a new quote to change its details.",
          ),
          { status: 409 },
        );
      if (previous.result) return previous.result;
      return { success: true, quoteStatus: "uncertain", contactId: contact.id };
    }
  }
  contact = await deps.saveContact(
    {
      ...input,
      gasFee: distance.classification === "local" ? distance.gasFee : null,
      route: distance,
      verifiedPhotos: photos,
    },
    contact,
  );
  const result = {
    success: true,
    contactId: contact.id,
    classification: distance.classification,
    quoteStatus: "manual",
  };
  const notify = async (reason) => {
    try {
      await deps.notify(contact.id, reason, input, photos);
    } catch (error) {
      await deps.report(error);
      result.followUpFailed = true;
    }
  };
  const record = (value) =>
    deps.recordRequest(contact.id, input.requestId, { fingerprint, ...value });
  const finish = async () => {
    if (tracking) {
      try {
        await record({ phase: "finished", result });
      } catch (error) {
        await deps.report(error);
      }
    }
    return result;
  };
  const crew = crewFor(input.moveSize);
  if (contact.intakeWarning) await notify(contact.intakeWarning);
  if (distance.classification === "long-distance") {
    await notify(
      "Long-distance move: prepare a flat-price quote from inventory/photos.",
    );
    return finish();
  }
  if (!crew) {
    await notify("Move size requires a manually prepared quote.");
    return finish();
  }
  if (distance.status !== "ok")
    await notify(
      "Mileage lookup failed. Hourly quote omits gas; please price gas manually.",
    );
  if (!deps.enabled) {
    result.quoteStatus = "disabled";
    await notify(
      "Automatic quotes are disabled. Please send the quote manually.",
    );
    return finish();
  }
  if (!tracking) {
    await notify(
      "Could not record this request in GoHighLevel. Please send the quote manually.",
    );
    return finish();
  }
  const dnd = contact.dndSettings?.SMS ?? contact.dndSettings?.sms;
  if (contact.dnd || ["active", "permanent"].includes(dnd?.status)) {
    await notify(
      "SMS is blocked by contact messaging preferences. Please follow up manually.",
    );
    return finish();
  }
  try {
    await record({ phase: "sending", contactId: contact.id });
  } catch (error) {
    await deps.report(error);
    await notify(
      "Quote tracking failed before sending. Please follow up manually.",
    );
    return finish();
  }
  try {
    const sent = await deps.sendSms(
      contact.id,
      formatQuote(contact.firstName || input.firstName, crew, distance.gasFee),
    );
    result.quoteStatus = "accepted";
    result.messageId = sent.messageId;
    await notify(
      `New website quote request. Hourly quote accepted by GoHighLevel for SMS sending${distance.gasFee != null ? `; gas fee $${distance.gasFee}` : "; gas needs manual pricing"}.`,
    );
  } catch (error) {
    result.quoteStatus = error.status ? "failed" : "uncertain";
    await deps.report(error);
    await notify(
      result.quoteStatus === "uncertain"
        ? "SMS result is uncertain. Check the conversation before resending."
        : "SMS was rejected. Please review the conversation and follow up.",
    );
  }
  return finish();
}
