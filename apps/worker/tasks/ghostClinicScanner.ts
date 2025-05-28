import { collection, getDocs, doc, updateDoc, query, where, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { detectClinicEngagement } from '../utils/detectClinicEngagement';

export interface GhostClinicScanResult {
  success: boolean;
  summary: {
    totalScanned: number;
    ghostClinicsFound: number;
    ghostClinicsTagged: number;
    clinicsReactivated: number;
    errors: number;
    duration: number;
  };
  ghostClinics: Array<{
    id: string;
    name: string;
    lastActivity: Date | null;
    daysSinceActivity: number;
    previousStatus: string;
  }>;
  errors: string[];
}

/**
 * Scan for ghost clinics (no activity in 90+ days)
 */
export async function ghostClinicScanner(
  options: {
    dryRun?: boolean;
    inactiveDays?: number;
    batchSize?: number;
  } = {}
): Promise<GhostClinicScanResult> {
  const startTime = Date.now();
  const { dryRun = false, inactiveDays = 90, batchSize = 50 } = options;
  
  console.log(`👻 Starting ghost clinic scan${dryRun ? ' (DRY RUN)' : ''}...`);
  console.log(`   Looking for clinics inactive for ${inactiveDays}+ days`);
  
  const errors: string[] = [];
  const ghostClinics: GhostClinicScanResult['ghostClinics'] = [];
  let totalScanned = 0;
  let ghostClinicsTagged = 0;
  let clinicsReactivated = 0;
  
  try {
    // Get all active clinics
    const clinicsRef = collection(db, 'clinics');
    const activeQuery = query(clinicsRef, where('status', '==', 'active'));
    const clinicsSnap = await getDocs(activeQuery);
    
    const clinics = clinicsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📋 Found ${clinics.length} active clinics to scan`);
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);
    
    // Process clinics in batches
    for (let i = 0; i < clinics.length; i += batchSize) {
      const batch = clinics.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(clinics.length / batchSize)}`);
      
      for (const clinic of batch) {
        try {
          totalScanned++;
          
          // Get engagement data for this clinic
          const engagement = await detectClinicEngagement(clinic.id);
          
          if (!engagement.success) {
            errors.push(`Failed to get engagement for ${clinic.id}: ${engagement.error}`);
            continue;
          }
          
          const { lastClick, lastCall, lastVisit, totalClicks30d, totalCalls30d } = engagement.engagement;
          
          // Find most recent activity
          const activityDates = [lastClick, lastCall, lastVisit].filter(Boolean) as Date[];
          const lastActivity = activityDates.length > 0 
            ? new Date(Math.max(...activityDates.map(d => d.getTime())))
            : null;
          
          // Check if clinic is ghost
          const isGhost = (
            // No activity in specified period
            (!lastActivity || lastActivity < cutoffDate) &&
            // No recent clicks or calls
            totalClicks30d === 0 && totalCalls30d === 0
          );
          
          const daysSinceActivity = lastActivity 
            ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          
          const wasAlreadyGhost = clinic.tags?.includes('ghost-clinic');
          
          if (isGhost && !wasAlreadyGhost) {
            // New ghost clinic found
            ghostClinics.push({
              id: clinic.id,
              name: clinic.name || 'Unnamed Clinic',
              lastActivity,
              daysSinceActivity,
              previousStatus: clinic.status
            });
            
            if (!dryRun) {
              await tagAsGhostClinic(clinic.id, daysSinceActivity);
              ghostClinicsTagged++;
            }
            
            console.log(`👻 Ghost clinic found: ${clinic.name} (${daysSinceActivity} days inactive)`);
            
          } else if (!isGhost && wasAlreadyGhost) {
            // Previously ghost clinic is now active
            if (!dryRun) {
              await removeGhostTag(clinic.id);
              clinicsReactivated++;
            }
            
            console.log(`✨ Ghost clinic reactivated: ${clinic.name}`);
          }
          
        } catch (error) {
          const errorMsg = `Error processing clinic ${clinic.id}: ${error}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
      
      // Small delay between batches
      if (i + batchSize < clinics.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const duration = Date.now() - startTime;
    
    const summary = {
      totalScanned,
      ghostClinicsFound: ghostClinics.length,
      ghostClinicsTagged,
      clinicsReactivated,
      errors: errors.length,
      duration
    };
    
    console.log(`✅ Ghost clinic scan complete:`);
    console.log(`   📋 Scanned: ${summary.totalScanned} clinics`);
    console.log(`   👻 Found: ${summary.ghostClinicsFound} ghost clinics`);
    console.log(`   🏷️  Tagged: ${summary.ghostClinicsTagged} as ghost`);
    console.log(`   ✨ Reactivated: ${summary.clinicsReactivated} clinics`);
    console.log(`   ⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);
    
    if (errors.length > 0) {
      console.log(`   ⚠️  Errors: ${errors.length}`);
    }
    
    return {
      success: true,
      summary,
      ghostClinics,
      errors
    };
    
  } catch (error) {
    console.error('❌ Ghost clinic scan failed:', error);
    
    return {
      success: false,
      summary: {
        totalScanned,
        ghostClinicsFound: 0,
        ghostClinicsTagged: 0,
        clinicsReactivated: 0,
        errors: errors.length + 1,
        duration: Date.now() - startTime
      },
      ghostClinics: [],
      errors: [...errors, `Scan failed: ${error}`]
    };
  }
}

/**
 * Tag a clinic as a ghost clinic
 */
async function tagAsGhostClinic(clinicId: string, daysSinceActivity: number): Promise<void> {
  try {
    const clinicRef = doc(db, 'clinics', clinicId);
    
    // Get current tags to avoid duplicates
    const clinicSnap = await getDocs(query(collection(db, 'clinics'), where('__name__', '==', clinicId)));
    const currentTags = clinicSnap.docs[0]?.data()?.tags || [];
    
    const newTags = [...currentTags];
    if (!newTags.includes('ghost-clinic')) {
      newTags.push('ghost-clinic');
    }
    
    // Create suggestion
    const suggestion = {
      id: `ghost-${Date.now()}`,
      type: 'critical' as const,
      message: `No traffic or calls in ${daysSinceActivity} days. Consider pausing or removing this listing.`,
      action: 'Pause listing',
      relatedField: 'status',
      tagId: 'ghost-clinic',
      createdAt: serverTimestamp()
    };
    
    await updateDoc(clinicRef, {
      tags: newTags,
      'engagement.status': 'none',
      'engagement.lastGhostCheck': serverTimestamp(),
      'engagement.daysSinceActivity': daysSinceActivity,
      suggestions: [suggestion], // Replace with new suggestion
      'seoMeta.ghostTaggedAt': serverTimestamp()
    });
    
    console.log(`🏷️  Tagged ${clinicId} as ghost clinic`);
    
  } catch (error) {
    console.error(`Failed to tag ${clinicId} as ghost:`, error);
    throw error;
  }
}

/**
 * Remove ghost tag from reactivated clinic
 */
async function removeGhostTag(clinicId: string): Promise<void> {
  try {
    const clinicRef = doc(db, 'clinics', clinicId);
    
    // Get current tags
    const clinicSnap = await getDocs(query(collection(db, 'clinics'), where('__name__', '==', clinicId)));
    const currentTags = clinicSnap.docs[0]?.data()?.tags || [];
    const currentSuggestions = clinicSnap.docs[0]?.data()?.suggestions || [];
    
    // Remove ghost-clinic tag
    const newTags = currentTags.filter((tag: string) => tag !== 'ghost-clinic');
    
    // Remove ghost-related suggestions
    const newSuggestions = currentSuggestions.filter((s: any) => s.tagId !== 'ghost-clinic');
    
    await updateDoc(clinicRef, {
      tags: newTags,
      suggestions: newSuggestions,
      'engagement.lastGhostCheck': serverTimestamp(),
      'engagement.reactivatedAt': serverTimestamp(),
      'seoMeta.ghostTagRemoved': serverTimestamp()
    });
    
    console.log(`✨ Removed ghost tag from ${clinicId}`);
    
  } catch (error) {
    console.error(`Failed to remove ghost tag from ${clinicId}:`, error);
    throw error;
  }
}

/**
 * Get ghost clinics summary for dashboard
 */
export async function getGhostClinicsSummary(): Promise<{
  totalGhostClinics: number;
  recentlyGhosted: number;
  oldestGhost: { id: string; name: string; daysSinceActivity: number } | null;
}> {
  try {
    const clinicsRef = collection(db, 'clinics');
    const ghostQuery = query(
      clinicsRef,
      where('tags', 'array-contains', 'ghost-clinic')
    );
    
    const ghostSnap = await getDocs(ghostQuery);
    const ghostClinics = ghostSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentlyGhosted = ghostClinics.filter(clinic => 
      clinic.seoMeta?.ghostTaggedAt?.toDate() > sevenDaysAgo
    ).length;
    
    // Find oldest ghost
    let oldestGhost = null;
    let maxDaysSinceActivity = 0;
    
    ghostClinics.forEach(clinic => {
      const daysSinceActivity = clinic.engagement?.daysSinceActivity || 0;
      if (daysSinceActivity > maxDaysSinceActivity) {
        maxDaysSinceActivity = daysSinceActivity;
        oldestGhost = {
          id: clinic.id,
          name: clinic.name || 'Unnamed Clinic',
          daysSinceActivity
        };
      }
    });
    
    return {
      totalGhostClinics: ghostClinics.length,
      recentlyGhosted,
      oldestGhost
    };
    
  } catch (error) {
    console.error('Failed to get ghost clinics summary:', error);
    return {
      totalGhostClinics: 0,
      recentlyGhosted: 0,
      oldestGhost: null
    };
  }
}

// Export for CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const days = args.find(arg => arg.startsWith('--days='))?.split('=')[1];
  
  ghostClinicScanner({ 
    dryRun, 
    inactiveDays: days ? parseInt(days) : 90 
  })
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
      console.error('💥 Ghost scan crashed:', error);
      process.exit(1);
    });
}