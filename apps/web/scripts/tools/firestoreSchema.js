const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Initialize Firebase Admin SDK
 * 
 * This should only be called once in your application
 */
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  
  return admin.firestore();
}

/**
 * Get Firestore database instance
 */
function getFirestore() {
  return admin.firestore();
}

/**
 * Clinic Schema Definition
 * - Contains the expected shape of a clinic document
 */
const clinicSchema = {
  name: '',                // string - clinic name
  slug: '',                // string - SEO-friendly URL slug
  address: '',             // string - street address
  city: '',                // string - city name
  state: '',               // string - state code (e.g., AZ)
  zip: '',                 // string - postal code
  country: 'USA',          // string - country (default: USA)
  lat: null,               // number - latitude
  lng: null,               // number - longitude
  phone: '',               // string - primary phone number
  website: '',             // string - website URL
  services: [],            // string[] - list of services offered
  package: 'basic',        // string - subscription plan
  status: 'basic',         // string - account status
  tags: [],                // string[] - tags for filtering
  importSource: '',        // string - where the data came from
  createdAt: null,         // Timestamp - creation date
  lastUpdated: null,       // Timestamp - last update date
  trafficMeta: {
    totalClicks: 0,        // number - total profile views
    topSearchTerms: [],    // string[] - search terms leading to this clinic
    lastViewed: null,      // Timestamp - last time profile was viewed
  },
  validationStatus: {
    verified: false,       // boolean - whether clinic is verified
    method: '',            // string - verification method
    websiteOK: false,      // boolean - whether website is functional
  }
};

/**
 * Traffic Log Schema Definition
 */
const trafficLogSchema = {
  clinicId: '',            // string - reference to clinic document
  searchQuery: '',         // string - what the user searched for
  resultingPage: '',       // string - slug of clinic page viewed
  timestamp: null,         // Timestamp - when the view occurred
  userRegion: '',          // string - user's geographic region
};

/**
 * Admin Log Schema Definition
 */
const adminLogSchema = {
  clinicId: '',            // string - reference to clinic document
  actorId: '',             // string - admin user who performed action
  actionType: '',          // string - type of action performed
  payload: {},             // object - data related to the action
  timestamp: null,         // Timestamp - when the action occurred
};

/**
 * Set up clinic collection with validation rules
 * 
 * Note: This function demonstrates the schema but doesn't
 * actually enforce rules on Firestore. For enforcement,
 * you'd need to set up Firestore Rules separately.
 */
async function setupClinicCollection(db) {
  // Create a test document to ensure collection exists
  const testDocRef = db.collection('clinics').doc('__schema__');
  await testDocRef.set(clinicSchema);
  console.log('✅ Clinics collection schema document created');
}

/**
 * Set up traffic logs collection
 */
async function setupTrafficLogsCollection(db) {
  const testDocRef = db.collection('traffic_logs').doc('__schema__');
  await testDocRef.set(trafficLogSchema);
  console.log('✅ Traffic logs collection schema document created');
}

/**
 * Set up admin logs collection
 */
async function setupAdminLogsCollection(db) {
  const testDocRef = db.collection('admin_logs').doc('__schema__');
  await testDocRef.set(adminLogSchema);
  console.log('✅ Admin logs collection schema document created');
}

/**
 * Main setup function to initialize all collections
 */
async function setupFirestoreSchema() {
  try {
    console.log('Initializing Firestore Schema...');
    const db = initializeFirebaseAdmin();
    
    // Set up collections
    await setupClinicCollection(db);
    await setupTrafficLogsCollection(db);
    await setupAdminLogsCollection(db);
    
    console.log('✅ Firestore schema setup complete!');
  } catch (error) {
    console.error('❌ Error setting up Firestore schema:', error);
  }
}

module.exports = {
  clinicSchema,
  trafficLogSchema,
  adminLogSchema,
  initializeFirebaseAdmin,
  getFirestore,
  setupFirestoreSchema
};

// Run the setup if this file is executed directly
if (require.main === module) {
  setupFirestoreSchema();
}