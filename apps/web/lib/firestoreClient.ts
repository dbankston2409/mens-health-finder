import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  Timestamp,
  QueryConstraint,
  DocumentData,
  startAfter,
  runTransaction,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { Clinic } from '../types';

/**
 * FirestoreClient provides a centralized interface for Firestore operations
 * with consistent error handling and logging
 */
class FirestoreClient {
  /**
   * Convert a Firestore document to a typed object
   * 
   * @param doc - Firestore document
   * @returns Typed object with ID
   */
  private static convertDoc<T>(doc: DocumentData): T & { id: string } {
    return {
      id: doc.id,
      ...doc.data()
    } as T & { id: string };
  }

  /**
   * Get a clinic by ID
   * 
   * @param id - Clinic ID
   * @returns Clinic data or null if not found
   */
  static async getClinicById(id: string): Promise<Clinic | null> {
    try {
      const docRef = doc(db, 'clinics', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return this.convertDoc<Clinic>(docSnap);
    } catch (error) {
      console.error('Error getting clinic by ID:', error);
      throw error;
    }
  }

  /**
   * Get a clinic by slug
   * 
   * @param slug - Clinic slug
   * @returns Clinic data or null if not found
   */
  static async getClinicBySlug(slug: string): Promise<Clinic | null> {
    try {
      const clinicsRef = collection(db, 'clinics');
      const q = query(clinicsRef, where('slug', '==', slug), limit(1));
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      return this.convertDoc<Clinic>(querySnapshot.docs[0]);
    } catch (error) {
      console.error('Error getting clinic by slug:', error);
      throw error;
    }
  }

  /**
   * Query clinics with filters
   * 
   * @param queryConstraints - Firestore query constraints
   * @param maxResults - Maximum number of results to return
   * @param startAfterDoc - Document to start after for pagination
   * @returns Array of clinics and pagination info
   */
  static async queryClinics(
    queryConstraints: QueryConstraint[] = [],
    maxResults: number = 100,
    startAfterDoc: DocumentData | null = null
  ): Promise<{
    clinics: Clinic[];
    lastDoc: DocumentData | null;
    hasMore: boolean;
  }> {
    try {
      const clinicsRef = collection(db, 'clinics');
      
      // Create the query based on whether we have a startAfterDoc
      let q;
      
      if (startAfterDoc) {
        q = query(
          clinicsRef,
          ...queryConstraints,
          startAfter(startAfterDoc),
          limit(maxResults + 1) // +1 to check if there are more results
        );
      } else {
        q = query(
          clinicsRef,
          ...queryConstraints,
          limit(maxResults + 1) // +1 to check if there are more results
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      // Process results
      const clinics: Clinic[] = [];
      let lastDoc = null;
      let hasMore = false;
      
      if (querySnapshot.docs.length > maxResults) {
        hasMore = true;
        querySnapshot.docs.pop(); // Remove the extra document
      }
      
      querySnapshot.docs.forEach((doc) => {
        clinics.push(this.convertDoc<Clinic>(doc));
        lastDoc = doc;
      });
      
      return { clinics, lastDoc, hasMore };
    } catch (error) {
      console.error('Error querying clinics:', error);
      throw error;
    }
  }

  /**
   * Get active clinics by tier
   * 
   * @param tier - Tier to filter by
   * @param maxResults - Maximum number of results
   * @returns Array of clinics
   */
  static async getClinicsByTier(
    tier: 'advanced' | 'standard' | 'free',
    maxResults: number = 100
  ): Promise<Clinic[]> {
    try {
      const { clinics } = await this.queryClinics(
        [
          where('status', 'in', ['Active', 'active']),
          where('tier', '==', tier),
          orderBy('lastUpdated', 'desc')
        ],
        maxResults
      );
      
      return clinics;
    } catch (error) {
      console.error(`Error getting ${tier} clinics:`, error);
      throw error;
    }
  }

  /**
   * Update a clinic document
   * 
   * @param id - Clinic ID
   * @param data - Data to update
   * @returns Success status
   */
  static async updateClinic(id: string, data: Partial<Clinic>): Promise<boolean> {
    try {
      const docRef = doc(db, 'clinics', id);
      
      // Add timestamp
      const updateData = {
        ...data,
        lastUpdated: Timestamp.now()
      };
      
      await updateDoc(docRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating clinic:', error);
      return false;
    }
  }

  /**
   * Create a new clinic
   * 
   * @param data - Clinic data
   * @returns ID of the new clinic
   */
  static async createClinic(data: Partial<Clinic>): Promise<string | null> {
    try {
      const clinicsRef = collection(db, 'clinics');
      
      // Add timestamps
      const clinicData = {
        ...data,
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now()
      };
      
      const docRef = await addDoc(clinicsRef, clinicData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating clinic:', error);
      return null;
    }
  }

  /**
   * Delete a clinic
   * 
   * @param id - Clinic ID
   * @returns Success status
   */
  static async deleteClinic(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'clinics', id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting clinic:', error);
      return false;
    }
  }

  /**
   * Set clinic active status
   * 
   * @param id - Clinic ID
   * @param active - Active status
   * @returns Success status
   */
  static async setClinicActive(id: string, active: boolean): Promise<boolean> {
    try {
      const status = active ? 'Active' : 'Inactive';
      return await this.updateClinic(id, { status });
    } catch (error) {
      console.error('Error setting clinic active status:', error);
      return false;
    }
  }

  /**
   * Update clinic tier
   * 
   * @param id - Clinic ID
   * @param tier - New tier
   * @returns Success status
   */
  static async updateClinicTier(id: string, tier: 'free' | 'standard' | 'advanced'): Promise<boolean> {
    try {
      const docRef = doc(db, 'clinics', id);
      
      // Use a transaction to update tier and tierFeatures together
      await runTransaction(db, async (transaction) => {
        const docSnapshot = await transaction.get(docRef);
        
        if (!docSnapshot.exists()) {
          throw new Error('Clinic does not exist');
        }
        
        // Generate tier features based on the new tier
        const tierFeatures = this.generateTierFeatures(tier);
        
        transaction.update(docRef, {
          tier,
          tierFeatures,
          lastUpdated: Timestamp.now()
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error updating clinic tier:', error);
      return false;
    }
  }

  /**
   * Generate features based on tier
   * 
   * @param tier - Tier level
   * @returns Tier features
   */
  private static generateTierFeatures(tier: 'free' | 'standard' | 'advanced'): any {
    // Base features all tiers get
    const baseFeatures = {
      fullProfile: false,
      seoDescription: false,
      publicContact: false,
      locationMapping: true,
      basicSearch: true,
      verifiedBadge: false,
      enhancedSearch: false,
      treatmentsLimit: 3,
      reviewDisplay: 'basic' as const,
      enhancedContactUX: false,
      customTracking: false,
      snapshotReport: false,
      priorityListing: false
    };
    
    // Add tier-specific features
    switch (tier) {
      case 'advanced':
        return {
          ...baseFeatures,
          fullProfile: true,
          seoDescription: true,
          publicContact: true,
          verifiedBadge: true,
          enhancedSearch: true,
          treatmentsLimit: 20,
          reviewDisplay: 'premium' as const,
          enhancedContactUX: true,
          customTracking: true,
          snapshotReport: true,
          priorityListing: true
        };
      
      case 'standard':
        return {
          ...baseFeatures,
          fullProfile: true,
          seoDescription: true,
          publicContact: true,
          verifiedBadge: true,
          treatmentsLimit: 10,
          reviewDisplay: 'enhanced' as const,
          snapshotReport: true
        };
        
      case 'free':
      default:
        return baseFeatures;
    }
  }

  /**
   * Get import logs with pagination
   * 
   * @param maxResults - Maximum number of logs to return
   * @param startAfterDoc - Document to start after for pagination
   * @returns Array of import logs and pagination info
   */
  /**
   * Increment a clinic interaction counter
   * 
   * @param clinicId - Clinic ID
   * @param interactionType - Type of interaction to increment
   * @returns Success status
   */
  static async incrementClinicInteraction(
    clinicId: string, 
    interactionType: 'viewCount' | 'clickToCallCount' | 'clickToWebsiteCount' | 'clickToDirectionsCount'
  ): Promise<boolean> {
    try {
      const docRef = doc(db, 'clinics', clinicId);
      
      // Update the interaction counter
      await updateDoc(docRef, {
        [interactionType]: increment(1),
        lastUpdated: Timestamp.now()
      });
      
      return true;
    } catch (error) {
      console.error(`Error incrementing ${interactionType}:`, error);
      return false;
    }
  }

  /**
   * Get import logs with pagination
   * 
   * @param maxResults - Maximum number of logs to return
   * @param startAfterDoc - Document to start after for pagination
   * @returns Array of import logs and pagination info
   */
  static async getImportLogs(
    maxResults: number = 20,
    startAfterDoc: DocumentData | null = null
  ): Promise<{
    logs: any[];
    lastDoc: DocumentData | null;
    hasMore: boolean;
  }> {
    try {
      const logsRef = collection(db, 'import_logs');
      
      // Create the query
      let q;
      
      if (startAfterDoc) {
        q = query(
          logsRef,
          orderBy('timestamp', 'desc'),
          startAfter(startAfterDoc),
          limit(maxResults + 1)
        );
      } else {
        q = query(
          logsRef,
          orderBy('timestamp', 'desc'),
          limit(maxResults + 1)
        );
      }
      const querySnapshot = await getDocs(q);
      
      // Process results
      const logs: any[] = [];
      let lastDoc = null;
      let hasMore = false;
      
      if (querySnapshot.docs.length > maxResults) {
        hasMore = true;
        querySnapshot.docs.pop();
      }
      
      querySnapshot.docs.forEach((doc) => {
        logs.push(this.convertDoc(doc));
        lastDoc = doc;
      });
      
      return { logs, lastDoc, hasMore };
    } catch (error) {
      console.error('Error getting import logs:', error);
      throw error;
    }
  }
}

export default FirestoreClient;