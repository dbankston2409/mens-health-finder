export function formatPhoneNumber(phone: string): string {
  if (!phone || phone.trim() === '') return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number
  if (cleaned.length === 10) {
    // Format as (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Remove leading 1 and format
    const withoutCountryCode = cleaned.slice(1);
    return `(${withoutCountryCode.slice(0, 3)}) ${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`;
  } else if (cleaned.length === 7) {
    // Local number format XXX-XXXX
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  // If we can't format it properly, return 'invalid'
  return 'invalid';
}