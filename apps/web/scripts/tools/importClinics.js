const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const papa = require('papaparse');
const fetch = require('node-fetch');
const axios = require('axios');
const admin = require('firebase-admin');
const slugify = require('slugify');
const dotenv = require('dotenv');
const { Command } = require('commander');
const { initializeFirebaseAdmin, getFirestore } = require('./firestoreSchema');

// Load environment variables
dotenv.config();

/**
 * Normalize a phone number to a standard format
 * 
 * @param {string} phone - Phone number to normalize
 * @returns {string} - Normalized phone number
 */
function normalizePhone(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle US/North American numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  // Return the original format if we can't normalize
  return phone;
}

/**
 * Normalize a website URL
 * 
 * @param {string} website - Website to normalize
 * @returns {string} - Normalized website URL
 */
function normalizeWebsite(website) {
  if (!website) return '';
  
  try {
    let normalizedUrl = website.trim();
    
    // Add protocol if missing
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Create a URL object to standardize the format
    const urlObj = new URL(normalizedUrl);
    return urlObj.toString();
  } catch (error) {
    // If there's an error (like invalid URL), return the original
    return website.trim();
  }
}

/**
 * Create a slug for a clinic
 * 
 * @param {string} name - Clinic name
 * @param {string} city - Clinic city
 * @param {string} state - Clinic state
 * @returns {string} - Generated slug
 */
function createSlug(name, city, state) {
  if (!name || !city || !state) {
    return '';
  }
  
  // Convert to lowercase, remove special chars, and replace spaces with hyphens
  const baseSlug = slugify(`${name}-${city}-${state}`, {
    replacement: '-',
    remove: /[*+~.()'"!:@]/g,
    lower: true,
    strict: true,
    locale: 'en',
    trim: true
  });
  
  return baseSlug;
}

/**
 * Check if a slug already exists, and make it unique if needed
 * 
 * @param {FirebaseFirestore.Firestore} db - Firestore database instance
 * @param {string} slug - The proposed slug
 * @returns {Promise<string>} - A unique slug
 */
async function ensureUniqueSlug(db, slug) {
  if (!slug) return '';
  
  let currentSlug = slug;
  let counter = 1;
  let isUnique = false;
  
  while (!isUnique) {
    // Check if the slug exists in Firestore
    const snapshot = await db.collection('clinics')
      .where('slug', '==', currentSlug)
      .limit(1)
      .get();
      
    if (snapshot.empty) {
      isUnique = true;
    } else {
      // Append a counter to make it unique
      currentSlug = `${slug}-${counter}`;
      counter++;
    }
  }
  
  return currentSlug;
}

/**
 * Geocode an address using Nominatim (OpenStreetMap) API
 * Note: For production, consider using Google Maps Geocoding API
 * which has better accuracy and higher rate limits
 * 
 * @param {string} address - Street address
 * @param {string} city - City
 * @param {string} state - State
 * @param {string} zip - Zip/postal code
 * @returns {Promise<{lat: number, lng: number} | null>} - Coordinates or null if geocoding failed
 */
async function geocodeAddress(address, city, state, zip) {
  try {
    // Use Google Geocoding API if available
    if (process.env.GOOGLE_MAPS_API_KEY) {
      return await geocodeWithGoogle(address, city, state, zip);
    }
    
    // Fallback to Nominatim (free, but with strict usage limits)
    const searchText = `${address}, ${city}, ${state} ${zip}, USA`;
    const encodedSearch = encodeURIComponent(searchText);
    
    // Add a delay to respect Nominatim's usage policy (1 request per second)
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedSearch}&limit=1`,
      {
        headers: {
          'User-Agent': 'MensHealthFinder/1.0',
        },
      }
    );
    
    if (!response.ok) {
      console.warn(`⚠️ Geocoding failed for ${searchText}: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    console.warn(`⚠️ No geocoding results for ${searchText}`);
    return null;
  } catch (error) {
    console.error(`❌ Geocoding error for ${address}, ${city}, ${state}:`, error.message);
    return null;
  }
}

/**
 * Geocode an address using Google Maps Geocoding API
 * 
 * @param {string} address - Street address
 * @param {string} city - City
 * @param {string} state - State
 * @param {string} zip - Zip/postal code
 * @returns {Promise<{lat: number, lng: number} | null>} - Coordinates or null if geocoding failed
 */
