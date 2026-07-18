/**
 * Safely parses the invoice items.
 * Handles:
 * - Arrays (returns as is)
 * - JSON strings representing arrays
 * - Double-stringified JSON strings representing arrays
 * - Null, undefined, or invalid inputs (returns empty array)
 */
export const parseInvoiceItems = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') {
        const parsedDouble = JSON.parse(parsed);
        if (Array.isArray(parsedDouble)) return parsedDouble;
      }
    } catch (e) {
      console.error("Failed to parse invoice items:", e);
    }
  }
  return [];
};
