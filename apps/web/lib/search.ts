import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs, 
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { Clinic, ClinicFilter, ExtendedClinic } from '../types';
import { calculateDistance } from '../utils/geoUtils';

/**
 * Convert a Firestore document to a Clinic object
 */
function convertDocToClinic(doc: DocumentData): Clinic {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt || null,
    lastUpdated: data.lastUpdated || null,
    trafficMeta: {
      totalClicks: data.trafficMeta?.totalClicks || 0,
      topSearchTerms: data.trafficMeta?.topSearchTerms || [],
      lastViewed: data.trafficMeta?.lastViewed || null}} as Clinic;
}

/**
 * Search for clinics with advanced filtering and sorting
 * 
 * @param filters - Search filters
 * @param pageSize - Number of results per page
 * @param startAfterDoc - Document to start after for pagination
 * @returns Clinics matching the search criteria
 */
export async function searchClinics(
  filters: ClinicFilter = {}, 
  pageSize: number = 20,
  startAfterDoc: DocumentData | null = null
): Promise<{
  clinics: ExtendedClinic[];
  lastDoc: DocumentData | null;
  hasMore: boolean;
}> {
  try {
    const clinicsRef = collection(db, 'clinics');
    const queryConstraints: QueryConstraint[] = [];
    
    // Only include active clinics
    queryConstraints.push(where('status', 'in', ['Active', 'active']));
    
    // Basic filtering
    if (filters.state) {
      queryConstraints.push(where('state', '==', filters.state));
    }
    
    if (filters.city) {
      queryConstraints.push(where('city', '==', filters.city));
    }
    
    // Service filtering (array-contains-any can only take up to 10 values)
    if (filters.services && filters.services.length > 0) {
      const servicesToQuery = filters.services.slice(0, 10);
      queryConstraints.push(where('services', 'array-contains-any', servicesToQuery));
    }
    
    // Tag filtering
    if (filters.tags && filters.tags.length > 0) {
      const tagsToQuery = filters.tags.slice(0, 10);
      queryConstraints.push(where('tags', 'array-contains-any', tagsToQuery));
    }
    
    // Tier filtering
    if (filters.tier) {
      queryConstraints.push(where('tier', '==', filters.tier));
    }
    
    // Verified filtering
    if (filters.verified) {
      queryConstraints.push(where('verified', '==', true));
    }
    
    // Keywords match will be done in-memory after fetching

    // Sort by tier and traffic for basic ordering
    queryConstraints.push(orderBy('tier', 'asc')); // 'advanced' comes before 'standard' alphabetically
    queryConstraints.push(orderBy('trafficMeta.totalClicks', 'desc'));
    
    // Create the query with proper constraints
    let q;
    
    if (startAfterDoc) {
      q = query(
        clinicsRef,
        ...queryConstraints,
        limit(pageSize + 1), // +1 to check if there are more results
        startAfter(startAfterDoc)
      );
    } else {
      q = query(
        clinicsRef,
        ...queryConstraints,
        limit(pageSize + 1) // +1 to check if there are more results
      );
    }
    
    // Execute query
    const querySnapshot = await getDocs(q);
    
    // Process results
    const clinics: Clinic[] = [];
    let lastDoc = null;
    let hasMore = false;
    
    // Check if we have more results than the requested page size
    if (querySnapshot.docs.length > pageSize) {
      hasMore = true;
      querySnapshot.docs.pop(); // Remove the extra document
    }
    
    // Convert documents to Clinic objects
    querySnapshot.docs.forEach((doc) => {
      clinics.push(convertDocToClinic(doc));
      lastDoc = doc;
    });
    
    // Further filtering in memory for complex conditions
    let filteredClinics = clinics;
    
    // Keyword search if specified
    if (filters.searchTerm) {
      const searchTermLower = filters.searchTerm.toLowerCase();
      filteredClinics = filteredClinics.filter(clinic => {
        // Check name
        if (clinic.name.toLowerCase().includes(searchTermLower)) return true;
        
        // Check city/state
        if (clinic.city.toLowerCase().includes(searchTermLower)) return true;
        if (clinic.state.toLowerCase().includes(searchTermLower)) return true;
        
        // Check services
        if (clinic.services?.some(service => 
          service.toLowerCase().includes(searchTermLower)
        )) return true;
        
        // Check pre-processed searchable terms (includes treatments like BPC-157)
        if (clinic.searchableTerms?.some(term => 
          term.includes(searchTermLower)
        )) return true;
        
        // Check keywords
        if (clinic.seo?.keywords?.some(keyword => 
          keyword.toLowerCase().includes(searchTermLower)
        )) return true;
        
        // Check SEO description for matches
        if (clinic.seo?.description?.toLowerCase().includes(searchTermLower)) return true;
        
        // No match
        return false;
      });
    }
    
    // Calculate distance if coordinates are provided
    let clinicsWithDistance: ExtendedClinic[] = filteredClinics;
    
    if (filters.lat !== undefined && filters.lng !== undefined) {
      clinicsWithDistance = filteredClinics.map(clinic => {
        if (clinic.lat && clinic.lng) {
          const distance = calculateDistance(
            filters.lat!,
            filters.lng!,
            clinic.lat,
            clinic.lng
          );
          return { ...clinic, distance };
        }
        return { ...clinic, distance: Number.MAX_VALUE };
      });
      
      // Filter by radius if specified
      if (filters.radius) {
        clinicsWithDistance = clinicsWithDistance.filter(
          clinic => (clinic.distance || 0) <= filters.radius!
        );
      }
    }
    
    // Perform final sorting based on priority: tier > status > distance/relevance
    clinicsWithDistance.sort((a, b) => {
      // Get standardized tier values for sorting
      const tierPriority = {
        'advanced': 0,
        'standard': 1,
        'free': 2,
        // Legacy support
        'high': 0,
        'premium': 0,
        'low': 1,
        'basic': 1
      };
      
      // Get tier priority (defaulting to lowest priority if not found)
      const getTierValue = (clinic: Clinic): number => {
        const tierStr = (clinic.tier || '').toLowerCase();
        return tierPriority[tierStr as keyof typeof tierPriority] ?? 2;
      };
      
      const aTier = getTierValue(a);
      const bTier = getTierValue(b);
      
      // First sort by tier
      if (aTier !== bTier) {
        return aTier - bTier;
      }
      
      // Then sort by verified status
      if (a.verified !== b.verified) {
        return a.verified ? -1 : 1;
      }
      
      // Then sort by distance if available
      if (a.distance !== undefined && b.distance !== undefined) {
        return (a.distance || 0) - (b.distance || 0);
      }
      
      // Fallback to traffic for same tier/status
      const aTraffic = a.trafficMeta?.totalClicks || 0;
      const bTraffic = b.trafficMeta?.totalClicks || 0;
      return bTraffic - aTraffic;
    });
    
    return { 
      clinics: clinicsWithDistance, 
      lastDoc, 
      hasMore 
    };
  } catch (error) {
    console.error('Error searching clinics:', error);
    throw error;
  }
}

