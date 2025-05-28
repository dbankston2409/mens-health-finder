import React from 'react';
import { useAdminMetrics } from '../../../utils/admin/useAdminMetrics';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Title, Tooltip, Legend);

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const SalesRevenueSnapshot: React.FC = () => {
  const { revenue, signups, plans, loading, error } = useAdminMetrics();

  // Prepare chart data for plan breakdown
  const planData = {
    labels: ['Free Tier', 'Basic Tier', 'Premium Tier'],
    datasets: [
      {
        data: [plans.freeTier, plans.basicTier, plans.premiumTier],
        backgroundColor: [
          'rgba(107, 114, 128, 0.8)', // Gray for Free
          'rgba(59, 130, 246, 0.8)',  // Blue for Basic
          'rgba(239, 68, 68, 0.8)'    // Red for Premium
        ],
        borderColor: [
          'rgba(107, 114, 128, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl h-full">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl h-full">
        <div className="text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Sales & Revenue</h3>
        <div>
          <button className="text-sm text-gray-400 hover:text-white transition">
            <span className="flex items-center">
              <span>This Month</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
              <div className="flex items-center mb-2">
                <div className="mr-2">
                  <div className="p-2 bg-primary bg-opacity-20 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-sm text-gray-400">MRR</h4>
                <div className="ml-auto">
                  <div className="flex items-center text-emerald-500 text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {revenue.growth}%
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(revenue.mrr)}</p>
            </div>
            <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
              <div className="flex items-center mb-2">
                <div className="mr-2">
                  <div className="p-2 bg-indigo-500 bg-opacity-20 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-sm text-gray-400">ARR</h4>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(revenue.arr)}</p>
            </div>
            <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
              <div className="flex items-center mb-2">
                <div className="mr-2">
                  <div className="p-2 bg-emerald-500 bg-opacity-20 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-sm text-gray-400">Today</h4>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(revenue.totalToday)}</p>
            </div>
            <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
              <div className="flex items-center mb-2">
                <div className="mr-2">
                  <div className="p-2 bg-yellow-500 bg-opacity-20 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-sm text-gray-400">7-Day Signups</h4>
              </div>
              <p className="text-2xl font-bold">{signups.last7Days}</p>
            </div>
          </div>

          <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
            <h4 className="text-sm font-medium mb-4">New Signups</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xl font-bold mb-1">{signups.last7Days}</p>
                <p className="text-xs text-gray-400">7 Days</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold mb-1">{signups.last30Days}</p>
                <p className="text-xs text-gray-400">30 Days</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold mb-1">{signups.last90Days}</p>
                <p className="text-xs text-gray-400">90 Days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
          <h4 className="text-sm font-medium mb-4">Package Distribution</h4>
          <div className="h-64 relative">
            <Doughnut data={planData} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <p className="text-3xl font-bold">{plans.freeTier + plans.basicTier + plans.premiumTier}</p>
              <p className="text-xs text-gray-400">Total Clinics</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-md font-medium">{plans.freeTier}</p>
              <p className="text-xs text-gray-400">Free</p>
            </div>
            <div className="text-center">
              <p className="text-md font-medium">{plans.basicTier}</p>
              <p className="text-xs text-gray-400">Basic</p>
            </div>
            <div className="text-center">
              <p className="text-md font-medium">{plans.premiumTier}</p>
              <p className="text-xs text-gray-400">Premium</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesRevenueSnapshot;