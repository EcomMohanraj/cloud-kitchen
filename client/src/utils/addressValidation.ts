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

  // 1. Length check: Must be at least 15 characters
  if (trimmed.length < 15) {
    return {
      isValid: false,
      error: 'Please enter your complete delivery address (door no, street/area, landmark, pincode). Must be at least 15 characters.',
    };
  }

  // 2. Reject GPS-only placeholders or raw coordinate patterns without real street details
  const isGpsPattern =
    /^gps\s*(pinned|location|\()?/i.test(trimmed) ||
    /^\(?\s*-?\d+\.\d+\s*,\s*-?\d+\.\d+\s*\)?$/i.test(trimmed) ||
    /^(location|lat|lng|latitude|longitude):/i.test(trimmed);

  if (isGpsPattern) {
    // Strip out GPS prefix and coordinate brackets to see if real street text exists
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

  // 3. Must contain door/house number, building, or street details (must contain numbers or address keywords)
  const hasStructure =
    /\d+/.test(trimmed) ||
    /street|road|nagar|colony|flat|house|door|app|apt|cross|main|floor|block|pincode|\d{6}/i.test(trimmed);

  if (!hasStructure) {
    return {
      isValid: false,
      error: 'Please enter your complete delivery address including house/door number or street name.',
    };
  }

  return { isValid: true };
}
