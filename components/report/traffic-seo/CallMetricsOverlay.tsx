import React from 'react';
import { useCallMetrics } from '../../../utils/hooks/useClinicTrafficReport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CallMetricsOverlayProps {
  clinicId: string;
  showTitle?: boolean;
  compact?: boolean;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];

export function CallMetricsOverlay({ clinicId, showTitle = true, compact = false }: CallMetricsOverlayProps) {
  const { callData, loading, error } = useCallMetrics(clinicId);

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-md p-6 ${compact ? 'h-64' : 'h-96'}`}>
        <div className="animate-pulse">
          {showTitle && <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>}
          <div className="h-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !callData) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium mb-2">Error Loading Call Data</h3>
          <p className="text-sm">{error || 'No call data available'}</p>
        </div>
      </div>
    );
  }

  const totalCalls = callData.hourlyBreakdown.reduce((sum, h) => sum + h.calls, 0);
  const peakHour = callData.hourlyBreakdown.reduce((max, hour) => 
    hour.calls > max.calls ? hour : max
  );

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <div className={`bg-white rounded-2xl shadow-md p-6 ${compact ? 'h-64' : ''}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Call Analytics</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{totalCalls}</div>
            <div className="text-sm text-gray-600">Total Calls (30d)</div>
          </div>
        </div>
      )}

      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
        {/* Hourly Breakdown Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Calls by Hour</h4>
          <ResponsiveContainer width="100%" height={compact ? 120 : 200}>
            <BarChart data={callData.hourlyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 12 }}
                tickFormatter={formatHour}
                interval={compact ? 3 : 1}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(hour) => `Time: ${formatHour(Number(hour))}`}
                formatter={(value) => [value, 'Calls']}
              />
              <Bar dataKey="calls" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-gray-600">
            Peak hour: {formatHour(peakHour.hour)} ({peakHour.calls} calls)
          </div>
        </div>

        {/* Device Breakdown */}
        {!compact && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Device Source</h4>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={callData.deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    label={({ device, percentage }) => `${device}: ${percentage.toFixed(1)}%`}
                  >
                    {callData.deviceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, 'Calls']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {!compact && callData.averageCallDuration && (
        <div className="border-t border-gray-200 pt-4 mt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{totalCalls}</div>
              <div className="text-sm text-gray-600">Total Calls</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {Math.floor(callData.averageCallDuration / 60)}:{String(callData.averageCallDuration % 60).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600">Avg Duration</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {((totalCalls / 30)).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Calls/Day</div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Device Stats */}
      {compact && (
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            {callData.deviceBreakdown.map((device, index) => (
              <div key={device.device} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index] }}
                ></div>
                <span>{device.device}: {device.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}