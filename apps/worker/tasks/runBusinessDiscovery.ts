import { DiscoveryOrchestrator, DiscoveryConfig } from '../../../web/utils/discovery/discoveryOrchestrator';

export interface DiscoveryTaskConfig extends DiscoveryConfig {
  sessionId?: string; // If provided, resume this session instead of starting new
}

export async function runBusinessDiscovery(config: DiscoveryTaskConfig): Promise<{
  success: boolean;
  sessionId?: string;
  clinicsFound?: number;
  clinicsImported?: number;
  error?: string;
}> {
  console.log('Starting business discovery task with config:', config);
  
  try {
    const orchestrator = new DiscoveryOrchestrator(config, (progress) => {
      console.log('Discovery progress:', {
        sessionId: progress.sessionId,
        completedGrids: progress.completedGrids,
        totalGrids: progress.totalGrids,
        clinicsFound: progress.clinicsFound,
        clinicsImported: progress.clinicsImported,
        estimatedTimeRemaining: progress.estimatedTimeRemaining,
        isRunning: progress.isRunning,
        isPaused: progress.isPaused
      });
    });

    let sessionId: string;
    
    if (config.sessionId) {
      // Resume existing session
      console.log(`Resuming discovery session: ${config.sessionId}`);
      const success = await orchestrator.resumeSession(config.sessionId);
      if (!success) {
        throw new Error(`Failed to resume session: ${config.sessionId}`);
      }
      sessionId = config.sessionId;
    } else {
      // Start new session
      console.log('Starting new discovery session');
      sessionId = await orchestrator.startNewSession(config);
    }

    // Wait for completion or pause
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        const progress = orchestrator.getProgress();
        
        if (!progress) {
          clearInterval(checkInterval);
          resolve({
            success: false,
            error: 'Lost connection to discovery session'
          });
          return;
        }

        if (!progress.isRunning && !progress.isPaused) {
          // Session completed or stopped
          clearInterval(checkInterval);
          resolve({
            success: true,
            sessionId: progress.sessionId,
            clinicsFound: progress.clinicsFound,
            clinicsImported: progress.clinicsImported
          });
        } else if (progress.isPaused) {
          // Session paused
          clearInterval(checkInterval);
          resolve({
            success: true,
            sessionId: progress.sessionId,
            clinicsFound: progress.clinicsFound,
            clinicsImported: progress.clinicsImported
          });
        }
      }, 10000); // Check every 10 seconds

      // Auto-timeout after 8 hours
      setTimeout(() => {
        clearInterval(checkInterval);
        orchestrator.pauseSession();
        const progress = orchestrator.getProgress();
        resolve({
          success: true,
          sessionId: progress?.sessionId || sessionId,
          clinicsFound: progress?.clinicsFound || 0,
          clinicsImported: progress?.clinicsImported || 0
        });
      }, 8 * 60 * 60 * 1000);
    });

  } catch (error) {
    console.error('Discovery task error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// CLI command interface
export async function executeDiscoveryCommand(args: string[]) {
  const config: DiscoveryTaskConfig = {
    targetClinicCount: 5000,
    strategy: 'metro_first',
    searchNiche: 'mensHealth',
    enableReviewImport: true,
    enableSocialEnhancement: true,
    maxConcurrentSearches: 3
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--target':
        if (nextArg) config.targetClinicCount = parseInt(nextArg);
        i++;
        break;
      case '--strategy':
        if (nextArg && ['metro_first', 'nationwide', 'state_by_state'].includes(nextArg)) {
          config.strategy = nextArg as any;
        }
        i++;
        break;
      case '--niche':
        if (nextArg && ['mensHealth', 'urgentCare', 'wellness'].includes(nextArg)) {
          config.searchNiche = nextArg as any;
        }
        i++;
        break;
      case '--no-reviews':
        config.enableReviewImport = false;
        break;
      case '--no-social':
        config.enableSocialEnhancement = false;
        break;
      case '--concurrent':
        if (nextArg) config.maxConcurrentSearches = parseInt(nextArg);
        i++;
        break;
      case '--resume':
        if (nextArg) config.sessionId = nextArg;
        i++;
        break;
      case '--pause-after':
        if (nextArg) config.pauseAfterMinutes = parseInt(nextArg);
        i++;
        break;
    }
  }

  console.log('Running business discovery with config:', config);
  const result = await runBusinessDiscovery(config);
  
  if (result.success) {
    console.log('Discovery completed successfully:', {
      sessionId: result.sessionId,
      clinicsFound: result.clinicsFound,
      clinicsImported: result.clinicsImported
    });
  } else {
    console.error('Discovery failed:', result.error);
    process.exit(1);
  }
}

// Example usage:
// npm run worker discovery --target 10000 --strategy metro_first --niche mensHealth
// npm run worker discovery --resume session_123456789 
// npm run worker discovery --target 5000 --no-reviews --concurrent 5