import React, { useState, useEffect } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import TierBadge from '../../../../components/TierBadge';
import StructuredData from '../../../../components/StructuredData';
import TrackedPhoneLink from '../../../../components/TrackedPhoneLink';
import SeoContentSection from '../../../../components/SeoContentSection';
import { VisibleFAQSection } from '../../../../components/VisibleFAQSection';
// Service categories data
const serviceCategories = [
  {
    id: 'trt',
    title: 'Testosterone Replacement Therapy',
    description: 'Comprehensive TRT treatment programs'
  },
  {
    id: 'ed-treatment',
    title: 'ED Treatment',
    description: 'Erectile dysfunction treatment'
  },
  {
    id: 'hair-loss',
    title: 'Hair Loss Treatment',
    description: 'Hair restoration and prevention'
  },
  {
    id: 'weight-loss',
    title: 'Weight Loss',
    description: 'Medical weight management'
  },
  {
    id: 'peptides',
    title: 'Peptide Therapy',
    description: 'Advanced peptide treatments'
  },
  {
    id: 'iv-therapy',
    title: 'IV Therapy',
    description: 'IV nutrient therapy'
  }
];
import { 
  slugify, 
  createClinicSlug,
  filterClinicsByCategory, 
  groupClinicsByState, 
  groupClinicsByCity,
  getCategoryById, 
  getStateFullName,
  formatClinicName,
  convertTierToEnum
} from '../../../../lib/utils';
import { generateSeoContent } from '../../../../utils/seo/contentGenerator';

// Dynamic import for the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('../../../../components/Map'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-900 rounded-xl flex items-center justify-center">Loading map...</div>
});

// Import our helper function for creating clinic URLs
import { createClinicUrlPath } from '../../../../lib/utils';

interface ClinicDetailPageProps {
  categoryInfo: {
    id: string;
    title: string;
    description: string;
  };
  locationInfo: {
    stateCode: string;
    stateFullName: string;
    city: string;
  };
  clinic: any;
  clinicSlug: string;
}

