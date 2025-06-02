import admin from '../lib/firebase';
import { generateSeoMeta } from './generateSeoMeta';
import { generateSeoContent } from './generateSeoContent';
import { ClinicInput, ClinicDocument, SeoMeta } from '../types/clinic';

export async function updateClinicSeoData(slug: string): Promise<{
  success: boolean;
  seoMeta?: SeoMeta;
  seoContent?: string;
  error?: string;
}> {
  try {
    const db = admin.firestore();
    const clinicRef = db.collection('clinics').doc(slug);
    const clinicDoc = await clinicRef.get();
    
    if (!clinicDoc.exists) {
      return {
        success: false,
        error: `Clinic with slug '${slug}' not found`
      };
    }
    
    const clinicData = clinicDoc.data() as ClinicDocument;
    
    // Generate SEO metadata
    console.log(`🔍 Generating SEO metadata for: ${clinicData.name}`);
    const seoMeta = await generateSeoMeta(clinicData);
    
    // Generate SEO content
    console.log(`📝 Generating SEO content for: ${clinicData.name}`);
    const seoContent = await generateSeoContent(clinicData);
    
    // Update the clinic document
    const updateData = {
      seoMeta: {
        ...seoMeta,
        indexed: false,
        lastGenerated: new Date()
      },
      seoContent,
      updatedAt: new Date()
    };
    
    await clinicRef.update(updateData);
    
    console.log(`✅ Updated SEO data for: ${slug}`);
    
    return {
      success: true,
      seoMeta: updateData.seoMeta,
      seoContent
    };
    
  } catch (error) {
    console.error(`❌ Failed to update SEO data for ${slug}:`, error);
    return {
      success: false,
      error: `Failed to update SEO data: ${error}`
    };
  }
}

export async function updateClinicSeoDataById(clinicId: string): Promise<{
  success: boolean;
  slug?: string;
  seoMeta?: SeoMeta;
  seoContent?: string;
  error?: string;
}> {
  try {
    const db = admin.firestore();
    
    // Find clinic by ID (assuming ID could be stored in a field or be the document ID)
    const clinicsRef = db.collection('clinics');
    const snapshot = await clinicsRef.where('id', '==', clinicId).limit(1).get();
    
    if (snapshot.empty) {
      // Try using clinicId as document ID
      const directDoc = await clinicsRef.doc(clinicId).get();
      if (!directDoc.exists) {
        return {
          success: false,
          error: `Clinic with ID '${clinicId}' not found`
        };
      }
      
      const clinicData = directDoc.data() as ClinicDocument;
      const result = await updateClinicSeoData(clinicData.slug);
      
      return {
        ...result,
        slug: clinicData.slug
      };
    }
    
    const clinicDoc = snapshot.docs[0];
    const clinicData = clinicDoc.data() as ClinicDocument;
    const result = await updateClinicSeoData(clinicData.slug);
    
    return {
      ...result,
      slug: clinicData.slug
    };
    
  } catch (error) {
    console.error(`❌ Failed to update SEO data for clinic ID ${clinicId}:`, error);
    return {
      success: false,
      error: `Failed to update SEO data: ${error}`
    };
  }
}

export async function batchUpdateSeoData(slugs: string[]): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ slug: string; error: string }>;
}> {
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [] as Array<{ slug: string; error: string }>
  };
  
  console.log(`🚀 Starting batch SEO update for ${slugs.length} clinics...`);
  
  for (const slug of slugs) {
    results.processed++;
    
    try {
      const result = await updateClinicSeoData(slug);
      
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push({
          slug,
          error: result.error || 'Unknown error'
        });
      }
      
      // Add small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      results.failed++;
      results.errors.push({
        slug,
        error: `Batch update error: ${error}`
      });
    }
  }
  
  console.log(`✅ Batch SEO update complete: ${results.successful}/${results.processed} successful`);
  
  return results;
}

export async function checkSeoDataCompleteness(slug: string): Promise<{
  hasTitle: boolean;
  hasDescription: boolean;
  hasKeywords: boolean;
  hasContent: boolean;
  lastGenerated?: Date;
  needsUpdate: boolean;
}> {
  try {
    const db = admin.firestore();
    const clinicDoc = await db.collection('clinics').doc(slug).get();
    
    if (!clinicDoc.exists) {
      return {
        hasTitle: false,
        hasDescription: false,
        hasKeywords: false,
        hasContent: false,
        needsUpdate: true
      };
    }
    
    const data = clinicDoc.data() as ClinicDocument;
    const seoMeta = data.seoMeta;
    const seoContent = data.seoContent;
    
    const hasTitle = !!(seoMeta?.title && seoMeta.title.trim() !== '');
    const hasDescription = !!(seoMeta?.description && seoMeta.description.trim() !== '');
    const hasKeywords = !!(seoMeta?.keywords && seoMeta.keywords.length > 0);
    const hasContent = !!(seoContent && seoContent.trim() !== '');
    
    // Check if data is older than 30 days
    const lastGenerated = seoMeta?.lastGenerated;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const isOld = !lastGenerated || (lastGenerated instanceof Date && lastGenerated < thirtyDaysAgo);
    
    const needsUpdate = !hasTitle || !hasDescription || !hasKeywords || !hasContent || isOld;
    
    return {
      hasTitle,
      hasDescription,
      hasKeywords,
      hasContent,
      lastGenerated: lastGenerated instanceof Date ? lastGenerated : undefined,
      needsUpdate
    };
    
  } catch (error) {
    console.error(`Error checking SEO completeness for ${slug}:`, error);
    return {
      hasTitle: false,
      hasDescription: false,
      hasKeywords: false,
      hasContent: false,
      needsUpdate: true
    };
  }
}