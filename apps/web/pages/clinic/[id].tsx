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
// import ClinicSnapshot from '../../../components/ClinicSnapshot';
// Temporarily disabled until component is created
// import ExternalReviewsSection from '../../../components/ExternalReviewsSection';
// Temporarily disabled until component is created
import type { Clinic } from '../../types';
import { mockClinics } from '../../lib/mockData';
import { generateSeoMeta } from '../../utils/seo/metadataGenerator';
import { generateSeoContent } from '../../utils/seo/contentGenerator';
import { convertTierToEnum } from '../../lib/utils';
import FirestoreClient from '../../lib/firestoreClient';
// import { trackClinicView, trackClickToCall, trackClickToWebsite, trackClickToDirections } from '../../../lib/analytics';
// Temporarily comment out tracking functions

// Import either the real service or the mock service based on environment
import * as realClinicService from '../../lib/api/clinicService';
import * as mockClinicService from '../../lib/api/mockClinicService';

// Use mock service in development mode, real service in production
const clinicService = process.env.NODE_ENV === 'development' 
  ? mockClinicService 
  : realClinicService;

const { getClinicById, logClinicTraffic } = clinicService;

// Temporarily use mock data until we have real reviews in the database
// Use explicit type assertion to match RecommendedProviders Clinic interface
const mockClinicsWithMHFReviews = mockClinics.map(clinic => {
  // Convert legacy tier to standardized tier using type assertion for mockClinics
  // mockClinics uses 'high', 'low', 'free' while we need 'advanced', 'standard', 'free'
  const mockTier = clinic.tier as 'high' | 'low' | 'free';
  const standardizedTier = mockTier === 'high' ? 'advanced' as const : 
                          mockTier === 'low' ? 'standard' as const : 'free' as const;
  
  // Add some MHF native reviews only to advanced tier clinics
  if (standardizedTier === 'advanced') {
    return {
      ...clinic,
      tier: standardizedTier, // Use standardized tier
      reviews: [
        ...(clinic.reviews || []),
        { 
          source: 'MHF', 
          author: 'William M.', 
          rating: 5, 
          text: 'I\'ve been a patient at this clinic for over 6 months. The staff is incredibly professional and the results of my treatment plan have exceeded my expectations. Highly recommend to any man looking to improve their health and vitality.',
          date: '2023-11-15'
        },
        { 
          source: 'MHF', 
          author: 'Brian K.', 
          rating: 4, 
          text: 'Very satisfied with the care I\'ve received. The doctors take time to listen and develop personalized treatment plans. The only reason for 4 stars instead of 5 is occasional wait times, but the quality of care makes up for it.',
          date: '2023-10-22'
        }
      ]
    };
  }
  
  // Add fewer MHF reviews to standard tier clinics
  if (standardizedTier === 'standard') {
    return {
      ...clinic,
      tier: standardizedTier, // Use standardized tier
      reviews: [
        ...(clinic.reviews || []),
        { 
          source: 'MHF', 
          author: 'Alex J.', 
          rating: 5, 
          text: 'Great clinic with knowledgeable staff. My energy levels have improved significantly since starting treatment here.',
          date: '2023-09-30'
        }
      ]
    };
  }
  
  // Keep free tier clinics with only external reviews
  return {
    ...clinic,
    tier: standardizedTier // Use standardized tier
  };
});

