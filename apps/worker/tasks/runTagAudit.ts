import { collection, getDocs, doc, updateDoc, serverTimestamp, writeBatch } from '../lib/firebase-compat';
import { db } from '../lib/firebase';
import { analyzeClinicTags, getTagAnalysisSummary, ClinicAnalysisResult } from '../utils/analyzeClinicTags';

export interface TagAuditResult {
  success: boolean;
  summary: {
    totalProcessed: number;
    newTags: number;
    resolvedTags: number;
    criticalIssues: number;
    averageScore: number;
    tagDistribution: Record<string, number>;
    duration: number;
  };
  errors: string[];
}

/**
 * Run comprehensive tag audit across all active clinics
 */
export async function runTagAudit(
  options: {
    batchSize?: number;
    statusFilter?: string[];
    dryRun?: boolean;
  } = {}
): Promise<TagAuditResult> {
  const startTime = Date.now();
  const { batchSize = 50, statusFilter = ['active'], dryRun = false } = options;
  
  console.log(`🚀 Starting tag audit${dryRun ? ' (DRY RUN)' : ''}...`);
  
  const results: ClinicAnalysisResult[] = [];
  const errors: string[] = [];
  
  try {
    // Get all clinics (in production, add pagination)
    const clinicsRef = collection(db, 'clinics');
    const clinicsSnap = await getDocs(clinicsRef);
    
    const allClinics = clinicsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(clinic => !statusFilter.length || statusFilter.includes(clinic.status));
    
    console.log(`📋 Found ${allClinics.length} clinics to analyze`);
    
    // Process in batches
    for (let i = 0; i < allClinics.length; i += batchSize) {
      const batch = allClinics.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allClinics.length / batchSize)}`);
      
      // Analyze clinics in parallel within batch
      const batchPromises = batch.map(async (clinic) => {
        try {
          return await analyzeClinicTags(clinic.id, clinic);
        } catch (error) {
          const errorMsg = `Failed to analyze ${clinic.id}: ${error}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(r => r !== null) as ClinicAnalysisResult[];
      results.push(...validResults);
      
      // Update Firestore in batches (if not dry run)
      if (!dryRun && validResults.length > 0) {
        await updateClinicsInBatch(batch, validResults);
      }
      
      // Small delay between batches to avoid overwhelming Firestore
      if (i + batchSize < allClinics.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const duration = Date.now() - startTime;
    const summary = {
      ...getTagAnalysisSummary(results),
      duration
    };
    
    console.log(`✅ Tag audit complete:`);
    console.log(`   📊 Processed: ${summary.totalProcessed} clinics`);
    console.log(`   🆕 New tags: ${summary.newTags}`);
    console.log(`   ✅ Resolved: ${summary.resolvedTags}`);
    console.log(`   🚨 Critical issues: ${summary.criticalIssues}`);
    console.log(`   📈 Average SEO score: ${summary.averageScore.toFixed(1)}`);
    console.log(`   ⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);
    
    if (errors.length > 0) {
      console.log(`   ⚠️  Errors: ${errors.length}`);
    }
    
    return {
      success: true,
      summary,
      errors
    };
    
  } catch (error) {
    console.error('❌ Tag audit failed:', error);
    
    return {
      success: false,
      summary: {
        totalProcessed: results.length,
        newTags: 0,
        resolvedTags: 0,
        criticalIssues: 0,
        averageScore: 0,
        tagDistribution: {},
        duration: Date.now() - startTime
      },
      errors: [...errors, `Audit failed: ${error}`]
    };
  }
}

/**
 * Update multiple clinics in Firestore batches
 */
async function updateClinicsInBatch(
  clinics: any[], 
  results: ClinicAnalysisResult[]
): Promise<void> {
  const batch = writeBatch(db);
  const timestamp = serverTimestamp();
  
  for (let i = 0; i < clinics.length && i < results.length; i++) {
    const clinic = clinics[i];
    const result = results[i];
    
    if (result) {
      const clinicRef = doc(db, 'clinics', clinic.id);
      
      batch.update(clinicRef, {
        tags: result.tags,
        suggestions: result.suggestions.map(s => ({
          ...s,
          createdAt: timestamp
        })),
        'seoMeta.seoScore': result.seoScore,
        'seoMeta.tagScanLastRun': timestamp,
        'seoMeta.tagsLastUpdated': timestamp
      });
    }
  }
  
  await batch.commit();
  console.log(`💾 Updated ${Math.min(clinics.length, results.length)} clinics in Firestore`);
}

/**
 * Run audit for a single clinic (for testing/debugging)
 */
export async function runSingleClinicAudit(clinicId: string): Promise<ClinicAnalysisResult> {
  console.log(`🔍 Running single clinic audit: ${clinicId}`);
  
  const result = await analyzeClinicTags(clinicId);
  
  // Update Firestore
  const clinicRef = doc(db, 'clinics', clinicId);
  await updateDoc(clinicRef, {
    tags: result.tags,
    suggestions: result.suggestions,
    'seoMeta.seoScore': result.seoScore,
    'seoMeta.tagScanLastRun': serverTimestamp(),
    'seoMeta.tagsLastUpdated': serverTimestamp()
  });
  
  console.log(`✅ Single audit complete for ${clinicId}`);
  return result;
}

// Export for CLI usage
if (require.main === module) {
  // CLI execution
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  runTagAudit({ dryRun })
    .then(result => {
      console.log('\n📊 Final Summary:');
      console.log(JSON.stringify(result.summary, null, 2));
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Audit crashed:', error);
      process.exit(1);
    });
}