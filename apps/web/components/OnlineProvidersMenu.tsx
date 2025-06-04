import React, { useState } from 'react';
import Link from 'next/link';

const OnlineProvidersMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const categories = [
    { slug: 'trt', name: 'TRT & Testosterone', icon: '🧬' },
    { slug: 'ed', name: 'ED Treatment', icon: '💊' },
    { slug: 'peptides', name: 'Peptide Therapy', icon: '🔬' },
    { slug: 'weight-loss', name: 'Weight Loss', icon: '⚖️' },
    { slug: 'hair-loss', name: 'Hair Loss', icon: '💇‍♂️' },
    { slug: 'wellness', name: 'Overall Wellness', icon: '🌟' }
  ];

  return (
    <div className="relative">
      {/* Menu Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="flex items-center gap-2 text-white hover:text-primary transition-colors text-sm font-medium"
      >
        <span>Online Providers</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute left-0 mt-2 w-64 bg-white shadow-lg rounded-lg border border-gray-200 z-50"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-2">
            <Link href="/online-providers">
              <a className="block px-4 py-3 text-primary font-semibold hover:bg-gray-50 rounded-md transition-colors">
                View All Online Providers →
              </a>
            </Link>
            <div className="border-t border-gray-100 my-2"></div>
            {categories.map((category) => (
              <Link key={category.slug} href={`/online-providers/${category.slug}`}>
                <a className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                  <span className="text-2xl">{category.icon}</span>
                  <span>{category.name}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineProvidersMenu;