// services/vinValidator.ts

// This service provides robust, client-side validation for Vehicle Identification Numbers (VINs).

const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const VIN_TRANSLITERATIONS: { [key: string]: number } = {
  'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
  'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9, 'S': 2, 
  'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '0': 0
};
// Regex to check for the 17-character length and the absence of illegal characters I, O, Q.
const VIN_STRUCTURE_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

interface ValidationResult {
  isValid: boolean;
  message: string | null;
}

/**
 * Validates a VIN for length, character set, and checksum.
 * @param vin The Vehicle Identification Number string to validate.
 * @returns An object with an `isValid` boolean and a `message` string if invalid.
 */
export const validateVIN = (vin: string): ValidationResult => {
  const upperVin = vin.toUpperCase().trim();

  if (upperVin.length !== 17) {
    return { isValid: false, message: "VIN must be exactly 17 characters long." };
  }
  
  if (!VIN_STRUCTURE_REGEX.test(upperVin)) {
    return { isValid: false, message: "VIN contains invalid characters (I, O, or Q are not allowed)." };
  }

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    // The 9th position (index 8) is the check digit itself, so its weight is 0 in the calculation.
    if (i === 8) continue; 
    
    const char = upperVin.charAt(i);
    const value = VIN_TRANSLITERATIONS[char];
    const weight = VIN_WEIGHTS[i];
    sum += value * weight;
  }
  
  const remainder = sum % 11;
  const actualCheckDigit = upperVin.charAt(8);
  
  const expectedCheckDigit = remainder === 10 ? 'X' : remainder.toString();
  
  if (actualCheckDigit !== expectedCheckDigit) {
     return { isValid: false, message: "Invalid VIN. Checksum does not match." };
  }
  
  return { isValid: true, message: null };
};