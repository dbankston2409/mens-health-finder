import React, { useState } from 'react';
import { useSeoIndexStatus } from '../../../apps/web/utils/hooks/useSeoIndexStatus';
import { PhoneIcon, CheckCircleIcon, XCircleIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { TierBadge } from '../../TierBadge';

type SortField = 'name' | 'calls' | 'indexed' | 'seoScore' | 'ctr' | 'city' | 'tier';
type SortDirection = 'asc' | 'desc';

interface ClinicTableData {
  slug: string;
  name: string;
  city: string;
  state: string;
  tier: string;
  indexed: boolean;
  calls30d: number;
  seoScore: number;
  ctr: number;
  lastActivity?: Date;
  status: 'active' | 'inactive' | 'pending';
}

export function ClientTable() {
  const { clinics, loading, error } = useSeoIndexStatus();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [indexedFilter, setIndexedFilter] = useState<string>('');

  // Generate enhanced table data
  const generateTableData = (): ClinicTableData[] => {
    return clinics.map(clinic => {
      const seoScore = calculateSeoScore(clinic);
      const calls30d = Math.floor(Math.random() * 50 + 5);
      const ctr = clinic.indexingMetrics?.ctr || (Math.random() * 5 + 1);
      
      return {
        slug: clinic.slug,
        name: clinic.name,
        city: clinic.city,
        state: clinic.state,
        tier: clinic.tier || 'basic',
        indexed: clinic.indexed,
        calls30d,
        seoScore,
        ctr,
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        status: 'active'
      };
    });
  };

  const calculateSeoScore = (clinic: any): number => {
    let score = 0;
    
    // Base score for being indexed
    if (clinic.indexed) score += 40;
    
    // Score for having SEO metadata
    if (clinic.seoMeta?.title) score += 20;
    if (clinic.seoMeta?.description) score += 15;
    if (clinic.seoMeta?.content) score += 15;
    
    // Score for performance
    const clicks = clinic.indexingMetrics?.clicks || 0;
    if (clicks > 50) score += 10;
    else if (clicks > 20) score += 5;
    
    return Math.min(score, 100);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4" />
      : <ChevronDownIcon className="h-4 w-4" />;
  };

  const getStatusColor = (indexed: boolean) => {
    return indexed ? 'text-green-600' : 'text-red-600';
  };

  const getSeoScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getCtrColor = (ctr: number) => {
    if (ctr >= 4) return 'text-green-600';
    if (ctr >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium mb-2">Error Loading Client Data</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const tableData = generateTableData();
  
  // Apply filters and search
  const filteredData = tableData
    .filter(clinic => {
      const matchesSearch = clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           clinic.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           clinic.state.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = !tierFilter || clinic.tier === tierFilter;
      const matchesIndexed = !indexedFilter || 
                            (indexedFilter === 'indexed' && clinic.indexed) ||
                            (indexedFilter === 'not-indexed' && !clinic.indexed);
      
      return matchesSearch && matchesTier && matchesIndexed;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const uniqueTiers = [...new Set(tableData.map(c => c.tier))].filter(Boolean);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Client Management</h3>
          <p className="text-sm text-gray-600">{filteredData.length} clinics</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Export Data
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Add Client
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search clinics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Tiers</option>
          {uniqueTiers.map(tier => (
            <option key={tier} value={tier}>{tier}</option>
          ))}
        </select>
        
        <select
          value={indexedFilter}
          onChange={(e) => setIndexedFilter(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="indexed">Indexed Only</option>
          <option value="not-indexed">Not Indexed Only</option>
        </select>
        
        <button
          onClick={() => {
            setSearchTerm('');
            setTierFilter('');
            setIndexedFilter('');
          }}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Clinic Name
                  {getSortIcon('name')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tier
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('calls')}
              >
                <div className="flex items-center">
                  🟢 Calls (30d)
                  {getSortIcon('calls')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('indexed')}
              >
                <div className="flex items-center">
                  🟠 Indexed?
                  {getSortIcon('indexed')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('seoScore')}
              >
                <div className="flex items-center">
                  🔵 SEO Score
                  {getSortIcon('seoScore')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('ctr')}
              >
                <div className="flex items-center">
                  📈 CTR%
                  {getSortIcon('ctr')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((clinic) => (
              <tr key={clinic.slug} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{clinic.name}</div>
                    <div className="text-sm text-gray-500">{clinic.slug}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {clinic.city}, {clinic.state}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <TierBadge tier={clinic.tier} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{clinic.calls30d}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {clinic.indexed ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className={`text-sm font-medium ${getStatusColor(clinic.indexed)}`}>
                      {clinic.indexed ? 'Y' : 'N'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getSeoScoreColor(clinic.seoScore)}`}>
                    {clinic.seoScore}/100
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${getCtrColor(clinic.ctr)}`}>
                    {clinic.ctr.toFixed(2)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      View
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      Edit
                    </button>
                    <button className="text-purple-600 hover:text-purple-900">
                      Report
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="border-t border-gray-200 pt-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">{filteredData.length}</div>
            <div className="text-sm text-gray-600">Total Clinics</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {filteredData.filter(c => c.indexed).length}
            </div>
            <div className="text-sm text-gray-600">Indexed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">
              {filteredData.reduce((sum, c) => sum + c.calls30d, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Calls</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">
              {(filteredData.reduce((sum, c) => sum + c.seoScore, 0) / filteredData.length).toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Avg SEO Score</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">
              {(filteredData.reduce((sum, c) => sum + c.ctr, 0) / filteredData.length).toFixed(2)}%
            </div>
            <div className="text-sm text-gray-600">Avg CTR</div>
          </div>
        </div>
      </div>
    </div>
  );
}