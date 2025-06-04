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
  QueryConstraint,
  documentId
} from 'firebase/firestore';
import { Clinic, ClinicFilter, ExtendedClinic } from '../types';
import { calculateDistance } from '../utils/geoUtils';

/**
 * Optimized search using Firestore's array-contains for searchableTerms
 * This enables fast searches for treatments like "BPC-157" without client-side filtering
 */

interface SearchResult {
  clinics: ExtendedClinic[];
  lastDoc: DocumentData | null;
  hasMore: boolean;
  totalMatches?: number;
}

/**
 * Convert Firestore document to Clinic with proper type handling
 */
function docToClinic(doc: DocumentData): Clinic {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    // Ensure proper date conversion
    createdAt: data.createdAt || null,
    lastUpdated: data.lastUpdated || null,
    updatedAt: data.updatedAt || null,
    // Ensure arrays exist
    services: data.services || [],
    searchableTerms: data.searchableTerms || [],
    treatments: data.treatments || [],
    tags: data.tags || [],
    // Traffic metadata
    trafficMeta: {
      totalClicks: data.trafficMeta?.totalClicks || 0,
      topSearchTerms: data.trafficMeta?.topSearchTerms || [],
      lastViewed: data.trafficMeta?.lastViewed || null
    }
  } as Clinic;
}

/**
 * Normalize search term for better matching
 */
function normalizeSearchTerm(term: string): string[] {
  const normalized = term.toLowerCase().trim();
  const variants: string[] = [normalized];
  
  // Add variant without hyphens (e.g., "bpc-157" -> "bpc157")
  if (normalized.includes('-')) {
    variants.push(normalized.replace(/-/g, ''));
  }
  
  // Add variant with hyphens (e.g., "bpc157" -> "bpc-157")
  if (/[a-z]+\d+/.test(normalized)) {
    const withHyphen = normalized.replace(/([a-z]+)(\d+)/, '$1-$2');
    if (withHyphen !== normalized) {
      variants.push(withHyphen);
    }
  }
  
  return variants;
}

/**
 * Enhanced search with treatment term matching
 */
export async function searchClinicsOptimized(
  filters: ClinicFilter = {},
  pageSize: number = 20,
  startAfterDoc: DocumentData | null = null
): Promise<SearchResult> {
  try {
    const clinicsRef = collection(db, 'clinics');
    const constraints: QueryConstraint[] = [];
    
    // Always filter for active clinics
    constraints.push(where('status', 'in', ['Active', 'active']));
    
    // Location filters
    if (filters.state) {
      constraints.push(where('state', '==', filters.state));
    }
    if (filters.city) {
      constraints.push(where('city', '==', filters.city));
    }
    
    // Service filter
    if (filters.services && filters.services.length > 0) {
      constraints.push(where('services', 'array-contains-any', filters.services.slice(0, 10)));
    }
    
    // Tier filter
    if (filters.tier) {
      constraints.push(where('tier', '==', filters.tier));
    }
    
    // Treatment/keyword search using searchableTerms
    if (filters.searchTerm) {
      const searchVariants = normalizeSearchTerm(filters.searchTerm);
      
      // Use array-contains for single term search (most efficient)
      if (searchVariants.length === 1) {
        constraints.push(where('searchableTerms', 'array-contains', searchVariants[0]));
      } else {
        // For multiple variants, we'll need to do separate queries and merge
        // For now, use the primary variant
        constraints.push(where('searchableTerms', 'array-contains', searchVariants[0]));
      }
    }
    
    // Sorting
    constraints.push(orderBy('tier', 'asc')); // advanced < standard < free
    constraints.push(orderBy('trafficMeta.totalClicks', 'desc'));
    
    // Pagination
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }
    constraints.push(limit(pageSize + 1)); // +1 to check hasMore
    
    // Execute query
    const q = query(clinicsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    // Process results
    const clinics: Clinic[] = [];
    let lastDoc: DocumentData | null = null;
    let hasMore = false;
    
    if (snapshot.docs.length > pageSize) {
      hasMore = true;
      snapshot.docs.pop(); // Remove the extra doc
    }
    
    snapshot.docs.forEach(doc => {
      clinics.push(docToClinic(doc));
      lastDoc = doc;
    });
    
    // Additional filtering if needed (for complex conditions)
    let filteredClinics = clinics;
    
    // If we have multiple search variants, check them client-side
    if (filters.searchTerm && normalizeSearchTerm(filters.searchTerm).length > 1) {
      const searchVariants = normalizeSearchTerm(filters.searchTerm);
      filteredClinics = clinics.filter(clinic => {
        // Check if any variant matches
        return searchVariants.some(variant => 
          clinic.searchableTerms?.includes(variant) ||
          clinic.name.toLowerCase().includes(variant) ||
          clinic.services?.some(s => s.toLowerCase().includes(variant))
        );
      });
    }
    
    // Calculate distances if coordinates provided
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
      
      // Filter by radius
      if (filters.radius) {
        clinicsWithDistance = clinicsWithDistance.filter(
          clinic => (clinic.distance || 0) <= filters.radius!
        );
      }
      
      // Re-sort by distance within tier groups
      clinicsWithDistance.sort((a, b) => {
        const tierOrder = { 'advanced': 0, 'standard': 1, 'free': 2 };
        const aTier = tierOrder[a.tier as keyof typeof tierOrder] ?? 2;
        const bTier = tierOrder[b.tier as keyof typeof tierOrder] ?? 2;
        
        if (aTier !== bTier) return aTier - bTier;
        
        // Within same tier, sort by distance
        return (a.distance || 0) - (b.distance || 0);
      });
    }
    
    return {
      clinics: clinicsWithDistance,
      lastDoc,
      hasMore,
      totalMatches: clinicsWithDistance.length
    };
    
  } catch (error) {
    console.error('Optimized search error:', error);
    throw error;
  }
}

