import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface SystemAlert {
  id: string;
  type: string;
  severity: 'info' | 'warn' | 'critical';
  title: string;
  message: string;
  clinicSlug?: string;
  data?: Record<string, any>;
  createdAt: Date;
  resolvedAt?: Date;
  actionRequired?: boolean;
}

interface AlertNotificationFeedProps {
  maxAlerts?: number;
  showActions?: boolean;
  autoRefresh?: boolean;
}

export default function AlertNotificationFeed({ 
  maxAlerts = 20,
  showActions = true,
  autoRefresh = true
}: AlertNotificationFeedProps) {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingAlert, setResolvingAlert] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warn' | 'info'>('all');

  useEffect(() => {
    fetchAlerts();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [maxAlerts, autoRefresh]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/alerts?limit=${maxAlerts}`);
      const data = await response.json();
      
      if (data.alerts) {
        // Convert date strings back to Date objects
        const alertsWithDates = data.alerts.map((alert: any) => ({
          ...alert,
          createdAt: new Date(alert.createdAt),
          resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined
        }));
        setAlerts(alertsWithDates);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      setResolvingAlert(alertId);
      const response = await fetch('/api/admin/resolve-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });
      
      if (response.ok) {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
      } else {
        alert('Failed to resolve alert');
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      alert('Error resolving alert');
    } finally {
      setResolvingAlert(null);
    }
  };

  const handleSnoozeAlert = async (alertId: string) => {
    // Hide alert for 24 hours (implement snooze logic)
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📋';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warn': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'ghosted_premium_clinic': return '👻';
      case 'high_traffic_free_clinic': return '📈';
      case 'incomplete_verification': return '✅';
      case 'premium_not_indexed': return '🔍';
      case 'low_seo_score_paid': return '📊';
      case 'missing_call_tracking': return '📞';
      default: return '🔔';
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    filter === 'all' || alert.severity === filter
  );

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
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
        <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
        
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Alerts</option>
            <option value="critical">Critical</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
          </select>
          
          <button
            onClick={fetchAlerts}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No alerts found</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter !== 'all' ? `No ${filter} alerts` : 'System is running smoothly'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} transition-all hover:shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {getAlertTypeIcon(alert.type)}
                    </span>
                    <span className="text-lg">
                      {getSeverityIcon(alert.severity)}
                    </span>
                    <span className="font-medium text-gray-900">
                      {alert.title}
                    </span>
                    {alert.actionRequired && (
                      <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                        Action Required
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {alert.message}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{getTimeAgo(alert.createdAt)}</span>
                    {alert.clinicSlug && (
                      <Link
                        href={`/admin/clinic/${alert.clinicSlug}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Clinic →
                      </Link>
                    )}
                    {alert.data?.clicks30d !== undefined && (
                      <span>{alert.data.clicks30d} clicks</span>
                    )}
                    {alert.data?.package && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {alert.data.package}
                      </span>
                    )}
                  </div>
                </div>
                
                {showActions && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleSnoozeAlert(alert.id)}
                      className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Snooze
                    </button>
                    
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      disabled={resolvingAlert === alert.id}
                      className="px-2 py-1 text-xs text-green-600 bg-green-100 rounded hover:bg-green-200 disabled:opacity-50 transition-colors"
                    >
                      {resolvingAlert === alert.id ? 'Resolving...' : 'Resolve'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {filteredAlerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              {filteredAlerts.length} {filter !== 'all' ? filter : ''} alerts
            </span>
            
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                🚨 {alerts.filter(a => a.severity === 'critical').length}
              </span>
              <span className="flex items-center gap-1">
                ⚠️ {alerts.filter(a => a.severity === 'warn').length}
              </span>
              <span className="flex items-center gap-1">
                ℹ️ {alerts.filter(a => a.severity === 'info').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}