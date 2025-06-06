/**
 * Review Integration Service for Worker Tasks
 * 
 * Integrates with the existing reviewAggregator.js service
 * Provides functionality for updating reviews via worker tasks
 */

const path = require('path');
const admin = require('firebase-admin');

// Import the existing review aggregator
const reviewAggregator = require('../../../scripts/services/reviewAggregator.js');

/**
 * Update reviews for multiple clinics
 * 
 * @param {Object} config - Configuration for review updates
 * @param {string[]} config.clinicIds - Array of clinic IDs to update
 * @param {boolean} config.enableGoogleReviews - Whether to fetch Google reviews
 * @param {boolean} config.enableYelpReviews - Whether to fetch Yelp reviews
 * @param {number} config.rateLimitMs - Rate limit between requests
 * @param {Function} onProgress - Progress callback (completed, total, current)
 * @returns {Promise<Object>} - Update results
 */
async function updateMultipleClinicReviews(config, onProgress) {
  const results = {
    totalClinics: config.clinicIds.length,
    successful: 0,
    failed: 0,
    totalReviewsImported: 0,
    googleReviews: 0,
    yelpReviews: 0,
    errors: []
  };

  console.log(`Starting review update for ${config.clinicIds.length} clinics`);

  for (let i = 0; i < config.clinicIds.length; i++) {
    const clinicId = config.clinicIds[i];
    
    // Progress callback
    if (onProgress) {
      onProgress(i, config.clinicIds.length, clinicId);
    }

    try {
      // Get clinic data from Firestore
      const clinicDoc = await admin.firestore().collection('clinics').doc(clinicId).get();
      
      if (!clinicDoc.exists) {
        results.errors.push(`Clinic ${clinicId} not found`);
        results.failed++;
        continue;
      }

      const clinicData = clinicDoc.data();
      let clinicReviewsImported = 0;

      // Update Google reviews if enabled and Google Places ID exists
      if (config.enableGoogleReviews && clinicData.googlePlacesId) {
        try {
          console.log(`Fetching Google reviews for clinic ${clinicId}`);
          const googleResult = await reviewAggregator.fetchGoogleReviews(clinicId, clinicData.googlePlacesId);
          
          if (googleResult.success) {
            clinicReviewsImported += googleResult.reviewsImported || 0;
            results.googleReviews += googleResult.reviewsImported || 0;
            console.log(`✅ Google reviews for ${clinicId}: ${googleResult.reviewsImported || 0} imported`);
          } else {
            results.errors.push(`Google reviews for ${clinicId}: ${googleResult.error}`);
          }
          
          // Rate limiting
          await sleep(config.rateLimitMs);
        } catch (error) {
          results.errors.push(`Google reviews error for ${clinicId}: ${error.message}`);
        }
      }

      // Yelp reviews have been removed from the system
      // Previously handled Yelp review updates here

      // Update clinic metadata if any reviews were imported
      if (clinicReviewsImported > 0) {
        try {
          await updateClinicMetadata(clinicId);
          console.log(`✅ Updated metadata for clinic ${clinicId}`);
        } catch (error) {
          results.errors.push(`Metadata update error for ${clinicId}: ${error.message}`);
        }
      }

      results.totalReviewsImported += clinicReviewsImported;
      results.successful++;

    } catch (error) {
      console.error(`Error processing clinic ${clinicId}:`, error);
      results.errors.push(`Processing error for ${clinicId}: ${error.message}`);
      results.failed++;
    }
  }

  // Final progress update
  if (onProgress) {
    onProgress(config.clinicIds.length, config.clinicIds.length, '');
  }

  console.log('Review update completed:', {
    totalClinics: results.totalClinics,
    successful: results.successful,
    failed: results.failed,
    totalReviewsImported: results.totalReviewsImported,
    googleReviews: results.googleReviews,
    yelpReviews: results.yelpReviews,
    errorCount: results.errors.length
  });

  return results;
}

/**
 * Update reviews for clinics from a discovery session
 * 
 * @param {string} discoverySessionId - The discovery session ID
 * @param {Object} config - Configuration for review updates
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - Update results
 */
async function updateDiscoveredClinicReviews(discoverySessionId, config, onProgress) {
  try {
    console.log(`Finding clinics from discovery session: ${discoverySessionId}`);
    
    // Find clinics from this discovery session
    // Since we don't have direct session tracking, find recently added clinics
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const clinicsSnapshot = await admin.firestore()
      .collection('clinics')
      .where('discoverySource', '==', 'automated_discovery')
      .where('createdAt', '>=', oneDayAgo)
      .get();

    const discoveredClinics = clinicsSnapshot.docs.map(doc => doc.id);
    
    if (discoveredClinics.length === 0) {
      console.log('No recently discovered clinics found');
      return {
        totalClinics: 0,
        successful: 0,
        failed: 0,
        totalReviewsImported: 0,
        googleReviews: 0,
        yelpReviews: 0,
        errors: []
      };
    }

    console.log(`Found ${discoveredClinics.length} recently discovered clinics`);
    
    // Update reviews for discovered clinics
    return await updateMultipleClinicReviews({
      ...config,
      clinicIds: discoveredClinics
    }, onProgress);

  } catch (error) {
    console.error('Error finding discovered clinics:', error);
    throw error;
  }
}

/**
 * Update clinic metadata after review import
 * 
 * @param {string} clinicId - The clinic ID
 * @returns {Promise<void>}
 */
async function updateClinicMetadata(clinicId) {
  try {
    // Get all reviews for this clinic
    const reviewsSnapshot = await admin.firestore()
      .collection('clinics')
      .doc(clinicId)
      .collection('reviews')
      .get();

    const reviews = reviewsSnapshot.docs.map(doc => doc.data());
    
    // Calculate aggregate metrics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews 
      : 0;
    
    // Count by source
    const googleReviews = reviews.filter(r => r.source === 'google').length;
    const yelpReviews = reviews.filter(r => r.source === 'yelp').length;
    const healthgradesReviews = reviews.filter(r => r.source === 'healthgrades').length;
    
    // Update clinic document
    await admin.firestore().collection('clinics').doc(clinicId).update({
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      googleReviewCount: googleReviews,
      yelpReviewCount: yelpReviews,
      healthgradesReviewCount: healthgradesReviews,
      lastReviewUpdate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
  } catch (error) {
    console.error(`Error updating clinic metadata for ${clinicId}:`, error);
    throw error;
  }
}

/**
 * Sleep utility for rate limiting
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  updateMultipleClinicReviews,
  updateDiscoveredClinicReviews,
  updateClinicMetadata
};