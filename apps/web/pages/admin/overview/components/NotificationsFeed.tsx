import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowPathIcon, BellIcon, CheckCircleIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { mockAdminMetrics } from '../../../../utils/dev/mockAdminData';

// Notification type
interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'alert';
  message: string;
  timestamp: Date;
  read: boolean;
  link?: {
    url: string;
    text: string;
  };
  clinicId?: string | number;
}

interface NotificationsFeedProps {
  onRefresh: () => void;
}

// Transform mock notifications from the shared data
const transformMockNotifications = (): Notification[] => {
  return mockAdminMetrics.notifications.map(notification => {
    // Map the notification type to our component's expected types
    let type: 'info' | 'warning' | 'success' | 'error' = 'info';
    if (notification.type === 'alert') type = 'error';
    else if (notification.type === 'warning') type = 'warning';
    else if (notification.type === 'success') type = 'success';
    
    // Create a link to the clinic if clinicId is present
    const link = notification.clinicId ? {
      url: `/admin/clinic/${notification.clinicId}`,
      text: 'View Clinic'
    } : undefined;
    
    return {
      id: notification.id,
      type,
      message: notification.message,
      timestamp: notification.timestamp,
      read: Math.random() > 0.5, // Randomly mark some as read for demo
      link,
      clinicId: notification.clinicId
    };
  });
};

const NotificationsFeed: React.FC<NotificationsFeedProps> = ({ onRefresh }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Load mock notifications on component mount
  useEffect(() => {
    setNotifications(transformMockNotifications());
  }, []);
  
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'info':
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <BellIcon className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {unreadCount} new
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={onRefresh}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Refresh"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No notifications
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`p-3 rounded-lg relative ${
                notification.read 
                  ? 'bg-gray-50 dark:bg-gray-700/50' 
                  : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600'
              }`}
            >
              <div className="flex">
                <div className="flex-shrink-0 mt-0.5 mr-3">
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                    {notification.message}
                  </p>
                  
                  <div className="mt-1 flex items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                    
                    {notification.link && (
                      <>
                        <span className="mx-1">•</span>
                        <Link href={notification.link.url} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                          {notification.link.text}
                        </Link>
                      </>
                    )}
                    
                    {notification.clinicId && !notification.link && (
                      <>
                        <span className="mx-1">•</span>
                        <Link href={`/admin/clinic/${notification.clinicId}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                          View Clinic
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Mark as read"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 text-center">
        <Link href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          View all notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationsFeed;