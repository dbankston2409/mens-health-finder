import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Breadcrumbs from '../../../../components/Breadcrumbs';
// Service categories data
const serviceCategories = [
  {
    id: 'trt',
    title: 'Testosterone Replacement Therapy',
    description: 'Comprehensive TRT treatment programs'
  },
  {
    id: 'ed-treatment',
    title: 'ED Treatment',
    description: 'Erectile dysfunction treatment'
  },
  {
    id: 'hair-loss',
    title: 'Hair Loss Treatment',
    description: 'Hair restoration and prevention'
  },
  {
    id: 'weight-management',
    title: 'Weight Loss',
    description: 'Medical weight management'
  },
  {
    id: 'peptides',
    title: 'Peptide Therapy',
    description: 'Advanced peptide treatments'
  },
  {
    id: 'iv-therapy',
    title: 'IV Therapy',
    description: 'IV nutrient therapy'
  }
];
import { 
  slugify, 
  createClinicSlug,
  filterClinicsByCategory, 
  groupClinicsByState, 
  groupClinicsByCity,
  getCategoryById, 
  getStateFullName 
} from '../../../../lib/utils';

// Dynamic import for the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('../../../../components/Map'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-900 rounded-xl flex items-center justify-center">Loading map...</div>
});

// Import our helper function for creating clinic URLs
import { createClinicUrlPath } from '../../../../lib/utils';

interface CityPageProps {
  categoryInfo: {
    id: string;
    title: string;
    description: string;
  };
  locationInfo: {
    stateCode: string;
    stateFullName: string;
    city: string;
  };
  clinics: any[];
}

