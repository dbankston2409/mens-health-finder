import React from 'react';
import { useClinicTrafficReport } from '../../../utils/hooks/useClinicTrafficReport';
import { CallMetricsOverlay } from './CallMetricsOverlay';
import { ClinicKeywordCard } from './ClinicKeywordCard';
import { useSeoMeta } from '../../../apps/web/utils/hooks/useSeoMeta';

interface PrintableSEOReportProps {
  clinicId: string;
  clinicName: string;
  reportPeriod?: {
    startDate: Date;
    endDate: Date;
  };
}

export function PrintableSEOReport({ clinicId, clinicName, reportPeriod }: PrintableSEOReportProps) {
  const { data: trafficData, loading: trafficLoading } = useClinicTrafficReport(clinicId);
  const { seoMeta, loading: seoLoading } = useSeoMeta(clinicId);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const period = reportPeriod || {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  };

  if (trafficLoading || seoLoading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-2/3"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black print:text-black">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { font-size: 12px; }
          .chart-container { height: 300px !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-8 print:p-6">
        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                SEO & Traffic Report
              </h1>
              <h2 className="text-xl text-gray-700 mb-4">{clinicName}</h2>
              <div className="text-sm text-gray-600">
                Report Period: {formatDate(period.startDate)} - {formatDate(period.endDate)}
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>Generated: {formatDate(new Date())}</div>
              <div className="mt-2">
                <img 
                  src="/Men_s-Health-Finder-LOGO-White.png" 
                  alt="MHF Logo" 
                  className="h-12 w-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="border border-gray-300 rounded p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {trafficData?.totalClicks || 0}
              </div>
              <div className="text-sm text-gray-600">Total Clicks</div>
            </div>
            <div className="border border-gray-300 rounded p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {trafficData?.uniqueVisitors || 0}
              </div>
              <div className="text-sm text-gray-600">Unique Visitors</div>
            </div>
            <div className="border border-gray-300 rounded p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {trafficData?.callClicks || 0}
              </div>
              <div className="text-sm text-gray-600">Call Clicks</div>
            </div>
            <div className="border border-gray-300 rounded p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {trafficData?.deviceBreakdown?.mobile || 0}%
              </div>
              <div className="text-sm text-gray-600">Mobile Traffic</div>
            </div>
          </div>
        </div>

        {/* SEO Metadata Preview */}
        {seoMeta && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Metadata</h3>
            <div className="border border-gray-300 rounded p-6">
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700">Title Tag:</label>
                <div className="text-blue-600 underline mt-1">{seoMeta.title}</div>
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700">Meta Description:</label>
                <div className="text-gray-600 mt-1">{seoMeta.description}</div>
              </div>
              {seoMeta.keywords && seoMeta.keywords.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Keywords:</label>
                  <div className="mt-1">
                    {seoMeta.keywords.map((keyword, index) => (
                      <span 
                        key={keyword}
                        className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-2 mb-1"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Device Breakdown */}
        {trafficData && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Device Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mobile</span>
                    <span className="font-medium">{trafficData.deviceBreakdown?.mobile || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${trafficData.deviceBreakdown?.mobile || 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Desktop</span>
                    <span className="font-medium">{trafficData.deviceBreakdown?.desktop || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${trafficData.deviceBreakdown?.desktop || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Top Actions</h4>
                <div className="space-y-2">
                  {trafficData.actions?.slice(0, 4).map((action, index) => (
                    <div key={action.type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{action.type}</span>
                      <span className="font-medium">{action.count} clicks</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Break for Print */}
        <div className="print-break"></div>

        {/* Call Analytics */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Analytics</h3>
          <div className="chart-container">
            <CallMetricsOverlay clinicId={clinicId} showTitle={false} compact={true} />
          </div>
        </div>

        {/* Top Search Terms */}
        {trafficData?.searchTerms && trafficData.searchTerms.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Search Terms</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Search Term
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Clicks
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                      CTR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trafficData.searchTerms.slice(0, 10).map((term, index) => (
                    <tr key={term.term} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        {term.term}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        {term.clicks}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        {term.ctr?.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEO Content Preview */}
        {seoMeta?.content && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Content Preview</h3>
            <div className="border border-gray-300 rounded p-6 bg-gray-50">
              <div 
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: seoMeta.content.slice(0, 500) + '...' }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-300 pt-6 mt-8 text-center text-sm text-gray-600">
          <div>
            Generated by Men's Health Finder Analytics Platform
          </div>
          <div className="mt-2">
            Report ID: MHF-{clinicId}-{Date.now().toString().slice(-6)}
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="no-print fixed bottom-6 right-6">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          Print Report
        </button>
      </div>
    </div>
  );
}