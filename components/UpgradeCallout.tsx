import React, { useState, useEffect } from 'react';
import { getUpgradePrompt, clearUpgradePrompt, UpgradePrompt } from '../apps/worker/utils/UpgradePromptEngine';
import { SparklesIcon, XMarkIcon, EnvelopeIcon, TrendingUpIcon } from '@heroicons/react/24/outline';

interface UpgradeCalloutProps {
  clinicId: string;
  isAdmin?: boolean;
  onUpgradeEmailSent?: () => void;
}

/**
 * Frontend clinic profile component for upgrade prompts
 */
export function UpgradeCallout({ clinicId, isAdmin = false, onUpgradeEmailSent }: UpgradeCalloutProps) {
  const [upgradePrompt, setUpgradePrompt] = useState<UpgradePrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchUpgradePrompt = async () => {
      try {
        const prompt = await getUpgradePrompt(clinicId);
        setUpgradePrompt(prompt);
      } catch (error) {
        console.error('Error fetching upgrade prompt:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpgradePrompt();
  }, [clinicId]);

  const handleSendUpgradeEmail = async () => {
    if (!upgradePrompt) return;
    
    try {
      setSending(true);
      
      // Call upgrade email API
      const response = await fetch('/api/send-upgrade-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clinicId,
          prompt: upgradePrompt
        })
      });
      
      if (response.ok) {
        console.log('✅ Upgrade email sent successfully');
        if (onUpgradeEmailSent) {
          onUpgradeEmailSent();
        }
        // Optionally clear the prompt after sending
        setDismissed(true);
      } else {
        throw new Error('Failed to send upgrade email');
      }
      
    } catch (error) {
      console.error('❌ Failed to send upgrade email:', error);
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await clearUpgradePrompt(clinicId);
      setDismissed(true);
      console.log('✅ Upgrade prompt dismissed');
    } catch (error) {
      console.error('❌ Failed to dismiss upgrade prompt:', error);
    }
  };

  if (loading || !upgradePrompt || dismissed) {
    return null;
  }

  const getPromptStyles = (type: string, priority: string) => {
    const baseStyles = 'rounded-2xl p-6 border-l-4';
    
    switch (priority) {
      case 'high':
        return `${baseStyles} bg-gradient-to-r from-green-50 to-blue-50 border-l-green-500`;
      case 'medium':
        return `${baseStyles} bg-gradient-to-r from-blue-50 to-indigo-50 border-l-blue-500`;
      case 'low':
        return `${baseStyles} bg-gradient-to-r from-gray-50 to-slate-50 border-l-gray-500`;
      default:
        return `${baseStyles} bg-white border-l-blue-500`;
    }
  };

  const getPromptIcon = (type: string) => {
    switch (type) {
      case 'engagement':
        return <TrendingUpIcon className="h-6 w-6 text-green-600" />;
      case 'performance':
        return <SparklesIcon className="h-6 w-6 text-yellow-600" />;
      case 'feature':
        return <SparklesIcon className="h-6 w-6 text-blue-600" />;
      default:
        return <SparklesIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
    
    switch (priority) {
      case 'high':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'low':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className={getPromptStyles(upgradePrompt.type, upgradePrompt.priority)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          {getPromptIcon(upgradePrompt.type)}
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                📈 Growth Opportunity
              </h3>
              <span className={getPriorityBadge(upgradePrompt.priority)}>
                {upgradePrompt.priority.toUpperCase()} PRIORITY
              </span>
            </div>
            
            <p className="text-gray-700 mb-3">
              {upgradePrompt.reason}
            </p>
            
            <p className="text-sm font-medium text-gray-900 mb-4">
              💡 {upgradePrompt.callToAction}
            </p>
            
            {upgradePrompt.expectedRevenue && (
              <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">
                  Estimated monthly revenue opportunity:
                </div>
                <div className="text-xl font-bold text-green-600">
                  ${upgradePrompt.expectedRevenue.toLocaleString()}
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              {isAdmin && (
                <button
                  onClick={handleSendUpgradeEmail}
                  disabled={sending}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Upgrade Email'}
                </button>
              )}
              
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Dismiss
              </button>
              
              <div className="text-xs text-gray-500">
                Package recommendation: {upgradePrompt.packageRecommendation}
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Compact upgrade prompt for admin panels
 */
interface CompactUpgradePromptProps {
  clinicId: string;
  prompt: UpgradePrompt;
  onAction?: (action: 'email' | 'dismiss') => void;
}

export function CompactUpgradePrompt({ clinicId, prompt, onAction }: CompactUpgradePromptProps) {
  const [processing, setProcessing] = useState(false);

  const handleAction = async (action: 'email' | 'dismiss') => {
    setProcessing(true);
    
    try {
      if (action === 'email') {
        await fetch('/api/send-upgrade-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clinicId, prompt })
        });
      } else if (action === 'dismiss') {
        await clearUpgradePrompt(clinicId);
      }
      
      if (onAction) {
        onAction(action);
      }
      
    } catch (error) {
      console.error(`Failed to ${action} upgrade prompt:`, error);
    } finally {
      setProcessing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 ${getPriorityColor(prompt.priority)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              📈 Upgrade Opportunity
            </span>
            <span className="text-xs text-gray-500">
              ({prompt.priority})
            </span>
          </div>
          
          <p className="text-sm text-gray-700 mb-2">
            {prompt.reason}
          </p>
          
          {prompt.expectedRevenue && (
            <div className="text-xs text-green-600 font-medium mb-2">
              Est. revenue: ${prompt.expectedRevenue.toLocaleString()}/mo
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleAction('email')}
              disabled={processing}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              📧 Email
            </button>
            
            <button
              onClick={() => handleAction('dismiss')}
              disabled={processing}
              className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Upgrade prompt summary for dashboard
 */
interface UpgradePromptSummaryProps {
  prompts: Array<{ clinicId: string; prompt: UpgradePrompt; clinicName?: string }>;
}

export function UpgradePromptSummary({ prompts }: UpgradePromptSummaryProps) {
  const summary = prompts.reduce(
    (acc, { prompt }) => {
      acc[prompt.priority] = (acc[prompt.priority] || 0) + 1;
      acc.totalRevenue += prompt.expectedRevenue || 0;
      return acc;
    },
    { high: 0, medium: 0, low: 0, totalRevenue: 0 } as Record<string, number>
  );

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Upgrade Opportunities</h4>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-lg font-bold text-red-600">{summary.high}</div>
          <div className="text-xs text-gray-600">High Priority</div>
        </div>
        
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-lg font-bold text-yellow-600">{summary.medium}</div>
          <div className="text-xs text-gray-600">Medium Priority</div>
        </div>
      </div>
      
      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="text-sm text-gray-600">Potential Monthly Revenue</div>
        <div className="text-xl font-bold text-green-600">
          ${summary.totalRevenue.toLocaleString()}
        </div>
      </div>
    </div>
  );
}