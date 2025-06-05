/**
 * Utility functions for the Men's Health Finder application
 */

/**
 * Convert a tier string to the enum type expected by TierBadge
 * @param tier The tier string to convert (e.g. 'premium', 'advanced', 'standard', 'free')
 * @returns One of the acceptable tier enum values: 'free', 'standard', or 'advanced'
 */
export function convertTierToEnum(tier: string): 'free' | 'standard' | 'advanced' | 'low' | 'high' {
  const normalized = tier.toLowerCase();
  
  // Handle legacy 'high'/'premium' -> 'advanced'
  if (normalized === 'high' || normalized === 'premium' || normalized === 'featured') {
    return 'advanced';
  }
  
  // Handle legacy 'low'/'basic' -> 'standard'
  if (normalized === 'low' || normalized === 'basic') {
    return 'standard';
  }
  
  // Handle new tier values directly
  if (normalized === 'advanced') return 'advanced';
  if (normalized === 'standard') return 'standard';
  
  // Default to free
  return 'free';
}

/**
 * Convert a string to a URL-friendly slug
 * @param text The string to convert to a slug
 * @returns A lowercase string with spaces converted to hyphens and special characters removed
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/&/g, '-and-')     // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')   // Remove all non-word characters
    .replace(/\-\-+/g, '-')     // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')         // Trim hyphens from start
    .replace(/-+$/, '');        // Trim hyphens from end
}

/**
 * Create a unique clinic slug that includes location information
 * @param name The clinic name
 * @param city The city where the clinic is located
 * @param state The state where the clinic is located
 * @returns A URL-friendly slug that includes the clinic name, city, and state
 */
export function createClinicSlug(name: string, city: string, state: string): string {
  // Ensure we're using a consistent format with name-city-state
  return slugify(`${name}-${city}-${state}`);
}

/**
 * Create a full SEO-friendly URL path for a clinic, following the format:
 * /service-category/state/city/clinic-slug
 * 
 * @param categoryId The service category ID or slug
 * @param clinic The clinic object containing name, city, and state information
 * @returns A fully formatted URL path
 */
export function createClinicUrlPath(categoryId: string, clinic: {
  name: string;
  city: string;
  state: string;
}): string {
  // Convert service category to full name slug
  const categorySlug = getServiceSlug(categoryId);
  
  // Convert state abbreviation to full name slug
  const stateSlug = getStateSlug(clinic.state);
  
  // Convert city to slug
  const citySlug = slugify(clinic.city);
  
  // Create clinic slug
  const clinicSlug = createClinicSlug(clinic.name, clinic.city, clinic.state);
  
  // Combine all parts to create the full path
  return `/${categorySlug}/${stateSlug}/${citySlug}/${clinicSlug}`;
}

/**
 * Format a clinic name for display in page titles and headers
 * @param name The clinic name to format
 * @returns A formatted version of the clinic name with proper apostrophes
 */
