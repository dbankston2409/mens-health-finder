/**
 * Stub types for client-side SEO functionality
 * These are simplified versions of the types defined in the worker app
 */

export interface SeoMeta {
  title: string;
  description: string;
  keywords: string[];
  content?: string;
  indexed?: boolean;
  lastIndexed?: Date | null;
  indexAttempts?: number;
  generatedBy?: string;
  editedBy?: string;
  auditTrail?: any[];
}

export interface SeoAuditLog {
  timestamp: Date;
  action: string;
  userId: string;
  changes: string[];
  notes?: string;
}

/**
 * Client-side stub for logging SEO audit
 * @param clinicId Clinic ID to log audit for
 * @param auditEntry Audit entry to log
 */
export async function logSeoAudit(clinicId: string, auditEntry: any): Promise<void> {
  console.log(`Logging SEO audit for clinic ${clinicId} (stub implementation)`, auditEntry);
  // In a real implementation, this would call an API endpoint or update Firestore directly
  return Promise.resolve();
}

export interface AuditEntry {
  timestamp: Date;
  editedBy: string;
  changeType: 'manual' | 'regenerated' | 'imported' | 'bulk_update';
  fieldsChanged: string[];
  details?: {
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    reason?: string;
  };
}

/**
 * Client-side stub for getting SEO audit trail
 * @param clinicId Clinic ID to get audit trail for
 * @returns Promise resolving to array of audit entries
 */
export async function getSeoAuditTrail(clinicId: string): Promise<AuditEntry[]> {
  console.log(`Getting SEO audit trail for clinic ${clinicId} (stub implementation)`);
  // Return mock data
  return [
    {
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      editedBy: 'system@menshealthfinder.com',
      changeType: 'imported',
      fieldsChanged: ['title', 'description', 'keywords']
    },
    {
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      editedBy: 'ai-generator@menshealthfinder.com',
      changeType: 'regenerated',
      fieldsChanged: ['title', 'description', 'keywords', 'content']
    },
    {
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      editedBy: 'admin@menshealthfinder.com',
      changeType: 'manual',
      fieldsChanged: ['title', 'description']
    }
  ] as AuditEntry[];
}

/**
 * Client-side stub for formatting audit entry
 * @param entry Audit entry to format
 * @returns Formatted audit entry string
 */
export function formatAuditEntry(entry: AuditEntry): string {
  const dateStr = entry.timestamp.toLocaleDateString();
  const typeStr = entry.changeType.charAt(0).toUpperCase() + entry.changeType.slice(1).replace('_', ' ');
  const fieldsStr = entry.fieldsChanged.join(', ');
  
  return `${dateStr}: ${typeStr} by ${entry.editedBy}. Changed: ${fieldsStr}`;
}