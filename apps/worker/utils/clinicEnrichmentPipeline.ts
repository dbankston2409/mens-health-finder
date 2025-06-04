import { EnhancedClinicWebsiteScraper } from './enhancedWebsiteScraper';
import { generateEnhancedSeoContent, generateServiceBasedFAQs } from './enhancedSeoGenerator';
import { ClinicInput } from '../types/clinic';
import FirebaseAdmin from '../lib/firebase-admin';

/**
 * Automated pipeline for enriching clinic data with website information
 * Runs after Google Places discovery to add detailed service data
 */

export interface EnrichmentResult {
  clinicId: string;
  success: boolean;
  servicesFound: number;
  treatmentsFound: number;
  seoContentGenerated: boolean;
  faqsGenerated: boolean;
  error?: string;
  enrichedData?: {
    verifiedServices: string[];
    searchableTerms?: string[];  // Pre-processed terms for Firestore search
    treatments?: Array<{
      term: string;
      type: string;
      confidence: number;
    }>;
    specializations?: string[];
    seoContent?: string;
    faqs?: Array<{question: string; answer: string}>;
    scrapingDetails?: {
      pagesScraped: number;
      confidence: number;
    };
  };
}

export class ClinicEnrichmentPipeline {
  private scraper: EnhancedClinicWebsiteScraper;
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.scraper = new EnhancedClinicWebsiteScraper();
    this.db = FirebaseAdmin.firestore();
  }

  /**
   * Enrich a single clinic with website data
   */
  async enrichClinic(clinic: ClinicInput): Promise<EnrichmentResult> {
    const result: EnrichmentResult = {
      clinicId: clinic.id || '',
      success: false,
      servicesFound: 0,
      treatmentsFound: 0,
      seoContentGenerated: false,
      faqsGenerated: false,
    };

    try {
      // Skip if no website
      if (!clinic.website) {
        throw new Error('No website URL available');
      }

      console.log(`🔍 Enriching clinic: ${clinic.name}`);

      // Step 1: Scrape website for services
      console.log(`📱 Scraping website: ${clinic.website}`);
      const scrapingResult = await this.scraper.scrapeWebsite(clinic.website);
      
      if (!scrapingResult.success || scrapingResult.services.length === 0) {
        throw new Error('Website scraping failed or no services found');
      }

      result.servicesFound = scrapingResult.services.length;
      result.treatmentsFound = scrapingResult.treatments?.treatments.length || 0;
      console.log(`✅ Found ${result.servicesFound} services and ${result.treatmentsFound} treatments`);

      // Step 2: Generate enhanced SEO content
      console.log('📝 Generating enhanced SEO content...');
      const enhancedClinic = { ...clinic, scrapedData: scrapingResult };
      const seoContent = await generateEnhancedSeoContent(enhancedClinic, scrapingResult);
      result.seoContentGenerated = true;

      // Step 3: Generate service-based FAQs
      console.log('❓ Generating FAQs...');
      const faqs = generateServiceBasedFAQs(enhancedClinic, scrapingResult.services);
      result.faqsGenerated = true;

      // Step 4: Prepare enriched data
      const verifiedServices = scrapingResult.services
        .filter(s => s.confidence > 0.7)
        .map(s => s.service);

      result.enrichedData = {
        verifiedServices: Array.from(new Set(verifiedServices)), // Deduplicate
        searchableTerms: scrapingResult.searchableTerms || [],
        treatments: scrapingResult.treatments?.treatments.map(t => ({
          term: t.term,
          type: t.type,
          confidence: t.confidence
        })),
        specializations: scrapingResult.treatments?.specialties || [],
        seoContent,
        faqs,
        scrapingDetails: {
          pagesScraped: scrapingResult.scrapedPages.length,
          confidence: scrapingResult.services.reduce((acc, s) => acc + s.confidence, 0) / scrapingResult.services.length,
        },
      };

      // Step 5: Update clinic in Firestore
      await this.updateClinicWithEnrichedData(clinic.id!, result.enrichedData);
      
      result.success = true;
      console.log(`✅ Successfully enriched ${clinic.name}`);

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Enrichment failed for ${clinic.name}:`, error);
    }

    return result;
  }

  /**
   * Batch process multiple clinics
   */
  async enrichMultipleClinics(clinics: ClinicInput[], options?: {
    maxConcurrent?: number;
    delayMs?: number;
  }): Promise<EnrichmentResult[]> {
    const { maxConcurrent = 3, delayMs = 2000 } = options || {};
    const results: EnrichmentResult[] = [];

    // Process in batches to avoid overwhelming websites
    for (let i = 0; i < clinics.length; i += maxConcurrent) {
      const batch = clinics.slice(i, i + maxConcurrent);
      
      const batchResults = await Promise.all(
        batch.map(clinic => this.enrichClinic(clinic))
      );
      
      results.push(...batchResults);

      // Delay between batches
      if (i + maxConcurrent < clinics.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Log summary
    const successful = results.filter(r => r.success).length;
    const totalServices = results.reduce((acc, r) => acc + r.servicesFound, 0);
    const totalTreatments = results.reduce((acc, r) => acc + r.treatmentsFound, 0);
    
    console.log(`
📊 Enrichment Summary:
- Total clinics processed: ${results.length}
- Successful: ${successful}
- Failed: ${results.length - successful}
- Total services discovered: ${totalServices}
- Total treatments found: ${totalTreatments}
- Average services per clinic: ${(totalServices / successful).toFixed(1)}
- Average treatments per clinic: ${(totalTreatments / successful).toFixed(1)}
    `);

    return results;
  }

  /**
   * Update clinic document with enriched data
   */
  private async updateClinicWithEnrichedData(
    clinicId: string, 
    enrichedData: EnrichmentResult['enrichedData']
  ): Promise<void> {
    if (!enrichedData) return;

    const updateData: any = {
      // Add verified services to existing services
      services: FirebaseAdmin.firestore.FieldValue.arrayUnion(
        ...enrichedData.verifiedServices
      ),
      
      // Add searchable terms for fast querying
      searchableTerms: enrichedData.searchableTerms || [],
      
      // Add detailed treatments found
      treatments: enrichedData.treatments || [],
      
      // Update SEO content
      'seoMeta.generatedContent': enrichedData.seoContent,
      'seoMeta.contentGeneratedAt': FirebaseAdmin.firestore.FieldValue.serverTimestamp(),
      'seoMeta.contentSource': 'enhanced_scraping',
      
      // Add FAQs
      faqs: enrichedData.faqs,
      
      // Add enrichment metadata
      enrichmentData: {
        lastEnriched: FirebaseAdmin.firestore.FieldValue.serverTimestamp(),
        servicesVerified: enrichedData.verifiedServices.length,
        treatmentsFound: enrichedData.treatments?.length || 0,
        specializations: enrichedData.specializations,
        scrapingConfidence: enrichedData.scrapingDetails?.confidence,
        pagesAnalyzed: enrichedData.scrapingDetails?.pagesScraped,
      },
    };

    // Update clinic document
    await this.db.collection('clinics').doc(clinicId).update(updateData);

    // Log enrichment event
    await this.logEnrichmentEvent(clinicId, enrichedData);
  }

  /**
   * Log enrichment details for analytics
   */
  private async logEnrichmentEvent(
    clinicId: string,
    enrichedData: EnrichmentResult['enrichedData']
  ): Promise<void> {
    await this.db.collection('enrichment_logs').add({
      clinicId,
      timestamp: FirebaseAdmin.firestore.FieldValue.serverTimestamp(),
      servicesFound: enrichedData?.verifiedServices.length || 0,
      specializations: enrichedData?.specializations || [],
      scrapingDetails: enrichedData?.scrapingDetails,
      success: true,
    });
  }

  /**
   * Find clinics that need enrichment
   */
  async findClinicsNeedingEnrichment(limit: number = 50): Promise<ClinicInput[]> {
    const snapshot = await this.db.collection('clinics')
      .where('website', '!=', null)
      .where('enrichmentData.lastEnriched', '==', null)
      .orderBy('website')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClinicInput));
  }

  /**
   * Re-enrich clinics that were enriched more than X days ago
   */
  async findClinicsForReEnrichment(daysOld: number = 90, limit: number = 50): Promise<ClinicInput[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const snapshot = await this.db.collection('clinics')
      .where('website', '!=', null)
      .where('enrichmentData.lastEnriched', '<', cutoffDate)
      .orderBy('enrichmentData.lastEnriched')
      .orderBy('website')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClinicInput));
  }
}

/**
 * Scheduled job to run enrichment pipeline
 */
export async function runScheduledEnrichment(): Promise<void> {
  const pipeline = new ClinicEnrichmentPipeline();
  
  // Find clinics needing enrichment
  const newClinics = await pipeline.findClinicsNeedingEnrichment(20);
  const oldClinics = await pipeline.findClinicsForReEnrichment(90, 10);
  
  const allClinics = [...newClinics, ...oldClinics];
  
  if (allClinics.length === 0) {
    console.log('No clinics need enrichment at this time');
    return;
  }

  console.log(`Starting enrichment for ${allClinics.length} clinics...`);
  
  // Run enrichment
  await pipeline.enrichMultipleClinics(allClinics, {
    maxConcurrent: 3,
    delayMs: 3000, // 3 second delay between batches
  });
}