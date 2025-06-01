import { collection, query, where, getDocs, getDoc, doc, GeoPoint } from 'firebase/firestore';
import { db } from '../apps/web/lib/firebase';
import { Clinic } from '../apps/web/types';
import { calculateDistance } from '../apps/web/lib/api/clinicService';

interface ImportEnhancerOptions {
  mergeWithExisting?: boolean;
  checkForDuplicates?: boolean;
  backfillMissingData?: boolean;
  overwriteFields?: string[];
  preserveFields?: string[];
  importSource?: string;
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedClinic?: Clinic;
  matchReason?: string;
  matchConfidence?: number;
}

/**
 * Check if a clinic already exists in the database
 * Uses multiple criteria: exact match on name+zip, address similarity, geo proximity
 */
export async function checkForDuplicates(
  clinicData: Partial<Clinic>
): Promise<DuplicateCheckResult> {
  // We need at minimum a name to check for duplicates
  if (!clinicData.name) {
    return { isDuplicate: false };
  }

  try {
    const clinicsRef = collection(db, 'clinics');
    let potentialDuplicates: Clinic[] = [];
    let matchReason = '';
    let matchConfidence = 0;
    
    // Strategy 1: Check for exact name + zip match (high confidence)
    if (clinicData.zip) {
      const nameZipQuery = query(
        clinicsRef,
        where('name', '==', clinicData.name),
        where('zip', '==', clinicData.zip)
      );
      
      const nameZipResults = await getDocs(nameZipQuery);
      
      if (!nameZipResults.empty) {
        potentialDuplicates = nameZipResults.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Clinic));
        matchReason = 'Exact match on name and zip code';
        matchConfidence = 0.9; // 90% confidence
      }
    }
    
    // Strategy 2: Check for exact address match (high confidence)
    if (potentialDuplicates.length === 0 && clinicData.address) {
      const addressQuery = query(
        clinicsRef,
        where('address', '==', clinicData.address),
        where('city', '==', clinicData.city || ''),
        where('state', '==', clinicData.state || '')
      );
      
      const addressResults = await getDocs(addressQuery);
      
      if (!addressResults.empty) {
        potentialDuplicates = addressResults.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Clinic));
        matchReason = 'Exact match on address';
        matchConfidence = 0.85; // 85% confidence
      }
    }
    
    // Strategy 3: Check for geo proximity (medium confidence)
    if (potentialDuplicates.length === 0 && clinicData.lat && clinicData.lng) {
      // Fetch clinics in same city/state
      const geoQuery = query(
        clinicsRef,
        where('city', '==', clinicData.city || ''),
        where('state', '==', clinicData.state || '')
      );
      
      const geoResults = await getDocs(geoQuery);
      
      // Check for clinics within 0.5 mile radius
      if (!geoResults.empty) {
        const PROXIMITY_THRESHOLD_MILES = 0.5;
        
        for (const doc of geoResults.docs) {
          const existingClinic = { id: doc.id, ...doc.data() } as Clinic;
          
          if (existingClinic.lat && existingClinic.lng) {
            const distance = calculateDistance(
              clinicData.lat, 
              clinicData.lng, 
              existingClinic.lat, 
              existingClinic.lng
            );
            
            if (distance < PROXIMITY_THRESHOLD_MILES) {
              // Check if names are similar using Levenshtein distance or similar approach
              // For MVP, we'll just check if first 3 words are the same
              const existingWords = existingClinic.name.toLowerCase().split(' ');
              const newWords = clinicData.name.toLowerCase().split(' ');
              let matchingWords = 0;
              
              for (let i = 0; i < Math.min(3, existingWords.length, newWords.length); i++) {
                if (existingWords[i] === newWords[i]) {
                  matchingWords++;
                }
              }
              
              if (matchingWords >= 2) {
                potentialDuplicates = [existingClinic];
                matchReason = `Geo proximity match (${distance.toFixed(2)} miles) with similar name`;
                matchConfidence = 0.7; // 70% confidence
                break;
              }
            }
          }
        }
      }
    }
    
    // Strategy 4: Phone number match (high confidence)
    if (potentialDuplicates.length === 0 && clinicData.phone) {
      // Normalize phone for comparison (remove non-digits)
      const normalizedPhone = clinicData.phone.replace(/\D/g, '');
      
      if (normalizedPhone.length >= 10) {
        const phoneQuery = query(
          clinicsRef,
          where('phone', '==', clinicData.phone)
        );
        
        const phoneResults = await getDocs(phoneQuery);
        
        if (!phoneResults.empty) {
          potentialDuplicates = phoneResults.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          } as Clinic));
          matchReason = 'Exact match on phone number';
          matchConfidence = 0.8; // 80% confidence
        }
      }
    }
    
    // Return result
    if (potentialDuplicates.length > 0) {
      return {
        isDuplicate: true,
        matchedClinic: potentialDuplicates[0],
        matchReason,
        matchConfidence
      };
    }
    
    return { isDuplicate: false };
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return { isDuplicate: false };
  }
}

/**
 * Merge new clinic data with existing clinic data
 */
export function mergeWithExistingClinic(
  existingClinic: Clinic, 
  newClinicData: Partial<Clinic>,
  options: ImportEnhancerOptions = {}
): Clinic {
  const {
    overwriteFields = [],
    preserveFields = []
  } = options;
  
  // Start with existing clinic data
  const mergedClinic = { ...existingClinic };
  
  // Process each field in the new data
  for (const [key, value] of Object.entries(newClinicData)) {
    // Skip undefined or null values
    if (value === undefined || value === null) {
      continue;
    }
    
    // Skip fields explicitly marked to preserve
    if (preserveFields.includes(key)) {
      continue;
    }
    
    // Handle special cases
    if (key === 'services' && Array.isArray(value) && Array.isArray(mergedClinic.services)) {
      // Merge services arrays (unique values only)
      mergedClinic.services = [...new Set([...mergedClinic.services, ...value])];
    }
    else if (key === 'tags' && Array.isArray(value) && Array.isArray(mergedClinic.tags)) {
      // Merge tags arrays (unique values only)
      mergedClinic.tags = [...new Set([...mergedClinic.tags, ...value])];
    }
    // Always keep existing tier unless explicitly told to overwrite
    else if (key === 'tier' || key === 'package') {
      if (overwriteFields.includes(key)) {
        mergedClinic[key] = value;
      }
    }
    // Handle nested objects like trafficMeta, seo, etc.
    else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      // If the field exists in the existing clinic and is an object, merge them
      if (mergedClinic[key] && typeof mergedClinic[key] === 'object') {
        mergedClinic[key] = {
          ...mergedClinic[key],
          ...value
        };
      }
      // Otherwise set it directly
      else {
        mergedClinic[key] = value;
      }
    }
    // For other fields, overwrite if explicitly marked or if the existing value is empty
    else if (
      overwriteFields.includes(key) || 
      mergedClinic[key] === undefined || 
      mergedClinic[key] === null || 
      mergedClinic[key] === ''
    ) {
      mergedClinic[key] = value;
    }
  }
  
  return mergedClinic;
}

/**
 * Backfill missing data for a clinic from external sources
 */
export async function backfillMissingData(
  clinic: Partial<Clinic>
): Promise<Partial<Clinic>> {
  // We need at least name and location data to backfill
  if (!clinic.name || !clinic.city || !clinic.state) {
    return clinic;
  }
  
  try {
    const backfilledClinic = { ...clinic };
    
    // If we have a website but are missing services, try to extract them
    if (backfilledClinic.website && (!backfilledClinic.services || backfilledClinic.services.length === 0)) {
      // This would involve fetching the website content and extracting services
      // For MVP, we'll leave this blank to be implemented with more advanced logic
    }
    
    // Backfill missing geo data
    if ((!backfilledClinic.lat || !backfilledClinic.lng) && backfilledClinic.address) {
      // Use the geocodeAddress function from the import script
      // This is a placeholder - in a real implementation, you'd call a geocoding service
      console.log(`Would geocode address: ${backfilledClinic.address}, ${backfilledClinic.city}, ${backfilledClinic.state}`);
    }
    
    // Return the clinic with backfilled data
    return backfilledClinic;
  } catch (error) {
    console.error('Error backfilling clinic data:', error);
    return clinic;
  }
}

/**
 * Process a clinic for import, handling duplicates and data enhancement
 */
export async function processClinicForImport(
  clinicData: Partial<Clinic>,
  options: ImportEnhancerOptions = {}
): Promise<{
  clinic: Partial<Clinic>;
  action: 'create' | 'merge' | 'skip';
  duplicateCheck?: DuplicateCheckResult;
  message?: string;
}> {
  try {
    const {
      mergeWithExisting = true,
      checkForDuplicates: shouldCheckForDuplicates = true,
      backfillMissingData: shouldBackfill = false,
      importSource = 'manual'
    } = options;
    
    // Apply source tracking
    let processedClinic = {
      ...clinicData,
      importSource
    };
    
    // Check for duplicates
    let duplicateResult: DuplicateCheckResult = { isDuplicate: false };
    
    if (shouldCheckForDuplicates) {
      duplicateResult = await checkForDuplicates(processedClinic);
    }
    
    if (duplicateResult.isDuplicate && duplicateResult.matchedClinic) {
      // Handle duplicate
      if (mergeWithExisting) {
        // Merge with existing clinic data
        processedClinic = mergeWithExistingClinic(
          duplicateResult.matchedClinic,
          processedClinic,
          options
        );
        
        return {
          clinic: processedClinic,
          action: 'merge',
          duplicateCheck: duplicateResult,
          message: `Merged with existing clinic: ${duplicateResult.matchReason}`
        };
      } else {
        // Skip if not merging
        return {
          clinic: duplicateResult.matchedClinic,
          action: 'skip',
          duplicateCheck: duplicateResult,
          message: `Skipped duplicate: ${duplicateResult.matchReason}`
        };
      }
    }
    
    // Backfill missing data if requested
    if (shouldBackfill) {
      processedClinic = await backfillMissingData(processedClinic);
    }
    
    // Return clinic ready for creation
    return {
      clinic: processedClinic,
      action: 'create',
      message: 'Ready for creation'
    };
  } catch (error) {
    console.error('Error processing clinic for import:', error);
    return {
      clinic: clinicData,
      action: 'create',
      message: `Error during processing: ${(error as Error).message}`
    };
  }
}

export default {
  checkForDuplicates,
  mergeWithExistingClinic,
  backfillMissingData,
  processClinicForImport
};