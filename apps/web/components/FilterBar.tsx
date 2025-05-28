import React, { useState, useEffect, useRef } from 'react';

interface FilterBarProps {
  filters: {
    services: string[];
    tiers: string[];
    states: string[];
    verifiedOnly: boolean;
  };
  onFiltersChange: (filters: any) => void;
  totalResults: number;
  isSticky?: boolean;
}

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

const SERVICE_OPTIONS: FilterOption[] = [
  { id: 'trt', label: 'TRT', count: 45 },
  { id: 'ed-treatment', label: 'ED Treatment', count: 38 },
  { id: 'hair-loss', label: 'Hair Loss', count: 32 },
  { id: 'weight-loss', label: 'Weight Loss', count: 28 },
  { id: 'peptide-therapy', label: 'Peptide Therapy', count: 24 },
  { id: 'iv-therapy', label: 'IV Therapy', count: 19 },
  { id: 'hormone-therapy', label: 'Hormone Therapy', count: 35 },
  { id: 'wellness', label: 'Wellness', count: 42 },
  { id: 'cryotherapy', label: 'Cryotherapy', count: 15 },
];

const TIER_OPTIONS: FilterOption[] = [
  { id: 'high', label: 'Premium', count: 15 },
  { id: 'low', label: 'Enhanced', count: 23 },
  { id: 'free', label: 'Free', count: 67 },
];

const STATE_OPTIONS: FilterOption[] = [
  { id: 'TX', label: 'Texas', count: 28 },
  { id: 'CA', label: 'California', count: 22 },
  { id: 'FL', label: 'Florida', count: 18 },
  { id: 'NY', label: 'New York', count: 15 },
  { id: 'IL', label: 'Illinois', count: 12 },
  { id: 'AZ', label: 'Arizona', count: 11 },
  { id: 'GA', label: 'Georgia', count: 9 },
  { id: 'CO', label: 'Colorado', count: 8 },
];

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  totalResults,
  isSticky = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  // Handle sticky behavior
  useEffect(() => {
    if (!isSticky) return;

    const handleScroll = () => {
      if (filterBarRef.current) {
        const rect = filterBarRef.current.getBoundingClientRect();
        setIsStuck(rect.top <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSticky]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleServiceToggle = (serviceId: string) => {
    const newServices = filters.services.includes(serviceId)
      ? filters.services.filter(s => s !== serviceId)
      : [...filters.services, serviceId];
    
    onFiltersChange({ ...filters, services: newServices });
  };

  const handleTierToggle = (tierId: string) => {
    const newTiers = filters.tiers.includes(tierId)
      ? filters.tiers.filter(t => t !== tierId)
      : [...filters.tiers, tierId];
    
    onFiltersChange({ ...filters, tiers: newTiers });
  };

  const handleStateToggle = (stateId: string) => {
    const newStates = filters.states.includes(stateId)
      ? filters.states.filter(s => s !== stateId)
      : [...filters.states, stateId];
    
    onFiltersChange({ ...filters, states: newStates });
  };

  const handleVerifiedToggle = () => {
    onFiltersChange({ ...filters, verifiedOnly: !filters.verifiedOnly });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      services: [],
      tiers: [],
      states: [],
      verifiedOnly: false
    });
    setActiveDropdown(null);
  };

  const hasActiveFilters = filters.services.length > 0 || 
                          filters.tiers.length > 0 || 
                          filters.states.length > 0 || 
                          filters.verifiedOnly;

  const getActiveFilterCount = () => {
    return filters.services.length + filters.tiers.length + filters.states.length + (filters.verifiedOnly ? 1 : 0);
  };

  const FilterDropdown: React.FC<{
    title: string;
    options: FilterOption[];
    selected: string[];
    onToggle: (id: string) => void;
    dropdownKey: string;
  }> = ({ title, options, selected, onToggle, dropdownKey }) => (
    <div className="relative">
      <button
        onClick={() => setActiveDropdown(activeDropdown === dropdownKey ? null : dropdownKey)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
          selected.length > 0
            ? 'bg-primary text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
      >
        <span>{title}</span>
        {selected.length > 0 && (
          <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
            {selected.length}
          </span>
        )}
        <svg 
          className={`w-4 h-4 transition-transform ${activeDropdown === dropdownKey ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {activeDropdown === dropdownKey && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => onToggle(option.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selected.includes(option.id)
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{option.label}</span>
                {option.count && (
                  <span className="text-xs text-gray-400">
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={filterBarRef}
      className={`bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 transition-all duration-200 ${
        isSticky && isStuck ? 'fixed top-0 left-0 right-0 z-40 shadow-lg' : ''
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="py-4">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 rounded-lg text-white"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="bg-primary text-xs px-2 py-1 rounded-full">
                    {getActiveFilterCount()}
                  </span>
                )}
              </div>
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Filter Content */}
          <div className={`${isExpanded ? 'block' : 'hidden'} lg:block`}>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Results Count */}
              <div className="text-gray-300 text-sm font-medium lg:mr-4">
                {totalResults} clinics found
              </div>

              {/* Filter Options */}
              <div className="flex flex-wrap gap-3 flex-1">
                <FilterDropdown
                  title="Services"
                  options={SERVICE_OPTIONS}
                  selected={filters.services}
                  onToggle={handleServiceToggle}
                  dropdownKey="services"
                />

                <FilterDropdown
                  title="Tier"
                  options={TIER_OPTIONS}
                  selected={filters.tiers}
                  onToggle={handleTierToggle}
                  dropdownKey="tiers"
                />

                <FilterDropdown
                  title="State"
                  options={STATE_OPTIONS}
                  selected={filters.states}
                  onToggle={handleStateToggle}
                  dropdownKey="states"
                />

                {/* Verified Only Toggle */}
                <button
                  onClick={handleVerifiedToggle}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    filters.verifiedOnly
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Verified Only</span>
                </button>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Clear all</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;