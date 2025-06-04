const ProviderProfilePage = () => {
  // TODO: Fetch provider data from backend (Firebase or REST API)
  // TODO: Handle route param for dynamic provider ID
  
  const providerData = {
    id: 'hone-health',
    name: 'Hone Health',
    logo: 'https://via.placeholder.com/120x60',
    tagline: 'Optimize Your Hormones From Home',
    description: 'Board-certified physicians specializing in hormone optimization, delivered through convenient telemedicine.',
    trustBadges: ['Board Certified', 'Licensed in 50 States', '100k+ Patients'],
    conditions: [
      { name: 'TRT', icon: '🧬', fullName: 'Testosterone Replacement Therapy' },
      { name: 'ED', icon: '💊', fullName: 'Erectile Dysfunction' },
      { name: 'Peptides', icon: '🔬', fullName: 'Peptide Therapy' },
      { name: 'Weight Loss', icon: '⚖️', fullName: 'Medical Weight Loss' }
    ],
    prescriptions: [
      'Testosterone Cypionate',
      'Sildenafil (Viagra)',
      'Tadalafil (Cialis)',
      'Semaglutide',
      'BPC-157',
      'CJC-1295'
    ],
    serviceFormat: {
      consultation: 'Video consultation with licensed physician',
      labWork: 'At-home test kit or local lab',
      delivery: 'Medications shipped discreetly to your door',
      followUp: 'Ongoing support and dose adjustments'
    },
    reviews: [
      {
        id: 1,
        author: 'Michael R.',
        photo: 'https://via.placeholder.com/60',
        rating: 5,
        text: 'Life-changing experience. My energy levels are through the roof and I feel 10 years younger.',
        verified: true
      },
      {
        id: 2,
        author: 'David K.',
        photo: 'https://via.placeholder.com/60',
        rating: 5,
        text: 'The convenience of telemedicine combined with expert care. Highly recommend for anyone dealing with low T.',
        verified: true
      },
      {
        id: 3,
        author: 'James P.',
        photo: 'https://via.placeholder.com/60',
        rating: 5,
        text: 'Professional, discreet, and effective. The doctors really know their stuff.',
        verified: true
      }
    ],
    affiliateLink: 'https://example.com/partner/hone-health',
    pricing: 'Starting at $79/month',
    ctaText: 'Get Started Today'
  };

  // TODO: Track affiliate click with SubID or UTM
  const handleAffiliateClick = () => {
    // Track click event
    console.log('Affiliate link clicked:', providerData.id);
    window.open(providerData.affiliateLink, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src={providerData.logo} 
                alt={`${providerData.name} logo`}
                className="w-32 h-16 object-contain"
              />
            </div>
            
            {/* Provider Info */}
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {providerData.name}
              </h1>
              <p className="text-xl text-gray-600 mb-4">
                {providerData.tagline}
              </p>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-6">
                {providerData.trustBadges.map((badge, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full"
                  >
                    ✓ {badge}
                  </span>
                ))}
              </div>
              
              {/* Desktop CTA */}
              <div className="hidden md:block">
                <button
                  onClick={handleAffiliateClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                  data-testid="hero-cta-button"
                >
                  {providerData.ctaText} →
                </button>
                <span className="ml-4 text-gray-600">{providerData.pricing}</span>
              </div>
            </div>
          </div>
          
          {/* Mobile CTA */}
          <div className="md:hidden mt-6">
            <button
              onClick={handleAffiliateClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              data-testid="hero-mobile-cta-button"
            >
              {providerData.ctaText} →
            </button>
            <p className="text-center mt-2 text-gray-600">{providerData.pricing}</p>
          </div>
        </div>
      </section>

      {/* What They Offer Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            What They Offer
          </h2>
          
          {/* Conditions Treated */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Conditions Treated</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {providerData.conditions.map((condition) => (
                <div 
                  key={condition.name}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-2">{condition.icon}</div>
                  <div className="font-semibold text-gray-900">{condition.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{condition.fullName}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Prescriptions Available */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Prescriptions Available</h3>
            <div className="flex flex-wrap gap-2">
              {providerData.prescriptions.map((prescription) => (
                <span 
                  key={prescription}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {prescription}
                </span>
              ))}
            </div>
          </div>
          
          {/* How It Works */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">How It Works</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(providerData.serviceFormat).map(([key, value], index) => (
                <div key={key} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="text-blue-600 font-bold text-lg mb-2">
                    {index + 1}. {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </div>
                  <p className="text-gray-600 text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12 md:py-16 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            Patient Reviews
          </h2>
          
          {/* TODO: Fetch user reviews dynamically (optional) */}
          <div className="grid md:grid-cols-3 gap-6">
            {providerData.reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <img 
                    src={review.photo} 
                    alt={review.author}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{review.author}</div>
                    <div className="flex items-center gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400">★</span>
                      ))}
                      {review.verified && (
                        <span className="text-xs text-green-600 ml-2">✓ Verified</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{review.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky CTA Footer - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 p-4 shadow-lg">
        <button
          onClick={handleAffiliateClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          data-testid="sticky-cta-button"
        >
          {providerData.ctaText} - {providerData.pricing}
        </button>
      </div>
      
      {/* Spacer for sticky footer on mobile */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
};

export default ProviderProfilePage;