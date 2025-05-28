import React, { useState } from 'react';
import { useSeoIndexStatus, useAdminSeoStats, useRecentlyIndexed } from '../../../apps/web/utils/hooks/useSeoIndexStatus';

export function SeoIndexStatusPanel() {
  const [activeTab, setActiveTab] = useState<'overview' | 'recent' | 'queries'>('overview');
  const { clinics, loading, error, summary, refresh } = useSeoIndexStatus();
  const { stats, loading: statsLoading, refresh: refreshStats } = useAdminSeoStats();
  const { recentClinics, loading: recentLoading } = useRecentlyIndexed(10);

  const handleRefresh = async () => {
    await Promise.all([refresh(), refreshStats()]);
  };

  if (loading || statsLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
          <p>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">SEO Index Status</h2>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
          <div className="text-sm text-gray-600">Total Clinics</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{summary.indexed}</div>
          <div className="text-sm text-gray-600">Indexed</div>
          <div className="text-xs text-gray-500">
            {summary.total > 0 ? ((summary.indexed / summary.total) * 100).toFixed(1) : 0}%
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{summary.notIndexed}</div>
          <div className="text-sm text-gray-600">Not Indexed</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{summary.totalClicks}</div>
          <div className="text-sm text-gray-600">Total Clicks</div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{summary.avgCTR.toFixed(2)}%</div>
          <div className="text-sm text-gray-600">Avg CTR</div>
        </div>
      </div>

      {/* Admin Stats */}
      {stats && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-3">System Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Last Sitemap Ping:</span>
              <div className="font-medium">
                {stats.lastPingTime 
                  ? stats.lastPingTime.toLocaleDateString()
                  : 'Never'
                }
              </div>
            </div>
            <div>
              <span className="text-gray-600">Last Index Check:</span>
              <div className="font-medium">
                {stats.lastIndexCheck 
                  ? stats.lastIndexCheck.toLocaleDateString()
                  : 'Never'
                }
              </div>
            </div>
            <div>
              <span className="text-gray-600">Sitemap URLs:</span>
              <div className="font-medium">
                {stats.sitemapStats?.totalUrls || 0}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Top State:</span>
              <div className="font-medium">
                {stats.indexingStats?.mostIndexedState || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'recent', label: 'Recently Indexed' },
            { key: 'queries', label: 'Top Queries' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clinic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Index Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CTR
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clinics.slice(0, 20).map(clinic => (
                <tr key={clinic.slug}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{clinic.name}</div>
                    <div className="text-sm text-gray-500">{clinic.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {clinic.city}, {clinic.state}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      clinic.indexed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {clinic.indexed ? 'Indexed' : 'Not Indexed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {clinic.indexingMetrics?.clicks || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {clinic.indexingMetrics?.ctr ? `${clinic.indexingMetrics.ctr.toFixed(2)}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'recent' && (
        <div>
          {recentLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading recently indexed clinics...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentClinics.map(clinic => (
                <div key={clinic.slug} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{clinic.name}</h4>
                      <p className="text-sm text-gray-600">{clinic.city}, {clinic.state}</p>
                      <p className="text-xs text-gray-500">Slug: {clinic.slug}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        Indexed {clinic.lastIndexed?.toLocaleDateString()}
                      </div>
                      {clinic.indexingMetrics && (
                        <div className="text-xs text-gray-500 mt-1">
                          {clinic.indexingMetrics.clicks} clicks · {clinic.indexingMetrics.ctr.toFixed(2)}% CTR
                        </div>
                      )}
                    </div>
                  </div>
                  {clinic.indexingMetrics?.queries && clinic.indexingMetrics.queries.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500">Top query:</div>
                      <div className="text-sm text-gray-700 italic">
                        "{clinic.indexingMetrics.queries[0]}"
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {recentClinics.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No recently indexed clinics found
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'queries' && (
        <div>
          <h3 className="text-lg font-medium mb-4">Top Search Queries</h3>
          {summary.topQueries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.topQueries.map((query, index) => (
                <div key={query} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">#{index + 1}</div>
                    <div className="text-sm text-gray-600">"{query}"</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No query data available
            </div>
          )}

          {stats?.indexingStats && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">System Stats</h4>
              <div className="text-sm text-blue-800">
                <p>Most common query: "{stats.indexingStats.mostCommonQuery}"</p>
                <p>Most indexed state: {stats.indexingStats.mostIndexedState}</p>
                <p>Total clicks across all clinics: {stats.indexingStats.totalClicks}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
        <div>
          Showing data for {summary.total} clinics
        </div>
        <div>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}