// Coordinates lead intake, manual-review cases, and the outgoing local quote.
// Provider acceptance is recorded separately from delivery; uncertain sends
// are never repeated automatically.
import { crewFor, formatQuote } from "./pricing.js";
import { hash } from "./store.js";
export async function processQuote(input, deps) {
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
    JSON.stringify({
      ...input,
      requestId: undefined,
      photoSessionToken: undefined,
      photos: photos.map((p) => p.pathname),
    }),
  );
  const key = `quote:submission:${hash(`${input.requestId}:${input.phone}`)}`;
  let claimed = false;
  if (deps.claim) {
    try {
      const claimedOrExisting = await deps.claim(key, fingerprint);
      claimed = claimedOrExisting === true;
      if (!claimed) {
        const previous = await deps.read(
          typeof claimedOrExisting === "string" ? claimedOrExisting : key,
        );
        if (previous?.fingerprint && previous.fingerprint !== fingerprint)
          throw Object.assign(
            Error(
              "This request was already submitted. Please contact us to update its details.",
            ),
            { status: 409 },
          );
        if (previous?.result) return previous.result;
        if (previous?.phase === "sending")
          return {
            success: true,
            quoteStatus: "uncertain",
            contactId: previous.contactId,
          };
        throw Object.assign(
          Error(
            "This request is still processing. Please wait a moment before trying again.",
          ),
          { status: 409 },
        );
      }
    } catch (error) {
      if (error.status) throw error;
      await deps.report(error);
    }
  }
  let contact;
  try {
    contact = await deps.saveContact({
      ...input,
      gasFee: distance.classification === "local" ? distance.gasFee : null,
      route: distance,
      verifiedPhotos: photos,
    });
  } catch (error) {
    if (claimed && deps.release) {
      try {
        await deps.release(key);
      } catch (releaseError) {
        await deps.report(releaseError);
      }
    }
    throw error;
  }
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
  const finish = async () => {
    if (claimed) {
      try {
        await deps.write(key, { phase: "finished", fingerprint, result });
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
  if (!claimed) {
    await notify(
      "Durable quote tracking is unavailable. Please send the quote manually.",
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
    await deps.write(key, {
      phase: "sending",
      fingerprint,
      contactId: contact.id,
    });
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
