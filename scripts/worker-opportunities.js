#!/usr/bin/env node

/**
 * MHF Worker: Opportunities Scanner
 * 
 * Runs the missed opportunity scanner to detect:
 * - SEO gaps
 * - Upgrade opportunities  
 * - Revenue leakage
 * - System alerts
 * 
 * Usage:
 *   npm run worker:opportunities
 *   npm run worker:opportunities -- --dry-run
 *   npm run worker:opportunities -- --states TX,CA,FL
 *   npm run worker:opportunities -- --focus seo,upgrade
 */

const path = require('path');

// Set up environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  maxClinics: 500,
  minThreshold: 100,
  focusAreas: ['seo', 'upgrade', 'engagement', 'traffic'],
  states: []
};

// Parse --states argument
const statesArg = args.find(arg => arg.startsWith('--states='));
if (statesArg) {
  options.states = statesArg.split('=')[1].split(',').map(s => s.trim());
}

// Parse --focus argument
const focusArg = args.find(arg => arg.startsWith('--focus='));
if (focusArg) {
  options.focusAreas = focusArg.split('=')[1].split(',').map(s => s.trim());
}

// Parse --max-clinics argument
const maxClinicsArg = args.find(arg => arg.startsWith('--max-clinics='));
if (maxClinicsArg) {
  options.maxClinics = parseInt(maxClinicsArg.split('=')[1]);
}

// Parse --min-threshold argument
const minThresholdArg = args.find(arg => arg.startsWith('--min-threshold='));
if (minThresholdArg) {
  options.minThreshold = parseInt(minThresholdArg.split('=')[1]);
}

console.log('🔍 MHF Opportunities Scanner');
console.log('============================');
console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
console.log(`Max Clinics: ${options.maxClinics}`);
console.log(`Min Threshold: $${options.minThreshold}`);
console.log(`Focus Areas: ${options.focusAreas.join(', ')}`);
if (options.states.length > 0) {
  console.log(`States: ${options.states.join(', ')}`);
}
console.log('');

async function runOpportunitiesWorker() {
  try {
    // Import the scanner (using dynamic import for ES modules)
    const { missedOpportunityScanner } = await import('../apps/worker/tasks/missedOpportunityScanner.js');
    const { alertEngine } = await import('../apps/worker/utils/alertEngine.js');
    const { defineRevenueLeakage } = await import('../apps/worker/utils/defineRevenueLeakage.js');
    
    const startTime = Date.now();
    
    console.log('🚀 Starting opportunity scan...');
    
    // Run missed opportunity scanner
    const scanResult = await missedOpportunityScanner(options);
    
    console.log('\n📊 Scan Results:');
    console.log('================');
    console.log(`Clinics Processed: ${scanResult.clinicsProcessed}`);
    console.log(`Opportunities Found: ${scanResult.opportunitiesFound}`);
    console.log(`Total Value: $${scanResult.totalValue.toLocaleString()}`);
    console.log(`Alerts Created: ${scanResult.alertsCreated}`);
    console.log(`Tags Added: ${scanResult.tagsAdded}`);
    console.log(`Suggestions Generated: ${scanResult.suggestionsGenerated}`);
    
    console.log('\n🎯 Opportunity Breakdown:');
    console.log(`SEO Opportunities: ${scanResult.summary.seoOpportunities}`);
    console.log(`Upgrade Opportunities: ${scanResult.summary.upgradeOpportunities}`);
    console.log(`Engagement Opportunities: ${scanResult.summary.engagementOpportunities}`);
    console.log(`Traffic Opportunities: ${scanResult.summary.trafficOpportunities}`);
    
    if (scanResult.errors.length > 0) {
      console.log('\n❌ Errors:');
      scanResult.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Run additional analysis if not dry run
    if (!options.dryRun) {
      console.log('\n🔧 Running additional analysis...');
      
      // Run alert engine
      try {
        const alertResult = await alertEngine({ maxAlerts: 50 });
        console.log(`System alerts processed: ${alertResult.alertsCreated} created`);
      } catch (error) {
        console.error('Alert engine error:', error.message);
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Scan completed in ${duration}s`);
    
    // Summary recommendations
    if (scanResult.totalValue > 10000) {
      console.log('\n💡 Key Recommendations:');
      console.log('========================');
      if (scanResult.summary.seoOpportunities > 10) {
        console.log('🔍 High number of SEO opportunities - consider SEO audit campaign');
      }
      if (scanResult.summary.upgradeOpportunities > 5) {
        console.log('📈 Multiple upgrade opportunities - schedule sales outreach');
      }
      if (scanResult.summary.engagementOpportunities > 15) {
        console.log('📞 Many missing call tracking - priority implementation needed');
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Worker failed:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Worker interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Worker terminated');
  process.exit(0);
});

// Run the worker
runOpportunitiesWorker();