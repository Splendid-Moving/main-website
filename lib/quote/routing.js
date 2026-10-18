// Google supplies driving distances; our code decides local/long-distance and
// the gas tier. Every routing failure returns an explicit unavailable result.
import { priceDistance } from "./pricing.js";
const unavailable = () => ({
  status: "unavailable",
  classification: "unknown",
  gasFee: null,
  totalMiles: null,
  roundedMiles: null,
});
export async function calculateRoute(
  pickup,
  dropoff,
  {
    key = process.env.GOOGLE_MAPS_API_KEY,
    fetch: request = globalThis.fetch,
  } = {},
) {
  if (!key || !pickup || !dropoff) return unavailable();
  try {
    const response = await request(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        signal: AbortSignal.timeout(6000),
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "routes.legs.distanceMeters",
        },
        body: JSON.stringify({
          origin: { address: "90015, Los Angeles, CA, USA" },
          destination: { address: "90015, Los Angeles, CA, USA" },
          intermediates: [{ address: pickup }, { address: dropoff }],
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_UNAWARE",
          computeAlternativeRoutes: false,
          regionCode: "us",
        }),
      },
    );
    if (!response.ok) return unavailable();
    const legs = (await response.json()).routes?.[0]?.legs;
    if (
      !Array.isArray(legs) ||
      legs.length !== 3 ||
      legs.some(
        (leg) =>
          typeof leg.distanceMeters !== "number" ||
          !Number.isFinite(leg.distanceMeters) ||
          leg.distanceMeters < 0,
      )
    )
      return unavailable();
    const totalMiles =
      legs.reduce((sum, leg) => sum + leg.distanceMeters, 0) / 1609.344;
    return {
      status: "ok",
      totalMiles,
      roundedMiles: Math.round(totalMiles),
      ...priceDistance(totalMiles),
    };
  } catch {
    return unavailable();
  }
}
