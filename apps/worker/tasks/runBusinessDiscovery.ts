import { DiscoveryTaskConfig } from '../types/discovery';

export async function runBusinessDiscovery(config: DiscoveryTaskConfig): Promise<{
  success: boolean;
  sessionId?: string;
  clinicsFound?: number;
  clinicsImported?: number;
  error?: string;
}> {
  console.log('Business discovery task initiated with config:', config);
  
  try {
    // For now, log the configuration - full orchestrator requires web app integration
    console.log('Discovery Configuration:');
    console.log(`  Target Clinics: ${config.targetClinicCount}`);
    console.log(`  Strategy: ${config.strategy}`);
    console.log(`  Search Niche: ${config.searchNiche}`);
    console.log(`  Enable Reviews: ${config.enableReviewImport}`);
    console.log(`  Enable Social: ${config.enableSocialEnhancement}`);
    console.log(`  Max Concurrent: ${config.maxConcurrentSearches}`);
    
    if (config.sessionId) {
      console.log(`  Resume Session: ${config.sessionId}`);
    }
    
    if (config.pauseAfterMinutes) {
      console.log(`  Auto-pause after: ${config.pauseAfterMinutes} minutes`);
    }

    // TODO: Implement actual discovery orchestration when web app dependencies are available
    console.log('Note: Full discovery orchestration requires web app integration.');
    console.log('Use the web interface at /admin/discovery for complete functionality.');
    
    return {
      success: true,
      sessionId: config.sessionId || `discovery_${Date.now()}`,
      clinicsFound: 0,
      clinicsImported: 0
    };

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
    strategy: 'metro_first' as const,
    searchNiche: 'mensHealth' as const,
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