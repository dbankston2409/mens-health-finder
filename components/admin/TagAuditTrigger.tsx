import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface TagAuditTriggerProps {
  onComplete?: (summary: any) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'card';
}

/**
 * Component for triggering tag audits across all clinics
 */
export function TagAuditTrigger({ 
  onComplete, 
  size = 'md', 
  variant = 'button' 
}: TagAuditTriggerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const runAudit = async (dryRun = false) => {
    try {
      setIsRunning(true);
      
      const response = await fetch('/api/run-tag-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun })
      });
      
      if (!response.ok) {
        throw new Error('Audit request failed');
      }
      
      const result = await response.json();
      setLastResult(result);
      
      if (onComplete) {
        onComplete(result.summary);
      }
      
      console.log('✅ Tag audit completed:', result.summary);
      
    } catch (error) {
      console.error('❌ Tag audit failed:', error);
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (variant === 'card') {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tag Intelligence Scan</h3>
            <p className="text-sm text-gray-600 mt-1">
              Analyze all clinics for SEO issues and generate suggestions
            </p>
          </div>
          <MagnifyingGlassIcon className="h-8 w-8 text-blue-500" />
        </div>
        
        {/* Last Result Summary */}
        {lastResult && (
          <div className="mb-4 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Last Scan Results</span>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </button>
            </div>
            
            {lastResult.success ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span>{lastResult.summary.totalProcessed} clinics processed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                    <span>{lastResult.summary.criticalIssues} critical issues</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4 text-gray-500" />
                    <span>{(lastResult.summary.duration / 1000).toFixed(1)}s</span>
                  </div>
                </div>
                
                {showDetails && (
                  <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                    <div>New tags: {lastResult.summary.newTags}</div>
                    <div>Resolved: {lastResult.summary.resolvedTags}</div>
                    <div>Average score: {lastResult.summary.averageScore?.toFixed(1)}</div>
                    {lastResult.errors?.length > 0 && (
                      <div className="text-red-600 mt-1">
                        Errors: {lastResult.errors.length}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-red-600">
                ❌ Scan failed: {lastResult.error}
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => runAudit(false)}
            disabled={isRunning}
            className={`flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <MagnifyingGlassIcon className={`h-4 w-4 mr-2 ${isRunning ? 'animate-pulse' : ''}`} />
            {isRunning ? 'Scanning...' : 'Run Full Scan'}
          </button>
          
          <button
            onClick={() => runAudit(true)}
            disabled={isRunning}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Dry Run
          </button>
        </div>
        
        {isRunning && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-800">
                Analyzing clinics... This may take a few minutes.
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Button variant
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={() => runAudit(false)}
      disabled={isRunning}
      className={`inline-flex items-center ${sizeClasses[size]} font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
      title="Scan all clinics for SEO issues"
    >
      <MagnifyingGlassIcon className={`${
        size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
      } mr-2 ${isRunning ? 'animate-pulse' : ''}`} />
      {isRunning ? 'Scanning...' : '🔍 Scan SEO Tags'}
    </button>
  );
}

/**
 * Quick stats component for audit results
 */
export function TagAuditStats({ summary }: { summary: any }) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-3 bg-gray-50 rounded-lg">
        <div className="text-2xl font-bold text-gray-900">{summary.totalProcessed}</div>
        <div className="text-xs text-gray-600">Clinics Scanned</div>
      </div>
      
      <div className="text-center p-3 bg-red-50 rounded-lg">
        <div className="text-2xl font-bold text-red-600">{summary.criticalIssues}</div>
        <div className="text-xs text-gray-600">Critical Issues</div>
      </div>
      
      <div className="text-center p-3 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{summary.averageScore?.toFixed(0) || '0'}</div>
        <div className="text-xs text-gray-600">Avg SEO Score</div>
      </div>
      
      <div className="text-center p-3 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{summary.newTags}</div>
        <div className="text-xs text-gray-600">New Tags</div>
      </div>
    </div>
  );
}