import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  FunnelIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import ClientTable, { Clinic } from './ClientTable';
import ClientFilters from './ClientFilters';
import PaginationControls from './PaginationControls';
import LoadingSkeletons, { FilterSkeleton } from './LoadingSkeletons';
import { db } from '../../../lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';

type SavedView = {
  id: string;
  name: string;
  filters: any;
  isDefault?: boolean;
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

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const ClientManagerPanel: React.FC = () => {
  const router = useRouter();
  
  // State for clinics data and loading
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Filters>({
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
  
  // State for saved views
  const [savedViews, setSavedViews] = useState<SavedView[]>([
    { id: 'all', name: 'All Clinics', filters: {}, isDefault: true },
    { id: 'new-this-week', name: 'New This Week', filters: { 
      dateRange: { 
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
        end: new Date() 
      } 
    }},
    { id: 'high-engagement', name: 'High Engagement', filters: { minClicks: 50 }},
    { id: 'no-traffic', name: 'No Traffic (30 Days)', filters: { minClicks: 0 }},
    { id: 'need-attention', name: 'Need Attention', filters: { tags: ['website-down', 'geo-mismatch', 'needs-review'] }},
  ]);
  const [activeView, setActiveView] = useState<SavedView>(savedViews[0]);
  const [showViewsDropdown, setShowViewsDropdown] = useState(false);
  
  // Filter options derived from all clinics
  const [filterOptions, setFilterOptions] = useState({
    packageTiers: ['Basic', 'Premium', 'Pro', 'Free'],
    statuses: ['active', 'paused', 'trial', 'canceled'],
    states: [] as string[],
    cities: {} as Record<string, string[]>,
    tags: ['verified', 'website-down', 'geo-mismatch', 'needs-review', 'premium-candidate', 'featured']
  });

  // Fetch clinics data
  const fetchClinics = async () => {
    setLoading(true);
    try {
      const clinicsRef = collection(db, 'clinics');
      const clinicsSnapshot = await getDocs(clinicsRef);
      
      const clinicsData: Clinic[] = [];
      const states = new Set<string>();
      const citiesByState: Record<string, Set<string>> = {};
      
      clinicsSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Process engagement score (fallback to random number for demo)
        const engagementScore = data.engagementScore || Math.floor(Math.random() * 100);
        
        // Process sign-up date and last contacted
        const signUpDate = data.createdAt 
          ? (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt))
          : new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)); // Random date within the last year
        
        const lastContacted = data.lastContacted
          ? (data.lastContacted instanceof Timestamp ? data.lastContacted.toDate() : new Date(data.lastContacted))
          : (Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) : null);
        
        // Add clinic to the collection
        const clinic: Clinic = {
          id: doc.id,
          name: data.name || 'Unnamed Clinic',
          city: data.city || 'Unknown',
          state: data.state || 'XX',
          packageTier: data.packageTier || 'Basic',
          status: data.status || 'active',
          engagementScore,
          signUpDate,
          lastContacted,
          tags: data.tags || [],
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          zip: data.zip || ''
        };
        
        clinicsData.push(clinic);
        
        // Collect states and cities
        states.add(clinic.state);
        if (!citiesByState[clinic.state]) {
          citiesByState[clinic.state] = new Set<string>();
        }
        citiesByState[clinic.state].add(clinic.city);
      });
      
      setClinics(clinicsData);
      
      // Update filter options
      setFilterOptions(prev => ({
        ...prev,
        states: Array.from(states).sort(),
        cities: Object.fromEntries(
          Object.entries(citiesByState).map(([state, cities]) => [
            state,
            Array.from(cities).sort()
          ])
        )
      }));
      
    } catch (error) {
      console.error("Error fetching clinics: ", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchClinics();
  }, []);

  // Apply filters and search
  useEffect(() => {
    if (clinics.length === 0) return;
    
    let results = [...clinics];
    
    // Apply search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      results = results.filter(clinic => 
        clinic.name.toLowerCase().includes(search) ||
        clinic.city.toLowerCase().includes(search) ||
        clinic.state.toLowerCase().includes(search) ||
        clinic.phone?.toLowerCase().includes(search) ||
        clinic.email?.toLowerCase().includes(search)
      );
    }
    
    // Apply filters
    if (activeFilters.packageTier.length > 0) {
      results = results.filter(clinic => 
        activeFilters.packageTier.includes(clinic.packageTier)
      );
    }
    
    if (activeFilters.status.length > 0) {
      results = results.filter(clinic => 
        activeFilters.status.includes(clinic.status)
      );
    }
    
    if (activeFilters.state) {
      results = results.filter(clinic => 
        clinic.state === activeFilters.state
      );
      
      if (activeFilters.city) {
        results = results.filter(clinic => 
          clinic.city === activeFilters.city
        );
      }
    }
    
    if (activeFilters.tags.length > 0) {
      results = results.filter(clinic => 
        clinic.tags && activeFilters.tags.some(tag => clinic.tags.includes(tag))
      );
    }
    
    if (activeFilters.minClicks !== null) {
      results = results.filter(clinic => 
        clinic.engagementScore >= (activeFilters.minClicks || 0)
      );
    }
    
    if (activeFilters.dateRange.start || activeFilters.dateRange.end) {
      results = results.filter(clinic => {
        const clinicDate = new Date(clinic.signUpDate);
        
        if (activeFilters.dateRange.start && activeFilters.dateRange.end) {
          return clinicDate >= activeFilters.dateRange.start && clinicDate <= activeFilters.dateRange.end;
        } else if (activeFilters.dateRange.start) {
          return clinicDate >= activeFilters.dateRange.start;
        } else if (activeFilters.dateRange.end) {
          return clinicDate <= activeFilters.dateRange.end;
        }
        
        return true;
      });
    }
    
    setFilteredClinics(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [clinics, searchTerm, activeFilters]);

  // Calculate pagination values
  const totalItems = filteredClinics.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Get current page items
  const currentClinics = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClinics.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClinics, currentPage, itemsPerPage]);

  // Handlers
  const handleEditClinic = (clinic: Clinic) => {
    router.push(`/admin/clinic/${clinic.id}`);
  };
  
  const handleMessageClinic = (clinic: Clinic) => {
    // Implement message functionality or modal
    console.log("Message clinic:", clinic.name);
    // This would typically open a message modal or redirect to messaging interface
    alert(`Messaging ${clinic.name} would open a contact form`);
  };
  
  const handleStatusChange = (clinic: Clinic, newStatus: 'active' | 'paused' | 'trial' | 'canceled') => {
    // Update local state while Firestore update happens in the background
    setClinics(prevClinics => 
      prevClinics.map(c => 
        c.id === clinic.id ? { ...c, status: newStatus } : c
      )
    );
  };
  
  const handleTagsChange = (clinic: Clinic, newTags: string[]) => {
    // Update local state while Firestore update happens in the background
    setClinics(prevClinics => 
      prevClinics.map(c => 
        c.id === clinic.id ? { ...c, tags: newTags } : c
      )
    );
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const clearSearch = () => {
    setSearchTerm('');
  };
  
  const handleSavedViewSelect = (view: SavedView) => {
    setActiveView(view);
    setActiveFilters({ 
      ...activeFilters, 
      ...view.filters 
    });
    setShowViewsDropdown(false);
  };
  
  const handleApplyFilters = (filters: Filters) => {
    setActiveFilters(filters);
  };

  const handleExportData = () => {
    // Create CSV from filtered data
    const headers = ['Clinic Name', 'City', 'State', 'Package', 'Status', 'Engagement Score', 'Sign-Up Date', 'Last Contacted'];
    
    const csvContent = [
      headers.join(','),
      ...filteredClinics.map(clinic => [
        `"${clinic.name.replace(/"/g, '""')}"`,
        `"${clinic.city.replace(/"/g, '""')}"`,
        clinic.state,
        clinic.packageTier,
        clinic.status,
        clinic.engagementScore,
        formatDate(clinic.signUpDate),
        formatDate(clinic.lastContacted || '')
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mens-health-finder-clinics-${formatDate(new Date())}.csv`);
    link.click();
  };

  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
  };
  
  // Count active filters
  const activeFilterCount = (
    activeFilters.packageTier.length +
    activeFilters.status.length +
    (activeFilters.state ? 1 : 0) + 
    (activeFilters.city ? 1 : 0) +
    activeFilters.tags.length +
    (activeFilters.minClicks !== null ? 1 : 0) +
    (activeFilters.dateRange.start ? 1 : 0) +
    (activeFilters.dateRange.end ? 1 : 0)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header and Breadcrumbs */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clinic Manager</h1>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Link href="/admin/dashboard">
                  <span className="hover:text-blue-600 cursor-pointer">Dashboard</span>
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-700">Clinic Manager</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleExportData}
                className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Export CSV
              </button>
              <button
                onClick={fetchClinics}
                className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Saved Views Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowViewsDropdown(!showViewsDropdown)}
              className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              <span className="font-medium">{activeView.name}</span>
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </button>
            
            {showViewsDropdown && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                <div className="py-1">
                  {savedViews.map(view => (
                    <button
                      key={view.id}
                      onClick={() => handleSavedViewSelect(view)}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        activeView.id === view.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {view.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Search Box */}
          <div className="relative flex-1 lg:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search clinics by name, city, state, or phone..."
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
        
        {/* Filters Toggle and Active Filters Indicators */}
        <div className="mb-4 flex flex-wrap items-center justify-between">
          <div className="flex items-center mb-2 sm:mb-0">
            <button
              onClick={() => setFiltersOpen(true)}
              className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>
            
            {/* Active Filter Pills */}
            {activeFilterCount > 0 && (
              <div className="ml-4 flex flex-wrap gap-2">
                {activeFilters.packageTier.map(tier => (
                  <div key={tier} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    <span>Package: {tier}</span>
                    <button
                      onClick={() => setActiveFilters({
                        ...activeFilters,
                        packageTier: activeFilters.packageTier.filter(t => t !== tier)
                      })}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                {activeFilters.status.map(status => (
                  <div key={status} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    <span>Status: {status}</span>
                    <button
                      onClick={() => setActiveFilters({
                        ...activeFilters,
                        status: activeFilters.status.filter(s => s !== status)
                      })}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                {activeFilters.state && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    <span>State: {activeFilters.state}</span>
                    <button
                      onClick={() => setActiveFilters({
                        ...activeFilters,
                        state: '',
                        city: '' // Also clear city when state is cleared
                      })}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                )}
                
                {activeFilters.city && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    <span>City: {activeFilters.city}</span>
                    <button
                      onClick={() => setActiveFilters({
                        ...activeFilters,
                        city: ''
                      })}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                )}
                
                {activeFilters.tags.map(tag => (
                  <div key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    <span>Tag: {tag}</span>
                    <button
                      onClick={() => setActiveFilters({
                        ...activeFilters,
                        tags: activeFilters.tags.filter(t => t !== tag)
                      })}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                {activeFilters.minClicks !== null && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    <span>Min Clicks: {activeFilters.minClicks}</span>
                    <button
                      onClick={() => setActiveFilters({
                        ...activeFilters,
                        minClicks: null
                      })}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                )}
                
                {activeFilters.dateRange.start && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    <span>From: {formatDate(activeFilters.dateRange.start)}</span>
                    <button
                      onClick={() => setActiveFilters({
                        ...activeFilters,
                        dateRange: {
                          ...activeFilters.dateRange,
                          start: null
                        }
                      })}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                )}
                
                {activeFilters.dateRange.end && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    <span>To: {formatDate(activeFilters.dateRange.end)}</span>
                    <button
                      onClick={() => setActiveFilters({
                        ...activeFilters,
                        dateRange: {
                          ...activeFilters.dateRange,
                          end: null
                        }
                      })}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                )}
                
                {/* Clear All Button */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => setActiveFilters({
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
                    })}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {filteredClinics.length} {filteredClinics.length === 1 ? 'clinic' : 'clinics'} found
          </div>
        </div>
        
        {/* Clinic Table */}
        <div className="mb-6">
          {loading ? (
            <>
              <FilterSkeleton />
              <LoadingSkeletons rowCount={10} columnCount={7} />
            </>
          ) : (
            <ClientTable
              clinics={currentClinics}
              loading={loading}
              onEditClinic={handleEditClinic}
              onMessageClinic={handleMessageClinic}
              onStatusChange={handleStatusChange}
              onTagsChange={handleTagsChange}
              availableTags={filterOptions.tags}
              refreshData={fetchClinics}
            />
          )}
        </div>
        
        {/* Pagination Controls */}
        {!loading && filteredClinics.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>
      
      {/* Client Filters Drawer */}
      <ClientFilters
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApplyFilters={handleApplyFilters}
        filterOptions={filterOptions}
        initialFilters={activeFilters}
      />
    </div>
  );
};

export default ClientManagerPanel;