export default function CityPage({ categoryInfo, locationInfo, clinics }: CityPageProps) {
  const router = useRouter();
  
  // Handle fallback page case
  if (router.isFallback) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>{`${categoryInfo.title} Clinics in ${locationInfo.city}, ${locationInfo.stateCode} | Men's Health Finder`}</title>
        <meta 
          name="description" 
          content={`Find the best ${categoryInfo.title.toLowerCase()} clinics in ${locationInfo.city}, ${locationInfo.stateCode}. Compare top-rated men's health specialists offering ${categoryInfo.title.toLowerCase()} treatment.`} 
        />
        <link 
          rel="canonical" 
          href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com'}/${categoryInfo.id}/${locationInfo.stateCode.toLowerCase()}/${slugify(locationInfo.city)}`} 
        />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <Breadcrumbs 
          category={categoryInfo.id} 
          state={locationInfo.stateCode.toLowerCase()} 
          city={slugify(locationInfo.city)}
          categoryTitle={categoryInfo.title}
          stateFullName={locationInfo.stateFullName}
        />
        
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {categoryInfo.title} Clinics in {locationInfo.city}, {locationInfo.stateCode}
        </h1>
        
        <p className="text-[#AAAAAA] text-lg mb-8">
          Find the best {categoryInfo.title.toLowerCase()} treatment providers in {locationInfo.city}. 
          Compare top-rated men's health clinics, read reviews, and connect with specialists.
        </p>
        
        {/* Show empty state instead of map when no clinics */}
        {clinics.length === 0 ? (
          <div className="text-center py-12">
            <div className="glass-card p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">No {categoryInfo.title} Clinics Found</h2>
              <p className="text-[#AAAAAA] mb-6">
                We haven't found any {categoryInfo.title.toLowerCase()} clinics in {locationInfo.city}, {locationInfo.stateCode} yet.
              </p>
              <Link href="/search" className="btn inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search All Clinics
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Map View */}
            <div className="mb-8">
              <Map 
                locations={clinics.map(clinic => ({
                  id: clinic.id,
                  name: clinic.name,
                  address: clinic.address,
                  city: clinic.city,
                  state: clinic.state,
                  lat: clinic.lat || 0,
                  lng: clinic.lng || 0,
                  tier: clinic.tier,
                  rating: clinic.rating,
                  phone: clinic.phone
                }))}
                center={{
                  lat: clinics[0]?.lat || 0,
                  lng: clinics[0]?.lng || 0,
                  zoom: 12
                }}
                height="400px"
              />
            </div>
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">
                {categoryInfo.title} Clinics in {locationInfo.city} ({clinics.length})
              </h2>
              
              {/* Results list */}
              <div className="space-y-6">
                {clinics.map((clinic) => {
              return (
                <div 
                  key={clinic.id} 
                  className={`glass-card p-6 border-l-4 ${clinic.tier === 'high' ? 'border-primary' : clinic.tier === 'low' ? 'border-yellow-500' : 'border-gray-600'}`}
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-3/4">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link 
                            href={createClinicUrlPath(categoryInfo.id, clinic)} 
                            className="text-xl font-bold hover:text-primary transition-colors"
                          >
                            {clinic.name}
                          </Link>
                          <p className="text-textSecondary">{clinic.city}, {clinic.state}</p>
                        </div>
                        
                        {clinic.tier === 'high' && (
                          <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">PREMIUM</span>
                        )}
                        {clinic.tier === 'low' && (
                          <span className="bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded">ENHANCED</span>
                        )}
                      </div>
                      
                      <div className="flex items-center my-2">
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className="w-4 h-4" fill={star <= clinic.rating ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-2 text-textSecondary text-sm">{clinic.rating} ({clinic.reviewCount} reviews)</span>
                      </div>
                      
                      <p className="text-sm text-textSecondary mb-2">{clinic.address}</p>
                      <p className="text-sm text-textSecondary mb-4">{clinic.phone}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {clinic.services?.map((service: string) => (
                          <span key={service} className="bg-gray-800 text-xs px-3 py-1 rounded-full">{service}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="md:w-1/4 flex flex-col justify-between gap-4">
                      <Link 
                        href={createClinicUrlPath(categoryInfo.id, clinic)} 
                        className="btn text-center"
                      >
                        View Profile
                      </Link>
                      
                      {(clinic.tier === 'high' || clinic.tier === 'low') && (
                        <a 
                          href={`tel:${clinic.phone}`} 
                          className="btn bg-green-600 hover:bg-green-700 text-center flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Call Now
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          </>
        )}
        
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Finding {categoryInfo.title} Treatment in {locationInfo.city}
          </h2>
          
          <div className="prose prose-dark max-w-none">
            <p>
              Looking for {categoryInfo.title.toLowerCase()} treatment in {locationInfo.city}, {locationInfo.stateCode}? 
              The right men's health clinic can make all the difference in your treatment experience and results.
            </p>
            <p>
              When evaluating {categoryInfo.title.toLowerCase()} clinics in {locationInfo.city}, consider:
            </p>
            <ul>
              <li>The qualifications and experience of the healthcare providers</li>
              <li>The range of treatment options available</li>
              <li>Patient reviews and satisfaction ratings</li>
              <li>Whether they accept your insurance or offer affordable payment plans</li>
              <li>The clinic's approach to ongoing care and monitoring</li>
            </ul>
            <p>
              Men's Health Finder can help you compare options, read verified reviews, and connect with top 
              {categoryInfo.title.toLowerCase()} specialists in {locationInfo.city}.
            </p>
          </div>
          
          <div className="mt-8 flex justify-center">
            <Link 
              href={`/search?service=${encodeURIComponent(categoryInfo.title)}&location=${encodeURIComponent(`${locationInfo.city}, ${locationInfo.stateCode}`)}`} 
              className="btn flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search All {locationInfo.city} Clinics
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Generate a limited set of paths initially
  // The rest will be generated on-demand with fallback: 'blocking'
  const paths: { params: { category: string; state: string; city: string } }[] = [];

  // For simplicity, we'll just pre-generate a few common city paths
  const topCities = [
    { city: 'Austin', state: 'TX' },
    { city: 'Dallas', state: 'TX' },
    { city: 'Houston', state: 'TX' }];

  // For each category and top city
  serviceCategories.forEach((category) => {
    const categorySlug = slugify(category.id);
    
    topCities.forEach(({ city, state }) => {
      paths.push({
        params: {
          category: categorySlug,
          state: slugify(state),
          city: slugify(city)}});
    });
  });

  return {
    paths,
    fallback: 'blocking'};
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const categorySlug = params?.category as string;
  const stateSlug = params?.state as string;
  const citySlug = params?.city as string;
  
  // Find the matching category
  const categoryData = serviceCategories.find(
    (cat) => slugify(cat.id) === categorySlug
  );
  
  // If no matching category, return 404
  if (!categoryData) {
    return { notFound: true };
  }
  
  // Since we're removing mock data, return empty clinic data
  const sortedClinics: any[] = [];
  const matchingState = stateSlug.toUpperCase();
  const matchingCity = citySlug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  return {
    props: {
      categoryInfo: {
        id: categorySlug,
        title: categoryData.title,
        description: categoryData.description},
      locationInfo: {
        stateCode: matchingState,
        stateFullName: getStateFullName(matchingState),
        city: matchingCity},
      clinics: sortedClinics},
    // Revalidate every day
    revalidate: 86400};
};