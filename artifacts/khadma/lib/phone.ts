/**
 * Normalize an Israeli phone number to a canonical local form (0XXXXXXXXX).
 * Strips spaces/dashes/parentheses, converts a +972 / 972 country prefix to a
 * leading 0, and validates the result as an Israeli mobile/landline number
 * (a leading 0 followed by 8 or 9 digits).
 *
 * Returns the normalized number when valid, or null when invalid.
 */
export function normalizeIlPhone(input: string): string | null {
  let digits = (input ?? "").replace(/\D/g, "");
  if (digits.startsWith("972")) {
    digits = "0" + digits.slice(3);
  }
  if (/^0\d{8,9}$/.test(digits)) {
    return digits;
  }
  return null;
}
