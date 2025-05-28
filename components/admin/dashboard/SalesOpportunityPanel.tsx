import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface SalesOpportunityClinic {
  slug: string;
  name: string;
  city: string;
  state: string;
  clicks: number;
  calls: number;
  package: string;
  engagement: string;
  hasCallTracking: boolean;
  revenueOpportunity: number;
  priority: 'high' | 'medium' | 'low';
}

interface SalesOpportunityPanelProps {
  maxClinics?: number;
  showActions?: boolean;
}

export default function SalesOpportunityPanel({ 
  maxClinics = 10, 
  showActions = true 
}: SalesOpportunityPanelProps) {
  const [opportunities, setOpportunities] = useState<SalesOpportunityClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchSalesOpportunities();
  }, [maxClinics]);

  const fetchSalesOpportunities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/sales-opportunities?limit=${maxClinics}`);
      const data = await response.json();
      setOpportunities(data.opportunities || []);
    } catch (error) {
      console.error('Error fetching sales opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendUpgradeEmail = async (clinicSlug: string) => {
    try {
      setSendingEmail(clinicSlug);
      const response = await fetch('/api/admin/send-upgrade-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicSlug })
      });
      
      if (response.ok) {
        alert('Upgrade email sent successfully!');
      } else {
        alert('Failed to send upgrade email');
      }
    } catch (error) {
      console.error('Error sending upgrade email:', error);
      alert('Error sending upgrade email');
    } finally {
      setSendingEmail(null);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[priority as keyof typeof styles]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const getEngagementIcon = (engagement: string) => {
    switch (engagement) {
      case 'engaged': return '🔵';
      case 'low': return '🟠';
      default: return '🔴';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clinics to Upsell</h3>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Clinics to Upsell</h3>
        <button
          onClick={fetchSalesOpportunities}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>
      
      {opportunities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No sales opportunities found</p>
          <p className="text-sm text-gray-400 mt-1">
            Check back later or adjust filters
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((clinic) => (
            <div
              key={clinic.slug}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Link
                    href={`/admin/clinic/${clinic.slug}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {clinic.name}
                  </Link>
                  {getPriorityBadge(clinic.priority)}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{clinic.city}, {clinic.state}</span>
                  <span className="flex items-center gap-1">
                    {getEngagementIcon(clinic.engagement)}
                    {clinic.engagement}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {clinic.package.toUpperCase()}
                  </span>
                </div>
                
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">
                    {clinic.clicks} clicks, {clinic.calls} calls
                  </span>
                  {clinic.revenueOpportunity > 0 && (
                    <span className="ml-3 text-green-600 font-medium">
                      ${clinic.revenueOpportunity}/mo opportunity
                    </span>
                  )}
                </div>
              </div>
              
              {showActions && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/clinic/${clinic.slug}`}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </Link>
                  
                  <button
                    onClick={() => handleSendUpgradeEmail(clinic.slug)}
                    disabled={sendingEmail === clinic.slug}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {sendingEmail === clinic.slug ? 'Sending...' : 'Send Offer'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {opportunities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Showing {opportunities.length} top opportunities
            </span>
            <span>
              Total potential: ${opportunities.reduce((sum, c) => sum + c.revenueOpportunity, 0)}/mo
            </span>
          </div>
        </div>
      )}
    </div>
  );
}