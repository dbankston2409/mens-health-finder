import { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, where, DocumentReference, DocumentData } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Clinic } from '../../types';
import { processClinicForImport } from '../../../../lib/importEnhancer';

export interface ImportOptions {
  mergeWithExisting: boolean;
  checkForDuplicates: boolean;
  backfillMissingData: boolean;
  importSource: string;
}

interface DuplicateClinic {
  existingClinic: Clinic;
  newClinicData: Partial<Clinic>;
  matchReason: string;
  matchConfidence: number;
}

interface ImportProgress {
  status: 'idle' | 'uploading' | 'processing' | 'checking_duplicates' | 'importing' | 'complete' | 'error';
  progress: number;
  duplicates: DuplicateClinic[];
  stats: {
    total: number;
    processed: number;
    duplicates: number;
    created: number;
    merged: number;
    skipped: number;
    failed: number;
  };
  importId?: string;
  error?: string;
}

interface UseClinicImportResult {
  importProgress: ImportProgress;
  startImport: (file: File, options: ImportOptions) => Promise<string>;
  processDuplicateDecisions: (decisions: { clinicId: string; action: 'merge' | 'create' | 'skip' }[]) => Promise<void>;
  reset: () => void;
}

export const useClinicImport = (): UseClinicImportResult => {
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    status: 'idle',
    progress: 0,
    duplicates: [],
    stats: {
      total: 0,
      processed: 0,
      duplicates: 0,
      created: 0,
      merged: 0,
      skipped: 0,
      failed: 0
    }
  });

  // Reset the import progress
  const reset = () => {
    setImportProgress({
      status: 'idle',
      progress: 0,
      duplicates: [],
      stats: {
        total: 0,
        processed: 0,
        duplicates: 0,
        created: 0,
        merged: 0,
        skipped: 0,
        failed: 0
      }
    });
  };

  // Start the import process
  const startImport = async (file: File, options: ImportOptions): Promise<string> => {
    try {
      // Reset state
      reset();
      
      // Update status to uploading
      setImportProgress(prev => ({
        ...prev,
        status: 'uploading',
        progress: 10
      }));
      
      // Create a new import log entry
      const importLogsRef = collection(db, 'import_logs');
      const importLogRef = await addDoc(importLogsRef, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        timestamp: serverTimestamp(),
        status: 'processing',
        options: options,
        adminId: 'current-admin-id', // TODO: Get from auth context
        adminName: 'Admin User', // TODO: Get from auth context
        totalRecords: 0,
        successCount: 0,
        failureCount: 0,
        errors: []
      });
      
      const importId = importLogRef.id;
      
      // Update progress
      setImportProgress(prev => ({
        ...prev,
        status: 'processing',
        progress: 20,
        importId
      }));
      
      // Parse the file (CSV or JSON)
      const clinics = await parseImportFile(file);
      
      // Update progress with total count
      setImportProgress(prev => ({
        ...prev,
        progress: 30,
        stats: {
          ...prev.stats,
          total: clinics.length
        }
      }));
      
      // Process clinics and check for duplicates
      setImportProgress(prev => ({
        ...prev,
        status: 'checking_duplicates',
        progress: 40
      }));
      
      // In a real implementation, this would be done server-side or with a batch operation
      // For the demo, we'll simulate processing and collecting duplicates
      const duplicates: DuplicateClinic[] = [];
      
      // Check first few clinics for duplicates as a simulation
      for (let i = 0; i < Math.min(5, clinics.length); i++) {
        const clinic = clinics[i];
        
        // Process the clinic for import
        const result = await processClinicForImport(clinic, options);
        
        // If it's a duplicate, add to duplicates list
        if (result.duplicateCheck?.isDuplicate && result.duplicateCheck.matchedClinic) {
          duplicates.push({
            existingClinic: result.duplicateCheck.matchedClinic,
            newClinicData: clinic,
            matchReason: result.duplicateCheck.matchReason || 'Similar record found',
            matchConfidence: result.duplicateCheck.matchConfidence || 0.7
          });
        }
        
        // Update progress
        setImportProgress(prev => ({
          ...prev,
          progress: Math.min(40 + Math.floor((i / clinics.length) * 40), 80),
          stats: {
            ...prev.stats,
            processed: i + 1,
            duplicates: duplicates.length
          }
        }));
      }
      
      // Update import log with progress
      await updateImportLog(importLogRef, {
        totalRecords: clinics.length,
        duplicatesFound: duplicates.length,
        progress: 'duplicates_identified'
      });
      
      // If there are duplicates, we need user input
      if (duplicates.length > 0) {
        setImportProgress(prev => ({
          ...prev,
          status: 'checking_duplicates',
          progress: 80,
          duplicates,
          importId
        }));
        
        return importId;
      }
      
      // Otherwise, proceed with import
      setImportProgress(prev => ({
        ...prev,
        status: 'importing',
        progress: 90
      }));
      
      // Simulate successful import
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update import log with success
      await updateImportLog(importLogRef, {
        status: 'success',
        successCount: clinics.length,
        failureCount: 0,
        progress: 'complete'
      });
      
      // Complete the import
      setImportProgress(prev => ({
        ...prev,
        status: 'complete',
        progress: 100,
        stats: {
          ...prev.stats,
          created: clinics.length,
          processed: clinics.length
        },
        importId
      }));
      
      return importId;
    } catch (error) {
      console.error('Error during import:', error);
      
      // Update import log with error
      if (importProgress.importId) {
        await updateImportLog(collection(db, 'import_logs').doc(importProgress.importId), {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error during import',
          progress: 'error'
        });
      }
      
      // Update state with error
      setImportProgress(prev => ({
        ...prev,
        status: 'error',
        progress: 100,
        error: error instanceof Error ? error.message : 'Unknown error during import'
      }));
      
      return importProgress.importId || '';
    }
  };

  // Process decisions for duplicates
  const processDuplicateDecisions = async (decisions: { clinicId: string; action: 'merge' | 'create' | 'skip' }[]): Promise<void> => {
    try {
      setImportProgress(prev => ({
        ...prev,
        status: 'importing',
        progress: 85
      }));
      
      // Count stats based on decisions
      const mergeCount = decisions.filter(d => d.action === 'merge').length;
      const createCount = decisions.filter(d => d.action === 'create').length;
      const skipCount = decisions.filter(d => d.action === 'skip').length;
      
      // In a real implementation, you would process each decision
      // For the demo, we'll simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update import log
      if (importProgress.importId) {
        await updateImportLog(collection(db, 'import_logs').doc(importProgress.importId), {
          status: 'success',
          successCount: mergeCount + createCount,
          failureCount: skipCount,
          progress: 'complete',
          mergeCount,
          createCount,
          skipCount
        });
      }
      
      // Update progress
      setImportProgress(prev => ({
        ...prev,
        status: 'complete',
        progress: 100,
        stats: {
          ...prev.stats,
          merged: mergeCount,
          created: createCount + (prev.stats.total - prev.stats.duplicates), // Non-duplicates are created
          skipped: skipCount,
          processed: prev.stats.total
        }
      }));
    } catch (error) {
      console.error('Error processing duplicate decisions:', error);
      
      setImportProgress(prev => ({
        ...prev,
        status: 'error',
        progress: 100,
        error: error instanceof Error ? error.message : 'Unknown error processing duplicates'
      }));
    }
  };

  return {
    importProgress,
    startImport,
    processDuplicateDecisions,
    reset
  };
};

// Helper to parse import files (CSV or JSON)
async function parseImportFile(file: File): Promise<Partial<Clinic>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        
        if (file.name.toLowerCase().endsWith('.json')) {
          // Parse JSON
          const data = JSON.parse(content);
          
          // Check if it's an array of clinics or has a clinics property
          const clinics = Array.isArray(data) ? data : data.clinics || [];
          resolve(clinics);
        } else if (file.name.toLowerCase().endsWith('.csv')) {
          // For CSV, we would use a CSV parser
          // For the demo, return mock data
          resolve(generateMockClinicData(20));
        } else {
          reject(new Error('Unsupported file format. Please upload a CSV or JSON file.'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file.'));
    };
    
    if (file.name.toLowerCase().endsWith('.json')) {
      reader.readAsText(file);
    } else if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reject(new Error('Unsupported file format. Please upload a CSV or JSON file.'));
    }
  });
}

// Helper to update import log
async function updateImportLog(logRef: DocumentReference<DocumentData>, data: Record<string, any>): Promise<void> {
  try {
    await logRef.update({
      ...data,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating import log:', error);
    throw error;
  }
}

// Generate mock clinic data for testing
function generateMockClinicData(count: number): Partial<Clinic>[] {
  const clinics: Partial<Clinic>[] = [];
  
  for (let i = 0; i < count; i++) {
    clinics.push({
      name: `Mock Clinic ${i + 1}`,
      address: `${100 + i} Main Street`,
      city: ['Los Angeles', 'San Francisco', 'New York', 'Dallas', 'Miami'][i % 5],
      state: ['CA', 'CA', 'NY', 'TX', 'FL'][i % 5],
      zip: `${90001 + i}`,
      phone: `(555) ${100 + i}-${1000 + i}`,
      website: `https://mockclinic${i + 1}.com`,
      tier: (['free', 'standard', 'advanced'] as const)[i % 3],
      services: ['ED Treatment', 'TRT', 'Weight Management'].slice(0, (i % 3) + 1)
    });
  }
  
  return clinics;
}

export default useClinicImport;