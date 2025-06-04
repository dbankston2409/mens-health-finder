import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import IndexedClinicMap from '../../components/admin/seo/IndexedClinicMap';
import SeoPerformancePanel from '../../components/admin/seo/SeoPerformancePanel';
import { generateSitemapDaily } from '../../utils/seo/sitemapGenerator';

// Import icons
import {
  ArrowPathIcon,
  GlobeAltIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface SeoPerformancePageProps {
  timeRange: number;
  lastSitemapUpdate: string | null;
}

export default function SeoPerformancePage({ 
  timeRange = 30,
  lastSitemapUpdate
}: SeoPerformancePageProps) {
  const router = useRouter();
  const [regeneratingSitemap, setRegeneratingSitemap] = useState(false);
  const [sitemapSuccess, setSitemapSuccess] = useState<boolean | null>(null);
  const [sitemapError, setSitemapError] = useState<string | null>(null);
  
  const handleRegenerateSitemap = async () => {
    try {
      setRegeneratingSitemap(true);
      setSitemapSuccess(null);
      setSitemapError(null);
      
      // Make API call to regenerate sitemap
      const response = await fetch('/api/sitemap/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'}});
      
      const data = await response.json();
      
      if (response.ok) {
        setSitemapSuccess(true);
      } else {
        setSitemapError(data.message || 'Failed to regenerate sitemap');
        setSitemapSuccess(false);
      }
    } catch (error) {
      console.error('Error regenerating sitemap:', error);
      setSitemapError('An unexpected error occurred');
      setSitemapSuccess(false);
    } finally {
      setRegeneratingSitemap(false);
    }
  };
  
  return (
    <>
      <Head>
        <title>SEO Performance | Men's Health Finder Admin</title>
        <meta name="description" content="SEO performance dashboard for Men's Health Finder" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">SEO Performance</h1>
          <p className="text-gray-400">Monitor and manage search engine optimization for clinics</p>
        </div>
        
        {/* Sitemap Status & Actions */}
        <div className="mb-6 bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Sitemap Status</h2>
              <p className="text-gray-400 mt-1">
                {lastSitemapUpdate 
                  ? `Last updated: ${lastSitemapUpdate}`
                  : 'Not yet generated'}
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#222222] text-gray-300 rounded-md hover:bg-[#333333] transition-colors inline-flex items-center"
              >
                <GlobeAltIcon className="h-5 w-5 mr-2" />
                View Sitemap
              </a>
              
              <button
                onClick={handleRegenerateSitemap}
                disabled={regeneratingSitemap}
                className={`px-4 py-2 rounded-md inline-flex items-center ${
                  regeneratingSitemap
                    ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-dark text-white'
                }`}
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${regeneratingSitemap ? 'animate-spin' : ''}`} />
                {regeneratingSitemap ? 'Regenerating...' : 'Regenerate Sitemap'}
              </button>
            </div>
          </div>
          
          {/* Success/Error messages */}
          {sitemapSuccess === true && (
            <div className="mt-4 p-3 bg-green-900 bg-opacity-20 border border-green-700 text-green-400 rounded-md flex items-start">
              <DocumentCheckIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Sitemap regenerated successfully!</p>
                <p className="text-sm">The sitemap has been updated and search engines have been notified.</p>
              </div>
            </div>
          )}
          
          {sitemapSuccess === false && (
            <div className="mt-4 p-3 bg-red-900 bg-opacity-20 border border-red-700 text-red-400 rounded-md flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Failed to regenerate sitemap</p>
                <p className="text-sm">{sitemapError || 'An error occurred while regenerating the sitemap.'}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Main SEO Performance Panel */}
        <div className="mb-6">
          <SeoPerformancePanel timeRange={timeRange} />
        </div>
        
        {/* Indexed Clinic Map */}
        <div className="mb-6">
          <IndexedClinicMap />
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { timeRange } = context.query;
  
  // Try to get the last sitemap update time
  let lastSitemapUpdate = null;
  try {
    const fs = require('fs');
    const path = require('path');
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    
    if (fs.existsSync(sitemapPath)) {
      const stats = fs.statSync(sitemapPath);
      lastSitemapUpdate = stats.mtime.toLocaleString();
    }
  } catch (error) {
    console.error('Error getting sitemap stats:', error);
  }
  
  return {
    props: {
      timeRange: timeRange ? parseInt(timeRange as string) : 30,
      lastSitemapUpdate
    }
  };
};