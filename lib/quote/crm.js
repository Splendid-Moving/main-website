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
export async function saveContact(data) {
  const fields = [{ id: GAS_FIELD_ID, value: data.gasFee ?? "" }];
  for (const [name, id] of Object.entries({
    moveSize: "yS4Bj6LtQ3lLCuju7vl0",
    addressFromFull: "KyE8Eopo3MXg4aXjGnqS",
    addressToFull: "DjfpJEtJnBnDBP6nvJ1l",
    moveDate: "VuatzebiX5qPrzGjl4d4",
  }))
    if (data[name])
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
  let contact;
  try {
    const created = await ghl("/contacts/", {
      method: "POST",
      body: { ...payload, locationId: process.env.GHL_LOCATION_ID, tags },
    });
    contact = created.contact ?? created;
  } catch (error) {
    if (!error.duplicate || !error.contactId) throw error;
    const updated = await ghl(`/contacts/${error.contactId}`, {
      method: "PUT",
      body: payload,
    });
    contact = updated.contact ?? { id: error.contactId };
    try {
      await ghl(`/contacts/${error.contactId}/tags`, {
        method: "POST",
        body: { tags },
      });
    } catch {
      contact.intakeWarning = "Could not add website lead tags.";
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
