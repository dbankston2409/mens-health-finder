import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClinicUrl, reverseGeocode } from '../components/Map';
import { getServiceSlug } from '../lib/utils';
import { mockBlogPosts, mockClinics, BlogPost } from '../lib/mockData';
import LocationAwareSearch from '../components/LocationAwareSearch';
import FeaturedClinics from '../components/FeaturedClinics';

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
    services: ['TRT', 'ED Treatment', 'Weight Loss'],
  },
  {
    id: 4,
    name: 'Superior Men\'s Clinic',
    city: 'San Antonio',
    state: 'TX',
    rating: 4.7,
    reviewCount: 29,
    services: ['TRT', 'ED Treatment', 'Weight Loss', 'Hair Loss'],
  },
  {
    id: 2,
    name: 'Elite Men\'s Clinic',
    city: 'Dallas',
    state: 'TX',
    rating: 4.8,
    reviewCount: 36,
    services: ['TRT', 'Hair Loss', 'ED Treatment'],
  },
];

// Import service categories from mockData and add icons
import { serviceCategories as mockServiceCategories } from '../lib/mockData';

// Service categories with icons
const serviceCategories = [
  {
    id: 'trt',
    title: 'Testosterone Therapy',
    description: 'Restore energy, strength and vitality with specialized TRT programs.',
    emoji: '💉',
  },
  {
    id: 'ed',
    title: 'ED Treatment',
    description: 'Effective solutions to restore confidence and performance.',
    emoji: '⚡',
  },
  {
    id: 'hairloss',
    title: 'Hair Loss',
    description: 'Advanced treatments to prevent and reverse hair loss.',
    emoji: '💇‍♂️',
  },
  {
    id: 'weightloss',
    title: 'Weight Management',
    description: 'Specialized programs designed for men&apos;s metabolic needs.',
    emoji: '⚖️',
  },
  {
    id: 'peptide-therapy',
    title: 'Peptide Therapy',
    description: 'Cutting-edge peptide treatments to enhance performance and recovery.',
    emoji: '🧬',
  },
  {
    id: 'iv-therapy',
    title: 'IV Therapy',
    description: 'Hydration and nutrient delivery for optimal wellness and recovery.',
    emoji: '💧',
  },
  {
    id: 'cryotherapy',
    title: 'Cryotherapy',
    description: 'Cold therapy treatments for recovery, inflammation and pain relief.',
    emoji: '❄️',
  },
];

