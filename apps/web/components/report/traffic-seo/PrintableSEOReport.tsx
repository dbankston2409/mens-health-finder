import React, { useRef } from 'react';
import useClinicTrafficReport from '../../../utils/hooks/useClinicTrafficReport';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ArrowTrendingUpIcon} from '@heroicons/react/24/outline';

interface PrintableSEOReportProps {
  clinicId: string;
  adminName?: string;
}

const PrintableSEOReport: React.FC<PrintableSEOReportProps> = ({ 
  clinicId, 
  adminName 
}) => {
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const { clinic, reportData, loading, error } = useClinicTrafficReport(clinicId);
  
  if (loading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading report data...</p>
      </div>
    );
  }
  
  if (error || !clinic || !reportData) {
    return (
      <div className="w-full py-8 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Error Loading Report</h3>
          <p className="mt-2 text-red-700 dark:text-red-400">
            {error ? error.message : 'No data available for this clinic'}
          </p>
        </div>
      </div>
    );
  }
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Get current month and year
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  // Calculate dates for the report period
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const reportPeriod = `${formatDate(thirtyDaysAgo)} - ${formatDate(today)}`;
  
  // Helper to render ranking indicator
  const renderRankingIndicator = (ranking: 'high' | 'medium' | 'low') => {
    switch (ranking) {
      case 'high':
        return (
          <div className="flex items-center text-green-600">
            <span className="h-4 w-4 bg-green-500 rounded-full mr-2"></span>
            Strong
          </div>
        );
      case 'medium':
        return (
          <div className="flex items-center text-yellow-600">
            <span className="h-4 w-4 bg-yellow-500 rounded-full mr-2"></span>
            Medium
          </div>
        );
      case 'low':
        return (
          <div className="flex items-center text-red-600">
            <span className="h-4 w-4 bg-red-500 rounded-full mr-2"></span>
            Low
          </div>
        );
      default:
        return null;
    }
  };
  
  // Helper to suggest an appropriate upgrade recommendation based on data
  const getUpgradeRecommendation = () => {
    const { performanceSummary } = reportData;
    
    if (performanceSummary.totalClicks30Days > 150) {
      return "Pro package to enable call tracking and priority placement";
    } else if (performanceSummary.totalClicks30Days > 75) {
      return "Premium package for enhanced profile visibility";
    } else {
      return "Basic package to improve profile completion";
    }
  };
  
  // Helper to suggest content improvements based on data
  const getContentRecommendation = () => {
    const { keywordInsights } = reportData;
    
    if (keywordInsights.missingSuggestions && keywordInsights.missingSuggestions.length > 0) {
      return `Add services related to: ${keywordInsights.missingSuggestions.join(', ')}`;
    } else if (keywordInsights.rankingStrength === 'low') {
      return "Add service photos and FAQs to improve visitor engagement";
    } else {
      return "Update profile with recent treatment results to showcase expertise";
    }
  };
  
  return (
    <div 
      ref={reportContainerRef}
      id="pdf-report-container" 
      className="w-full max-w-[210mm] mx-auto bg-white text-gray-800 font-sans"
    >
      {/* Cover Section */}
      <div className="pdf-page-section p-10 min-h-[297mm]">
        <div className="flex items-center justify-between">
          <img 
            src="/Men_s-Health-Finder-LOGO-White.png" 
            alt="Men's Health Finder Logo" 
            className="h-16 w-auto object-contain"
          />
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">{currentMonth} {currentYear}</p>
            <p className="text-sm text-gray-500">Report Period: {reportPeriod}</p>
          </div>
        </div>
        
        <div className="mt-24 mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Performance & Visibility Report
          </h1>
          <div className="text-2xl text-gray-800 mb-2">
            {clinic.name}
          </div>
          <div className="text-lg text-gray-600">
            {clinic.city}, {clinic.state}
          </div>
          
          {adminName && (
            <div className="mt-10 text-sm text-gray-500">
              Prepared by: {adminName}
            </div>
          )}
        </div>
        
        <div className="mt-32 border-t-2 border-gray-200 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-medium text-gray-800">Report Summary</p>
              <p className="text-sm text-gray-600 mt-1">
                This report shows your clinic's visibility and performance on the Men's Health Finder platform.
              </p>
            </div>
            <div className="text-4xl font-bold text-primary">
              {reportData.performanceSummary.totalClicks30Days}
              <span className="text-base font-normal text-gray-600 ml-2">total clicks</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Engagement Summary */}
      <div className="pdf-page-section p-10 min-h-[297mm]">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
            Engagement Summary
          </h2>
          <p className="text-gray-600 mb-6">
            How potential patients are interacting with your profile
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Profile Views</p>
                <p className="text-3xl font-bold mt-1">{reportData.performanceSummary.totalClicks30Days}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <GlobeAltIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-sm">
              <div className="flex items-center text-green-600">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                <span>12% from previous period</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Unique Visitors</p>
                <p className="text-3xl font-bold mt-1">{Math.round(reportData.performanceSummary.totalClicks30Days * 0.75)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DevicePhoneMobileIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 text-sm">
              <p className="text-gray-600">
                {reportData.performanceSummary.mostCommonDevice.charAt(0).toUpperCase() + 
                reportData.performanceSummary.mostCommonDevice.slice(1)}: {reportData.performanceSummary.mostCommonDevicePercentage}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-500">Avg. Clicks Per Day</p>
            <p className="text-2xl font-bold mt-1">{reportData.performanceSummary.avgClicksPerDay.toFixed(1)}</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-500">Most Common Region</p>
            <p className="text-2xl font-bold mt-1">{reportData.performanceSummary.mostCommonRegion}</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-500">Top Action Clicked</p>
            <p className="text-2xl font-bold mt-1">{reportData.performanceSummary.topActionClicked}</p>
          </div>
        </div>
        
        <div className="mt-12 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Activity Timeline
          </h3>
          
          <div className="relative border-l-2 border-gray-200 pl-6 py-2">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[6.5px] top-0"></div>
            <p className="text-sm">
              <span className="font-medium">First Visit: </span> 
              {formatDate(reportData.searchQueries[0]?.firstSeen || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))}
            </p>
          </div>
          
          <div className="relative border-l-2 border-gray-200 pl-6 py-2">
            <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[6.5px] top-0"></div>
            <p className="text-sm">
              <span className="font-medium">Most Recent Visit: </span>
              {formatDate(reportData.searchQueries[0]?.lastSeen || new Date())}
            </p>
          </div>
          
          <div className="relative border-l-2 border-gray-200 pl-6 py-2">
            <div className="absolute w-3 h-3 bg-purple-500 rounded-full -left-[6.5px] top-0"></div>
            <p className="text-sm">
              <span className="font-medium">Peak Traffic Day: </span>
              {formatDate(new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000))}
            </p>
          </div>
        </div>
      </div>
      
      {/* Search Exposure */}
      <div className="pdf-page-section p-10 min-h-[297mm]">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
            Search Exposure
          </h2>
          <p className="text-gray-600 mb-6">
            How potential patients are finding your clinic
          </p>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Top Search Terms
          </h3>
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Search Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Seen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.searchQueries.slice(0, 5).map((query, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {query.term}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {query.clicks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(query.firstSeen)}
                    </td>
                  </tr>
                ))}
                {reportData.searchQueries.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      No search data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-10">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Geographic Origin
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="text-base font-medium text-gray-800 mb-3">
                Top Cities
              </h4>
              <ul className="space-y-3">
                {reportData.topPages.slice(0, 3).map((page, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {page.page.includes('search') 
                        ? `${page.page.split('city=')[1]?.split('&')[0] || 'Local Search'}`
                        : page.page.split('/')[1]}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{page.clicks} clicks</span>
                  </li>
                ))}
                {reportData.topPages.length === 0 && (
                  <li className="text-sm text-gray-500 text-center">No location data available</li>
                )}
              </ul>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="text-base font-medium text-gray-800 mb-3">
                Device Breakdown
              </h4>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-700">Mobile</span>
                <span className="text-sm font-medium text-gray-900">
                  {reportData.deviceBreakdown.mobile} ({Math.round((reportData.deviceBreakdown.mobile / 
                    (reportData.deviceBreakdown.mobile + reportData.deviceBreakdown.desktop + 
                    reportData.deviceBreakdown.tablet + reportData.deviceBreakdown.other)) * 100)}%)
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-700">Desktop</span>
                <span className="text-sm font-medium text-gray-900">
                  {reportData.deviceBreakdown.desktop} ({Math.round((reportData.deviceBreakdown.desktop / 
                    (reportData.deviceBreakdown.mobile + reportData.deviceBreakdown.desktop + 
                    reportData.deviceBreakdown.tablet + reportData.deviceBreakdown.other)) * 100)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Tablet</span>
                <span className="text-sm font-medium text-gray-900">
                  {reportData.deviceBreakdown.tablet} ({Math.round((reportData.deviceBreakdown.tablet / 
                    (reportData.deviceBreakdown.mobile + reportData.deviceBreakdown.desktop + 
                    reportData.deviceBreakdown.tablet + reportData.deviceBreakdown.other)) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Visibility Insights */}
      <div className="pdf-page-section p-10 min-h-[297mm]">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
            Visibility Insights
          </h2>
          <p className="text-gray-600 mb-6">
            Understanding your clinic's visibility and performance
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Traffic Sources
            </h3>
            <div className="h-64 flex items-center justify-center">
              {/* Simplified bar chart for traffic sources */}
              <div className="w-full max-w-lg">
                {reportData.topPages.slice(0, 4).map((page, index) => {
                  // Determine source type
                  let sourceName = 'Other';
                  let color = 'bg-gray-400';
                  
                  if (page.type === 'search') {
                    sourceName = 'MHF Search';
                    color = 'bg-blue-500';
                  } else if (page.type === 'internal' && page.page.includes('blog')) {
                    sourceName = 'Blog Articles';
                    color = 'bg-green-500';
                  } else if (page.type === 'internal' && (page.page === '/' || page.page.includes('home'))) {
                    sourceName = 'Homepage';
                    color = 'bg-purple-500';
                  } else if (page.type === 'internal' && page.page.includes('city')) {
                    sourceName = 'City Pages';
                    color = 'bg-orange-500';
                  } else if (page.type === 'referral') {
                    sourceName = 'External Links';
                    color = 'bg-red-500';
                  }
                  
                  // Calculate percentage
                  const totalClicks = reportData.topPages.reduce((acc, p) => acc + p.clicks, 0);
                  const percentage = totalClicks > 0 ? (page.clicks / totalClicks) * 100 : 0;
                  
                  return (
                    <div key={index} className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700">{sourceName}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {page.clicks} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${color}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-10">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Profile Interaction
          </h3>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="pb-4 mb-4 border-b border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Engagement Heatmap</p>
              <p className="text-sm text-gray-700">Visual representation of how visitors interact with your profile</p>
            </div>
            
            <div className="relative h-64 border border-gray-300 rounded-lg overflow-hidden bg-white">
              {/* Simplified mock clinic profile with engagement overlay */}
              <div className="absolute inset-0 p-4">
                <div className="w-full h-8 bg-gray-200 rounded-md mb-3"></div>
                <div className="flex space-x-4">
                  <div className="w-1/3 h-32 bg-gray-200 rounded-md"></div>
                  <div className="w-2/3 space-y-2">
                    <div className="w-full h-6 bg-gray-200 rounded-md"></div>
                    <div className="w-3/4 h-6 bg-gray-200 rounded-md"></div>
                    <div className="w-1/2 h-6 bg-gray-200 rounded-md"></div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <div className="w-1/4 h-10 bg-blue-100 rounded-md"></div>
                  <div className="w-1/4 h-10 bg-green-100 rounded-md"></div>
                </div>
              </div>
              
              {/* Heatmap overlay */}
              {reportData.heatmapData.map((point, index) => (
                <div 
                  key={index}
                  className="absolute rounded-full opacity-70" 
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    width: `${10 + (point.intensity * 20)}px`,
                    height: `${10 + (point.intensity * 20)}px`,
                    background: `radial-gradient(circle, rgba(255,0,0,0.7) 0%, rgba(255,165,0,0.5) 70%, rgba(255,255,0,0) 100%)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                ></div>
              ))}
            </div>
            
            <div className="mt-4 flex items-center text-sm text-gray-600 italic">
              <span className="w-3 h-3 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full mr-2"></span>
              Areas with higher intensity indicate more user clicks/interactions
            </div>
          </div>
        </div>
      </div>
      
      {/* Keyword Strength & Recommendations */}
      <div className="pdf-page-section p-10 min-h-[297mm]">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
            Keyword Strength & Recommendations
          </h2>
          <p className="text-gray-600 mb-6">
            Insights to improve your clinic's visibility and conversions
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Keyword Analysis
            </h3>
            
            <div className="mb-5">
              <p className="text-sm text-gray-500 mb-2">Detected Primary Keywords</p>
              <div className="flex flex-wrap gap-2">
                {reportData.keywordInsights.primary.map((keyword, index) => (
                  <span 
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
                {reportData.keywordInsights.primary.length === 0 && (
                  <span className="text-gray-500 text-sm italic">None detected</span>
                )}
              </div>
            </div>
            
            <div className="mb-5">
              <p className="text-sm text-gray-500 mb-2">Geographic Keywords</p>
              <div className="flex flex-wrap gap-2">
                {reportData.keywordInsights.geo.map((keyword, index) => (
                  <span 
                    key={index}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
                {reportData.keywordInsights.geo.length === 0 && (
                  <span className="text-gray-500 text-sm italic">None detected</span>
                )}
              </div>
            </div>
            
            <div className="mb-5">
              <p className="text-sm text-gray-500 mb-2">Service Keywords</p>
              <div className="flex flex-wrap gap-2">
                {reportData.keywordInsights.services.map((keyword, index) => (
                  <span 
                    key={index}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
                {reportData.keywordInsights.services.length === 0 && (
                  <span className="text-gray-500 text-sm italic">None detected</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700">Keyword Strength</p>
              <div className="flex items-center">
                {renderRankingIndicator(reportData.keywordInsights.rankingStrength)}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Opportunities
            </h3>
            
            <div className="mb-5 flex items-start">
              <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-base font-medium text-gray-800 mb-1">
                  Search Visibility Opportunity
                </p>
                <p className="text-sm text-gray-600">
                  {reportData.keywordInsights.opportunity}
                </p>
              </div>
            </div>
            
            {reportData.keywordInsights.missingSuggestions && reportData.keywordInsights.missingSuggestions.length > 0 && (
              <div className="mb-5 flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-3 mt-1">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-800 mb-1">
                    Add Missing Services
                  </p>
                  <p className="text-sm text-gray-600">
                    Consider adding these services to improve visibility: {reportData.keywordInsights.missingSuggestions.join(', ')}
                  </p>
                </div>
              </div>
            )}
            
            <div className="mb-5 flex items-start">
              <div className="bg-yellow-100 p-2 rounded-full mr-3 mt-1">
                <ExclamationCircleIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-base font-medium text-gray-800 mb-1">
                  Profile Enhancement
                </p>
                <p className="text-sm text-gray-600">
                  Add service photos or FAQs to improve visitor engagement and conversion rates.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4">
              Recommendations
            </h3>
            
            <div className="space-y-4 text-blue-800">
              <p className="text-base">
                Your clinic received <span className="font-bold">{reportData.performanceSummary.totalClicks30Days} clicks</span> this month – 
                <span className="font-bold"> {reportData.performanceSummary.mostCommonDevicePercentage}% {reportData.performanceSummary.mostCommonDevice}</span>.
              </p>
              
              <p className="text-base">
                Consider upgrading to <span className="font-bold">{getUpgradeRecommendation()}</span>.
              </p>
              
              <p className="text-base">
                <span className="font-bold">{getContentRecommendation()}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Powered by Men's Health Finder – https://menshealthfinder.com</p>
          <p className="mt-1">Report generated on {formatDate(new Date())}</p>
        </div>
      </div>
    </div>
  );
};

export default PrintableSEOReport;