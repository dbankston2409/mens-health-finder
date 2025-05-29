import { Clinic } from '../types';

/**
 * Generate JSON-LD structured data for a clinic
 * 
 * @param clinic Clinic data to generate structured data for
 * @param url Current page URL
 * @returns JSON-LD structured data as a string
 */
export function generateClinicStructuredData(clinic: Clinic, url: string): string {
  // Prepare aggregate rating
  const aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: clinic.reviewStats?.averageRating || clinic.rating || 4.5,
    reviewCount: clinic.reviewStats?.count || clinic.reviewCount || 10,
    bestRating: '5',
    worstRating: '1'
  };

  // Format opening hours for structured data
  const openingHoursSpecification = clinic.hours?.map(hour => {
    // Parse the day and map to schema.org format if needed
    let dayOfWeek = hour.day;
    
    // Map day names to schema.org format if not already
    const dayMapping: Record<string, string> = {
      'monday': 'Monday',
      'mon': 'Monday',
      'tuesday': 'Tuesday',
      'tue': 'Tuesday',
      'wednesday': 'Wednesday',
      'wed': 'Wednesday',
      'thursday': 'Thursday',
      'thu': 'Thursday',
      'friday': 'Friday',
      'fri': 'Friday',
      'saturday': 'Saturday',
      'sat': 'Saturday',
      'sunday': 'Sunday',
      'sun': 'Sunday'
    };
    
    dayOfWeek = dayMapping[dayOfWeek.toLowerCase()] || dayOfWeek;
    
    // Skip if closed
    if (hour.hours.toLowerCase().includes('closed')) {
      return null;
    }
    
    // Parse hours like "9:00 AM - 5:00 PM"
    const [opens, closes] = hour.hours.split(' - ');
    
    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek,
      opens: opens,
      closes: closes
    };
  }).filter(Boolean);

  // Determine price range based on tier/package
  const tier = clinic.tier || clinic.package || 'free';
  const priceRange = tier === 'premium' || tier === 'advanced' ? '$$$' : 
                     tier === 'basic' ? '$$' : '$';

  // Use SEO meta description if available, otherwise generate a default
  const description = clinic.seoMeta?.description || 
    `${clinic.name} offers specialized men's health services in ${clinic.city}, ${clinic.state}, including ${(clinic.services || []).slice(0, 3).join(', ')}.`;

  // Use SEO meta keywords if available for schema
  const keywords = clinic.seoMeta?.keywords?.join(', ') || 
                  (clinic.services || []).join(', ') || 
                  "Men's Health";

  // Build the service array
  const services = (clinic.services || []).map(service => ({
    '@type': 'MedicalProcedure',
    name: service,
    procedureType: 'https://schema.org/TherapeuticProcedure'
  }));

  // Construct full LocalBusiness structured data
  const localBusinessData = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    '@id': url,
    name: clinic.name,
    description: description,
    url: clinic.website || url,
    telephone: clinic.phone,
    image: clinic.imageUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com'}/images/logos/mens-health-finder-logo.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: getStreetAddress(clinic.address),
      addressLocality: clinic.city,
      addressRegion: clinic.state,
      postalCode: clinic.zip,
      addressCountry: 'US'
    },
    geo: clinic.lat && clinic.lng ? {
      '@type': 'GeoCoordinates',
      latitude: clinic.lat,
      longitude: clinic.lng
    } : undefined,
    openingHoursSpecification,
    priceRange: priceRange,
    medicalSpecialty: clinic.services?.join(', ') || 'Men\'s Health',
    keywords: keywords,
    aggregateRating,
    makesOffer: services.map(service => ({
      '@type': 'Offer',
      itemOffered: service
    }))
  };

  // Filter out any undefined values
  const cleanedData = removeUndefined(localBusinessData);
  return JSON.stringify(cleanedData);
}

/**
 * Generate JSON-LD structured data for the website
 * 
 * @param title Page title
 * @param description Page description
 * @param url Current page URL
 * @returns JSON-LD structured data as a string
 */
export function generateWebsiteStructuredData(
  title: string,
  description: string,
  url: string
): string {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}#website`,
    url: url,
    name: title,
    description: description,
    publisher: {
      '@type': 'Organization',
      name: "Men's Health Finder",
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com'}/Men_s-Health-Finder-LOGO-White.png`
      }
    }
  };
  
  return JSON.stringify(websiteSchema);
}

/**
 * Generate JSON-LD structured data for Breadcrumbs
 * 
 * @param items Breadcrumb items with name and url
 * @returns JSON-LD structured data as a string
 */
export function generateBreadcrumbsStructuredData(
  items: { name: string; url: string }[]
): string {
  const breadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
  
  return JSON.stringify(breadcrumbsSchema);
}

/**
 * Generate a meta tags object with all necessary SEO tags
 * 
 * @param clinic Clinic data
 * @param url Current page URL
 * @param defaultTitle Fallback title if SEO title is not available
 * @returns Object with meta tags
 */
export function generateClinicMetaTags(
  clinic: Clinic,
  url: string,
  defaultTitle: string
): Record<string, string> {
  return {
    title: clinic.seoMeta?.title || defaultTitle,
    description: clinic.seoMeta?.description || 
      `${clinic.name} in ${clinic.city}, ${clinic.state} offers specialized men's health services including ${(clinic.services || []).slice(0, 3).join(', ')}.`,
    keywords: clinic.seoMeta?.keywords?.join(', ') || (clinic.services || []).join(', '),
    'og:title': clinic.seoMeta?.title || defaultTitle,
    'og:description': clinic.seoMeta?.description || 
      `${clinic.name} in ${clinic.city}, ${clinic.state} offers specialized men's health services.`,
    'og:url': url,
    'og:type': 'website',
    'og:image': clinic.imageUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com'}/images/logos/mens-health-finder-logo.png`,
    'twitter:card': 'summary_large_image',
    'twitter:title': clinic.seoMeta?.title || defaultTitle,
    'twitter:description': clinic.seoMeta?.description || 
      `${clinic.name} in ${clinic.city}, ${clinic.state} offers specialized men's health services.`,
    'twitter:image': clinic.imageUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com'}/images/logos/mens-health-finder-logo.png`,
  };
}

// Helper function to get street address from full address
function getStreetAddress(address: string): string {
  // Try to extract just the street address from a full address
  // This is a simple implementation that assumes the first part before a comma is the street
  const parts = address.split(',');
  return parts[0].trim();
}

// Helper function to recursively remove undefined values from an object
function removeUndefined(obj: any): any {
  // Return primitive values as is
  if (obj === null || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj
      .map(item => removeUndefined(item))
      .filter(item => item !== undefined);
  }
  
  // Handle objects
  const result: any = {};
  for (const key in obj) {
    const value = removeUndefined(obj[key]);
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}