/**
 * Get treatment suggestions based on partial input
 */
export async function getTreatmentSuggestions(
  partial: string,
  maxResults: number = 10
): Promise<string[]> {
  if (!partial || partial.length < 2) return [];
  
  try {
    const normalized = partial.toLowerCase();
    
    // Common treatments database (this could be fetched from Firestore)
    const commonTreatments = [
      'bpc-157', 'tb-500', 'cjc-1295', 'ipamorelin', 'sermorelin',
      'mk-677', 'ghrp-2', 'ghrp-6', 'semaglutide', 'ozempic',
      'wegovy', 'tirzepatide', 'mounjaro', 'testosterone', 'hcg',
      'cialis', 'viagra', 'sildenafil', 'tadalafil', 'finasteride',
      'nad+', 'glutathione', 'b12', 'vitamin d', 'prp',
      'stem cell', 'exosome', 'shockwave', 'gainswave', 'p-shot'
    ];
    
    // Filter and sort by relevance
    const matches = commonTreatments
      .filter(treatment => treatment.includes(normalized))
      .sort((a, b) => {
        // Prioritize starts-with matches
        const aStartsWith = a.startsWith(normalized);
        const bStartsWith = b.startsWith(normalized);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        // Then sort by length (shorter = more relevant)
        return a.length - b.length;
      })
      .slice(0, maxResults);
    
    return matches;
    
  } catch (error) {
    console.error('Error getting treatment suggestions:', error);
    return [];
  }
}

/**
 * Batch search for multiple treatment terms
 */
export async function searchByTreatments(
  treatments: string[],
  location?: { city?: string; state?: string; lat?: number; lng?: number },
  pageSize: number = 50
): Promise<ExtendedClinic[]> {
  try {
    const allResults = new Map<string, ExtendedClinic>();
    
    // Search for each treatment
    for (const treatment of treatments.slice(0, 5)) { // Limit to 5 treatments
      const filters: ClinicFilter = {
        searchTerm: treatment,
        ...location
      };
      
      const results = await searchClinicsOptimized(filters, pageSize);
      
      // Merge results, avoiding duplicates
      results.clinics.forEach(clinic => {
        if (!allResults.has(clinic.id!)) {
          allResults.set(clinic.id!, clinic);
        }
      });
    }
    
    // Convert to array and sort
    const clinics = Array.from(allResults.values());
    
    // Sort by tier and relevance
    clinics.sort((a, b) => {
      const tierOrder = { 'advanced': 0, 'standard': 1, 'free': 2 };
      const aTier = tierOrder[a.tier as keyof typeof tierOrder] ?? 2;
      const bTier = tierOrder[b.tier as keyof typeof tierOrder] ?? 2;
      
      if (aTier !== bTier) return aTier - bTier;
      
      // Count matching treatments
      const aMatches = treatments.filter(t => 
        a.searchableTerms?.some(term => term.includes(t.toLowerCase()))
      ).length;
      const bMatches = treatments.filter(t => 
        b.searchableTerms?.some(term => term.includes(t.toLowerCase()))
      ).length;
      
      return bMatches - aMatches;
    });
    
    return clinics;
    
  } catch (error) {
    console.error('Error searching by treatments:', error);
    throw error;
  }
}

/**
 * Create search index for a clinic (used during import/update)
 */
export function createSearchableTerms(clinic: Partial<Clinic>): string[] {
  const terms = new Set<string>();
  
  // Add clinic name parts
  if (clinic.name) {
    const nameParts = clinic.name.toLowerCase().split(/\s+/);
    nameParts.forEach(part => {
      if (part.length > 2) terms.add(part);
    });
  }
  
  // Add services
  clinic.services?.forEach(service => {
    terms.add(service.toLowerCase());
    // Add individual words from services
    service.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) terms.add(word);
    });
  });
  
  // Add treatments if they exist
  clinic.treatments?.forEach(treatment => {
    const normalized = treatment.term.toLowerCase();
    terms.add(normalized);
    // Add variant without hyphens
    if (normalized.includes('-')) {
      terms.add(normalized.replace(/-/g, ''));
    }
  });
  
  // Add location
  if (clinic.city) terms.add(clinic.city.toLowerCase());
  if (clinic.state) terms.add(clinic.state.toLowerCase());
  
  // Add specializations
  clinic.specializedServices && Object.entries(clinic.specializedServices).forEach(([key, value]) => {
    if (value) terms.add(key.toLowerCase());
  });
  
  return Array.from(terms);
}