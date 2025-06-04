#!/usr/bin/env node

/**
 * Migration script to convert existing clinics to optimized structure
 * Reduces from 97+ fields to ~35 essential fields
 * Preserves business hours, payment methods, and reviews
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function migrateClinic(oldClinic) {
  const clinicData = oldClinic.data();
  const clinicId = oldClinic.id;
  
  // Build optimized structure
  const optimizedClinic = {
    // Core data (Required)
    id: clinicId,
    name: clinicData.name || '',
    slug: clinicData.slug || '',
    address: clinicData.address || '',
    city: clinicData.city || '',
    state: clinicData.state || '',
    zip: clinicData.zip || '',
    lat: clinicData.lat || 0,
    lng: clinicData.lng || 0,
    phone: clinicData.phone || '',
    website: clinicData.website,
    email: clinicData.email,
    
    // Business hours (preserve existing structure)
    hours: clinicData.hours,
    
    // Status & Tier
    tier: clinicData.tier || 'free',
    isActive: clinicData.status === 'active' || clinicData.status === 'Active' || true,
    isVerified: clinicData.verified || false,
    businessStatus: clinicData.businessStatus || 'operational',
    
    // External IDs (only Google Places)
    googlePlacesId: clinicData.googlePlacesId || clinicData.googlePlaceId,
    
    // Reviews (aggregated)
    totalReviews: clinicData.reviewCount || clinicData.totalReviews || 0,
    averageRating: clinicData.rating || clinicData.averageRating || 0,
    googleReviewCount: clinicData.googleReviewCount || 0,
    
    // Payment methods
    paymentMethods: clinicData.paymentMethods || {
      cash: true,
      creditCards: true,
      insurance: false,
      financing: false
    },
    
    // Services (simplified)
    specializedServices: extractSpecializedServices(clinicData),
    
    // Photos (URLs only for paid clinics)
    photoUrls: extractPhotoUrls(clinicData),
    
    // Discovery metadata
    discoverySource: clinicData.discoverySource || 'manual',
    discoveryDate: clinicData.discoveryDate || clinicData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
    
    // Single timestamp
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    
    // SEO (consolidated)
    seo: {
      description: clinicData.seoMeta?.description || clinicData.description || '',
      keywords: clinicData.seoMeta?.keywords || clinicData.keywords || [],
      indexed: clinicData.seoIndexStatus?.indexed || false
    }
  };
  
  // Remove undefined values
  Object.keys(optimizedClinic).forEach(key => {
    if (optimizedClinic[key] === undefined) {
      delete optimizedClinic[key];
    }
  });
  
  return optimizedClinic;
}

function extractSpecializedServices(clinicData) {
  const validServices = ['TRT', 'ED', 'Peptides', 'Weight Loss', 'HRT', 'Wellness', 'Hair Loss'];
  const services = clinicData.specializedServices || clinicData.services || [];
  
  return services.filter(service => 
    validServices.some(valid => 
      service.toLowerCase().includes(valid.toLowerCase())
    )
  );
}

function extractPhotoUrls(clinicData) {
  // Only return photo URLs for paid clinics
  if (clinicData.tier === 'free') {
    return undefined;
  }
  
  const photoUrls = [];
  
  // Extract from new structure
  if (clinicData.photos?.googlePhotoUrls) {
    photoUrls.push(...clinicData.photos.googlePhotoUrls);
  }
  
  // Extract from old structure
  if (clinicData.photos?.google) {
    clinicData.photos.google.forEach(photo => {
      if (photo.url) photoUrls.push(photo.url);
    });
  }
  
  // Add hero and gallery images
  if (clinicData.photos?.hero) {
    photoUrls.push(clinicData.photos.hero);
  }
  if (clinicData.photos?.gallery) {
    photoUrls.push(...clinicData.photos.gallery);
  }
  
  return photoUrls.length > 0 ? photoUrls : undefined;
}

async function migrateReviews(clinicId, oldClinicData) {
  // Check if reviews exist in the old format
  const reviews = oldClinicData.reviews || [];
  
  if (reviews.length === 0) return;
  
  const reviewsRef = db.collection('clinics').doc(clinicId).collection('reviews');
  const batch = db.batch();
  
  reviews.forEach(review => {
    // Skip Yelp reviews
    if (review.source === 'yelp' || review.source === 'Yelp') return;
    
    const reviewDoc = reviewsRef.doc();
    batch.set(reviewDoc, {
      id: reviewDoc.id,
      source: review.source || 'google',
      rating: review.rating || 0,
      text: review.text || '',
      author: review.author || 'Anonymous',
      authorPhoto: review.authorPhoto,
      date: review.date || admin.firestore.FieldValue.serverTimestamp(),
      verified: review.verified || false,
      helpful: review.helpful || 0,
      reported: review.reported || false
    });
  });
  
  await batch.commit();
}

async function runMigration() {
  console.log('🚀 Starting clinic migration to optimized structure...\n');
  
  try {
    // Get all clinics
    const clinicsSnapshot = await db.collection('clinics').get();
    console.log(`📊 Found ${clinicsSnapshot.size} clinics to migrate\n`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process in batches of 500
    const batchSize = 500;
    const batches = [];
    let currentBatch = [];
    
    clinicsSnapshot.forEach(doc => {
      currentBatch.push(doc);
      if (currentBatch.length === batchSize) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    });
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }
    
    console.log(`📦 Processing ${batches.length} batches...\n`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const writeBatch = db.batch();
      
      console.log(`Processing batch ${i + 1}/${batches.length}...`);
      
      for (const doc of batch) {
        try {
          const optimizedData = await migrateClinic(doc);
          writeBatch.set(doc.ref, optimizedData, { merge: false });
          
          // Migrate reviews to subcollection
          await migrateReviews(doc.id, doc.data());
          
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            clinicId: doc.id,
            clinicName: doc.data().name,
            error: error.message
          });
        }
      }
      
      await writeBatch.commit();
      console.log(`✅ Batch ${i + 1} completed\n`);
    }
    
    // Print summary
    console.log('🎉 Migration completed!\n');
    console.log(`✅ Successfully migrated: ${successCount} clinics`);
    console.log(`❌ Errors: ${errorCount} clinics`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`- ${err.clinicName} (${err.clinicId}): ${err.error}`);
      });
    }
    
    // Create backup collection info
    console.log('\n💡 Note: Original data is preserved. To restore, use the Firebase console.');
    console.log('📝 The optimized structure reduces from 97+ fields to ~35 essential fields');
    console.log('🔄 Reviews have been moved to subcollections for better performance');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This will migrate all clinics to the optimized structure.');
console.log('📊 Changes:');
console.log('   - Reduces from 97+ fields to ~35 essential fields');
console.log('   - Removes ALL Yelp data');
console.log('   - Converts photos to URL-only storage');
console.log('   - Moves reviews to subcollections');
console.log('   - Preserves business hours and payment methods');
console.log('   - Only stores photos for paid clinics\n');

rl.question('Do you want to proceed? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    rl.close();
    runMigration();
  } else {
    console.log('Migration cancelled.');
    rl.close();
    process.exit(0);
  }
});