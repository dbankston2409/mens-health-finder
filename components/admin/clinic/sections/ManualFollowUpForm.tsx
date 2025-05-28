import React, { useState } from 'react';
import { PhoneIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface FollowUpLog {
  id: string;
  method: 'call' | 'email' | 'dm' | 'meeting' | 'other';
  notes: string;
  outcome: 'positive' | 'neutral' | 'negative' | 'no_response' | 'callback_requested';
  by: string;
  timestamp: Date;
  resolved: boolean;
  nextAction?: string;
  reminderDate?: Date;
}

interface ManualFollowUpFormProps {
  clinicSlug: string;
  clinicName: string;
  onSuccess?: (log: FollowUpLog) => void;
}

export default function ManualFollowUpForm({ 
  clinicSlug, 
  clinicName, 
  onSuccess 
}: ManualFollowUpFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    method: 'call',
    notes: '',
    outcome: 'positive',
    resolved: false,
    nextAction: '',
    reminderDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.notes.trim()) {
      alert('Please enter notes about the follow-up');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const followUpLog: Partial<FollowUpLog> = {
        method: formData.method as FollowUpLog['method'],
        notes: formData.notes.trim(),
        outcome: formData.outcome as FollowUpLog['outcome'],
        by: 'current_user', // In production, get from auth context
        timestamp: new Date(),
        resolved: formData.resolved,
        nextAction: formData.nextAction.trim() || undefined,
        reminderDate: formData.reminderDate ? new Date(formData.reminderDate) : undefined
      };
      
      const response = await fetch('/api/admin/follow-up/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicSlug,
          followUpLog
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Reset form
        setFormData({
          method: 'call',
          notes: '',
          outcome: 'positive',
          resolved: false,
          nextAction: '',
          reminderDate: ''
        });
        
        setIsOpen(false);
        
        if (onSuccess) {
          onSuccess(result.followUpLog);
        }
        
        alert('Follow-up logged successfully');
      } else {
        alert('Failed to log follow-up');
      }
    } catch (error) {
      console.error('Error logging follow-up:', error);
      alert('Error logging follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'call':
        return <PhoneIcon className="h-4 w-4" />;
      case 'email':
        return <EnvelopeIcon className="h-4 w-4" />;
      case 'dm':
        return <ChatBubbleLeftRightIcon className="h-4 w-4" />;
      case 'meeting':
        return <CalendarIcon className="h-4 w-4" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-4 w-4" />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'neutral':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'no_response':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'callback_requested':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Manual Follow-Up</h3>
            <p className="text-xs text-gray-500">Log contact attempts with {clinicName}</p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PhoneIcon className="h-4 w-4 mr-2" />
            Log Follow-Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Log Manual Follow-Up</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Method
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { value: 'call', label: 'Phone Call', icon: PhoneIcon },
              { value: 'email', label: 'Email', icon: EnvelopeIcon },
              { value: 'dm', label: 'Direct Message', icon: ChatBubbleLeftRightIcon },
              { value: 'meeting', label: 'Meeting', icon: CalendarIcon },
              { value: 'other', label: 'Other', icon: ChatBubbleLeftRightIcon }
            ].map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setFormData({...formData, method: method.value})}
                className={`p-3 text-xs border rounded-lg flex flex-col items-center space-y-1 transition-colors ${
                  formData.method === method.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <method.icon className="h-4 w-4" />
                <span>{method.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes *
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe what happened during this contact attempt..."
            required
          />
        </div>
        
        {/* Outcome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Outcome
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'positive', label: 'Positive Response' },
              { value: 'neutral', label: 'Neutral/Info Only' },
              { value: 'negative', label: 'Not Interested' },
              { value: 'no_response', label: 'No Response' },
              { value: 'callback_requested', label: 'Callback Requested' }
            ].map((outcome) => (
              <button
                key={outcome.value}
                type="button"
                onClick={() => setFormData({...formData, outcome: outcome.value})}
                className={`p-2 text-sm border rounded-lg text-center transition-colors ${
                  formData.outcome === outcome.value
                    ? getOutcomeColor(outcome.value).replace('text-', 'border-').replace('bg-', 'bg-').replace('border-', 'border-')
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {outcome.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Next Action */}
        <div>
          <label htmlFor="nextAction" className="block text-sm font-medium text-gray-700 mb-1">
            Next Action (Optional)
          </label>
          <input
            type="text"
            id="nextAction"
            value={formData.nextAction}
            onChange={(e) => setFormData({...formData, nextAction: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What should be done next?"
          />
        </div>
        
        {/* Reminder Date */}
        <div>
          <label htmlFor="reminderDate" className="block text-sm font-medium text-gray-700 mb-1">
            Reminder Date (Optional)
          </label>
          <input
            type="datetime-local"
            id="reminderDate"
            value={formData.reminderDate}
            onChange={(e) => setFormData({...formData, reminderDate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Resolved Checkbox */}
        <div className="flex items-center">
          <input
            id="resolved"
            type="checkbox"
            checked={formData.resolved}
            onChange={(e) => setFormData({...formData, resolved: e.target.checked})}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="resolved" className="ml-2 block text-sm text-gray-700">
            Mark this follow-up as resolved (no further action needed)
          </label>
        </div>
        
        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.notes.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Logging...
              </>
            ) : (
              <>
                {getMethodIcon(formData.method)}
                <span className="ml-2">Log Follow-Up</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}