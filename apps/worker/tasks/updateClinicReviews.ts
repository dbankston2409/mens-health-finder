const reviewIntegration = require('../utils/reviewIntegration.js');

export interface ReviewUpdateTaskConfig {
  enableGoogleReviews?: boolean;
  maxReviewsPerSource?: number;
  rateLimitMs?: number;
  clinicIds?: string[];
  discoverySessionId?: string;
  batchSize?: number;
  enableLogging?: boolean;
}

export async function updateClinicReviews(config: ReviewUpdateTaskConfig): Promise<{
  success: boolean;
  totalClinics: number;
  successfulUpdates: number;
  totalReviewsImported: number;
  errors: string[];
  duration: number;
}> {
  const startTime = Date.now();
  console.log('Review update task initiated with config:', {
    ...config,
    clinicIds: config.clinicIds ? `${config.clinicIds.length} clinics` : 'none specified'
  });

  try {
    // Log the configuration
    console.log('Review Update Configuration:');
    console.log(`  Enable Google Reviews: ${config.enableGoogleReviews ?? true}`);
    console.log(`  Rate Limit: ${config.rateLimitMs ?? 1000}ms`);
    console.log(`  Batch Size: ${config.batchSize ?? 50}`);
    console.log(`  Logging Enabled: ${config.enableLogging ?? true}`);
    
    if (config.discoverySessionId) {
      console.log(`  Discovery Session: ${config.discoverySessionId}`);
    }
    
    if (config.clinicIds) {
      console.log(`  Clinic IDs: ${config.clinicIds.length} specified`);
    }

    // Progress tracking
    const onProgress = config.enableLogging 
      ? (completed: number, total: number, current: string) => {
          if (completed % 10 === 0 || completed === total) {
            console.log(`Review update progress: ${completed}/${total} clinics completed. Current: ${current}`);
          }
        }
      : undefined;

    // Prepare configuration for review integration
    const integrationConfig = {
      enableGoogleReviews: config.enableGoogleReviews ?? true,
      rateLimitMs: config.rateLimitMs ?? 1000,
      clinicIds: config.clinicIds || []
    };

    let results;

    if (config.discoverySessionId) {
      // Update reviews for discovered clinics
      console.log('Updating reviews for discovered clinics...');
      results = await reviewIntegration.updateDiscoveredClinicReviews(
        config.discoverySessionId,
        integrationConfig,
        onProgress
      );
    } else if (config.clinicIds && config.clinicIds.length > 0) {
      // Update reviews for specific clinics
      console.log('Updating reviews for specified clinics...');
      results = await reviewIntegration.updateMultipleClinicReviews(
        integrationConfig,
        onProgress
      );
    } else {
      throw new Error('Either clinicIds or discoverySessionId must be provided');
    }
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      totalClinics: results.totalClinics,
      successfulUpdates: results.successful,
      totalReviewsImported: results.totalReviewsImported,
      errors: results.errors,
      duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Review update task failed:', error);
    
    return {
      success: false,
      totalClinics: 0,
      successfulUpdates: 0,
      totalReviewsImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      duration
    };
  }
}

// CLI interface for running this task
export async function runReviewUpdateCLI(args: string[]) {
  const config: ReviewUpdateTaskConfig = {
    enableGoogleReviews: true,
    maxReviewsPerSource: 100,
    rateLimitMs: 1000,
    batchSize: 50,
    enableLogging: true
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--discovery-session':
        config.discoverySessionId = args[++i];
        break;
      case '--clinic-ids':
        config.clinicIds = args[++i].split(',');
        break;
      case '--max-reviews':
        config.maxReviewsPerSource = parseInt(args[++i], 10);
        break;
      case '--rate-limit':
        config.rateLimitMs = parseInt(args[++i], 10);
        break;
      case '--batch-size':
        config.batchSize = parseInt(args[++i], 10);
        break;
      case '--no-google':
        config.enableGoogleReviews = false;
        break;
      case '--quiet':
        config.enableLogging = false;
        break;
    }
  }

  console.log('Running clinic review update with config:', {
    ...config,
    clinicIds: config.clinicIds ? `${config.clinicIds.length} clinic IDs` : 'none'
  });

  const result = await updateClinicReviews(config);
  
  if (result.success) {
    console.log('✅ Review update completed successfully!');
    console.log(`📊 Updated ${result.successfulUpdates}/${result.totalClinics} clinics`);
    console.log(`📝 Imported ${result.totalReviewsImported} total reviews`);
    console.log(`⏱️  Completed in ${Math.round(result.duration / 1000)}s`);
    
    if (result.errors.length > 0) {
      console.log(`⚠️  ${result.errors.length} error(s) encountered`);
    }
  } else {
    console.error('❌ Review update failed');
    if (result.errors.length > 0) {
      console.error('Errors:', result.errors.slice(0, 5));
    }
    process.exit(1);
  }
}

// Example usage:
// npm run worker review-update --discovery-session session_123456789
// npm run worker review-update --clinic-ids clinic1,clinic2,clinic3 --max-reviews 20
// npm run worker review-update --discovery-session session_123
// npm run worker review-update --clinic-ids clinic1 --batch-size 10 --quiet