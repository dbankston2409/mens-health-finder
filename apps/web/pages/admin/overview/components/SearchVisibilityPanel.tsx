import React from 'react';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  CursorArrowRaysIcon
} from '@heroicons/react/24/solid';
import { SearchVisibilityMetrics } from '../../../../utils/metrics/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface SearchVisibilityPanelProps {
  data: SearchVisibilityMetrics | null;
  loading: boolean;
  onRefresh: () => void;
}

const SearchVisibilityPanel: React.FC<SearchVisibilityPanelProps> = ({ data, loading, onRefresh }) => {
  // Format data for the search terms chart
  const getSearchTermsData = () => {
    if (!data?.topSearchTerms) return [];
    
    return data.topSearchTerms.map(item => ({
      name: item.term.length > 15 ? item.term.substring(0, 15) + '...' : item.term,
      count: item.count,
      fullTerm: item.term
    }));
  };

  // Format data for the cities chart
  const getCitiesData = () => {
    if (!data?.topCitiesSearched) return [];
    
    return data.topCitiesSearched.map(item => ({
      name: item.city.length > 12 ? item.city.substring(0, 12) + '...' : item.city,
      count: item.count,
      fullCity: item.city
    }));
  };

  // Format data for the services pie chart
  const getServicesData = () => {
    if (!data?.topServices) return [];
    
    return data.topServices.map(item => ({
      name: item.service,
      value: item.count
    }));
  };

  const searchTermsData = getSearchTermsData();
  const citiesData = getCitiesData();
  const servicesData = getServicesData();
  
  // Colors for the pie chart
  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#6366F1'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <MagnifyingGlassIcon className="h-6 w-6 text-indigo-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Search Visibility</h2>
        </div>
        
        <button 
          onClick={onRefresh}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          title="Refresh data"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>
      
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      ) : !data ? (
        <div className="py-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Failed to load search visibility data. Try refreshing.
          </p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
              <div className="text-sm text-indigo-700 dark:text-indigo-300 mb-1">
                Total Search Impressions
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {data.totalSearchImpressions.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <CursorArrowRaysIcon className="h-4 w-4 mr-1" />
                <span>Click-Through Rate</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {(data.averageClicksPerSearch * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span>Top City</span>
              </div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {data.topCitiesSearched && data.topCitiesSearched.length > 0 
                  ? data.topCitiesSearched[0].city
                  : 'N/A'}
              </div>
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {/* Top Search Terms */}
            <div>
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">Top Search Terms</h3>
              
              {searchTermsData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={searchTermsData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" tick={{ fill: '#6B7280' }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fill: '#6B7280' }}
                        width={100}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [`${value} searches`, '']}
                        labelFormatter={(label) => searchTermsData.find(item => item.name === label)?.fullTerm || label}
                        contentStyle={{ 
                          backgroundColor: '#1F2937',
                          borderColor: '#374151',
                          color: '#F9FAFB'
                        }}
                      />
                      <Bar dataKey="count" name="Searches" fill="#6366F1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">No search terms data available</p>
                </div>
              )}
            </div>
            
            {/* Top Cities */}
            <div>
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">Top Cities</h3>
              
              {citiesData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={citiesData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" tick={{ fill: '#6B7280' }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fill: '#6B7280' }}
                        width={80}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [`${value} searches`, '']}
                        labelFormatter={(label) => citiesData.find(item => item.name === label)?.fullCity || label}
                        contentStyle={{ 
                          backgroundColor: '#1F2937',
                          borderColor: '#374151',
                          color: '#F9FAFB'
                        }}
                      />
                      <Bar dataKey="count" name="Searches" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">No city data available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Services Pie Chart (If Available) */}
          {servicesData.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">Top Services</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={servicesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {servicesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => [`${value} searches`, '']}
                      contentStyle={{ 
                        backgroundColor: '#1F2937',
                        borderColor: '#374151',
                        color: '#F9FAFB'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {/* External links */}
          <div className="mt-6 flex justify-end">
            <button 
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => window.open('https://search.google.com/search-console', '_blank')}
            >
              View in Search Console
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchVisibilityPanel;