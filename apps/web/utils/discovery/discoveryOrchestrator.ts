import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { GridGenerator } from './gridGenerator';
import { ExtendedDataCollector } from './enhancedDataCollector';
import { DiscoverySession, DiscoveryGrid, SearchNiche, Clinic } from '../../types';

export interface DiscoveryConfig {
  targetClinicCount: number;
  strategy: 'metro_first' | 'nationwide' | 'state_by_state';
  searchNiche: SearchNiche;
  enableReviewImport: boolean;
  enableSocialEnhancement: boolean;
  maxConcurrentSearches: number;
  pauseAfterMinutes?: number;
}

export interface DiscoveryProgress {
  sessionId: string;
  totalGrids: number;
  completedGrids: number;
  currentGrid: number;
  clinicsFound: number;
  clinicsImported: number;
  estimatedTimeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  lastUpdated: Date;
  errors: string[];
}

export class DiscoveryOrchestrator {
  private gridGenerator: GridGenerator;
  private dataCollector: ExtendedDataCollector;
  private session: DiscoverySession | null = null;
  private grids: DiscoveryGrid[] = [];
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private onProgressUpdate?: (progress: DiscoveryProgress) => void;
  private startTime: Date = new Date();
  private clinicsFound: number = 0;
  private clinicsImported: number = 0;
  private currentGridIndex: number = 0;
  private errors: string[] = [];

  constructor(config: DiscoveryConfig, onProgressUpdate?: (progress: DiscoveryProgress) => void) {
    this.gridGenerator = new GridGenerator();
    // Get Google API key from environment or config
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || 
                        process.env.GOOGLE_PLACES_API_KEY || '';
    console.log('DiscoveryOrchestrator initialized with:', {
      hasApiKey: !!googleApiKey,
      apiKeyLength: googleApiKey.length,
      config
    });
    if (!googleApiKey) {
      console.error('⚠️ Google Places API key not found! Discovery will fail.');
      console.error('Please set NEXT_PUBLIC_GOOGLE_PLACES_API_KEY in your environment');
    }
    this.dataCollector = new ExtendedDataCollector(googleApiKey);
    this.onProgressUpdate = onProgressUpdate;
  }

  async startNewSession(config: DiscoveryConfig): Promise<string> {
    // Create new session
    const sessionId = `discovery_${Date.now()}`;
    this.session = {
      id: sessionId,
      config,
      status: 'running',
      createdAt: new Date(),
      updatedAt: new Date(),
      currentGridIndex: 0,
      clinicsFound: 0,
      clinicsImported: 0,
      totalGrids: 0,
      grids: [],
      errors: []
    };

    // Generate discovery grids
    this.grids = this.gridGenerator.generateGrids(config.strategy, config.targetClinicCount);
    this.session.grids = this.grids.map(grid => ({ ...grid, status: 'pending' }));
    this.session.totalGrids = this.grids.length;

    // Save session to Firestore
    console.log('Saving session to Firestore:', sessionId);
    try {
      await setDoc(doc(db, 'discoverySession', sessionId), this.session);
      console.log('Session saved successfully');
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }

    this.startTime = new Date();
    this.isRunning = true;
    this.isPaused = false;
    this.currentGridIndex = 0;
    this.clinicsFound = 0;
    this.clinicsImported = 0;
    this.errors = [];

    // Start the discovery process
    this.runDiscovery();

    return sessionId;
  }

  async resumeSession(sessionId: string): Promise<boolean> {
    try {
      const sessionDoc = await getDoc(doc(db, 'discoverySession', sessionId));
      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      this.session = sessionDoc.data() as DiscoverySession;
      this.grids = this.session.grids;
      this.currentGridIndex = this.session.currentGridIndex;
      this.clinicsFound = this.session.clinicsFound;
      this.clinicsImported = this.session.clinicsImported;
      this.errors = this.session.errors || [];

      this.startTime = new Date();
      this.isRunning = true;
      this.isPaused = false;

      // Update session status
      await updateDoc(doc(db, 'discoverySession', sessionId), {
        status: 'running',
        updatedAt: new Date()
      });

      // Resume discovery
      this.runDiscovery();

      return true;
    } catch (error) {
      console.error('Failed to resume session:', error);
      return false;
    }
  }

  async pauseSession(): Promise<void> {
    if (!this.session) return;

    this.isPaused = true;
    this.isRunning = false;

    // Update session in Firestore
    await updateDoc(doc(db, 'discoverySession', this.session.id), {
      status: 'paused',
      currentGridIndex: this.currentGridIndex,
      clinicsFound: this.clinicsFound,
      clinicsImported: this.clinicsImported,
      grids: this.grids,
      errors: this.errors,
      updatedAt: new Date()
    });

    this.updateProgress();
  }

