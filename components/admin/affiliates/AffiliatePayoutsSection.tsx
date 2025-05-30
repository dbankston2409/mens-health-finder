import React, { useState } from 'react';
import { Affiliate } from '../../../lib/models/affiliate';
import PayoutsTable from './PayoutsTable';

interface AffiliatePayoutsSectionProps {
  affiliate: Affiliate;
}

const AffiliatePayoutsSection: React.FC<AffiliatePayoutsSectionProps> = ({ affiliate }) => {
  const [period, setPeriod] = useState<'all' | 'current_month' | 'last_month' | 'year_to_date'>('current_month');
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Payout History
            </h3>
            
            <div>
              <label htmlFor="period" className="sr-only">Period</label>
              <select
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="current_month">Current Month</option>
                <option value="last_month">Last Month</option>
                <option value="year_to_date">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <PayoutsTable period={period} affiliateId={affiliate.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliatePayoutsSection;