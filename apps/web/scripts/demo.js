#!/usr/bin/env node

/**
 * Men's Health Finder Database Tools Demo
 * 
 * This script demonstrates the usage of the database tools for 
 * the Men's Health Finder platform, including:
 * 
 * 1. Setting up the Firestore schema
 * 2. Importing clinics from sample data
 * 3. Logging clinic traffic
 * 
 * Make sure to set up your .env file with Firebase credentials before running.
 */

const { setupFirestoreSchema } = require('./tools/firestoreSchema');
const { importClinics, createSampleCsvFile } = require('./tools/importClinics');
const { logClinicTraffic, getTopViewedClinics } = require('./tools/logClinicTraffic');
const path = require('path');

// Command-line options processing
const command = process.argv[2];
const options = process.argv.slice(3);

// Main function to demonstrate functionality
async function runDemo() {
  try {
    console.log('🚀 Men\'s Health Finder Database Tools Demo');
    console.log('===========================================\n');
    
    // Step 1: Set up Firestore schema
    console.log('📝 Step 1: Setting up Firestore schema...');
    await setupFirestoreSchema();
    console.log('✅ Firestore schema setup complete!\n');
    
    // Step 2: Create sample data file (if it doesn't exist)
    console.log('📝 Step 2: Preparing sample data...');
    const sampleFilePath = path.join(__dirname, 'sample-clinics.csv');
    await createSampleCsvFile(sampleFilePath);
    console.log(`✅ Sample data file created at ${sampleFilePath}\n`);
    
    // Step 3: Import sample clinics
    console.log('📝 Step 3: Importing clinics...');
    const importResult = await importClinics(sampleFilePath, 'demo');
    console.log(`✅ Imported ${importResult.success} clinics successfully\n`);
    
    // Step 4: Log some mock traffic
    console.log('📝 Step 4: Logging traffic...');
    
    // Assuming the first clinic in our import has slug "premium-mens-health-clinic-austin-tx"
    const clinicSlug = "premium-mens-health-clinic-austin-tx";
    
    // Log a few sample traffic events
    await logClinicTraffic('mens health austin', clinicSlug, 'Texas');
    await logClinicTraffic('trt near me', clinicSlug, 'Texas');
    await logClinicTraffic('best ED clinic', clinicSlug, 'Texas');
    
    console.log('✅ Traffic logging complete!\n');
    
    // Step 5: Get top viewed clinics
    console.log('📝 Step 5: Getting top viewed clinics...');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const topClinics = await getTopViewedClinics(thirtyDaysAgo, new Date(), 5);
    
    console.log('Top viewed clinics in the last 30 days:');
    console.table(topClinics);
    console.log('\n✅ Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during demo:', error);
    process.exit(1);
  }
}

// Command-line interface
switch (command) {
  case 'setup':
    setupFirestoreSchema()
      .then(() => console.log('✅ Schema setup complete!'))
      .catch(error => console.error('❌ Error:', error));
    break;
    
  case 'sample':
    const samplePath = options[0] || path.join(__dirname, 'sample-clinics.csv');
    createSampleCsvFile(samplePath)
      .then(() => console.log(`✅ Sample file created at ${samplePath}`))
      .catch(error => console.error('❌ Error:', error));
    break;
    
  case 'import':
    const importPath = options[0];
    if (!importPath) {
      console.error('❌ Please provide a path to the file to import');
      process.exit(1);
    }
    importClinics(importPath, options[1] || 'manual')
      .then(result => console.log(`✅ Import complete: ${result.success} successes, ${result.failed} failures`))
      .catch(error => console.error('❌ Error:', error));
    break;
    
  case 'demo':
    runDemo();
    break;
    
  default:
    console.log(`
Men's Health Finder Database Tools

Available commands:
  setup               - Set up Firestore schema
  sample [path]       - Create sample data file (default: ./sample-clinics.csv)
  import <path> [src] - Import clinics from file with optional source identifier
  demo                - Run a full demonstration of all features
    `);
}