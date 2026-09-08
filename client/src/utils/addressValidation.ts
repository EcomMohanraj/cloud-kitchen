export interface AddressValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateDeliveryAddress(address: string | null | undefined): AddressValidationResult {
  if (!address || typeof address !== 'string') {
    return {
      isValid: false,
      error: 'Please enter your complete delivery address.',
    };
  }

  const trimmed = address.trim();

  // 1. Overall Length check: Must be at least 15 characters
  if (trimmed.length < 15) {
    return {
      isValid: false,
      error: 'Please enter your complete delivery address (door no, street/area, landmark, pincode).',
    };
  }

  // 2. Reject GPS-only placeholders or raw coordinate patterns without real street details
  const isGpsPattern =
    /^gps\s*(pinned|location|\()?/i.test(trimmed) ||
    /^\(?\s*-?\d+\.\d+\s*,\s*-?\d+\.\d+\s*\)?$/i.test(trimmed) ||
    /^(location|lat|lng|latitude|longitude):/i.test(trimmed);

  if (isGpsPattern) {
    const textWithoutGps = trimmed
      .replace(/^gps\s*(pinned|location)?\s*(\([^)]*\))?/i, '')
      .replace(/\(gps pinned:[^)]*\)/i, '')
      .replace(/\(lat:\s*-?\d+\.\d+,\s*lng:\s*-?\d+\.\d+\)/i, '')
      .trim();

    if (textWithoutGps.length < 10 || !/\d+/.test(textWithoutGps)) {
      return {
        isValid: false,
        error: 'Please enter your complete delivery address. Current location alone is not sufficient.',
      };
    }
  }

  // 3. Field Component Check 1: House / Door / Flat / Plot / Building Number or Identifier
  const hasDoorOrHouseNo =
    /\d+/.test(trimmed) ||
    /\b(door|flat|house|plot|no\.|apartment|apt|building|suite|room)\b/i.test(trimmed);

  if (!hasDoorOrHouseNo) {
    return {
      isValid: false,
      error: 'Delivery address must include house/door number or flat number.',
    };
  }

  // 4. Field Component Check 2: Street / Road / Nagar / Colony / Area / Landmark
  const hasStreetOrArea =
    /\b(street|road|nagar|colony|lane|cross|main|layout|area|sector|block|floor|app|apt|apartment|near|opp|behind|landmark|st|rd|ave|avenue)\b/i.test(trimmed) ||
    trimmed.split(/\s+/).length >= 3;

  if (!hasStreetOrArea) {
    return {
      isValid: false,
      error: 'Delivery address must include street name, area, or landmark.',
    };
  }

  // 5. Field Component Check 3: Pincode or City / Area identifier
  const hasPincodeOrCity =
    /\b\d{6}\b/.test(trimmed) ||
    /\b(chennai|coimbatore|madurai|salem|trichy|tirupur|vellore|erode|thanjavur|tuticorin|tirunelveli|kanchipuram|pondicherry|puducherry|tn|tamilnadu|karnataka|bangalore|bengaluru|hyderabad|mumbai|delhi|india)\b/i.test(trimmed) ||
    trimmed.split(',').length >= 2;

  if (!hasPincodeOrCity) {
    return {
      isValid: false,
      error: 'Delivery address must include city, area, or 6-digit pincode.',
    };
  }

  return { isValid: true };
}