export default function ClinicDetailPage({ 
  categoryInfo, 
  locationInfo, 
  clinic, 
  clinicSlug 
}: ClinicDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('about');
  const [seoContent, setSeoContent] = useState<string | null>(null);
  
  // Handle fallback page case
  if (router.isFallback) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }
  
  // Generate SEO content if needed
  useEffect(() => {
    async function generateSeoContentForClinic() {
      if (!clinic.seoContent) {
        try {
          const content = await generateSeoContent(clinic);
          setSeoContent(content);
        } catch (error) {
          console.error('Error generating SEO content:', error);
        }
      } else {
        setSeoContent(clinic.seoContent);
      }
    }
    
    generateSeoContentForClinic();
  }, [clinic]);

  // Determine if the clinic has a logo (only for Starter and Premium tiers)
  const hasLogo = clinic.tier === 'high' || clinic.tier === 'low';
  
  // Determine if the clinic has a CTA button (only for Premium tier)
  const hasCTAButton = clinic.tier === 'high';
  
  const clinicDisplayName = formatClinicName(clinic.name);

  return (
    <>
      <Head>
        <title>{clinic.seoMeta?.title || `${clinicDisplayName} - ${categoryInfo.title} Clinic in ${locationInfo.city}, ${locationInfo.stateCode} | Men's Health Finder`}</title>
        <meta 
          name="description" 
          content={clinic.seoMeta?.description || `${clinicDisplayName} offers specialized ${categoryInfo.title.toLowerCase()} treatment in ${locationInfo.city}, ${locationInfo.stateCode}. Read reviews, view services, and contact this men's health clinic.`} 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Canonical URL */}
        <link 
          rel="canonical" 
          href={`https://menshealthfinder.com/${categoryInfo.id}/${locationInfo.stateCode.toLowerCase()}/${slugify(locationInfo.city)}/${clinicSlug}`} 
        />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="business.business" />
        <meta property="og:title" content={clinic.seoMeta?.title || `${clinicDisplayName} - ${categoryInfo.title} Clinic in ${locationInfo.city}, ${locationInfo.stateCode}`} />
        <meta property="og:description" content={clinic.seoMeta?.description || `${clinicDisplayName} offers specialized ${categoryInfo.title.toLowerCase()} treatment in ${locationInfo.city}, ${locationInfo.stateCode}.`} />
        <meta property="og:url" content={`https://menshealthfinder.com/${categoryInfo.id}/${locationInfo.stateCode.toLowerCase()}/${slugify(locationInfo.city)}/${clinicSlug}`} />
        
        {/* Additional business metadata */}
        <meta property="business:contact_data:street_address" content={clinic.address} />
        <meta property="business:contact_data:locality" content={locationInfo.city} />
        <meta property="business:contact_data:region" content={locationInfo.stateCode} />
        <meta property="business:contact_data:phone_number" content={clinic.phone} />
        
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <StructuredData 
        clinic={clinic} 
        url={typeof window !== 'undefined' 
          ? window.location.href 
          : `https://menshealthfinder.com/${categoryInfo.id}/${locationInfo.stateCode.toLowerCase()}/${slugify(locationInfo.city)}/${clinicSlug}`
        } 
      />
      
      {/* Breadcrumbs */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: categoryInfo.title, href: `/${categoryInfo.id}` },
            { label: locationInfo.stateFullName, href: `/${categoryInfo.id}/${locationInfo.stateCode.toLowerCase()}` },
            { label: locationInfo.city, href: `/${categoryInfo.id}/${locationInfo.stateCode.toLowerCase()}/${slugify(locationInfo.city)}` },
            { label: clinicDisplayName }
          ]} />
        </div>
      </div>
      
      <main className="min-h-screen bg-gray-900">
        {/* Clinic Header */}
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  {hasLogo && (
                    <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {clinicDisplayName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                      {clinicDisplayName}
                      <TierBadge tier={convertTierToEnum(clinic.tier)} />
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">{categoryInfo.title} Clinic</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{clinic.address}, {locationInfo.city}, {locationInfo.stateCode}</span>
                  </div>
                  
                  {clinic.rating && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{clinic.rating.toFixed(1)} rating</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
                <TrackedPhoneLink 
                  phone={clinic.phone} 
                  clinicId={clinic.id} 
                  buttonStyle={true}
                  searchQuery=""
                  sourcePage={`/${categoryInfo.id}/${locationInfo.stateCode.toLowerCase()}/${slugify(locationInfo.city)}/${clinicSlug}`}
                >
                  Call
                </TrackedPhoneLink>
                
                {/* Website link for all tiers */}
                {clinic.website && (
                  <a
                    href={clinic.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visit Website
                  </a>
                )}
                
                {/* Schedule button for premium tier only */}
                {hasCTAButton && (
                  <a
                    href={`${clinic.website}#schedule`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule Now
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <div className="flex gap-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'about' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'services' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
                }`}
              >
                Services
              </button>
              <button
                onClick={() => setActiveTab('location')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'location' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
                }`}
              >
                Location
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'reviews' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
                }`}
              >
                Reviews
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">About {clinicDisplayName}</h2>
              
              {/* SEO Content Section */}
              {(seoContent || clinic.seoContent) && (
                <SeoContentSection content={seoContent || clinic.seoContent} />
              )}
              
              {/* Clinic Description */}
              <div className="glass-card p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Overview</h3>
                <p className="text-gray-300 leading-relaxed">
                  {clinic.description || `${clinicDisplayName} is a specialized ${categoryInfo.title.toLowerCase()} clinic located in ${locationInfo.city}, ${locationInfo.stateCode}. We provide comprehensive men's health services with a focus on personalized care and optimal results.`}
                </p>
              </div>
              
              {/* Contact Information */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <TrackedPhoneLink 
                      phone={clinic.phone} 
                      clinicId={clinic.id}
                      searchQuery=""
                      sourcePage={`/${categoryInfo.id}/${locationInfo.stateCode.toLowerCase()}/${slugify(locationInfo.city)}/${clinicSlug}`}
                    >
                      {clinic.phone}
                    </TrackedPhoneLink>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-300">{clinic.address}, {locationInfo.city}, {locationInfo.stateCode}</span>
                  </div>
                  
                  {clinic.website && (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Services Offered</h2>
              <div className="grid gap-4">
                {clinic.services.map((service: string, index: number) => (
                  <div key={index} className="glass-card p-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white">{service}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Location & Directions</h2>
              
              <div className="glass-card p-6 mb-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Address</h3>
                  <p className="text-gray-300">{clinic.address}, {locationInfo.city}, {locationInfo.stateCode}</p>
                </div>
                
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.address + ', ' + locationInfo.city + ', ' + locationInfo.stateCode)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Get Directions
                </a>
              </div>
              
              {/* Map */}
              {clinic.lat && clinic.lng && (
                <div className="h-96 rounded-xl overflow-hidden">
                  <Map
                    locations={[{
                      id: parseInt(clinic.id) || 0,
                      name: clinic.name,
                      address: clinic.address,
                      city: locationInfo.city,
                      state: locationInfo.stateCode,
                      lat: clinic.lat,
                      lng: clinic.lng,
                      tier: convertTierToEnum(clinic.tier) || 'free',
                      rating: clinic.rating,
                      phone: clinic.phone
                    }]}
                    center={{ lat: clinic.lat, lng: clinic.lng, zoom: 15 }}
                    height="100%"
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Reviews</h2>
              <div className="glass-card p-6 text-center">
                <p className="text-gray-400">No reviews yet. Be the first to share your experience!</p>
              </div>
              
              {/* FAQ Section */}
              {clinic.faqs && clinic.faqs.length > 0 && (
                <div className="mt-8">
                  <VisibleFAQSection faqs={clinic.faqs} clinicName={clinicDisplayName} />
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Related Clinics */}
        <div className="bg-gray-800 border-t border-gray-700 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-white mb-6">Other {categoryInfo.title} Clinics in {locationInfo.city}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Related clinics section - currently no data */}
              {[].map(relatedClinic => (
                  <Link
                    key={relatedClinic.id}
                    href={createClinicUrlPath(categoryInfo.id, relatedClinic)}
                    className="glass-card p-4 hover:bg-gray-700/50 transition-colors"
                  >
                    <h3 className="font-semibold text-white mb-1">{formatClinicName(relatedClinic.name)}</h3>
                    <p className="text-sm text-gray-400">{relatedClinic.address}</p>
                  </Link>
                ))}
            </div>
            
            <div className="mt-8 text-center">
              <Link
                href={`/${categoryInfo.id}/${locationInfo.stateCode.toLowerCase()}/${slugify(locationInfo.city)}`}
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                View all {categoryInfo.title} clinics in {locationInfo.city}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Don't pre-generate any paths to avoid build errors
  return {
    paths: [],
    fallback: 'blocking'
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { category, state, city, 'clinic-slug': clinicSlug } = params as { 
    category: string; 
    state: string; 
    city: string;
    'clinic-slug': string;
  };
  
  // Get category info
  const categoryData = getCategoryById(category);
  if (!categoryData) {
    return { notFound: true };
  }
  
  // Since we're removing mock data, return 404 for now
  // This will need to be replaced with actual Firebase queries
  return { notFound: true };
};