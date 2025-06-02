import { doc, updateDoc, arrayUnion, getDoc } from '../lib/firebase-compat';
import { db } from '../lib/firebase';

interface AuditEntry {
  timestamp: any; // Firestore serverTimestamp
  editedBy: string;
  changeType: 'manual' | 'regenerated' | 'imported' | 'bulk_update';
  fieldsChanged: string[];
  details?: {
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    reason?: string;
    batchId?: string;
  };
}

interface AuditLogResult {
  success: boolean;
  error?: string;
}

/**
 * Log SEO audit entry to clinic's audit trail
 */
export async function logSeoAudit(
  clinicId: string, 
  auditEntry: AuditEntry
): Promise<AuditLogResult> {
  try {
    console.log(`📝 Logging SEO audit for clinic: ${clinicId}`);
    
    const clinicRef = doc(db, 'clinics', clinicId);
    
    // Add to audit trail array
    await updateDoc(clinicRef, {
      'seoMeta.auditTrail': arrayUnion(auditEntry)
    });
    
    console.log('✅ SEO audit logged successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Failed to log SEO audit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Log bulk SEO operation audit
 */
export async function logBulkSeoAudit(
  clinicIds: string[],
  changeType: 'regenerated' | 'bulk_update',
  fieldsChanged: string[],
  editedBy: string,
  batchId: string
): Promise<AuditLogResult[]> {
  console.log(`📝 Logging bulk SEO audit for ${clinicIds.length} clinics`);
  
  const results: AuditLogResult[] = [];
  
  const auditEntry: AuditEntry = {
    timestamp: new Date(), // Will be converted to serverTimestamp in individual logs
    editedBy,
    changeType,
    fieldsChanged,
    details: {
      batchId,
      reason: `Bulk ${changeType} operation`
    }
  };
  
  // Process in batches to avoid overwhelming Firestore
  const batchSize = 50;
  for (let i = 0; i < clinicIds.length; i += batchSize) {
    const batch = clinicIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(clinicId => 
      logSeoAudit(clinicId, auditEntry)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < clinicIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Bulk audit logged: ${successCount}/${clinicIds.length} successful`);
  
  return results;
}

/**
 * Get audit trail for a clinic
 */
export async function getSeoAuditTrail(clinicId: string): Promise<{
  auditTrail: AuditEntry[];
  error?: string;
}> {
  try {
    const clinicRef = doc(db, 'clinics', clinicId);
    const clinicSnap = await getDoc(clinicRef);
    
    if (clinicSnap.exists()) {
      const clinicData = clinicSnap.data();
      const auditTrail = clinicData.seoMeta?.auditTrail || [];
      
      // Convert Firestore timestamps to dates for easier handling
      const processedTrail = auditTrail.map((entry: any) => ({
        ...entry,
        timestamp: entry.timestamp?.toDate ? entry.timestamp.toDate() : entry.timestamp
      }));
      
      // Sort by timestamp (most recent first)
      processedTrail.sort((a, b) => {
        const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
      
      return { auditTrail: processedTrail };
    }
    
    return { auditTrail: [] };
    
  } catch (error) {
    console.error('Error fetching SEO audit trail:', error);
    return {
      auditTrail: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clean up old audit entries (keep last 100 entries per clinic)
 */
export async function cleanupAuditTrail(clinicId: string): Promise<AuditLogResult> {
  try {
    const { auditTrail } = await getSeoAuditTrail(clinicId);
    
    if (auditTrail.length <= 100) {
      return { success: true }; // No cleanup needed
    }
    
    // Keep only the most recent 100 entries
    const trimmedTrail = auditTrail.slice(0, 100);
    
    const clinicRef = doc(db, 'clinics', clinicId);
    await updateDoc(clinicRef, {
      'seoMeta.auditTrail': trimmedTrail
    });
    
    console.log(`✅ Cleaned up audit trail for ${clinicId}: ${auditTrail.length} → ${trimmedTrail.length} entries`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Failed to cleanup audit trail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get audit statistics for admin dashboard
 */
export async function getAuditStats(timeRange: { start: Date; end: Date }) {
  // This would typically be implemented with Firestore aggregation queries
  // For now, return mock data structure
  return {
    totalEdits: 0,
    manualEdits: 0,
    regenerations: 0,
    topEditors: [],
    mostEditedFields: [],
    editsByDay: []
  };
}

/**
 * Create standardized audit entry
 */
export function createAuditEntry(
  editedBy: string,
  changeType: AuditEntry['changeType'],
  fieldsChanged: string[],
  details?: AuditEntry['details']
): Omit<AuditEntry, 'timestamp'> {
  return {
    editedBy,
    changeType,
    fieldsChanged,
    details
  };
}

/**
 * Format audit entry for display
 */
export function formatAuditEntry(entry: AuditEntry): string {
  const date = entry.timestamp instanceof Date 
    ? entry.timestamp.toLocaleDateString()
    : new Date(entry.timestamp).toLocaleDateString();
  
  const changeTypeLabel = {
    manual: 'manually edited',
    regenerated: 'regenerated',
    imported: 'imported',
    bulk_update: 'bulk updated'
  }[entry.changeType];
  
  const fieldsText = entry.fieldsChanged.length === 1 
    ? entry.fieldsChanged[0]
    : `${entry.fieldsChanged.length} fields`;
  
  return `${date} – ${fieldsText} ${changeTypeLabel} by ${entry.editedBy}`;
}