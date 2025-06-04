// Mock implementation of clinic service for development mode
import { mockClinics } from '../mockData';
import { Clinic, ClinicFilter } from '../../types';
import { Timestamp } from 'firebase/firestore';

// Convert legacy tier values to standardized tier format
function convertTierToStandard(tier: string): 'free' | 'standard' | 'advanced' {
  const normalized = tier.toLowerCase();
  
  if (normalized === 'high' || normalized === 'premium') {
    return 'advanced';
  }
  
  if (normalized === 'low' || normalized === 'basic') {
    return 'standard';
  }
  
  if (normalized === 'advanced') return 'advanced';
  if (normalized === 'standard') return 'standard';
  
  return 'free';
}

// Helper function to convert mock data to match Firestore schema
function convertMockClinic(clinic: any): Clinic {
  return {
    id: String(clinic.id),
    name: clinic.name,
    slug: clinic.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    address: clinic.address || '',
    city: clinic.city,
    state: clinic.state,
    zip: clinic.zip || '12345',
    country: 'USA',
    lat: clinic.lat || null,
    lng: clinic.lng || null,
    phone: clinic.phone || '',
    website: clinic.website || '',
    services: clinic.services || [],
    tier: convertTierToStandard(clinic.tier || 'free'), // Use standardized tier
    package: clinic.tier || 'free', // Keep legacy field for backward compatibility
    status: 'active',
    tags: [],
    importSource: 'manual',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    lastUpdated: Timestamp.fromDate(new Date()),
    trafficMeta: {
      totalClicks: Math.floor(Math.random() * 1000),
      topSearchTerms: [],
      lastViewed: Timestamp.fromDate(new Date())},
    validationStatus: {
      verified: true,
      method: 'manual',
      websiteOK: true}
  };
}

/**
 * Get a clinic by its slug (MOCK)
 */
export async function getClinicBySlug(slug: string): Promise<Clinic | null> {
  // Find clinic with matching slug
  const mockClinic = mockClinics.find(clinic => 
    clinic.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === slug
  );
  
  if (!mockClinic) {
    return null;
  }
  
  return convertMockClinic(mockClinic);
}

/**
 * Get a clinic by its ID (MOCK)
 */
export async function getClinicById(id: string): Promise<Clinic | null> {
  const mockClinic = mockClinics.find(clinic => String(clinic.id) === id);
  
  if (!mockClinic) {
    return null;
  }
  
  return convertMockClinic(mockClinic);
}

/**
 * Query clinics with filtering (MOCK)
 */
export async function queryClinics(
  filters: ClinicFilter = {}, 
  pageSize: number = 20
): Promise<{ clinics: Clinic[], lastDoc: any, hasMore: boolean }> {
  // Apply filters to mock data
  let filteredClinics = [...mockClinics];
  
  if (filters.city) {
    filteredClinics = filteredClinics.filter(clinic => 
      clinic.city.toLowerCase() === filters.city?.toLowerCase()
    );
  }
  
  if (filters.state) {
    filteredClinics = filteredClinics.filter(clinic => 
      clinic.state.toLowerCase() === filters.state?.toLowerCase()
    );
  }
  
  if (filters.services && filters.services.length > 0) {
    filteredClinics = filteredClinics.filter(clinic => 
      clinic.services.some(service => 
        filters.services?.includes(service)
      )
    );
  }
  
  // Handle filtering by tier or package
  if (filters.tier) {
    // Filter by new tier field
    filteredClinics = filteredClinics.filter(clinic => {
      const clinicStandardTier = convertTierToStandard(clinic.tier || 'free');
      return clinicStandardTier === filters.tier;
    });
  }
  else if (filters.package) {
    // Legacy filter by package
    // Map package to tier for mock data
    const tierEquivalent = filters.package === 'premium' ? 'high' : 
                          filters.package === 'basic' ? 'low' : 'free';
    
    filteredClinics = filteredClinics.filter(clinic => 
      clinic.tier === tierEquivalent
    );
  }
  
  // Convert to Clinic format
  const clinics = filteredClinics
    .slice(0, pageSize)
    .map(convertMockClinic);
  
  const hasMore = filteredClinics.length > pageSize;
  
  return { 
    clinics,
    lastDoc: null,
    hasMore 
  };
}

/**
 * Search clinics by text (MOCK)
 */
export async function searchClinics(
  searchTerm: string,
  pageSize: number = 20
): Promise<Clinic[]> {
  const searchLower = searchTerm.toLowerCase();
  
  // Search mock data
  const matchedClinics = mockClinics.filter(clinic => {
    const nameMatch = clinic.name.toLowerCase().includes(searchLower);
    const cityMatch = clinic.city.toLowerCase().includes(searchLower);
    const stateMatch = clinic.state.toLowerCase().includes(searchLower);
    const serviceMatch = clinic.services.some(
      service => service.toLowerCase().includes(searchLower)
    );
    
    return nameMatch || cityMatch || stateMatch || serviceMatch;
  });
  
  return matchedClinics
    .slice(0, pageSize)
    .map(convertMockClinic);
}

/**
 * Log clinic traffic (MOCK)
 */
export async function logClinicTraffic(
  searchQuery: string,
  clinicSlug: string,
  userRegion: string = ''
): Promise<{ success: boolean; error?: string }> {
  // Just simulate success in development mode
  console.log(`[MOCK] Logged traffic for ${clinicSlug} from search "${searchQuery}"`);
  return { success: true };
}

/**
 * Get clinics near a geographic location (MOCK)
 */
export async function getNearbyClinics(
  lat: number,
  lng: number,
  radiusMiles: number = 50,
  maxResults: number = 10
): Promise<Clinic[]> {
  // Filter clinics with lat/lng
  const clinicsWithCoords = mockClinics.filter(clinic => 
    clinic.lat !== undefined && clinic.lng !== undefined
  );
  
  // Calculate distances
  const clinicsWithDistance = clinicsWithCoords.map(clinic => ({
    clinic,
    distance: calculateDistance(lat, lng, clinic.lat || 0, clinic.lng || 0)
  }));
  
  // Filter by radius and sort by distance
  const nearbyClinics = clinicsWithDistance
    .filter(item => item.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults)
    .map(item => convertMockClinic(item.clinic));
  
  return nearbyClinics;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Radius of the Earth in miles
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}