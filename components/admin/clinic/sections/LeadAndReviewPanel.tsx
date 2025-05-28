import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon, EnvelopeIcon, PhoneIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  createdAt: Date;
  status: 'new' | 'contacted' | 'converted' | 'closed';
}

interface Review {
  id: string;
  rating: number;
  text: string;
  displayName: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

interface LeadAndReviewPanelProps {
  clinicSlug: string;
  clinicName: string;
}

export default function LeadAndReviewPanel({ clinicSlug, clinicName }: LeadAndReviewPanelProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'reviews' | 'analytics'>('leads');
  const [leadStats, setLeadStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [clinicSlug]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch leads
      const leadsResponse = await fetch(`/api/admin/clinic/${clinicSlug}/leads`);
      const leadsData = await leadsResponse.json();
      if (leadsData.success) {
        setLeads(leadsData.leads || []);
      }
      
      // Fetch reviews
      const reviewsResponse = await fetch(`/api/admin/clinic/${clinicSlug}/reviews`);
      const reviewsData = await reviewsResponse.json();
      if (reviewsData.success) {
        setReviews(reviewsData.reviews || []);
      }
      
      // Fetch lead stats
      const statsResponse = await fetch(`/api/admin/clinic/${clinicSlug}/lead-stats`);
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setLeadStats(statsData.stats);
      }
      
    } catch (error) {
      console.error('Error fetching lead and review data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await fetch(`/api/admin/clinic/${clinicSlug}/export-leads`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${clinicSlug}-leads-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download CSV');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      converted: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'profile-cta':
        return <ChatBubbleLeftIcon className="h-4 w-4" />;
      case 'directory-landing':
        return <EnvelopeIcon className="h-4 w-4" />;
      default:
        return <PhoneIcon className="h-4 w-4" />;
    }
  };

  const calculateMetrics = () => {
    const totalLeads = leads.length;
    const totalReviews = reviews.length;
    const avgReviewScore = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;
    const conversionRate = totalLeads > 0 ? (totalReviews / totalLeads) * 100 : 0;
    const lastLead = leads.length > 0 ? leads[0]?.createdAt : null;
    const lastReview = reviews.length > 0 ? reviews[0]?.createdAt : null;

    return {
      totalLeads,
      totalReviews,
      avgReviewScore,
      conversionRate,
      lastLead,
      lastReview
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Lead & Review Analytics</h3>
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Download CSV
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{metrics.totalLeads}</div>
            <div className="text-sm text-blue-700">Total Leads</div>
            {leadStats?.trends?.leadsChange && (
              <div className={`text-xs ${leadStats.trends.leadsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {leadStats.trends.leadsChange >= 0 ? '+' : ''}{leadStats.trends.leadsChange.toFixed(1)}% vs last period
              </div>
            )}
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{metrics.totalReviews}</div>
            <div className="text-sm text-yellow-700">Reviews</div>
            <div className="flex items-center text-sm text-yellow-600">
              <StarIcon className="h-4 w-4 mr-1" />
              {metrics.avgReviewScore.toFixed(1)} avg
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{metrics.conversionRate.toFixed(1)}%</div>
            <div className="text-sm text-green-700">Lead → Review</div>
            <div className="text-xs text-green-600">Conversion Rate</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {leadStats?.responseRate?.toFixed(1) || '0'}%
            </div>
            <div className="text-sm text-purple-700">Response Rate</div>
            <div className="text-xs text-purple-600">
              Avg: {leadStats?.timeToResponse?.average?.toFixed(1) || '0'}h
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { key: 'leads', label: 'Leads', count: metrics.totalLeads },
            { key: 'reviews', label: 'Reviews', count: metrics.totalReviews },
            { key: 'analytics', label: 'Analytics', count: null }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'leads' && (
          <div className="space-y-4">
            {leads.length === 0 ? (
              <div className="text-center py-8">
                <ChatBubbleLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No leads yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Leads will appear here when visitors submit contact forms
                </p>
              </div>
            ) : (
              leads.map((lead) => (
                <div key={lead.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{lead.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>{lead.email}</span>
                        <span>{lead.phone}</span>
                        <div className="flex items-center">
                          {getSourceIcon(lead.source)}
                          <span className="ml-1">{lead.source}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(lead.status)}
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {lead.message && (
                    <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                      "{lead.message}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <StarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No reviews yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Reviews will appear here when patients leave feedback
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {review.displayName}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{review.text}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        review.status === 'approved' ? 'bg-green-100 text-green-800' :
                        review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {review.status}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Conversion Funnel */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Conversion Funnel</h4>
              <div className="space-y-3">
                {leadStats?.conversionFunnel && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                      <span className="text-sm font-medium">Leads Generated</span>
                      <span className="text-lg font-bold text-blue-600">
                        {leadStats.conversionFunnel.leads}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                      <span className="text-sm font-medium">Review Invites Sent</span>
                      <span className="text-lg font-bold text-yellow-600">
                        {leadStats.conversionFunnel.reviewInvitesSent}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                      <span className="text-sm font-medium">Reviews Completed</span>
                      <span className="text-lg font-bold text-green-600">
                        {leadStats.conversionFunnel.reviewsCompleted}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                      <span className="text-sm font-medium">Contacts Created</span>
                      <span className="text-lg font-bold text-purple-600">
                        {leadStats.conversionFunnel.contactsCreated}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Lead Sources */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Lead Sources</h4>
              {leadStats?.leadsBySource ? (
                <div className="space-y-2">
                  {Object.entries(leadStats.leadsBySource).map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {source.replace('-', ' ')}
                      </span>
                      <span className="text-sm font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No lead source data available</p>
              )}
            </div>

            {/* Response Time Metrics */}
            {leadStats?.timeToResponse && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Response Time</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-gray-900">
                      {leadStats.timeToResponse.average.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-600">Average</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-gray-900">
                      {leadStats.timeToResponse.median.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-600">Median</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}