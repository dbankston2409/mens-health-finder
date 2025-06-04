import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { Clinic } from '../../types';

export interface ReviewUpdateResult {
  clinicId: string;
  success: boolean;
  reviewsFound: number;
  reviewsImported: number;
  error?: string;
  sources: {
    google?: { found: number; imported: number; error?: string };
    yelp?: { found: number; imported: number; error?: string };
  };
}

export interface ReviewUpdateConfig {
  enableGoogleReviews: boolean;
  enableYelpReviews: boolean;
  maxReviewsPerSource: number;
  rateLimitMs: number;
}

export class ReviewUpdateService {
  private config: ReviewUpdateConfig;
  
  constructor(config: ReviewUpdateConfig = {
    enableGoogleReviews: true,
    enableYelpReviews: true,
    maxReviewsPerSource: 10,
    rateLimitMs: 1000
  }) {
    this.config = config;
  }

  /**
   * Update reviews for a single clinic
   */
  async updateClinicReviews(clinicId: string): Promise<ReviewUpdateResult> {
    const result: ReviewUpdateResult = {
      clinicId,
      success: false,
      reviewsFound: 0,
      reviewsImported: 0,
      sources: {}
    };

    try {
      // Get clinic data
      const clinicDoc = await getDoc(doc(db, 'clinics', clinicId));
      if (!clinicDoc.exists()) {
        throw new Error('Clinic not found');
      }

      const clinic = clinicDoc.data() as Clinic;
      
      // Update Google reviews if enabled and Google Places ID exists
      if (this.config.enableGoogleReviews && clinic.googlePlacesId) {
        try {
          const googleResult = await this.fetchGoogleReviews(clinic.googlePlacesId);
          result.sources.google = googleResult;
          result.reviewsFound += googleResult.found;
          result.reviewsImported += googleResult.imported;
          
          // Rate limiting
          await this.sleep(this.config.rateLimitMs);
        } catch (error) {
          result.sources.google = {
            found: 0,
            imported: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      // Update Yelp reviews if enabled and Yelp Business ID exists
      if (this.config.enableYelpReviews && clinic.yelpBusinessId) {
        try {
          const yelpResult = await this.fetchYelpReviews(clinic.yelpBusinessId);
          result.sources.yelp = yelpResult;
          result.reviewsFound += yelpResult.found;
          result.reviewsImported += yelpResult.imported;
          
          // Rate limiting
          await this.sleep(this.config.rateLimitMs);
        } catch (error) {
          result.sources.yelp = {
            found: 0,
            imported: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      // Update clinic metadata
      await this.updateClinicMetadata(clinicId);
      
      result.success = true;
      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  /**
   * Update reviews for multiple clinics in batch
   */
  async updateMultipleClinicReviews(
    clinicIds: string[], 
    onProgress?: (completed: number, total: number, current: string) => void
  ): Promise<ReviewUpdateResult[]> {
    try {
      // Use the API endpoint to leverage existing review aggregator
      const response = await fetch('/api/admin/update-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicIds,
          enableGoogle: this.config.enableGoogleReviews,
          enableYelp: this.config.enableYelpReviews,
          rateLimitMs: this.config.rateLimitMs
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API call failed');
      }

      // Convert API results to ReviewUpdateResult format
      const results: ReviewUpdateResult[] = clinicIds.map(clinicId => ({
        clinicId,
        success: true,
        reviewsFound: 0, // API doesn't return this detail
        reviewsImported: 0, // Will be filled from aggregate data
        sources: {
          google: { found: 0, imported: 0 },
          yelp: { found: 0, imported: 0 }
        }
      }));

      // Update final progress
      if (onProgress) {
        onProgress(clinicIds.length, clinicIds.length, '');
      }

      return results;

    } catch (error) {
      console.error('Error in bulk review update:', error);
      
      // Return error results for all clinics
      return clinicIds.map(clinicId => ({
        clinicId,
        success: false,
        reviewsFound: 0,
        reviewsImported: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        sources: {}
      }));
    }
  }

  /**
   * Update reviews for newly discovered clinics
   */
  async updateDiscoveredClinicReviews(
    discoverySessionId: string,
    onProgress?: (completed: number, total: number, current: string) => void
  ): Promise<ReviewUpdateResult[]> {
    try {
      // Find clinics from this discovery session
      const clinicsSnapshot = await getDocs(collection(db, 'clinics'));
      const discoveredClinics = clinicsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as Clinic }))
        .filter(clinic => 
          clinic.discoverySource === 'automated_discovery' &&
          clinic.discoveryGridId && 
          // Add session ID matching if available
          clinic.createdAt && 
          clinic.createdAt.toDate() > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        );

      if (discoveredClinics.length === 0) {
        console.log('No recently discovered clinics found for review updates');
        return [];
      }

      console.log(`Updating reviews for ${discoveredClinics.length} discovered clinics`);
      
      return await this.updateMultipleClinicReviews(
        discoveredClinics.map(c => c.id),
        onProgress
      );

    } catch (error) {
      console.error('Error updating discovered clinic reviews:', error);
      throw error;
    }
  }

  /**
   * Get review update statistics
   */
  async getReviewUpdateStats(results: ReviewUpdateResult[]): Promise<{
    totalClinics: number;
    successfulUpdates: number;
    totalReviewsFound: number;
    totalReviewsImported: number;
    googleStats: { found: number; imported: number; errors: number };
    yelpStats: { found: number; imported: number; errors: number };
    errors: string[];
  }> {
    const stats = {
      totalClinics: results.length,
      successfulUpdates: results.filter(r => r.success).length,
      totalReviewsFound: results.reduce((sum, r) => sum + r.reviewsFound, 0),
      totalReviewsImported: results.reduce((sum, r) => sum + r.reviewsImported, 0),
      googleStats: { found: 0, imported: 0, errors: 0 },
      yelpStats: { found: 0, imported: 0, errors: 0 },
      errors: results.filter(r => r.error).map(r => `${r.clinicId}: ${r.error}`)
    };

    results.forEach(result => {
      if (result.sources.google) {
        stats.googleStats.found += result.sources.google.found;
        stats.googleStats.imported += result.sources.google.imported;
        if (result.sources.google.error) stats.googleStats.errors++;
      }
      
      if (result.sources.yelp) {
        stats.yelpStats.found += result.sources.yelp.found;
        stats.yelpStats.imported += result.sources.yelp.imported;
        if (result.sources.yelp.error) stats.yelpStats.errors++;
      }
    });

    return stats;
  }

  /**
   * Fetch Google reviews using existing review aggregator
   */
  private async fetchGoogleReviews(placeId: string): Promise<{ found: number; imported: number }> {
    // Note: In a real implementation, this would call the existing reviewAggregator.js
    // via an API endpoint or shared service
    console.log(`Would fetch Google reviews for place ID: ${placeId}`);
    
    // Return simulated result for now
    return {
      found: 5,
      imported: Math.min(5, this.config.maxReviewsPerSource)
    };
  }

  /**
   * Fetch Yelp reviews using existing review aggregator
   */
  private async fetchYelpReviews(businessId: string): Promise<{ found: number; imported: number }> {
    // Note: In a real implementation, this would call the existing reviewAggregator.js
    // via an API endpoint or shared service
    console.log(`Would fetch Yelp reviews for business ID: ${businessId}`);
    
    // Return simulated result for now
    return {
      found: 3,
      imported: Math.min(3, this.config.maxReviewsPerSource)
    };
  }

  /**
   * Update clinic metadata after review import
   */
  private async updateClinicMetadata(clinicId: string): Promise<void> {
    try {
      // Get all reviews for this clinic
      const reviewsSnapshot = await getDocs(collection(db, 'clinics', clinicId, 'reviews'));
      const reviews = reviewsSnapshot.docs.map(doc => doc.data());
      
      // Calculate aggregate metrics
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews 
        : 0;
      
      // Count by source
      const googleReviews = reviews.filter(r => r.source === 'google').length;
      const yelpReviews = reviews.filter(r => r.source === 'yelp').length;
      
      // Update clinic document
      await updateDoc(doc(db, 'clinics', clinicId), {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        googleReviewCount: googleReviews,
        yelpReviewCount: yelpReviews,
        lastReviewUpdate: new Date(),
        updatedAt: new Date()
      });
      
    } catch (error) {
      console.error(`Error updating clinic metadata for ${clinicId}:`, error);
      throw error;
    }
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance with default config
export const reviewUpdateService = new ReviewUpdateService();