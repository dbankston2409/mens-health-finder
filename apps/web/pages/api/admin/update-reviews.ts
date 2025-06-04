import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

// This API endpoint bridges the web app with the existing review aggregator
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clinicIds, enableGoogle, enableYelp, rateLimitMs } = req.body;

    if (!clinicIds || !Array.isArray(clinicIds) || clinicIds.length === 0) {
      return res.status(400).json({ error: 'clinicIds array is required' });
    }

    // Import the existing review aggregator
    const reviewAggregatorPath = path.join(process.cwd(), '../../../scripts/services/reviewAggregator.js');
    const reviewAggregator = require(reviewAggregatorPath);

    const results = {
      totalClinics: clinicIds.length,
      successful: 0,
      failed: 0,
      totalReviewsImported: 0,
      googleReviews: 0,
      yelpReviews: 0,
      errors: []
    };

    // Process each clinic
    for (const clinicId of clinicIds) {
      try {
        let clinicReviewsImported = 0;

        // Fetch Google reviews if enabled
        if (enableGoogle) {
          try {
            const googleResult = await reviewAggregator.fetchGoogleReviews(clinicId);
            if (googleResult.success) {
              clinicReviewsImported += googleResult.reviewsImported || 0;
              results.googleReviews += googleResult.reviewsImported || 0;
            } else {
              results.errors.push(`Google reviews for ${clinicId}: ${googleResult.error}`);
            }
          } catch (error) {
            results.errors.push(`Google reviews error for ${clinicId}: ${error.message}`);
          }
        }

        // Fetch Yelp reviews if enabled
        : ${yelpResult.error}`);
            }
          } catch (error) {
            results.errors.push(`Yelp reviews error for ${clinicId}: ${error.message}`);
          }
        }

        results.totalReviewsImported += clinicReviewsImported;
        results.successful++;

        // Rate limiting
        if (rateLimitMs && rateLimitMs > 0) {
          await new Promise(resolve => setTimeout(resolve, rateLimitMs));
        }

      } catch (error) {
        results.errors.push(`Processing error for ${clinicId}: ${error.message}`);
        results.failed++;
      }
    }

    res.status(200).json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Review update API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}