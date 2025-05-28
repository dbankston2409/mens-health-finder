import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env.worker' });

const job = process.argv[2];

(async () => {
  console.log(`🚀 Starting job: ${job}`);
  
  try {
    switch (job) {
      case 'import':
        const { importClinics } = await import('./tasks/importClinics');
        await importClinics();
        break;
        
      case 'analytics':
        const { processAnalytics } = await import('./tasks/processAnalytics');
        await processAnalytics();
        break;
        
      case 'reports':
        const { generateReports } = await import('./tasks/generateReports');
        await generateReports();
        break;
        
      case 'seo':
        const { runSeoRefresh } = await import('./tasks/seoBatchProcessor');
        await runSeoRefresh();
        break;
        
      case 'seo-index':
        const { runSeoIndexAudit } = await import('./tasks/runSeoIndexAudit');
        await runSeoIndexAudit();
        break;
        
      default:
        console.error('❌ Unknown job type. Available jobs: import, analytics, reports, seo, seo-index');
        process.exit(1);
    }
    
    console.log('✅ Job completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Job failed:', error);
    process.exit(1);
  }
})();