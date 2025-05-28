import { buildSitemap, getSitemapStats } from '../utils/buildSitemap';
import { pingGSC } from '../utils/pingGSC';
import { seoIndexingJob } from './seoIndexingJob';
import { updateAdminStats, updateSitemapStats } from '../utils/adminStatsUpdater';

interface SeoAuditResult {
  sitemap: {
    success: boolean;
    urlCount: number;
    filePath?: string;
    error?: string;
  };
  ping: {
    success: boolean;
    responseTime: number;
    error?: string;
  };
  indexing: {
    processed: number;
    indexed: number;
    failed: number;
    stats: any;
  };
  duration: number;
  timestamp: Date;
}

export async function runSeoIndexAudit(
  isDev = process.env.NODE_ENV === 'development'
): Promise<SeoAuditResult> {
  const startTime = Date.now();
  const timestamp = new Date();
  
  console.log('🚀 Starting complete SEO index audit...');
  console.log(`📍 Environment: ${isDev ? 'Development' : 'Production'}`);
  
  try {
    // Step 1: Build sitemap
    console.log('\n📝 Step 1: Building sitemap...');
    const sitemapResult = await buildSitemap(isDev);
    
    if (!sitemapResult.success) {
      throw new Error(`Sitemap generation failed: ${sitemapResult.error}`);
    }
    
    // Step 2: Ping Google Search Console
    console.log('\n🔔 Step 2: Pinging Google Search Console...');
    const baseUrl = isDev ? 'http://localhost:3000' : 'https://menshealthfinder.com';
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    
    const pingResult = await pingGSC(sitemapUrl, isDev);
    
    // Step 3: Update sitemap stats
    const sitemapStats = await getSitemapStats();
    await updateSitemapStats({
      totalUrls: sitemapResult.urlCount,
      lastGenerated: new Date(),
      lastPingSuccess: pingResult.success
    });
    
    // Step 4: Refresh index status for all clinics
    console.log('\n🔍 Step 3: Checking indexing status for all clinics...');
    const indexingResult = await seoIndexingJob(true); // Use mock data for now
    
    // Step 5: Update final admin stats
    console.log('\n📊 Step 4: Updating admin statistics...');
    await updateAdminStats({
      totalIndexed: indexingResult.indexed,
      totalUnindexed: indexingResult.processed - indexingResult.indexed,
      lastIndexCheck: new Date(),
      indexingStats: indexingResult.stats
    });
    
    const duration = Date.now() - startTime;
    
    const auditResult: SeoAuditResult = {
      sitemap: {
        success: sitemapResult.success,
        urlCount: sitemapResult.urlCount,
        filePath: sitemapResult.filePath,
        error: sitemapResult.error
      },
      ping: {
        success: pingResult.success,
        responseTime: pingResult.responseTime,
        error: pingResult.error
      },
      indexing: {
        processed: indexingResult.processed,
        indexed: indexingResult.indexed,
        failed: indexingResult.failed,
        stats: indexingResult.stats
      },
      duration,
      timestamp
    };
    
    // Log final summary
    console.log('\n🎉 SEO Index Audit Complete!');
    console.log('=' .repeat(50));
    console.log(`🗺️  Sitemap: ${auditResult.sitemap.urlCount} URLs generated`);
    console.log(`🔔 GSC Ping: ${auditResult.ping.success ? 'Success' : 'Failed'} (${auditResult.ping.responseTime}ms)`);
    console.log(`🔍 Indexing: ${auditResult.indexing.indexed}/${auditResult.indexing.processed} clinics indexed`);
    console.log(`⏱️  Total Duration: ${(duration / 1000).toFixed(1)}s`);
    
    if (auditResult.indexing.stats.mostCommonQuery) {
      console.log(`🔥 Top Query: "${auditResult.indexing.stats.mostCommonQuery}"`);
    }
    
    if (auditResult.indexing.stats.mostIndexedState) {
      console.log(`📍 Top State: ${auditResult.indexing.stats.mostIndexedState}`);
    }
    
    console.log('=' .repeat(50));
    
    return auditResult;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ SEO Index Audit failed:', error);
    
    // Return partial results if available
    return {
      sitemap: {
        success: false,
        urlCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      ping: {
        success: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      indexing: {
        processed: 0,
        indexed: 0,
        failed: 0,
        stats: {
          mostCommonQuery: '',
          mostIndexedState: '',
          avgCTR: 0,
          totalClicks: 0
        }
      },
      duration,
      timestamp
    };
  }
}

export async function runQuickAudit(): Promise<{
  sitemapUrls: number;
  pingSuccess: boolean;
  sampleIndexed: number;
  duration: number;
}> {
  const startTime = Date.now();
  
  console.log('⚡ Running quick SEO audit...');
  
  try {
    // Quick sitemap check
    const sitemapStats = await getSitemapStats();
    
    // Quick ping test
    const isDev = process.env.NODE_ENV === 'development';
    const baseUrl = isDev ? 'http://localhost:3000' : 'https://menshealthfinder.com';
    const pingResult = await pingGSC(`${baseUrl}/sitemap.xml`, isDev);
    
    // Quick index sample (just 10 clinics)
    const { quickIndexCheck } = await import('./seoIndexingJob');
    const indexSample = await quickIndexCheck(10);
    
    const duration = Date.now() - startTime;
    
    console.log(`⚡ Quick audit complete in ${(duration / 1000).toFixed(1)}s`);
    
    return {
      sitemapUrls: sitemapStats.totalUrls,
      pingSuccess: pingResult.success,
      sampleIndexed: indexSample.indexed,
      duration
    };
    
  } catch (error) {
    console.error('Quick audit failed:', error);
    throw error;
  }
}