export default function Home() {
  const router = useRouter();
  const [searchCity, setSearchCity] = useState('');
  const [searchService, setSearchService] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasAttemptedAutoLocation, setHasAttemptedAutoLocation] = useState(false);
  // Initialize with US view by default
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number; zoom: number}>(DEFAULT_US_CENTER);
  const [nearbyClinics, setNearbyClinics] = useState(mockClinics);

  // Attempt to get user location on component mount
  useEffect(() => {
    // Only attempt auto-location once and only if the search city isn't already set
    if (!hasAttemptedAutoLocation && !searchCity) {
      setHasAttemptedAutoLocation(true);
      console.log("AUTO-DETECTING LOCATION ON PAGE LOAD");
      // Add a slight delay to ensure the map is mounted
      const timeoutId = setTimeout(() => {
        getUserLocation(false); // false indicates this is an automatic attempt, not manual
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAttemptedAutoLocation, searchCity]);

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

  // Function to get user's current location and convert to city, state
  const getUserLocation = (manualTrigger = false) => {
    setIsLocating(true);
    setLocationError(null);
    
    console.log("GETTING USER LOCATION:", manualTrigger ? "MANUAL TRIGGER" : "AUTO DETECT");
    
    // If this was triggered by a button click (not auto-detect), 
    // reset the hasAttemptedAutoLocation flag to allow future auto-detection attempts
    if (manualTrigger) {
      setHasAttemptedAutoLocation(false);
    }
    
    // Check if geolocation is available in the browser
    if (!navigator.geolocation) {
      console.error("Geolocation API not available in this browser");
      setLocationError("Geolocation is not supported by your browser");
      setIsLocating(false);
      // Set default US map view
      setUserLocation(DEFAULT_US_CENTER);
      return;
    }
    
    // Create a timeout that will trigger if geolocation takes too long
    const timeoutId = setTimeout(() => {
      console.log("Location acquisition taking longer than expected, showing feedback...");
      setLocationError("Determining your location... This may take a few moments.");
    }, 2000);
    
    // Define a direct geocoding function to bypass the component's method
    const directReverseGeocode = async (lat: number, lon: number): Promise<{city: string; state: string} | null> => {
      console.log("Attempting direct reverse geocoding for:", lat, lon);
      try {
        // Direct call to OpenStreetMap Nominatim API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=en-US`,
          {
            headers: {
              'User-Agent': 'MensHealthFinder/1.0'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Direct reverse geocoding response:", data);
        
        if (data && data.address) {
          const address = data.address;
          
          // Try to extract city and state from address object
          const city = address.city || address.town || address.village || address.hamlet || address.suburb || address.county;
          let state = address.state;
          
          // Try to get state code if available
          if (address.state_code) {
            state = address.state_code;
          }
          
          if (city && state) {
            console.log("Successfully determined location from direct API:", { city, state });
            return { city, state };
          }
        }
        
        // Default return
        return null;
      } catch (error) {
        console.error("Direct reverse geocoding error:", error);
        return null;
      }
    };
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Clear the timeout since we got a position
          clearTimeout(timeoutId);
          
          // Get latitude and longitude
          const { latitude, longitude } = position.coords;
          console.log("Got user coordinates:", latitude, longitude);
          
          // IMMEDIATE ACTION: Store the user's location for the map
          // This ensures the map centers on the user's location regardless of geocoding success
          const userLocationObj = {
            lat: latitude,
            lng: longitude,
            zoom: 12  // City-level zoom
          };
          
          console.log("Setting map center to user coordinates:", userLocationObj);
          setUserLocation(userLocationObj);
          
          // Filter clinics to show only those within ~5 miles (approximately 0.07 degrees)
          const nearbyClinicsFiltered = mockClinics.filter(clinic => {
            if (!clinic.lat || !clinic.lng) return false;
            
            // Simple distance calculation (this is a rough approximation)
            const distance = Math.sqrt(
              Math.pow(clinic.lat - latitude, 2) + 
              Math.pow(clinic.lng - longitude, 2)
            );
            
            // ~0.07 degrees is roughly 5 miles
            return distance < 0.07;
          });
          
          // Update nearby clinics, if none are found within 5 miles, show all
          if (nearbyClinicsFiltered.length > 0) {
            console.log(`Found ${nearbyClinicsFiltered.length} clinics within 5 miles`);
            setNearbyClinics(nearbyClinicsFiltered);
          } else {
            console.log("No clinics found within 5 miles, showing all clinics");
          }
          
          let locationResult = null;
          
          // First, try direct geocoding
          locationResult = await directReverseGeocode(latitude, longitude);
          
          // If direct geocoding fails, try the component's method
          if (!locationResult) {
            console.log("Direct geocoding failed, trying component method");
            try {
              locationResult = await reverseGeocode(latitude, longitude);
            } catch (geocodeError) {
              console.error("Component geocoding method failed:", geocodeError);
              // Continue with default handling
            }
          }
          
          if (locationResult) {
            // Format as "City, State"
            console.log("Final location determined:", locationResult);
            setSearchCity(`${locationResult.city}, ${locationResult.state}`);
            setLocationError(null); // Clear any error message
          } else {
            console.warn("All reverse geocoding methods failed");
            setLocationError("Could not determine your city and state. Using a default location.");
            
            // Default to a reasonable city in the US if all geocoding fails
            setSearchCity("Austin, TX");
          }
        } catch (error) {
          console.error("Error processing location:", error);
          setLocationError("Failed to get your location. Please enter it manually.");
          
          // Set default US map view on error
          setUserLocation(DEFAULT_US_CENTER);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        // Clear the timeout since we got an error response
        clearTimeout(timeoutId);
        
        console.error("Geolocation error:", error);
        
        let errorMessage = "Failed to get your location.";
        if (error.code === 1) {
          errorMessage = "Location access denied. Please check your browser settings to enable location access, or enter your location manually.";
        } else if (error.code === 2) {
          errorMessage = "Your location is currently unavailable. Please try again later or enter it manually.";
        } else if (error.code === 3) {
          errorMessage = "Location request timed out. Please try again or enter it manually.";
        }
        
        setLocationError(errorMessage);
        setIsLocating(false);
        
        // Set default US map view on error
        setUserLocation(DEFAULT_US_CENTER);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000,  // Increased to 15 seconds
        maximumAge: 300000 // 5 minutes
      }
    );
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
              Connect with top specialists offering testosterone therapy, ED treatment, 
              hair loss solutions, and more.
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
                        className={`treatment-pill ${searchService === "TRT" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "TRT" ? "" : "TRT")}
                      >
                        <span className="text-lg">💉</span>
                        <span>TRT</span>
                      </div>
                      <div 
                        className={`treatment-pill ${searchService === "ED Treatment" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "ED Treatment" ? "" : "ED Treatment")}
                      >
                        <span className="text-lg">⚡</span>
                        <span>ED Treatment</span>
                      </div>
                      <div 
                        className={`treatment-pill ${searchService === "Hair Loss" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "Hair Loss" ? "" : "Hair Loss")}
                      >
                        <span className="text-lg">💇‍♂️</span>
                        <span>Hair Loss</span>
                      </div>
                      <div 
                        className={`treatment-pill ${searchService === "Weight Loss" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "Weight Loss" ? "" : "Weight Loss")}
                      >
                        <span className="text-lg">⚖️</span>
                        <span>Weight Loss</span>
                      </div>
                      <div 
                        className={`treatment-pill ${searchService === "Peptide Therapy" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "Peptide Therapy" ? "" : "Peptide Therapy")}
                      >
                        <span className="text-lg">🧬</span>
                        <span>Peptide Therapy</span>
                      </div>
                      <div 
                        className={`treatment-pill ${searchService === "IV Therapy" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "IV Therapy" ? "" : "IV Therapy")}
                      >
                        <span className="text-lg">💧</span>
                        <span>IV Therapy</span>
                      </div>
                      <div 
                        className={`treatment-pill ${searchService === "Cryotherapy" ? "active" : ""}`}
                        onClick={() => setSearchService(searchService === "Cryotherapy" ? "" : "Cryotherapy")}
                      >
                        <span className="text-lg">❄️</span>
                        <span>Cryotherapy</span>
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
                    : locationError 
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
                ),
              },
              {
                step: '02',
                title: 'Compare',
                description: 'Review clinic profiles, services, ratings, and patient reviews.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Connect',
                description: 'Book appointments online or contact clinics directly for consultations.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
              },
            ].map((item, index) => (
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