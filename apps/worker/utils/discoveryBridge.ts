import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit } from '../lib/firebase-compat';
import { DiscoveryTaskConfig } from '../types/discovery';

/**
 * Bridge between worker tasks and web app discovery system
 * Allows worker to create and monitor discovery sessions that the web app processes
 */
export class DiscoveryBridge {
  /**
   * Create a new discovery session that the web app can pick up
   */
  async createDiscoverySession(config: DiscoveryTaskConfig): Promise<string> {
    const sessionId = `discovery_worker_${Date.now()}`;
    
    const session = {
      id: sessionId,
      config: {
        targetClinicCount: config.targetClinicCount,
        strategy: config.strategy,
        searchNiche: config.searchNiche,
        enableReviewImport: config.enableReviewImport,
        enableSocialEnhancement: config.enableSocialEnhancement,
        maxConcurrentSearches: config.maxConcurrentSearches,
        pauseAfterMinutes: config.pauseAfterMinutes
      },
      status: 'pending', // Web app will pick this up and change to 'running'
      createdAt: new Date(),
      updatedAt: new Date(),
      currentGridIndex: 0,
      clinicsFound: 0,
      clinicsImported: 0,
      totalGrids: 0,
      grids: [],
      errors: [],
      source: 'worker' // Indicates this was created by worker
    };
    
    await setDoc(doc(db, 'discoverySession', sessionId), session);
    
    console.log(`Created discovery session: ${sessionId}`);
    console.log('The web app will pick up and process this session.');
    
    return sessionId;
  }
  
  /**
   * Check status of a discovery session
   */
  async getSessionStatus(sessionId: string): Promise<{
    status: string;
    clinicsFound: number;
    clinicsImported: number;
    progress: number;
    errors: string[];
  } | null> {
    try {
      const sessionDoc = await getDoc(doc(db, 'discoverySession', sessionId));
      
      if (!sessionDoc.exists()) {
        return null;
      }
      
      const session = sessionDoc.data();
      const progress = session.totalGrids > 0 
        ? (session.currentGridIndex / session.totalGrids) * 100 
        : 0;
      
      return {
        status: session.status,
        clinicsFound: session.clinicsFound || 0,
        clinicsImported: session.clinicsImported || 0,
        progress: Math.round(progress),
        errors: session.errors || []
      };
    } catch (error) {
      console.error('Error getting session status:', error);
      return null;
    }
  }
  
  /**
   * Resume a paused session
   */
  async resumeSession(sessionId: string): Promise<boolean> {
    try {
      const sessionDoc = await getDoc(doc(db, 'discoverySession', sessionId));
      
      if (!sessionDoc.exists()) {
        console.error('Session not found');
        return false;
      }
      
      const session = sessionDoc.data();
      
      if (session.status !== 'paused' && session.status !== 'stopped') {
        console.log(`Session is ${session.status}, cannot resume`);
        return false;
      }
      
      // Update status to pending so web app will pick it up
      await setDoc(doc(db, 'discoverySession', sessionId), {
        ...session,
        status: 'pending',
        updatedAt: new Date()
      });
      
      console.log(`Session ${sessionId} marked for resumption`);
      return true;
    } catch (error) {
      console.error('Error resuming session:', error);
      return false;
    }
  }
  
  /**
   * Pause a running session
   */
  async pauseSession(sessionId: string): Promise<boolean> {
    try {
      const sessionDoc = await getDoc(doc(db, 'discoverySession', sessionId));
      
      if (!sessionDoc.exists()) {
        console.error('Session not found');
        return false;
      }
      
      const session = sessionDoc.data();
      
      if (session.status !== 'running') {
        console.log(`Session is ${session.status}, cannot pause`);
        return false;
      }
      
      // Request pause (web app will handle actual pausing)
      await setDoc(doc(db, 'discoverySession', sessionId), {
        ...session,
        requestedStatus: 'pause',
        updatedAt: new Date()
      });
      
      console.log(`Pause requested for session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error pausing session:', error);
      return false;
    }
  }
  
  /**
   * Get all discovery sessions
   */
  async getAllSessions(): Promise<any[]> {
    try {
      const sessionsQuery = query(
        collection(db, 'discoverySession'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(sessionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }
  
  /**
   * Monitor a session until completion
   */
  async monitorSession(sessionId: string, intervalMs: number = 5000): Promise<void> {
    console.log(`Monitoring session ${sessionId}...`);
    
    const checkStatus = async () => {
      const status = await this.getSessionStatus(sessionId);
      
      if (!status) {
        console.error('Session not found');
        return false;
      }
      
      console.log(`Status: ${status.status} | Progress: ${status.progress}% | Found: ${status.clinicsFound} | Imported: ${status.clinicsImported}`);
      
      if (status.errors.length > 0) {
        console.log('Errors:', status.errors.slice(-3)); // Show last 3 errors
      }
      
      // Continue monitoring if still running
      return status.status === 'running' || status.status === 'pending';
    };
    
    // Initial check
    let shouldContinue = await checkStatus();
    
    // Poll for updates
    while (shouldContinue) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      shouldContinue = await checkStatus();
    }
    
    console.log('Session monitoring complete');
  }
}

export const discoveryBridge = new DiscoveryBridge();