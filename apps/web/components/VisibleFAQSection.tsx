import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface FAQ {
  question: string;
  answer: string;
  category?: string;
  priority?: number;
}

interface VisibleFAQSectionProps {
  faqs: FAQ[];
  clinicName?: string;
}

export const VisibleFAQSection: React.FC<VisibleFAQSectionProps> = ({ faqs, clinicName }) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  if (!faqs || faqs.length === 0) {
    return null;
  }

  // Sort FAQs by priority if available
  const sortedFaqs = [...faqs].sort((a, b) => {
    if (a.priority && b.priority) {
      return a.priority - b.priority;
    }
    return 0;
  });

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-400">
          Find answers to common questions about {clinicName || 'our services'}
        </p>
      </div>

      <div className="space-y-4">
        {sortedFaqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-800 rounded-lg overflow-hidden transition-all duration-200 hover:border-gray-700"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors"
              aria-expanded={expandedItems.has(index)}
              aria-controls={`faq-answer-${index}`}
            >
              <h3 className="text-white font-medium pr-4">{faq.question}</h3>
              <span className="flex-shrink-0 text-gray-400">
                {expandedItems.has(index) ? (
                  <ChevronUpIcon className="w-5 h-5" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5" />
                )}
              </span>
            </button>
            
            {expandedItems.has(index) && (
              <div
                id={`faq-answer-${index}`}
                className="px-6 pb-4 text-gray-300 animate-in slide-in-from-top-2 duration-200"
              >
                <p className="leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SEO Note */}
      <div className="text-xs text-gray-500 italic mt-6">
        These FAQs are also included in structured data for enhanced search visibility
      </div>
    </div>
  );
};