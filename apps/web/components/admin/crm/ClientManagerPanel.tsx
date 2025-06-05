import React, { useState, useMemo } from 'react';
import { useClinicData, Clinic } from '../../../utils/admin/useClinicData';
import ClientTable from './ClientTable';
import ClientFilters from './ClientFilters';
import ClientQuickActions from './ClientQuickActions';
import Link from 'next/link';

const VIEWS = {
  ALL: 'all',
  ACTIVE: 'active',
  TRIAL: 'trial',
  PAUSED: 'paused',
  CANCELED: 'canceled',
  PREMIUM: 'premium'
};

const ClientManagerPanel: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>(VIEWS.ALL);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [filters, setFilters] = useState<{
    package?: string;
    status?: string;
    state?: string;
    salesRep?: string;
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
  }>({});

  // Apply view as a filter
  const viewFilters = useMemo(() => {
    let viewFilter = {};
    
    switch(currentView) {
      case VIEWS.ACTIVE:
        viewFilter = { status: 'Active' };
        break;
      case VIEWS.TRIAL:
        viewFilter = { status: 'Trial' };
        break;
      case VIEWS.PAUSED:
        viewFilter = { status: 'Paused' };
        break;
      case VIEWS.CANCELED:
        viewFilter = { status: 'Canceled' };
        break;
      case VIEWS.PREMIUM:
        viewFilter = { package: 'Premium' };
        break;
      default:
        viewFilter = {};
    }
    
    return { ...viewFilter, ...filters };
  }, [currentView, filters]);

  const { clients, loading, error, totalCount } = useClinicData(viewFilters, currentPage, pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setCurrentPage(1); // Reset to first page when view changes
  };

  const handleSelectClient = (clientId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedClients(prev => [...prev, clientId]);
    } else {
      setSelectedClients(prev => prev.filter(id => id !== clientId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedClients(clients.map(client => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleBulkAction = async (action: string) => {
    // In a real app, we would call an API to perform the action
    console.log(`Performing ${action} on clients:`, selectedClients);
    
    // Reset selection after action
    setSelectedClients([]);
  };

  const handleSearch = (searchTerm: string) => {
    handleFilterChange({ searchTerm });
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-lg">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-[#222222]">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-xl font-bold">Client Manager</h2>
          <p className="text-sm text-gray-400">Manage and monitor all client accounts</p>
        </div>

        <div className="flex space-x-2">
          <Link 
            href="/admin/clients/new" 
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            <span>+ Add Client</span>
          </Link>
          <button className="px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700">
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Saved Views */}
      <div className="p-4 border-b border-[#222222]">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => handleViewChange(VIEWS.ALL)}
            className={`px-3 py-1 rounded-md ${currentView === VIEWS.ALL 
              ? 'bg-primary text-white' 
              : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            All Clients
          </button>
          <button 
            onClick={() => handleViewChange(VIEWS.ACTIVE)}
            className={`px-3 py-1 rounded-md ${currentView === VIEWS.ACTIVE 
              ? 'bg-primary text-white' 
              : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            Active
          </button>
          <button 
            onClick={() => handleViewChange(VIEWS.TRIAL)}
            className={`px-3 py-1 rounded-md ${currentView === VIEWS.TRIAL 
              ? 'bg-primary text-white' 
              : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            Trial
          </button>
          <button 
            onClick={() => handleViewChange(VIEWS.PAUSED)}
            className={`px-3 py-1 rounded-md ${currentView === VIEWS.PAUSED 
              ? 'bg-primary text-white' 
              : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            Paused
          </button>
          <button 
            onClick={() => handleViewChange(VIEWS.CANCELED)}
            className={`px-3 py-1 rounded-md ${currentView === VIEWS.CANCELED
              ? 'bg-primary text-white' 
              : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            Canceled
          </button>
          <button 
            onClick={() => handleViewChange(VIEWS.PREMIUM)}
            className={`px-3 py-1 rounded-md ${currentView === VIEWS.PREMIUM
              ? 'bg-primary text-white' 
              : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            Premium
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <ClientFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onSearch={handleSearch}
      />

      {/* Quick Actions for Selected Clients */}
      {selectedClients.length > 0 && (
        <ClientQuickActions 
          selectedCount={selectedClients.length} 
          onAction={handleBulkAction}
        />
      )}

      {/* Table */}
      <ClientTable 
        clients={clients}
        loading={loading}
        error={error}
        selectedClients={selectedClients}
        onSelectClient={handleSelectClient}
        onSelectAll={handleSelectAll}
      />

      {/* Pagination */}
      <div className="flex justify-between items-center p-4 border-t border-[#222222]">
        <div className="text-sm text-gray-400">
          Showing {clients.length} of {totalCount} clients
        </div>
        
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button 
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientManagerPanel;