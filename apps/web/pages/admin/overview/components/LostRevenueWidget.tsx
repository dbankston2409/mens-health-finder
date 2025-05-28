import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ArrowPathIcon, ExclamationTriangleIcon, BanknotesIcon } from '@heroicons/react/24/solid';
import { LostRevenueMetrics, LostRevenueEvent } from '../../../../utils/metrics/types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface LostRevenueWidgetProps {
  data: LostRevenueMetrics | null;
  loading: boolean;
  onRefresh: () => void;
}

const LostRevenueWidget: React.FC<LostRevenueWidgetProps> = ({ data, loading, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Prepare chart data from breakdown
  const getChartData = () => {
    if (!data?.breakdownByReason) return [];
    
    return Object.entries(data.breakdownByReason).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
      value
    }));
  };

  // Filter the raw events
  const getFilteredEvents = () => {
    if (!data?.rawEvents) return [];
    
    if (selectedFilter === 'all') return data.rawEvents;
    
    return data.rawEvents.filter(event => event.reason === selectedFilter);
  };

  // Colors for the pie chart
  const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#6366F1'];
  
  // Get color by reason
  const getReasonColor = (reason: string) => {
    const index = Object.keys(data?.breakdownByReason || {}).indexOf(reason);
    return index >= 0 ? COLORS[index % COLORS.length] : '#9CA3AF';
  };

  const chartData = getChartData();
  const filteredEvents = getFilteredEvents();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lost Revenue</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={onRefresh}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Refresh data"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      ) : !data ? (
        <div className="py-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Failed to load lost revenue data. Try refreshing.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Values */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 border border-red-100 dark:border-red-800">
              <div className="flex items-center">
                <BanknotesIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Lost This Month</span>
              </div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {formatCurrency(data.lostThisMonth)}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Lost This Year</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {formatCurrency(data.lostThisYear)}
              </div>
            </div>
          </div>
          
          {/* Expanded Content */}
          {expanded && (
            <div className="mt-6 space-y-6">
              {/* Chart Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Lost Revenue by Reason</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Bar Chart */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
                        <YAxis tick={{ fill: '#6B7280' }} />
                        <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar dataKey="value" fill="#EF4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Events Table Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Lost Revenue Events</h3>
                  
                  <div>
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="all">All Reasons</option>
                      {Object.keys(data.breakdownByReason).map(reason => (
                        <option key={reason} value={reason}>{reason.charAt(0).toUpperCase() + reason.slice(1).replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">No lost revenue events to display</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Clinic
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Reason
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredEvents.slice(0, 10).map((event) => (
                          <tr key={event.clinicId + event.date.seconds} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {event.clinicName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatCurrency(event.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span 
                                className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                                style={{ backgroundColor: `${getReasonColor(event.reason)}20`, color: getReasonColor(event.reason) }}
                              >
                                {event.reason.charAt(0).toUpperCase() + event.reason.slice(1).replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(event.date.toDate())}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {event.reason === "canceled" && (
                                <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                  Reactivate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LostRevenueWidget;