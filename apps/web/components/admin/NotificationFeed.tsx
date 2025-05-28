import React, { useState, useEffect } from 'react';

// Local type definitions for notifications
interface PushNotification {
  id?: string;
  type: 'achievement' | 'reminder' | 'seo-issue' | 'milestone';
  title: string;
  message: string;
  timestamp?: Date;
  isRead?: boolean;
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  category?: string;
  clinicSlug?: string;
}

// Mock notification queue for web app
const notificationQueue = {
  markAsRead: async (id: string, clinicSlug: string) => {
    console.log('Mark as read:', id, clinicSlug);
  },
  dismiss: async (id: string, clinicSlug: string) => {
    console.log('Dismiss notification:', id, clinicSlug);
  }
};

interface NotificationFeedProps {
  clinicSlug: string;
  maxItems?: number;
  showFilters?: boolean;
  onNotificationClick?: (notification: PushNotification) => void;
  className?: string;
}

type FilterType = 'all' | 'unread' | 'achievement' | 'reminder' | 'seo-issue' | 'milestone';

const NotificationFeed: React.FC<NotificationFeedProps> = ({
  clinicSlug,
  maxItems = 20,
  showFilters = true,
  onNotificationClick,
  className = ''
}) => {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Load notifications on mount and when filter changes
  useEffect(() => {
    loadNotifications();
  }, [clinicSlug, filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine filter options
      const options: any = { limit: maxItems };
      
      if (filter === 'unread') {
        options.unreadOnly = true;
      } else if (filter !== 'all') {
        options.category = filter === 'seo-issue' ? 'seo' : filter;
      }

      // In a real app, this would be an API call
      // For now, we'll simulate loading notifications
      const mockNotifications = await getMockNotifications(clinicSlug, options);
      
      setNotifications(mockNotifications);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notification: PushNotification) => {
    if (notification.readAt) return;

    try {
      // Mark as read
      await notificationQueue.markAsRead(notification.id!, clinicSlug);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id
            ? { ...n, readAt: new Date() }
            : n
        )
      );

      onNotificationClick?.(notification);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDismiss = async (notification: PushNotification, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      await notificationQueue.dismiss(notification.id!, clinicSlug);
      
      // Remove from local state
      setNotifications(prev =>
        prev.filter(n => n.id !== notification.id)
      );
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return '🏆';
      case 'seo-issue':
        return '📈';
      case 'reminder':
        return '⏰';
      case 'milestone':
        return '🎉';
      case 'warning':
        return '⚠️';
      case 'tip':
        return '💡';
      default:
        return '📱';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'low':
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
      default:
        return 'border-gray-300 bg-white dark:bg-gray-800';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;

  if (loading && notifications.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Refresh notifications"
        >
          <svg
            className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: 'Unread' },
            { key: 'achievement', label: 'Achievements' },
            { key: 'reminder', label: 'Reminders' },
            { key: 'seo-issue', label: 'SEO' },
            { key: 'milestone', label: 'Milestones' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as FilterType)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleMarkAsRead(notification)}
              className={`
                relative border-l-4 rounded-lg p-4 cursor-pointer transition-all duration-200
                ${getPriorityColor(notification.priority || 'low')}
                ${!notification.readAt ? 'shadow-md hover:shadow-lg' : 'opacity-75'}
                hover:transform hover:-translate-y-0.5
              `}
            >
              {/* Unread indicator */}
              {!notification.readAt && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>
              )}

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                      {notification.title}
                    </h4>
                    
                    {/* Dismiss button */}
                    <button
                      onClick={(e) => handleDismiss(notification, e)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                      title="Dismiss notification"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 leading-relaxed">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(notification.createdAt || notification.timestamp)}
                    </span>
                    
                    {notification.actionUrl && notification.actionText && (
                      <a
                        href={notification.actionUrl}
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:text-red-600 text-xs font-medium"
                      >
                        {notification.actionText} →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {notifications.length >= maxItems && (
        <div className="text-center mt-4">
          <button
            onClick={() => {
              // Load more logic would go here
              console.log('Load more notifications');
            }}
            className="text-primary hover:text-red-600 text-sm font-medium"
          >
            Load more notifications
          </button>
        </div>
      )}
    </div>
  );
};

// Mock function to simulate API call
async function getMockNotifications(clinicSlug: string, options: any): Promise<PushNotification[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockNotifications: PushNotification[] = [
    {
      id: '1',
      clinicSlug,
      type: 'achievement',
      priority: 'low',
      title: '🏆 Achievement Unlocked: SEO Champion',
      message: 'Congratulations! Your SEO score has reached 85/100, earning you the SEO Champion badge.',
      category: 'gamification',
      actionUrl: '/admin/achievements',
      actionText: 'View Achievement',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      clinicSlug,
      type: 'seo-issue',
      priority: 'high',
      title: '📈 SEO Score Alert',
      message: 'Your SEO score dropped to 68/100. Take action to improve your search visibility.',
      category: 'seo',
      actionUrl: '/admin/seo',
      actionText: 'Improve SEO',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 20 * 60 * 60 * 1000) // Read 20 hours ago
    },
    {
      id: '3',
      clinicSlug,
      type: 'milestone',
      priority: 'medium',
      title: '🎉 Milestone Reached!',
      message: 'Your clinic just hit 100 profile views this month! Keep up the great work.',
      category: 'milestone',
      actionUrl: '/admin/analytics',
      actionText: 'View Analytics',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Read 2 days ago
    },
    {
      id: '4',
      clinicSlug,
      type: 'reminder',
      priority: 'medium',
      title: '📞 Add Your Phone Number',
      message: 'Clinics with phone numbers get 3x more calls. Add your contact information to boost engagement.',
      category: 'profile',
      actionUrl: '/admin/profile',
      actionText: 'Update Profile',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  ];
  
  // Apply filters
  let filtered = mockNotifications;
  
  if (options.unreadOnly) {
    filtered = filtered.filter(n => !n.readAt);
  }
  
  if (options.category) {
    filtered = filtered.filter(n => n.category === options.category);
  }
  
  return filtered.slice(0, options.limit || 20);
}

export default NotificationFeed;