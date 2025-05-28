import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { VariantTest } from '../../../utils/analytics/conversionModels';
import { conversionRateCalculator } from '../../../utils/analytics/ConversionRateCalculator';

interface VariantTestManagerProps {
  clinicSlug: string;
}

export const VariantTestManager: React.FC<VariantTestManagerProps> = ({ clinicSlug }) => {
  const [tests, setTests] = useState<VariantTest[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    type: 'cta' as VariantTest['type'],
    variants: [
      { id: 'control', name: 'Control', content: '', weight: 50, isControl: true },
      { id: 'variant_a', name: 'Variant A', content: '', weight: 50, isControl: false }
    ],
    trafficAllocation: 100,
    targetSampleSize: 1000,
    confidenceLevel: 95,
    primaryMetric: 'conversion_rate' as VariantTest['primaryMetric']
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, [clinicSlug]);

  const loadTests = async () => {
    try {
      const testsQuery = query(
        collection(db, 'variantTests'),
        where('clinicSlug', '==', clinicSlug)
      );
      
      const testsSnapshot = await getDocs(testsQuery);
      const testsData = testsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VariantTest));
      
      setTests(testsData);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTest = async () => {
    try {
      const testData: Omit<VariantTest, 'id'> = {
        clinicSlug,
        name: newTest.name,
        description: newTest.description,
        type: newTest.type,
        status: 'draft',
        variants: newTest.variants,
        assignedVisitors: {},
        trafficAllocation: newTest.trafficAllocation,
        startDate: Timestamp.now(),
        targetSampleSize: newTest.targetSampleSize,
        confidenceLevel: newTest.confidenceLevel,
        primaryMetric: newTest.primaryMetric,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'current_user' // Would get from auth context
      };

      const testRef = await addDoc(collection(db, 'variantTests'), testData);
      
      setTests(prev => [...prev, { id: testRef.id, ...testData }]);
      setIsCreating(false);
      setNewTest({
        name: '',
        description: '',
        type: 'cta',
        variants: [
          { id: 'control', name: 'Control', content: '', weight: 50, isControl: true },
          { id: 'variant_a', name: 'Variant A', content: '', weight: 50, isControl: false }
        ],
        trafficAllocation: 100,
        targetSampleSize: 1000,
        confidenceLevel: 95,
        primaryMetric: 'conversion_rate'
      });
    } catch (error) {
      console.error('Error creating test:', error);
    }
  };

  const updateTestStatus = async (testId: string, status: VariantTest['status']) => {
    try {
      const testRef = doc(db, 'variantTests', testId);
      await updateDoc(testRef, {
        status,
        updatedAt: Timestamp.now(),
        ...(status === 'running' ? { startDate: Timestamp.now() } : {}),
        ...(status === 'completed' ? { endDate: Timestamp.now() } : {})
      });

      setTests(prev => prev.map(test => 
        test.id === testId ? { ...test, status } : test
      ));
    } catch (error) {
      console.error('Error updating test status:', error);
    }
  };

  const addVariant = () => {
    const variantId = `variant_${String.fromCharCode(65 + newTest.variants.length - 1)}`;
    setNewTest(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: variantId,
          name: `Variant ${String.fromCharCode(65 + prev.variants.length - 1)}`,
          content: '',
          weight: Math.floor(100 / (prev.variants.length + 1)),
          isControl: false
        }
      ]
    }));

    // Redistribute weights equally
    const newWeight = Math.floor(100 / (newTest.variants.length + 1));
    setNewTest(prev => ({
      ...prev,
      variants: prev.variants.map(variant => ({ ...variant, weight: newWeight }))
    }));
  };

  const updateVariantContent = (variantId: string, content: string) => {
    setNewTest(prev => ({
      ...prev,
      variants: prev.variants.map(variant => 
        variant.id === variantId ? { ...variant, content } : variant
      )
    }));
  };

  const getStatusColor = (status: VariantTest['status']) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      running: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">A/B Tests</h2>
          <p className="text-gray-600">Manage conversion optimization tests</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Test
        </button>
      </div>

      {/* Create Test Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New A/B Test</h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Name
                  </label>
                  <input
                    type="text"
                    value={newTest.name}
                    onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g., CTA Button Test"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Type
                  </label>
                  <select
                    value={newTest.type}
                    onChange={(e) => setNewTest(prev => ({ ...prev, type: e.target.value as VariantTest['type'] }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="cta">CTA Button</option>
                    <option value="seoHeader">SEO Header</option>
                    <option value="description">Description</option>
                    <option value="layout">Layout</option>
                    <option value="pricing">Pricing</option>
                    <option value="testimonial">Testimonial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTest.description}
                  onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={2}
                  placeholder="What are you testing?"
                />
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Variants
                  </label>
                  <button
                    onClick={addVariant}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Variant
                  </button>
                </div>
                
                <div className="space-y-3">
                  {newTest.variants.map((variant, index) => (
                    <div key={variant.id} className="border border-gray-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {variant.name} {variant.isControl && '(Control)'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {variant.weight}% traffic
                        </span>
                      </div>
                      <textarea
                        value={variant.content}
                        onChange={(e) => updateVariantContent(variant.id, e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        rows={2}
                        placeholder={`Enter content for ${variant.name}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Traffic Allocation (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newTest.trafficAllocation}
                    onChange={(e) => setNewTest(prev => ({ ...prev, trafficAllocation: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sample Size
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={newTest.targetSampleSize}
                    onChange={(e) => setNewTest(prev => ({ ...prev, targetSampleSize: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confidence Level (%)
                  </label>
                  <select
                    value={newTest.confidenceLevel}
                    onChange={(e) => setNewTest(prev => ({ ...prev, confidenceLevel: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value={90}>90%</option>
                    <option value={95}>95%</option>
                    <option value={99}>99%</option>
                  </select>
                </div>
              </div>

              {/* Primary Metric */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Metric
                </label>
                <select
                  value={newTest.primaryMetric}
                  onChange={(e) => setNewTest(prev => ({ ...prev, primaryMetric: e.target.value as VariantTest['primaryMetric'] }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="conversion_rate">Conversion Rate</option>
                  <option value="ctr">Click-Through Rate</option>
                  <option value="engagement_time">Engagement Time</option>
                  <option value="bounce_rate">Bounce Rate</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createTest}
                disabled={!newTest.name || !newTest.variants.every(v => v.content)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                Create Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tests List */}
      <div className="space-y-4">
        {tests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No A/B tests created yet</p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Create your first test
            </button>
          </div>
        ) : (
          tests.map((test) => (
            <div key={test.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                  <p className="text-gray-600">{test.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                      {test.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {test.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <span className="text-sm text-gray-500">
                      {test.variants.length} variants
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {test.status === 'draft' && (
                    <button
                      onClick={() => updateTestStatus(test.id, 'running')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Start
                    </button>
                  )}
                  
                  {test.status === 'running' && (
                    <>
                      <button
                        onClick={() => updateTestStatus(test.id, 'paused')}
                        className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => updateTestStatus(test.id, 'completed')}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Complete
                      </button>
                    </>
                  )}
                  
                  {test.status === 'paused' && (
                    <button
                      onClick={() => updateTestStatus(test.id, 'running')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Resume
                    </button>
                  )}
                </div>
              </div>

              {/* Variants Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {test.variants.map((variant) => (
                  <div key={variant.id} className="border border-gray-200 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {variant.name} {variant.isControl && '(Control)'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {variant.weight}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{variant.content}</p>
                    
                    {test.results && (
                      <div className="text-xs text-gray-500">
                        {(() => {
                          const result = test.results.find(r => r.variantId === variant.id);
                          return result ? (
                            <div>
                              <div>Views: {result.views}</div>
                              <div>Conversions: {result.conversions}</div>
                              <div>Rate: {result.conversionRate.toFixed(2)}%</div>
                              {result.isWinner && (
                                <div className="text-green-600 font-medium">🏆 Winner</div>
                              )}
                            </div>
                          ) : (
                            <div>No data yet</div>
                          );
                        })()
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};