async function geocodeWithGoogle(address, city, state, zip) {
  try {
    const searchText = `${address}, ${city}, ${state} ${zip}, USA`;
    const encodedSearch = encodeURIComponent(searchText);
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedSearch}&key=${apiKey}`
    );
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    }
    
    console.warn(`⚠️ Google Geocoding failed for ${searchText}: ${response.data.status}`);
    return null;
  } catch (error) {
    console.error(`❌ Google Geocoding error for ${address}, ${city}, ${state}:`, error.message);
    return null;
  }
}

/**
 * Verify if a website is working by sending a HEAD request
 * 
 * @param {string} website - Website URL to check
 * @returns {Promise<boolean>} - Whether the website is functioning
 */
async function verifyWebsite(website) {
  if (!website) return false;
  
  try {
    const response = await axios.head(website, {
      timeout: 5000, // 5 second timeout
      maxRedirects: 5,
      validateStatus: status => status < 400 // Accept 200-399 as success
    });
    
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    return false;
  }
}

/**
 * Process a single clinic record and prepare it for Firestore
 * 
 * @param {Object} record - Raw clinic data
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} importSource - Source of the data import
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>} - Processing result
 */
async function processClinicRecord(record, db, importSource = 'manual') {
  try {
    // 1. Normalize basic fields
    const normalizedRecord = {
      name: (record.name || '').trim(),
      address: (record.address || '').trim(),
      city: (record.city || '').trim(),
      state: (record.state || '').trim(),
      zip: (record.zip || '').trim(),
      country: (record.country || 'USA').trim(),
      phone: normalizePhone(record.phone),
      website: normalizeWebsite(record.website),
      services: Array.isArray(record.services) 
        ? record.services 
        : (record.services || '').split(',').map(s => s.trim()).filter(Boolean),
      package: 'basic',
      status: 'basic',
      importSource,
      tags: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      trafficMeta: {
        totalClicks: 0,
        topSearchTerms: [],
        lastViewed: null,
      },
      validationStatus: {
        verified: false,
        method: 'auto',
        websiteOK: false,
      }
    };
    
    // Validate required fields
    if (!normalizedRecord.name || !normalizedRecord.city || !normalizedRecord.state) {
      return { 
        success: false, 
        error: 'Missing required fields (name, city, or state)' 
      };
    }
    
    // 2. Create and ensure unique slug
    const baseSlug = createSlug(
      normalizedRecord.name, 
      normalizedRecord.city, 
      normalizedRecord.state
    );
    
    if (!baseSlug) {
      return { 
        success: false, 
        error: 'Could not generate slug from clinic information' 
      };
    }
    
    normalizedRecord.slug = await ensureUniqueSlug(db, baseSlug);
    
    // 3. Geocode address
    if (normalizedRecord.address) {
      const geoResult = await geocodeAddress(
        normalizedRecord.address,
        normalizedRecord.city,
        normalizedRecord.state,
        normalizedRecord.zip
      );
      
      if (geoResult) {
        normalizedRecord.lat = geoResult.lat;
        normalizedRecord.lng = geoResult.lng;
      } else {
        normalizedRecord.tags.push('geo-mismatch');
      }
    } else {
      normalizedRecord.tags.push('missing-address');
    }
    
    // 4. Verify website
    if (normalizedRecord.website) {
      const isWebsiteWorking = await verifyWebsite(normalizedRecord.website);
      
      normalizedRecord.validationStatus.websiteOK = isWebsiteWorking;
      normalizedRecord.tags.push(isWebsiteWorking ? 'website-ok' : 'website-down');
    } else {
      normalizedRecord.tags.push('missing-website');
    }
    
    // 5. Add tags based on field completeness
    const requiredFields = ['name', 'address', 'city', 'state', 'zip', 'phone'];
    const missingRequiredFields = requiredFields.filter(field => !normalizedRecord[field]);
    
    if (missingRequiredFields.length > 0) {
      normalizedRecord.tags.push('incomplete-data');
    }
    
    return { success: true, data: normalizedRecord };
  } catch (error) {
    return { 
      success: false, 
      error: `Error processing clinic: ${error.message}`
    };
  }
}

/**
 * Parse a CSV file into an array of objects
 * 
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array<Object>>} - Parsed records
 */
function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * Parse a JSON file into an array of objects
 * 
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<Array<Object>>} - Parsed records
 */
async function parseJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(data);
    
    // Handle both array and object formats
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (typeof parsed === 'object') {
      return [parsed];
    }
    
    throw new Error('Invalid JSON format: expected array or object');
  } catch (error) {
    throw new Error(`Failed to parse JSON file: ${error.message}`);
  }
}

/**
 * Import clinics from a file into Firestore
 * 
 * @param {string} filePath - Path to the input file (CSV or JSON)
 * @param {string} importSource - Source identifier for this import
 * @returns {Promise<{total: number, success: number, failed: number, failures: Array}>} - Import results
 */
async function importClinics(filePath, importSource = 'manual') {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  console.log(`🚀 Starting import from ${filePath}`);
  
  // Initialize Firebase Admin SDK if not already initialized
  const db = initializeFirebaseAdmin();
  
  // Parse input file based on extension
  const fileExt = path.extname(filePath).toLowerCase();
  let records;
  
  if (fileExt === '.csv') {
    records = await parseCsvFile(filePath);
  } else if (fileExt === '.json') {
    records = await parseJsonFile(filePath);
  } else {
    throw new Error(`Unsupported file format: ${fileExt}. Use .csv or .json`);
  }
  
  console.log(`📋 Found ${records.length} records to process`);
  
  // Process each record
  const results = {
    total: records.length,
    success: 0,
    failed: 0,
    failures: []
  };
  
  // Use batch writes to improve performance
  // Firestore has a limit of 500 operations per batch
  const BATCH_SIZE = 450;
  let currentBatch = db.batch();
  let operationsInCurrentBatch = 0;
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const processResult = await processClinicRecord(record, db, importSource);
    
    if (processResult.success) {
      // Add to the current batch
      const docRef = db.collection('clinics').doc();
      currentBatch.set(docRef, processResult.data);
      operationsInCurrentBatch++;
      
      // If we've reached the batch limit, commit and start a new batch
      if (operationsInCurrentBatch >= BATCH_SIZE) {
        await currentBatch.commit();
        currentBatch = db.batch();
        operationsInCurrentBatch = 0;
        console.log(`✅ Committed batch of ${BATCH_SIZE} records`);
      }
      
      results.success++;
      console.log(`✅ [${i + 1}/${records.length}] Processed: ${processResult.data.name} (${processResult.data.slug})`);
    } else {
      results.failed++;
      results.failures.push({
        record,
        error: processResult.error
      });
      console.error(`❌ [${i + 1}/${records.length}] Failed: ${record.name || 'Unknown'} - ${processResult.error}`);
    }
  }
  
  // Commit any remaining records in the final batch
  if (operationsInCurrentBatch > 0) {
    await currentBatch.commit();
    console.log(`✅ Committed final batch of ${operationsInCurrentBatch} records`);
  }
  
  // Write failures to a log file
  if (results.failures.length > 0) {
    const failuresPath = path.join(path.dirname(filePath), 'import_failures.json');
    await fs.writeJson(failuresPath, results.failures, { spaces: 2 });
    console.log(`⚠️ Wrote ${results.failures.length} failures to ${failuresPath}`);
  }
  
  console.log(`
🏁 Import complete:
   Total records: ${results.total}
   Successfully imported: ${results.success}
   Failed: ${results.failed}
  `);
  
  return results;
}

/**
 * Create a sample CSV file with test data
 * 
 * @param {string} outputPath - Path to save the sample file
 * @returns {Promise<string>} - Path to the created file
 */
async function createSampleCsvFile(outputPath) {
  const sampleData = [
    {
      name: 'Premium Men\'s Health Clinic',
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      country: 'USA',
      phone: '(512) 555-1234',
      website: 'https://premium-mens-health.com',
      services: 'TRT,ED Treatment,Weight Management'
    },
    {
      name: 'Elite Male Medical',
      address: '456 Broadway Ave',
      city: 'New York',
      state: 'NY',
      zip: '10013',
      country: 'USA',
      phone: '212-555-6789',
      website: 'elitemalemedical.com',
      services: 'TRT,Peptide Therapy,Sexual Health'
    },
    {
      name: 'Total Men\'s Health',
      address: '789 Wilshire Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90017',
      country: 'USA',
      phone: '323-555-4321',
      website: 'https://totalmensclinic.com',
      services: 'TRT,Hair Loss,ED Treatment,Hormone Optimization'
    }
  ];
  
  const csv = papa.unparse(sampleData);
  await fs.writeFile(outputPath, csv);
  
  console.log(`✅ Created sample CSV file at ${outputPath}`);
  return outputPath;
}

/**
 * CLI entry point
 */
function setupCli() {
  const program = new Command();
  
  program
    .name('importClinics')
    .description('Bulk import tool for men\'s health clinics')
    .version('1.0.0');
  
  program
    .command('import')
    .description('Import clinics from a CSV or JSON file')
    .argument('<file>', 'Path to the input file (CSV or JSON)')
    .option('-s, --source <source>', 'Source identifier for this import', 'manual')
    .action(async (file, options) => {
      try {
        await importClinics(file, options.source);
      } catch (error) {
        console.error('❌ Import failed:', error.message);
        process.exit(1);
      }
    });
  
  program
    .command('create-sample')
    .description('Create a sample CSV file with test data')
    .option('-o, --output <path>', 'Output file path', './sample-clinics.csv')
    .action(async (options) => {
      try {
        await createSampleCsvFile(options.output);
      } catch (error) {
        console.error('❌ Failed to create sample file:', error.message);
        process.exit(1);
      }
    });
  
  program.parse();
}

module.exports = {
  importClinics,
  createSampleCsvFile,
  normalizePhone,
  normalizeWebsite,
  createSlug,
  ensureUniqueSlug,
  geocodeAddress,
  verifyWebsite,
  processClinicRecord
};

// Run the CLI if this file is executed directly
if (require.main === module) {
  setupCli();
}