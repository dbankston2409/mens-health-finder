import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs, 
  getDoc, 
  doc, 
  runTransaction,
  Timestamp,
  GeoPoint,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';

// Clinic interface matches our Firestore schema
export interface Clinic {
  id?: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  website: string;
  services: string[];
  package: string;
  status: string;
  tags: string[];
  importSource: string;
  createdAt: Timestamp;
  lastUpdated: Timestamp;
  trafficMeta: {
    totalClicks: number;
    topSearchTerms: string[];
    lastViewed: Timestamp | null;
  };
  validationStatus: {
    verified: boolean;
    method: string;
    websiteOK: boolean;
  };
  seoMeta?: {
    title?: string;
    description?: string;
    keywords?: string[];
    indexed?: boolean;
    lastIndexed?: Date | Timestamp;
  };
}

// Search filters for the clinics
export interface ClinicFilter {
  city?: string;
  state?: string;
  services?: string[];
  searchTerm?: string;
  tags?: string[];
  status?: string;
  package?: string;
}

interface ClinicQueryResult {
  clinics: Clinic[];
  lastDoc: DocumentData | null;
  hasMore: boolean;
}

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
      lastViewed: data.trafficMeta?.lastViewed || null,
    },
  } as Clinic;
}

/**
 * Get a clinic by its slug
 * 
 * @param slug - The clinic's SEO-friendly slug
 * @returns - The clinic data or null if not found
 */
export async function getClinicBySlug(slug: string): Promise<Clinic | null> {
  try {
    const clinicsRef = collection(db, 'clinics');
    const q = query(clinicsRef, where('slug', '==', slug), limit(1));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return convertDocToClinic(querySnapshot.docs[0]);
  } catch (error) {
    console.error('Error fetching clinic by slug:', error);
    throw error;
  }
}

/**
 * Get a clinic by its ID
 * 
 * @param id - The clinic's document ID
 * @returns - The clinic data or null if not found
 */
