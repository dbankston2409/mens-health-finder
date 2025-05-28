import React from 'react';

interface Review {
  source: string;
  author: string;
  rating: number;
  text: string;
  date?: string;
}

interface StructuredDataProps {
  clinic: {
    id: string | number;
    name: string;
    address: string;
    city: string;
    state: string;
    phone: string;
    website?: string;
    hours?: { day: string; hours: string }[];
    description?: string;
    services?: string[];
    reviews?: Review[];
    lat?: number;
    lng?: number;
    tier?: 'free' | 'low' | 'high';
    rating?: number;
    reviewCount?: number;
    seoMeta?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
  };
  url: string;
}

const StructuredData: React.FC<StructuredDataProps> = ({ clinic, url }) => {
  // Filter to only include native MHF reviews (not external Google/Yelp reviews)
  const nativeReviews = clinic.reviews?.filter(review => review.source === 'MHF') || [];
  
  // Calculate aggregate rating if native reviews exist
  const hasNativeReviews = nativeReviews.length > 0;
  const aggregateRating = hasNativeReviews ? {
    '@type': 'AggregateRating',
    ratingValue: (nativeReviews.reduce((sum, review) => sum + review.rating, 0) / nativeReviews.length).toFixed(1),
    reviewCount: nativeReviews.length,
    bestRating: '5',
    worstRating: '1'
  } : {
    '@type': 'AggregateRating',
    ratingValue: clinic.rating || 4.5,
    reviewCount: clinic.reviewCount || 15,
    bestRating: '5',
    worstRating: '1'
  };

  // Create review objects for structured data
  const reviewsData = hasNativeReviews ? nativeReviews.map(review => ({
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author
    },
    datePublished: review.date || new Date().toISOString().split('T')[0],
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: '5',
      worstRating: '1'
    },
    reviewBody: review.text
  })) : [];

  // Format opening hours for structured data
  const openingHoursSpecification = clinic.hours?.map(hour => {
    // Parse the day
    const dayOfWeek = hour.day;
    
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

  // Determine price range based on tier
  const priceRange = clinic.tier === 'high' ? '$$$' : clinic.tier === 'low' ? '$$' : '$';

  // Use SEO meta description if available, otherwise generate a default
  const description = clinic.seoMeta?.description || 
    `${clinic.name} offers specialized men's health services in ${clinic.city}, ${clinic.state}`;

  // Use SEO meta keywords if available for schema
  const keywords = clinic.seoMeta?.keywords?.join(', ') || clinic.services?.join(', ') || "Men's Health";

  // Construct LocalBusiness data
  const localBusinessData = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    '@id': url,
    name: clinic.name,
    description: description,
    telephone: clinic.phone,
    url: clinic.website || url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: clinic.address.split(',')[0].trim(),
      addressLocality: clinic.city,
      addressRegion: clinic.state,
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
    ...(reviewsData.length > 0 && { review: reviewsData })
  };

  // Website schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}#website`,
    url: url,
    name: clinic.seoMeta?.title || `${clinic.name} | Men's Health Finder`,
    description: description,
    publisher: {
      '@type': 'Organization',
      name: "Men's Health Finder",
      logo: {
        '@type': 'ImageObject',
        url: 'https://menshealthfinder.com/Men_s-Health-Finder-LOGO-White.png'
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
};

export default StructuredData;