const ClinicProfile = () => {
  const router = useRouter();
  const { id } = router.query;
  // Create refs for each section to enable smooth scrolling
  const aboutRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState('about');
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seoContent, setSeoContent] = useState<string | null>(null);
  
  // Fetch clinic data from Firestore
  useEffect(() => {
    async function fetchClinic() {
      if (!id) return;
      
      try {
        setLoading(true);
        const clinicData = await getClinicById(id as string);
        
        if (clinicData) {
          setClinic(clinicData);
          
          // Generate SEO content if not already present
          if (!clinicData.seoContent) {
            try {
              const generatedContent = await generateSeoContent(clinicData);
              setSeoContent(generatedContent);
            } catch (contentErr) {
              console.error('Error generating SEO content:', contentErr);
              // Non-blocking error - we'll just show the page without SEO content
            }
          } else {
            setSeoContent(clinicData.seoContent?.content || null);
          }
          
          // Generate snapshot if not present - temporarily disabled
          // if (!clinicData.snapshot) {
          //   try {
          //     await FirestoreClient.generateAndSaveSnapshot(clinicData.id!);
          //   } catch (snapshotErr) {
          //     console.error('Error generating clinic snapshot:', snapshotErr);
          //     // Non-blocking error - we'll show the page without the snapshot
          //   }
          // }
          
          // Track the page view in GA4 - temporarily disabled
          // trackClinicView(clinicData.id!, clinicData.slug || clinicData.name, clinicData.name);
          
          // Track the clinic view in Firestore
          // Temporarily disabled lead tracking
          // const leadSource = leadTracker.determineLeadSource();
          // await leadTracker.trackClinicView(clinicData.id!, leadSource);
          
          // Log the clinic view in traffic logs
          // In a real app, we'd capture the search query from localStorage or URL params
          const searchQuery = localStorage.getItem('lastSearchQuery') || '';
          await logClinicTraffic(searchQuery, clinicData.slug || '');
        } else {
          setError('Clinic not found');
        }
      } catch (err) {
        console.error('Error fetching clinic:', err);
        setError('Failed to load clinic information');
      } finally {
        setLoading(false);
      }
    }
    
    fetchClinic();
  }, [id]);
  
  // Add scroll observer to update active tab based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Adding offset for better UX
      
      const aboutSection = aboutRef.current?.offsetTop || 0;
      const faqSection = faqRef.current?.offsetTop || 0;
      const reviewsSection = reviewsRef.current?.offsetTop || 0;
      const locationSection = locationRef.current?.offsetTop || 0;
      
      if (scrollPosition >= locationSection) {
        setActiveTab('location');
      } else if (scrollPosition >= reviewsSection) {
        setActiveTab('reviews');
      } else if (scrollPosition >= faqSection) {
        setActiveTab('faq');
      } else {
        setActiveTab('about');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Handle error state
  if (error || !clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-4">Clinic not found</p>
          <Link href="/search" className="btn">Back to Search</Link>
        </div>
      </div>
    );
  }
  
  // Mock data assignment for now - until we have all this data in Firestore
  // In a real implementation, this would come from the database
  const mockClinic = mockClinicsWithMHFReviews.find(c => c.name.toLowerCase().includes(clinic.name.toLowerCase()));
  
  // Convert package to standardized tier
  const tier = clinic.tier || 
               (clinic.package === 'premium' ? 'advanced' : 
               clinic.package === 'basic' ? 'standard' : 'free');
  
  // Temporary data enhancement until we have full schema in Firestore
  const enhancedClinic = {
    ...clinic,
    lat: clinic.lat ?? undefined,
    lng: clinic.lng ?? undefined,
    id: clinic.id || clinic.slug || 'unknown',
    tier, // Use the standardized tier value
    rating: mockClinic?.rating || 4.5,
    reviewCount: mockClinic?.reviewCount || 12,
    googleRating: mockClinic?.rating || clinic.rating || 4.5,
    googleReviewCount: mockClinic?.reviewCount || clinic.reviewCount || 8,
    description: mockClinic?.description || `${clinic.name} specializes in men's health services including ${(clinic.services || []).join(', ')}. Our clinic provides personalized care to help men improve their health and quality of life.`,
    faqs: mockClinic?.faqs || [
      {
        question: 'What services does your clinic offer?',
        answer: `We offer a range of men's health services including ${(clinic.services || []).join(', ')}.`
      },
      {
        question: 'Do I need a referral to visit your clinic?',
        answer: 'Most of our services do not require a referral. You can schedule a consultation directly with our clinic.'
      },
      {
        question: 'Does insurance cover your services?',
        answer: 'We accept most major insurance plans. Coverage varies depending on your specific plan and the services you need. We recommend contacting your insurance provider to verify coverage.'
      }
    ],
    hours: mockClinic?.hours || [
      { day: 'Monday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Tuesday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Wednesday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Thursday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Friday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Saturday', hours: 'Closed' },
      { day: 'Sunday', hours: 'Closed' }
    ],
    reviews: mockClinic?.reviews || []
  };

  // Determine if the clinic has a logo (only for Standard and Advanced tiers)
  const hasLogo = tier === 'advanced' || tier === 'standard';
  
  // Determine if the clinic has a CTA button (only for Advanced tier)
  const hasCTAButton = tier === 'advanced';

  return (
    <React.Fragment>
      <Head>
        <title>
          {enhancedClinic.seoMeta?.title || `${enhancedClinic.name} | Men's Health Finder`}
        </title>
        <meta name="description" content={
          enhancedClinic.seoMeta?.description || 
          `${enhancedClinic.name} is a men's health clinic in ${enhancedClinic.city}, ${enhancedClinic.state} specializing in ${(enhancedClinic.services || []).join(', ')}`
        } />
        <meta name="keywords" content={
          enhancedClinic.seoMeta?.keywords?.join(', ') || 
          `men's health, ${(enhancedClinic.services || []).join(', ')}, ${enhancedClinic.city}, ${enhancedClinic.state}`
        } />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`https://menshealthfinder.com/clinic/${enhancedClinic.id}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Add structured data for SEO */}
      <StructuredData 
        clinic={enhancedClinic} 
        url={typeof window !== 'undefined' ? window.location.href : `https://menshealthfinder.com/clinic/${enhancedClinic.id}`} 
      />
      
      <main>
        <div className="container mx-auto px-4 py-8">
          {/* Upgrade Callout for Free Tier */}
          {tier === 'free' && (
            <div className="mb-8">
              <UpgradeCallout clinic={enhancedClinic} />
            </div>
          )}
          
          {/* Clinic header */}
          <div className="bg-gray-900 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="flex items-start gap-4">
                {/* Logo for Starter and Premium tiers only */}
                {hasLogo && (
                  <div className="w-24 h-24 bg-gradient-to-r from-[#222] to-[#111] rounded-lg hidden md:flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-textSecondary">LOGO</span>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold">{enhancedClinic.name}</h1>
                    <TierBadge tier={convertTierToEnum(tier)} size="md" />
                  </div>
                  <p className="text-textSecondary mt-1">{enhancedClinic.address}</p>
                  
                  <div className="flex flex-col space-y-2 mt-3">
                    {/* Google Reviews */}
                    <div className="flex items-center">
                      <div className="w-6 h-6 mr-2 relative flex items-center justify-center">
                        <img 
                          src="/images/icons/google-icon.svg" 
                          alt="Google" 
                          className="w-5 h-5" 
                        />
                      </div>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={`google-${star}`} className="w-5 h-5" fill={star <= (enhancedClinic.googleRating || enhancedClinic.rating) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-textSecondary">{enhancedClinic.googleRating || enhancedClinic.rating} ({enhancedClinic.googleReviewCount || Math.round(enhancedClinic.reviewCount * 0.7)} Google reviews)</span>
                    </div>
                    
                    {/* Yelp Reviews */}
                    <div className="flex items-center">
                      <div className="w-6 h-6 mr-2 relative flex items-center justify-center bg-transparent">
                        <img 
                          src="/images/icons/yelpicontrans.png" 
                          alt="Yelp" 
                          className="w-5 h-5" 
                        />
                      </div>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={`
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-textSecondary">{enhancedClinic.yelpRating || (enhancedClinic.rating - 0.2).toFixed(1)} ({enhancedClinic.yelpReviewCount || Math.round(enhancedClinic.reviewCount * 0.3)} Yelp reviews)</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(enhancedClinic.services || []).map((service) => (
                      <span key={service} className="bg-gray-800 text-sm px-3 py-1 rounded-full">{service}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 w-full md:w-auto">
                {/* Social Media Links for Standard & Advanced Tiers */}
                {(tier === 'advanced' || tier === 'standard') && (
                  <div className="flex gap-2 mb-3">
                    <a href="#" className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                    <a href="#" className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z" />
                      </svg>
                    </a>
                    <a href="#" className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913a5.885 5.885 0 0 0 1.384 2.126A5.868 5.868 0 0 0 4.14 23.37c.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558a5.898 5.898 0 0 0 2.126-1.384 5.86 5.86 0 0 0 1.384-2.126c.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913a5.89 5.89 0 0 0-1.384-2.126A5.847 5.847 0 0 0 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227a3.81 3.81 0 0 1-.899 1.382 3.744 3.744 0 0 1-1.38.896c-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421a3.716 3.716 0 0 1-1.379-.899 3.644 3.644 0 0 1-.9-1.38c-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 1 0 0-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 0 1-2.88 0 1.44 1.44 0 0 1 2.88 0z" />
                      </svg>
                    </a>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <TrackedPhoneLink 
                    phone={enhancedClinic.phone} 
                    clinicId={enhancedClinic.id} 
                    buttonStyle={true}
                  >
                    Call
                  </TrackedPhoneLink>
                  
                  {/* Website link for all tiers */}
                  {enhancedClinic.website && (
                    <a 
                      href={enhancedClinic.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn flex items-center justify-center gap-2"
                      onClick={() => {
                        // Temporarily disabled tracking
                        // trackClickToWebsite(enhancedClinic.id, enhancedClinic.name, enhancedClinic.website || '');
                        // leadTracker.trackLead(enhancedClinic.id, 'website');
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Website
                    </a>
                  )}
                </div>
                
                {/* CTA button only for Premium tier */}
                {hasCTAButton && (
                  <a href="#book" className="btn bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Appointment
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-800 mb-8 sticky top-0 bg-[#0A0A0A] z-10">
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
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'faq' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-white hover:border-gray-700'}`}
                onClick={() => {
                  setActiveTab('faq');
                  faqRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                FAQ
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
                Location & Hours
              </button>
            </nav>
          </div>
          
          {/* All content sections displayed inline */}
          <div className="space-y-16 mb-12">
            {/* About Section */}
            <div ref={aboutRef} id="about" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">About {enhancedClinic.name}</h2>
              
              {/* Display the AI-generated snapshot if available */}
              <p className="mb-6 text-lg">{enhancedClinic.description}</p>
              
              <h3 className="text-xl font-bold mb-3">Services</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                {(enhancedClinic.services || []).map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
              
              <div className="bg-gray-900 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Why Choose {enhancedClinic.name}</h3>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <svg className="w-6 h-6 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-bold">Experienced Medical Team</h4>
                      <p className="text-textSecondary">Our healthcare providers specialize in men's health and have helped thousands of patients.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <svg className="w-6 h-6 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-bold">Personalized Treatment Plans</h4>
                      <p className="text-textSecondary">We create customized solutions based on your unique health needs and goals.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <svg className="w-6 h-6 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-bold">Advanced Treatment Options</h4>
                      <p className="text-textSecondary">We offer the latest evidence-based treatments and technologies.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* FAQ Section */}
            <div ref={faqRef} id="faq" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                {enhancedClinic.faqs?.map((faq, index) => (
                  <div key={index} className="bg-gray-900 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-3">{faq.question}</h3>
                    <p className="text-textSecondary">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Reviews Section */}
            <div ref={reviewsRef} id="reviews" className="scroll-mt-24">
              {/* Reviews Section */}
              <ReviewsSection 
                clinicId={parseInt(enhancedClinic.id || '0', 10)} 
                clinicName={enhancedClinic.name} 
                reviews={enhancedClinic.reviews || []} 
              />
            </div>
            
            {/* Location Section */}
            <div ref={locationRef} id="location" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Location & Hours</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="bg-gray-900 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold mb-3">Address</h3>
                    <p className="mb-2">{enhancedClinic.address}</p>
                    <p className="mb-4">
                      <TrackedPhoneLink 
                        phone={enhancedClinic.phone} 
                        clinicId={enhancedClinic.id}
                      />
                    </p>
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(enhancedClinic.address)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn inline-flex items-center"
                      onClick={() => {
                        // Temporarily disabled tracking
                        // trackClickToDirections(enhancedClinic.id, enhancedClinic.name, enhancedClinic.address);
                        // leadTracker.trackLead(enhancedClinic.id, 'directions');
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Get Directions
                    </a>
                  </div>
                  
                  <div className="bg-gray-900 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-3">Business Hours</h3>
                    <ul className="space-y-2">
                      {enhancedClinic.hours?.map((hour) => (
                        <li key={hour.day} className="flex justify-between">
                          <span>{hour.day}</span>
                          <span className="text-textSecondary">{hour.hours}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-xl overflow-hidden h-96">
                  {/* Here we'd use a map component to show the location */}
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <p className="text-textSecondary">Map View</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA Section for Advanced tier */}
          {tier === 'advanced' && (
            <div id="book" className="bg-gray-900 rounded-xl p-8 text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Ready to book an appointment?</h2>
              <p className="text-textSecondary mb-6 max-w-2xl mx-auto">Schedule a consultation with our medical professionals to discuss your health goals and treatment options.</p>
              <button className="btn btn-lg bg-green-600 hover:bg-green-700">
                Book Your Appointment Now
              </button>
            </div>
          )}
          
          {/* SEO Content Section */}
          {(seoContent || enhancedClinic.seoContent) && (
            <div className="mt-12 mb-8 bg-gray-900 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">About {enhancedClinic.name} in {enhancedClinic.city}</h2>
              <SeoContentSection 
                content={seoContent || (typeof enhancedClinic.seoContent === 'string' ? enhancedClinic.seoContent : enhancedClinic.seoContent?.content) || ''} 
                className="text-textSecondary"
              />
            </div>
          )}

          {/* Recommended Providers section for Free tier */}
          {tier === 'free' && (
            <RecommendedProviders 
              currentClinicId={parseInt(enhancedClinic.id || '0', 10)}
              currentCity={enhancedClinic.city}
              currentState={enhancedClinic.state}
              clinics={mockClinicsWithMHFReviews as any}
            />
          )}
        </div>
      </main>
    </React.Fragment>
  );
};

export default ClinicProfile;