/**
 * Format address components into a single display string
 * Use this for displaying addresses in lists, invoices, etc.
 */
export function formatAddress(
  streetAddress: string | null | undefined,
  suburb: string | null | undefined,
  state: string | null | undefined,
  postcode: string | null | undefined
): string {
  const parts = [
    streetAddress,
    suburb,
    state && postcode ? `${state} ${postcode}` : state || postcode
  ].filter(Boolean)
  
  return parts.join(', ')
}

/**
 * Example usage:
 * formatAddress("45 Workshop St", "Melbourne", "VIC", "3000")
 * Returns: "45 Workshop St, Melbourne, VIC 3000"
 */
