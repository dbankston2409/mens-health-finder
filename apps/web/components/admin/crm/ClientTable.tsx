import React, { useState } from 'react';
import { Clinic } from '../../../utils/admin/useClinicData';
import Link from 'next/link';

interface ClientTableProps {
  clients: Clinic[];
  loading: boolean;
  error: string | null;
  selectedClients: string[];
  onSelectClient: (clientId: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
}

type SortField = 'name' | 'status' | 'package' | 'joinDate' | 'engagementScore';
type SortOrder = 'asc' | 'desc';

const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  loading,
  error,
  selectedClients,
  onSelectClient,
  onSelectAll
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedClients = [...clients].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'package':
        comparison = a.package.localeCompare(b.package);
        break;
      case 'joinDate':
        comparison = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
        break;
      case 'engagementScore':
        comparison = (a.engagementScore || 0) - (b.engagementScore || 0);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getSortIndicator = (field: SortField) => {
    if (field !== sortField) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const allSelected = clients.length > 0 && selectedClients.length === clients.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-900 text-green-300';
      case 'Trial':
        return 'bg-blue-900 text-blue-300';
      case 'Paused':
        return 'bg-yellow-900 text-yellow-300';
      case 'Canceled':
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  const getPackageColor = (packageType: string) => {
    switch (packageType) {
      case 'Premium':
        return 'bg-purple-900 text-purple-300';
      case 'Basic':
        return 'bg-blue-900 text-blue-300';
      case 'Free':
        return 'bg-gray-800 text-gray-300';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  const getEngagementColor = (score?: number) => {
    if (!score) return 'bg-gray-800';
    if (score >= 80) return 'bg-green-900';
    if (score >= 50) return 'bg-yellow-900';
    return 'bg-red-900';
  };

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <div className="p-6 text-center">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2"></div>
          <p>Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-x-auto">
        <div className="p-6 text-center text-red-500">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="overflow-x-auto">
        <div className="p-6 text-center">
          <p>No clients found matching your criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#222222]">
        <thead className="bg-[#0A0A0A]">
          <tr>
            <th className="px-4 py-3 text-left">
              <input 
                type="checkbox" 
                checked={allSelected}
                onChange={e => onSelectAll(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700 text-primary focus:ring-primary focus:ring-offset-gray-900"
              />
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => handleSort('name')}
            >
              Name{getSortIndicator('name')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => handleSort('status')}
            >
              Status{getSortIndicator('status')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => handleSort('package')}
            >
              Package{getSortIndicator('package')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Location
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => handleSort('joinDate')}
            >
              Join Date{getSortIndicator('joinDate')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => handleSort('engagementScore')}
            >
              Engagement{getSortIndicator('engagementScore')}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#222222]">
          {sortedClients.map((client) => (
            <tr key={client.id} className="hover:bg-[#1A1A1A]">
              <td className="px-4 py-4 whitespace-nowrap">
                <input 
                  type="checkbox" 
                  checked={selectedClients.includes(client.id)}
                  onChange={e => onSelectClient(client.id, e.target.checked)}
                  className="rounded bg-gray-800 border-gray-700 text-primary focus:ring-primary focus:ring-offset-gray-900"
                />
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium">
                      <Link href={`/admin/clients/${client.id}`} className="hover:text-primary">
                        {client.name}
                      </Link>
                    </div>
                    <div className="text-sm text-gray-400">{client.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(client.status)}`}>
                  {client.status}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${getPackageColor(client.package)}`}>
                  {client.package}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                {client.city}, {client.state}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                {new Date(client.joinDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className={`w-16 h-2 rounded-full ${getEngagementColor(client.engagementScore)}`}>
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${client.engagementScore || 0}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm">{client.engagementScore || 0}%</span>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <Link 
                    href={`/admin/clients/${client.id}`}
                    className="text-primary hover:text-primary-light"
                  >
                    View
                  </Link>
                  <span className="text-gray-600">|</span>
                  <Link 
                    href={`/admin/clients/${client.id}/edit`}
                    className="text-gray-400 hover:text-white"
                  >
                    Edit
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable;