import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  doc, 
  updateDoc,
  arrayRemove,
  arrayUnion,
  getDoc,
  setDoc,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Tags that indicate a clinic needs validation
export const VALIDATION_TAGS = [
  'needs-review',
  'website-down',
  'geo-mismatch',
  'incomplete-profile',
  'manual-check'
];

// All available tags for clinics
export const ALL_TAGS = [
  ...VALIDATION_TAGS,
  'verified',
  'spam-lead',
  'premium-candidate',
  'featured',
  'missing-phone',
  'missing-address',
  'missing-services',
  'duplicate'
];

export type Clinic = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  status: 'basic' | 'active' | 'paused' | 'canceled';
  packageTier: string;
  services: string[];
  tags: string[];
  lat?: number;
  lng?: number;
  importSource?: string;
  createdAt: Date;
  updatedAt: Date;
  websiteStatus?: 'up' | 'down' | 'unknown';
  lastPinged?: Date;
  [key: string]: any;
};

export type ValidationStats = {
  totalToReview: number;
  reviewedToday: number;
  validated: number;
  rejected: number;
};

export type ValidationFilters = {
  tags: string[];
  state: string;
  importSource: string;
  status: string;
};

export interface ValidationQueueHook {
  clinics: Clinic[];
  loading: boolean;
  error: Error | null;
  stats: ValidationStats;
  filters: ValidationFilters;
  selectedClinic: Clinic | null;
  hasMore: boolean;
  updateFilters: (newFilters: Partial<ValidationFilters>) => void;
  loadMore: () => Promise<void>;
  refreshQueue: () => Promise<void>;
  selectClinic: (clinic: Clinic | null) => void;
  updateClinicField: (clinicId: string, field: string, value: any) => Promise<void>;
  updateTags: (clinicId: string, tagsToAdd: string[], tagsToRemove: string[]) => Promise<void>;
  validateClinic: (clinicId: string) => Promise<void>;
  rejectClinic: (clinicId: string, reason: string) => Promise<void>;
  checkWebsite: (clinicId: string, website: string) => Promise<'up' | 'down'>;
  bulkValidate: (clinicIds: string[]) => Promise<void>;
  bulkAddTag: (clinicIds: string[], tag: string) => Promise<void>;
  bulkRemoveTag: (clinicIds: string[], tag: string) => Promise<void>;
}

// Mock function to check website status - in a real app this would call an API
const checkWebsiteStatus = async (url: string): Promise<'up' | 'down'> => {
  // Simulate network request
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // For demo purposes, return random status with slight bias towards up
  return Math.random() > 0.3 ? 'up' : 'down';
};

export const useValidationQueue = (): ValidationQueueHook => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [stats, setStats] = useState<ValidationStats>({
    totalToReview: 0,
    reviewedToday: 0,
    validated: 0,
    rejected: 0
  });
  const [filters, setFilters] = useState<ValidationFilters>({
    tags: [],
    state: '',
    importSource: '',
    status: ''
  });
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  // Function to get validation queue from Firestore
  const fetchValidationQueue = useCallback(async (isInitialLoad = false) => {
    try {
      setLoading(true);
      setError(null);

      // Build query based on current filters
      let q = collection(db, 'clinics');
      
      // For demo, we'll just get clinics with any validation tag
      const constraints: any[] = [];

      // Always filter by validation tags if no specific tags are selected
      if (filters.tags.length === 0) {
        constraints.push(where('tags', 'array-contains-any', VALIDATION_TAGS));
      } else {
        // Filter by specific tags if selected
        constraints.push(where('tags', 'array-contains-any', filters.tags));
      }

      // Add other filters if specified
      if (filters.state) {
        constraints.push(where('state', '==', filters.state));
      }
      
      if (filters.importSource) {
        constraints.push(where('importSource', '==', filters.importSource));
      }
      
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }

      // Add ordering and pagination
      constraints.push(orderBy('updatedAt', 'desc'));
      constraints.push(limit(25)); // Fetch 25 at a time
      
      // Use the last document for pagination
      if (lastDoc && !isInitialLoad) {
        constraints.push(startAfter(lastDoc));
      }
      
      q = query(q, ...constraints);
      
      const querySnapshot = await getDocs(q);
      
      // Update the last document for pagination
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible || null);
      
      // Update hasMore flag
      setHasMore(querySnapshot.docs.length === 25);

      // Process results
      let clinicData: Clinic[] = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        
        // Convert timestamps to Date objects
        const createdAt = data.createdAt ? 
          (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)) : 
          new Date();
          
        const updatedAt = data.updatedAt ? 
          (data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)) : 
          new Date();
          
        const lastPinged = data.lastPinged ? 
          (data.lastPinged instanceof Timestamp ? data.lastPinged.toDate() : new Date(data.lastPinged)) : 
          undefined;
          
        clinicData.push({
          id: doc.id,
          ...data,
          createdAt,
          updatedAt,
          lastPinged,
          tags: data.tags || [],
          services: data.services || [],
          status: data.status || 'basic',
          packageTier: data.packageTier || 'free'
        } as Clinic);
      });
      
      if (isInitialLoad) {
        setClinics(clinicData);
      } else {
        setClinics(prevClinics => [...prevClinics, ...clinicData]);
      }
      
      // Get stats
      await fetchStats();

    } catch (err) {
      console.error('Error fetching validation queue:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [filters, lastDoc]);

  // Get validation stats
  const fetchStats = async () => {
    try {
      // For demo purposes, we'll just set some mock stats
      // In a real app, this would query Firestore
      
      // Get total clinics needing review
      const totalQuery = query(
        collection(db, 'clinics'),
        where('tags', 'array-contains-any', VALIDATION_TAGS)
      );
      const totalSnapshot = await getDocs(totalQuery);
      
      // Get clinics reviewed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const reviewedQuery = query(
        collection(db, 'admin_logs'),
        where('actionType', 'in', ['validated', 'rejected']),
        where('timestamp', '>=', Timestamp.fromDate(today))
      );
      const reviewedSnapshot = await getDocs(reviewedQuery);
      
      // Count validated vs rejected
      let validated = 0;
      let rejected = 0;
      
      reviewedSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.actionType === 'validated') {
          validated++;
        } else if (data.actionType === 'rejected') {
          rejected++;
        }
      });
      
      setStats({
        totalToReview: totalSnapshot.size,
        reviewedToday: reviewedSnapshot.size,
        validated,
        rejected
      });
    } catch (err) {
      console.error('Error fetching validation stats:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchValidationQueue(true);
  }, [fetchValidationQueue]);

  // Function to load more items
  const loadMore = async () => {
    if (!hasMore || loading) return;
    await fetchValidationQueue(false);
  };

  // Function to refresh the queue
  const refreshQueue = async () => {
    setLastDoc(null);
    await fetchValidationQueue(true);
  };

  // Function to update filters
  const updateFilters = (newFilters: Partial<ValidationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setLastDoc(null); // Reset pagination when filters change
  };

  // Function to select a clinic
  const selectClinic = (clinic: Clinic | null) => {
    setSelectedClinic(clinic);
  };

  // Function to update a clinic field
  const updateClinicField = async (clinicId: string, field: string, value: any) => {
    try {
      const clinicRef = doc(db, 'clinics', clinicId);
      
      // Update the field
      await updateDoc(clinicRef, {
        [field]: value,
        updatedAt: Timestamp.now()
      });
      
      // Log the action
      const logRef = collection(db, 'admin_logs');
      await setDoc(doc(logRef), {
        clinicId,
        timestamp: Timestamp.now(),
        actionType: 'field_edit',
        adminId: 'current_admin', // Replace with actual admin ID
        adminName: 'Admin User', // Replace with actual admin name
        details: {
          field,
          oldValue: selectedClinic?.[field],
          newValue: value
        }
      });
      
      // Update local state
      setClinics(prevClinics => 
        prevClinics.map(c => 
          c.id === clinicId ? { ...c, [field]: value, updatedAt: new Date() } : c
        )
      );
      
      if (selectedClinic?.id === clinicId) {
        setSelectedClinic(prev => prev ? { ...prev, [field]: value, updatedAt: new Date() } : null);
      }
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      throw err;
    }
  };

  // Function to update tags
  const updateTags = async (clinicId: string, tagsToAdd: string[], tagsToRemove: string[]) => {
    try {
      const clinicRef = doc(db, 'clinics', clinicId);
      
      // Update tags - we need to do this in separate operations
      if (tagsToAdd.length > 0) {
        await updateDoc(clinicRef, {
          tags: arrayUnion(...tagsToAdd),
          updatedAt: Timestamp.now()
        });
      }
      
      if (tagsToRemove.length > 0) {
        await updateDoc(clinicRef, {
          tags: arrayRemove(...tagsToRemove),
          updatedAt: Timestamp.now()
        });
      }
      
      // Log the action
      const logRef = collection(db, 'admin_logs');
      await setDoc(doc(logRef), {
        clinicId,
        timestamp: Timestamp.now(),
        actionType: 'tags_updated',
        adminId: 'current_admin', // Replace with actual admin ID
        adminName: 'Admin User', // Replace with actual admin name
        details: {
          added: tagsToAdd,
          removed: tagsToRemove
        }
      });
      
      // Update local state
      setClinics(prevClinics => 
        prevClinics.map(c => {
          if (c.id === clinicId) {
            const newTags = [...c.tags.filter(t => !tagsToRemove.includes(t)), ...tagsToAdd];
            return { ...c, tags: newTags, updatedAt: new Date() };
          }
          return c;
        })
      );
      
      if (selectedClinic?.id === clinicId) {
        setSelectedClinic(prev => {
          if (!prev) return null;
          const newTags = [...prev.tags.filter(t => !tagsToRemove.includes(t)), ...tagsToAdd];
          return { ...prev, tags: newTags, updatedAt: new Date() };
        });
      }
      
      // Refresh stats
      await fetchStats();
    } catch (err) {
      console.error('Error updating tags:', err);
      throw err;
    }
  };

  // Function to mark a clinic as validated
  const validateClinic = async (clinicId: string) => {
    try {
      const clinicRef = doc(db, 'clinics', clinicId);
      
      // Update status to active and remove validation tags
      await updateDoc(clinicRef, {
        status: 'active',
        tags: arrayRemove(...VALIDATION_TAGS),
        updatedAt: Timestamp.now()
      });
      
      // Add verified tag
      await updateDoc(clinicRef, {
        tags: arrayUnion('verified')
      });
      
      // Log the action
      const logRef = collection(db, 'admin_logs');
      await setDoc(doc(logRef), {
        clinicId,
        timestamp: Timestamp.now(),
        actionType: 'validated',
        adminId: 'current_admin', // Replace with actual admin ID
        adminName: 'Admin User', // Replace with actual admin name
        details: {
          previousStatus: selectedClinic?.status
        }
      });
      
      // Remove clinic from the list
      setClinics(prevClinics => prevClinics.filter(c => c.id !== clinicId));
      
      // Clear selected clinic if it was the validated one
      if (selectedClinic?.id === clinicId) {
        setSelectedClinic(null);
      }
      
      // Refresh stats
      await fetchStats();
    } catch (err) {
      console.error('Error validating clinic:', err);
      throw err;
    }
  };

  // Function to reject a clinic
  const rejectClinic = async (clinicId: string, reason: string) => {
    try {
      const clinicRef = doc(db, 'clinics', clinicId);
      
      // Update status to paused and add rejection tags
      await updateDoc(clinicRef, {
        status: 'paused',
        rejectionReason: reason,
        updatedAt: Timestamp.now()
      });
      
      // Log the action
      const logRef = collection(db, 'admin_logs');
      await setDoc(doc(logRef), {
        clinicId,
        timestamp: Timestamp.now(),
        actionType: 'rejected',
        adminId: 'current_admin', // Replace with actual admin ID
        adminName: 'Admin User', // Replace with actual admin name
        details: {
          reason,
          previousStatus: selectedClinic?.status
        }
      });
      
      // Remove clinic from the list
      setClinics(prevClinics => prevClinics.filter(c => c.id !== clinicId));
      
      // Clear selected clinic if it was the rejected one
      if (selectedClinic?.id === clinicId) {
        setSelectedClinic(null);
      }
      
      // Refresh stats
      await fetchStats();
    } catch (err) {
      console.error('Error rejecting clinic:', err);
      throw err;
    }
  };

  // Function to check website status
  const checkWebsite = async (clinicId: string, website: string): Promise<'up' | 'down'> => {
    try {
      // Check website
      const status = await checkWebsiteStatus(website);
      
      // Update clinic with status
      const clinicRef = doc(db, 'clinics', clinicId);
      await updateDoc(clinicRef, {
        websiteStatus: status,
        lastPinged: Timestamp.now()
      });
      
      // Update tags
      if (status === 'up') {
        await updateTags(clinicId, [], ['website-down']);
      } else {
        await updateTags(clinicId, ['website-down'], []);
      }
      
      // Update local state
      setClinics(prevClinics => 
        prevClinics.map(c => 
          c.id === clinicId ? { 
            ...c, 
            websiteStatus: status, 
            lastPinged: new Date()
          } : c
        )
      );
      
      if (selectedClinic?.id === clinicId) {
        setSelectedClinic(prev => prev ? { 
          ...prev, 
          websiteStatus: status, 
          lastPinged: new Date()
        } : null);
      }
      
      return status;
    } catch (err) {
      console.error('Error checking website:', err);
      throw err;
    }
  };

  // Function to bulk validate clinics
  const bulkValidate = async (clinicIds: string[]) => {
    try {
      // Process each clinic
      for (const clinicId of clinicIds) {
        const clinicRef = doc(db, 'clinics', clinicId);
        
        // Update status to active and remove validation tags
        await updateDoc(clinicRef, {
          status: 'active',
          tags: arrayRemove(...VALIDATION_TAGS),
          updatedAt: Timestamp.now()
        });
        
        // Add verified tag
        await updateDoc(clinicRef, {
          tags: arrayUnion('verified')
        });
        
        // Log the action
        const logRef = collection(db, 'admin_logs');
        await setDoc(doc(logRef), {
          clinicId,
          timestamp: Timestamp.now(),
          actionType: 'bulk_validated',
          adminId: 'current_admin', // Replace with actual admin ID
          adminName: 'Admin User' // Replace with actual admin name
        });
      }
      
      // Remove validated clinics from the list
      setClinics(prevClinics => prevClinics.filter(c => !clinicIds.includes(c.id)));
      
      // Clear selected clinic if it was in the validated set
      if (selectedClinic && clinicIds.includes(selectedClinic.id)) {
        setSelectedClinic(null);
      }
      
      // Refresh stats
      await fetchStats();
    } catch (err) {
      console.error('Error bulk validating clinics:', err);
      throw err;
    }
  };

  // Function to bulk add tag
  const bulkAddTag = async (clinicIds: string[], tag: string) => {
    try {
      // Process each clinic
      for (const clinicId of clinicIds) {
        const clinicRef = doc(db, 'clinics', clinicId);
        
        // Add tag
        await updateDoc(clinicRef, {
          tags: arrayUnion(tag),
          updatedAt: Timestamp.now()
        });
        
        // Log the action
        const logRef = collection(db, 'admin_logs');
        await setDoc(doc(logRef), {
          clinicId,
          timestamp: Timestamp.now(),
          actionType: 'bulk_tag_add',
          adminId: 'current_admin', // Replace with actual admin ID
          adminName: 'Admin User', // Replace with actual admin name
          details: {
            tag
          }
        });
      }
      
      // Update local state
      setClinics(prevClinics => 
        prevClinics.map(c => {
          if (clinicIds.includes(c.id) && !c.tags.includes(tag)) {
            return { ...c, tags: [...c.tags, tag], updatedAt: new Date() };
          }
          return c;
        })
      );
      
      // Update selected clinic if affected
      if (selectedClinic && clinicIds.includes(selectedClinic.id) && !selectedClinic.tags.includes(tag)) {
        setSelectedClinic(prev => prev ? { 
          ...prev, 
          tags: [...prev.tags, tag], 
          updatedAt: new Date()
        } : null);
      }
    } catch (err) {
      console.error('Error bulk adding tag:', err);
      throw err;
    }
  };

  // Function to bulk remove tag
  const bulkRemoveTag = async (clinicIds: string[], tag: string) => {
    try {
      // Process each clinic
      for (const clinicId of clinicIds) {
        const clinicRef = doc(db, 'clinics', clinicId);
        
        // Remove tag
        await updateDoc(clinicRef, {
          tags: arrayRemove(tag),
          updatedAt: Timestamp.now()
        });
        
        // Log the action
        const logRef = collection(db, 'admin_logs');
        await setDoc(doc(logRef), {
          clinicId,
          timestamp: Timestamp.now(),
          actionType: 'bulk_tag_remove',
          adminId: 'current_admin', // Replace with actual admin ID
          adminName: 'Admin User', // Replace with actual admin name
          details: {
            tag
          }
        });
      }
      
      // Update local state
      setClinics(prevClinics => 
        prevClinics.map(c => {
          if (clinicIds.includes(c.id)) {
            return { ...c, tags: c.tags.filter(t => t !== tag), updatedAt: new Date() };
          }
          return c;
        })
      );
      
      // Update selected clinic if affected
      if (selectedClinic && clinicIds.includes(selectedClinic.id)) {
        setSelectedClinic(prev => prev ? { 
          ...prev, 
          tags: prev.tags.filter(t => t !== tag), 
          updatedAt: new Date()
        } : null);
      }
    } catch (err) {
      console.error('Error bulk removing tag:', err);
      throw err;
    }
  };

  return {
    clinics,
    loading,
    error,
    stats,
    filters,
    selectedClinic,
    hasMore,
    updateFilters,
    loadMore,
    refreshQueue,
    selectClinic,
    updateClinicField,
    updateTags,
    validateClinic,
    rejectClinic,
    checkWebsite,
    bulkValidate,
    bulkAddTag,
    bulkRemoveTag
  };
};

export default useValidationQueue;