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
import { RawClinic, ClinicInput, ClinicDocument, SeoMeta } from '../types/clinic';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc, query, where, getDocs } from '../lib/firebase-compat';

// Create import session for real-time tracking
async function createImportSession() {
  return await addDoc(collection(db, 'import_sessions'), {
    startTime: serverTimestamp(),
    status: 'preparing',
    totalClinics: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    duplicates: 0,
    errors: [],
    successfulSlugs: []
  });
}

// Update import session status
async function updateImportSession(sessionId: string, data: any) {
  try {
    await updateDoc(doc(db, 'import_sessions', sessionId), {
      ...data,
      lastUpdate: serverTimestamp()
    });
  } catch (error) {
    console.warn('Failed to update import session:', error);
  }
}

// Get current session errors
async function getSessionErrors(sessionId: string): Promise<any[]> {
  try {
    const sessionDoc = await getDoc(doc(db, 'import_sessions', sessionId));
    return sessionDoc.data()?.errors || [];
  } catch {
    return [];
  }
}

export async function importClinics(filePath?: string): Promise<void> {
  const startTime = Date.now();
  const results = createImportResult();
  
  console.log('🚀 Starting clinic import job...');
  
  // Create import session for tracking
  const sessionRef = await createImportSession();
  const sessionId = sessionRef.id;
  console.log(`📊 Import session created: ${sessionId}`);
  
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
    
    // Update session with total count
    await updateImportSession(sessionId, {
      status: 'processing',
      totalClinics: rawClinics.length
    });
    
    // Process each clinic
    for (let i = 0; i < rawClinics.length; i++) {
      const rawClinic = rawClinics[i];
      const clinicName = rawClinic.name || 'Unknown';
      console.log(`\n🏥 Processing clinic ${i + 1}/${rawClinics.length}: ${clinicName}`);
      
      // Update session with current clinic
      await updateImportSession(sessionId, {
        currentClinic: clinicName,
        currentIndex: i + 1,
        processed: i,
        successful: results.totalSuccess,
        failed: results.totalFailed,
        duplicates: results.duplicates || 0
      });
      
      try {
        const result = await processClinic(rawClinic, results, sessionId);
        
        // Update success in session
        if (result && result.isDuplicate) {
          results.duplicates = (results.duplicates || 0) + 1;
        }
        
        // Add delay to respect API rate limits
        if (i < rawClinics.length - 1) {
          await delay(100); // 100ms delay between clinics
        }
        
      } catch (error) {
        console.error(`❌ Failed to process clinic: ${clinicName}`, error);
        addError(results, 'PROCESSING_ERROR', `Failed to process ${clinicName}: ${error}`, rawClinic);
        results.totalFailed++;
        
        // Add error to session
        await updateImportSession(sessionId, {
          errors: [...(await getSessionErrors(sessionId)), {
            clinic: clinicName,
            error: error.message || String(error),
            timestamp: new Date()
          }].slice(-50) // Keep last 50 errors
        });
      }
    }
    
    // Calculate duration and log results
    results.duration = Date.now() - startTime;
    await logImportResults(results);
    
    // Update session as completed
    await updateImportSession(sessionId, {
      status: 'completed',
      endTime: serverTimestamp(),
      processed: results.totalProcessed,
      successful: results.totalSuccess,
      failed: results.totalFailed,
      duplicates: results.duplicates || 0
    });
    
    console.log('✅ Clinic import completed successfully');
    console.log(`📊 View progress at: /admin/imports/${sessionId}`);
    
  } catch (error) {
    console.error('❌ Clinic import failed:', error);
    results.duration = Date.now() - startTime;
    addError(results, 'IMPORT_FAILURE', `Import job failed: ${error}`);
    await logImportResults(results);
    
    // Update session as failed
    await updateImportSession(sessionId, {
      status: 'failed',
      endTime: serverTimestamp(),
      error: error.message || String(error)
    });
    
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

async function processClinic(rawClinic: RawClinic, results: any, sessionId: string): Promise<any> {
  // Step 1: Normalize clinic data
  const normalizedClinic = normalizeClinicData(rawClinic);
  
  if (!normalizedClinic.name || normalizedClinic.name.trim() === '') {
    addError(results, 'VALIDATION_ERROR', 'Clinic name is required', rawClinic);
    results.totalFailed++;
    return { isDuplicate: false };
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
  
  // Step 3: Check for duplicates (different logic for branches)
  const duplicateCheck = await checkForDuplicate(normalizedClinic);
  
  // Step 4: Generate slug (handle branches)
  let slug;
  if (duplicateCheck.isDuplicate && duplicateCheck.isNewBranch) {
    // Same name but different location - create branch slug
    slug = await generateSlug(
      normalizedClinic.name, 
      normalizedClinic.city, 
      normalizedClinic.state,
      true // Force location in slug for branches
    );
    normalizedClinic.tags.push('branch-location');
  } else if (duplicateCheck.isDuplicate && !duplicateCheck.isNewBranch) {
    // True duplicate - skip or merge based on settings
    console.log(`⚠️  Duplicate detected: ${normalizedClinic.name} in ${normalizedClinic.city}`);
    addError(results, 'DUPLICATE', `Duplicate clinic: ${normalizedClinic.name}`, rawClinic);
    results.totalFailed++;
    return { isDuplicate: true };
  } else {
    // New clinic
    slug = await generateSlug(normalizedClinic.name, normalizedClinic.city, normalizedClinic.state);
  }
  normalizedClinic.slug = slug;
  
  // Step 5: Tag clinic for review
  const tags = await tagClinicForReview(normalizedClinic);
  normalizedClinic.tags = tags;
  
  // Step 6: Generate SEO metadata
  let seoMeta: SeoMeta | null = null;
  let seoGenerationFailed = false;
  
  try {
    seoMeta = await generateSeoMeta(normalizedClinic);
  } catch (error) {
    console.warn(`⚠️  SEO meta generation failed for ${normalizedClinic.name}: ${error}`);
    normalizedClinic.tags.push('needs-seo-meta');
    seoGenerationFailed = true;
    
    // Create minimal SEO meta for import
    seoMeta = {
      title: `${normalizedClinic.name} - Men's Health Clinic`,
      description: `Men's health clinic in ${normalizedClinic.city}, ${normalizedClinic.state}`,
      keywords: [normalizedClinic.name.toLowerCase(), normalizedClinic.city.toLowerCase()],
      indexed: false
    };
  }
  
  // Step 7: Generate SEO content
  let seoContent = '';
  
  try {
    seoContent = await generateSeoContent(normalizedClinic);
  } catch (error) {
    console.warn(`⚠️  SEO content generation failed for ${normalizedClinic.name}: ${error}`);
    normalizedClinic.tags.push('needs-seo-content');
    seoGenerationFailed = true;
    
    // Set minimal content placeholder
    seoContent = `<p>Content pending generation for ${normalizedClinic.name}</p>`;
  }
  
  // Add tag for manual review if SEO generation failed
  if (seoGenerationFailed && !normalizedClinic.tags.includes('needs-review')) {
    normalizedClinic.tags.push('needs-review');
  }
  
  // Step 8: Insert or update in Firestore
  const result = await insertOrUpdateClinic(
    normalizedClinic as Omit<ClinicDocument, 'slug'>,
    slug,
    seoMeta,
    seoContent
  );
  
  addSuccess(results, result.slug, result.action);
  console.log(`   ✅ ${result.action === 'inserted' ? 'Imported' : 'Updated'}: ${slug}${seoGenerationFailed ? ' (SEO pending)' : ''}`);
  
  // Update session with successful slug
  const currentSlugs = await getSessionSuccessfulSlugs(sessionId);
  await updateImportSession(sessionId, {
    successfulSlugs: [...currentSlugs, slug].slice(-100) // Keep last 100
  });
  
  return { isDuplicate: false, slug };
}

// Get current successful slugs from session
async function getSessionSuccessfulSlugs(sessionId: string): Promise<string[]> {
  try {
    const sessionDoc = await getDoc(doc(db, 'import_sessions', sessionId));
    return sessionDoc.data()?.successfulSlugs || [];
  } catch {
    return [];
  }
}

// Check for duplicate clinics with branch detection
async function checkForDuplicate(clinic: ClinicInput): Promise<{isDuplicate: boolean, isNewBranch: boolean}> {
  const { name, address, city, state, phone } = clinic;
  
  // Check for exact address match (true duplicate)
  if (address && city) {
    const exactAddressMatch = await getDocs(
      query(
        collection(db, 'clinics'),
        where('address', '==', address),
        where('city', '==', city),
        where('state', '==', state)
      )
    );
      
    if (!exactAddressMatch.empty) {
      return { isDuplicate: true, isNewBranch: false };
    }
  }
  
  // Check for same name in same city (likely duplicate)
  if (name && city) {
    const sameCityMatch = await getDocs(
      query(
        collection(db, 'clinics'),
        where('name', '==', name),
        where('city', '==', city)
      )
    );
      
    if (!sameCityMatch.empty) {
      return { isDuplicate: true, isNewBranch: false };
    }
  }
  
  // Check for same name but different location (branch)
  if (name) {
    const sameNameMatch = await getDocs(
      query(
        collection(db, 'clinics'),
        where('name', '==', name)
      )
    );
      
    if (!sameNameMatch.empty) {
      // Same name exists but in different location - this is a branch
      return { isDuplicate: true, isNewBranch: true };
    }
  }
  
  // Check for same phone number (might be duplicate)
  if (phone && phone !== 'invalid') {
    const phoneMatch = await getDocs(
      query(
        collection(db, 'clinics'),
        where('phone', '==', phone)
      )
    );
      
    if (!phoneMatch.empty) {
      // Check if it's the same address
      const existingClinic = phoneMatch.docs[0].data();
      if (existingClinic.address === address && existingClinic.city === city) {
        return { isDuplicate: true, isNewBranch: false };
      }
      // Different address with same phone - might be data error
      console.warn(`⚠️  Same phone number ${phone} found for different location`);
    }
  }
  
  return { isDuplicate: false, isNewBranch: false };
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

// Process import jobs from Firestore queue
export async function processImportJobs(): Promise<void> {
  console.log('🔍 Checking for pending import jobs...');
  
  try {
    // Get pending import jobs
    const jobsQuery = query(
      collection(db, 'import_jobs'),
      where('status', '==', 'pending')
    );
    
    const jobsSnapshot = await getDocs(jobsQuery);
    
    if (jobsSnapshot.empty) {
      console.log('No pending import jobs found');
      return;
    }
    
    console.log(`Found ${jobsSnapshot.size} pending import job(s)`);
    
    // Process each job
    for (const jobDoc of jobsSnapshot.docs) {
      const job = jobDoc.data();
      const jobId = jobDoc.id;
      
      console.log(`\n📋 Processing import job: ${jobId}`);
      console.log(`   Session ID: ${job.sessionId}`);
      console.log(`   Total clinics: ${job.data?.length || 0}`);
      
      try {
        // Update job status to processing
        await updateDoc(doc(db, 'import_jobs', jobId), {
          status: 'processing',
          startedAt: serverTimestamp()
        });
        
        // Update session status
        if (job.sessionId) {
          await updateImportSession(job.sessionId, {
            status: 'processing',
            totalClinics: job.data?.length || 0
          });
        }
        
        // Process the clinics
        const results = createImportResult();
        const clinics = job.data || [];
        
        for (let i = 0; i < clinics.length; i++) {
          const clinic = clinics[i];
          console.log(`\n${i + 1}/${clinics.length}: Processing ${clinic.name || 'Unknown'}`);
          
          try {
            // Process single clinic
            const processResult = await processClinic(clinic, results, job.sessionId);
            
            if (!processResult.isDuplicate) {
              results.totalSuccess++;
            }
            
            // Update session progress
            if (job.sessionId) {
              await updateImportSession(job.sessionId, {
                processed: i + 1,
                successful: results.totalSuccess,
                failed: results.totalFailed,
                duplicates: results.errors.filter(e => e.code === 'DUPLICATE').length
              });
            }
            
            // Add small delay to avoid rate limiting
            if (i < clinics.length - 1) {
              await delay(100);
            }
          } catch (error) {
            console.error(`Error processing clinic ${clinic.name}:`, error);
            results.totalFailed++;
            addError(results, 'PROCESSING_ERROR', error instanceof Error ? error.message : 'Unknown error', clinic);
            
            // Update session with error
            if (job.sessionId) {
              const currentErrors = await getSessionErrors(job.sessionId);
              await updateImportSession(job.sessionId, {
                errors: [...currentErrors, {
                  clinic: clinic.name || 'Unknown',
                  error: error instanceof Error ? error.message : 'Unknown error',
                  timestamp: new Date().toISOString()
                }].slice(-50) // Keep last 50 errors
              });
            }
          }
        }
        
        // Log results
        await logImportResults(results);
        
        // Update job status to completed
        await updateDoc(doc(db, 'import_jobs', jobId), {
          status: 'completed',
          completedAt: serverTimestamp(),
          results: {
            totalProcessed: results.totalProcessed,
            totalSuccess: results.totalSuccess,
            totalFailed: results.totalFailed,
            errors: results.errors
          }
        });
        
        // Update session status
        if (job.sessionId) {
          await updateImportSession(job.sessionId, {
            status: 'completed',
            endTime: serverTimestamp()
          });
        }
        
        console.log(`\n✅ Import job ${jobId} completed successfully`);
        console.log(`   Processed: ${results.totalProcessed}`);
        console.log(`   Success: ${results.totalSuccess}`);
        console.log(`   Failed: ${results.totalFailed}`);
        
      } catch (error) {
        console.error(`Failed to process import job ${jobId}:`, error);
        
        // Update job status to failed
        await updateDoc(doc(db, 'import_jobs', jobId), {
          status: 'failed',
          failedAt: serverTimestamp(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Update session status
        if (job.sessionId) {
          await updateImportSession(job.sessionId, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking import jobs:', error);
  }
}