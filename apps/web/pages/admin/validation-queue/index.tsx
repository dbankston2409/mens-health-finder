import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import useValidationQueue, { 
  VALIDATION_TAGS, 
  ALL_TAGS, 
  Clinic 
} from '../../../utils/hooks/useValidationQueue';
import ValidationQueueTable from './components/ValidationQueueTable';
import ValidationSidebar from './components/ValidationSidebar';
import BulkValidationControls from './components/BulkValidationControls';
import { ExclamationCircleIcon, CheckCircleIcon, TagIcon, FunnelIcon } from '@heroicons/react/24/solid';

const ValidationQueuePanel: React.FC = () => {
  const {
    clinics,
    loading,
    error,
    stats,
    filters,
    selectedClinic,
    hasMore,
    updateFilters,
    loadMore,
    refreshQueue,
    selectClinic,
    updateClinicField,
    updateTags,
    validateClinic,
    rejectClinic,
    checkWebsite,
    bulkValidate,
    bulkAddTag,
    bulkRemoveTag
  } = useValidationQueue();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  
  // Handle clinic selection
  const handleSelectClinic = useCallback((clinicId: string) => {
    const clinic = clinics.find(c => c.id === clinicId) || null;
    selectClinic(clinic);
    setIsSidebarOpen(true);
  }, [clinics, selectClinic]);

  // Handle closing the sidebar
  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);
  
  // Handle bulk selection
  const handleSelectForBulk = useCallback((clinicIds: string[]) => {
    setSelectedIds(clinicIds);
  }, []);

  // Handle checking website status
  const handleCheckWebsite = useCallback(async (clinicId: string, website: string) => {
    return await checkWebsite(clinicId, website);
  }, [checkWebsite]);

  // Handle validating a clinic
  const handleValidateClinic = useCallback(async () => {
    if (!selectedClinic) return;
    
    try {
      await validateClinic(selectedClinic.id);
      setIsSidebarOpen(false);
    } catch (err) {
      console.error('Error validating clinic:', err);
    }
  }, [selectedClinic, validateClinic]);

  // Handle rejecting a clinic
  const handleRejectClinic = useCallback(async (reason: string) => {
    if (!selectedClinic) return;
    
    try {
      await rejectClinic(selectedClinic.id, reason);
      setIsSidebarOpen(false);
    } catch (err) {
      console.error('Error rejecting clinic:', err);
    }
  }, [selectedClinic, rejectClinic]);

  // Handle skipping a clinic
  const handleSkipClinic = useCallback(() => {
    selectClinic(null);
    setIsSidebarOpen(false);
  }, [selectClinic]);

  // Handle checking website from sidebar
  const handleCheckWebsiteFromSidebar = useCallback(async () => {
    if (!selectedClinic || !selectedClinic.website) return 'unknown' as 'up' | 'down';
    
    return await checkWebsite(selectedClinic.id, selectedClinic.website);
  }, [selectedClinic, checkWebsite]);

  // Handle bulk validation
  const handleBulkValidate = useCallback(async () => {
    if (selectedIds.length === 0) return;
    
    try {
      await bulkValidate(selectedIds);
      setSelectedIds([]);
    } catch (err) {
      console.error('Error bulk validating clinics:', err);
    }
  }, [selectedIds, bulkValidate]);

  // Handle bulk tag add
  const handleBulkAddTag = useCallback(async (tag: string) => {
    if (selectedIds.length === 0) return;
    
    try {
      await bulkAddTag(selectedIds, tag);
    } catch (err) {
      console.error('Error adding tag to clinics:', err);
    }
  }, [selectedIds, bulkAddTag]);

  // Handle bulk tag remove
  const handleBulkRemoveTag = useCallback(async (tag: string) => {
    if (selectedIds.length === 0) return;
    
    try {
      await bulkRemoveTag(selectedIds, tag);
    } catch (err) {
      console.error('Error removing tag from clinics:', err);
    }
  }, [selectedIds, bulkRemoveTag]);

  // Handle export to CSV
  const handleExportCsv = useCallback(() => {
    // In a real implementation, this would generate a CSV file
    const selectedClinics = clinics.filter((clinic) => selectedIds.includes(clinic.id));
    
    if (selectedClinics.length === 0) return;
    
    // Convert clinics to CSV data
    const headers = ['id', 'name', 'address', 'city', 'state', 'zip', 'phone', 'email', 'website', 'status', 'tags'];
    const csvContent = [
      headers.join(','),
      ...selectedClinics.map((clinic) => {
        return [
          clinic.id,
          `"${clinic.name.replace(/"/g, '""')}"`,
          `"${clinic.address.replace(/"/g, '""')}"`,
          `"${clinic.city.replace(/"/g, '""')}"`,
          clinic.state,
          clinic.zip,
          clinic.phone,
          clinic.email,
          clinic.website,
          clinic.status,
          `"${clinic.tags.join(', ').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `validation-queue-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [clinics, selectedIds]);

  // Handle filter change for tag
  const handleTagFilterChange = useCallback((tag: string) => {
    updateFilters({
      tags: filters.tags.includes(tag)
        ? filters.tags.filter(t => t !== tag)
        : [...filters.tags, tag]
    });
  }, [filters.tags, updateFilters]);

  // Handle state filter change
  const handleStateFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ state: e.target.value });
  }, [updateFilters]);

  // Handle import source filter change
  const handleImportSourceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ importSource: e.target.value });
  }, [updateFilters]);

  // Handle status filter change
  const handleStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ status: e.target.value });
  }, [updateFilters]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    updateFilters({
      tags: [],
      state: '',
      importSource: '',
      status: ''
    });
  }, [updateFilters]);

  // Keyboard shortcuts for validation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process shortcuts if sidebar is open
      if (!isSidebarOpen || !selectedClinic) return;
      
      switch (e.key) {
        case 'v':
          if (e.altKey) handleValidateClinic();
          break;
        case 'r':
          if (e.altKey) setIsSidebarOpen(false); // Just close, rejection needs reason
          break;
        case 'Escape':
          handleSkipClinic();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen, selectedClinic, handleValidateClinic, handleSkipClinic]);

  return (
    <AdminLayout title="Validation Queue">
      <div className="space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total to Review</p>
                <p className="text-2xl font-bold">{stats.totalToReview}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <ExclamationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reviewed Today</p>
                <p className="text-2xl font-bold">{stats.reviewedToday}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Validated</p>
                <p className="text-2xl font-bold">{stats.validated}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <ExclamationCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
                {(filters.tags.length > 0 || filters.state || filters.importSource || filters.status) && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {filters.tags.length +
                      (filters.state ? 1 : 0) +
                      (filters.importSource ? 1 : 0) +
                      (filters.status ? 1 : 0)}
                  </span>
                )}
              </button>
              
              {filterDropdownOpen && (
                <div className="origin-top-left absolute left-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10 p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tag Filters
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {VALIDATION_TAGS.map(tag => (
                          <button
                            key={tag}
                            onClick={() => handleTagFilterChange(tag)}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              filters.tags.includes(tag)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                          >
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          State
                        </label>
                        <select
                          value={filters.state}
                          onChange={handleStateFilterChange}
                          className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="">All States</option>
                          <option value="AL">Alabama</option>
                          <option value="AK">Alaska</option>
                          <option value="AZ">Arizona</option>
                          <option value="CA">California</option>
                          <option value="CO">Colorado</option>
                          <option value="FL">Florida</option>
                          <option value="GA">Georgia</option>
                          <option value="NY">New York</option>
                          <option value="TX">Texas</option>
                          {/* Add more states as needed */}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status
                        </label>
                        <select
                          value={filters.status}
                          onChange={handleStatusFilterChange}
                          className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="">All Statuses</option>
                          <option value="basic">Basic</option>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="canceled">Canceled</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Import Source
                      </label>
                      <select
                        value={filters.importSource}
                        onChange={handleImportSourceChange}
                        className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="">All Sources</option>
                        <option value="yelp">Yelp</option>
                        <option value="google">Google Maps</option>
                        <option value="healthgrades">Healthgrades</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                    
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleClearFilters}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={refreshQueue}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          
          <BulkValidationControls
            selectedCount={selectedIds.length}
            onBulkValidate={handleBulkValidate}
            onBulkAddTag={handleBulkAddTag}
            onBulkRemoveTag={handleBulkRemoveTag}
            onExportCsv={handleExportCsv}
            disabled={loading}
          />
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
            <p className="flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              {error.message}
            </p>
          </div>
        )}
        
        {/* Validation Queue Table */}
        <ValidationQueueTable
          clinics={clinics}
          selectedClinicId={selectedClinic?.id || null}
          onSelectClinic={handleSelectClinic}
          onCheckWebsite={handleCheckWebsite}
          onLoadMore={loadMore}
          hasMore={hasMore}
          loading={loading}
          onSelectForBulk={handleSelectForBulk}
        />
        
        {/* Sidebar */}
        <ValidationSidebar
          clinic={selectedClinic}
          onClose={handleCloseSidebar}
          onUpdateField={updateClinicField}
          onUpdateTags={updateTags}
          onValidate={handleValidateClinic}
          onReject={handleRejectClinic}
          onSkip={handleSkipClinic}
          onCheckWebsite={handleCheckWebsiteFromSidebar}
          isOpen={isSidebarOpen}
        />
        
        {/* Shortcut Instructions */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700">Alt + V</span>
              <span className="ml-2">Validate clinic</span>
            </div>
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700">Alt + R</span>
              <span className="ml-2">Reject clinic</span>
            </div>
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700">Esc</span>
              <span className="ml-2">Skip / Close sidebar</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ValidationQueuePanel;