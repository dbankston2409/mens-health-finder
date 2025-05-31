import { db } from '../apps/web/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  setDoc,
  DocumentData,
  Timestamp,
  serverTimestamp,
  runTransaction,
  startAfter
} from 'firebase/firestore';
import generateClinicSnapshot from './ai/snapshotGenerator';
import { Clinic } from '../apps/web/types';

export interface ImportLog {
  id: string;
  fileName: string;
  timestamp: Date;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  status: 'success' | 'partial' | 'failed';
  source: string;
  adminId: string;
  adminName?: string;
  errors?: Array<{
    record: any;
    error: string;
  }>;
}

export interface ReviewData {
  id: string;
  source: 'google' | 'yelp' | 'healthgrades' | 'internal';
  rating: number;
  text: string;
  author?: string;
  date: Date | Timestamp;
  url?: string;
  verified?: boolean;
}

class FirestoreClient {
  /**
   * Get a clinic by ID
   */
  static async getClinicById(id: string): Promise<Clinic | null> {
    try {
      const docRef = doc(db, 'clinics', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Clinic;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting clinic:', error);
      throw error;
    }
  }
  
  /**
   * Update a clinic's tier
   */
  static async updateClinicTier(id: string, tier: 'free' | 'standard' | 'advanced') {
    try {
      const docRef = doc(db, 'clinics', id);
      
      // Update both tier fields for backward compatibility
      await updateDoc(docRef, {
        tier,
        package: tier,
        lastUpdated: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating clinic tier:', error);
      return false;
    }
  }
  
  /**
   * Set a clinic's active status
   */
  static async setClinicActive(id: string, isActive: boolean) {
    try {
      const docRef = doc(db, 'clinics', id);
      
      await updateDoc(docRef, {
        status: isActive ? 'active' : 'inactive',
        lastUpdated: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating clinic status:', error);
      return false;
    }
  }
  
  /**
   * Generate and save an AI snapshot for a clinic
   */
  static async generateAndSaveSnapshot(id: string): Promise<{success: boolean, snapshot?: string, error?: string}> {
    try {
      // Get the clinic data
      const clinic = await this.getClinicById(id);
      
      if (!clinic) {
        return { success: false, error: 'Clinic not found' };
      }
      
      // Generate the snapshot
      const snapshot = await generateClinicSnapshot(clinic);
      
      if (!snapshot) {
        return { success: false, error: 'Failed to generate snapshot' };
      }
      
      // Save the snapshot to the clinic document
      const docRef = doc(db, 'clinics', id);
      await updateDoc(docRef, {
        snapshot,
        lastUpdated: serverTimestamp()
      });
      
      // Log the snapshot generation
      await this.logAdminAction(id, 'snapshot_generation', {
        snapshotLength: snapshot.length,
        generatedBy: 'ai'
      });
      
      return { success: true, snapshot };
    } catch (error) {
      console.error('Error generating clinic snapshot:', error);
      return { success: false, error: (error as Error).message };
    }
  }
  
  /**
   * Increment clinic interaction counters
   */
  static async incrementClinicInteraction(
    clinicId: string, 
    interactionType: 'viewCount' | 'clickToCallCount' | 'clickToWebsiteCount' | 'clickToDirectionsCount'
  ) {
    try {
      const docRef = doc(db, 'clinics', clinicId);
      
      // Use a transaction to prevent race conditions
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        
        if (!docSnap.exists()) {
          throw new Error('Clinic does not exist');
        }
        
        const currentValue = docSnap.data()?.[interactionType] || 0;
        
        transaction.update(docRef, {
          [interactionType]: currentValue + 1,
          lastUpdated: serverTimestamp()
        });
      });
      
      return true;
    } catch (error) {
      console.error(`Error incrementing ${interactionType}:`, error);
      return false;
    }
  }
  
  /**
   * Get reviews for a clinic
   */
  static async getClinicReviews(
    clinicId: string, 
    source?: 'google' | 'yelp' | 'healthgrades' | 'internal',
    limit?: number
  ): Promise<ReviewData[]> {
    try {
      const reviewsRef = collection(db, 'clinics', clinicId, 'reviews');
      
      let reviewsQuery;
      
      if (source) {
        reviewsQuery = query(
          reviewsRef,
          where('source', '==', source),
          orderBy('date', 'desc'),
          limit ? limit(limit) : limit(20)
        );
      } else {
        reviewsQuery = query(
          reviewsRef,
          orderBy('date', 'desc'),
          limit ? limit(limit) : limit(20)
        );
      }
      
      const snapshot = await getDocs(reviewsQuery);
      
      const reviews: ReviewData[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          source: data.source,
          rating: data.rating,
          text: data.text,
          author: data.author,
          date: data.date,
          url: data.url,
          verified: data.verified
        });
      });
      
      return reviews;
    } catch (error) {
      console.error('Error fetching clinic reviews:', error);
      return [];
    }
  }
  
  /**
   * Log an admin action
   */
  static async logAdminAction(
    clinicId: string,
    actionType: string,
    details?: any,
    adminId: string = 'system',
    adminName?: string
  ) {
    try {
      const logRef = doc(collection(db, 'admin_logs'));
      
      await setDoc(logRef, {
        clinicId,
        actionType,
        details: details || {},
        adminId,
        adminName,
        timestamp: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error logging admin action:', error);
      return false;
    }
  }
  
  /**
   * Get import logs with pagination
   */
  static async getImportLogs(pageSize = 10, startAfterDoc: DocumentData | null = null) {
    try {
      const logsRef = collection(db, 'import_logs');
      
      let q;
      
      if (startAfterDoc) {
        q = query(
          logsRef,
          orderBy('timestamp', 'desc'),
          startAfter(startAfterDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          logsRef,
          orderBy('timestamp', 'desc'),
          limit(pageSize)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      const logs: ImportLog[] = [];
      let lastDoc: DocumentData | null = null;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        lastDoc = doc;
        
        // Convert timestamp to Date
        const timestamp = data.timestamp 
          ? new Date(data.timestamp.seconds * 1000) 
          : new Date();
        
        logs.push({
          id: doc.id,
          fileName: data.fileName || 'Unknown',
          timestamp,
          totalRecords: data.totalRecords || 0,
          successCount: data.successCount || 0,
          failureCount: data.failureCount || 0,
          status: data.status || 'failed',
          source: data.source || 'manual',
          adminId: data.adminId || 'unknown',
          adminName: data.adminName,
          errors: data.errors || []
        });
      });
      
      return {
        logs,
        lastDoc: querySnapshot.docs.length > 0 ? lastDoc : null,
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting import logs:', error);
      throw error;
    }
  }
  
  /**
   * Retry a failed import
   */
  static async retryImport(logId: string) {
    try {
      // Update the log status to indicate retry in progress
      const logRef = doc(db, 'import_logs', logId);
      await updateDoc(logRef, {
        retryRequested: true,
        retryTimestamp: serverTimestamp()
      });
      
      // Note: The actual retry would be handled by a Cloud Function
      // that watches for changes to the import_logs collection
      
      return true;
    } catch (error) {
      console.error('Error requesting import retry:', error);
      return false;
    }
  }
}

export default FirestoreClient;