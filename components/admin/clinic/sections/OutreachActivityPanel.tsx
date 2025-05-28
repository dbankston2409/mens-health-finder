import React, { useState, useEffect } from 'react';
import { EnvelopeIcon, DevicePhoneMobileIcon, EyeIcon, CursorArrowRaysIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface OutreachMessage {
  id: string;
  type: 'email' | 'sms';
  campaignType: string;
  subject: string;
  body: string;
  recipient: string;
  status: 'pending' | 'sent' | 'failed' | 'responded';
  scheduledFor: Date;
  sentAt?: Date;
  opened?: boolean;
  openedAt?: Date;
  clicked?: boolean;
  clickedAt?: Date;
  replied?: boolean;
  repliedAt?: Date;
  bounced?: boolean;
  priority: 'normal' | 'high';
}

interface OutreachStats {
  totalSent: number;
  emailsSent: number;
  smsSent: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  responseRate: number;
}

interface OutreachActivityPanelProps {
  clinicSlug: string;
  clinicName: string;
}

export default function OutreachActivityPanel({ clinicSlug, clinicName }: OutreachActivityPanelProps) {
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [stats, setStats] = useState<OutreachStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    campaignType: string;
    messageType: string;
    status: string;
    timeRange: string;
  }>({
    campaignType: 'all',
    messageType: 'all',
    status: 'all',
    timeRange: '30d'
  });

  useEffect(() => {
    fetchOutreachData();
  }, [clinicSlug, filter]);

  const fetchOutreachData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        clinicSlug,
        ...filter
      });
      
      const response = await fetch(`/api/admin/outreach/activity?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching outreach data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (message: OutreachMessage) => {
    if (message.replied) {
      return <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-500" />;
    } else if (message.clicked) {
      return <CursorArrowRaysIcon className="h-4 w-4 text-blue-500" />;
    } else if (message.opened) {
      return <EyeIcon className="h-4 w-4 text-yellow-500" />;
    } else if (message.status === 'sent') {
      return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    } else if (message.status === 'failed') {
      return <div className="h-4 w-4 rounded-full bg-red-500" />;
    } else {
      return <div className="h-4 w-4 rounded-full bg-gray-200" />;
    }
  };

  const getStatusText = (message: OutreachMessage) => {
    if (message.replied) return 'Replied';
    if (message.clicked) return 'Clicked';
    if (message.opened) return 'Opened';
    if (message.bounced) return 'Bounced';
    if (message.status === 'sent') return 'Delivered';
    if (message.status === 'failed') return 'Failed';
    if (message.status === 'pending') return 'Pending';
    return 'Unknown';
  };

  const getCampaignColor = (campaignType: string) => {
    const colors = {
      upgrade: 'bg-blue-100 text-blue-800',
      feature_upsell: 'bg-green-100 text-green-800',
      retention: 'bg-yellow-100 text-yellow-800',
      reactivation: 'bg-purple-100 text-purple-800',
      new_feature: 'bg-indigo-100 text-indigo-800'
    };
    return colors[campaignType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatTimelineDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Outreach Activity</h3>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <select
            value={filter.campaignType}
            onChange={(e) => setFilter({...filter, campaignType: e.target.value})}
            className="text-sm border border-gray-300 rounded px-3 py-1"
          >
            <option value="all">All Campaigns</option>
            <option value="upgrade">Upgrade</option>
            <option value="feature_upsell">Feature Upsell</option>
            <option value="retention">Retention</option>
            <option value="reactivation">Reactivation</option>
            <option value="new_feature">New Feature</option>
          </select>
          
          <select
            value={filter.messageType}
            onChange={(e) => setFilter({...filter, messageType: e.target.value})}
            className="text-sm border border-gray-300 rounded px-3 py-1"
          >
            <option value="all">All Types</option>
            <option value="email">Email Only</option>
            <option value="sms">SMS Only</option>
          </select>
          
          <select
            value={filter.status}
            onChange={(e) => setFilter({...filter, status: e.target.value})}
            className="text-sm border border-gray-300 rounded px-3 py-1"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="opened">Opened</option>
            <option value="clicked">Clicked</option>
            <option value="replied">Replied</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={filter.timeRange}
            onChange={(e) => setFilter({...filter, timeRange: e.target.value})}
            className="text-sm border border-gray-300 rounded px-3 py-1"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
        
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalSent}</div>
              <div className="text-sm text-blue-700">Messages Sent</div>
              <div className="text-xs text-blue-600">
                {stats.emailsSent} emails, {stats.smsSent} SMS
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.openRate.toFixed(1)}%</div>
              <div className="text-sm text-yellow-700">Open Rate</div>
              <div className="text-xs text-yellow-600">
                {stats.clickRate.toFixed(1)}% click rate
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{stats.responseRate.toFixed(1)}%</div>
              <div className="text-sm text-green-700">Response Rate</div>
              <div className="text-xs text-green-600">
                {stats.replyRate.toFixed(1)}% replied
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{stats.bounceRate.toFixed(1)}%</div>
              <div className="text-sm text-red-700">Bounce Rate</div>
              <div className="text-xs text-red-600">
                Failed deliveries
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages Timeline */}
      <div className="p-6">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No outreach messages found</p>
            <p className="text-sm text-gray-400 mt-1">
              Messages will appear here when outreach campaigns are sent
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={message.id} className="relative">
                {/* Timeline connector */}
                {index < messages.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Timeline marker */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-gray-200">
                      {message.type === 'email' ? (
                        <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                      ) : (
                        <DevicePhoneMobileIcon className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                  
                  {/* Message content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCampaignColor(message.campaignType)}`}>
                            {message.campaignType.replace('_', ' ')}
                          </span>
                          {message.priority === 'high' && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              High Priority
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {message.sentAt ? formatTimelineDate(message.sentAt) : 'Pending'}
                        </span>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-1">
                        {message.subject}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {message.body}
                      </p>
                      
                      {/* Engagement tracking */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(message)}
                            <span className="text-gray-600">{getStatusText(message)}</span>
                          </div>
                          
                          {message.sentAt && message.openedAt && (
                            <span className="text-gray-500">
                              Opened {formatTimelineDate(message.openedAt)}
                            </span>
                          )}
                          
                          {message.clickedAt && (
                            <span className="text-blue-600">
                              Clicked {formatTimelineDate(message.clickedAt)}
                            </span>
                          )}
                          
                          {message.repliedAt && (
                            <span className="text-green-600">
                              Replied {formatTimelineDate(message.repliedAt)}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {message.type.toUpperCase()} to {message.recipient}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {messages.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setFilter({...filter, timeRange: 'all'})}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all outreach history
            </button>
          </div>
        )}
      </div>
    </div>
  );
}