/**
 * Get search suggestions based on user input
 * 
 * @param query - The user's search query
 * @param limit - Maximum number of suggestions
 * @returns Categorized suggestions
 */
export async function getSearchSuggestions(
  searchQuery: string,
  maxResults: number = 5
): Promise<{
  clinics: { id: string; name: string; city: string; state: string }[];
  services: string[];
  locations: { city: string; state: string }[];
}> {
  if (!searchQuery || searchQuery.length < 2) {
    return { clinics: [], services: [], locations: [] };
  }
  
  try {
    const queryLower = searchQuery.toLowerCase();
    const clinicsRef = collection(db, 'clinics');
    
    // Query for clinics by name
    const nameQuery = query(
      clinicsRef,
      where('status', 'in', ['Active', 'active']),
      orderBy('name'),
      limit(maxResults)
    );
    
    const nameResults = await getDocs(nameQuery);
    
    // Find clinics with matching names
    const clinics = nameResults.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          city: data.city,
          state: data.state
        };
      })
      .filter(clinic => clinic.name.toLowerCase().includes(queryLower));
    
    // Find unique services that match the query
    const servicesSet = new Set<string>();
    
    // Common services to suggest
    const commonServices = [
      'TRT', 'ED Treatment', 'Hair Loss', 'Weight Loss',
      'Peptide Therapy', 'Hormone Therapy', 'IV Therapy',
      'Testosterone Replacement', 'Men\'s Health'
    ];
    
    // Filter common services by query
    const matchingServices = commonServices
      .filter(service => service.toLowerCase().includes(queryLower))
      .slice(0, maxResults);
    
    matchingServices.forEach(service => servicesSet.add(service));
    
    // Find locations (city, state) that match the query
    const locationsSet = new Set<string>();
    const locations: { city: string; state: string }[] = [];
    
    // Query for locations by city or state
    const locationQuery = query(
      clinicsRef,
      where('status', 'in', ['Active', 'active']),
      limit(50) // Get a larger sample to find matching locations
    );
    
    const locationResults = await getDocs(locationQuery);
    
    locationResults.docs.forEach(doc => {
      const data = doc.data();
      const city = data.city;
      const state = data.state;
      
      // Check if city or state matches query
      if (
        city.toLowerCase().includes(queryLower) || 
        state.toLowerCase().includes(queryLower)
      ) {
        const locationKey = `${city}, ${state}`;
        
        // Add if not already in the set
        if (!locationsSet.has(locationKey)) {
          locationsSet.add(locationKey);
          locations.push({ city, state });
        }
      }
    });
    
    // Limit the number of location suggestions
    const limitedLocations = locations.slice(0, maxResults);
    
    return {
      clinics,
      services: Array.from(servicesSet),
      locations: limitedLocations
    };
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return { clinics: [], services: [], locations: [] };
  }
}

