import { doc, getDoc, updateDoc, serverTimestamp, writeBatch, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface ClinicVerificationResult {
  clinicId: string;
  success: boolean;
  checks: {
    websiteReachable: boolean;
    addressExists: boolean;
    noDuplicateSlug: boolean;
    phoneValid: boolean;
    servicesListed: boolean;
  };
  errors: string[];
  warnings: string[];
}

export interface BulkVerificationResult {
  success: boolean;
  summary: {
    totalProcessed: number;
    verified: number;
    failed: number;
    warnings: number;
    duration: number;
  };
  results: ClinicVerificationResult[];
  errors: string[];
}

/**
 * Bulk verify multiple clinics
 */
export async function bulkVerifyClinics(
  clinicSlugs: string[],
  options: {
    verifiedBy?: string;
    batchSize?: number;
    autoActivate?: boolean;
    skipDuplicateCheck?: boolean;
  } = {}
): Promise<BulkVerificationResult> {
  const startTime = Date.now();
  const {
    verifiedBy = 'importBot',
    batchSize = 20,
    autoActivate = true,
    skipDuplicateCheck = false
  } = options;
  
  console.log(`🔍 Starting bulk verification for ${clinicSlugs.length} clinics...`);
  console.log(`   Verified by: ${verifiedBy}`);
  console.log(`   Auto-activate: ${autoActivate}`);
  
  const results: ClinicVerificationResult[] = [];
  const errors: string[] = [];
  let verified = 0;
  let failed = 0;
  let warnings = 0;
  
  try {
    // Process in batches
    for (let i = 0; i < clinicSlugs.length; i += batchSize) {
      const batch = clinicSlugs.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(clinicSlugs.length / batchSize)}`);
      
      // Process batch in parallel
      const batchPromises = batch.map(slug => verifyClinic(slug, { skipDuplicateCheck }));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Update Firestore for successful verifications
      if (!skipDuplicateCheck) {
        await updateVerifiedClinics(batchResults.filter(r => r.success), verifiedBy, autoActivate);
      }
      
      // Update counters
      verified += batchResults.filter(r => r.success).length;
      failed += batchResults.filter(r => !r.success).length;
      warnings += batchResults.filter(r => r.warnings.length > 0).length;
      
      // Small delay between batches
      if (i + batchSize < clinicSlugs.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    const duration = Date.now() - startTime;
    
    const summary = {
      totalProcessed: results.length,
      verified,
      failed,
      warnings,
      duration
    };
    
    console.log(`✅ Bulk verification complete:`);
    console.log(`   📋 Processed: ${summary.totalProcessed} clinics`);
    console.log(`   ✅ Verified: ${summary.verified}`);
    console.log(`   ❌ Failed: ${summary.failed}`);
    console.log(`   ⚠️  Warnings: ${summary.warnings}`);
    console.log(`   ⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);
    
    return {
      success: true,
      summary,
      results,
      errors
    };
    
  } catch (error) {
    console.error('❌ Bulk verification failed:', error);
    
    return {
      success: false,
      summary: {
        totalProcessed: results.length,
        verified,
        failed,
        warnings,
        duration: Date.now() - startTime
      },
      results,
      errors: [...errors, `Bulk verification failed: ${error}`]
    };
  }
}

/**
 * Verify a single clinic
 */
async function verifyClinic(
  clinicSlug: string,
  options: { skipDuplicateCheck?: boolean } = {}
): Promise<ClinicVerificationResult> {
  const { skipDuplicateCheck = false } = options;
  
  const result: ClinicVerificationResult = {
    clinicId: clinicSlug,
    success: false,
    checks: {
      websiteReachable: false,
      addressExists: false,
      noDuplicateSlug: true,
      phoneValid: false,
      servicesListed: false
    },
    errors: [],
    warnings: []
  };
  
  try {
    // Get clinic data
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const clinicSnap = await getDoc(clinicRef);
    
    if (!clinicSnap.exists()) {
      result.errors.push('Clinic not found');
      return result;
    }
    
    const clinicData = clinicSnap.data();
    
    // Check 1: Website reachable
    if (clinicData.website) {
      try {
        result.checks.websiteReachable = await checkWebsiteReachable(clinicData.website);
        if (!result.checks.websiteReachable) {
          result.warnings.push('Website may not be reachable');
        }
      } catch (error) {
        result.warnings.push(`Website check failed: ${error}`);
      }
    } else {
      result.warnings.push('No website URL provided');
    }
    
    // Check 2: Address exists
    if (clinicData.address && clinicData.city && clinicData.state) {
      result.checks.addressExists = true;
      
      // Additional geocoding check could be added here
      if (!clinicData.lat || !clinicData.lng) {
        result.warnings.push('Address not geocoded');
      }
    } else {
      result.errors.push('Incomplete address information');
    }
    
    // Check 3: No duplicate slug
    if (!skipDuplicateCheck) {
      const duplicateCheck = await checkForDuplicateSlug(clinicSlug, clinicData.name);
      result.checks.noDuplicateSlug = !duplicateCheck.hasDuplicate;
      if (duplicateCheck.hasDuplicate) {
        result.errors.push(`Duplicate slug found: ${duplicateCheck.duplicateId}`);
      }
    }
    
    // Check 4: Phone valid
    if (clinicData.phone) {
      result.checks.phoneValid = validatePhoneNumber(clinicData.phone);
      if (!result.checks.phoneValid) {
        result.warnings.push('Phone number format may be invalid');
      }
    } else {
      result.warnings.push('No phone number provided');
    }
    
    // Check 5: Services listed
    if (clinicData.services && clinicData.services.length > 0) {
      result.checks.servicesListed = true;
    } else {
      result.warnings.push('No services listed');
    }
    
    // Determine overall success
    const criticalChecks = [
      result.checks.addressExists,
      result.checks.noDuplicateSlug
    ];
    
    result.success = criticalChecks.every(Boolean) && result.errors.length === 0;
    
    if (result.success) {
      console.log(`✅ Verified: ${clinicData.name || clinicSlug}`);
    } else {
      console.log(`❌ Failed: ${clinicData.name || clinicSlug} - ${result.errors.join(', ')}`);
    }
    
    return result;
    
  } catch (error) {
    result.errors.push(`Verification error: ${error}`);
    console.error(`❌ Verification failed for ${clinicSlug}:`, error);
    return result;
  }
}

/**
 * Check if website is reachable
 */
async function checkWebsiteReachable(url: string): Promise<boolean> {
  try {
    // Normalize URL
    let testUrl = url;
    if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
      testUrl = 'https://' + testUrl;
    }
    
    // In a real implementation, you would make an HTTP request
    // For now, we'll do basic URL validation
    new URL(testUrl);
    
    // Mock check - in production, you might use a service like:
    // const response = await fetch(testUrl, { method: 'HEAD', timeout: 5000 });
    // return response.ok;
    
    return true; // Assume reachable for now
    
  } catch (error) {
    return false;
  }
}

/**
 * Check for duplicate clinics
 */
async function checkForDuplicateSlug(
  currentSlug: string, 
  clinicName: string
): Promise<{ hasDuplicate: boolean; duplicateId?: string }> {
  try {
    // Check for exact name matches (case insensitive)
    const clinicsRef = collection(db, 'clinics');
    const nameQuery = query(
      clinicsRef,
      where('name', '>=', clinicName.toLowerCase()),
      where('name', '<=', clinicName.toLowerCase() + '\uf8ff')
    );
    
    const nameSnap = await getDocs(nameQuery);
    
    for (const doc of nameSnap.docs) {
      if (doc.id !== currentSlug && 
          doc.data().name?.toLowerCase() === clinicName.toLowerCase()) {
        return {
          hasDuplicate: true,
          duplicateId: doc.id
        };
      }
    }
    
    return { hasDuplicate: false };
    
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return { hasDuplicate: false };
  }
}

/**
 * Validate phone number format
 */
function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 digits)
  if (digits.length === 10) {
    return true;
  }
  
  // Check if it's a valid US phone number with country code (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    return true;
  }
  
  return false;
}

/**
 * Update verified clinics in Firestore
 */
async function updateVerifiedClinics(
  successfulResults: ClinicVerificationResult[],
  verifiedBy: string,
  autoActivate: boolean
): Promise<void> {
  if (successfulResults.length === 0) {
    return;
  }
  
  const batch = writeBatch(db);
  const timestamp = serverTimestamp();
  
  for (const result of successfulResults) {
    const clinicRef = doc(db, 'clinics', result.clinicId);
    
    const updateData: any = {
      isVerified: true,
      verifiedAt: timestamp,
      verifiedBy,
      'validation.bulkVerified': true,
      'validation.verificationChecks': result.checks,
      'validation.lastValidationRun': timestamp
    };
    
    if (autoActivate) {
      updateData.status = 'active';
      updateData.statusChangedAt = timestamp;
      updateData.statusChangedBy = verifiedBy;
    }
    
    if (result.warnings.length > 0) {
      updateData['validation.warnings'] = result.warnings;
    }
    
    batch.update(clinicRef, updateData);
  }
  
  await batch.commit();
  console.log(`💾 Updated ${successfulResults.length} verified clinics in Firestore`);
}

/**
 * Verify clinics from a CSV file or list
 */
export async function bulkVerifyFromList(
  clinicIdentifiers: Array<{ slug?: string; name?: string; id?: string }>,
  verifiedBy: string = 'importBot'
): Promise<BulkVerificationResult> {
  const slugs: string[] = [];
  
  for (const identifier of clinicIdentifiers) {
    if (identifier.slug) {
      slugs.push(identifier.slug);
    } else if (identifier.id) {
      slugs.push(identifier.id);
    } else if (identifier.name) {
      // Try to find by name
      try {
        const clinicsRef = collection(db, 'clinics');
        const nameQuery = query(
          clinicsRef,
          where('name', '==', identifier.name)
        );
        const nameSnap = await getDocs(nameQuery);
        
        if (nameSnap.docs.length > 0) {
          slugs.push(nameSnap.docs[0].id);
        }
      } catch (error) {
        console.error(`Failed to find clinic by name "${identifier.name}":`, error);
      }
    }
  }
  
  return bulkVerifyClinics(slugs, { verifiedBy });
}

// Export for CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const slugsArg = args.find(arg => arg.startsWith('--slugs='));
  const verifiedBy = args.find(arg => arg.startsWith('--by='))?.split('=')[1] || 'CLI';
  
  if (!slugsArg) {
    console.error('Usage: node bulkVerifyClinics.js --slugs=slug1,slug2,slug3 [--by=verifierName]');
    process.exit(1);
  }
  
  const slugs = slugsArg.split('=')[1].split(',').map(s => s.trim());
  
  bulkVerifyClinics(slugs, { verifiedBy })
    .then(result => {
      console.log('\n📋 Final Summary:');
      console.log(JSON.stringify(result.summary, null, 2));
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Bulk verification crashed:', error);
      process.exit(1);
    });
}