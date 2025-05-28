import * as fs from 'fs';
import * as path from 'path';
import { parseClinicCSV } from '../utils/parseClinicCSV';
import { parseClinicJSON } from '../utils/parseClinicJSON';
import { normalizeClinicData } from '../utils/normalizeClinicData';
import { geocodeAddress, delay } from '../utils/geocodeAddress';
import { generateSlug } from '../utils/generateSlug';
import { tagClinicForReview } from '../utils/tagClinicForReview';
import { generateSeoMeta } from '../utils/generateSeoMeta';
import { generateSeoContent } from '../utils/generateSeoContent';
import { insertOrUpdateClinic } from '../utils/insertOrUpdateClinic';
import { logImportResults, createImportResult, addError, addSuccess } from '../utils/logImportResults';
import { RawClinic, ClinicInput, ClinicDocument } from '../types/clinic';

export async function importClinics(filePath?: string): Promise<void> {
  const startTime = Date.now();
  const results = createImportResult();
  
  console.log('🚀 Starting clinic import job...');
  
  try {
    // Determine input source
    const inputPath = filePath || process.argv[3] || getDefaultSampleFile();
    
    if (!inputPath) {
      throw new Error('No input file specified. Usage: npm run worker:import <file-path>');
    }
    
    console.log(`📁 Processing file: ${inputPath}`);
    
    // Parse input based on file extension
    const rawClinics = await parseInputFile(inputPath);
    results.totalProcessed = rawClinics.length;
    
    console.log(`📋 Processing ${rawClinics.length} clinic records...`);
    
    // Process each clinic
    for (let i = 0; i < rawClinics.length; i++) {
      const rawClinic = rawClinics[i];
      console.log(`\n🏥 Processing clinic ${i + 1}/${rawClinics.length}: ${rawClinic.name || 'Unknown'}`);
      
      try {
        await processClinic(rawClinic, results);
        
        // Add delay to respect API rate limits
        if (i < rawClinics.length - 1) {
          await delay(100); // 100ms delay between clinics
        }
        
      } catch (error) {
        console.error(`❌ Failed to process clinic: ${rawClinic.name}`, error);
        addError(results, 'PROCESSING_ERROR', `Failed to process ${rawClinic.name}: ${error}`, rawClinic);
        results.totalFailed++;
      }
    }
    
    // Calculate duration and log results
    results.duration = Date.now() - startTime;
    await logImportResults(results);
    
    console.log('✅ Clinic import completed successfully');
    
  } catch (error) {
    console.error('❌ Clinic import failed:', error);
    results.duration = Date.now() - startTime;
    addError(results, 'IMPORT_FAILURE', `Import job failed: ${error}`);
    await logImportResults(results);
    throw error;
  }
}

async function parseInputFile(inputPath: string): Promise<RawClinic[]> {
  const extension = path.extname(inputPath).toLowerCase();
  
  switch (extension) {
    case '.csv':
      return await parseClinicCSV(inputPath);
    case '.json':
      return await parseClinicJSON(inputPath);
    default:
      // Try to detect format from content
      const content = fs.readFileSync(inputPath, 'utf-8').trim();
      if (content.startsWith('[') || content.startsWith('{')) {
        return await parseClinicJSON(content);
      } else {
        return await parseClinicCSV(content);
      }
  }
}

async function processClinic(rawClinic: RawClinic, results: any): Promise<void> {
  // Step 1: Normalize clinic data
  const normalizedClinic = normalizeClinicData(rawClinic);
  
  if (!normalizedClinic.name || normalizedClinic.name.trim() === '') {
    addError(results, 'VALIDATION_ERROR', 'Clinic name is required', rawClinic);
    results.totalFailed++;
    return;
  }
  
  // Step 2: Geocode address
  const geocodeResult = await geocodeAddress(
    normalizedClinic.address,
    normalizedClinic.city,
    normalizedClinic.state,
    normalizedClinic.zip
  );
  
  normalizedClinic.lat = geocodeResult.lat;
  normalizedClinic.lng = geocodeResult.lng;
  
  if (geocodeResult.geoAccuracy === 'failed') {
    console.warn(`⚠️  Geocoding failed for ${normalizedClinic.name}`);
  }
  
  // Step 3: Generate slug
  const slug = await generateSlug(normalizedClinic.name, normalizedClinic.city, normalizedClinic.state);
  normalizedClinic.slug = slug;
  
  // Step 4: Tag clinic for review
  const tags = await tagClinicForReview(normalizedClinic);
  normalizedClinic.tags = tags;
  
  // Step 5: Generate SEO metadata
  const seoMeta = await generateSeoMeta(normalizedClinic);
  
  // Step 6: Generate SEO content
  const seoContent = await generateSeoContent(normalizedClinic);
  
  // Step 7: Insert or update in Firestore
  const result = await insertOrUpdateClinic(
    normalizedClinic as Omit<ClinicDocument, 'slug'>,
    slug,
    seoMeta,
    seoContent
  );
  
  addSuccess(results, result.slug, result.action);
  console.log(`   ✅ ${result.action === 'inserted' ? 'Imported' : 'Updated'}: ${slug}`);
}

function getDefaultSampleFile(): string {
  // Look for sample file in the scripts directory
  const possiblePaths = [
    path.join(__dirname, '../../web/scripts/sample-clinics.csv'),
    path.join(__dirname, '../../../apps/web/scripts/sample-clinics.csv'),
    path.join(process.cwd(), 'apps/web/scripts/sample-clinics.csv'),
    path.join(process.cwd(), 'sample-clinics.csv')
  ];
  
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  
  return '';
}