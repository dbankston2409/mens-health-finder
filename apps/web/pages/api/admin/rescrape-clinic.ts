import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { enhancedClinicWebsiteScraper } from '../../../../utils/enhancedWebsiteScraper';
import { retryWithBackoff, retryStrategies } from '../../../../utils/retryWithBackoff';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    const { clinicId } = req.body;
    if (!clinicId) {
      return res.status(400).json({ error: 'Clinic ID required' });
    }

    // Get clinic data
    const clinicDoc = await db.collection('clinics').doc(clinicId).get();
    if (!clinicDoc.exists) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const clinic = clinicDoc.data();
    if (!clinic?.website) {
      return res.status(400).json({ error: 'Clinic has no website to scrape' });
    }

    console.log(`Manual rescrape initiated for ${clinic.name} by admin ${decodedToken.email}`);

    // Update status to indicate scraping in progress
    await db.collection('clinics').doc(clinicId).update({
      scraping_in_progress: true,
      last_manual_scrape_by: decodedToken.email,
      last_manual_scrape_at: new Date()
    });

    // Perform scraping with retry logic
    const scraper = new enhancedClinicWebsiteScraper();
    const scrapingResult = await retryWithBackoff(
      () => scraper.scrapeWebsite(clinic.website),
      {
        ...retryStrategies.websiteScraping,
        onRetry: (attempt, error) => {
          console.log(`Scraping retry attempt ${attempt} for ${clinic.name}:`, error.message);
        }
      }
    );

    if (!scrapingResult.success) {
      await db.collection('clinics').doc(clinicId).update({
        scraping_in_progress: false,
        last_scrape_failed: true,
        last_scrape_error: scrapingResult.error || 'Unknown error'
      });
      
      return res.status(500).json({ 
        error: 'Scraping failed', 
        details: scrapingResult.error 
      });
    }

    // Update clinic with scraped data
    const updateData: any = {
      scraping_in_progress: false,
      last_scrape_failed: false,
      last_scrape_error: null,
      last_scraped_at: new Date(),
      scraped_pages_count: scrapingResult.scrapedPages.length,
      verified_services: scrapingResult.services.map(s => ({
        name: s.service,
        category: s.category,
        confidence: s.confidence
      })),
      treatments_found: scrapingResult.treatments?.treatments || [],
      searchable_terms: scrapingResult.searchableTerms || [],
      business_info: scrapingResult.businessInfo || {},
      provider_info: scrapingResult.providerInfo || [],
      testimonial_themes: scrapingResult.testimonialThemes || []
    };

    // Add service categories
    if (scrapingResult.treatments?.categories) {
      updateData.service_categories = scrapingResult.treatments.categories;
    }

    await db.collection('clinics').doc(clinicId).update(updateData);

    // Log the manual action
    await db.collection('admin_actions').add({
      action: 'manual_rescrape',
      clinic_id: clinicId,
      clinic_name: clinic.name,
      performed_by: decodedToken.email,
      performed_at: new Date(),
      results: {
        pages_scraped: scrapingResult.scrapedPages.length,
        services_found: scrapingResult.services.length,
        treatments_found: scrapingResult.treatments?.treatments.length || 0
      }
    });

    res.status(200).json({
      success: true,
      message: 'Clinic website successfully rescraped',
      results: {
        pagesScraped: scrapingResult.scrapedPages.length,
        servicesFound: scrapingResult.services.length,
        treatmentsFound: scrapingResult.treatments?.treatments.length || 0,
        categoriesDetected: scrapingResult.treatments?.categories || []
      }
    });

  } catch (error) {
    console.error('Rescrape API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}