import React from 'react';
import { AffiliateType } from '../../../lib/models/affiliate';

interface AffiliateFiltersProps {
  filters: {
    type?: AffiliateType;
    isActive?: boolean;
    searchTerm?: string;
  };
  onFilterChange: (filters: {
    type?: AffiliateType;
    isActive?: boolean;
    searchTerm?: string;
  }) => void;
}

const AffiliateFilters: React.FC<AffiliateFiltersProps> = ({ filters, onFilterChange }) => {
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      searchTerm: e.target.value
    });
  };
  
  // Handle type filter change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as AffiliateType | '';
    onFilterChange({
      ...filters,
      type: value === '' ? undefined : value as AffiliateType
    });
  };
  
  // Handle status filter change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    onFilterChange({
      ...filters,
      isActive: value === '' 
        ? undefined
        : value === 'active' 
          ? true 
          : false
    });
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    onFilterChange({});
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
      </div>
      
      <div className="px-4 py-5 sm:p-6 space-y-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search Affiliates
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Name, code, or email"
              value={filters.searchTerm || ''}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        {/* Affiliate Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            id="type"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={filters.type || ''}
            onChange={handleTypeChange}
          >
            <option value="">All Types</option>
            <option value="influencer">Influencer</option>
            <option value="media">Media</option>
            <option value="clinic">Clinic</option>
            <option value="partner">Partner</option>
            <option value="employee">Employee</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={filters.isActive === undefined ? '' : filters.isActive ? 'active' : 'inactive'}
            onChange={handleStatusChange}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        {/* Clear Filters */}
        <div className="pt-2">
          <button
            type="button"
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default AffiliateFilters;