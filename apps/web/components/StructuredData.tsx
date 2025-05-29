import React from 'react';
import { Clinic } from '../types';
import {
  generateClinicStructuredData,
  generateWebsiteStructuredData,
  generateBreadcrumbsStructuredData
} from '../utils/seo';

interface StructuredDataProps {
  clinic: Clinic;
  url: string;
  breadcrumbs?: { name: string; url: string }[];
}

/**
 * StructuredData component that renders JSON-LD structured data for clinics
 * 
 * @param clinic Clinic data to generate structured data for
 * @param url Current page URL
 * @param breadcrumbs Optional breadcrumbs data
 * @returns Structured data script tags
 */
const StructuredData: React.FC<StructuredDataProps> = ({ clinic, url, breadcrumbs }) => {
  // Get structured data for the clinic
  const clinicJsonLd = generateClinicStructuredData(clinic, url);
  
  // Get structured data for the website
  const title = clinic.seoMeta?.title || `${clinic.name} | Men's Health Finder`;
  const description = clinic.seoMeta?.description || 
    `${clinic.name} offers specialized men's health services in ${clinic.city}, ${clinic.state}`;
  const websiteJsonLd = generateWebsiteStructuredData(title, description, url);
  
  // Generate breadcrumbs data if provided
  const breadcrumbsJsonLd = breadcrumbs ? 
    generateBreadcrumbsStructuredData(breadcrumbs) : null;
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: clinicJsonLd }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
      />
      {breadcrumbs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: breadcrumbsJsonLd as string }}
        />
      )}
    </>
  );
};

export default StructuredData;

/**
 * Helper function to generate breadcrumbs for a clinic page
 * 
 * @param category Category ID
 * @param state State code
 * @param city City name
 * @param clinicName Clinic name
 * @returns Breadcrumb items array
 */
export function generateClinicBreadcrumbs(
  category: string,
  state: string,
  city: string,
  clinicName: string,
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com'
): { name: string; url: string }[] {
  return [
    { name: 'Home', url: baseUrl },
    { 
      name: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '), 
      url: `${baseUrl}/${category}` 
    },
    { 
      name: state.toUpperCase(), 
      url: `${baseUrl}/${category}/${state.toLowerCase()}` 
    },
    { 
      name: city, 
      url: `${baseUrl}/${category}/${state.toLowerCase()}/${city.toLowerCase().replace(/ /g, '-')}` 
    },
    { 
      name: clinicName,
      url: `${baseUrl}/${category}/${state.toLowerCase()}/${city.toLowerCase().replace(/ /g, '-')}/${clinicName.toLowerCase().replace(/ /g, '-')}` 
    },
  ];
}