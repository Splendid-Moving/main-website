// GoHighLevel contact intake and messaging for the quote form. Gas is a numeric
// contact field; booking/calendar trigger fields are intentionally never set.
import { GAS_FIELD_ID } from "./pricing.js";
const base = "https://services.leadconnectorhq.com";
export async function ghl(path, { method = "GET", body } = {}) {
  const response = await fetch(base + path, {
    method,
    signal: AbortSignal.timeout(6000),
    headers: {
      Authorization: `Bearer ${process.env.GHL_ACCESS_TOKEN}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(
      Error(`GoHighLevel request failed (${response.status})`),
      {
        provider: true,
        status: response.status,
        contactId: data.meta?.contactId,
        duplicate: /duplicated contacts/i.test(String(data.message)),
      },
    );
  return data;
}
const normalizedPhone = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 10 ? `+1${digits}` : `+${digits}`;
};
export async function findContact(phone) {
  const query = new URLSearchParams({
    locationId: process.env.GHL_LOCATION_ID,
    number: normalizedPhone(phone),
  });
  const { contact } = await ghl(`/contacts/search/duplicate?${query}`);
  if (!contact?.id) return null;
  if (normalizedPhone(contact.phone) !== normalizedPhone(phone))
    throw Error("CRM returned a contact with a different phone number");
  return contact;
}
export async function saveContact(data, existing) {
  const fields = [{ id: GAS_FIELD_ID, value: data.gasFee ?? "" }];
  for (const [name, id] of Object.entries({
    moveSize: "yS4Bj6LtQ3lLCuju7vl0",
    addressFromFull: "KyE8Eopo3MXg4aXjGnqS",
    addressToFull: "DjfpJEtJnBnDBP6nvJ1l",
    moveDate: "VuatzebiX5qPrzGjl4d4",
  }))
    if (data[name] || name === "moveDate")
      fields.push({
        id,
        value:
          name === "moveSize"
            ? ({
                studio: "Studio",
                "1-bedroom": "1 Bedroom",
                "2-bedroom": "2 Bedroom",
                "3-bedroom": "3 Bedroom",
                "4-bedroom": "4 Bedroom",
              }[data[name]] ?? "Other")
            : data[name],
      });
  const details = [
    data.additionalDetails,
    data.inventory ? `Inventory: ${data.inventory}` : "",
    data.accessDetails ? `Access: ${data.accessDetails}` : "",
    `ZIPs: ${data.pickupZip} → ${data.dropoffZip}`,
    `Quote route: ${data.route.classification}`,
    data.route.totalMiles != null
      ? `Round-trip driving distance: ${data.route.totalMiles.toFixed(1)} miles`
      : "Mileage unavailable",
  ]
    .filter(Boolean)
    .join("\n");
  fields.push({ id: "HZgxySrqsR4IICCBWZr5", value: details });
  if (data.utm_source) {
    const source =
      { yelp: "Yelp", lsa: "Local Service Ads" }[
        data.utm_source.toLowerCase()
      ] ?? data.utm_source;
    fields.push({ id: "i71w1J9MFtRcyAQYqElg", value: source });
  }
  const payload = {
    firstName: data.firstName,
    lastName: data.lastName,
    name: `${data.firstName} ${data.lastName}`,
    phone: data.phone,
    email: data.email,
    customFields: fields,
  };
  const tags = ["website-lead", data.moveSize];
  let contact = existing ?? (await findContact(data.phone));
  const update = async (id) => {
    const updated = await ghl(`/contacts/${id}`, {
      method: "PUT",
      body: payload,
    });
    contact = updated.contact ?? { id };
    try {
      await ghl(`/contacts/${id}/tags`, { method: "POST", body: { tags } });
    } catch {
      contact.intakeWarning = "Could not add website lead tags.";
    }
  };
  if (contact) await update(contact.id);
  else {
    try {
      const created = await ghl("/contacts/", {
        method: "POST",
        body: { ...payload, locationId: process.env.GHL_LOCATION_ID, tags },
      });
      contact = created.contact ?? created;
    } catch (error) {
      if (!error.duplicate || !error.contactId) throw error;
      // A simultaneous request may have created this phone after our lookup.
      const current = await ghl(`/contacts/${error.contactId}`);
      if (
        normalizedPhone(current.contact?.phone) !== normalizedPhone(data.phone)
      )
        throw error;
      await update(error.contactId);
    }
  }
  if (!contact.id) throw Error("CRM did not return a contact ID");
  // Read the stored contact to respect global and per-channel DND on returns.
  try {
    const current = await ghl(`/contacts/${contact.id}`);
    return {
      ...(current.contact ?? contact),
      ...(contact.intakeWarning
        ? { intakeWarning: contact.intakeWarning }
        : {}),
    };
  } catch {
    return {
      ...contact,
      dnd: true,
      intakeWarning: "Could not verify contact messaging preferences.",
    };
  }
}
export async function notify(contactId, reason, input, photos = []) {
  const body = [
    reason,
    `Website quote request: ${input.requestId}`,
    `From: ${input.addressFromFull}`,
    `To: ${input.addressToFull}`,
    input.inventory ? `Inventory:\n${input.inventory}` : "",
    photos.length
      ? `Photos: ${process.env.QUOTE_SITE_URL || "https://splendidmoving.com"}/quote-photos?request=${encodeURIComponent(input.photoSessionId)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  // Both the note and task are attempted so a task failure does not hide details.
  const outcomes = await Promise.allSettled([
    ghl(`/contacts/${contactId}/notes`, { method: "POST", body: { body } }),
    ghl(`/contacts/${contactId}/tasks`, {
      method: "POST",
      body: {
        title: "Review website moving quote",
        body,
        dueDate: new Date(Date.now() + 3600000).toISOString(),
        completed: false,
        ...(process.env.GHL_QUOTE_ASSIGNEE_ID
          ? { assignedTo: process.env.GHL_QUOTE_ASSIGNEE_ID }
          : {}),
      },
    }),
  ]);
  const failed = outcomes.find((result) => result.status === "rejected");
  if (failed) throw failed.reason;
}
export async function sendSms(contactId, message) {
  const response = await ghl("/conversations/messages", {
    method: "POST",
    body: { type: "SMS", contactId, message },
  });
  if (!response.messageId) throw Error("Messaging API returned no message ID");
  return response;
}

// Request IDs distinguish a retry from a customer's next genuine quote request.
const receiptPrefix = "splendid-quote-record:";
async function requestNote(contactId, requestId) {
  const { notes = [] } = await ghl(`/contacts/${contactId}/notes`);
  for (const note of notes) {
    const line = note.body
      ?.split("\n")
      .find((line) => line.startsWith(receiptPrefix));
    if (!line) continue;
    try {
      const record = JSON.parse(line.slice(receiptPrefix.length));
      if (record.requestId === requestId) return { note, record };
    } catch {}
  }
  return null;
}
export async function getRequest(contactId, requestId) {
  return (await requestNote(contactId, requestId))?.record ?? null;
}
export async function recordRequest(contactId, requestId, record) {
  const previous = await requestNote(contactId, requestId);
  const status = record.result?.quoteStatus ?? record.phase;
  const body = `Website quote request ${requestId}: ${status}\n${receiptPrefix}${JSON.stringify({ requestId, ...record })}`;
  await ghl(
    `/contacts/${contactId}/notes${previous ? `/${previous.note.id}` : ""}`,
    {
      method: previous ? "PUT" : "POST",
      body: { body },
    },
  );
}
