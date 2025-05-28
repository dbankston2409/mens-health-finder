import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { mockClinics, serviceCategories } from '../../../lib/mockData';
import { 
  slugify, 
  filterClinicsByCategory, 
  groupClinicsByState, 
  groupClinicsByCity,
  getCategoryById, 
  getStateFullName,
  getStateSlug,
  getServiceSlug
} from '../../../lib/utils';

interface StatePageProps {
  categoryInfo: {
    id: string;
    title: string;
    description: string;
  };
  stateInfo: {
    stateCode: string;
    fullName: string;
  };
  citiesByClinicCount: { 
    city: string; 
    citySlug: string;
    count: number;
  }[];
}

export default function StatePage({ categoryInfo, stateInfo, citiesByClinicCount }: StatePageProps) {
  const router = useRouter();
  
  // Handle fallback page case
  if (router.isFallback) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>{`${categoryInfo.title} Clinics in ${stateInfo.fullName} | Men's Health Finder`}</title>
        <meta 
          name="description" 
          content={`Find specialized men's health clinics offering ${categoryInfo.title.toLowerCase()} in ${stateInfo.fullName}. Browse clinics by city.`} 
        />
        <link 
          rel="canonical" 
          href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com'}/${categoryInfo.id}/${stateInfo.stateCode.toLowerCase()}`} 
        />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <Breadcrumbs 
          category={categoryInfo.id} 
          state={stateInfo.stateCode.toLowerCase()} 
          categoryTitle={categoryInfo.title}
          stateFullName={stateInfo.fullName}
        />
        
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {categoryInfo.title} Clinics in {stateInfo.fullName}
        </h1>
        
        <p className="text-[#AAAAAA] text-lg mb-8">
          Looking for {categoryInfo.title.toLowerCase()} treatment in {stateInfo.fullName}? 
          Browse clinics by city below to find specialized men's health providers near you.
        </p>
        
        <div className="glass-card p-6 mb-10">
          <h2 className="text-2xl font-bold mb-6">
            Browse {categoryInfo.title} Clinics in {stateInfo.fullName} by City
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {citiesByClinicCount.map((cityData) => (
              <Link 
                key={cityData.city} 
                href={`/${getServiceSlug(categoryInfo.id)}/${getStateSlug(stateInfo.stateCode)}/${slugify(cityData.city)}`}
                className="flex justify-between items-center bg-gray-900 hover:bg-gray-800 transition-colors p-4 rounded-lg"
              >
                <span className="font-medium">{cityData.city}</span>
                <span className="text-[#AAAAAA] text-sm">{cityData.count} clinics</span>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {categoryInfo.title} Treatment in {stateInfo.fullName}
          </h2>
          
          <div className="prose prose-dark max-w-none">
            <p>
              Finding the right men's health clinic for {categoryInfo.title.toLowerCase()} treatment in {stateInfo.fullName} is an important decision. 
              The best clinics offer comprehensive evaluations, personalized treatment plans, and ongoing monitoring to ensure optimal results.
            </p>
            <p>
              When choosing a clinic in {stateInfo.fullName}, consider factors like the providers' experience and specialization, 
              the range of treatment options offered, patient reviews, and whether they accept your insurance.
            </p>
            <p>
              Men's Health Finder makes it easy to compare clinics in {stateInfo.fullName} cities, read verified patient reviews, 
              and connect with top-rated providers specializing in {categoryInfo.title.toLowerCase()} treatments.
            </p>
          </div>
          
          <div className="mt-8 flex justify-center">
            <Link 
              href={`/search?service=${encodeURIComponent(categoryInfo.title)}&location=${encodeURIComponent(stateInfo.fullName)}`} 
              className="btn flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search All {stateInfo.fullName} Clinics
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Generate a limited set of paths initially for the most common combinations
  // The rest will be generated on-demand with fallback: 'blocking'
  const paths: { params: { category: string; state: string } }[] = [];

  // For each category
  serviceCategories.forEach((category) => {
    const categorySlug = getServiceSlug(category.id);
    const clinicsInCategory = filterClinicsByCategory(mockClinics, category.title);
    
    // Group clinics by state
    const clinicsByState = groupClinicsByState(clinicsInCategory);
    
    // For each state with clinics in this category
    Object.keys(clinicsByState).forEach((state) => {
      paths.push({
        params: {
          category: categorySlug,
          state: getStateSlug(state),
        },
      });
    });
  });

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const categorySlug = params?.category as string;
  const stateSlug = params?.state as string;
  
  // Find the matching category
  const categoryData = serviceCategories.find(cat => {
    // Check if the categorySlug matches the full service name
    const fullServiceSlug = getServiceSlug(cat.id);
    return fullServiceSlug === categorySlug;
  });
  
  // If no matching category, return 404
  if (!categoryData) {
    return { notFound: true };
  }
  
  // Filter clinics by this category
  const clinicsInCategory = filterClinicsByCategory(mockClinics, categoryData.title);
  
  // Group clinics by state
  const clinicsByState = groupClinicsByState(clinicsInCategory);
  
  // Find the state that matches our slug
  const matchingState = Object.keys(clinicsByState).find(
    state => getStateSlug(state) === stateSlug
  );
  
  // If no matching state with clinics in this category, return 404
  if (!matchingState) {
    return { notFound: true };
  }
  
  // Get clinics for this state
  const clinicsInState = clinicsByState[matchingState];
  
  // Group clinics by city
  const clinicsByCity = groupClinicsByCity(clinicsInState);
  
  // Create an array of cities with their clinic counts, sorted by count
  const citiesByClinicCount = Object.entries(clinicsByCity).map(([city, clinics]) => ({
    city,
    citySlug: slugify(city), // This is already using our slugify function
    count: clinics.length,
  }))
  .sort((a, b) => b.count - a.count);

  return {
    props: {
      categoryInfo: {
        id: getServiceSlug(categoryData.id), // Use the full service name format
        title: categoryData.title,
        description: categoryData.description,
      },
      stateInfo: {
        stateCode: matchingState,
        fullName: getStateFullName(matchingState),
      },
      citiesByClinicCount,
    },
    // Revalidate every day
    revalidate: 86400,
  };
};