import React, { useState, useEffect } from 'react';
import { generateUpgradeForecast } from '../../../utils/predictive/generateUpgradeForecast';
import { UpgradeForecast } from '../../../utils/analytics/conversionModels';
import { TierBadge } from '../../TierBadge';

interface ForecastPanelProps {
  clinicSlug: string;
}

export const ForecastPanel: React.FC<ForecastPanelProps> = ({ clinicSlug }) => {
  const [forecast, setForecast] = useState<UpgradeForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadForecast();
  }, [clinicSlug]);

  const loadForecast = async () => {
    try {
      setLoading(true);
      setError(null);
      const forecastData = await generateUpgradeForecast(clinicSlug);
      setForecast(forecastData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading forecast:', err);
      setError('Failed to generate forecast');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    const colors = {
      high: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      low: 'text-red-600 bg-red-100'
    };
    return colors[confidence as keyof typeof colors] || colors.low;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatFactorValue = (factor: string, value: number) => {
    switch (factor) {
      case 'trafficTrend':
      case 'conversionTrend':
      case 'seasonality':
        const percentage = Math.round(value * 100);
        return `${percentage > 0 ? '+' : ''}${percentage}%`;
      case 'revenueGrowth':
        return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
      case 'contactFrequency':
        return `${Math.round(value)} days`;
      default:
        return `${Math.round(value)}`;
    }
  };

  const getFactorLabel = (factor: string) => {
    const labels = {
      trafficTrend: 'Traffic Trend',
      engagementScore: 'Engagement',
      revenueGrowth: 'Revenue Growth',
      competitorActivity: 'Competition',
      seasonality: 'Seasonality',
      contactFrequency: 'Last Contact',
      conversionTrend: 'Conversion Trend',
      contentQuality: 'Content Quality',
      tierPosition: 'Tier Position'
    };
    return labels[factor as keyof typeof labels] || factor;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadForecast}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600 text-center">No forecast available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Upgrade Forecast</h3>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated?.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={loadForecast}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Main Prediction */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <TierBadge score={forecast.predictionScore} size="sm" />
              <span className={`text-2xl font-bold ${getScoreColor(forecast.predictionScore)}`}>
                {forecast.predictionScore}%
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(forecast.confidence)}`}>
                {forecast.confidence.toUpperCase()} CONFIDENCE
              </span>
            </div>
            <p className="text-gray-700 font-medium">
              Upgrade likelihood: {forecast.currentTier} → {forecast.targetTier}
            </p>
            <p className="text-sm text-gray-600">
              Predicted within {forecast.timeframe} days
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(forecast.predictedRevenue)}
            </div>
            <div className="text-sm text-gray-600">Potential Revenue</div>
          </div>
        </div>
      </div>

      {/* Key Factors */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Key Factors</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(forecast.factors).map(([factor, value]) => {
            const isPositive = factor === 'engagementScore' || factor === 'contentQuality' || factor === 'tierPosition' ? 
              value > 70 :
              factor === 'contactFrequency' ?
                value < 7 :
                value > 0;
            
            return (
              <div key={factor} className="bg-gray-50 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{getFactorLabel(factor)}</span>
                  <span className={`text-sm font-medium ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatFactorValue(factor, value)}
                  </span>
                </div>
                <div className="mt-1 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      isPositive ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.abs(value) > 1 ? 100 : Math.abs(value) * 100}%` 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Actions */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Recommended Actions</h4>
        <div className="space-y-2">
          {forecast.recommendedActions.map((action, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-3">
        <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create Follow-up Task
        </button>
        <button className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50">
          Send Upgrade Proposal
        </button>
      </div>

      {/* Forecast Details */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <details className="group">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            View Technical Details
          </summary>
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <div>Forecast ID: {forecast.id}</div>
            <div>Model Version: v1.0</div>
            <div>Generated: {forecast.createdAt.toDate().toLocaleString()}</div>
            <div>Expires: {forecast.expiresAt.toDate().toLocaleString()}</div>
          </div>
        </details>
      </div>
    </div>
  );
};