export async function getClinicById(id: string): Promise<Clinic | null> {
  try {
    const docRef = doc(db, 'clinics', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return convertDocToClinic(docSnap);
  } catch (error) {
    console.error('Error fetching clinic by ID:', error);
    throw error;
  }
}

/**
 * Query clinics with filtering and pagination
 * 
 * @param filters - Optional filters for the query
 * @param pageSize - Number of clinics per page
 * @param startAfterDoc - Document to start after for pagination
 * @returns - Query results with clinics and pagination info
 */
export async function queryClinics(
  filters: ClinicFilter = {}, 
  pageSize: number = 20,
  startAfterDoc: DocumentData | null = null
): Promise<ClinicQueryResult> {
  try {
    const clinicsRef = collection(db, 'clinics');
    
    // Start building the query
    let queryConstraints: any[] = [];
    
    // Add filters
    if (filters.state) {
      queryConstraints.push(where('state', '==', filters.state));
    }
    
    if (filters.city) {
      queryConstraints.push(where('city', '==', filters.city));
    }
    
    // For services, we need to use array-contains-any, which only allows up to 10 values
    if (filters.services && filters.services.length > 0) {
      // Take just the first 10 services if there are more
      const servicesToQuery = filters.services.slice(0, 10);
      queryConstraints.push(where('services', 'array-contains-any', servicesToQuery));
    }
    
    // For status filters
    if (filters.status) {
      queryConstraints.push(where('status', '==', filters.status));
    }
    
    // For package filters
    if (filters.package) {
      queryConstraints.push(where('package', '==', filters.package));
    }
    
    // For tags, similar to services, we need array-contains-any
    if (filters.tags && filters.tags.length > 0) {
      // Take just the first 10 tags if there are more
      const tagsToQuery = filters.tags.slice(0, 10);
      queryConstraints.push(where('tags', 'array-contains-any', tagsToQuery));
    }
    
    // Add sorting - typically by popularity (totalClicks) or date added
    queryConstraints.push(orderBy('trafficMeta.totalClicks', 'desc'));
    
    // Add limit for pagination
    queryConstraints.push(limit(pageSize + 1)); // +1 to check if there are more results
    
    // If we have a startAfter document for pagination, add it
    if (startAfterDoc) {
      queryConstraints.push(startAfter(startAfterDoc));
    }
    
    // Create and execute the query
    const q = query(clinicsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    // Process results
    const clinics: Clinic[] = [];
    let lastDoc = null;
    let hasMore = false;
    
    // If we got more results than pageSize, there are more pages
    if (querySnapshot.docs.length > pageSize) {
      hasMore = true;
      // Remove the extra document we used to check for more
      querySnapshot.docs.pop();
    }
    
    // Convert documents to Clinic objects
    querySnapshot.docs.forEach((doc) => {
      clinics.push(convertDocToClinic(doc));
      // Track the last document for pagination
      lastDoc = doc;
    });
    
    return { clinics, lastDoc, hasMore };
  } catch (error) {
    console.error('Error querying clinics:', error);
    throw error;
  }
}

/**
 * Search clinics by text query
 * 
 * Note: This is a simplified search. In a production app, you might use
 * Algolia, Elasticsearch, or Firebase's extended search capabilities.
 * 
 * @param searchTerm - Text to search for
 * @param pageSize - Number of results per page
 * @returns - Clinics matching the search term
 */
export async function searchClinics(
  searchTerm: string,
  pageSize: number = 20
): Promise<Clinic[]> {
  try {
    // This is a simplified implementation that searches just the name field
    // A real implementation would use a proper search service
    
    const clinicsRef = collection(db, 'clinics');
    
    // Firebase doesn't support full-text search directly
    // Here we're just doing a startsWith query on the name
    // For real apps, consider using Algolia, Elasticsearch, or other search solutions
    const q = query(
      clinicsRef,
      orderBy('name'),
      // where('name', '>=', searchTerm),
      // where('name', '<=', searchTerm + '\uf8ff'),
      limit(pageSize)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filter results in memory - not ideal but works for demo purposes
    // In production, use a proper search index
    const results: Clinic[] = [];
    querySnapshot.docs.forEach((doc) => {
      const clinic = convertDocToClinic(doc);
      
      // Simple search logic - check if name, city, or services include the search term
      const searchLower = searchTerm.toLowerCase();
      
      const nameMatch = clinic.name.toLowerCase().includes(searchLower);
      const cityMatch = clinic.city.toLowerCase().includes(searchLower);
      const stateMatch = clinic.state.toLowerCase().includes(searchLower);
      const serviceMatch = clinic.services.some(
        service => service.toLowerCase().includes(searchLower)
      );
      
      if (nameMatch || cityMatch || stateMatch || serviceMatch) {
        results.push(clinic);
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error searching clinics:', error);
    throw error;
  }
}

/**
 * Log a clinic traffic event
 * 
 * @param searchQuery - What the user searched for
 * @param clinicSlug - The slug of the clinic being viewed
 * @param userRegion - Optional region of the user
 * @returns - Result of the logging operation
 */
export async function logClinicTraffic(
  searchQuery: string,
  clinicSlug: string,
  userRegion: string = ''
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, find the clinic by slug
    const clinicsRef = collection(db, 'clinics');
    const q = query(clinicsRef, where('slug', '==', clinicSlug), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Clinic not found' };
    }
    
    const clinicDoc = querySnapshot.docs[0];
    const clinicId = clinicDoc.id;
    
    // Create traffic log entry
    const trafficLog = {
      clinicId,
      searchQuery: searchQuery || '',
      resultingPage: clinicSlug,
      timestamp: Timestamp.now(),
      userRegion: userRegion || '',
    };
    
    // Use a transaction to update both the clinic and create a log entry
    await runTransaction(db, async (transaction) => {
      // Get fresh clinic data
      const clinicRef = doc(db, 'clinics', clinicId);
      const clinicSnapshot = await transaction.get(clinicRef);
      
      if (!clinicSnapshot.exists()) {
        throw new Error('Clinic no longer exists');
      }
      
      const clinicData = clinicSnapshot.data();
      
      // Update the clinic's traffic metadata
      const topSearchTerms = clinicData.trafficMeta?.topSearchTerms || [];
      
      // Only add the search term if it's not already in the list and isn't empty
      if (searchQuery && !topSearchTerms.includes(searchQuery)) {
        // Keep only the top 20 search terms (remove oldest if needed)
        if (topSearchTerms.length >= 20) {
          topSearchTerms.shift(); // Remove oldest search term
        }
        topSearchTerms.push(searchQuery);
      }
      
      // Update the clinic document
      transaction.update(clinicRef, {
        'trafficMeta.totalClicks': (clinicData.trafficMeta?.totalClicks || 0) + 1,
        'trafficMeta.topSearchTerms': topSearchTerms,
        'trafficMeta.lastViewed': Timestamp.now(),
        'lastUpdated': Timestamp.now()
      });
      
      // Create a traffic log entry
      const trafficLogRef = doc(collection(db, 'traffic_logs'));
      transaction.set(trafficLogRef, trafficLog);
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error logging clinic traffic:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get clinics near a geographic location
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @param radiusMiles - Search radius in miles
 * @param limit - Maximum number of results
 * @returns - Nearby clinics
 */
export async function getNearbyClinics(
  lat: number,
  lng: number,
  radiusMiles: number = 50,
  maxResults: number = 10
): Promise<Clinic[]> {
  try {
    // Note: Firestore doesn't have native geospatial queries for web
    // For a production app, consider using Firebase Extensions like "Algolia Search"
    // or implement a more sophisticated solution with Firestore's GeoPoint
    
    // For this simplified version, we'll fetch all clinics with lat/lng
    // and filter them in memory
    
    const clinicsRef = collection(db, 'clinics');
    const q = query(
      clinicsRef,
      where('lat', '!=', null),
      where('lng', '!=', null),
      limit(1000) // Fetch a large batch to filter from
    );
    
    const querySnapshot = await getDocs(q);
    
    // Calculate distances and filter
    const clinicsWithDistance: { clinic: Clinic; distance: number }[] = [];
    
    querySnapshot.forEach((doc) => {
      const clinic = convertDocToClinic(doc);
      
      if (clinic.lat && clinic.lng) {
        const distance = calculateDistance(
          lat, lng, clinic.lat, clinic.lng
        );
        
        if (distance <= radiusMiles) {
          clinicsWithDistance.push({ clinic, distance });
        }
      }
    });
    
    // Sort by distance and limit results
    clinicsWithDistance.sort((a, b) => a.distance - b.distance);
    
    return clinicsWithDistance
      .slice(0, maxResults)
      .map(item => item.clinic);
  } catch (error) {
    console.error('Error getting nearby clinics:', error);
    throw error;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * 
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns - Distance in miles
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