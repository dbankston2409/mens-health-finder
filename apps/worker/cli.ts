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
${colors.bright}${colors.cyan}Men's Health Finder - Clinic Import Engine${colors.reset}

${colors.bright}USAGE:${colors.reset}
  npm run worker:import [file-path]

${colors.bright}EXAMPLES:${colors.reset}
  npm run worker:import sample-clinics.csv
  npm run worker:import ./data/clinics.json
  npm run worker:import /path/to/clinic-data.csv

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
  ✅ Automatic data normalization and cleaning
  ✅ Address geocoding with Google Maps API
  ✅ SEO metadata generation (AI-powered when available)
  ✅ Duplicate detection and smart updates
  ✅ Quality-based tagging for review
  ✅ Comprehensive error handling and logging
  ✅ Firestore integration with batch operations

${colors.bright}ENVIRONMENT VARIABLES:${colors.reset}
  • GOOGLE_MAPS_API_KEY (for geocoding)
  • OPENAI_API_KEY (for AI-powered SEO generation)
  • CLAUDE_API_KEY (for AI-powered content generation)
  • FIREBASE_PROJECT_ID (Firebase project)
  • GOOGLE_APPLICATION_CREDENTIALS (Firebase auth)

${colors.bright}MORE INFO:${colors.reset}
  Run ${colors.green}npm run worker:import${colors.reset} without arguments to use the default sample file.
`);
}

// Load environment variables
dotenv.config({ path: '../../.env.worker' });

const command = process.argv[2];
const filePath = process.argv[3];

(async () => {
  // Show header
  log.header('Men\'s Health Finder Clinic Import Engine');
  
  if (command === 'help' || command === '--help' || command === '-h') {
    showUsage();
    process.exit(0);
  }
  
  if (command === 'import') {
    try {
      log.info('Loading import engine...');
      
      const { importClinics } = await import('./tasks/importClinics');
      await importClinics(filePath);
      
      log.success('Import completed successfully!');
      process.exit(0);
      
    } catch (error) {
      log.error(`Import failed: ${error}`);
      process.exit(1);
    }
  }
  
  // Default behavior - show usage if no valid command
  if (!command || command !== 'import') {
    log.warning('Invalid or missing command');
    showUsage();
    process.exit(1);
  }
})();