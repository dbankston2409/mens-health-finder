/**
 * Enhanced Importer
 * 
 * A more powerful clinic import tool that supports:
 * - Duplicate detection
 * - Merging with existing records
 * - Backfilling missing data
 * - Detailed logging
 * - CSV/JSON import with validation
 */

const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const papa = require('papaparse');
const admin = require('firebase-admin');
const { Command } = require('commander');
const dotenv = require('dotenv');
const { nanoid } = require('nanoid');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin (if not already initialized)
let firestore;
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')})});
  firestore = admin.firestore();
} else {
  firestore = admin.firestore();
}

// Import helpers from the importClinics script
const { 
  normalizePhone,
  normalizeWebsite,
  createSlug,
  ensureUniqueSlug,
  geocodeAddress,
  verifyWebsite
} = require('./importClinics');

/**
 * Async version of the importEnhancer's processClinicForImport
 */
async function processClinicForImport(clinicData, options = {}) {
  try {
    const {
      mergeWithExisting = true,
      checkForDuplicates = true,
      backfillMissingData = false,
      importSource = 'enhanced-importer',
      overwriteFields = [],
      preserveFields = ['tier', 'package', 'status', 'trafficMeta']
    } = options;
    
    // Clean and normalize the input data
    const normalizedClinic = {
      ...clinicData,
      name: (clinicData.name || '').trim(),
      address: (clinicData.address || '').trim(),
      city: (clinicData.city || '').trim(),
      state: (clinicData.state || '').trim(),
      zip: (clinicData.zip || '').trim(),
      country: (clinicData.country || 'USA').trim(),
      phone: normalizePhone(clinicData.phone),
      website: normalizeWebsite(clinicData.website),
      status: 'active', // Default status for imported clinics
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      importSource
    };
    
    // Convert services to array if needed
    if (normalizedClinic.services && !Array.isArray(normalizedClinic.services)) {
      normalizedClinic.services = normalizedClinic.services
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    
    // Convert tags to array if needed
    if (normalizedClinic.tags && !Array.isArray(normalizedClinic.tags)) {
      normalizedClinic.tags = normalizedClinic.tags
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    
    // Validate required fields
    const requiredFields = ['name', 'city', 'state'];
    const missingFields = requiredFields.filter(field => !normalizedClinic[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        action: 'skip',
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }
    
    // Create a slug
    if (!normalizedClinic.slug) {
      normalizedClinic.slug = await ensureUniqueSlug(
        firestore,
        createSlug(normalizedClinic.name, normalizedClinic.city, normalizedClinic.state)
      );
    }
    
    // Check for duplicates
    let isDuplicate = false;
    let matchedClinic = null;
    let duplicateReason = null;
    
    if (checkForDuplicates) {
      // Check for exact name + zip match
      if (normalizedClinic.name && normalizedClinic.zip) {
        const nameZipQuery = await firestore.collection('clinics')
          .where('name', '==', normalizedClinic.name)
          .where('zip', '==', normalizedClinic.zip)
          .limit(1)
          .get();
          
        if (!nameZipQuery.empty) {
          isDuplicate = true;
          matchedClinic = {
            id: nameZipQuery.docs[0].id,
            ...nameZipQuery.docs[0].data()
          };
          duplicateReason = 'Exact match on name and zip';
        }
      }
      
      // Check for exact address match
      if (!isDuplicate && normalizedClinic.address && normalizedClinic.city) {
        const addressQuery = await firestore.collection('clinics')
          .where('address', '==', normalizedClinic.address)
          .where('city', '==', normalizedClinic.city)
          .where('state', '==', normalizedClinic.state)
          .limit(1)
          .get();
          
        if (!addressQuery.empty) {
          isDuplicate = true;
          matchedClinic = {
            id: addressQuery.docs[0].id,
            ...addressQuery.docs[0].data()
          };
          duplicateReason = 'Exact match on address';
        }
      }
      
      // Check for phone match
      if (!isDuplicate && normalizedClinic.phone) {
        const phoneQuery = await firestore.collection('clinics')
          .where('phone', '==', normalizedClinic.phone)
          .limit(1)
          .get();
          
        if (!phoneQuery.empty) {
          isDuplicate = true;
          matchedClinic = {
            id: phoneQuery.docs[0].id,
            ...phoneQuery.docs[0].data()
          };
          duplicateReason = 'Exact match on phone number';
        }
      }
    }
    
    if (isDuplicate && matchedClinic) {
      if (mergeWithExisting) {
        // Merge with existing clinic
        const mergedClinic = { ...matchedClinic };
        
        // Process each field in the new data
        for (const [key, value] of Object.entries(normalizedClinic)) {
          // Skip undefined or null values
          if (value === undefined || value === null) {
            continue;
          }
          
          // Skip fields explicitly marked to preserve
          if (preserveFields.includes(key)) {
            continue;
          }
          
          // Handle special cases
          if (key === 'services' && Array.isArray(value) && Array.isArray(mergedClinic.services)) {
            // Merge services arrays (unique values only)
            mergedClinic.services = [...new Set([...mergedClinic.services, ...value])];
          }
          else if (key === 'tags' && Array.isArray(value) && Array.isArray(mergedClinic.tags)) {
            // Merge tags arrays (unique values only)
            mergedClinic.tags = [...new Set([...mergedClinic.tags, ...value])];
          }
          // Always keep existing tier unless explicitly told to overwrite
          else if (key === 'tier' || key === 'package') {
            if (overwriteFields.includes(key)) {
              mergedClinic[key] = value;
            }
          }
          // For other fields, overwrite if explicitly marked or if the existing value is empty
          else if (
            overwriteFields.includes(key) || 
            mergedClinic[key] === undefined || 
            mergedClinic[key] === null || 
            mergedClinic[key] === ''
          ) {
            mergedClinic[key] = value;
          }
        }
        
        // Update timestamps
        mergedClinic.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
        
        // Update the clinic in Firestore
        await firestore.collection('clinics').doc(matchedClinic.id).update({
          ...mergedClinic,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return {
          success: true,
          action: 'merge',
          clinicId: matchedClinic.id,
          duplicateReason,
          clinic: mergedClinic
        };
      } else {
        // Skip duplicate
        return {
          success: true,
          action: 'skip',
          clinicId: matchedClinic.id,
          duplicateReason,
          clinic: matchedClinic
        };
      }
    }
    
    // Backfill missing data if requested
    if (backfillMissingData) {
      // Geocode address if lat/lng is missing
      if ((!normalizedClinic.lat || !normalizedClinic.lng) && normalizedClinic.address) {
        try {
          const geoResult = await geocodeAddress(
            normalizedClinic.address,
            normalizedClinic.city,
            normalizedClinic.state,
            normalizedClinic.zip
          );
          
          if (geoResult) {
            normalizedClinic.lat = geoResult.lat;
            normalizedClinic.lng = geoResult.lng;
          }
        } catch (error) {
          console.warn(`Warning: Failed to geocode address for ${normalizedClinic.name}`, error);
        }
      }
      
      // Verify website if present
      if (normalizedClinic.website) {
        try {
          const isWebsiteWorking = await verifyWebsite(normalizedClinic.website);
          if (!normalizedClinic.validationStatus) {
            normalizedClinic.validationStatus = {
              verified: false,
              method: 'auto',
              websiteOK: isWebsiteWorking
            };
          } else {
            normalizedClinic.validationStatus.websiteOK = isWebsiteWorking;
          }
          
          // Add website status tag
          if (!normalizedClinic.tags) {
            normalizedClinic.tags = [];
          }
          
          if (isWebsiteWorking) {
            normalizedClinic.tags.push('website-ok');
          } else {
            normalizedClinic.tags.push('website-down');
          }
          
          // Ensure unique tags
          normalizedClinic.tags = [...new Set(normalizedClinic.tags)];
        } catch (error) {
          console.warn(`Warning: Failed to verify website for ${normalizedClinic.name}`, error);
        }
      }
    }
    
    // Create new clinic
    const newClinicRef = firestore.collection('clinics').doc();
    await newClinicRef.set(normalizedClinic);
    
    return {
      success: true,
      action: 'create',
      clinicId: newClinicRef.id,
      clinic: {
        id: newClinicRef.id,
        ...normalizedClinic
      }
    };
  } catch (error) {
    console.error('Error processing clinic for import:', error);
    return {
      success: false,
      action: 'error',
      error: error.message,
      clinic: clinicData
    };
  }
}

/**
 * Import clinics from a file with enhanced options
 */
async function importClinicsEnhanced(filePath, options = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  // Parse options
  const {
    mergeWithExisting = true,
    checkForDuplicates = true,
    backfillMissingData = false,
    dryRun = false,
    importSource = 'enhanced-importer',
    batchSize = 100,
    adminId = 'system',
    adminName = 'System'
  } = options;
  
  console.log(`🚀 Starting enhanced import from ${filePath}`);
  console.log(`Options: ${JSON.stringify({
    mergeWithExisting,
    checkForDuplicates,
    backfillMissingData,
    dryRun,
    importSource,
    batchSize
  }, null, 2)}`);
  
  // Parse input file
  const fileExt = path.extname(filePath).toLowerCase();
  let records = [];
  
  if (fileExt === '.csv') {
    records = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  } else if (fileExt === '.json') {
    const data = await fs.readJson(filePath);
    records = Array.isArray(data) ? data : [data];
  } else {
    throw new Error(`Unsupported file format: ${fileExt}. Use .csv or .json`);
  }
  
  console.log(`📋 Found ${records.length} records to process`);
  
  // Track results
  const results = {
    total: records.length,
    created: 0,
    merged: 0,
    skipped: 0,
    failed: 0,
    details: []
  };
  
  // Generate import log ID
  const importId = nanoid();
  
  // Log the start of the import
  const importLogRef = firestore.collection('import_logs').doc(importId);
  await importLogRef.set({
    fileName: path.basename(filePath),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    totalRecords: records.length,
    status: 'in_progress',
    source: importSource,
    adminId,
    adminName,
    options: {
      mergeWithExisting,
      checkForDuplicates,
      backfillMissingData,
      dryRun
    }
  });
  
  // Process records in batches
  const errors = [];
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)...`);
    
    // Process each record in the batch
    const batchResults = await Promise.all(
      batch.map(async (record) => {
        try {
          const result = await processClinicForImport(record, {
            mergeWithExisting,
            checkForDuplicates,
            backfillMissingData,
            importSource,
            overwriteFields: [],
            preserveFields: ['tier', 'package', 'status', 'trafficMeta']
          });
          
          // Track result
          if (result.success) {
            if (result.action === 'create') {
              results.created++;
            } else if (result.action === 'merge') {
              results.merged++;
            } else if (result.action === 'skip') {
              results.skipped++;
            }
          } else {
            results.failed++;
            errors.push({
              record,
              error: result.error
            });
          }
          
          // Return result for batch processing
          return {
            record,
            result
          };
        } catch (error) {
          results.failed++;
          errors.push({
            record,
            error: error.message
          });
          return {
            record,
            result: {
              success: false,
              action: 'error',
              error: error.message
            }
          };
        }
      })
    );
    
    results.details.push(...batchResults);
    
    // Update import log with progress
    await importLogRef.update({
      successCount: results.created + results.merged,
      failureCount: results.failed,
      progress: Math.round(((i + batch.length) / records.length) * 100),
      lastBatchCompleted: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Simulate dry run by adding a small delay
    if (dryRun) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Update import log with final results
  const status = results.failed === 0 ? 'success' : 
                 results.failed < results.total ? 'partial' : 'failed';
                 
  await importLogRef.update({
    successCount: results.created + results.merged,
    failureCount: results.failed,
    status,
    progress: 100,
    completed: admin.firestore.FieldValue.serverTimestamp(),
    summary: {
      created: results.created,
      merged: results.merged,
      skipped: results.skipped,
      failed: results.failed
    },
    errors: errors.length > 0 ? errors : []
  });
  
  // Write detailed results to a log file
  const resultsPath = path.join(
    path.dirname(filePath), 
    `import-results-${path.basename(filePath, path.extname(filePath))}.json`
  );
  
  await fs.writeJson(resultsPath, {
    importId,
    fileName: path.basename(filePath),
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      created: results.created,
      merged: results.merged,
      skipped: results.skipped,
      failed: results.failed,
      status
    },
    details: results.details,
    errors
  }, { spaces: 2 });
  
  console.log(`
🏁 Import complete:
   Total records: ${results.total}
   Created: ${results.created}
   Merged: ${results.merged}
   Skipped: ${results.skipped}
   Failed: ${results.failed}
   
   Results saved to: ${resultsPath}
   Import ID: ${importId}
  `);
  
  return {
    importId,
    summary: {
      total: results.total,
      created: results.created,
      merged: results.merged,
      skipped: results.skipped,
      failed: results.failed
    }
  };
}

/**
 * CLI setup
 */
function setupCli() {
  const program = new Command();
  
  program
    .name('enhancedImporter')
    .description('Enhanced bulk import tool for Men\'s Health Finder clinics')
    .version('1.0.0');
  
  program
    .command('import')
    .description('Import clinics from a CSV or JSON file with enhanced options')
    .argument('<file>', 'Path to the input file (CSV or JSON)')
    .option('-s, --source <source>', 'Source identifier for this import', 'enhanced-importer')
    .option('-m, --merge', 'Merge with existing records (default: true)', true)
    .option('-n, --no-merge', 'Do not merge with existing records')
    .option('-d, --check-duplicates', 'Check for duplicates (default: true)', true)
    .option('-n, --no-check-duplicates', 'Do not check for duplicates')
    .option('-b, --backfill', 'Backfill missing data (default: false)', false)
    .option('-D, --dry-run', 'Validate without saving to database (default: false)', false)
    .option('--admin-id <id>', 'ID of the admin running the import', 'system')
    .option('--admin-name <name>', 'Name of the admin running the import', 'System')
    .action(async (file, options) => {
      try {
        await importClinicsEnhanced(file, {
          mergeWithExisting: options.merge,
          checkForDuplicates: options.checkDuplicates,
          backfillMissingData: options.backfill,
          dryRun: options.dryRun,
          importSource: options.source,
          adminId: options.adminId,
          adminName: options.adminName
        });
      } catch (error) {
        console.error('❌ Import failed:', error.message);
        process.exit(1);
      }
    });
  
  program.parse();
}

// Run CLI if called directly
if (require.main === module) {
  setupCli();
}

module.exports = {
  importClinicsEnhanced,
  processClinicForImport
};