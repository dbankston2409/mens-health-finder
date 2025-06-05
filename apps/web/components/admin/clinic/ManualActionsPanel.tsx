import React, { useState } from 'react';
import { useAuth } from '../../../lib/contexts/authContext';

interface ManualActionsPanelProps {
  clinicId: string;
  clinicName: string;
  hasWebsite: boolean;
  hasScrapedData: boolean;
}

export default function ManualActionsPanel({
  clinicId,
  clinicName,
  hasWebsite,
  hasScrapedData
}: ManualActionsPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const performAction = async (action: string, endpoint: string, body: any = {}) => {
    setLoading(action);
    setError(null);
    setResults(null);

    try {
      const token = await user?.getIdToken();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ clinicId, ...body })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Action failed');
      }

      setResults({ action, ...data });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(null);
    }
  };

  const actions = [
    {
      id: 'rescrape',
      label: 'Rescrape Website',
      description: 'Fetch fresh data from the clinic website',
      endpoint: '/api/admin/rescrape-clinic',
      disabled: !hasWebsite,
      disabledReason: 'No website URL available',
      icon: '🔄'
    },
    {
      id: 'regenerate-all',
      label: 'Regenerate All Content',
      description: 'Regenerate SEO content and FAQs',
      endpoint: '/api/admin/regenerate-content',
      body: { regenerateType: 'all' },
      disabled: !hasScrapedData,
      disabledReason: 'No scraped data available. Rescrape first.',
      icon: '✨'
    },
    {
      id: 'regenerate-seo',
      label: 'Regenerate SEO Only',
      description: 'Generate new SEO content',
      endpoint: '/api/admin/regenerate-content',
      body: { regenerateType: 'seo' },
      disabled: !hasScrapedData,
      disabledReason: 'No scraped data available',
      icon: '📝'
    },
    {
      id: 'regenerate-faq',
      label: 'Regenerate FAQ Only',
      description: 'Generate new FAQ schema',
      endpoint: '/api/admin/regenerate-content',
      body: { regenerateType: 'faq' },
      disabled: !hasScrapedData,
      disabledReason: 'No scraped data available',
      icon: '❓'
    },
    {
      id: 'full-enrichment',
      label: 'Full Re-enrichment',
      description: 'Complete pipeline: scrape + content generation',
      endpoint: '/api/admin/full-enrichment',
      disabled: !hasWebsite,
      disabledReason: 'No website URL available',
      icon: '🚀'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Manual Actions
      </h3>

      <div className="space-y-3">
        {actions.map((action) => (
          <div key={action.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{action.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {action.label}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => performAction(action.id, action.endpoint, action.body)}
                disabled={action.disabled || loading !== null}
                className={`ml-4 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  action.disabled || loading !== null
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
                title={action.disabled ? action.disabledReason : ''}
              >
                {loading === action.id ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Run'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Results Display */}
      {results && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">
            ✅ {actions.find(a => a.id === results.action)?.label} Completed
          </h4>
          <div className="text-sm text-green-700">
            {results.results && (
              <ul className="list-disc list-inside">
                {Object.entries(results.results).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-medium">{formatKey(key)}:</span> {String(value)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-900 mb-1">Error</h4>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-1">
          ℹ️ About Manual Actions
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Rescrape:</strong> Fetches latest content from the website</li>
          <li>• <strong>Regenerate:</strong> Creates new SEO content using existing data</li>
          <li>• <strong>Full Enrichment:</strong> Complete pipeline from scratch</li>
          <li>• All actions are logged for audit purposes</li>
        </ul>
      </div>
    </div>
  );
}

function formatKey(key: string): string {
  return key
    .split(/(?=[A-Z])|_/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}