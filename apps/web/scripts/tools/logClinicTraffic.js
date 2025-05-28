const admin = require('firebase-admin');
const { initializeFirebaseAdmin, getFirestore } = require('./firestoreSchema');

/**
 * Log clinic traffic and update clinic metrics
 * 
 * @param {string} searchQuery - The search query that led to viewing the clinic
 * @param {string} clinicSlug - The slug of the clinic being viewed
 * @param {string} userRegion - Optional region of the user
 * @returns {Promise<Object>} - Result of the logging operation
 */
async function logClinicTraffic(searchQuery, clinicSlug, userRegion = '') {
  const db = getFirestore();
  
  try {
    // Prepare traffic log entry
    const trafficLogEntry = {
      searchQuery: searchQuery || '',
      resultingPage: clinicSlug,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userRegion: userRegion || '',
    };
    
    // Find the clinic by slug
    const clinicsRef = db.collection('clinics');
    const clinicQuery = await clinicsRef.where('slug', '==', clinicSlug).limit(1).get();
    
    if (clinicQuery.empty) {
      console.error(`❌ No clinic found with slug: ${clinicSlug}`);
      return { success: false, error: 'Clinic not found' };
    }
    
    const clinicDoc = clinicQuery.docs[0];
    const clinicId = clinicDoc.id;
    trafficLogEntry.clinicId = clinicId;
    
    // 1. Begin a Firestore transaction for atomic updates
    return await db.runTransaction(async (transaction) => {
      // Get fresh clinic data
      const clinicRef = db.collection('clinics').doc(clinicId);
      const clinicSnapshot = await transaction.get(clinicRef);
      const clinicData = clinicSnapshot.data();
      
      // Prepare updates to the clinic document
      const now = admin.firestore.FieldValue.serverTimestamp();
      
      // 2. Update the clinic's traffic metadata
      const topSearchTerms = clinicData.trafficMeta?.topSearchTerms || [];
      
      // Only add the search term if it's not already in the list and isn't empty
      if (searchQuery && !topSearchTerms.includes(searchQuery)) {
        // Keep only the top 20 search terms (remove oldest if needed)
        if (topSearchTerms.length >= 20) {
          topSearchTerms.shift(); // Remove oldest search term
        }
        topSearchTerms.push(searchQuery);
      }
      
      // 3. Update the clinic document
      transaction.update(clinicRef, {
        'trafficMeta.totalClicks': admin.firestore.FieldValue.increment(1),
        'trafficMeta.topSearchTerms': topSearchTerms,
        'trafficMeta.lastViewed': now,
        'lastUpdated': now
      });
      
      // 4. Create a traffic log entry
      const trafficLogRef = db.collection('traffic_logs').doc();
      transaction.set(trafficLogRef, trafficLogEntry);
      
      return {
        success: true,
        clinicId: clinicId,
        trafficLogId: trafficLogRef.id,
        message: `✅ Traffic log created and clinic metrics updated`
      };
    });
  } catch (error) {
    console.error('❌ Error logging clinic traffic:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a report of top viewed clinics within a date range
 * 
 * @param {Date} startDate - Start date for the report
 * @param {Date} endDate - End date for the report
 * @param {number} limit - Maximum number of clinics to include
 * @returns {Promise<Array>} - Array of top clinics with view counts
 */
async function getTopViewedClinics(startDate, endDate, limit = 10) {
  const db = getFirestore();
  
  try {
    // Convert dates to Firestore timestamps
    const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
    const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);
    
    // Query traffic logs within the date range
    const logsRef = db.collection('traffic_logs');
    const logsQuery = await logsRef
      .where('timestamp', '>=', startTimestamp)
      .where('timestamp', '<=', endTimestamp)
      .get();
    
    // Count views per clinic
    const clinicViews = {};
    logsQuery.forEach(doc => {
      const data = doc.data();
      const clinicId = data.clinicId;
      clinicViews[clinicId] = (clinicViews[clinicId] || 0) + 1;
    });
    
    // Convert to array and sort by views
    const sortedClinics = Object.entries(clinicViews)
      .map(([id, views]) => ({ id, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
    
    // Fetch clinic details for the top viewed clinics
    const clinicDetails = await Promise.all(
      sortedClinics.map(async ({ id, views }) => {
        const clinicDoc = await db.collection('clinics').doc(id).get();
        const clinicData = clinicDoc.data();
        return {
          id,
          views,
          name: clinicData.name,
          slug: clinicData.slug,
          city: clinicData.city,
          state: clinicData.state
        };
      })
    );
    
    return clinicDetails;
  } catch (error) {
    console.error('❌ Error generating top clinics report:', error);
    return [];
  }
}

/**
 * Example function to demonstrate how to use the traffic logging feature
 */
async function exampleUsage() {
  // Initialize Firebase Admin if not already initialized
  initializeFirebaseAdmin();
  
  // Example: Log a visit to a clinic page
  const result = await logClinicTraffic(
    'mens health near austin',  // search query
    'premier-mens-health-austin-tx',  // clinic slug
    'Texas'  // user region
  );
  
  console.log(result);
  
  // Example: Get top viewed clinics in the last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const topClinics = await getTopViewedClinics(thirtyDaysAgo, now, 5);
  
  console.log('Top 5 clinics in the last 30 days:');
  console.table(topClinics);
}

module.exports = {
  logClinicTraffic,
  getTopViewedClinics
};

// Run the example if executed directly
if (require.main === module) {
  exampleUsage();
}