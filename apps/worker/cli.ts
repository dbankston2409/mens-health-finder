#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import * as path from 'path';

// Colors for CLI output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

const log = {
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  header: (msg: string) => console.log(`${colors.bright}${colors.cyan}🚀 ${msg}${colors.reset}`)
};

function showUsage() {
  console.log(`
${colors.bright}${colors.cyan}Men's Health Finder - Worker Engine${colors.reset}

${colors.bright}USAGE:${colors.reset}
  npm run worker [command] [options]

${colors.bright}COMMANDS:${colors.reset}

  ${colors.bright}import${colors.reset} [file-path]         Import clinics from CSV/JSON files
  ${colors.bright}discovery${colors.reset} [options]       Run automated business discovery
  ${colors.bright}discovery:status${colors.reset} [session-id]      Check discovery session status
  ${colors.bright}discovery:pause${colors.reset} [session-id]       Pause a running discovery session
  ${colors.bright}discovery:monitor${colors.reset} [session-id]     Monitor discovery session progress
  ${colors.bright}discovery:list${colors.reset}                    List recent discovery sessions
  ${colors.bright}review-update${colors.reset} [options]   Update reviews for existing clinics

${colors.bright}IMPORT EXAMPLES:${colors.reset}
  npm run worker import sample-clinics.csv
  npm run worker import ./data/clinics.json
  npm run worker import /path/to/clinic-data.csv

${colors.bright}DISCOVERY EXAMPLES:${colors.reset}
  npm run worker discovery --target 5000 --strategy metro_first
  npm run worker discovery --target 10000 --niche mensHealth --no-reviews
  npm run worker discovery --resume session_123456789
  npm run worker discovery --target 2000 --concurrent 5 --pause-after 120
  npm run worker discovery:status
  npm run worker discovery:status --session discovery_1234567890
  npm run worker discovery:pause --session discovery_1234567890

${colors.bright}REVIEW UPDATE EXAMPLES:${colors.reset}
  npm run worker review-update --discovery-session session_123456789
  npm run worker review-update --clinic-ids clinic1,clinic2,clinic3
  npm run worker review-update --discovery-session session_123 
  npm run worker review-update --clinic-ids clinic1 --max-reviews 20 --rate-limit 2000

${colors.bright}DISCOVERY OPTIONS:${colors.reset}
  --target N          Target number of clinics to find (default: 5000)
  --strategy S        Search strategy: metro_first, nationwide, state_by_state
  --niche N           Search niche: mensHealth, urgentCare, wellness
  --concurrent N      Max concurrent searches (default: 3)
  --pause-after N     Auto-pause after N minutes (optional)
  --resume ID         Resume existing session by ID
  --no-reviews        Skip review import (faster, lower cost)
  --no-social         Skip social media enhancement

${colors.bright}REVIEW UPDATE OPTIONS:${colors.reset}
  --discovery-session ID  Update reviews for clinics from discovery session
  --clinic-ids IDs        Comma-separated list of clinic IDs to update
  --max-reviews N         Max reviews per source (default: 10)
  --rate-limit N          Rate limit in milliseconds (default: 1000)
  --no-google             Skip Google reviews
  
  --quiet                 Disable progress logging

${colors.bright}SUPPORTED FORMATS:${colors.reset}
  • CSV files (.csv)
  • JSON files (.json)
  • Auto-detection based on content

${colors.bright}REQUIRED CSV COLUMNS:${colors.reset}
  • name (clinic name)
  • address (street address)
  • city
  • state
  • phone
  
${colors.bright}OPTIONAL CSV COLUMNS:${colors.reset}
  • zip (zip code)
  • website (website URL)
  • services (comma-separated services)
  • package (free, basic, premium)
  • status (active, paused, inactive)

${colors.bright}FEATURES:${colors.reset}
  ✅ Automated business discovery across entire US
  ✅ Google Places & Yelp API integration
  ✅ Visual grid-based search with progress tracking
  ✅ Pause/resume functionality for long-running searches
  ✅ Social media and review data enhancement
  ✅ Address-based deduplication
  ✅ Priority-based metro-first search strategy
  ✅ Automatic data normalization and cleaning
  ✅ Address geocoding with Google Maps API
  ✅ SEO metadata generation (AI-powered when available)
  ✅ Duplicate detection and smart updates
  ✅ Quality-based tagging for review
  ✅ Comprehensive error handling and logging
  ✅ Firestore integration with batch operations

${colors.bright}ENVIRONMENT VARIABLES:${colors.reset}
  • GOOGLE_MAPS_API_KEY (for geocoding & Places API)
  • 
  • OPENAI_API_KEY (for AI-powered SEO generation)
  • CLAUDE_API_KEY (for AI-powered content generation)
  • FIREBASE_PROJECT_ID (Firebase project)
  • GOOGLE_APPLICATION_CREDENTIALS (Firebase auth)

${colors.bright}MORE INFO:${colors.reset}
  Run ${colors.green}npm run worker import${colors.reset} without arguments to use the default sample file.
  Run ${colors.green}npm run worker discovery${colors.reset} without arguments to start with default settings.
`);
}

