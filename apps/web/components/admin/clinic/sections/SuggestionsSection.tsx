import React from 'react';
import { DetailedClinic } from '../../../../utils/admin/useClinicData';
import Link from 'next/link';

interface SuggestionsSectionProps {
  suggestions: DetailedClinic['suggestions'];
}

const SuggestionsSection: React.FC<SuggestionsSectionProps> = ({ suggestions }) => {
  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-700 bg-yellow-900 bg-opacity-20';
      case 'info':
        return 'border-blue-700 bg-blue-900 bg-opacity-20';
      case 'success':
        return 'border-green-700 bg-green-900 bg-opacity-20';
      default:
        return 'border-gray-700 bg-gray-800';
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-900 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-900 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  // Generate additional AI-powered suggestions
  const additionalSuggestions = [
    {
      id: 'sug-auto-1',
      type: 'info',
      message: 'Based on your profile views, adding before/after images could increase engagement by up to 40%.',
      actionText: 'Add Images',
      actionUrl: '#',
    },
    {
      id: 'sug-auto-2',
      type: 'warning',
      message: 'Your clinic has not published any blog content in the last 90 days, which may be affecting search visibility.',
      actionText: 'Create Blog Post',
      actionUrl: '#',
    },
    {
      id: 'sug-auto-3',
      type: 'info',
      message: 'Customers who view your TRT services also frequently search for "peptide therapy". Consider adding this service.',
      actionText: 'Update Services',
      actionUrl: '#',
    },
    {
      id: 'sug-auto-4',
      type: 'success',
      message: 'Your clinic has a high response rate to reviews (92%). Keep up the good work!',
      actionText: 'View Reviews',
      actionUrl: '#',
    },
  ];

  const allSuggestions = [...suggestions, ...additionalSuggestions];

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">AI-Powered Suggestions</h3>
          <div className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-4">
          {allSuggestions.map((suggestion) => (
            <div 
              key={suggestion.id} 
              className={`p-4 rounded-lg border ${getSuggestionColor(suggestion.type)}`}
            >
              <div className="flex">
                {getSuggestionIcon(suggestion.type)}
                
                <div className="ml-4 flex-1">
                  <div className="text-sm">{suggestion.message}</div>
                  
                  {suggestion.actionText && suggestion.actionUrl && (
                    <div className="mt-3">
                      <Link 
                        href={suggestion.actionUrl}
                        className="inline-flex items-center px-3 py-1 bg-[#111111] hover:bg-gray-800 rounded-md text-xs font-medium"
                      >
                        {suggestion.actionText}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Implementation Plan */}
      <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
        <h3 className="text-lg font-medium mb-4">Recommended Implementation Plan</h3>
        
        <div className="relative">
          <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-800"></div>
          
          <div className="space-y-6 relative">
            <div className="ml-8 pb-2">
              <div className="absolute left-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary -ml-4">
                <span className="text-xs font-bold">1</span>
              </div>
              <div className="font-medium mb-1">Update Profile with High-Quality Images</div>
              <div className="text-sm text-gray-400">
                Adding quality images of your clinic can increase view-to-contact conversion by up to 30%.
              </div>
              <div className="mt-2">
                <span className="text-xs bg-gray-800 px-2 py-1 rounded-full">Estimated impact: High</span>
              </div>
            </div>
            
            <div className="ml-8 pb-2">
              <div className="absolute left-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 -ml-4">
                <span className="text-xs font-bold">2</span>
              </div>
              <div className="font-medium mb-1">Add Patient Testimonials</div>
              <div className="text-sm text-gray-400">
                Our analysis shows profiles with testimonials receive 40% more inquiries.
              </div>
              <div className="mt-2">
                <span className="text-xs bg-gray-800 px-2 py-1 rounded-full">Estimated impact: Medium</span>
              </div>
            </div>
            
            <div className="ml-8 pb-2">
              <div className="absolute left-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 -ml-4">
                <span className="text-xs font-bold">3</span>
              </div>
              <div className="font-medium mb-1">Expand Service Offerings</div>
              <div className="text-sm text-gray-400">
                Based on search patterns, adding "Peptide Therapy" could attract 15-20% more visitors.
              </div>
              <div className="mt-2">
                <span className="text-xs bg-gray-800 px-2 py-1 rounded-full">Estimated impact: Medium</span>
              </div>
            </div>
            
            <div className="ml-8">
              <div className="absolute left-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 -ml-4">
                <span className="text-xs font-bold">4</span>
              </div>
              <div className="font-medium mb-1">Create Educational Content</div>
              <div className="text-sm text-gray-400">
                Publishing a monthly blog post on men's health topics can boost your search ranking significantly.
              </div>
              <div className="mt-2">
                <span className="text-xs bg-gray-800 px-2 py-1 rounded-full">Estimated impact: High</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button className="bg-primary hover:bg-primary-dark px-4 py-2 rounded-md text-sm font-medium">
            Generate Detailed Growth Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionsSection;