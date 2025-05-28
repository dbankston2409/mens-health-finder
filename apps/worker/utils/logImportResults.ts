import admin from '../../../packages/firebase/init';
import { ImportResult, ImportError } from '../types/clinic';

export async function logImportResults(results: ImportResult): Promise<void> {
  // Console output
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`📋 Total Processed: ${results.totalProcessed}`);
  console.log(`✅ Successfully Imported: ${results.totalImported}`);
  console.log(`🔄 Updated Existing: ${results.totalUpdated}`);
  console.log(`❌ Failed: ${results.totalFailed}`);
  console.log(`⏱️  Duration: ${formatDuration(results.duration)}`);
  
  if (results.totalProcessed > 0) {
    const successRate = ((results.totalImported + results.totalUpdated) / results.totalProcessed * 100).toFixed(1);
    console.log(`📈 Success Rate: ${successRate}%`);
  }
  
  // Error breakdown
  if (results.errors.length > 0) {
    console.log('\n❌ ERROR BREAKDOWN:');
    console.log('-'.repeat(40));
    
    const errorCounts = groupErrorsByType(results.errors);
    Object.entries(errorCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} occurrence(s)`);
    });
    
    // Show sample errors
    console.log('\n📋 SAMPLE ERRORS:');
    console.log('-'.repeat(40));
    results.errors.slice(0, 5).forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.type}: ${error.message}`);
      if (error.data) {
        console.log(`      Data: ${JSON.stringify(error.data).substring(0, 100)}...`);
      }
    });
  }
  
  // Success summary
  if (results.successfulSlugs.length > 0) {
    console.log('\n✅ SUCCESSFUL IMPORTS:');
    console.log('-'.repeat(40));
    console.log(`   First 10 slugs: ${results.successfulSlugs.slice(0, 10).join(', ')}`);
    if (results.successfulSlugs.length > 10) {
      console.log(`   ... and ${results.successfulSlugs.length - 10} more`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Save to Firestore
  try {
    await saveImportLogToFirestore(results);
    console.log('📝 Import log saved to Firestore');
  } catch (error) {
    console.warn('⚠️  Failed to save import log to Firestore:', error);
  }
}

function groupErrorsByType(errors: ImportError[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  errors.forEach(error => {
    counts[error.type] = (counts[error.type] || 0) + error.count;
  });
  
  return counts;
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

async function saveImportLogToFirestore(results: ImportResult): Promise<void> {
  const db = admin.firestore();
  
  const logDoc = {
    timestamp: new Date(),
    totalProcessed: results.totalProcessed,
    totalImported: results.totalImported,
    totalUpdated: results.totalUpdated,
    totalFailed: results.totalFailed,
    duration: results.duration,
    successRate: results.totalProcessed > 0 ? 
      ((results.totalImported + results.totalUpdated) / results.totalProcessed * 100) : 0,
    errorSummary: groupErrorsByType(results.errors),
    errors: results.errors.slice(0, 20), // Limit to first 20 errors
    successfulSlugs: results.successfulSlugs.slice(0, 50), // Limit to first 50 slugs
    metadata: {
      importType: 'clinic_import',
      version: '1.0',
      environment: process.env.NODE_ENV || 'development'
    }
  };
  
  await db.collection('importLogs').add(logDoc);
}

export function createImportResult(): ImportResult {
  return {
    totalProcessed: 0,
    totalImported: 0,
    totalUpdated: 0,
    totalFailed: 0,
    errors: [],
    successfulSlugs: [],
    duration: 0
  };
}

export function addError(results: ImportResult, type: string, message: string, data?: any): void {
  // Check if this error type already exists
  const existingError = results.errors.find(error => 
    error.type === type && error.message === message
  );
  
  if (existingError) {
    existingError.count++;
  } else {
    results.errors.push({
      type,
      message,
      data,
      count: 1
    });
  }
}

export function addSuccess(results: ImportResult, slug: string, action: 'inserted' | 'updated'): void {
  results.successfulSlugs.push(slug);
  
  if (action === 'inserted') {
    results.totalImported++;
  } else {
    results.totalUpdated++;
  }
}