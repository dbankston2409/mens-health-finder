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
import { db } from './lib/firebase';
import { doc, getDoc, onSnapshot } from './lib/firebase-compat';

// Worker state
let isPaused = true; // Start paused by default
let intervalId: NodeJS.Timeout | null = null;

// Define job schedules (in milliseconds)
const SCHEDULES = {
  importJobs: 30 * 1000,            // Every 30 seconds
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
  if (isPaused) {
    console.log(`⏸️  Skipping job ${name} - worker is paused`);
    return;
  }
  
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

// Watch worker config in Firestore
async function watchWorkerConfig() {
  try {
    const configRef = doc(db, 'config', 'worker');
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(configRef, async (snapshot) => {
      if (snapshot.exists()) {
        const config = snapshot.data();
        const newPausedState = config.isPaused !== false; // Default to paused if not explicitly false
        
        if (newPausedState !== isPaused) {
          isPaused = newPausedState;
          console.log(`🔄 Worker state changed: ${isPaused ? 'PAUSED' : 'ACTIVE'}`);
          
          if (!isPaused && !lastRun.analytics) {
            // Run initial jobs when unpaused for the first time
            console.log('🏃 Running initial jobs after unpause...');
            await runJob('analytics', processAnalytics);
            await runJob('seo-index', runSeoIndexAudit);
          }
        }
      } else {
        // No config exists, create default (paused)
        console.log('📝 Creating default worker config (paused)');
        await db.collection('config').doc('worker').set({
          isPaused: true,
          lastUpdated: new Date(),
          schedules: SCHEDULES
        });
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Failed to watch worker config:', error);
    return null;
  }
}

// Main worker loop
async function startWorker() {
  console.log('🔧 Men\'s Health Finder Worker Started');
  console.log('⏸️  Worker is starting in PAUSED state');
  console.log('📅 Job Schedules:');
  Object.entries(SCHEDULES).forEach(([job, interval]) => {
    console.log(`  - ${job}: every ${interval / 1000 / 60} minutes`);
  });

  // Check for command line job argument (for manual runs)
  const manualJob = process.argv[2];
  
  if (manualJob) {
    console.log(`📌 Manual job requested: ${manualJob}`);
    
    // Temporarily unpause for manual job
    const wasPaused = isPaused;
    isPaused = false;
    
    switch (manualJob) {
      case 'import':
        const { importClinics } = await import('./tasks/importClinics');
        await runJob('import', importClinics);
        break;
        
      case 'import-jobs':
        const { processImportJobs } = await import('./tasks/importClinics');
        await runJob('import-jobs', processImportJobs);
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
        console.error('❌ Unknown job type. Available jobs: import, import-jobs, analytics, reports, seo-index, tag-audit, opportunities, ghost-clinics');
        process.exit(1);
    }
    
    isPaused = wasPaused; // Restore pause state
    console.log('✅ Manual job completed');
    process.exit(0);
  }

  // Watch for config changes
  const unsubscribe = await watchWorkerConfig();
  
  // Wait a moment for initial config load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Start continuous loop
  console.log('🔄 Starting continuous worker loop...');
  console.log(`📊 Current state: ${isPaused ? 'PAUSED' : 'ACTIVE'}`);
  
  intervalId = setInterval(async () => {
    if (isPaused) {
      return; // Skip all jobs if paused
    }
    
    // Check for import jobs frequently
    if (shouldRun('import-jobs', SCHEDULES.importJobs)) {
      const { processImportJobs } = await import('./tasks/importClinics');
      await runJob('import-jobs', processImportJobs);
    }
    
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
    if (intervalId) clearInterval(intervalId);
    if (unsubscribe) unsubscribe();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 Worker interrupted, shutting down...');
    if (intervalId) clearInterval(intervalId);
    if (unsubscribe) unsubscribe();
    process.exit(0);
  });
}

// Start the worker
startWorker().catch(error => {
  console.error('💥 Worker failed to start:', error);
  process.exit(1);
});