// Load environment variables
dotenv.config({ path: '../../.env.worker' });

const command = process.argv[2];
const args = process.argv.slice(3);

(async () => {
  // Show header
  log.header('Men\'s Health Finder Worker Engine');
  
  if (command === 'help' || command === '--help' || command === '-h') {
    showUsage();
    process.exit(0);
  }
  
  if (command === 'import') {
    try {
      log.info('Loading import engine...');
      
      const filePath = args[0];
      const { importClinics } = await import('./tasks/importClinics');
      await importClinics(filePath);
      
      log.success('Import completed successfully!');
      process.exit(0);
      
    } catch (error) {
      log.error(`Import failed: ${error}`);
      process.exit(1);
    }
  }
  
  if (command === 'discovery') {
    try {
      log.info('Loading business discovery engine...');
      
      const { executeDiscoveryCommand } = await import('./tasks/runBusinessDiscovery');
      await executeDiscoveryCommand(args);
      
      log.success('Discovery completed successfully!');
      process.exit(0);
      
    } catch (error) {
      log.error(`Discovery failed: ${error}`);
      process.exit(1);
    }
  }
  
  if (command === 'review-update') {
    try {
      log.info('Loading review update engine...');
      
      const { runReviewUpdateCLI } = await import('./tasks/updateClinicReviews');
      await runReviewUpdateCLI(args);
      
      log.success('Review update completed successfully!');
      process.exit(0);
      
    } catch (error) {
      log.error(`Review update failed: ${error}`);
      process.exit(1);
    }
  }
  
  if (command === 'discovery:status') {
    try {
      log.info('Checking discovery status...');
      
      const { executeDiscoveryCommand } = await import('./tasks/runBusinessDiscovery');
      await executeDiscoveryCommand(['status', ...args]);
      
      process.exit(0);
      
    } catch (error) {
      log.error(`Status check failed: ${error}`);
      process.exit(1);
    }
  }
  
  if (command === 'discovery:pause') {
    try {
      log.info('Pausing discovery session...');
      
      const { executeDiscoveryCommand } = await import('./tasks/runBusinessDiscovery');
      await executeDiscoveryCommand(['pause', ...args]);
      
      process.exit(0);
      
    } catch (error) {
      log.error(`Pause failed: ${error}`);
      process.exit(1);
    }
  }
  
  if (command === 'discovery:monitor') {
    try {
      log.info('Monitoring discovery session...');
      
      const { executeDiscoveryCommand } = await import('./tasks/runBusinessDiscovery');
      await executeDiscoveryCommand(['monitor', ...args]);
      
      process.exit(0);
      
    } catch (error) {
      log.error(`Monitor failed: ${error}`);
      process.exit(1);
    }
  }
  
  if (command === 'discovery:list') {
    try {
      log.info('Listing discovery sessions...');
      
      const { executeDiscoveryCommand } = await import('./tasks/runBusinessDiscovery');
      await executeDiscoveryCommand(['list']);
      
      process.exit(0);
      
    } catch (error) {
      log.error(`List failed: ${error}`);
      process.exit(1);
    }
  }
  
  // Default behavior - show usage if no valid command
  if (!command || !['import', 'discovery', 'discovery:status', 'discovery:pause', 'discovery:monitor', 'discovery:list', 'review-update'].includes(command)) {
    log.warning('Invalid or missing command');
    showUsage();
    process.exit(1);
  }
})();