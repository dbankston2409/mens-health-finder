import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
// Remove Map imports - these functions don't exist in Map component
import { getServiceSlug } from '../lib/utils';
import { mockBlogPosts, mockClinics, BlogPost } from '../lib/mockData';
import LocationAwareSearch from '../components/LocationAwareSearch';
import FeaturedClinics from '../components/FeaturedClinics';
import { useAutoLocation } from '../hooks/useAutoLocation';

// Dynamic import for the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-900 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-[#AAAAAA]">Loading map components...</p>
        <p className="text-xs text-[#666666] mt-2">This may take a moment on first load</p>
      </div>
    </div>
  )
});

// Default center coordinates for the US map view
const DEFAULT_US_CENTER = { lat: 39.8283, lng: -98.5795, zoom: 4 };

// Mock data for featured clinics
const featuredClinics = [
  {
    id: 1,
    name: 'Prime Men\'s Health',
    city: 'Austin',
    state: 'TX',
    rating: 5.0,
    reviewCount: 24,
    services: ['TRT', 'ED Treatment', 'Weight Loss']},
  {
    id: 4,
    name: 'Superior Men\'s Clinic',
    city: 'San Antonio',
    state: 'TX',
    rating: 4.7,
    reviewCount: 29,
    services: ['TRT', 'ED Treatment', 'Weight Loss', 'Hair Loss']},
  {
    id: 2,
    name: 'Elite Men\'s Clinic',
    city: 'Dallas',
    state: 'TX',
    rating: 4.8,
    reviewCount: 36,
    services: ['TRT', 'Hair Loss', 'ED Treatment']}];

// Import service categories from mockData and add icons
import { serviceCategories as mockServiceCategories } from '../lib/mockData';

// Service categories with icons
const serviceCategories = [
  {
    id: 'hormone-optimization',
    title: 'Hormone Optimization',
    description: 'Comprehensive hormone replacement therapy including testosterone, HGH, and thyroid optimization.',
    emoji: '💉'
  },
  {
    id: 'sexual-health',
    title: 'Sexual Health',
    description: 'Advanced treatments for erectile dysfunction, premature ejaculation, and sexual wellness.',
    emoji: '⚡'
  },
  {
    id: 'peptides-performance',
    title: 'Peptides & Performance',
    description: 'Cutting-edge peptide therapies for performance enhancement, recovery, and longevity.',
    emoji: '🧬'
  },
  {
    id: 'hair-loss-aesthetics',
    title: 'Hair Loss & Aesthetics',
    description: 'Hair restoration treatments, PRP therapy, and aesthetic services for men.',
    emoji: '💇‍♂️'
  },
  {
    id: 'weight-loss-metabolic',
    title: 'Weight Loss & Metabolic',
    description: 'Medical weight management, metabolic optimization, and body composition improvement.',
    emoji: '⚖️'
  },
  {
    id: 'iv-injection-therapy',
    title: 'IV & Injection Therapy',
    description: 'IV nutrient therapy, vitamin injections, and hydration treatments.',
    emoji: '💧'
  },
  {
    id: 'regenerative-medicine',
    title: 'Regenerative Medicine',
    description: 'Stem cell therapy, PRP treatments, and advanced regenerative procedures.',
    emoji: '🧬'
  },
  {
    id: 'diagnostics-panels',
    title: 'Diagnostics & Panels',
    description: 'Comprehensive lab testing, hormone panels, and health diagnostics.',
    emoji: '🔬'
  }
];

