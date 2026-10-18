// Fixed crew, rate, and gas rules for website quotes. The SMS wording is kept
// here so pricing changes cannot accidentally create different customer quotes.
export const GAS_FIELD_ID = "2nEnIoqxsJhlJQx74RJm";
const rates = {
  2: { movers: 2, cash: 115, card: 125 },
  3: { movers: 3, cash: 145, card: 155 },
  4: { movers: 4, cash: 180, card: 190 },
};
export function crewFor(size) {
  return (
    rates[
      {
        studio: 2,
        "1-bedroom": 2,
        "2-bedroom": 3,
        "3-bedroom": 4,
        "4-bedroom": 4,
      }[size]
    ] ?? null
  );
}
export function priceDistance(miles) {
  if (typeof miles !== "number" || !Number.isFinite(miles) || miles < 0)
    return { classification: "unknown", gasFee: null };
  if (miles > 250) return { classification: "long-distance", gasFee: null };
  const rounded = Math.round(miles);
  return {
    classification: "local",
    gasFee:
      rounded <= 35
        ? 30
        : rounded <= 55
          ? 50
          : rounded <= 75
            ? 60
            : rounded <= 120
              ? 70
              : rounded <= 170
                ? 80
                : 100,
  };
}
export function formatQuote(firstName, crew, gasFee) {
  const gas = gasFee == null ? "" : `Gas fee: $${gasFee}\n\n`;
  return `Hi ${firstName}!\n\nThank you for considering Splendid Moving.\n\nBased on the details you've provided, we would recommend you to go with a team of ${crew.movers} movers.\n\nThe rate for ${crew.movers} movers would be:\n\nCash: $${crew.cash} per hour\nCard: $${crew.card} per hour\nMinimum charge: 3 hours\n\n${gas}The rate includes:\n- Truck, mileage, and tax.\n- Basic value protection at $0.60 per pound per article.\n- Disassembly and reassembly of furniture.\n- Packing and unpacking services.\n- Moving blankets for furniture protection.\n- Wardrobe boxes for clothes.\n- No hidden charges!\n\nWe provide free tape and shrink wrap.\n\nNote: Other materials such as boxes and bubble wrap are available for an additional charge.\n\nDouble Drive Time: This applies if the driving distance is over 15 miles. The cost is calculated by doubling the time it takes to drive between your pick-up and drop-off addresses.`;
}
