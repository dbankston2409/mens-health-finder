import admin from '../../../packages/firebase/init';
import { ClinicDocument, SeoMeta } from '../types/clinic';

export async function insertOrUpdateClinic(
  clinicData: Omit<ClinicDocument, 'slug'>,
  slug: string,
  seoMeta: SeoMeta,
  seoContent: string
): Promise<{ action: 'inserted' | 'updated'; slug: string }> {
  
  const db = admin.firestore();
  const clinicRef = db.collection('clinics').doc(slug);
  
  try {
    // Check if clinic already exists
    const existingDoc = await clinicRef.get();
    const exists = existingDoc.exists;
    
    // Prepare the document data
    const documentData: ClinicDocument = {
      ...clinicData,
      slug,
      seoMeta,
      seoContent,
      updatedAt: new Date()
    };
    
    if (exists) {
      // Update existing clinic
      const existingData = existingDoc.data();
      
      // Merge tags (keep existing tags and add new ones)
      const existingTags = existingData?.tags || [];
      const newTags = documentData.tags || [];
      documentData.tags = [...new Set([...existingTags, ...newTags])];
      
      // Keep original createdAt
      if (existingData?.createdAt) {
        documentData.createdAt = existingData.createdAt;
      }
      
      // Update the document
      await clinicRef.set(documentData, { merge: false }); // Full replace to ensure clean data
      
      console.log(`✅ Updated existing clinic: ${slug}`);
      return { action: 'updated', slug };
      
    } else {
      // Insert new clinic
      await clinicRef.set(documentData);
      
      // Initialize subcollections if needed
      await initializeSubcollections(clinicRef);
      
      console.log(`✅ Inserted new clinic: ${slug}`);
      return { action: 'inserted', slug };
    }
    
  } catch (error) {
    console.error(`❌ Failed to insert/update clinic ${slug}:`, error);
    
    // Retry once after a delay
    try {
      console.log(`🔄 Retrying insert/update for ${slug}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const documentData: ClinicDocument = {
        ...clinicData,
        slug,
        seoMeta,
        seoContent,
        updatedAt: new Date()
      };
      
      await clinicRef.set(documentData);
      console.log(`✅ Retry successful for clinic: ${slug}`);
      return { action: 'inserted', slug };
      
    } catch (retryError) {
      console.error(`❌ Retry failed for clinic ${slug}:`, retryError);
      throw new Error(`Failed to insert/update clinic ${slug} after retry: ${retryError}`);
    }
  }
}

async function initializeSubcollections(clinicRef: FirebaseFirestore.DocumentReference): Promise<void> {
  try {
    // Initialize analytics subcollection with empty document
    await clinicRef.collection('analytics').doc('summary').set({
      views: 0,
      calls: 0,
      websiteClicks: 0,
      lastUpdated: new Date(),
      createdAt: new Date()
    });
    
    // Initialize traffic_logs subcollection placeholder
    await clinicRef.collection('traffic_logs').doc('_placeholder').set({
      note: 'This collection will store traffic analytics',
      createdAt: new Date()
    });
    
  } catch (error) {
    // Don't fail the main operation if subcollection initialization fails
    console.warn('Failed to initialize subcollections:', error);
  }
}

export async function verifyClinicExists(slug: string): Promise<boolean> {
  try {
    const db = admin.firestore();
    const doc = await db.collection('clinics').doc(slug).get();
    return doc.exists;
  } catch (error) {
    console.error('Error verifying clinic existence:', error);
    return false;
  }
}

export async function batchInsertClinics(clinics: ClinicDocument[]): Promise<void> {
  const db = admin.firestore();
  const batch = db.batch();
  
  // Firestore batch limit is 500 operations
  const batchSize = 500;
  
  for (let i = 0; i < clinics.length; i += batchSize) {
    const batchClinics = clinics.slice(i, i + batchSize);
    
    batchClinics.forEach(clinic => {
      const clinicRef = db.collection('clinics').doc(clinic.slug);
      batch.set(clinicRef, clinic);
    });
    
    try {
      await batch.commit();
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} committed successfully`);
    } catch (error) {
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
      throw error;
    }
  }
}