import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { generateEnhancedSeoContent } from '../../../../utils/enhancedSeoGenerator';
import { schemaFaqGenerator } from '../../../../utils/schemaFaqGenerator';

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

    const { clinicId, regenerateType = 'all' } = req.body;
    if (!clinicId) {
      return res.status(400).json({ error: 'Clinic ID required' });
    }

    // Get clinic data
    const clinicDoc = await db.collection('clinics').doc(clinicId).get();
    if (!clinicDoc.exists) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const clinic = clinicDoc.data();
    
    console.log(`Manual content regeneration initiated for ${clinic.name} by admin ${decodedToken.email}`);

    // Check if we have scraped data
    if (!clinic?.verified_services || clinic.verified_services.length === 0) {
      return res.status(400).json({ 
        error: 'No scraped data available. Please rescrape the website first.' 
      });
    }

    // Update status
    await db.collection('clinics').doc(clinicId).update({
      content_generation_in_progress: true,
      last_manual_regeneration_by: decodedToken.email,
      last_manual_regeneration_at: new Date()
    });

    const results: any = {
      seoContent: false,
      faqContent: false,
      errors: []
    };

    // Prepare scraped data structure
    const scrapedData = {
      url: clinic.website,
      success: true,
      services: clinic.verified_services || [],
      businessInfo: clinic.business_info || {},
      providerInfo: clinic.provider_info || [],
      testimonialThemes: clinic.testimonial_themes || [],
      scrapedPages: [],
      treatments: {
        treatments: clinic.treatments_found || [],
        searchableTerms: clinic.searchable_terms || [],
        categories: clinic.service_categories || [],
        specialties: []
      }
    };

    // Generate SEO content if requested
    if (regenerateType === 'all' || regenerateType === 'seo') {
      try {
        const seoContent = await generateEnhancedSeoContent(
          {
            name: clinic.name,
            address: clinic.address,
            city: clinic.city,
            state: clinic.state,
            zip: clinic.zip,
            phone: clinic.phone,
            website: clinic.website,
            services: clinic.services || [],
            package: clinic.tier || 'free',
            status: clinic.status || 'active',
            tags: clinic.tags || [],
            createdAt: clinic.createdAt?.toDate() || new Date(),
            updatedAt: new Date()
          },
          scrapedData,
          clinicId
        );

        await db.collection('seo_content').doc(clinicId).set({
          content: seoContent,
          generated_at: new Date(),
          generated_by: 'manual_admin_action',
          admin_email: decodedToken.email,
          word_count: seoContent.split(' ').length
        }, { merge: true });

        results.seoContent = true;
      } catch (error) {
        console.error('SEO content generation failed:', error);
        results.errors.push({
          type: 'seo',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Generate FAQ content if requested
    if (regenerateType === 'all' || regenerateType === 'faq') {
      try {
        const faqData = await schemaFaqGenerator.generateForClinic(
          clinicId,
          clinic,
          scrapedData
        );

        await db.collection('clinics').doc(clinicId).update({
          faq_schema: faqData.schema,
          faq_questions: faqData.questions,
          faq_generated_at: new Date()
        });

        results.faqContent = true;
      } catch (error) {
        console.error('FAQ generation failed:', error);
        results.errors.push({
          type: 'faq',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update status
    await db.collection('clinics').doc(clinicId).update({
      content_generation_in_progress: false,
      needs_seo_content: !results.seoContent,
      last_content_generation: new Date()
    });

    // Log the manual action
    await db.collection('admin_actions').add({
      action: 'manual_content_regeneration',
      clinic_id: clinicId,
      clinic_name: clinic.name,
      performed_by: decodedToken.email,
      performed_at: new Date(),
      regenerate_type: regenerateType,
      results: results
    });

    res.status(200).json({
      success: results.seoContent || results.faqContent,
      message: 'Content regeneration completed',
      results: results
    });

  } catch (error) {
    console.error('Regenerate content API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}