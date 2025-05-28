import React, { useState } from 'react';
import { CrmContact, CrmActivity } from '../../../utils/crm/crmContactModel';
import { TierBadge } from '../../TierBadge';
import { Tooltip } from '../../Tooltip';

interface ContactDetailCardProps {
  contact: CrmContact;
  activities: CrmActivity[];
  onUpdate: (contactId: string, updates: Partial<CrmContact>) => void;
  onAddActivity: (contactId: string, activity: Omit<CrmActivity, 'id' | 'createdAt' | 'createdBy'>) => void;
}

export const ContactDetailCard: React.FC<ContactDetailCardProps> = ({
  contact,
  activities,
  onUpdate,
  onAddActivity
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(contact);
  const [newActivityType, setNewActivityType] = useState<'email' | 'call' | 'meeting' | 'note'>('note');
  const [newActivitySubject, setNewActivitySubject] = useState('');
  const [newActivityDescription, setNewActivityDescription] = useState('');

  const handleSave = () => {
    onUpdate(contact.id, editData);
    setIsEditing(false);
  };

  const handleAddActivity = () => {
    if (!newActivitySubject.trim()) return;
    
    onAddActivity(contact.id, {
      contactId: contact.id,
      clinicSlug: contact.clinicSlug,
      type: newActivityType,
      subject: newActivitySubject,
      description: newActivityDescription,
      requiresFollowUp: false,
      isAutomated: false
    });
    
    setNewActivitySubject('');
    setNewActivityDescription('');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-purple-100 text-purple-800',
      qualified: 'bg-yellow-100 text-yellow-800',
      proposal: 'bg-green-100 text-green-800',
      negotiation: 'bg-red-100 text-red-800',
      closed_won: 'bg-emerald-100 text-emerald-800',
      closed_lost: 'bg-gray-100 text-gray-800',
      nurturing: 'bg-indigo-100 text-indigo-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-yellow-500',
      high: 'text-orange-500',
      urgent: 'text-red-500'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {contact.firstName} {contact.lastName}
            </h3>
            <p className="text-gray-600">
              {contact.title && `${contact.title} at `}{contact.company}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                {contact.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(contact.priority)}`}>
                {contact.priority.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <TierBadge score={contact.leadScore} size="sm" />
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          {isEditing && (
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-20 text-sm text-gray-500">Email:</span>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline text-sm">
                  {contact.email}
                </a>
              )}
            </div>
            
            {contact.phone && (
              <div className="flex items-center">
                <span className="w-20 text-sm text-gray-500">Phone:</span>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                  />
                ) : (
                  <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline text-sm">
                    {contact.phone}
                  </a>
                )}
              </div>
            )}
            
            <div className="flex items-center">
              <span className="w-20 text-sm text-gray-500">Source:</span>
              <span className="text-sm text-gray-900 capitalize">
                {contact.leadSource.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Pipeline Information</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-24 text-sm text-gray-500">Stage:</span>
              <span className="text-sm text-gray-900">{contact.pipelineStage}</span>
            </div>
            
            {contact.estimatedValue && (
              <div className="flex items-center">
                <span className="w-24 text-sm text-gray-500">Est. Value:</span>
                <span className="text-sm text-gray-900">
                  ${contact.estimatedValue.toLocaleString()}
                </span>
              </div>
            )}
            
            {contact.closeProbability && (
              <div className="flex items-center">
                <span className="w-24 text-sm text-gray-500">Close Prob:</span>
                <span className="text-sm text-gray-900">{contact.closeProbability}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Engagement</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-lg font-semibold text-gray-900">{contact.totalInteractions}</div>
            <div className="text-xs text-gray-500">Interactions</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-lg font-semibold text-gray-900">{contact.emailOpens}</div>
            <div className="text-xs text-gray-500">Email Opens</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-lg font-semibold text-gray-900">{contact.emailClicks}</div>
            <div className="text-xs text-gray-500">Email Clicks</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-lg font-semibold text-gray-900">{contact.websiteVisits}</div>
            <div className="text-xs text-gray-500">Website Visits</div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">
                  {activity.type.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.subject}</p>
                {activity.description && (
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {activity.createdAt.toDate().toLocaleDateString()} • {activity.type}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Activity */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Add Activity</h4>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <select
              value={newActivityType}
              onChange={(e) => setNewActivityType(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="note">Note</option>
              <option value="email">Email</option>
              <option value="call">Call</option>
              <option value="meeting">Meeting</option>
            </select>
            
            <input
              type="text"
              placeholder="Activity subject..."
              value={newActivitySubject}
              onChange={(e) => setNewActivitySubject(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          
          <textarea
            placeholder="Activity description (optional)..."
            value={newActivityDescription}
            onChange={(e) => setNewActivityDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          
          <button
            onClick={handleAddActivity}
            disabled={!newActivitySubject.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-300"
          >
            Add Activity
          </button>
        </div>
      </div>
    </div>
  );
};