import React from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';

const OnlineProvidersLandingPage: React.FC = () => {
  const categories = [
    { 
      slug: 'trt', 
      name: 'TRT & Testosterone', 
      icon: '🧬',
      description: 'Optimize your testosterone levels with licensed physicians specializing in hormone replacement therapy.',
      benefits: ['Increased energy', 'Better muscle mass', 'Improved mood', 'Enhanced libido']
    },
    { 
      slug: 'ed', 
      name: 'ED Treatment', 
      icon: '💊',
      description: 'Discreet and effective treatments for erectile dysfunction delivered right to your door.',
      benefits: ['FDA-approved medications', 'Private consultations', 'Fast delivery', 'Ongoing support']
    },
    { 
      slug: 'peptides', 
      name: 'Peptide Therapy', 
      icon: '🔬',
      description: 'Cutting-edge peptide treatments for recovery, performance, and longevity.',
      benefits: ['Enhanced recovery', 'Anti-aging benefits', 'Improved healing', 'Performance optimization']
    },
    { 
      slug: 'weight-loss', 
      name: 'Medical Weight Loss', 
      icon: '⚖️',
      description: 'Physician-supervised weight loss programs with proven medications and personalized plans.',
      benefits: ['GLP-1 medications', 'Customized plans', 'Ongoing monitoring', 'Nutritional guidance']
    },
    { 
      slug: 'hair-loss', 
      name: 'Hair Loss Treatment', 
      icon: '💇‍♂️',
      description: 'Science-backed solutions for hair loss, from medications to advanced treatments.',
      benefits: ['Proven medications', 'Topical treatments', 'Expert guidance', 'Progress tracking']
    },
    { 
      slug: 'wellness', 
      name: 'Overall Wellness', 
      icon: '🌟',
      description: 'Comprehensive wellness programs addressing multiple aspects of men\'s health.',
      benefits: ['Full health assessment', 'Personalized plans', 'Multiple treatments', 'Holistic approach']
    }
  ];

  const stats = [
    { number: '500K+', label: 'Men Treated' },
    { number: '50', label: 'States Covered' },
    { number: '4.8', label: 'Average Rating' },
    { number: '24/7', label: 'Support Available' }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Online Men's Health Providers
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Get treatment from licensed physicians without leaving home
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold">{stat.number}</div>
                    <div className="text-sm text-blue-200">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Choose Your Treatment Category
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Select a category below to find the best online providers for your specific health needs
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category) => (
                <Link key={category.slug} href={`/online-providers/${category.slug}`}>
                  <a className="block group">
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 h-full transform hover:-translate-y-1">
                      <div className="text-5xl mb-4">{category.icon}</div>
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {category.description}
                      </p>
                      <div className="space-y-2">
                        {category.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-700">
                            <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {benefit}
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                        View Providers
                        <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              How Online Treatment Works
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '1', title: 'Choose Provider', desc: 'Select from our vetted online health providers' },
                { step: '2', title: 'Complete Assessment', desc: 'Fill out a health questionnaire and book consultation' },
                { step: '3', title: 'Meet Your Doctor', desc: 'Video consultation with a licensed physician' },
                { step: '4', title: 'Get Treatment', desc: 'Receive medications delivered to your door' }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Your Health Journey?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Browse our categories above to find the right online provider for your needs
            </p>
            <Link href="/online-providers/trt">
              <a className="inline-block bg-white text-blue-600 font-bold py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors text-lg">
                Get Started Now →
              </a>
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default OnlineProvidersLandingPage;