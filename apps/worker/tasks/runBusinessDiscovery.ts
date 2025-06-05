import { DiscoveryTaskConfig } from '../types/discovery';
import { discoveryBridge } from '../utils/discoveryBridge';

export async function runBusinessDiscovery(config: DiscoveryTaskConfig): Promise<{
  success: boolean;
  sessionId?: string;
  clinicsFound?: number;
  clinicsImported?: number;
  error?: string;
}> {
  console.log('Business discovery task initiated with config:', config);
  
  try {
    let sessionId: string;
    
    if (config.sessionId) {
      // Resume existing session
      console.log(`Resuming session: ${config.sessionId}`);
      const resumed = await discoveryBridge.resumeSession(config.sessionId);
      
      if (!resumed) {
        throw new Error('Failed to resume session');
      }
      
      sessionId = config.sessionId;
    } else {
      // Create new discovery session
      console.log('Creating new discovery session...');
      sessionId = await discoveryBridge.createDiscoverySession(config);
    }
    
    console.log(`\nDiscovery session: ${sessionId}`);
    console.log('The web app discovery orchestrator will process this session.');
    console.log('\nYou can:');
    console.log('1. Monitor progress: npm run worker discovery:status ' + sessionId);
    console.log('2. View in browser: http://localhost:3000/admin/discovery');
    console.log('3. Pause session: npm run worker discovery:pause ' + sessionId);
    
    // Get initial status
    const status = await discoveryBridge.getSessionStatus(sessionId);
    
    return {
      success: true,
      sessionId,
      clinicsFound: status?.clinicsFound || 0,
      clinicsImported: status?.clinicsImported || 0
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
  // Special commands
  if (args[0] === 'status' && args[1]) {
    const sessionId = args[1];
    const status = await discoveryBridge.getSessionStatus(sessionId);
    
    if (!status) {
      console.error('Session not found');
      process.exit(1);
    }
    
    console.log('\nDiscovery Session Status:');
    console.log(`  Status: ${status.status}`);
    console.log(`  Progress: ${status.progress}%`);
    console.log(`  Clinics Found: ${status.clinicsFound}`);
    console.log(`  Clinics Imported: ${status.clinicsImported}`);
    
    if (status.errors.length > 0) {
      console.log(`  Errors: ${status.errors.length}`);
      status.errors.slice(-3).forEach(err => console.log(`    - ${err}`));
    }
    
    return;
  }
  
  if (args[0] === 'pause' && args[1]) {
    const sessionId = args[1];
    const paused = await discoveryBridge.pauseSession(sessionId);
    
    if (paused) {
      console.log('Pause requested successfully');
    } else {
      console.error('Failed to pause session');
      process.exit(1);
    }
    
    return;
  }
  
  if (args[0] === 'monitor' && args[1]) {
    const sessionId = args[1];
    await discoveryBridge.monitorSession(sessionId);
    return;
  }
  
  if (args[0] === 'list') {
    const sessions = await discoveryBridge.getAllSessions();
    
    console.log('\nRecent Discovery Sessions:');
    sessions.forEach(session => {
      const createdAt = new Date(session.createdAt.seconds * 1000).toLocaleString();
      console.log(`\n  ID: ${session.id}`);
      console.log(`  Status: ${session.status}`);
      console.log(`  Created: ${createdAt}`);
      console.log(`  Found: ${session.clinicsFound || 0} | Imported: ${session.clinicsImported || 0}`);
    });
    
    return;
  }
  
  // Regular discovery command
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
    console.log('\nDiscovery started successfully!');
    console.log(`Session ID: ${result.sessionId}`);
    
    // Optionally monitor the session
    if (args.includes('--monitor')) {
      await discoveryBridge.monitorSession(result.sessionId!);
    }
  } else {
    console.error('Discovery failed:', result.error);
    process.exit(1);
  }
}

// Example usage:
// npm run worker discovery --target 10000 --strategy metro_first --niche mensHealth
// npm run worker discovery --resume session_123456789 
// npm run worker discovery --target 5000 --no-reviews --concurrent 5
// npm run worker discovery:status session_123456789
// npm run worker discovery:pause session_123456789
// npm run worker discovery:monitor session_123456789
// npm run worker discovery:list