import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';

const OnlineProvidersCategoryPage: React.FC = () => {
  const router = useRouter();
  const { category } = router.query;

  // Category metadata
  const categoryData: Record<string, any> = {
    'trt': {
      name: 'TRT & Testosterone',
      icon: '🧬',
      description: 'Find the best online providers for testosterone replacement therapy',
      keywords: ['Low T', 'Hormone Optimization', 'TRT', 'Testosterone']
    },
    'ed': {
      name: 'ED Treatment',
      icon: '💊',
      description: 'Discreet online treatment for erectile dysfunction',
      keywords: ['Viagra', 'Cialis', 'Sildenafil', 'Tadalafil']
    },
    'peptides': {
      name: 'Peptide Therapy',
      icon: '🔬',
      description: 'Advanced peptide treatments for recovery and performance',
      keywords: ['BPC-157', 'CJC-1295', 'Ipamorelin', 'Recovery']
    },
    'weight-loss': {
      name: 'Medical Weight Loss',
      icon: '⚖️',
      description: 'Physician-supervised weight loss programs',
      keywords: ['Semaglutide', 'GLP-1', 'Ozempic', 'Weight Management']
    },
    'hair-loss': {
      name: 'Hair Loss Treatment',
      icon: '💇‍♂️',
      description: 'Science-backed solutions for hair loss',
      keywords: ['Finasteride', 'Minoxidil', 'Hair Restoration', 'DHT Blockers']
    },
    'wellness': {
      name: 'Overall Wellness',
      icon: '🌟',
      description: 'Comprehensive wellness and anti-aging programs',
      keywords: ['Anti-aging', 'Vitality', 'Longevity', 'Wellness']
    }
  };

  const currentCategory = categoryData[category as string] || categoryData['trt'];

  // Mock provider data - in production this would come from Firebase/API
  const mockProvider = {
    id: 'hone-health',
    name: 'Hone Health',
    tagline: 'Optimize Your Hormones From Home',
    rating: 4.8,
    reviewCount: 2847,
    price: 'Starting at $79/month',
    highlights: ['Board Certified Doctors', 'All 50 States', 'Same Day Consultations'],
    image: 'https://via.placeholder.com/300x200',
    categories: ['trt', 'ed', 'peptides', 'weight-loss', 'hair-loss', 'wellness'] // This provider serves all categories
  };

  // Create multiple instances for display
  const providers = Array(6).fill(mockProvider).map((provider, index) => ({
    ...provider,
    id: `${provider.id}-${index}`,
    name: index === 0 ? provider.name : `${provider.name} ${index + 1}`,
    rating: 4.5 + (Math.random() * 0.5),
    reviewCount: Math.floor(1000 + Math.random() * 3000)
  }));

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/">
                <a className="text-gray-600 hover:text-gray-900">Home</a>
              </Link>
              <span className="text-gray-400">/</span>
              <Link href="/online-providers">
                <a className="text-gray-600 hover:text-gray-900">Online Providers</a>
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900">{currentCategory.name}</span>
            </div>
          </div>
        </div>

        {/* Category Header */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center">
              <div className="text-6xl mb-4">{currentCategory.icon}</div>
              <h1 className="text-4xl font-bold mb-4">{currentCategory.name} Providers</h1>
              <p className="text-xl text-blue-100 mb-6">{currentCategory.description}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {currentCategory.keywords.map((keyword: string) => (
                  <span key={keyword} className="px-3 py-1 bg-blue-700 bg-opacity-50 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Filters Bar */}
        <section className="bg-white border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-lg font-semibold">
                {providers.length} Providers Found
              </div>
              <div className="flex items-center gap-4">
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Sort by: Recommended</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Rating: High to Low</option>
                  <option>Most Reviews</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Providers Grid */}
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <Link key={provider.id} href={`/provider/${provider.id}`}>
                  <a className="block group">
                    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                      {/* Provider Image */}
                      <div className="relative h-48 bg-gray-200">
                        <img 
                          src={provider.image} 
                          alt={provider.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-md">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-semibold">{provider.rating.toFixed(1)}</span>
                            <span className="text-gray-500 text-sm">({provider.reviewCount})</span>
                          </div>
                        </div>
                      </div>

                      {/* Provider Info */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                          {provider.name}
                        </h3>
                        <p className="text-gray-600 mb-4">{provider.tagline}</p>
                        
                        {/* Highlights */}
                        <div className="space-y-2 mb-4">
                          {provider.highlights.map((highlight, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-700">
                              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {highlight}
                            </div>
                          ))}
                        </div>

                        {/* Price and CTA */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <span className="text-lg font-semibold text-gray-900">{provider.price}</span>
                          <span className="text-blue-600 font-semibold group-hover:text-blue-700 flex items-center">
                            Learn More
                            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">About {currentCategory.name} Online Treatment</h2>
            <div className="prose prose-lg text-gray-600">
              <p>
                Online {currentCategory.name.toLowerCase()} providers offer convenient, discreet, and effective treatment 
                options from the comfort of your home. All providers listed here feature board-certified physicians, 
                secure telemedicine platforms, and FDA-approved medications when applicable.
              </p>
              <p>
                Each provider has been vetted for quality, safety, and customer satisfaction. Compare prices, 
                read reviews, and choose the provider that best fits your needs and budget.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default OnlineProvidersCategoryPage;