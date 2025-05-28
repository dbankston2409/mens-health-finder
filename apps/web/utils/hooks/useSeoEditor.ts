import { useState, useEffect, useContext } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { logSeoAudit } from '../../../worker/utils/seoAuditLogger';
import { AuthContext } from '../../lib/contexts/authContext';

interface SeoEditData {
  title: string;
  description: string;
  keywords: string[];
  seoContent: string;
}

interface SeoMetaData extends SeoEditData {
  indexed: boolean;
  lastGenerated?: Date;
  lastEdited?: Date;
  generatedBy?: string;
  editedBy?: string;
  auditTrail?: any[];
}

interface UseSeoEditorResult {
  data: SeoMetaData | null;
  editData: SeoEditData;
  loading: boolean;
  error: string | null;
  isDirty: boolean;
  isValid: boolean;
  save: () => Promise<boolean>;
  regenerate: () => Promise<boolean>;
  reset: () => void;
  updateField: (field: keyof SeoEditData, value: string | string[]) => void;
}

export function useSeoEditor(clinicId: string): UseSeoEditorResult {
  const { user } = useContext(AuthContext) || { user: null };
  const [data, setData] = useState<SeoMetaData | null>(null);
  const [editData, setEditData] = useState<SeoEditData>({
    title: '',
    description: '',
    keywords: [],
    seoContent: ''
  });
  const [originalData, setOriginalData] = useState<SeoEditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current SEO data
  useEffect(() => {
    const fetchSeoData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicRef = doc(db, 'clinics', clinicId);
        const clinicSnap = await getDoc(clinicRef);

        if (clinicSnap.exists()) {
          const clinicData = clinicSnap.data();
          const seoMeta = clinicData.seoMeta || {};
          const seoContent = clinicData.seoContent || '';

          const seoData: SeoMetaData = {
            title: seoMeta.title || '',
            description: seoMeta.description || '',
            keywords: seoMeta.keywords || [],
            seoContent,
            indexed: seoMeta.indexed || false,
            lastGenerated: seoMeta.lastGenerated?.toDate(),
            lastEdited: seoMeta.lastEdited?.toDate(),
            generatedBy: seoMeta.generatedBy,
            editedBy: seoMeta.editedBy,
            auditTrail: seoMeta.auditTrail || []
          };

          setData(seoData);
          
          const editableData: SeoEditData = {
            title: seoData.title,
            description: seoData.description,
            keywords: seoData.keywords,
            seoContent: seoData.seoContent
          };
          
          setEditData(editableData);
          setOriginalData(editableData);
        } else {
          throw new Error('Clinic not found');
        }
      } catch (err) {
        console.error('Error fetching SEO data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load SEO data');
      } finally {
        setLoading(false);
      }
    };

    if (clinicId) {
      fetchSeoData();
    }
  }, [clinicId]);

  // Check if data has been modified
  const isDirty = originalData ? 
    JSON.stringify(editData) !== JSON.stringify(originalData) : false;

  // Validate required fields
  const isValid = editData.title.length > 0 && 
                  editData.description.length > 0 && 
                  editData.description.length <= 160;

  // Update a specific field
  const updateField = (field: keyof SeoEditData, value: string | string[]) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Save changes to Firestore
  const save = async (): Promise<boolean> => {
    if (!isValid || !isDirty) {
      return false;
    }

    try {
      setLoading(true);
      
      const clinicRef = doc(db, 'clinics', clinicId);
      
      // Determine which fields changed
      const changedFields: string[] = [];
      if (originalData) {
        if (editData.title !== originalData.title) changedFields.push('title');
        if (editData.description !== originalData.description) changedFields.push('description');
        if (JSON.stringify(editData.keywords) !== JSON.stringify(originalData.keywords)) changedFields.push('keywords');
        if (editData.seoContent !== originalData.seoContent) changedFields.push('seoContent');
      }

      // Get current user from auth context
      const currentUser = user?.email || user?.displayName || 'Unknown Admin';

      // Create audit entry
      const auditEntry = {
        timestamp: serverTimestamp(),
        editedBy: currentUser,
        changeType: 'manual' as const,
        fieldsChanged: changedFields
      };

      // Update Firestore
      await updateDoc(clinicRef, {
        'seoMeta.title': editData.title,
        'seoMeta.description': editData.description,
        'seoMeta.keywords': editData.keywords,
        'seoMeta.lastEdited': serverTimestamp(),
        'seoMeta.editedBy': currentUser,
        seoContent: editData.seoContent
      });

      // Log audit (append to existing trail)
      await logSeoAudit(clinicId, auditEntry);

      // Update local state
      setOriginalData({ ...editData });
      if (data) {
        setData({
          ...data,
          ...editData,
          lastEdited: new Date(),
          editedBy: currentUser
        });
      }

      console.log('✅ SEO data saved successfully');
      return true;
      
    } catch (err) {
      console.error('❌ Failed to save SEO data:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Regenerate SEO content using AI
  const regenerate = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Call SEO regeneration API with user context
      const currentUser = user?.email || user?.displayName || 'Unknown Admin';
      const response = await fetch('/api/regenerate-seo', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.accessToken || ''}` // Include auth token if available
        },
        body: JSON.stringify({ 
          clinicId,
          reason: 'Manual regeneration from admin panel',
          requestedBy: currentUser
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate SEO content');
      }

      // Refresh data from Firestore
      const clinicRef = doc(db, 'clinics', clinicId);
      const clinicSnap = await getDoc(clinicRef);
      
      if (clinicSnap.exists()) {
        const clinicData = clinicSnap.data();
        const seoMeta = clinicData.seoMeta || {};
        const seoContent = clinicData.seoContent || '';

        const newEditData: SeoEditData = {
          title: seoMeta.title || '',
          description: seoMeta.description || '',
          keywords: seoMeta.keywords || [],
          seoContent
        };

        setEditData(newEditData);
        setOriginalData(newEditData);
        
        if (data) {
          setData({
            ...data,
            ...newEditData,
            lastGenerated: seoMeta.lastGenerated?.toDate(),
            generatedBy: seoMeta.generatedBy
          });
        }
      }

      console.log('✅ SEO content regenerated successfully');
      return true;
      
    } catch (err) {
      console.error('❌ Failed to regenerate SEO content:', err);
      setError(err instanceof Error ? err.message : 'Failed to regenerate content');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reset to original data
  const reset = () => {
    if (originalData) {
      setEditData({ ...originalData });
    }
  };

  return {
    data,
    editData,
    loading,
    error,
    isDirty,
    isValid,
    save,
    regenerate,
    reset,
    updateField
  };
}