export default function Home() {
  const router = useRouter();
  const [searchCity, setSearchCity] = useState('');
  const [searchService, setSearchService] = useState('');
  const [hasAttemptedAutoLocation, setHasAttemptedAutoLocation] = useState(false);
  // Initialize with US view by default
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number; zoom: number}>(DEFAULT_US_CENTER);
  const [nearbyClinics, setNearbyClinics] = useState(mockClinics);
  
  // Use auto-location hook
  const { location: autoLocation, isLoading: isLocating, error: autoLocationError } = useAutoLocation();

  // Use auto-location when available
  useEffect(() => {
    if (autoLocation && !hasAttemptedAutoLocation && !searchCity) {
      setHasAttemptedAutoLocation(true);
      const locationString = `${autoLocation.city}, ${autoLocation.region}`;
      setSearchCity(locationString);
      
      // Get coordinates for the auto-detected location
      // We'll need to geocode this location for the map center
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0]) {
            setUserLocation({
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              zoom: 11
            });
          }
        })
        .catch(err => console.error('Error geocoding location:', err));
    }
  }, [autoLocation, hasAttemptedAutoLocation, searchCity]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const query: Record<string, string> = {};
    
    if (searchCity) {
      query.location = searchCity;
    }
    
    if (searchService) {
      query.service = searchService;
    }
    
    router.push({
      pathname: '/search',
      query
    });
  };


  return (
    <>
      <Head>
        <title>Men&apos;s Health Finder</title>
        <meta name="description" content="Find specialized men's health clinics near you for TRT, ED treatment, hair loss, and more." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Hero Section */}
      <div className="py-10 md:py-16 px-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl md:text-5xl font-bold text-center leading-tight mb-6 max-w-3xl">
              Find Specialized Men&apos;s Health Clinics Near You
            </h1>
            
            <p className="text-[#AAAAAA] text-lg text-center mb-10 max-w-2xl">
              Connect with top specialists offering hormone optimization, sexual health treatments, 
              regenerative medicine, and more.
            </p>
            
            <div className="w-full max-w-3xl">
              <div className="glass-card p-6 mb-10 relative z-10 group">
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[-1] rounded-2xl"></div>
                
                <div className="space-y-5">
                  {/* Replace the old location search with our new component */}
                  <LocationAwareSearch />
                  
                  {/* Treatment Pills */}
                  <div className="text-center">
                    <label className="inline-block text-sm text-[#AAAAAA] mb-2">Treatment</label>
                    <div className="treatment-pills">
                      <div 
                        className={`treatment-pill ${searchService === "Hormone Optimization" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "Hormone Optimization" ? "" : "Hormone Optimization")}
                      >
                        <span className="text-lg">💉</span>
                        <span>Hormones</span>
                      </div>
                      <div 
                        className={`treatment-pill ${searchService === "Sexual Health" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "Sexual Health" ? "" : "Sexual Health")}
                      >
                        <span className="text-lg">⚡</span>
                        <span>Sexual Health</span>
                      </div>
                      <div 
                        className={`treatment-pill ${searchService === "Hair & Aesthetics" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "Hair & Aesthetics" ? "" : "Hair & Aesthetics")}
                      >
                        <span className="text-lg">💇‍♂️</span>
                        <span>Hair & Aesthetics</span>
                      </div>
                      <div 
                        className={`treatment-pill ${searchService === "Weight & Metabolic" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "Weight & Metabolic" ? "" : "Weight & Metabolic")}
                      >
                        <span className="text-lg">⚖️</span>
                        <span>Weight & Metabolic</span>
                      </div>
                      <div 
                        className={`treatment-pill ${searchService === "Peptides" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "Peptides" ? "" : "Peptides")}
                      >
                        <span className="text-lg">💊</span>
                        <span>Peptides</span>
                      </div>
                      <div 
                        className={`treatment-pill ${searchService === "IV & Injections" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "IV & Injections" ? "" : "IV & Injections")}
                      >
                        <span className="text-lg">💧</span>
                        <span>IV & Injections</span>
                      </div>
                      <div 
                        className={`treatment-pill ${searchService === "Regenerative Medicine" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "Regenerative Medicine" ? "" : "Regenerative Medicine")}
                      >
                        <span className="text-lg">🧬</span>
                        <span>Regenerative</span>
                      </div>
                      <div 
                        className={`treatment-pill ${searchService === "Diagnostics" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "Diagnostics" ? "" : "Diagnostics")}
                      >
                        <span className="text-lg">🔬</span>
                        <span>Diagnostics</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button type="submit" className="btn px-8 relative overflow-hidden transition-all duration-300 group hover:bg-red-600 hover:shadow-lg hover:scale-105">
                      {/* Button content */}
                      <div className="flex items-center justify-center gap-2 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Find Clinics
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Nearby Clinics Map */}
            <div className="w-full max-w-4xl mb-16">
              <div className="mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {nearbyClinics.length === mockClinics.length 
                    ? 'All Available Clinics' 
                    : `Clinics Within 5 Miles (${nearbyClinics.length})`}
                </h2>
                <p className="text-[#AAAAAA] text-sm">
                  {userLocation && userLocation.zoom > 6
                    ? "Showing clinics near your detected location"
                    : autoLocationError 
                      ? "Location access denied. Showing all available clinics."
                      : "Enable location access to see clinics near you"}
                </p>
              </div>
              
              <div className="rounded-xl overflow-hidden shadow-lg border border-[#222222] h-[400px]">
                {/* Add key={userLocation.lat + ',' + userLocation.lng} to force map re-render on location change */}
                <Map 
                  key={`map-${userLocation.lat.toFixed(6)},${userLocation.lng.toFixed(6)}-${nearbyClinics.length}`}
                  locations={nearbyClinics.map(clinic => {
                    // Convert legacy tier to standardized tier
                    const standardizedTier = 
                      clinic.tier === 'high' ? 'advanced' as const : 
                      clinic.tier === 'low' ? 'standard' as const : 'free' as const;
                    
                    return {
                      id: clinic.id,
                      name: clinic.name,
                      address: clinic.address,
                      city: clinic.city,
                      state: clinic.state,
                      lat: clinic.lat || 0,
                      lng: clinic.lng || 0,
                      tier: standardizedTier,
                      rating: clinic.rating,
                      phone: clinic.phone,
                      services: clinic.services
                    };
                  })}
                  center={userLocation}
                  height="400px"
                  singleLocation={false}
                  defaultToUS={locationError !== null}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Services Section */}
      <div className="py-14 px-4 bg-[#0A0A0A]">
        <div className="w-full max-w-6xl mx-auto">
          <h2 className="section-title">
            Specialized Treatments
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-12">
            {serviceCategories.map((service) => (
              <div key={service.id} className="card p-6 hover:bg-[#181818] transition-colors">
                <div className="circle-icon w-12 h-12 flex items-center justify-center text-2xl text-black">
                  {service.emoji}
                </div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-[#AAAAAA] mb-5 text-sm">{service.description}</p>
                <Link 
                  href={`/${getServiceSlug(service.id)}`} 
                  className="text-primary hover:text-red-400 text-sm font-medium flex items-center"
                >
                  Find specialists
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Featured Clinics Section */}
      <div className="py-14 px-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="section-title">Featured Clinics</h2>
            <Link href="/search" className="text-primary hover:text-red-400 font-medium flex items-center">
              View all
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
          
          {/* Replace static featured clinics with our dynamic component */}
          <FeaturedClinics />
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-14 px-4 bg-[#0A0A0A]">
        <div className="w-full max-w-4xl mx-auto">
          <div className="card p-8 md:p-10 bg-gradient-to-br from-[#111] to-[#151515]">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Own a Men&apos;s Health Clinic?</h2>
              <p className="text-[#AAAAAA] mb-6 max-w-2xl mx-auto">
                Join our growing network of specialized clinics. Get listed today and connect with patients looking for your services.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up" className="btn">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Add Your Clinic
              </Link>
              <Link href="/pricing" className="btn-secondary">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works */}
      <div className="py-14 px-4">
        <div className="w-full max-w-6xl mx-auto">
          <h2 className="section-title text-center mx-auto">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
            {[
              {
                step: '01',
                title: 'Search',
                description: 'Enter your location and treatment needs to find specialized clinics near you.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )},
              {
                step: '02',
                title: 'Compare',
                description: 'Review clinic profiles, services, ratings, and patient reviews.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                )},
              {
                step: '03',
                title: 'Connect',
                description: 'Book appointments online or contact clinics directly for consultations.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}].map((item, index) => (
              <div key={index} className="text-center">
                <div className="circle-icon w-16 h-16 mx-auto flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="text-sm font-bold text-primary mb-3">STEP {item.step}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-[#AAAAAA] text-sm max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* From the Blog Section */}
      <div className="py-14 px-4 bg-[#0A0A0A]">
        <div className="w-full max-w-6xl mx-auto">
          <h2 className="section-title">
            Latest Insights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {mockBlogPosts.length > 0 ? (
              // Sort posts by date (newest first) and take the first 3
              mockBlogPosts
                .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
                .slice(0, 3)
                .map((post) => (
                  <div key={post.id} className="card overflow-hidden flex flex-col h-full transition-transform hover:translate-y-[-4px]">
                    {/* Featured Image */}
                    <Link href={`/blog/${post.slug}`} className="block">
                      <div className="h-48 bg-[#222] relative overflow-hidden">
                        {/* In a real app, we'd use Next.js Image component with actual images */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] to-transparent opacity-50"></div>
                        <div className="w-full h-full flex items-center justify-center text-[#AAAAAA]">
                          {post.featuredImage ? (
                            <img 
                              src={post.featuredImage} 
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            "Featured Image"
                          )}
                        </div>
                      </div>
                    </Link>
                    
                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      <Link href={`/blog/${post.slug}`} className="block">
                        <h3 className="text-xl font-bold mb-3 hover:text-primary transition-colors line-clamp-2">
                          {post.title.length > 80 ? `${post.title.substring(0, 77)}...` : post.title}
                        </h3>
                      </Link>
                      
                      <p className="text-[#AAAAAA] text-sm mb-4 flex-grow">
                        {post.excerpt.split(' ').slice(0, 35).join(' ')}
                        {post.excerpt.split(' ').length > 35 ? '...' : ''}
                      </p>
                      
                      <Link 
                        href={`/blog/${post.slug}`} 
                        className="btn-secondary inline-flex self-start items-center text-sm"
                      >
                        Read More
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))
            ) : (
              // Fallback when no blog posts are available
              <div className="col-span-3 text-center py-16">
                <div className="text-xl text-[#AAAAAA]">New insights coming soon</div>
              </div>
            )}
          </div>
          
          <div className="mt-10 text-center">
            <Link href="/blog" className="btn inline-flex items-center">
              View All Articles
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}