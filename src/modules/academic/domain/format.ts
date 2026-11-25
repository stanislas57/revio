/** French display helpers. Rounding only happens here, never in calculations. */

const averageFormat = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compactFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const percentFormat = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });

/** 12.345 → "12,35". */
export function formatAverage(value: number): string {
  return averageFormat.format(value);
}

/** 4 → "4", 1.5 → "1,5". */
export function formatCoefficient(value: number): string {
  return compactFormat.format(value);
}

/** 0.2 → "20 %" (with a regular non-breaking space). */
export function formatPercent(value: number): string {
  return percentFormat.format(value).replace(/\s/g, "\u00a0");
}

/** Grade with its scale: (15, 20) → "15/20". */
export function formatGrade(value: number, maxValue: number): string {
  return `${compactFormat.format(value)}/${compactFormat.format(maxValue)}`;
}

/** Parses "12,5" or "12.5" into 12.5; returns NaN for anything else. */
export function parseDecimal(input: string): number {
  const normalised = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalised)) return Number.NaN;
  return Number(normalised);
}
