/**
 * Review Aggregator Service
 * 
 * Fetches reviews from various sources and saves them to Firestore
 * Supports Google, Yelp, and Healthgrades
 */

const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');
const { initializeApp } = require('firebase-admin/app');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
let firestore;

if (!admin.apps.length) {
  initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')})});
  
  firestore = admin.firestore();
} else {
  firestore = admin.firestore();
}

// Sleep utility for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Save review to Firestore
 * 
 * @param {string} clinicId - The clinic ID
 * @param {Object} review - The review data to save
 * @returns {Promise<boolean>} - Success status
 */
async function saveReview(clinicId, review) {
  try {
    // Generate a unique ID based on source and content
    const idComponents = [
      review.source,
      review.author || 'anonymous',
      review.text.slice(0, 40).replace(/\s+/g, '-').toLowerCase()
    ];
    
    const reviewId = idComponents.join('_');
    
    // Check if review already exists
    const existingRef = firestore.collection('clinics').doc(clinicId).collection('reviews').doc(reviewId);
    const existingDoc = await existingRef.get();
    
    if (existingDoc.exists) {
      // Only update existing review if the content has changed
      if (existingDoc.data().text !== review.text || existingDoc.data().rating !== review.rating) {
        await existingRef.update({
          text: review.text,
          rating: review.rating,
          updated: admin.firestore.FieldValue.serverTimestamp()
        });
        return true;
      }
      return false; // No update needed
    } else {
      // Create new review
      await existingRef.set({
        ...review,
        date: review.date || admin.firestore.FieldValue.serverTimestamp(),
        created: admin.firestore.FieldValue.serverTimestamp()
      });
      return true;
    }
  } catch (error) {
    console.error(`Error saving review for clinic ${clinicId}:`, error);
    return false;
  }
}

/**
 * Fetch Google reviews using Places API
 * 
 * @param {string} clinicId - The clinic ID
 * @param {string} placesId - The Google Places ID
 * @returns {Promise<Object>} - Reviews and success status
 */
