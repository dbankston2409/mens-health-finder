import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClockIcon, ExclamationTriangleIcon, CheckIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface FollowUpReminder {
  id: string;
  clinicSlug: string;
  clinicName: string;
  type: 'manual' | 'automated' | 'sales_lead';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  dueDate: Date;
  createdDate: Date;
  assignedTo?: string;
  lastContactDate?: Date;
  contactMethod?: string;
  tags: string[];
  isOverdue: boolean;
  daysPastDue?: number;
}

interface FollowUpRemindersWidgetProps {
  maxItems?: number;
  showFilters?: boolean;
}

export default function FollowUpRemindersWidget({ 
  maxItems = 10, 
  showFilters = false 
}: FollowUpRemindersWidgetProps) {
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    priority: string;
    type: string;
    overdue: boolean;
  }>({
    priority: 'all',
    type: 'all',
    overdue: false
  });
  const [processingReminder, setProcessingReminder] = useState<string | null>(null);

  useEffect(() => {
    fetchReminders();
  }, [filter, maxItems]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: maxItems.toString(),
        ...filter
      });
      
      const response = await fetch(`/api/admin/follow-up/reminders?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.error('Error fetching follow-up reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (reminderId: string) => {
    try {
      setProcessingReminder(reminderId);
      
      const response = await fetch('/api/admin/follow-up/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderId })
      });
      
      if (response.ok) {
        setReminders(reminders.filter(r => r.id !== reminderId));
      } else {
        alert('Failed to mark reminder as complete');
      }
    } catch (error) {
      console.error('Error marking reminder complete:', error);
      alert('Error marking reminder complete');
    } finally {
      setProcessingReminder(null);
    }
  };

  const handleSnooze = async (reminderId: string, days: number) => {
    try {
      setProcessingReminder(reminderId);
      
      const response = await fetch('/api/admin/follow-up/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderId, days })
      });
      
      if (response.ok) {
        fetchReminders(); // Refresh the list
      } else {
        alert('Failed to snooze reminder');
      }
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      alert('Error snoozing reminder');
    } finally {
      setProcessingReminder(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      case 'high':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sales_lead':
        return '🎯';
      case 'automated':
        return '🤖';
      case 'manual':
        return '👤';
      default:
        return '📋';
    }
  };

  const formatDueDate = (date: Date, isOverdue: boolean, daysPastDue?: number) => {
    if (isOverdue && daysPastDue) {
      return `${daysPastDue} days overdue`;
    }
    
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays > 0) return `Due in ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  const getTotalsByPriority = () => {
    return reminders.reduce((acc, reminder) => {
      acc[reminder.priority] = (acc[reminder.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const priorityTotals = getTotalsByPriority();

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
          <h3 className="text-lg font-semibold text-gray-900">Follow-Up Reminders</h3>
          <Link href="/admin/follow-up">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View All
            </button>
          </Link>
        </div>
        
        {/* Summary Stats */}
        <div className="flex items-center space-x-4 text-sm">
          {Object.entries(priorityTotals).map(([priority, count]) => (
            <div key={priority} className="flex items-center space-x-1">
              {getPriorityIcon(priority)}
              <span className="font-medium">{count}</span>
              <span className="text-gray-600 capitalize">{priority}</span>
            </div>
          ))}
        </div>
        
        {showFilters && (
          <div className="flex space-x-4 mt-4">
            <select
              value={filter.priority}
              onChange={(e) => setFilter({...filter, priority: e.target.value})}
              className="text-sm border border-gray-300 rounded px-3 py-1"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={filter.type}
              onChange={(e) => setFilter({...filter, type: e.target.value})}
              className="text-sm border border-gray-300 rounded px-3 py-1"
            >
              <option value="all">All Types</option>
              <option value="sales_lead">Sales Leads</option>
              <option value="manual">Manual</option>
              <option value="automated">Automated</option>
            </select>
            
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={filter.overdue}
                onChange={(e) => setFilter({...filter, overdue: e.target.checked})}
                className="mr-2"
              />
              Overdue Only
            </label>
          </div>
        )}
      </div>

      {/* Reminders List */}
      <div className="divide-y divide-gray-200">
        {reminders.length === 0 ? (
          <div className="p-8 text-center">
            <CheckIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-500">No follow-up reminders</p>
            <p className="text-sm text-gray-400 mt-1">
              You're all caught up! New reminders will appear here.
            </p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div key={reminder.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getTypeIcon(reminder.type)}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(reminder.priority)}`}>
                      {reminder.priority.toUpperCase()}
                    </span>
                    {reminder.isOverdue && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        OVERDUE
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <Link href={`/admin/clinic/${reminder.clinicSlug}`}>
                      <h4 className="font-medium text-gray-900 hover:text-blue-600">
                        {reminder.title}
                      </h4>
                    </Link>
                    <p className="text-sm text-gray-600">{reminder.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{reminder.clinicName}</span>
                    <span>
                      {formatDueDate(reminder.dueDate, reminder.isOverdue, reminder.daysPastDue)}
                    </span>
                    {reminder.lastContactDate && (
                      <span>
                        Last contact: {new Date(reminder.lastContactDate).toLocaleDateString()}
                      </span>
                    )}
                    {reminder.assignedTo && (
                      <span>Assigned to: {reminder.assignedTo}</span>
                    )}
                  </div>
                  
                  {reminder.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {reminder.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleMarkComplete(reminder.id)}
                    disabled={processingReminder === reminder.id}
                    className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckIcon className="h-3 w-3 mr-1" />
                    Complete
                  </button>
                  
                  <div className="relative group">
                    <button className="inline-flex items-center px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Snooze
                    </button>
                    
                    {/* Snooze dropdown */}
                    <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button
                        onClick={() => handleSnooze(reminder.id, 1)}
                        className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        1 day
                      </button>
                      <button
                        onClick={() => handleSnooze(reminder.id, 3)}
                        className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        3 days
                      </button>
                      <button
                        onClick={() => handleSnooze(reminder.id, 7)}
                        className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        1 week
                      </button>
                    </div>
                  </div>
                  
                  <Link href={`/admin/clinic/${reminder.clinicSlug}#follow-up`}>
                    <button className="text-xs text-blue-600 hover:text-blue-800">
                      View Log
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {reminders.length > 0 && (
        <div className="border-t border-gray-200 p-4 text-center">
          <Link href="/admin/follow-up">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View all {reminders.length}+ follow-up items →
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}