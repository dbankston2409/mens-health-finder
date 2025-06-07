import React, { useState, useEffect } from 'react';
import { DiscoveryOrchestrator, DiscoveryConfig, DiscoveryProgress } from '../../../utils/discovery/discoveryOrchestrator';
import { DiscoverySession, SearchNiche } from '../../../types';
import DiscoveryMap from './DiscoveryMap';
import ReviewUpdatePanel from './ReviewUpdatePanel';

const DiscoveryControlPanel: React.FC = () => {
  const [orchestrator, setOrchestrator] = useState<DiscoveryOrchestrator | null>(null);
  const [currentSession, setCurrentSession] = useState<DiscoverySession | null>(null);
  const [progress, setProgress] = useState<DiscoveryProgress | null>(null);
  const [isConfigVisible, setIsConfigVisible] = useState(false);
  const [savedSessions, setSavedSessions] = useState<DiscoverySession[]>([]);
  
  // Configuration state
  const [config, setConfig] = useState<DiscoveryConfig>({
    targetClinicCount: 5000,
    strategy: 'metro_first',
    searchNiche: 'mensHealth',
    enableReviewImport: true,
    enableSocialEnhancement: true,
    maxConcurrentSearches: 3,
    pauseAfterMinutes: 60
  });

  useEffect(() => {
    // Load saved sessions on component mount
    loadSavedSessions();
  }, []);

  const loadSavedSessions = async () => {
    console.log('loadSavedSessions called, orchestrator exists:', !!orchestrator);
    
    // Create a temporary orchestrator just for loading sessions
    const tempOrchestrator = new DiscoveryOrchestrator(config, () => {});
    try {
      const sessions = await tempOrchestrator.getAllSessions();
      setSavedSessions(sessions.sort((a, b) => {
        const aDate = a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt 
          ? a.createdAt.toDate().getTime()
          : new Date(a.createdAt).getTime();
        const bDate = b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt
          ? b.createdAt.toDate().getTime()
          : new Date(b.createdAt).getTime();
        return bDate - aDate;
      }));
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleProgressUpdate = (newProgress: DiscoveryProgress) => {
    console.log('Progress update received:', newProgress);
    setProgress(newProgress);
    
    // If we don't have a current session yet, try to load it
    if (!currentSession && newProgress.sessionId) {
      loadSessionById(newProgress.sessionId);
    }
  };
  
  const loadSessionById = async (sessionId: string) => {
    try {
      const tempOrchestrator = new DiscoveryOrchestrator(config, () => {});
      const sessions = await tempOrchestrator.getAllSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
      }
    } catch (error) {
      console.error('Failed to load session by ID:', error);
    }
  };

  const startNewDiscovery = async () => {
    try {
      console.log('Starting new discovery with config:', config);
      
      const newOrchestrator = new DiscoveryOrchestrator(config, handleProgressUpdate);
      setOrchestrator(newOrchestrator);
      
      console.log('Orchestrator created, starting session...');
      const sessionId = await newOrchestrator.startNewSession(config);
      console.log(`Started new discovery session: ${sessionId}`);
      
      // The session will be set through progress updates
      setIsConfigVisible(false);
      await loadSavedSessions();
    } catch (error) {
      console.error('Failed to start discovery:', error);
      alert(`Failed to start discovery: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resumeSession = async (sessionId: string) => {
    try {
      const newOrchestrator = new DiscoveryOrchestrator(config, handleProgressUpdate);
      setOrchestrator(newOrchestrator);
      
      const success = await newOrchestrator.resumeSession(sessionId);
      if (success) {
        console.log(`Resumed session: ${sessionId}`);
        // Find the session and set it as current
        const session = savedSessions.find(s => s.id === sessionId);
        if (session) {
          setCurrentSession(session);
        }
      } else {
        alert('Failed to resume session');
      }
    } catch (error) {
      console.error('Failed to resume session:', error);
      alert('Failed to resume session. Please check the console for details.');
    }
  };

  const pauseDiscovery = async () => {
    if (orchestrator) {
      await orchestrator.pauseSession();
      await loadSavedSessions();
    }
  };

  const stopDiscovery = async () => {
    if (orchestrator) {
      await orchestrator.stopSession();
      await loadSavedSessions();
    }
  };

  const formatDate = (date: Date | string | any) => {
    try {
      let d: Date;
      
      // Handle Firestore Timestamp
      if (date && typeof date === 'object' && 'toDate' in date) {
        d = date.toDate();
      } else if (typeof date === 'string') {
        d = new Date(date);
      } else if (date instanceof Date) {
        d = date;
      } else {
        return 'Invalid date';
      }
      
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid date';
    }
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400 bg-green-900/30';
      case 'paused': return 'text-yellow-400 bg-yellow-900/30';
      case 'completed': return 'text-blue-400 bg-blue-900/30';
      case 'stopped': return 'text-gray-400 bg-gray-800';
      case 'error': return 'text-red-400 bg-red-900/30';
      default: return 'text-gray-400 bg-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Business Discovery System</h2>
          <p className="text-gray-400">Systematically discover and import men's health clinics nationwide</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsConfigVisible(!isConfigVisible)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            New Discovery
          </button>
          <button
            onClick={loadSavedSessions}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      {isConfigVisible && (
        <div className="bg-[#0A0A0A] p-6 rounded-lg border border-[#222222]">
          <h3 className="text-lg font-semibold mb-4 text-white">Discovery Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Target Clinic Count
              </label>
              <input
                type="number"
                value={config.targetClinicCount}
                onChange={(e) => setConfig({...config, targetClinicCount: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-[#111111] border border-[#333333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min="100"
                max="50000"
                step="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Search Strategy
              </label>
              <select
                value={config.strategy}
                onChange={(e) => setConfig({...config, strategy: e.target.value as any})}
                className="w-full px-3 py-2 bg-[#111111] border border-[#333333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="metro_first">Metro First</option>
                <option value="nationwide">Nationwide</option>
                <option value="state_by_state">State by State</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Search Niche
              </label>
              <select
                value={config.searchNiche}
                onChange={(e) => setConfig({...config, searchNiche: e.target.value as SearchNiche})}
                className="w-full px-3 py-2 bg-[#111111] border border-[#333333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="mensHealth">Men's Health</option>
                <option value="urgentCare">Urgent Care</option>
                <option value="wellness">Wellness Centers</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Concurrent Searches
              </label>
              <input
                type="number"
                value={config.maxConcurrentSearches}
                onChange={(e) => setConfig({...config, maxConcurrentSearches: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-[#111111] border border-[#333333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min="1"
                max="10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Auto-pause After (minutes)
              </label>
              <input
                type="number"
                value={config.pauseAfterMinutes || ''}
                onChange={(e) => setConfig({...config, pauseAfterMinutes: e.target.value ? parseInt(e.target.value) : undefined})}
                className="w-full px-3 py-2 bg-[#111111] border border-[#333333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min="5"
                max="480"
                placeholder="Optional"
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableReviewImport}
                onChange={(e) => setConfig({...config, enableReviewImport: e.target.checked})}
                className="rounded border-gray-600 text-primary bg-[#111111] focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-300">Import Google Reviews</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableSocialEnhancement}
                onChange={(e) => setConfig({...config, enableSocialEnhancement: e.target.checked})}
                className="rounded border-gray-600 text-primary bg-[#111111] focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-300">Extract Social Media & Enhanced Data</span>
            </label>
          </div>
          
          <div className="mt-6 flex space-x-3">
            <button
              onClick={startNewDiscovery}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Start Discovery
            </button>
            <button
              onClick={() => {
                // Preview grids that would be generated
                const gridGen = new DiscoveryOrchestrator(config, () => {});
                console.log('Preview: Grid generator would create grids for:', {
                  strategy: config.strategy,
                  targetCount: config.targetClinicCount
                });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Preview Grids
            </button>
            <button
              onClick={() => setIsConfigVisible(false)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Current Session Controls */}
      {progress && (
        <div className="bg-[#0A0A0A] p-6 rounded-lg border border-[#222222]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Current Session</h3>
            <div className="flex space-x-2">
              {progress.isRunning && (
                <button
                  onClick={pauseDiscovery}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                >
                  Pause
                </button>
              )}
              {progress.isPaused && (
                <button
                  onClick={() => resumeSession(progress.sessionId)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Resume
                </button>
              )}
              <button
                onClick={stopDiscovery}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Stop
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <div className="text-gray-400">Progress</div>
              <div className="font-semibold text-white">
                {progress.completedGrids} / {progress.totalGrids} grids
              </div>
            </div>
            <div>
              <div className="text-gray-400">Clinics Found</div>
              <div className="font-semibold text-white">{progress.clinicsFound}</div>
            </div>
            <div>
              <div className="text-gray-400">Clinics Imported</div>
              <div className="font-semibold text-white">{progress.clinicsImported}</div>
            </div>
            <div>
              <div className="text-gray-400">Time Remaining</div>
              <div className="font-semibold text-white">
                {progress.estimatedTimeRemaining > 0 ? formatTimeRemaining(progress.estimatedTimeRemaining) : 'Calculating...'}
              </div>
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${(progress.completedGrids / progress.totalGrids) * 100}%` }}
            ></div>
          </div>
          
          <div className="text-xs text-gray-400">
            Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${progress.isRunning ? 'text-green-400 bg-green-900/30' : progress.isPaused ? 'text-yellow-400 bg-yellow-900/30' : 'text-gray-400 bg-gray-800'}`}>
              {progress.isRunning ? 'Running' : progress.isPaused ? 'Paused' : 'Stopped'}
            </span>
            {progress.errors.length > 0 && (
              <span className="ml-2 text-red-400">
                ({progress.errors.length} error{progress.errors.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Discovery Map */}
      <div className="bg-[#0A0A0A] p-6 rounded-lg border border-[#222222]">
        <h3 className="text-lg font-semibold mb-4 text-white">Discovery Map</h3>
        {currentSession || progress ? (
          <DiscoveryMap session={currentSession} />
        ) : (
          <div className="text-gray-400 text-center py-8">
            Start a discovery session to see the search grid visualization
          </div>
        )}
      </div>

      {/* Selected Session Details */}
      {currentSession && !progress && (
        <div className="bg-[#0A0A0A] p-6 rounded-lg border border-[#222222]">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-white">Session Details</h3>
            <button
              onClick={() => setCurrentSession(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-gray-400 text-sm">Status</div>
              <div className="font-semibold text-white">{currentSession.status}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Clinics Found</div>
              <div className="font-semibold text-white">{currentSession.clinicsFound}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Clinics Imported</div>
              <div className="font-semibold text-white">{currentSession.clinicsImported}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Progress</div>
              <div className="font-semibold text-white">
                {currentSession.grids?.filter(g => g.status === 'completed').length || 0}/{currentSession.totalGrids} grids
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            {(currentSession.status === 'paused' || currentSession.status === 'stopped') && (
              <button
                onClick={() => resumeSession(currentSession.id)}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
              >
                Resume Discovery
              </button>
            )}
            {currentSession.clinicsFound > 0 && (
              <button
                onClick={() => window.location.href = '/admin'}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                View Imported Clinics
              </button>
            )}
          </div>
        </div>
      )}

      {/* Review Update Panel */}
      {(currentSession || progress) && (
        <ReviewUpdatePanel 
          discoverySessionId={currentSession?.id || progress?.sessionId}
          onUpdateComplete={(results) => {
            console.log('Review update completed:', results);
            // Optionally reload session data here
          }}
        />
      )}

      {/* Saved Sessions */}
      <div className="bg-[#0A0A0A] p-6 rounded-lg border border-[#222222]">
        <h3 className="text-lg font-semibold mb-4 text-white">Discovery Sessions</h3>
        
        {savedSessions.length === 0 ? (
          <p className="text-gray-400">No discovery sessions found. Start a new discovery to begin.</p>
        ) : (
          <div className="space-y-3">
            {savedSessions.slice(0, 10).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border border-[#333333] rounded-lg bg-[#111111]">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {session.config.strategy.replace('_', ' ')} - {session.config.targetClinicCount} target
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Created: {formatDate(session.createdAt)} | 
                    Found: {session.clinicsFound} | 
                    Imported: {session.clinicsImported} | 
                    Grids: {session.grids?.filter(g => g.status === 'completed').length || 0}/{session.totalGrids}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentSession(session)}
                    className="px-3 py-1 bg-primary/20 text-primary rounded text-sm hover:bg-primary/30 transition-colors"
                  >
                    View
                  </button>
                  {(session.status === 'paused' || session.status === 'stopped') && (
                    <button
                      onClick={() => resumeSession(session.id)}
                      className="px-3 py-1 bg-green-900/30 text-green-400 rounded text-sm hover:bg-green-900/50 transition-colors"
                    >
                      Resume
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoveryControlPanel;