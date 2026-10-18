// Read API responses without exposing HTML or parser errors to customers.
// Keep validation hints so the wizard can return to a missing inventory step.
export async function readQuoteResponse(response, fallbackMessage) {
  let result;
  try {
    result = await response.json();
  } catch {
    throw Error(fallbackMessage);
  }
  if (!result || typeof result !== "object" || Array.isArray(result))
    throw Error(fallbackMessage);
  if (!response.ok)
    throw Object.assign(
      Error(typeof result.error === "string" ? result.error : fallbackMessage),
      {
        needsInventory: result.needsInventory,
        leadSaved: result.leadSaved,
      },
    );
  return result;
}