async function fetchGoogleReviews(clinicId, placesId) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return { success: false, error: 'Google Maps API key not found' };
  }
  
  if (!placesId) {
    return { success: false, error: 'No Google Places ID provided' };
  }
  
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placesId}&fields=reviews,rating,user_ratings_total&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    
    const response = await axios.get(url);
    
    if (!response.data.result) {
      return { success: false, error: 'No result from Google Places API' };
    }
    
    const { reviews = [], rating, user_ratings_total } = response.data.result;
    
    // Process and save reviews
    let savedCount = 0;
    
    for (const review of reviews) {
      const reviewData = {
        source: 'google',
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        date: new Date(review.time * 1000),
        url: review.author_url,
        verified: true
      };
      
      const saved = await saveReview(clinicId, reviewData);
      if (saved) savedCount++;
    }
    
    // Update the clinic document with review counts
    await firestore.collection('clinics').doc(clinicId).update({
      googleRating: rating || 0,
      googleReviewCount: user_ratings_total || 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { 
      success: true, 
      savedCount,
      totalCount: reviews.length,
      averageRating: rating
    };
  } catch (error) {
    console.error(`Error fetching Google reviews for ${clinicId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch Yelp reviews - DEPRECATED AND REMOVED
 * Yelp integration has been removed to save $600/month
 * 
 * @param {string} clinicId - The clinic ID
 * @param {string} yelpBusinessId - The Yelp business ID
 * @returns {Promise<Object>} - Empty result
 */
async function fetchYelpReviews(clinicId, yelpBusinessId) {
  console.log('Yelp reviews have been deprecated and removed');
  return { 
    success: false, 
    error: 'Yelp integration has been removed',
    reviews: [],
    totalCount: 0
  };
}

// Original broken Yelp function has been removed
// The function had syntax errors and incomplete implementation

/**
 * Fetch Healthgrades reviews by scraping the public profile
 * 
 * Note: Web scraping is subject to change if the site structure changes.
 * A better approach would be to use an official API if available.
 * 
 * @param {string} clinicId - The clinic ID
 * @param {string} healthgradesUrl - The Healthgrades profile URL
 * @returns {Promise<Object>} - Reviews and success status
 */
async function fetchHealthgradesReviews(clinicId, healthgradesUrl) {
  if (!healthgradesUrl) {
    return { success: false, error: 'No Healthgrades URL provided' };
  }
  
  try {
    // Fetch the page HTML
    const response = await axios.get(healthgradesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract reviews
    const reviews = [];
    let averageRating = 0;
    let reviewCount = 0;
    
    // Find the average rating
    const ratingText = $('.c-star-rating__value').first().text();
    if (ratingText) {
      averageRating = parseFloat(ratingText);
    }
    
    // Find the review count
    const countText = $('.c-reviews-summary__count').first().text();
    if (countText) {
      reviewCount = parseInt(countText.match(/\d+/)[0], 10);
    }
    
    // Extract reviews
    $('.c-single-review').each((i, el) => {
      const reviewElement = $(el);
      
      const authorEl = reviewElement.find('.c-single-review__name');
      const author = authorEl.text().trim() || 'Anonymous';
      
      const dateEl = reviewElement.find('.c-single-review__date');
      const dateStr = dateEl.text().trim();
      const date = dateStr ? new Date(dateStr) : new Date();
      
      const ratingEl = reviewElement.find('.c-star-rating__value');
      const rating = ratingEl.text().trim() ? parseFloat(ratingEl.text().trim()) : 0;
      
      const textEl = reviewElement.find('.c-single-review__text');
      const text = textEl.text().trim();
      
      if (text) {
        reviews.push({
          source: 'healthgrades',
          author,
          rating,
          text,
          date,
          url: healthgradesUrl,
          verified: true
        });
      }
    });
    
    // Process and save reviews
    let savedCount = 0;
    
    for (const review of reviews) {
      const saved = await saveReview(clinicId, review);
      if (saved) savedCount++;
    }
    
    // Update the clinic document with review counts
    await firestore.collection('clinics').doc(clinicId).update({
      healthgradesRating: averageRating || 0,
      healthgradesReviewCount: reviewCount || 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { 
      success: true, 
      savedCount,
      totalCount: reviews.length,
      averageRating
    };
  } catch (error) {
    console.error(`Error fetching Healthgrades reviews for ${clinicId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Update overall review metrics for a clinic
 * 
 * @param {string} clinicId - The clinic ID
 * @returns {Promise<Object>} - Updated metrics
 */
async function updateClinicReviewMetrics(clinicId) {
  try {
    // Get all reviews for this clinic
    const reviewsSnapshot = await firestore
      .collection('clinics')
      .doc(clinicId)
      .collection('reviews')
      .get();
    
    const reviews = [];
    reviewsSnapshot.forEach(doc => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Calculate overall metrics
    const totalReviewCount = reviews.length;
    const totalRatingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalReviewCount > 0 
      ? (totalRatingSum / totalReviewCount).toFixed(1)
      : 0;
      
    // Calculate rating distribution
    const distribution = {};
    for (let i = 1; i <= 5; i++) {
      distribution[i] = reviews.filter(review => Math.round(review.rating) === i).length;
    }
    
    // Update the clinic document
    await firestore.collection('clinics').doc(clinicId).update({
      reviewStats: {
        averageRating: parseFloat(averageRating),
        count: totalReviewCount,
        distribution
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      averageRating: parseFloat(averageRating),
      count: totalReviewCount,
      distribution
    };
  } catch (error) {
    console.error(`Error updating review metrics for ${clinicId}:`, error);
    return null;
  }
}

/**
 * Fetch all reviews for a clinic
 * 
 * @param {string} clinicId - The clinic ID
 * @param {Object} externalIds - External IDs for the clinic
 * @returns {Promise<Object>} - Aggregated results
 */
async function fetchAllReviews(clinicId, externalIds) {
  const results = {
    google: { success: false },
    yelp: { success: false },
    healthgrades: { success: false }
  };
  
  // Fetch Google reviews if we have a Places ID
  if (externalIds.googlePlacesId) {
    results.google = await fetchGoogleReviews(clinicId, externalIds.googlePlacesId);
    
    // Respect rate limits
    await sleep(1000);
  }
  
  // Fetch Yelp reviews if we have a Yelp Business ID

  // Update overall metrics
  const updatedMetrics = await updateClinicReviewMetrics(clinicId);
  
  return {
    results,
    metrics: updatedMetrics
  };
}

/**
 * Refresh reviews for all clinics
 * 
 * @param {number} batchSize - Number of clinics to process in a batch
 * @returns {Promise<Object>} - Aggregated results
 */
async function refreshAllClinicsReviews(batchSize = 10) {
  console.log('Starting review refresh for all clinics...');
  
  // Get all clinics with external IDs
  const clinicsSnapshot = await firestore.collection('clinics').get();
  
  const clinics = [];
  clinicsSnapshot.forEach(doc => {
    clinics.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  console.log(`Found ${clinics.length} clinics to process`);
  
  const results = {
    totalClinics: clinics.length,
    processedClinics: 0,
    successfulClinics: 0,
    failedClinics: 0,
    skippedClinics: 0,
    reviewsFetched: 0,
    errors: []
  };
  
  // Process in batches
  for (let i = 0; i < clinics.length; i += batchSize) {
    const batch = clinics.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} (${batch.length} clinics)...`);
    
    // Process each clinic in the batch
    await Promise.all(batch.map(async (clinic) => {
      try {
        results.processedClinics++;
        
        // Skip if no external IDs
        if (!clinic.googlePlacesId && !clinic.yelpId && !clinic.external_ids?.googlePlacesId && !clinic.external_ids?.yelpId) {
          console.log(`Skipping ${clinic.name}: No external IDs`);
          results.skippedClinics++;
          return;
        }
        
        // Combine all possible external ID locations
        const externalIds = {
          googlePlacesId: clinic.externalIds?.googlePlacesId || clinic.googlePlacesId};
        
        console.log(`Fetching reviews for ${clinic.id} (${clinic.name})...`);
        
        // Fetch reviews for this clinic
        const clinicResults = await fetchAllReviews(clinic.id, externalIds);
        
        // Count successful sources
        const successSources = Object.values(clinicResults.results)
          .filter(result => result.success)
          .length;
        
        // Count total reviews fetched
        const reviewCount = Object.values(clinicResults.results)
          .reduce((sum, result) => sum + (result.savedCount || 0), 0);
        
        results.reviewsFetched += reviewCount;
        
        if (successSources > 0) {
          results.successfulClinics++;
          console.log(`✅ Successfully fetched ${reviewCount} reviews for ${clinic.name}`);
        } else {
          results.failedClinics++;
          console.log(`❌ Failed to fetch reviews for ${clinic.name}`);
          results.errors.push(`Failed to fetch reviews for clinic ${clinic.id} (${clinic.name})`);
        }
      } catch (error) {
        results.failedClinics++;
        console.error(`Error processing clinic ${clinic.id} (${clinic.name}):`, error);
        results.errors.push(`Error: ${error.message} for clinic ${clinic.id} (${clinic.name})`);
      }
    }));
    
    // Respect rate limits between batches
    if (i + batchSize < clinics.length) {
      console.log(`Sleeping for 5 seconds before next batch...`);
      await sleep(5000);
    }
  }
  
  console.log('Review refresh complete!');
  console.log(`Processed ${results.processedClinics} clinics:`);
  console.log(`- ${results.successfulClinics} successful`);
  console.log(`- ${results.failedClinics} failed`);
  console.log(`- ${results.skippedClinics} skipped`);
  console.log(`- ${results.reviewsFetched} reviews fetched`);
  
  return results;
}

/**
 * Refresh reviews for a specific clinic
 * 
 * @param {string} clinicId - The clinic ID
 * @returns {Promise<Object>} - Results of the refresh
 */
async function refreshClinicReviews(clinicId) {
  try {
    console.log(`Starting review refresh for clinic ${clinicId}...`);
    
    // Get the clinic data
    const clinicDoc = await firestore.collection('clinics').doc(clinicId).get();
    
    if (!clinicDoc.exists) {
      console.error(`Clinic ${clinicId} not found`);
      return { success: false, error: 'Clinic not found' };
    }
    
    const clinic = {
      id: clinicDoc.id,
      ...clinicDoc.data()
    };
    
    // Combine all possible external ID locations
    const externalIds = {
      googlePlacesId: clinic.externalIds?.googlePlacesId || clinic.googlePlacesId};
    
    // Skip if no external IDs
    if (!externalIds.googlePlacesId && !externalIds.yelpId) {
      console.log(`Skipping ${clinic.name}: No external IDs`);
      return { success: false, error: 'No external IDs found for this clinic' };
    }
    
    // Fetch reviews for this clinic
    const result = await fetchAllReviews(clinicId, externalIds);
    
    // Count successful sources
    const successSources = Object.values(result.results)
      .filter(sourceResult => sourceResult.success)
      .length;
    
    // Count total reviews fetched
    const reviewCount = Object.values(result.results)
      .reduce((sum, sourceResult) => sum + (sourceResult.savedCount || 0), 0);
    
    console.log(`Review refresh complete for ${clinic.name}`);
    console.log(`- ${reviewCount} reviews fetched`);
    console.log(`- ${successSources}/3 sources successful`);
    
    return {
      success: successSources > 0,
      clinic: {
        id: clinic.id,
        name: clinic.name
      },
      sources: result.results,
      metrics: result.metrics,
      reviewsFetched: reviewCount
    };
  } catch (error) {
    console.error(`Error refreshing reviews for clinic ${clinicId}:`, error);
    return { success: false, error: error.message };
  }
}

// If this file is run directly, refresh all clinics
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === '--clinic') {
    // Refresh a single clinic
    const clinicId = args[1];
    if (!clinicId) {
      console.error('Please provide a clinic ID');
      process.exit(1);
    }
    
    refreshClinicReviews(clinicId)
      .then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
      })
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  } else {
    // Refresh all clinics
    refreshAllClinicsReviews()
      .then(results => {
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
      })
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  }
}

// Export functions for use by other modules
module.exports = {
  fetchGoogleReviews,
  fetchYelpReviews,
  fetchHealthgradesReviews,
  fetchAllReviews,
  refreshAllClinicsReviews,
  refreshClinicReviews,
  updateClinicReviewMetrics
};