/**
 * Get nearby clinics based on coordinates
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @param radiusMiles - Search radius in miles
 * @param maxResults - Maximum number of results
 * @param filters - Additional filters
 * @returns Nearby clinics sorted by distance
 */
export async function getNearbyClinics(
  lat: number,
  lng: number,
  radiusMiles: number = 50,
  maxResults: number = 10,
  filters: Partial<ClinicFilter> = {}
): Promise<ExtendedClinic[]> {
  try {
    const clinicsRef = collection(db, 'clinics');
    
    // Build query constraints
    const queryConstraints: QueryConstraint[] = [
      where('status', 'in', ['Active', 'active']),
      where('lat', '!=', null),
      where('lng', '!=', null)
    ];
    
    // Add tier filter if specified
    if (filters.tier) {
      queryConstraints.push(where('tier', '==', filters.tier));
    }
    
    // Add service filter if specified
    if (filters.services && filters.services.length > 0) {
      queryConstraints.push(where('services', 'array-contains-any', filters.services));
    }
    
    // Create and execute query
    const q = query(clinicsRef, ...queryConstraints, limit(1000));
    const querySnapshot = await getDocs(q);
    
    // Calculate distances and filter
    const clinicsWithDistance: ExtendedClinic[] = [];
    
    querySnapshot.forEach(doc => {
      const clinic = convertDocToClinic(doc);
      
      if (clinic.lat && clinic.lng) {
        const distance = calculateDistance(lat, lng, clinic.lat, clinic.lng);
        
        if (distance <= radiusMiles) {
          clinicsWithDistance.push({ ...clinic, distance });
        }
      }
    });
    
    // Sort by tier then distance
    clinicsWithDistance.sort((a, b) => {
      // First by tier priority
      const tierPriority = {
        'advanced': 0, 'high': 0, 'premium': 0,
        'standard': 1, 'low': 1, 'basic': 1,
        'free': 2
      };
      
      const aTier = a.tier ? tierPriority[a.tier.toLowerCase() as keyof typeof tierPriority] || 2 : 2;
      const bTier = b.tier ? tierPriority[b.tier.toLowerCase() as keyof typeof tierPriority] || 2 : 2;
      
      if (aTier !== bTier) {
        return aTier - bTier;
      }
      
      // Then by distance
      return (a.distance || 0) - (b.distance || 0);
    });
    
    return clinicsWithDistance.slice(0, maxResults);
  } catch (error) {
    console.error('Error getting nearby clinics:', error);
    throw error;
  }
}