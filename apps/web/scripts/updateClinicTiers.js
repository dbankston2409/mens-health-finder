/**
 * Script to update clinic tiers in Firestore
 * 
 * This script:
 * 1. Reads all clinic documents
 * 2. Updates them with standardized tier field ('free', 'standard', 'advanced')
 * 3. Generates tierFeatures object based on the tier
 * 4. Adds placeholder seo.description field if missing
 * 5. Adds placeholder seo.keywords array if missing
 * 
 * Usage: node scripts/updateClinicTiers.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Convert legacy tier values to standardized tier
 */
function convertToStandardTier(legacyTier) {
  if (!legacyTier) return 'free';
  
  const normalized = legacyTier.toLowerCase();
  
  if (['premium', 'high', 'advanced', 'pro', 'deluxe'].includes(normalized)) {
    return 'advanced';
  }
  
  if (['basic', 'standard', 'low', 'mid', 'medium'].includes(normalized)) {
    return 'standard';
  }
  
  return 'free';
}

/**
 * Generate tierFeatures object based on tier
 */
function generateTierFeatures(tier) {
  return {
    fullProfile: true,
    seoDescription: true,
    publicContact: true,
    locationMapping: true,
    basicSearch: true,
    
    verifiedBadge: tier !== 'free',
    enhancedSearch: tier !== 'free',
    treatmentsLimit: tier === 'free' ? 5 : (tier === 'standard' ? 10 : 20),
    reviewDisplay: tier === 'free' ? 'basic' : (tier === 'standard' ? 'enhanced' : 'premium'),
    
    enhancedContactUX: tier === 'advanced',
    customTracking: tier === 'advanced',
    snapshotReport: tier === 'advanced',
    priorityListing: tier === 'advanced',
  };
}

/**
 * Get a sample SEO description for a clinic
 */
function getSampleSeoDescription(clinic) {
  return `${clinic.name} is a men's health clinic located in ${clinic.city}, ${clinic.state}. We offer comprehensive men's health services including testosterone replacement therapy, ED treatment, and more. Our clinic specializes in providing personalized care for men's unique health needs. With a focus on wellness and preventative care, we help men achieve optimal health and vitality. Our experienced medical professionals are dedicated to providing the highest quality care in a comfortable and confidential environment. If you're looking for men's health services in ${clinic.city}, contact us today to schedule a consultation.`;
}

/**
 * Get sample SEO keywords for a clinic
 */
function getSampleSeoKeywords(clinic) {
  return [
    `men's health ${clinic.city}`,
    `testosterone clinic ${clinic.city}`,
    `ED treatment ${clinic.city}`,
    `TRT clinic ${clinic.state}`,
    `hormone therapy ${clinic.city}`,
    `men's wellness clinic ${clinic.city} ${clinic.state}`,
    clinic.name,
    `men's health doctor ${clinic.city}`
  ];
}

/**
 * Update all clinics with the new tier system
 */
async function updateClinicTiers() {
  try {
    // Get all clinics
    const clinicsSnapshot = await db.collection('clinics').get();
    
    console.log(`Found ${clinicsSnapshot.size} clinics to update`);
    
    // Track counts
    const counts = {
      free: 0,
      standard: 0,
      advanced: 0,
      total: clinicsSnapshot.size,
      errors: 0
    };
    
    // Process each clinic
    const batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500; // Firestore limit
    
    for (const doc of clinicsSnapshot.docs) {
      try {
        const data = doc.data();
        
        // Determine the tier based on existing fields
        const currentTier = data.tier;
        const currentPackage = data.package;
        const currentPackageTier = data.packageTier;
        
        // Convert to standardized tier
        const newTier = convertToStandardTier(currentTier || currentPackage || currentPackageTier);
        
        // Generate tier features
        const tierFeatures = generateTierFeatures(newTier);
        
        // Prepare SEO fields
        const seo = {
          description: data.seo?.description || 
                       data.seoContent?.description || 
                       data.seoMeta?.description || 
                       getSampleSeoDescription(data),
          
          keywords: data.seo?.keywords || 
                    data.seoContent?.keywords || 
                    data.seoMeta?.keywords || 
                    getSampleSeoKeywords(data),
                    
          title: data.seo?.title || 
                 data.seoContent?.title || 
                 data.seoMeta?.title || 
                 `${data.name} - Men's Health Clinic in ${data.city}, ${data.state}`,
                 
          indexed: data.seo?.indexed || data.seoMeta?.indexed || true,
          lastIndexed: data.seo?.lastIndexed || data.seoMeta?.lastIndexed || admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Update the doc
        batch.update(doc.ref, {
          tier: newTier,
          tierFeatures,
          seo,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Increment counts
        counts[newTier]++;
        
        // Increment batch count
        batchCount++;
        
        // If batch is full, commit and start a new one
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          batch = db.batch();
          batchCount = 0;
        }
      } catch (err) {
        console.error(`Error updating clinic ${doc.id}:`, err);
        counts.errors++;
      }
    }
    
    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }
    
    // Log results
    console.log('\nUpdate Complete!');
    console.log('--------------------');
    console.log(`Total clinics: ${counts.total}`);
    console.log(`Free tier: ${counts.free}`);
    console.log(`Standard tier: ${counts.standard}`);
    console.log(`Advanced tier: ${counts.advanced}`);
    console.log(`Errors: ${counts.errors}`);
    
  } catch (error) {
    console.error('Failed to update clinic tiers:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
console.log('Starting clinic tier update...');
updateClinicTiers();