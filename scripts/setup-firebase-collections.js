#!/usr/bin/env node

/**
 * Firebase Collections Setup Script
 * Creates required collections and indexes for the discovery system
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')})});
}

const firestore = admin.firestore();

async function setupCollections() {
  console.log('🚀 Setting up Firebase collections for discovery system...');

  try {
    // 1. Create discovery sessions collection
    console.log('📁 Creating discoverySession collection...');
    await firestore.collection('discoverySession').doc('_setup').set({
      setupDate: admin.firestore.FieldValue.serverTimestamp(),
      purpose: 'Collection initialization'
    });

    // 2. Ensure clinics collection exists with proper structure
    console.log('📁 Setting up clinics collection structure...');
    await firestore.collection('clinics').doc('_setup').set({
      setupDate: admin.firestore.FieldValue.serverTimestamp(),
      purpose: 'Collection initialization with discovery fields'
    });

    // 3. Create sample discovery session document
    console.log('📄 Creating sample discovery session...');
    const sampleSession = {
      id: 'sample_session_' + Date.now(),
      config: {
        targetClinicCount: 100,
        strategy: 'metro_first',
        searchNiche: 'mensHealth',
        enableReviewImport: true,
        enableSocialEnhancement: true,
        maxConcurrentSearches: 3
      },
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      currentGridIndex: 0,
      clinicsFound: 0,
      clinicsImported: 0,
      totalGrids: 0,
      grids: [],
      errors: []
    };

    await firestore.collection('discoverySession').doc(sampleSession.id).set(sampleSession);

    // 4. Create indexes for efficient queries
    console.log('📊 Setting up Firestore indexes...');
    console.log('Note: You may need to create these indexes manually in Firebase Console:');
    console.log('');
    console.log('Recommended Indexes:');
    console.log('1. Collection: clinics');
    console.log('   Fields: discoverySource (Ascending), createdAt (Descending)');
    console.log('');
    console.log('2. Collection: clinics');
    console.log('   Fields: tier (Ascending), isActive (Ascending), updatedAt (Descending)');
    console.log('');
    console.log('3. Collection: discoverySession');
    console.log('   Fields: status (Ascending), createdAt (Descending)');

    // 5. Clean up setup documents
    console.log('🧹 Cleaning up setup documents...');
    await firestore.collection('discoverySession').doc('_setup').delete();
    await firestore.collection('clinics').doc('_setup').delete();

    console.log('✅ Firebase collections setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Create the recommended indexes in Firebase Console');
    console.log('2. Set up your API keys in environment files');
    console.log('3. Test the discovery system from /admin/discovery');

  } catch (error) {
    console.error('❌ Error setting up collections:', error);
    process.exit(1);
  }
}

// Run setup
setupCollections().then(() => {
  process.exit(0);
});