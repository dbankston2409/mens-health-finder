import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import StructuredData from '../../components/StructuredData';
import TierBadge from '../../components/TierBadge';
import UpgradeCallout from '../../components/UpgradeCallout';
import RecommendedProviders from '../../components/RecommendedProviders';
import ReviewsSection from '../../components/ReviewsSection';
import TrackedPhoneLink from '../../components/TrackedPhoneLink';
import SeoContentSection from '../../components/SeoContentSection';
import { VisibleFAQSection } from '../../components/VisibleFAQSection';
import FaqSchemaScript from '../../components/FaqSchemaScript';
import dynamic from 'next/dynamic';
import { useClinic } from '../../utils/hooks/useClinic';
import { formatClinicName } from '../../lib/utils';
import { event as trackEvent } from '../../lib/analytics';
import { generateSeoContent } from '../../utils/seo/contentGenerator';

// Dynamic import for the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('../../components/Map'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-900 rounded-xl flex items-center justify-center">Loading map...</div>
});

const ClinicProfile: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { clinic: firestoreClinic, loading: firestoreLoading, error: firestoreError } = useClinic(id as string);
  
  const clinic = firestoreClinic;
  
  const [activeTab, setActiveTab] = useState('about');
  const [seoContent, setSeoContent] = useState<string | null>(null);
  
  // Create refs for smooth scrolling
  const aboutRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  
  // Track page view
  useEffect(() => {
    if (clinic) {
      trackEvent('clinic_profile_view', {
        clinic_id: clinic.id,
        clinic_name: clinic.name,
        tier: clinic.tier
      });
    }
  }, [clinic]);
  
  // Generate SEO content if needed
  useEffect(() => {
    async function generateSeoContentForClinic() {
      if (clinic && !clinic.seoContent) {
        try {
          const content = await generateSeoContent(clinic);
          setSeoContent(content);
        } catch (error) {
          console.error('Error generating SEO content:', error);
        }
      } else if (clinic?.seoContent) {
        setSeoContent(clinic.seoContent);
      }
    }
    
    generateSeoContentForClinic();
  }, [clinic]);
  
  if (!clinic && !firestoreLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Clinic not found</h1>
        <Link href="/search" className="text-primary hover:underline">
          Back to search
        </Link>
      </div>
    );
  }

  if (firestoreLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading clinic...</p>
      </div>
    );
  }

  if (!clinic) {
    return null;
  }
  
  // Get reviews for this clinic
  const clinicReviews = []; // Mock reviews removed
  
  // Calculate average rating
  const averageRating = clinicReviews.length > 0
    ? clinicReviews.reduce((sum, review) => sum + review.rating, 0) / clinicReviews.length
    : clinic.rating || 0;
  
  // Enhance clinic data
  const enhancedClinic = {
    ...clinic,
    rating: averageRating,
    reviewCount: clinicReviews.length
  };
  
  // Empty array since we removed mock data
  const mockClinicsWithMHFReviews = [];
  
  // Get tier display info
  const tierMap = {
    'free': 'free',
    'low': 'standard',
    'high': 'advanced'
  } as const;
  
  const tier = tierMap[clinic.tier] || 'free';
  
  // Determine if the clinic has a logo (only for Standard and Advanced tiers)
  const hasLogo = tier === 'standard' || tier === 'advanced';
  
  // Determine if the clinic has a CTA button (only for Advanced tier)
  const hasCTAButton = tier === 'advanced';

  return (
    <>
      <Head>
        <title>
          {enhancedClinic.seoMeta?.title || `${enhancedClinic.name} | Men's Health Finder`}
        </title>
        <meta name="description" content={
          enhancedClinic.seoMeta?.description || 
          `${enhancedClinic.name} - Men's health clinic in ${enhancedClinic.city}, ${enhancedClinic.state}. ${enhancedClinic.services.join(', ')}.`
        } />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://menshealthfinder.com/clinic/${enhancedClinic.id}`} />
        
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Add structured data for SEO */}
      <StructuredData 
        clinic={enhancedClinic} 
        url={typeof window !== 'undefined' ? window.location.href : `https://menshealthfinder.com/clinic/${enhancedClinic.id}`} 
      />
      
      {/* Add FAQ schema if clinic has FAQs */}
      {enhancedClinic.faqs && enhancedClinic.faqs.length > 0 && (
        <FaqSchemaScript faqs={enhancedClinic.faqs} />
      )}
      
      <main className="min-h-screen bg-gray-900">
        {/* Clinic Header */}
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="container mx-auto px-4 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  {hasLogo && (
                    <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {formatClinicName(enhancedClinic.name).charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                      {formatClinicName(enhancedClinic.name)}
                      <TierBadge tier={tier} />
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Men's Health Clinic</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{enhancedClinic.address}, {enhancedClinic.city}, {enhancedClinic.state}</span>
                  </div>
                  
                  {enhancedClinic.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(enhancedClinic.rating) ? 'text-yellow-500' : 'text-gray-600'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span>{enhancedClinic.rating.toFixed(1)} ({enhancedClinic.reviewCount} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
                <TrackedPhoneLink 
                  phone={enhancedClinic.phone} 
                  clinicId={enhancedClinic.id} 
                  buttonStyle={true}
                  searchQuery=""
                  sourcePage={`/clinic/${enhancedClinic.id}`}
                >
                  Call Now
                </TrackedPhoneLink>
                
                {/* Website link for all tiers */}
                {enhancedClinic.website && (
                  <a
                    href={enhancedClinic.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center justify-center gap-2"
                    onClick={() => trackEvent('clinic_website_click', { clinic_id: enhancedClinic.id })}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visit Website
                  </a>
                )}
                
                {/* Schedule button for advanced tier only */}
                {hasCTAButton && (
                  <a
                    href={`${enhancedClinic.website}#schedule`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center justify-center gap-2"
                    onClick={() => trackEvent('clinic_schedule_click', { clinic_id: enhancedClinic.id })}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule Appointment
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Sticky Navigation */}
        <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'about' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-white hover:border-gray-700'}`}
                onClick={() => {
                  setActiveTab('about');
                  aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                About
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'services' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-white hover:border-gray-700'}`}
                onClick={() => {
                  setActiveTab('services');
                  servicesRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Services
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-white hover:border-gray-700'}`}
                onClick={() => {
                  setActiveTab('reviews');
                  reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Reviews
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'location' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-white hover:border-gray-700'}`}
                onClick={() => {
                  setActiveTab('location');
                  locationRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Location
              </button>
            </nav>
          </div>
        </div>
        
        {/* Content Sections */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              <div ref={aboutRef} className="glass-card p-6">
                <h2 className="text-2xl font-bold text-white mb-4">About {formatClinicName(enhancedClinic.name)}</h2>
                
                {/* SEO Content Section */}
                {(seoContent || enhancedClinic.seoContent) && (
                  <SeoContentSection content={seoContent || enhancedClinic.seoContent} />
                )}
                
                {/* Default description if no SEO content */}
                {!seoContent && !enhancedClinic.seoContent && (
                  <p className="text-gray-300 mb-4">
                    {enhancedClinic.description || `${formatClinicName(enhancedClinic.name)} is a specialized men's health clinic located in ${enhancedClinic.city}, ${enhancedClinic.state}. We provide comprehensive treatment options for men's health concerns.`}
                  </p>
                )}
              </div>
              
              {/* Services Section */}
              <div ref={servicesRef} className="glass-card p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Services Offered</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {enhancedClinic.services.map((service, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-300">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Reviews Section */}
              <div ref={reviewsRef}>
                <ReviewsSection 
                  clinicId={enhancedClinic.id} 
                  clinicName={formatClinicName(enhancedClinic.name)}
                />
              </div>
              
              {/* FAQ Section */}
              {enhancedClinic.faqs && enhancedClinic.faqs.length > 0 && (
                <VisibleFAQSection 
                  faqs={enhancedClinic.faqs} 
                  clinicName={formatClinicName(enhancedClinic.name)}
                />
              )}
              
              {/* Location Section */}
              <div ref={locationRef} className="glass-card p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Location & Hours</h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="font-semibold text-white mb-2">Address</h3>
                    <p className="text-gray-300">{enhancedClinic.address}</p>
                    <p className="text-gray-300">{enhancedClinic.city}, {enhancedClinic.state}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-white mb-2">Phone</h3>
                    <TrackedPhoneLink 
                      phone={enhancedClinic.phone} 
                      clinicId={enhancedClinic.id}
                      searchQuery=""
                      sourcePage={`/clinic/${enhancedClinic.id}`}
                    >
                      {enhancedClinic.phone}
                    </TrackedPhoneLink>
                  </div>
                  
                  {enhancedClinic.website && (
                    <div>
                      <h3 className="font-semibold text-white mb-2">Website</h3>
                      <a
                        href={enhancedClinic.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Map */}
                {enhancedClinic.lat && enhancedClinic.lng && (
                  <div className="h-96 rounded-xl overflow-hidden">
                    <Map
                      locations={[{
                        id: parseInt(enhancedClinic.id) || 0,
                        name: enhancedClinic.name,
                        address: enhancedClinic.address,
                        city: enhancedClinic.city,
                        state: enhancedClinic.state,
                        lat: enhancedClinic.lat,
                        lng: enhancedClinic.lng,
                        tier: tier as 'free' | 'standard' | 'advanced',
                        rating: enhancedClinic.rating,
                        phone: enhancedClinic.phone
                      }]}
                      center={{ lat: enhancedClinic.lat, lng: enhancedClinic.lng, zoom: 15 }}
                      height="100%"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upgrade Callout for Free Tier */}
              {tier === 'free' && (
                <UpgradeCallout clinicId={enhancedClinic.id} />
              )}
              
              {/* Quick Actions */}
              <div className="glass-card p-6">
                <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(enhancedClinic.address + ', ' + enhancedClinic.city + ', ' + enhancedClinic.state)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Get Directions
                  </a>
                  
                  {enhancedClinic.website && (
                    <a
                      href={enhancedClinic.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full btn-secondary flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
              
              {/* Contact Card */}
              <div className="glass-card p-6">
                <h3 className="font-semibold text-white mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Phone</p>
                    <TrackedPhoneLink 
                      phone={enhancedClinic.phone} 
                      clinicId={enhancedClinic.id}
                      searchQuery=""
                      sourcePage={`/clinic/${enhancedClinic.id}`}
                      className="font-medium"
                    >
                      {enhancedClinic.phone}
                    </TrackedPhoneLink>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Address</p>
                    <p className="text-white">{enhancedClinic.address}</p>
                    <p className="text-white">{enhancedClinic.city}, {enhancedClinic.state}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recommended Providers */}
          {tier === 'free' && (
            <RecommendedProviders 
              currentCity={enhancedClinic.city}
              currentState={enhancedClinic.state}
              excludeClinicId={enhancedClinic.id}
              clinics={[]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default ClinicProfile;