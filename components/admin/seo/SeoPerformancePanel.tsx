import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../apps/web/lib/firebase';

interface SeoStats {
  totalClinics: number;
  clinicsWithSeo: number;
  clinicsNeedingUpdate: number;
  avgContentLength: number;
  recentlyUpdated: number;
}

interface ClinicSeoStatus {
  slug: string;
  name: string;
  hasSeo: boolean;
  lastUpdated?: Date;
  contentLength?: number;
  indexed?: boolean;
}

export function SeoPerformancePanel() {
  const [stats, setStats] = useState<SeoStats | null>(null);
  const [clinics, setClinics] = useState<ClinicSeoStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'missing' | 'outdated'>('overview');

  useEffect(() => {
    fetchSeoStats();
  }, []);

  const fetchSeoStats = async () => {
    try {
      setLoading(true);
      
      const clinicsRef = collection(db, 'clinics');
      const allClinicsQuery = query(clinicsRef, limit(1000));
      const snapshot = await getDocs(allClinicsQuery);
      
      const clinicData: ClinicSeoStatus[] = [];
      let totalWithSeo = 0;
      let totalContentLength = 0;
      let contentCount = 0;
      let recentlyUpdated = 0;
      let needingUpdate = 0;
      
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const seoMeta = data.seoMeta;
        
        const clinic: ClinicSeoStatus = {
          slug: doc.id,
          name: data.name || 'Unknown Clinic',
          hasSeo: !!seoMeta,
          lastUpdated: seoMeta?.lastGenerated?.toDate(),
          contentLength: seoMeta?.content?.length || 0,
          indexed: seoMeta?.indexed || false
        };
        
        clinicData.push(clinic);
        
        if (seoMeta) {
          totalWithSeo++;
          
          if (seoMeta.content) {
            totalContentLength += seoMeta.content.length;
            contentCount++;
          }
          
          if (clinic.lastUpdated && clinic.lastUpdated > oneWeekAgo) {
            recentlyUpdated++;
          }
          
          if (!clinic.lastUpdated || clinic.lastUpdated < oneMonthAgo) {
            needingUpdate++;
          }
        } else {
          needingUpdate++;
        }
      });
      
      setStats({
        totalClinics: snapshot.docs.length,
        clinicsWithSeo: totalWithSeo,
        clinicsNeedingUpdate: needingUpdate,
        avgContentLength: contentCount > 0 ? Math.round(totalContentLength / contentCount) : 0,
        recentlyUpdated
      });
      
      setClinics(clinicData);
    } catch (error) {
      console.error('Error fetching SEO stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredClinics = () => {
    switch (activeTab) {
      case 'missing':
        return clinics.filter(c => !c.hasSeo);
      case 'outdated':
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return clinics.filter(c => c.hasSeo && (!c.lastUpdated || c.lastUpdated < oneMonthAgo));
      default:
        return clinics.slice(0, 20); // Show first 20 for overview
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">SEO Performance</h2>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalClinics}</div>
            <div className="text-sm text-gray-600">Total Clinics</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.clinicsWithSeo}</div>
            <div className="text-sm text-gray-600">With SEO Data</div>
            <div className="text-xs text-gray-500">
              {((stats.clinicsWithSeo / stats.totalClinics) * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.clinicsNeedingUpdate}</div>
            <div className="text-sm text-gray-600">Need Updates</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.avgContentLength}</div>
            <div className="text-sm text-gray-600">Avg Content Length</div>
          </div>
        </div>
      )}
      
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'missing', label: 'Missing SEO' },
            { key: 'outdated', label: 'Outdated' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clinic
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SEO Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content Length
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getFilteredClinics().map(clinic => (
              <tr key={clinic.slug}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{clinic.name}</div>
                  <div className="text-sm text-gray-500">{clinic.slug}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    clinic.hasSeo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {clinic.hasSeo ? 'Complete' : 'Missing'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {clinic.lastUpdated 
                    ? clinic.lastUpdated.toLocaleDateString()
                    : 'Never'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {clinic.contentLength ? `${clinic.contentLength} chars` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={fetchSeoStats}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Refresh Data
        </button>
        
        <div className="text-sm text-gray-500">
          Showing {getFilteredClinics().length} clinics
        </div>
      </div>
    </div>
  );
}