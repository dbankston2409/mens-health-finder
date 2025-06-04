import { useState, useEffect, useCallback } from 'react';
import { DiscoveryOrchestrator, DiscoveryConfig, DiscoveryProgress } from '../discovery/discoveryOrchestrator';
import { DiscoverySession } from '../../types';

export interface UseBusinessDiscoveryReturn {
  // State
  orchestrator: DiscoveryOrchestrator | null;
  currentSession: DiscoverySession | null;
  progress: DiscoveryProgress | null;
  savedSessions: DiscoverySession[];
  isLoading: boolean;
  error: string | null;

  // Actions
  startNewDiscovery: (config: DiscoveryConfig) => Promise<string | null>;
  resumeSession: (sessionId: string) => Promise<boolean>;
  pauseDiscovery: () => Promise<void>;
  stopDiscovery: () => Promise<void>;
  loadSavedSessions: () => Promise<void>;
  clearError: () => void;
}

export function useBusinessDiscovery(): UseBusinessDiscoveryReturn {
  const [orchestrator, setOrchestrator] = useState<DiscoveryOrchestrator | null>(null);
  const [currentSession, setCurrentSession] = useState<DiscoverySession | null>(null);
  const [progress, setProgress] = useState<DiscoveryProgress | null>(null);
  const [savedSessions, setSavedSessions] = useState<DiscoverySession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProgressUpdate = useCallback((newProgress: DiscoveryProgress) => {
    setProgress(newProgress);
  }, []);

  const loadSavedSessions = useCallback(async () => {
    if (!orchestrator) return;
    
    try {
      setIsLoading(true);
      const sessions = await orchestrator.getAllSessions();
      setSavedSessions(sessions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [orchestrator]);

  const startNewDiscovery = useCallback(async (config: DiscoveryConfig): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newOrchestrator = new DiscoveryOrchestrator(config, handleProgressUpdate);
      setOrchestrator(newOrchestrator);
      
      const sessionId = await newOrchestrator.startNewSession(config);
      
      // Reload sessions to include the new one
      await loadSavedSessions();
      
      return sessionId;
    } catch (err) {
      console.error('Failed to start discovery:', err);
      setError(err instanceof Error ? err.message : 'Failed to start discovery');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleProgressUpdate, loadSavedSessions]);

  const resumeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Find the session config from saved sessions
      const session = savedSessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      const newOrchestrator = new DiscoveryOrchestrator(session.config, handleProgressUpdate);
      setOrchestrator(newOrchestrator);
      
      const success = await newOrchestrator.resumeSession(sessionId);
      if (success) {
        setCurrentSession(session);
        await loadSavedSessions();
      }
      
      return success;
    } catch (err) {
      console.error('Failed to resume session:', err);
      setError(err instanceof Error ? err.message : 'Failed to resume session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [savedSessions, handleProgressUpdate, loadSavedSessions]);

  const pauseDiscovery = useCallback(async () => {
    if (!orchestrator) return;
    
    try {
      setError(null);
      await orchestrator.pauseSession();
      await loadSavedSessions();
    } catch (err) {
      console.error('Failed to pause discovery:', err);
      setError(err instanceof Error ? err.message : 'Failed to pause discovery');
    }
  }, [orchestrator, loadSavedSessions]);

  const stopDiscovery = useCallback(async () => {
    if (!orchestrator) return;
    
    try {
      setError(null);
      await orchestrator.stopSession();
      await loadSavedSessions();
    } catch (err) {
      console.error('Failed to stop discovery:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop discovery');
    }
  }, [orchestrator, loadSavedSessions]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load saved sessions on mount
  useEffect(() => {
    if (orchestrator) {
      loadSavedSessions();
    }
  }, [orchestrator, loadSavedSessions]);

  // Initialize with a basic orchestrator to load sessions
  useEffect(() => {
    const basicConfig: DiscoveryConfig = {
      targetClinicCount: 1000,
      strategy: 'metro_first',
      searchNiche: 'mensHealth',
      enableReviewImport: false,
      enableSocialEnhancement: false,
      maxConcurrentSearches: 1
    };
    const basicOrchestrator = new DiscoveryOrchestrator(basicConfig);
    setOrchestrator(basicOrchestrator);
  }, []);

  return {
    orchestrator,
    currentSession,
    progress,
    savedSessions,
    isLoading,
    error,
    startNewDiscovery,
    resumeSession,
    pauseDiscovery,
    stopDiscovery,
    loadSavedSessions,
    clearError
  };
}