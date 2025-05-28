import React, { useState, useEffect } from 'react';
import { useLostRevenue, LostClient } from '../../../utils/admin/calculateLostRevenue';
import { fetchLostRevenueData } from '../../../utils/admin/useAdminMetrics';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const LostRevenueWidget: React.FC = () => {
  const [showLostRevenue, setShowLostRevenue] = useState(false);
  const [lostRevenueData, setLostRevenueData] = useState<LostClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    package: '',
    salesRep: '',
    region: ''
  });
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  // Fetch lost revenue data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLostRevenueData();
        setLostRevenueData(data);
      } catch (error) {
        console.error('Error loading lost revenue data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (showLostRevenue) {
      loadData();
    }
  }, [showLostRevenue]);

  // Calculate metrics using the custom hook
  const lostRevenue = useLostRevenue(lostRevenueData, filters);

  // Prepare chart data
  const chartData = {
    labels: lostRevenue.reasons.map(reason => reason.name),
    datasets: [
      {
        data: lostRevenue.reasons.map(reason => reason.amount),
        backgroundColor: lostRevenue.reasons.map(reason => reason.color),
        borderColor: lostRevenue.reasons.map(reason => reason.color),
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== undefined) {
              label += chartType === 'pie' 
                ? formatCurrency(context.parsed) 
                : formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: chartType === 'bar' ? {
      y: {
        ticks: {
          color: '#aaaaaa',
          callback: function(value: any) {
            return formatCurrency(value);
          }
        },
        grid: {
          color: '#333333'
        }
      },
      x: {
        ticks: {
          color: '#aaaaaa'
        },
        grid: {
          color: '#333333'
        }
      }
    } : undefined
  };

  // Filter options
  const packageOptions = ['', 'Premium', 'Basic'];
  const salesRepOptions = ['', 'John Smith', 'Emily Johnson', 'Michael Brown', 'Sarah Wilson'];
  const regionOptions = ['', 'West', 'East', 'South', 'Midwest'];

  if (!showLostRevenue) {
    return (
      <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Lost Revenue Insights</h3>
          <div className="relative inline-block w-12 mr-2 align-middle select-none">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={showLostRevenue}
                onChange={() => setShowLostRevenue(!showLostRevenue)}
              />
              <div className="w-11 h-6 bg-[#333333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-[#111111] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
        <div className="text-center py-10 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg mb-2">Enable Lost Revenue Tracking</p>
          <p className="text-sm max-w-md mx-auto">
            Toggle this feature to view detailed insights about lost revenue from canceled subscriptions, failed payments, and missed trials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Lost Revenue Insights</h3>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button 
              className={`p-1 rounded ${chartType === 'pie' ? 'bg-primary bg-opacity-20 text-primary' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setChartType('pie')}
              title="Pie Chart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </button>
            <button 
              className={`p-1 rounded ${chartType === 'bar' ? 'bg-primary bg-opacity-20 text-primary' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setChartType('bar')}
              title="Bar Chart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
          <div className="relative inline-block w-12 mr-2 align-middle select-none">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={showLostRevenue}
                onChange={() => setShowLostRevenue(!showLostRevenue)}
              />
              <div className="w-11 h-6 bg-[#333333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-[#111111] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
              <h4 className="text-sm text-gray-400 mb-1">Total Lost Revenue</h4>
              <p className="text-2xl font-bold">{formatCurrency(lostRevenue.totalLost)}</p>
            </div>
            <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
              <h4 className="text-sm text-gray-400 mb-1">Lost This Month</h4>
              <p className="text-2xl font-bold">{formatCurrency(lostRevenue.lostThisMonth)}</p>
            </div>
            <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
              <h4 className="text-sm text-gray-400 mb-1">Lost This Year</h4>
              <p className="text-2xl font-bold">{formatCurrency(lostRevenue.lostThisYear)}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="md:w-2/3 bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
              <div className="h-64">
                {chartType === 'pie' ? (
                  <Pie data={chartData} options={chartOptions} />
                ) : (
                  <Bar data={chartData} options={chartOptions} />
                )}
              </div>
            </div>
            <div className="md:w-1/3 bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
              <h4 className="text-sm font-medium mb-4">Filters</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Package</label>
                  <select
                    className="w-full bg-[#111111] border border-[#333333] rounded-md px-3 py-2 text-sm"
                    value={filters.package}
                    onChange={(e) => setFilters({...filters, package: e.target.value})}
                  >
                    {packageOptions.map(option => (
                      <option key={option} value={option}>{option || 'All Packages'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sales Rep</label>
                  <select
                    className="w-full bg-[#111111] border border-[#333333] rounded-md px-3 py-2 text-sm"
                    value={filters.salesRep}
                    onChange={(e) => setFilters({...filters, salesRep: e.target.value})}
                  >
                    {salesRepOptions.map(option => (
                      <option key={option} value={option}>{option || 'All Reps'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Region</label>
                  <select
                    className="w-full bg-[#111111] border border-[#333333] rounded-md px-3 py-2 text-sm"
                    value={filters.region}
                    onChange={(e) => setFilters({...filters, region: e.target.value})}
                  >
                    {regionOptions.map(option => (
                      <option key={option} value={option}>{option || 'All Regions'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0A0A0A] rounded-lg border border-[#222222] overflow-hidden">
            <table className="min-w-full divide-y divide-[#222222]">
              <thead className="bg-[#111111]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Clinic Name</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reason</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {lostRevenue.clients.map((client) => (
                  <tr key={client.id} className="hover:bg-[#151515]">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium">{client.clinicName}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm">{formatCurrency(client.amount)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span 
                        className={`px-2 py-1 text-xs rounded-full ${
                          client.reason === 'Canceled' ? 'bg-red-900 text-red-200' :
                          client.reason === 'Failed Payment' ? 'bg-yellow-900 text-yellow-200' :
                          client.reason === 'Downgrade' ? 'bg-blue-900 text-blue-200' :
                          'bg-purple-900 text-purple-200'
                        }`}
                      >
                        {client.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-400">{client.date}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button 
                        className="text-primary hover:text-primary-dark text-sm font-medium"
                      >
                        Reactivate
                      </button>
                    </td>
                  </tr>
                ))}
                {lostRevenue.clients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No lost revenue data available for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default LostRevenueWidget;