import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface ValidationChecklist {
  addressValid: boolean;
  websiteUp: boolean;
  servicesListed: boolean;
  callTested: boolean;
  logoPresent: boolean;
  hoursProvided: boolean;
}

export interface ValidationStatus {
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  checklist: ValidationChecklist;
  completionPercentage: number;
  lastValidationRun?: Date;
  validationNotes?: string;
}

export interface UseValidationStatusResult {
  validationStatus: ValidationStatus | null;
  loading: boolean;
  error: string | null;
  updateChecklistItem: (item: keyof ValidationChecklist, value: boolean, notes?: string) => Promise<void>;
  markAsVerified: (verifiedBy: string, notes?: string) => Promise<void>;
  markAsUnverified: (reason: string) => Promise<void>;
  runValidationCheck: () => Promise<void>;
}

/**
 * Hook for managing clinic validation status and checklist
 */
export function useValidationStatus(clinicId: string): UseValidationStatusResult {
  const [validationStatus, setValidationStatus] = useState<ValidationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for validation status
  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    const clinicRef = doc(db, 'clinics', clinicId);
    
    const unsubscribe = onSnapshot(
      clinicRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          
          const checklist: ValidationChecklist = {
            addressValid: data.validation?.checklist?.addressValid || false,
            websiteUp: data.validation?.checklist?.websiteUp || false,
            servicesListed: data.validation?.checklist?.servicesListed || false,
            callTested: data.validation?.checklist?.callTested || false,
            logoPresent: data.validation?.checklist?.logoPresent || false,
            hoursProvided: data.validation?.checklist?.hoursProvided || false
          };
          
          const completedItems = Object.values(checklist).filter(Boolean).length;
          const totalItems = Object.keys(checklist).length;
          const completionPercentage = Math.round((completedItems / totalItems) * 100);
          
          const status: ValidationStatus = {
            isVerified: data.isVerified || false,
            verifiedAt: data.verifiedAt?.toDate(),
            verifiedBy: data.verifiedBy,
            checklist,
            completionPercentage,
            lastValidationRun: data.validation?.lastValidationRun?.toDate(),
            validationNotes: data.validation?.notes
          };
          
          setValidationStatus(status);
          setError(null);
        } else {
          setError('Clinic not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to validation status:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clinicId]);

  /**
   * Update a specific checklist item
   */
  const updateChecklistItem = async (
    item: keyof ValidationChecklist, 
    value: boolean,
    notes?: string
  ): Promise<void> => {
    try {
      const clinicRef = doc(db, 'clinics', clinicId);
      
      const updateData: any = {
        [`validation.checklist.${item}`]: value,
        'validation.lastUpdated': serverTimestamp()
      };
      
      if (notes) {
        updateData[`validation.itemNotes.${item}`] = notes;
      }
      
      await updateDoc(clinicRef, updateData);
      
      console.log(`✅ Updated validation item ${item}: ${value}`);
    } catch (err) {
      console.error('Failed to update checklist item:', err);
      setError(err instanceof Error ? err.message : 'Failed to update checklist');
    }
  };

  /**
   * Mark clinic as verified
   */
  const markAsVerified = async (verifiedBy: string, notes?: string): Promise<void> => {
    try {
      const clinicRef = doc(db, 'clinics', clinicId);
      
      await updateDoc(clinicRef, {
        isVerified: true,
        verifiedAt: serverTimestamp(),
        verifiedBy,
        'validation.verificationNotes': notes || '',
        'validation.lastValidationRun': serverTimestamp(),
        status: 'active' // Automatically activate verified clinics
      });
      
      console.log(`✅ Clinic ${clinicId} marked as verified by ${verifiedBy}`);
    } catch (err) {
      console.error('Failed to mark as verified:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify clinic');
    }
  };

  /**
   * Mark clinic as unverified
   */
  const markAsUnverified = async (reason: string): Promise<void> => {
    try {
      const clinicRef = doc(db, 'clinics', clinicId);
      
      await updateDoc(clinicRef, {
        isVerified: false,
        verifiedAt: null,
        verifiedBy: null,
        'validation.unverifiedReason': reason,
        'validation.lastValidationRun': serverTimestamp(),
        status: 'pending' // Move back to pending status
      });
      
      console.log(`❌ Clinic ${clinicId} marked as unverified: ${reason}`);
    } catch (err) {
      console.error('Failed to mark as unverified:', err);
      setError(err instanceof Error ? err.message : 'Failed to unverify clinic');
    }
  };

  /**
   * Run automated validation checks
   */
  const runValidationCheck = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Call validation API
      const response = await fetch('/api/validate-clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId })
      });
      
      if (!response.ok) {
        throw new Error('Validation check failed');
      }
      
      const result = await response.json();
      console.log(`✅ Validation check completed for ${clinicId}:`, result);
      
    } catch (err) {
      console.error('Failed to run validation check:', err);
      setError(err instanceof Error ? err.message : 'Failed to run validation');
    } finally {
      setLoading(false);
    }
  };

  return {
    validationStatus,
    loading,
    error,
    updateChecklistItem,
    markAsVerified,
    markAsUnverified,
    runValidationCheck
  };
}

/**
 * Get validation checklist item labels
 */
export const VALIDATION_CHECKLIST_LABELS: Record<keyof ValidationChecklist, string> = {
  addressValid: 'Address Verified',
  websiteUp: 'Website Accessible',
  servicesListed: 'Services Listed',
  callTested: 'Phone Tested',
  logoPresent: 'Logo Present',
  hoursProvided: 'Hours Provided'
};

/**
 * Get validation checklist item descriptions
 */
export const VALIDATION_CHECKLIST_DESCRIPTIONS: Record<keyof ValidationChecklist, string> = {
  addressValid: 'Physical address exists and is geocoded',
  websiteUp: 'Website URL is reachable and loads properly',
  servicesListed: 'Services and treatments are clearly listed',
  callTested: 'Phone number connects and is answered',
  logoPresent: 'Clinic logo is uploaded and displays correctly',
  hoursProvided: 'Operating hours are specified'
};