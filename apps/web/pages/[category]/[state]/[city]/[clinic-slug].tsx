import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import TierBadge from '../../../../components/TierBadge';
import StructuredData from '../../../../components/StructuredData';
import TrackedPhoneLink from '../../../../components/TrackedPhoneLink';
import SeoContentSection from '../../../../components/SeoContentSection';
import { mockClinics, serviceCategories } from '../../../../lib/mockData';
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
import { createClinicUrl } from '../../../../components/Map';

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
        <title>{
          clinic.seoMeta?.title || 
          `${clinicDisplayName} - ${categoryInfo.title} Clinic in ${locationInfo.city}, ${locationInfo.stateCode} | Men's Health Finder`
        }</title>
        <meta 
          name="description" 
          content={
            clinic.seoMeta?.description || 
            `${clinicDisplayName} offers specialized ${categoryInfo.title.toLowerCase()} treatment in ${locationInfo.city}, ${locationInfo.stateCode}. Read reviews, view services, and contact this men's health clinic.`
          } 
        />
        <meta 
          name="keywords" 
          content={
            clinic.seoMeta?.keywords?.join(', ') || 
            `${categoryInfo.title.toLowerCase()}, men's health, ${locationInfo.city}, ${locationInfo.stateCode}, ${clinic.services.join(', ')}`
          }
        />
        <link 
          rel="canonical" 
          href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com'}/${categoryInfo.id}/${locationInfo.stateCode.toLowerCase()}/${slugify(locationInfo.city)}/${clinicSlug}`} 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Add structured data for local business */}
      <StructuredData 
        clinic={clinic} 
        url={typeof window !== 'undefined' 
          ? window.location.href 
          : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com'}/${categoryInfo.id}/${locationInfo.stateCode.toLowerCase()}/${slugify(locationInfo.city)}/${clinicSlug}`
        } 
      />
      
      <main className="container mx-auto px-4 py-8">
        <Breadcrumbs 
          category={categoryInfo.id} 
          state={locationInfo.stateCode.toLowerCase()} 
          city={slugify(locationInfo.city)}
          clinic={clinicSlug}
          categoryTitle={categoryInfo.title}
          stateFullName={locationInfo.stateFullName}
        />
        
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
                  <h1 className="text-3xl font-bold">{clinicDisplayName}</h1>
                  <TierBadge tier={convertTierToEnum(clinic.tier)} size="md" />
                </div>
                <p className="text-textSecondary mt-1">{clinic.address}</p>
                
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
                        <svg key={`google-${star}`} className="w-5 h-5" fill={star <= (clinic.googleRating || clinic.rating) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-textSecondary">{clinic.googleRating || clinic.rating} ({clinic.googleReviewCount || Math.round(clinic.reviewCount * 0.7)} Google reviews)</span>
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
                        <svg key={`yelp-${star}`} className="w-5 h-5" fill={star <= (clinic.yelpRating || clinic.rating - 0.2) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-textSecondary">{clinic.yelpRating || (clinic.rating - 0.2).toFixed(1)} ({clinic.yelpReviewCount || Math.round(clinic.reviewCount * 0.3)} Yelp reviews)</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {clinic.services.map((service: string) => (
                    <span key={service} className="bg-gray-800 text-sm px-3 py-1 rounded-full">{service}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 w-full md:w-auto">
              {/* Social Media Links for Starter & Premium Tiers */}
              {(clinic.tier === 'high' || clinic.tier === 'low') && (
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
                  <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="btn flex items-center justify-center gap-2">
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
        
        {/* Tabs */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'about' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-white hover:border-gray-700'}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-white hover:border-gray-700'}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'faq' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-white hover:border-gray-700'}`}
              onClick={() => setActiveTab('faq')}
            >
              FAQ
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'location' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-white hover:border-gray-700'}`}
              onClick={() => setActiveTab('location')}
            >
              Location & Hours
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="mb-12">
          {activeTab === 'about' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">About {clinicDisplayName}</h2>
              <p className="mb-6 text-lg">{clinic.description}</p>
              
              <h3 className="text-xl font-bold mb-3">{categoryInfo.title} Services</h3>
              <p className="mb-4">
                {clinicDisplayName} specializes in providing top-quality {categoryInfo.title.toLowerCase()} treatments 
                for men in {locationInfo.city}, {locationInfo.stateCode}. Our comprehensive approach ensures that you receive 
                personalized care tailored to your unique needs.
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                {clinic.services.map((service: string) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
              
              <div className="bg-gray-900 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Why Choose {clinicDisplayName}</h3>
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
          )}
          
          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Patient Reviews for {clinicDisplayName}</h2>
              
              <div className="space-y-6">
                {clinic.reviews?.map((review: any, index: number) => (
                  <div key={index} className="bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-bold">{review.author}</span>
                        <p className="text-sm text-textSecondary">{review.source}</p>
                      </div>
                      <div className="flex items-center">
                        <div className="flex text-yellow-400 mr-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className="w-4 h-4" fill={star <= review.rating ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm">{review.rating}.0</span>
                      </div>
                    </div>
                    <p className="text-textSecondary">{review.text}</p>
                    {review.date && (
                      <p className="text-xs text-textSecondary mt-2">{review.date}</p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-center">
                <a 
                  href="#" 
                  className="btn-secondary"
                >
                  Write a Review
                </a>
              </div>
            </div>
          )}
          
          {activeTab === 'faq' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                {clinic.faqs?.map((faq: any, index: number) => (
                  <div key={index} className="bg-gray-900 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-3">{faq.question}</h3>
                    <p className="text-textSecondary">{faq.answer}</p>
                  </div>
                ))}
                
                {/* Add a specialized FAQ about the category if not already covered */}
                {!clinic.faqs?.some((faq: any) => faq.question.toLowerCase().includes(categoryInfo.title.toLowerCase())) && (
                  <div className="bg-gray-900 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-3">What {categoryInfo.title} services do you offer?</h3>
                    <p className="text-textSecondary">
                      At {clinicDisplayName}, we offer comprehensive {categoryInfo.title.toLowerCase()} services 
                      tailored to each patient's unique needs. Our approach includes thorough evaluation, 
                      personalized treatment plans, and ongoing monitoring to ensure optimal results. 
                      Contact us to schedule a consultation and learn more about our specialized 
                      {categoryInfo.title.toLowerCase()} treatments.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'location' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Location & Hours</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="bg-gray-900 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold mb-3">Address</h3>
                    <p className="mb-2">{clinic.address}</p>
                    <p className="mb-4">
                      <TrackedPhoneLink 
                        phone={clinic.phone} 
                        clinicId={clinic.id}
                        searchQuery=""
                        sourcePage={`/${categoryInfo.id}/${locationInfo.stateCode.toLowerCase()}/${slugify(locationInfo.city)}/${clinicSlug}`}
                      />
                    </p>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`} target="_blank" rel="noopener noreferrer" className="btn inline-flex items-center">
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
                      {clinic.hours?.map((hour: any) => (
                        <li key={hour.day} className="flex justify-between">
                          <span>{hour.day}</span>
                          <span className="text-textSecondary">{hour.hours}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-xl overflow-hidden h-96">
                  {/* Map component */}
                  <Map 
                    locations={[{
                      id: clinic.id,
                      name: clinic.name,
                      address: clinic.address,
                      city: clinic.city,
                      state: clinic.state,
                      lat: clinic.lat || 0,
                      lng: clinic.lng || 0,
                      tier: clinic.tier,
                      rating: clinic.rating,
                      phone: clinic.phone
                    }]}
                    center={{
                      lat: clinic.lat || 0,
                      lng: clinic.lng || 0,
                      zoom: 15
                    }}
                    height="100%"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* CTA Section for Premium tier */}
        {clinic.tier === 'high' && (
          <div id="book" className="bg-gray-900 rounded-xl p-8 text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Ready to book an appointment?</h2>
            <p className="text-textSecondary mb-6 max-w-2xl mx-auto">
              Schedule a consultation with our medical professionals to discuss your 
              {categoryInfo.title.toLowerCase()} needs and treatment options.
            </p>
            <button className="btn btn-lg bg-green-600 hover:bg-green-700">
              Book Your Appointment Now
            </button>
          </div>
        )}
        
        {/* SEO Content Section */}
        {(seoContent || clinic.seoContent) && (
          <div className="mt-8 mb-8 bg-gray-900 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">
              About {clinicDisplayName} - {categoryInfo.title} in {locationInfo.city}
            </h2>
            <SeoContentSection 
              content={seoContent || clinic.seoContent || ''} 
              className="text-textSecondary"
            />
          </div>
        )}
        
        {/* Related clinics section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">
            Other {categoryInfo.title} Clinics in {locationInfo.city}, {locationInfo.stateCode}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Link 
                key={index} 
                href={`/${categoryInfo.id}/${locationInfo.stateCode.toLowerCase()}/${slugify(locationInfo.city)}`}
                className="card p-6 hover:bg-[#151515] transition-colors"
              >
                <div className="mb-1 font-bold">Find More Clinics</div>
                <p className="text-sm text-textSecondary mb-4">
                  View all {categoryInfo.title.toLowerCase()} clinics in {locationInfo.city}
                </p>
                <span className="text-primary text-sm flex items-center">
                  View Clinics
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Generate a limited set of paths initially
  // The rest will be generated on-demand with fallback: 'blocking'
  const paths: { params: { category: string; state: string; city: string; "clinic-slug": string } }[] = [];

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const categorySlug = params?.category as string;
  const stateSlug = params?.state as string;
  const citySlug = params?.city as string;
  const clinicSlug = params?.["clinic-slug"] as string;
  
  // Find the matching category
  const categoryData = serviceCategories.find(
    (cat) => slugify(cat.id) === categorySlug
  );
  
  // If no matching category, return 404
  if (!categoryData) {
    return { notFound: true };
  }
  
  // Filter clinics by this category
  const clinicsInCategory = filterClinicsByCategory(mockClinics, categoryData.title);
  
  // Find the clinic that matches the slug
  const matchingClinic = clinicsInCategory.find(clinic => 
    createClinicSlug(clinic.name, clinic.city, clinic.state) === clinicSlug
  );
  
  // If no matching clinic found, check each state/city combination
  if (!matchingClinic) {
    // Group clinics by state
    const clinicsByState = groupClinicsByState(clinicsInCategory);
    
    // Find the state that matches our slug
    const matchingState = Object.keys(clinicsByState).find(
      state => slugify(state) === stateSlug
    );
    
    // If no matching state, return 404
    if (!matchingState) {
      return { notFound: true };
    }
    
    // Get clinics for this state
    const clinicsInState = clinicsByState[matchingState];
    
    // Group clinics by city
    const clinicsByCity = groupClinicsByCity(clinicsInState);
    
    // Find the city that matches our slug
    const matchingCity = Object.keys(clinicsByCity).find(
      city => slugify(city) === citySlug
    );
    
    // If no matching city, return 404
    if (!matchingCity) {
      return { notFound: true };
    }
    
    // Return 404 since we couldn't find the specific clinic
    return { notFound: true };
  }
  
  return {
    props: {
      categoryInfo: {
        id: categorySlug,
        title: categoryData.title,
        description: categoryData.description,
      },
      locationInfo: {
        stateCode: matchingClinic.state,
        stateFullName: getStateFullName(matchingClinic.state),
        city: matchingClinic.city,
      },
      clinic: matchingClinic,
      clinicSlug,
    },
    // Revalidate every day
    revalidate: 86400,
  };
};