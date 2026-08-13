export function normalizeAskingPrice(input: unknown, lotSizeAcres: unknown): number | null {
  const parsedPrice = input === null || input === undefined || input === '' ? NaN : Number(input);
  if (!Number.isFinite(parsedPrice)) return null;
  if (parsedPrice === 0) return 0;
  if (parsedPrice < 0) return null;

  const price = parsedPrice;
  const parsedAcres = lotSizeAcres === null || lotSizeAcres === undefined || lotSizeAcres === '' ? NaN : Number(lotSizeAcres);
  if (!Number.isFinite(parsedAcres) || parsedAcres <= 0) return Math.round(price);

  const acres = parsedAcres;

  // Marketplace import rule: prices below $5,000 are treated as price per acre,
  // so store the total asking price shown publicly.
  if (price < 5000) return Math.round(price * acres);

  return Math.round(price);
}
