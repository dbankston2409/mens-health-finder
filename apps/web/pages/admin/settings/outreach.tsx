import React, { useState, useEffect } from 'react';
import { EnvelopeIcon, DevicePhoneMobileIcon, ClockIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface OutreachConfig {
  enabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  maxPerDay: number;
  sendingHours: {
    start: number;
    end: number;
    timezone: string;
  };
  excludeWeekends: boolean;
  rateLimiting: {
    emailsPerHour: number;
    smsPerHour: number;
  };
  templates: {
    upgrade: {
      subject: string;
      enabled: boolean;
    };
    feature_upsell: {
      subject: string;
      enabled: boolean;
    };
    retention: {
      subject: string;
      enabled: boolean;
    };
    reactivation: {
      subject: string;
      enabled: boolean;
    };
    new_feature: {
      subject: string;
      enabled: boolean;
    };
  };
  targeting: {
    highTrafficThreshold: number;
    minEngagementScore: number;
    excludeRecentlyContacted: boolean;
    daysSinceLastContact: number;
    targetTiers: string[];
    excludeTags: string[];
  };
  autoReply: {
    enabled: boolean;
    escalationEnabled: boolean;
    salesNotificationEmail: string;
  };
}

export default function OutreachSettingsPanel() {
  const [config, setConfig] = useState<OutreachConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'templates' | 'targeting' | 'automation'>('general');

  useEffect(() => {
    fetchOutreachConfig();
  }, []);

  const fetchOutreachConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings/outreach');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error fetching outreach config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert('Outreach settings saved successfully');
      } else {
        alert('Failed to save outreach settings');
      }
    } catch (error) {
      console.error('Error saving outreach config:', error);
      alert('Error saving outreach settings');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (path: string, value: any) => {
    if (!config) return;
    
    const newConfig = { ...config };
    const keys = path.split('.');
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  const getTimezoneOptions = () => {
    return [
      'America/New_York',
      'America/Chicago', 
      'America/Denver',
      'America/Los_Angeles',
      'America/Phoenix',
      'UTC'
    ];
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-red-400">Failed to load outreach configuration</p>
          <button 
            onClick={fetchOutreachConfig}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Outreach Settings</h1>
        <p className="text-gray-400">
          Configure automated outreach campaigns, templates, and targeting rules.
        </p>
      </div>

      {/* Global Enable/Disable */}
      <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white">Outreach System</h3>
            <p className="text-sm text-gray-400">
              Master switch for all automated outreach functionality
            </p>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => updateConfig('enabled', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded bg-gray-800"
            />
            <span className="ml-2 text-sm text-gray-300">
              {config.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
        
        {!config.enabled && (
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-md">
            <p className="text-sm text-yellow-400">
              ⚠️ Outreach is currently disabled. No automated messages will be sent.
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-lg">
        <div className="border-b border-[#222222]">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'general', label: 'General', icon: Cog6ToothIcon },
              { key: 'templates', label: 'Templates', icon: EnvelopeIcon },
              { key: 'targeting', label: 'Targeting', icon: DevicePhoneMobileIcon },
              { key: 'automation', label: 'Automation', icon: ClockIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Channel Settings */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Message Channels</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border border-[#222222] rounded-lg bg-gray-800">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-white">Email</div>
                        <div className="text-sm text-gray-400">Send outreach via email</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.emailEnabled}
                      onChange={(e) => updateConfig('emailEnabled', e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded bg-gray-700"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-[#222222] rounded-lg bg-gray-800">
                    <div className="flex items-center">
                      <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-white">SMS</div>
                        <div className="text-sm text-gray-400">Send outreach via text message</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.smsEnabled}
                      onChange={(e) => updateConfig('smsEnabled', e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Sending Limits */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Sending Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Max Messages Per Day
                    </label>
                    <input
                      type="number"
                      value={config.maxPerDay}
                      onChange={(e) => updateConfig('maxPerDay', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800 border border-[#222222] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Timezone
                    </label>
                    <select
                      value={config.sendingHours.timezone}
                      onChange={(e) => updateConfig('sendingHours.timezone', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-[#222222] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {getTimezoneOptions().map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sending Hours */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Sending Hours</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Start Hour (24h format)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={config.sendingHours.start}
                      onChange={(e) => updateConfig('sendingHours.start', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800 border border-[#222222] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      End Hour (24h format)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={config.sendingHours.end}
                      onChange={(e) => updateConfig('sendingHours.end', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800 border border-[#222222] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.excludeWeekends}
                        onChange={(e) => updateConfig('excludeWeekends', e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-300">Exclude weekends</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Template Settings */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Email Subject Templates</h3>
              <p className="text-sm text-gray-400 mb-4">
                Configure default subject lines for different campaign types. Use variables like {'{clinic_name}'}, {'{location}'}, {'{clicks}'}.
              </p>
              
              {Object.entries(config.templates).map(([type, template]) => (
                <div key={type} className="border border-[#222222] rounded-lg p-4 bg-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white capitalize">
                      {type.replace('_', ' ')} Campaign
                    </h4>
                    <input
                      type="checkbox"
                      checked={template.enabled}
                      onChange={(e) => updateConfig(`templates.${type}.enabled`, e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded bg-gray-700"
                    />
                  </div>
                  
                  <input
                    type="text"
                    value={template.subject}
                    onChange={(e) => updateConfig(`templates.${type}.subject`, e.target.value)}
                    disabled={!template.enabled}
                    placeholder={`Default ${type} subject line...`}
                    className="w-full px-3 py-2 bg-gray-900 border border-[#222222] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-950 disabled:text-gray-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Targeting Settings */}
          {activeTab === 'targeting' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Targeting Rules</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    High Traffic Threshold (clicks/month)
                  </label>
                  <input
                    type="number"
                    value={config.targeting.highTrafficThreshold}
                    onChange={(e) => updateConfig('targeting.highTrafficThreshold', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-[#222222] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Min Engagement Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.targeting.minEngagementScore}
                    onChange={(e) => updateConfig('targeting.minEngagementScore', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-[#222222] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.targeting.excludeRecentlyContacted}
                    onChange={(e) => updateConfig('targeting.excludeRecentlyContacted', e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded bg-gray-700"
                  />
                  <span className="ml-2 text-sm text-gray-300">
                    Exclude recently contacted clinics
                  </span>
                </label>
                
                {config.targeting.excludeRecentlyContacted && (
                  <div className="mt-2 ml-6">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Days since last contact
                    </label>
                    <input
                      type="number"
                      value={config.targeting.daysSinceLastContact}
                      onChange={(e) => updateConfig('targeting.daysSinceLastContact', parseInt(e.target.value))}
                      className="w-32 px-3 py-2 bg-gray-800 border border-[#222222] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Tiers
                </label>
                <div className="flex flex-wrap gap-2">
                  {['free', 'basic', 'premium', 'enterprise'].map(tier => (
                    <label key={tier} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.targeting.targetTiers.includes(tier)}
                        onChange={(e) => {
                          const newTiers = e.target.checked
                            ? [...config.targeting.targetTiers, tier]
                            : config.targeting.targetTiers.filter(t => t !== tier);
                          updateConfig('targeting.targetTiers', newTiers);
                        }}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-300 capitalize">{tier}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Automation Settings */}
          {activeTab === 'automation' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Auto-Reply Settings</h3>
              
              <div className="border border-[#222222] rounded-lg p-4 bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-white">Auto-Reply to Interest</h4>
                    <p className="text-sm text-gray-400">
                      Automatically respond when recipients show interest
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoReply.enabled}
                    onChange={(e) => updateConfig('autoReply.enabled', e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded bg-gray-700"
                  />
                </div>
                
                {config.autoReply.enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.autoReply.escalationEnabled}
                          onChange={(e) => updateConfig('autoReply.escalationEnabled', e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-300">
                          Escalate interested leads to sales team
                        </span>
                      </label>
                    </div>
                    
                    {config.autoReply.escalationEnabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Sales Notification Email
                        </label>
                        <input
                          type="email"
                          value={config.autoReply.salesNotificationEmail}
                          onChange={(e) => updateConfig('autoReply.salesNotificationEmail', e.target.value)}
                          placeholder="sales@company.com"
                          className="w-full px-3 py-2 bg-gray-900 border border-[#222222] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !config.enabled}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </div>
  );
}