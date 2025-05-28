import React, { useState } from 'react';
import { useAdminMetrics } from '../../../utils/admin/useAdminMetrics';

// Format date to a more readable format
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMin < 60) {
    return `${diffMin} min${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

const AlertNotificationFeed: React.FC = () => {
  const { alerts, loading, error } = useAdminMetrics();
  const [filter, setFilter] = useState<'all' | 'unread' | 'action'>('all');

  // Filter alerts based on selected filter
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.read;
    if (filter === 'action') return alert.actionRequired;
    return true;
  });

  // Count unread and action required alerts
  const unreadCount = alerts.filter(alert => !alert.read).length;
  const actionRequiredCount = alerts.filter(alert => alert.actionRequired).length;

  if (loading) {
    return (
      <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl h-full">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl h-full">
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-md font-medium mb-1">Error Loading Alerts</h3>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h3 className="text-lg font-bold">Alerts & Notifications</h3>
          {unreadCount > 0 && (
            <div className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-primary text-white">
              {unreadCount} new
            </div>
          )}
        </div>
        <div className="flex space-x-1 bg-[#0A0A0A] rounded-md p-1">
          <button
            className={`px-3 py-1 text-xs rounded ${filter === 'all' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`px-3 py-1 text-xs rounded ${filter === 'unread' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`px-3 py-1 text-xs rounded ${filter === 'action' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setFilter('action')}
          >
            Actions ({actionRequiredCount})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <p>No alerts matching your filter</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`bg-[#0A0A0A] rounded-lg border ${!alert.read ? 'border-primary' : 'border-[#222222]'} p-4 flex`}
            >
              <div className="mr-4">
                {alert.type === 'warning' && (
                  <div className="w-8 h-8 rounded-full bg-yellow-500 bg-opacity-20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                )}
                {alert.type === 'info' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                {alert.type === 'success' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 bg-opacity-20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                {alert.type === 'error' && (
                  <div className="w-8 h-8 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm mb-1">{alert.message}</p>
                    <span className="text-xs text-gray-400">{formatDate(alert.date)}</span>
                  </div>
                  {!alert.read && (
                    <div className="ml-2 w-2 h-2 rounded-full bg-primary"></div>
                  )}
                </div>

                {alert.actionRequired && (
                  <div className="mt-3 flex items-center">
                    <button className="mr-2 px-3 py-1 text-xs bg-primary text-white rounded hover:bg-red-600 transition-colors">
                      Take Action
                    </button>
                    <button className="px-3 py-1 text-xs bg-[#222222] text-gray-300 rounded hover:bg-[#333333] transition-colors">
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {filteredAlerts.length > 0 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-primary hover:text-red-400 font-medium">
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertNotificationFeed;