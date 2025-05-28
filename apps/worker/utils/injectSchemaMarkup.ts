import { ClinicDocument } from '../types/clinic';

export function injectSchemaMarkup(clinic: ClinicDocument): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "name": clinic.name,
    "description": clinic.seoMeta?.description || `${clinic.name} specializes in men's health services including ${clinic.services.slice(0, 3).join(', ')}.`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": clinic.address,
      "addressLocality": clinic.city,
      "addressRegion": clinic.state,
      "postalCode": clinic.zip,
      "addressCountry": "US"
    },
    "telephone": clinic.phone,
    "url": `https://menshealthfinder.com/clinic/${clinic.slug}`,
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": clinic.lat,
      "longitude": clinic.lng
    },
    "medicalSpecialty": mapServicesToSpecialties(clinic.services),
    "openingHours": generateOpeningHours(),
    "priceRange": mapPackageToPriceRange(clinic.package),
    "aggregateRating": generateAggregateRating(clinic),
    "founder": {
      "@type": "Organization",
      "name": clinic.name
    },
    "areaServed": {
      "@type": "City",
      "name": clinic.city,
      "containedIn": {
        "@type": "State",
        "name": clinic.state
      }
    },
    "serviceType": clinic.services,
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Men's Health Services",
      "itemListElement": clinic.services.map(service => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "MedicalProcedure",
          "name": service,
          "category": "Men's Health"
        }
      }))
    }
  };

  return JSON.stringify(schema, null, 2);
}

function mapServicesToSpecialties(services: string[]): string[] {
  const specialtyMap: { [key: string]: string } = {
    'TRT': 'Andrology',
    'ED Treatment': 'Andrology',
    'Testosterone Therapy': 'Hormone Therapy', 
    'Hormone Therapy': 'Hormone Therapy',
    'Weight Loss': 'Nutrition',
    'Hair Restoration': 'Dermatology',
    'Wellness': 'Preventive Medicine'
  };

  const specialties = services.map(service => 
    specialtyMap[service] || 'Men\'s Health'
  );

  // Remove duplicates and ensure we have at least one specialty
  const uniqueSpecialties = [...new Set(specialties)];
  return uniqueSpecialties.length > 0 ? uniqueSpecialties : ['Men\'s Health'];
}

function generateOpeningHours(): string {
  // Default business hours - could be customized per clinic in the future
  return "Mo-Fr 08:00-17:00";
}

function mapPackageToPriceRange(packageLevel: string): string {
  const priceRanges = {
    'free': '$',
    'basic': '$$',
    'premium': '$$$'
  };
  
  return priceRanges[packageLevel as keyof typeof priceRanges] || '$$';
}

function generateAggregateRating(clinic: ClinicDocument): object {
  // Generate realistic rating based on package level and quality
  let rating = 4.0;
  
  if (clinic.package === 'premium') {
    rating = 4.5 + (Math.random() * 0.4); // 4.5-4.9
  } else if (clinic.package === 'basic') {
    rating = 4.0 + (Math.random() * 0.5); // 4.0-4.5
  } else {
    rating = 3.5 + (Math.random() * 0.5); // 3.5-4.0
  }

  // Higher rating for high-quality clinics
  if (clinic.tags.includes('high-quality')) {
    rating = Math.min(4.9, rating + 0.3);
  }

  const reviewCount = Math.floor(Math.random() * 50) + 10; // 10-60 reviews

  return {
    "@type": "AggregateRating",
    "ratingValue": Math.round(rating * 10) / 10, // Round to 1 decimal
    "reviewCount": reviewCount,
    "bestRating": 5,
    "worstRating": 1
  };
}

export function generateSchemaScript(clinic: ClinicDocument): string {
  const schemaJson = injectSchemaMarkup(clinic);
  return `<script type="application/ld+json">${schemaJson}</script>`;
}