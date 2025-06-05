#!/usr/bin/env node

/**
 * Test script for review collection
 * Usage: node scripts/test-reviews.js [googlePlaceId]
 */

const admin = require('firebase-admin');
const reviewAggregator = require('./services/reviewAggregator');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

async function testReviewCollection() {
  const googlePlaceId = process.argv[2];
  
  if (!googlePlaceId) {
    console.log('Usage: node scripts/test-reviews.js [googlePlaceId]');
    console.log('Example: node scripts/test-reviews.js ChIJN1t_tDeuEmsRUsoyG83frY4');
    console.log('\nTo find a Google Place ID:');
    console.log('1. Go to https://developers.google.com/maps/documentation/places/web-service/place-id');
    console.log('2. Or search on Google Maps and extract from the URL');
    process.exit(1);
  }
  
  console.log(`\nTesting review collection for Place ID: ${googlePlaceId}`);
  console.log('This will create a test clinic and fetch reviews...\n');
  
  try {
    // Create a test clinic
    const testClinicId = `test_clinic_${Date.now()}`;
    const testClinic = {
      name: 'Test Clinic for Review Collection',
      address: '123 Test St',
      city: 'Test City',
      state: 'TX',
      googlePlacesId: googlePlaceId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('1. Creating test clinic...');
    await admin.firestore().collection('clinics').doc(testClinicId).set(testClinic);
    console.log(`   ✓ Created clinic with ID: ${testClinicId}`);
    
    console.log('\n2. Fetching Google reviews...');
    const result = await reviewAggregator.fetchGoogleReviews(testClinicId, googlePlaceId);
    
    if (result.success) {
      console.log(`   ✓ Successfully fetched reviews!`);
      console.log(`   - Total reviews found: ${result.totalCount}`);
      console.log(`   - Reviews saved: ${result.savedCount}`);
      console.log(`   - Average rating: ${result.averageRating}`);
      
      // Fetch and display the saved reviews
      console.log('\n3. Verifying saved reviews...');
      const reviewsSnapshot = await admin.firestore()
        .collection('clinics')
        .doc(testClinicId)
        .collection('reviews')
        .get();
      
      console.log(`   ✓ Found ${reviewsSnapshot.size} reviews in Firestore`);
      
      reviewsSnapshot.forEach((doc, index) => {
        const review = doc.data();
        console.log(`\n   Review ${index + 1}:`);
        console.log(`   - Author: ${review.author}`);
        console.log(`   - Rating: ${review.rating}/5`);
        console.log(`   - Text: ${review.text.substring(0, 100)}...`);
      });
      
    } else {
      console.log(`   ✗ Failed to fetch reviews: ${result.error}`);
    }
    
    // Check the updated clinic document
    console.log('\n4. Checking clinic metadata...');
    const updatedClinic = await admin.firestore()
      .collection('clinics')
      .doc(testClinicId)
      .get();
    
    const clinicData = updatedClinic.data();
    console.log(`   - Google Rating: ${clinicData.googleRating || 'Not set'}`);
    console.log(`   - Google Review Count: ${clinicData.googleReviewCount || 0}`);
    console.log(`   - Total Reviews: ${clinicData.totalReviews || 0}`);
    console.log(`   - Average Rating: ${clinicData.averageRating || 0}`);
    
    // Cleanup
    console.log('\n5. Cleaning up test data...');
    const cleanupConfirm = process.argv[3] !== '--keep';
    
    if (cleanupConfirm) {
      // Delete reviews
      const reviews = await admin.firestore()
        .collection('clinics')
        .doc(testClinicId)
        .collection('reviews')
        .get();
      
      const batch = admin.firestore().batch();
      reviews.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      
      // Delete clinic
      await admin.firestore().collection('clinics').doc(testClinicId).delete();
      console.log('   ✓ Test data cleaned up');
    } else {
      console.log('   ⚠ Test data kept (--keep flag used)');
      console.log(`   Clinic ID: ${testClinicId}`);
    }
    
    console.log('\n✅ Review collection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the test
testReviewCollection();