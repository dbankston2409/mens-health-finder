import { db } from '../../lib/firebase';
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { Clinic } from '../../types';

export interface SeoMeta {
  title: string;
  description: string;
  keywords: string[];
  indexed: boolean;
  lastIndexed: Timestamp | null;
}

/**
 * Generates optimized SEO metadata for a clinic
 * 
 * @param clinic - The clinic data
 * @returns - The generated SEO metadata
 */
export async function generateSeoMeta(clinic: Clinic): Promise<SeoMeta> {
  // Format clinic data for metadata generation
  const { name, city, state, services, tags } = clinic;
  
  // Generate primary service or specialization
  const primaryService = (services || [])[0] || "men's health";
  const otherServices = (services || []).slice(1, 3);
  
  // Generate a title with primary service, clinic name, and location
  const title = `${primaryService} in ${city} | ${name} – Men's Health Finder`;
  
  // Generate a description with more service details and location
  const description = `${name} offers ${primaryService}${otherServices.length > 0 ? `, ${otherServices.join(', ')}` : ''} and more men's health services in ${city}, ${state}. Explore services, view patient reviews, and connect with specialists.`;
  
  // Generate relevant keywords
  const keywords = [
    name, 
    primaryService, 
    `${primaryService} ${city}`,
    `men's health ${city}`, 
    `${city} ${state} men's clinic`,
    ...(services || []),
    ...(tags || [])
  ];
  
  return {
    title,
    description,
    keywords,
    indexed: false,
    lastIndexed: null
  };
}

/**
 * Stores SEO metadata for a clinic in Firestore
 * 
 * @param clinicId - The clinic's document ID
 * @param seoMeta - The SEO metadata to store
 * @returns - Result of the update operation
 */
export async function storeSeoMeta(clinicId: string, seoMeta: SeoMeta): Promise<boolean> {
  try {
    const clinicRef = doc(db, 'clinics', clinicId);
    
    await updateDoc(clinicRef, {
      'seoMeta': seoMeta,
      'lastUpdated': Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error storing SEO metadata:', error);
    return false;
  }
}

/**
 * Updates the indexing status of a clinic
 * 
 * @param clinicId - The clinic's document ID
 * @param indexed - Whether the clinic is indexed
 * @returns - Result of the update operation
 */
export async function updateIndexStatus(clinicId: string, indexed: boolean): Promise<boolean> {
  try {
    const clinicRef = doc(db, 'clinics', clinicId);
    const clinicDoc = await getDoc(clinicRef);
    
    if (!clinicDoc.exists()) {
      return false;
    }
    
    const clinicData = clinicDoc.data();
    const seoMeta = clinicData.seoMeta || {};
    
    await updateDoc(clinicRef, {
      'seoMeta.indexed': indexed,
      'seoMeta.lastIndexed': indexed ? Timestamp.now() : seoMeta.lastIndexed
    });
    
    return true;
  } catch (error) {
    console.error('Error updating index status:', error);
    return false;
  }
}

/**
 * Generates and stores SEO metadata for a clinic
 * 
 * @param clinicId - The clinic's document ID
 * @returns - Result of the operation
 */
export async function generateAndStoreSeoMeta(clinicId: string): Promise<boolean> {
  try {
    const clinicRef = doc(db, 'clinics', clinicId);
    const clinicDoc = await getDoc(clinicRef);
    
    if (!clinicDoc.exists()) {
      return false;
    }
    
    const clinicData = clinicDoc.data() as Clinic;
    clinicData.id = clinicId;
    
    const seoMeta = await generateSeoMeta(clinicData);
    return storeSeoMeta(clinicId, seoMeta);
  } catch (error) {
    console.error('Error generating and storing SEO metadata:', error);
    return false;
  }
}

/**
 * Batch generates SEO metadata for multiple clinics
 * 
 * @param clinicIds - Array of clinic IDs to process
 * @returns - Number of successfully processed clinics
 */
export async function batchGenerateSeoMeta(clinicIds: string[]): Promise<number> {
  let successCount = 0;
  
  for (const clinicId of clinicIds) {
    try {
      const success = await generateAndStoreSeoMeta(clinicId);
      if (success) {
        successCount++;
      }
    } catch (error) {
      console.error(`Error processing clinic ${clinicId}:`, error);
    }
  }
  
  return successCount;
}