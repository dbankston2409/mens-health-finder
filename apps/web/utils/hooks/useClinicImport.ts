import { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, where, DocumentReference, DocumentData, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Clinic } from '../../types';
import { processClinicForImport } from '../processClinicForImport';

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
  startImport: (file: File, options: ImportOptions) => Promise<{ success: boolean; importId?: string }>;
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
  const startImport = async (file: File, options: ImportOptions): Promise<{ success: boolean; importId?: string }> => {
    try {
      // Reset state
      reset();
      
      // Update status to uploading
      setImportProgress(prev => ({
        ...prev,
        status: 'uploading',
        progress: 10
      }));
      
      // Parse the file first to get clinic data
      const clinics = await parseImportFile(file);
      
      // Create an import session in Firestore
      const importSessionsRef = collection(db, 'import_sessions');
      const sessionRef = await addDoc(importSessionsRef, {
        status: 'pending',
        fileName: file.name,
        fileSize: file.size,
        totalClinics: clinics.length,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [],
        createdAt: serverTimestamp(),
        options: options,
        adminId: 'current-admin-id', // TODO: Get from auth context
        adminName: 'Admin User' // TODO: Get from auth context
      });
      
      const importId = sessionRef.id;
      
      // Create a job for the worker
      const jobsRef = collection(db, 'import_jobs');
      await addDoc(jobsRef, {
        sessionId: importId,
        status: 'pending',
        data: clinics,
        options: options,
        createdAt: serverTimestamp()
      });
      
      // Update progress
      setImportProgress(prev => ({
        ...prev,
        status: 'processing',
        progress: 20,
        importId,
        stats: {
          ...prev.stats,
          total: clinics.length
        }
      }));
      
      return { success: true, importId };
    } catch (error) {
      console.error('Error during import:', error);
      
      // Update state with error
      setImportProgress(prev => ({
        ...prev,
        status: 'error',
        progress: 100,
        error: error instanceof Error ? error.message : 'Unknown error during import'
      }));
      
      return { success: false };
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
        const logRef = doc(db, 'import_logs', importProgress.importId);
        await updateImportLog(logRef, {
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
          // Parse CSV
          const lines = content.trim().split('\n');
          if (lines.length < 2) {
            reject(new Error('CSV file is empty or has no data rows'));
            return;
          }
          
          // Parse headers
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
          
          // Parse data rows
          const clinics: Partial<Clinic>[] = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const clinic: any = {};
            
            headers.forEach((header, index) => {
              if (values[index]) {
                // Map CSV headers to clinic fields
                switch(header) {
                  case 'name':
                  case 'clinic_name':
                    clinic.name = values[index];
                    break;
                  case 'address':
                  case 'street_address':
                    clinic.address = values[index];
                    break;
                  case 'city':
                    clinic.city = values[index];
                    break;
                  case 'state':
                    clinic.state = values[index];
                    break;
                  case 'zip':
                  case 'zipcode':
                  case 'postal_code':
                    clinic.zip = values[index];
                    break;
                  case 'phone':
                  case 'phone_number':
                    clinic.phone = values[index];
                    break;
                  case 'website':
                  case 'url':
                    clinic.website = values[index];
                    break;
                  case 'services':
                    clinic.services = values[index].split(';').map(s => s.trim());
                    break;
                  case 'tier':
                  case 'package':
                    clinic.tier = values[index] as 'free' | 'standard' | 'advanced';
                    break;
                }
              }
            });
            
            if (clinic.name) {
              clinics.push(clinic);
            }
          }
          
          resolve(clinics);
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
    await updateDoc(logRef, {
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