  async stopSession(): Promise<void> {
    if (!this.session) return;

    this.isRunning = false;
    this.isPaused = false;

    // Update session in Firestore
    await updateDoc(doc(db, 'discoverySession', this.session.id), {
      status: 'stopped',
      currentGridIndex: this.currentGridIndex,
      clinicsFound: this.clinicsFound,
      clinicsImported: this.clinicsImported,
      grids: this.grids,
      errors: this.errors,
      updatedAt: new Date()
    });

    this.updateProgress();
  }

  private async runDiscovery(): Promise<void> {
    if (!this.session) {
      console.error('No session available for discovery');
      return;
    }

    console.log('Starting discovery process:', {
      totalGrids: this.grids.length,
      currentIndex: this.currentGridIndex,
      isRunning: this.isRunning,
      isPaused: this.isPaused
    });

    try {
      while (this.currentGridIndex < this.grids.length && this.isRunning && !this.isPaused) {
        const grid = this.grids[this.currentGridIndex];
        console.log(`Processing grid ${this.currentGridIndex + 1}/${this.grids.length}:`, grid);
        
        // Update grid status
        grid.status = 'searching';
        await this.updateSessionProgress();

        try {
          // Search for clinics in this grid
          const clinics = await this.searchGridForClinics(grid);
          
          // Import found clinics
          const importedCount = await this.importClinics(clinics);
          
          // Update grid completion
          grid.status = 'completed';
          grid.clinicsFound = clinics.length;
          grid.clinicsImported = importedCount;
          
          this.clinicsFound += clinics.length;
          this.clinicsImported += importedCount;

          // Check if we've reached our target
          if (this.clinicsFound >= this.session.config.targetClinicCount) {
            await this.completeSession();
            return;
          }

        } catch (error) {
          console.error(`Error processing grid ${this.currentGridIndex}:`, error);
          grid.status = 'error';
          grid.error = error instanceof Error ? error.message : 'Unknown error';
          this.errors.push(`Grid ${this.currentGridIndex}: ${grid.error}`);
        }

        this.currentGridIndex++;
        await this.updateSessionProgress();
        this.updateProgress();

        // Check for auto-pause
        if (this.session.config.pauseAfterMinutes) {
          const elapsedMinutes = (Date.now() - this.startTime.getTime()) / (1000 * 60);
          if (elapsedMinutes >= this.session.config.pauseAfterMinutes) {
            await this.pauseSession();
            return;
          }
        }

        // Small delay between grids to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // If we completed all grids
      if (this.currentGridIndex >= this.grids.length) {
        await this.completeSession();
      }

    } catch (error) {
      console.error('Discovery process error:', error);
      this.errors.push(`Process error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await this.stopSession();
    }
  }

  private async searchGridForClinics(grid: any): Promise<Clinic[]> {
    if (!this.session) return [];

    // Calculate center from bounds if not available
    let centerLat, centerLng, radius;
    
    if (grid.bounds) {
      centerLat = (grid.bounds.north + grid.bounds.south) / 2;
      centerLng = (grid.bounds.east + grid.bounds.west) / 2;
      // Calculate approximate radius in km (rough approximation)
      const latDiff = Math.abs(grid.bounds.north - grid.bounds.south);
      const lngDiff = Math.abs(grid.bounds.east - grid.bounds.west);
      radius = Math.max(latDiff, lngDiff) * 111 / 2; // Convert degrees to km
    } else if (grid.lat && grid.lng) {
      centerLat = grid.lat;
      centerLng = grid.lng;
      radius = grid.radius || 10;
    } else {
      console.error('Invalid grid structure:', grid);
      return [];
    }

    console.log('Searching grid for clinics:', {
      center: `${centerLat}, ${centerLng}`,
      radius: radius,
      niche: this.session.config.searchNiche,
      gridId: grid.id
    });

    // Create a search-compatible grid object
    const searchGrid = {
      ...grid,
      lat: centerLat,
      lng: centerLng,
      radius: radius,
      center: { lat: centerLat, lng: centerLng }
    };

    const searchResults = await this.dataCollector.searchGrid(
      searchGrid,
      this.session.config.searchNiche,
      this.session.config.maxConcurrentSearches
    );
    
    console.log(`Found ${searchResults.length} clinics in grid`);

    // Enhance with additional data if enabled
    const enhancedClinics: Clinic[] = [];
    for (const clinic of searchResults) {
      try {
        let enhancedClinic = clinic;

        // Add social media data if enabled
        if (this.session.config.enableSocialEnhancement && clinic.website) {
          const socialData = await this.dataCollector.extractSocialMediaLinks(clinic.website);
          enhancedClinic = { ...enhancedClinic, ...socialData };
        }

        // Add review data if enabled
        if (this.session.config.enableReviewImport) {
          if (clinic.googlePlacesId) {
            const googleReviews = await this.dataCollector.getGoogleReviews(clinic.googlePlacesId);
            enhancedClinic.googleReviews = googleReviews;
          }
        }

        enhancedClinics.push(enhancedClinic);
      } catch (error) {
        console.error(`Error enhancing clinic ${clinic.name}:`, error);
        // Add basic clinic even if enhancement fails
        enhancedClinics.push(clinic);
      }
    }

    return enhancedClinics;
  }

  private async importClinics(clinics: Clinic[]): Promise<number> {
    console.log(`Starting import of ${clinics.length} clinics`);
    let importedCount = 0;

    for (const clinic of clinics) {
      try {
        console.log(`Importing clinic: ${clinic.name} at ${clinic.address}`);
        
        // Check for duplicates using address matching
        const existingClinics = await getDocs(
          query(
            collection(db, 'clinics'),
            where('address', '==', clinic.address)
          )
        );

        if (existingClinics.empty) {
          // Add as free tier clinic
          const clinicData = {
            ...clinic,
            tier: 'free',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            discoverySource: 'automated_discovery',
            discoveryGridId: `${clinic.lat}_${clinic.lng}`,
            discoveryDate: new Date()
          };

          console.log(`Saving clinic to Firestore:`, clinicData);
          const docRef = await addDoc(collection(db, 'clinics'), clinicData);
          console.log(`Clinic saved with ID: ${docRef.id}`);
          importedCount++;
        } else {
          console.log(`Duplicate clinic found for ${clinic.name} at ${clinic.address}`);
        }
      } catch (error) {
        console.error(`Error importing clinic ${clinic.name}:`, error);
        this.errors.push(`Import error for ${clinic.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Import complete. Imported ${importedCount} out of ${clinics.length} clinics`);
    return importedCount;
  }

  private async updateSessionProgress(): Promise<void> {
    if (!this.session) return;

    await updateDoc(doc(db, 'discoverySession', this.session.id), {
      currentGridIndex: this.currentGridIndex,
      clinicsFound: this.clinicsFound,
      clinicsImported: this.clinicsImported,
      grids: this.grids,
      errors: this.errors,
      updatedAt: new Date()
    });
  }

  private async completeSession(): Promise<void> {
    if (!this.session) return;

    this.isRunning = false;
    this.isPaused = false;

    await updateDoc(doc(db, 'discoverySession', this.session.id), {
      status: 'completed',
      currentGridIndex: this.currentGridIndex,
      clinicsFound: this.clinicsFound,
      clinicsImported: this.clinicsImported,
      grids: this.grids,
      errors: this.errors,
      completedAt: new Date(),
      updatedAt: new Date()
    });

    this.updateProgress();
  }

  private updateProgress(): void {
    if (!this.onProgressUpdate || !this.session) return;

    const completedGrids = this.grids.filter(g => g.status === 'completed').length;
    const elapsedTime = Date.now() - this.startTime.getTime();
    const averageTimePerGrid = completedGrids > 0 ? elapsedTime / completedGrids : 0;
    const remainingGrids = this.grids.length - completedGrids;
    const estimatedTimeRemaining = remainingGrids * averageTimePerGrid;

    const progress: DiscoveryProgress = {
      sessionId: this.session.id,
      totalGrids: this.grids.length,
      completedGrids,
      currentGrid: this.currentGridIndex,
      clinicsFound: this.clinicsFound,
      clinicsImported: this.clinicsImported,
      estimatedTimeRemaining: Math.round(estimatedTimeRemaining / 1000 / 60), // minutes
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      lastUpdated: new Date(),
      errors: [...this.errors]
    };

    this.onProgressUpdate(progress);
  }

  async getAllSessions(): Promise<DiscoverySession[]> {
    console.log('Fetching all discovery sessions...');
    try {
      const sessionsSnapshot = await getDocs(collection(db, 'discoverySession'));
      const sessions = sessionsSnapshot.docs.map(doc => doc.data() as DiscoverySession);
      console.log(`Found ${sessions.length} discovery sessions`);
      return sessions;
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      return [];
    }
  }

  getProgress(): DiscoveryProgress | null {
    if (!this.session) return null;

    const completedGrids = this.grids.filter(g => g.status === 'completed').length;
    const elapsedTime = Date.now() - this.startTime.getTime();
    const averageTimePerGrid = completedGrids > 0 ? elapsedTime / completedGrids : 0;
    const remainingGrids = this.grids.length - completedGrids;
    const estimatedTimeRemaining = remainingGrids * averageTimePerGrid;

    return {
      sessionId: this.session.id,
      totalGrids: this.grids.length,
      completedGrids,
      currentGrid: this.currentGridIndex,
      clinicsFound: this.clinicsFound,
      clinicsImported: this.clinicsImported,
      estimatedTimeRemaining: Math.round(estimatedTimeRemaining / 1000 / 60),
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      lastUpdated: new Date(),
      errors: [...this.errors]
    };
  }
}