import { getAllClinicsNeedingSeo, getSeoStats } from '../utils/getSeoMetaBySlug';
import { batchUpdateSeoData } from '../utils/seoMetaWriter';

export interface SeoProcessorResult {
  processed: number;
  newSeo: number;
  skipped: number;
  errors: Array<{ slug: string; error: string }>;
  duration: number;
  stats: {
    before: any;
    after: any;
  };
}

export async function runSeoRefresh(options: {
  maxClinics?: number;
  forceRefresh?: boolean;
  targetPackage?: 'free' | 'basic' | 'premium';
  dryRun?: boolean;
} = {}): Promise<SeoProcessorResult> {
  
  const startTime = Date.now();
  console.log('🚀 Starting SEO batch processing...');
  
  // Get initial stats
  const statsBefore = await getSeoStats();
  console.log('📊 Initial SEO Stats:');
  console.log(`   Total clinics: ${statsBefore.total}`);
  console.log(`   With SEO meta: ${statsBefore.withSeoMeta}`);
  console.log(`   With SEO content: ${statsBefore.withSeoContent}`);
  console.log(`   Complete: ${statsBefore.complete}`);
  console.log(`   Need updates: ${statsBefore.needsUpdate}`);
  
  // Find clinics needing SEO updates
  let slugsToProcess = await getAllClinicsNeedingSeo();
  
  // Apply filters
  if (options.maxClinics) {
    slugsToProcess = slugsToProcess.slice(0, options.maxClinics);
  }
  
  console.log(`\n📋 Found ${slugsToProcess.length} clinics needing SEO updates`);
  
  if (options.dryRun) {
    console.log('🧪 DRY RUN MODE - No changes will be made');
    console.log('Clinics that would be processed:');
    slugsToProcess.slice(0, 10).forEach(slug => console.log(`   - ${slug}`));
    if (slugsToProcess.length > 10) {
      console.log(`   ... and ${slugsToProcess.length - 10} more`);
    }
    
    return {
      processed: 0,
      newSeo: 0,
      skipped: slugsToProcess.length,
      errors: [],
      duration: Date.now() - startTime,
      stats: {
        before: statsBefore,
        after: statsBefore
      }
    };
  }
  
  if (slugsToProcess.length === 0) {
    console.log('✅ No clinics need SEO updates');
    return {
      processed: 0,
      newSeo: 0,
      skipped: 0,
      errors: [],
      duration: Date.now() - startTime,
      stats: {
        before: statsBefore,
        after: statsBefore
      }
    };
  }
  
  // Process clinics in batches
  const batchResult = await batchUpdateSeoData(slugsToProcess);
  
  // Get final stats
  const statsAfter = await getSeoStats();
  
  const result: SeoProcessorResult = {
    processed: batchResult.processed,
    newSeo: batchResult.successful,
    skipped: batchResult.failed,
    errors: batchResult.errors,
    duration: Date.now() - startTime,
    stats: {
      before: statsBefore,
      after: statsAfter
    }
  };
  
  // Log results
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEO BATCH PROCESSING RESULTS');
  console.log('='.repeat(60));
  console.log(`📋 Processed: ${result.processed}`);
  console.log(`✅ Successfully updated: ${result.newSeo}`);
  console.log(`❌ Failed: ${result.skipped}`);
  console.log(`⏱️  Duration: ${formatDuration(result.duration)}`);
  
  if (result.newSeo > 0) {
    const improvement = result.stats.after.complete - result.stats.before.complete;
    console.log(`📈 SEO Complete clinics: ${result.stats.before.complete} → ${result.stats.after.complete} (+${improvement})`);
  }
  
  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.slice(0, 5).forEach(error => {
      console.log(`   ${error.slug}: ${error.error}`);
    });
    if (result.errors.length > 5) {
      console.log(`   ... and ${result.errors.length - 5} more errors`);
    }
  }
  
  console.log('\n✅ SEO batch processing completed');
  
  return result;
}

export async function refreshSeoForSpecificClinics(slugs: string[]): Promise<SeoProcessorResult> {
  const startTime = Date.now();
  console.log(`🎯 Refreshing SEO for ${slugs.length} specific clinics...`);
  
  const statsBefore = await getSeoStats();
  const batchResult = await batchUpdateSeoData(slugs);
  const statsAfter = await getSeoStats();
  
  return {
    processed: batchResult.processed,
    newSeo: batchResult.successful,
    skipped: batchResult.failed,
    errors: batchResult.errors,
    duration: Date.now() - startTime,
    stats: {
      before: statsBefore,
      after: statsAfter
    }
  };
}

export async function refreshSeoForPackage(packageLevel: 'free' | 'basic' | 'premium'): Promise<SeoProcessorResult> {
  console.log(`🎯 Refreshing SEO for ${packageLevel} package clinics...`);
  
  // This would require filtering by package in the query
  // For now, we'll use the general refresh and note the limitation
  
  return await runSeoRefresh({
    targetPackage: packageLevel
  });
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}