export function formatClinicName(name: string): string {
  // Replace straight apostrophes with standard apostrophes
  return name.replace(/'/g, "'");
}

/**
 * Group clinics by state
 * @param clinics Array of clinic objects
 * @returns An object with state keys and arrays of clinics as values
 */
export function groupClinicsByState(clinics: any[]): Record<string, any[]> {
  return clinics.reduce((acc: Record<string, any[]>, clinic) => {
    const state = clinic.state;
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(clinic);
    return acc;
  }, {});
}

/**
 * Group clinics by city within a state
 * @param clinics Array of clinic objects from a specific state
 * @returns An object with city keys and arrays of clinics as values
 */
export function groupClinicsByCity(clinics: any[]): Record<string, any[]> {
  return clinics.reduce((acc: Record<string, any[]>, clinic) => {
    const city = clinic.city;
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(clinic);
    return acc;
  }, {});
}

/**
 * Filter clinics by service category
 * @param clinics Array of clinic objects
 * @param category The service category to filter by
 * @returns Filtered array of clinics that offer the specified service
 */
export function filterClinicsByCategory(clinics: any[], category: string): any[] {
  return clinics.filter(clinic => 
    clinic.services.some((service: string) => 
      service.toLowerCase().includes(category.toLowerCase())
    )
  );
}

/**
 * Get category information by ID
 * @param categoryId The ID of the category to retrieve
 * @param categories Array of category objects
 * @returns The category object or undefined if not found
 */
export function getCategoryById(categoryId: string, categories: any[]): any {
  return categories.find(category => category.id === categoryId);
}

/**
 * Convert a state abbreviation to its full name
 * @param abbreviation The two-letter state abbreviation
 * @returns The full state name
 */
/**
 * Map of state abbreviations to full state names
 */
export const stateMap: Record<string, string> = {
  'AL': 'Alabama',
  'AK': 'Alaska',
  'AZ': 'Arizona',
  'AR': 'Arkansas',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DE': 'Delaware',
  'FL': 'Florida',
  'GA': 'Georgia',
  'HI': 'Hawaii',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'IA': 'Iowa',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'ME': 'Maine',
  'MD': 'Maryland',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MS': 'Mississippi',
  'MO': 'Missouri',
  'MT': 'Montana',
  'NE': 'Nebraska',
  'NV': 'Nevada',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NY': 'New York',
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'RI': 'Rhode Island',
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VT': 'Vermont',
  'VA': 'Virginia',
  'WA': 'Washington',
  'WV': 'West Virginia',
  'WI': 'Wisconsin',
  'WY': 'Wyoming',
  'DC': 'District of Columbia'};

/**
 * Map of service category IDs to URL slugs
 * Includes legacy mappings for backward compatibility
 */
export const serviceCategoryMap: Record<string, string> = {
  // New categories
  'hormone-optimization': 'hormone-optimization',
  'sexual-health': 'sexual-health',
  'peptides-performance': 'peptides-performance',
  'hair-loss-aesthetics': 'hair-loss-aesthetics',
  'weight-loss-metabolic': 'weight-loss-metabolic',
  'iv-injection-therapy': 'iv-injection-therapy',
  'regenerative-medicine': 'regenerative-medicine',
  'diagnostics-panels': 'diagnostics-panels',
  
  // Legacy mappings for backward compatibility
  'trt': 'hormone-optimization',
  'testosterone-therapy': 'hormone-optimization',
  'ed': 'sexual-health',
  'ed-treatment': 'sexual-health',
  'ed-therapy': 'sexual-health',
  'erectile-dysfunction': 'sexual-health',
  'hairloss': 'hair-loss-aesthetics',
  'hair-loss': 'hair-loss-aesthetics',
  'weightloss': 'weight-loss-metabolic',
  'weight-loss': 'weight-loss-metabolic',
  'weight-management': 'weight-loss-metabolic',
  'peptide-therapy': 'peptides-performance',
  'iv-therapy': 'iv-injection-therapy',
  'iv': 'iv-injection-therapy',
  'cryotherapy': 'regenerative-medicine',
  'cryo': 'regenerative-medicine'
};

/**
 * Convert a state abbreviation to its full name
 * @param abbreviation The two-letter state abbreviation
 * @returns The full state name, properly formatted for URLs
 */
export const getStateFullName = (abbreviation: string): string => {
  return stateMap[abbreviation] || abbreviation;
};

/**
 * Convert a state abbreviation to a URL-friendly slug
 * @param abbreviation The two-letter state abbreviation
 * @returns The full state name as a lowercase, hyphenated slug
 */
export const getStateSlug = (abbreviation: string): string => {
  return slugify(getStateFullName(abbreviation));
};

/**
 * Convert a service category ID to its full name
 * @param categoryId The service category ID
 * @returns The full service category name
 */
export const getServiceFullName = (categoryId: string): string => {
  return serviceCategoryMap[categoryId] || categoryId;
};

/**
 * Convert a service category ID to a URL-friendly slug
 * @param categoryId The service category ID
 * @returns The full service category name as a lowercase, hyphenated slug
 */
export const getServiceSlug = (categoryId: string): string => {
  // Check if it's already in the full, slugified format
  if (Object.values(serviceCategoryMap).includes(categoryId)) {
    return categoryId;
  }
  
  // Try to find the service in our map
  const normalizedId = categoryId.toLowerCase().replace(/\s+/g, '-').trim();
  if (serviceCategoryMap[normalizedId]) {
    return serviceCategoryMap[normalizedId];
  }
  
  // Handle common service names like "TRT", "ED Treatment", etc.
  if (normalizedId.includes('trt') || normalizedId.includes('testosterone')) {
    return 'testosterone-therapy';
  } else if (normalizedId.includes('ed') || normalizedId.includes('erectile')) {
    return 'erectile-dysfunction';
  } else if (normalizedId.includes('hair')) {
    return 'hair-loss';
  } else if (normalizedId.includes('weight')) {
    return 'weight-management';
  } else if (normalizedId.includes('hormone')) {
    return 'hormone-optimization';
  } else if (normalizedId.includes('peptide')) {
    return 'peptide-therapy';
  }
  
  // If we can't find a match, just slugify the category ID
  return slugify(categoryId);
};