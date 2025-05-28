import React, { useState } from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';

type FilterOptions = {
  packageTiers: string[];
  statuses: string[];
  states: string[];
  cities: Record<string, string[]>;
  tags: string[];
};

type Filters = {
  packageTier: string[];
  status: string[];
  state: string;
  city: string;
  tags: string[];
  minClicks: number | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
};

interface ClientFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Filters) => void;
  filterOptions: FilterOptions;
  initialFilters: Filters;
}

const ClientFilters: React.FC<ClientFiltersProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  filterOptions,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const handleTogglePackageTier = (tier: string) => {
    setFilters(prev => {
      if (prev.packageTier.includes(tier)) {
        return { ...prev, packageTier: prev.packageTier.filter(t => t !== tier) };
      } else {
        return { ...prev, packageTier: [...prev.packageTier, tier] };
      }
    });
  };

  const handleToggleStatus = (status: string) => {
    setFilters(prev => {
      if (prev.status.includes(status)) {
        return { ...prev, status: prev.status.filter(s => s !== status) };
      } else {
        return { ...prev, status: [...prev.status, status] };
      }
    });
  };

  const handleToggleTag = (tag: string) => {
    setFilters(prev => {
      if (prev.tags.includes(tag)) {
        return { ...prev, tags: prev.tags.filter(t => t !== tag) };
      } else {
        return { ...prev, tags: [...prev.tags, tag] };
      }
    });
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ 
      ...prev, 
      state: e.target.value,
      city: '' // Reset city when state changes
    }));
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, city: e.target.value }));
  };

  const handleMinClicksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : null;
    setFilters(prev => ({ ...prev, minClicks: value }));
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value ? new Date(value) : null
      }
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      packageTier: [],
      status: [],
      state: '',
      city: '',
      tags: [],
      minClicks: null,
      dateRange: {
        start: null,
        end: null
      }
    });
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end">
      <div className="h-full bg-white w-80 shadow-xl overflow-y-auto animate-slide-in-right">
        <div className="p-4 border-b flex justify-between items-center bg-neutral-50">
          <h3 className="text-lg font-medium">Filter Clinics</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Package Tier Filters */}
          <div>
            <h4 className="font-medium mb-2">Package Tier</h4>
            <div className="flex flex-wrap gap-2">
              {filterOptions.packageTiers.map(tier => (
                <button
                  key={tier}
                  onClick={() => handleTogglePackageTier(tier)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.packageTier.includes(tier)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filters */}
          <div>
            <h4 className="font-medium mb-2">Status</h4>
            <div className="flex flex-wrap gap-2">
              {filterOptions.statuses.map(status => (
                <button
                  key={status}
                  onClick={() => handleToggleStatus(status)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.status.includes(status)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Location Filters */}
          <div>
            <h4 className="font-medium mb-2">Location</h4>
            <div className="space-y-2">
              <select
                value={filters.state}
                onChange={handleStateChange}
                className="w-full p-2 border rounded-md bg-white"
              >
                <option value="">Select State</option>
                {filterOptions.states.map(state => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>

              {filters.state && (
                <select
                  value={filters.city}
                  onChange={handleCityChange}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  <option value="">All Cities</option>
                  {filterOptions.cities[filters.state]?.map(city => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h4 className="font-medium mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {filterOptions.tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.tags.includes(tag)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Traffic Metrics */}
          <div>
            <h4 className="font-medium mb-2">Traffic Metrics</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Minimum Clicks (Last 30 Days)
                </label>
                <input
                  type="number"
                  value={filters.minClicks || ''}
                  onChange={handleMinClicksChange}
                  min="0"
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g. 10"
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <h4 className="font-medium mb-2">Date Added</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-neutral-50 space-x-2 flex">
          <button
            onClick={handleClearFilters}
            className="flex-1 py-2 px-4 bg-white text-gray-700 rounded-md border hover:bg-gray-50"
          >
            Clear All
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientFilters;