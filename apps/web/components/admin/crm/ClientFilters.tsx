import React, { useState } from 'react';

interface ClientFiltersProps {
  filters: {
    package?: string;
    status?: string;
    state?: string;
    salesRep?: string;
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
  };
  onFilterChange: (filters: any) => void;
  onSearch: (searchTerm: string) => void;
}

const ClientFilters: React.FC<ClientFiltersProps> = ({
  filters,
  onFilterChange,
  onSearch
}) => {
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.searchTerm || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleClearFilters = () => {
    onFilterChange({
      package: undefined,
      status: undefined,
      state: undefined,
      salesRep: undefined,
      startDate: undefined,
      endDate: undefined,
      searchTerm: undefined
    });
    setSearchInput('');
  };

  // Sample data for dropdowns - in a real app, this would come from API/Firebase
  const packages = ['Free', 'Basic', 'Premium'];
  const statuses = ['Active', 'Trial', 'Paused', 'Canceled'];
  const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
  const salesReps = ['John Smith', 'Emily Johnson', 'Michael Brown', 'Sarah Wilson'];

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, dateType: 'startDate' | 'endDate') => {
    const date = e.target.value ? new Date(e.target.value) : undefined;
    onFilterChange({ [dateType]: date });
  };

  return (
    <div className="p-4 border-b border-[#222222]">
      {/* Search and Basic Filters */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-1/3">
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, city, or state..."
              className="border-gray-700 bg-gray-800 rounded-md w-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button type="submit" className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </form>

        {/* Basic Filters */}
        <div className="flex flex-wrap gap-2">
          <select 
            value={filters.package || ''}
            onChange={(e) => onFilterChange({ package: e.target.value || undefined })}
            className="bg-gray-800 border border-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Packages</option>
            {packages.map(pkg => (
              <option key={pkg} value={pkg}>{pkg}</option>
            ))}
          </select>

          <select 
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value || undefined })}
            className="bg-gray-800 border border-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
            className="bg-gray-800 border border-gray-700 rounded-md py-2 px-3 hover:bg-gray-700 focus:outline-none"
          >
            {isAdvancedFiltersOpen ? 'Hide Filters' : 'More Filters'} 
            <span className="ml-1">
              {isAdvancedFiltersOpen ? '↑' : '↓'}
            </span>
          </button>

          {(filters.package || filters.status || filters.state || filters.salesRep || filters.startDate || filters.endDate || filters.searchTerm) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="bg-red-900 text-red-300 rounded-md py-2 px-3 hover:bg-red-800 focus:outline-none"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {isAdvancedFiltersOpen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-4 bg-[#0A0A0A] rounded-lg border border-[#222222]">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">State</label>
            <select 
              value={filters.state || ''}
              onChange={(e) => onFilterChange({ state: e.target.value || undefined })}
              className="bg-gray-800 border border-gray-700 rounded-md py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Sales Rep</label>
            <select 
              value={filters.salesRep || ''}
              onChange={(e) => onFilterChange({ salesRep: e.target.value || undefined })}
              className="bg-gray-800 border border-gray-700 rounded-md py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Sales Reps</option>
              {salesReps.map(rep => (
                <option key={rep} value={rep}>{rep}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
            <input 
              type="date" 
              value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateChange(e, 'startDate')}
              className="bg-gray-800 border border-gray-700 rounded-md py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
            <input 
              type="date" 
              value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateChange(e, 'endDate')}
              className="bg-gray-800 border border-gray-700 rounded-md py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(filters.package || filters.status || filters.state || filters.salesRep || filters.startDate || filters.endDate || filters.searchTerm) && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-400">Active filters:</span>
          
          {filters.searchTerm && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800">
              Search: {filters.searchTerm}
              <button 
                onClick={() => onFilterChange({ searchTerm: undefined })}
                className="ml-1.5 text-gray-400 hover:text-white"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.package && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800">
              Package: {filters.package}
              <button 
                onClick={() => onFilterChange({ package: undefined })}
                className="ml-1.5 text-gray-400 hover:text-white"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.status && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800">
              Status: {filters.status}
              <button 
                onClick={() => onFilterChange({ status: undefined })}
                className="ml-1.5 text-gray-400 hover:text-white"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.state && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800">
              State: {filters.state}
              <button 
                onClick={() => onFilterChange({ state: undefined })}
                className="ml-1.5 text-gray-400 hover:text-white"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.salesRep && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800">
              Sales Rep: {filters.salesRep}
              <button 
                onClick={() => onFilterChange({ salesRep: undefined })}
                className="ml-1.5 text-gray-400 hover:text-white"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.startDate && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800">
              From: {filters.startDate.toLocaleDateString()}
              <button 
                onClick={() => onFilterChange({ startDate: undefined })}
                className="ml-1.5 text-gray-400 hover:text-white"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.endDate && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800">
              To: {filters.endDate.toLocaleDateString()}
              <button 
                onClick={() => onFilterChange({ endDate: undefined })}
                className="ml-1.5 text-gray-400 hover:text-white"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientFilters;