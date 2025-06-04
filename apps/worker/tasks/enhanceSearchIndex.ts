import * as admin from 'firebase-admin';
import { Clinic } from '../types/clinic';

// Initialize Firebase admin if not already initialized
let app: admin.app.App;
try {
  app = admin.app();
} catch (error) {
  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')})});
}

const db = admin.firestore();

// Common aliases and synonyms for men's health services
const SERVICE_SYNONYMS: Record<string, string[]> = {
  'TRT': ['testosterone replacement therapy', 'testosterone therapy', 'low t', 'low testosterone', 'hormone therapy', 'testosterone treatment'],
  'ED Treatment': ['erectile dysfunction', 'impotence', 'ed therapy', 'ed medication', 'sexual health', 'performance issues', 'sexual dysfunction'],
  'Hair Loss': ['hair restoration', 'hair regrowth', 'balding', 'male pattern baldness', 'receding hairline', 'thinning hair', 'alopecia'],
  'Weight Loss': ['weight management', 'obesity treatment', 'body composition', 'fat reduction', 'medical weight loss', 'diet program'],
  'Peptide Therapy': ['peptides', 'growth hormone', 'anti-aging peptides', 'healing peptides', 'recovery peptides', 'performance peptides'],
  'IV Therapy': ['iv drip', 'vitamin drip', 'iv nutrients', 'iv hydration', 'vitamin infusion', 'iv vitamins'],
  'PRP': ['prp therapy', 'platelet rich plasma', 'penis shot', 'p-shot', 'prp injections'],
  'Hormone Optimization': ['hormone balancing', 'hormone restoration', 'hormone replacement', 'bhrt', 'hrt', 'hormone therapy']};

// Local area terms that people might search for
const LOCAL_AREA_TERMS = [
  'near me',
  'nearby',
  'closest',
  'local',
  'in my area',
  'around me'];

/**
 * Generate an array of derived keywords for a clinic
 * 
 * @param clinic - Clinic data
 * @returns Array of keywords
 */
function generateDerivedKeywords(clinic: Clinic): string[] {
  const keywords: Set<string> = new Set();
  
  // Add clinic name (whole and parts)
  if (clinic.name) {
    const name = clinic.name.toLowerCase();
    keywords.add(name);
    
    // Add individual words from name
    name.split(/\s+/).forEach(word => {
      if (word.length > 2) { // Skip very short words
        keywords.add(word);
      }
    });
    
    // Add common variations of "clinic", "center", etc.
    if (name.includes('clinic')) {
      keywords.add(name.replace('clinic', 'center'));
      keywords.add(name.replace('clinic', 'doctor'));
      keywords.add(name.replace('clinic', 'specialist'));
    } else if (name.includes('center')) {
      keywords.add(name.replace('center', 'clinic'));
      keywords.add(name.replace('center', 'doctor'));
      keywords.add(name.replace('center', 'specialist'));
    }
  }
  
  // Add location-based keywords
  if (clinic.city && clinic.state) {
    const city = clinic.city.toLowerCase();
    const state = clinic.state.toLowerCase();
    
    keywords.add(`${city} ${state}`);
    keywords.add(`${city}, ${state}`);
    keywords.add(`${state} ${city}`);
    
    // Add city name
    keywords.add(city);
    
    // Add combinations with common searches
    keywords.add(`men's health ${city}`);
    keywords.add(`mens health ${city}`);
    keywords.add(`testosterone ${city}`);
    keywords.add(`trt ${city}`);
    keywords.add(`ed treatment ${city}`);
    keywords.add(`erectile dysfunction ${city}`);
    
    // Add local area terms with city
    LOCAL_AREA_TERMS.forEach(term => {
      keywords.add(`men's health ${term} ${city}`);
      keywords.add(`testosterone ${term} ${city}`);
      keywords.add(`trt ${term} ${city}`);
      keywords.add(`ed treatment ${term} ${city}`);
    });
  }
  
  // Add service-based keywords with synonyms
  if (clinic.services && clinic.services.length > 0) {
    clinic.services.forEach(service => {
      const serviceKey = service.trim();
      keywords.add(serviceKey.toLowerCase());
      
      // Add location-based service terms
      if (clinic.city) {
        keywords.add(`${serviceKey.toLowerCase()} ${clinic.city.toLowerCase()}`);
        keywords.add(`${serviceKey.toLowerCase()} in ${clinic.city.toLowerCase()}`);
        keywords.add(`${clinic.city.toLowerCase()} ${serviceKey.toLowerCase()}`);
      }
      
      // Add synonyms for this service
      const synonyms = SERVICE_SYNONYMS[serviceKey] || [];
      synonyms.forEach(synonym => {
        keywords.add(synonym);
        
        // Also add location-based synonym terms
        if (clinic.city) {
          keywords.add(`${synonym} ${clinic.city.toLowerCase()}`);
          keywords.add(`${synonym} in ${clinic.city.toLowerCase()}`);
        }
      });
    });
  }
  
  // Add "near me" and other local search terms
  LOCAL_AREA_TERMS.forEach(term => {
    keywords.add(`men's health ${term}`);
    keywords.add(`mens health ${term}`);
    keywords.add(`testosterone ${term}`);
    keywords.add(`trt ${term}`);
    keywords.add(`ed treatment ${term}`);
  });
  
  // Return unique keywords, sorted alphabetically
  return Array.from(keywords).sort();
}

/**
 * Process a single clinic to enhance its search index
 * 
 * @param clinicId - Clinic document ID
 * @param clinicData - Clinic data
 * @returns Result of the operation
 */
async function processClinic(clinicId: string, clinicData: Clinic): Promise<{
  success: boolean;
  keywordsCount?: number;
  error?: string;
}> {
  try {
    // Generate derived keywords
    const derivedKeywords = generateDerivedKeywords(clinicData);
    
    // Update the clinic document with derived keywords
    await db.collection('clinics').doc(clinicId).update({
      derivedKeywords,
      lastIndexed: admin.firestore.FieldValue.serverTimestamp()});
    
    return {
      success: true,
      keywordsCount: derivedKeywords.length};
  } catch (error) {
    console.error(`Error enhancing search index for clinic ${clinicId}:`, error);
    return {
      success: false,
      error: (error as Error).message};
  }
}

/**
 * Process all clinics to enhance their search indices
 */
export async function enhanceAllClinicsSearchIndex(): Promise<{
  total: number;
  success: number;
  failed: number;
  errors: any[];
}> {
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [] as any[]};
  
  try {
    console.log('🔍 Starting search index enhancement for all clinics...');
    
    // Get all active clinics
    const clinicsSnapshot = await db.collection('clinics')
      .where('status', '==', 'active')
      .get();
    
    results.total = clinicsSnapshot.size;
    console.log(`Found ${results.total} active clinics to process`);
    
    // Process each clinic
    for (const doc of clinicsSnapshot.docs) {
      const clinicData = doc.data() as Clinic;
      const result = await processClinic(doc.id, clinicData);
      
      if (result.success) {
        results.success++;
        console.log(`✅ Enhanced search index for ${clinicData.name}: ${result.keywordsCount} keywords`);
      } else {
        results.failed++;
        results.errors.push({
          clinicId: doc.id,
          clinicName: clinicData.name,
          error: result.error});
        console.error(`❌ Failed to enhance search index for ${clinicData.name}: ${result.error}`);
      }
    }
    
    console.log(`
    🏁 Search index enhancement complete:
    Total clinics: ${results.total}
    Successfully enhanced: ${results.success}
    Failed: ${results.failed}
    `);
    
    return results;
  } catch (error) {
    console.error('Error enhancing search indices:', error);
    throw error;
  }
}

/**
 * Main function to run the task
 */
export async function enhanceSearchIndex(): Promise<void> {
  try {
    // Check for specific clinic ID from command line args
    const clinicId = process.argv[3];
    
    if (clinicId) {
      // Process a single clinic
      console.log(`Processing single clinic: ${clinicId}`);
      const docRef = db.collection('clinics').doc(clinicId);
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        console.error(`❌ Clinic with ID ${clinicId} not found`);
        process.exit(1);
      }
      
      const result = await processClinic(clinicId, docSnap.data() as Clinic);
      
      if (result.success) {
        console.log(`✅ Successfully enhanced search index with ${result.keywordsCount} keywords`);
        process.exit(0);
      } else {
        console.error(`❌ Failed to enhance search index: ${result.error}`);
        process.exit(1);
      }
    } else {
      // Process all clinics
      await enhanceAllClinicsSearchIndex();
      process.exit(0);
    }
  } catch (error) {
    console.error('Error running enhanceSearchIndex task:', error);
    process.exit(1);
  }
}

// Run the task if called directly
if (require.main === module) {
  enhanceSearchIndex();
}