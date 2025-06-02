import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env.worker' });

// Import task functions
import { processAnalytics } from './tasks/processAnalytics';
import { generateReports } from './tasks/generateReports';
import { runSeoIndexAudit } from './tasks/runSeoIndexAudit';
import { runTagAudit } from './tasks/runTagAudit';
import { missedOpportunityScanner } from './tasks/missedOpportunityScanner';
import { ghostClinicScanner } from './tasks/ghostClinicScanner';

// Define job schedules (in milliseconds)
const SCHEDULES = {
  analytics: 60 * 60 * 1000,        // Every hour
  reports: 24 * 60 * 60 * 1000,     // Daily
  seoIndexAudit: 6 * 60 * 60 * 1000, // Every 6 hours
  tagAudit: 12 * 60 * 60 * 1000,    // Every 12 hours
  missedOpportunities: 4 * 60 * 60 * 1000, // Every 4 hours
  ghostClinics: 24 * 60 * 60 * 1000, // Daily
};

// Track last run times
const lastRun: Record<string, number> = {};

// Run a job safely
async function runJob(name: string, job: () => Promise<any>) {
  try {
    console.log(`🚀 Starting job: ${name}`);
    await job();
    console.log(`✅ Job completed: ${name}`);
    lastRun[name] = Date.now();
  } catch (error) {
    console.error(`❌ Job failed: ${name}`, error);
  }
}

// Check if job should run
function shouldRun(name: string, intervalMs: number): boolean {
  const last = lastRun[name] || 0;
  return Date.now() - last >= intervalMs;
}

// Main worker loop
async function startWorker() {
  console.log('🔧 Men\'s Health Finder Worker Started');
  console.log('📅 Job Schedules:');
  Object.entries(SCHEDULES).forEach(([job, interval]) => {
    console.log(`  - ${job}: every ${interval / 1000 / 60} minutes`);
  });

  // Check for command line job argument (for manual runs)
  const manualJob = process.argv[2];
  
  if (manualJob) {
    console.log(`📌 Manual job requested: ${manualJob}`);
    
    switch (manualJob) {
      case 'import':
        const { importClinics } = await import('./tasks/importClinics');
        await runJob('import', importClinics);
        break;
        
      case 'analytics':
        await runJob('analytics', processAnalytics);
        break;
        
      case 'reports':
        await runJob('reports', generateReports);
        break;
        
      case 'seo-index':
        await runJob('seo-index', runSeoIndexAudit);
        break;
        
      case 'tag-audit':
        await runJob('tag-audit', runTagAudit);
        break;
        
      case 'opportunities':
        await runJob('opportunities', missedOpportunityScanner);
        break;
        
      case 'ghost-clinics':
        await runJob('ghost-clinics', ghostClinicScanner);
        break;
        
      default:
        console.error('❌ Unknown job type. Available jobs: import, analytics, reports, seo-index, tag-audit, opportunities, ghost-clinics');
        process.exit(1);
    }
    
    console.log('✅ Manual job completed');
    process.exit(0);
  }

  // Run initial jobs
  console.log('🏃 Running initial jobs...');
  await runJob('analytics', processAnalytics);
  await runJob('seo-index', runSeoIndexAudit);

  // Start continuous loop
  console.log('🔄 Starting continuous worker loop...');
  
  setInterval(async () => {
    // Check each job schedule
    if (shouldRun('analytics', SCHEDULES.analytics)) {
      await runJob('analytics', processAnalytics);
    }
    
    if (shouldRun('reports', SCHEDULES.reports)) {
      await runJob('reports', generateReports);
    }
    
    if (shouldRun('seo-index', SCHEDULES.seoIndexAudit)) {
      await runJob('seo-index', runSeoIndexAudit);
    }
    
    if (shouldRun('tag-audit', SCHEDULES.tagAudit)) {
      await runJob('tag-audit', runTagAudit);
    }
    
    if (shouldRun('opportunities', SCHEDULES.missedOpportunities)) {
      await runJob('opportunities', missedOpportunityScanner);
    }
    
    if (shouldRun('ghost-clinics', SCHEDULES.ghostClinics)) {
      await runJob('ghost-clinics', ghostClinicScanner);
    }
  }, 60 * 1000); // Check every minute

  // Keep process alive
  process.on('SIGTERM', () => {
    console.log('🛑 Worker shutting down gracefully...');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 Worker interrupted, shutting down...');
    process.exit(0);
  });
}

// Start the worker
startWorker().catch(error => {
  console.error('💥 Worker failed to start:', error);
  process.exit(1);
});