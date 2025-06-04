// Shared discovery types for worker tasks
export type SearchNiche = 'mensHealth' | 'urgentCare' | 'wellness';
export type DiscoveryStrategy = 'metro_first' | 'nationwide' | 'state_by_state';
export type GridStatus = 'pending' | 'searching' | 'completed' | 'error';
export type SessionStatus = 'running' | 'paused' | 'completed' | 'stopped' | 'error';

export interface DiscoveryConfig {
  targetClinicCount: number;
  strategy: DiscoveryStrategy;
  searchNiche: SearchNiche;
  enableReviewImport: boolean;
  enableSocialEnhancement: boolean;
  maxConcurrentSearches: number;
  pauseAfterMinutes?: number;
}

export interface DiscoveryGrid {
  lat: number;
  lng: number;
  radius: number;
  priority?: number;
  status: GridStatus;
  clinicsFound?: number;
  clinicsImported?: number;
  error?: string;
}

export interface DiscoverySession {
  id: string;
  config: DiscoveryConfig;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  currentGridIndex: number;
  clinicsFound: number;
  clinicsImported: number;
  totalGrids: number;
  grids: DiscoveryGrid[];
  errors: string[];
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

export interface DiscoveryTaskConfig extends DiscoveryConfig {
  sessionId?: string; // If provided, resume this session instead of starting new
}