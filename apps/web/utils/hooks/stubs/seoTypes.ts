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