import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Breadcrumbs from '../../components/Breadcrumbs';
import { mockClinics, serviceCategories } from '../../lib/mockData';
import { 
  slugify, 
  filterClinicsByCategory, 
  groupClinicsByState, 
  getCategoryById, 
  getStateFullName,
  getStateSlug,
  getServiceSlug
} from '../../lib/utils';

interface CategoryPageProps {
  categoryInfo: {
    id: string;
    title: string;
    description: string;
  };
  statesByClinicCount: { 
    state: string; 
    stateSlug: string;
    fullName: string;
    count: number;
  }[];
}

export default function CategoryPage({ categoryInfo, statesByClinicCount }: CategoryPageProps) {
  const router = useRouter();
  
  // Handle fallback page case
  if (router.isFallback) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>{`${categoryInfo.title} - Men's Health Clinics Near You | Men's Health Finder`}</title>
        <meta 
          name="description" 
          content={`Find specialized men's health clinics offering ${categoryInfo.title.toLowerCase()} near you. Browse clinics by state and city.`} 
        />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com'}/${categoryInfo.id}`} />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <Breadcrumbs category={categoryInfo.id} categoryTitle={categoryInfo.title} />
        
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{categoryInfo.title} Clinics Near You</h1>
        
        <p className="text-[#AAAAAA] text-lg mb-8">
          {categoryInfo.description} Browse {categoryInfo.title.toLowerCase()} clinics by state below to find 
          specialized men's health providers in your area.
        </p>
        
        <div className="glass-card p-6 mb-10">
          <h2 className="text-2xl font-bold mb-6">Browse {categoryInfo.title} Clinics by State</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {statesByClinicCount.map((stateData) => (
              <Link 
                key={stateData.state} 
                href={`/${getServiceSlug(categoryInfo.id)}/${getStateSlug(stateData.state)}`}
                className="flex justify-between items-center bg-gray-900 hover:bg-gray-800 transition-colors p-4 rounded-lg"
              >
                <span className="font-medium">{stateData.fullName}</span>
                <span className="text-[#AAAAAA] text-sm">{stateData.count} clinics</span>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">About {categoryInfo.title} Treatment</h2>
          
          <div className="prose prose-dark max-w-none">
            {categoryInfo.id === 'testosterone-therapy' && (
              <>
                <p>
                  Testosterone replacement therapy (TRT) is a specialized treatment for men with low testosterone levels. 
                  This condition, known as hypogonadism, can cause symptoms like fatigue, reduced sex drive, depression, 
                  and decreased muscle mass.
                </p>
                <p>
                  Men's health clinics specializing in TRT offer comprehensive solutions that may include injectable 
                  testosterone, topical gels, patches, or pellet implants. Your treatment will be tailored to your 
                  specific needs and health status.
                </p>
                <p>
                  When seeking TRT treatment, it's important to choose a specialized men's health clinic with experienced 
                  healthcare providers who can properly diagnose low testosterone and create an effective treatment plan.
                </p>
              </>
            )}
            
            {categoryInfo.id === 'ed-treatment' && (
              <>
                <p>
                  Erectile dysfunction (ED) is a common condition that affects many men, particularly as they age. 
                  Men's health clinics specializing in ED treatment offer a range of effective solutions to help 
                  restore sexual function and confidence.
                </p>
                <p>
                  Treatment options may include oral medications like sildenafil (Viagra) or tadalafil (Cialis), 
                  injectable therapies, vacuum devices, or cutting-edge treatments like shockwave therapy. The right 
                  approach depends on your specific situation and underlying health conditions.
                </p>
                <p>
                  By consulting with a specialized men's health clinic, you'll receive discreet, professional care 
                  from providers who understand these sensitive issues and can offer personalized treatment plans.
                </p>
              </>
            )}
            
            {categoryInfo.id === 'hair-loss' && (
              <>
                <p>
                  Hair loss affects millions of men and can have a significant impact on self-esteem and confidence. 
                  Men's health clinics specializing in hair loss treatments offer proven solutions to slow, stop, or 
                  even reverse male pattern baldness.
                </p>
                <p>
                  Treatment options may include FDA-approved medications like finasteride and minoxidil, advanced 
                  therapies like PRP (platelet-rich plasma) injections, laser therapy, or recommendations for surgical 
                  procedures like hair transplantation.
                </p>
                <p>
                  Specialized men's health clinics can determine the cause of your hair loss and recommend the most 
                  effective treatments based on your specific situation, stage of hair loss, and health history.
                </p>
              </>
            )}
            
            {categoryInfo.id === 'weight-management' && (
              <>
                <p>
                  Weight management for men often requires specialized approaches that address the unique hormonal, 
                  metabolic, and lifestyle factors that affect male physiology. Men's health clinics offer comprehensive 
                  weight management programs tailored specifically for men's needs.
                </p>
                <p>
                  These programs may include medical weight loss protocols, hormone optimization, nutritional guidance, 
                  exercise prescriptions, and behavioral counseling. Many clinics also offer treatments that specifically 
                  target stubborn abdominal fat, which is particularly common in men.
                </p>
                <p>
                  By working with specialists at a men's health clinic, you can address weight management as part of your 
                  overall health optimization, often seeing improvements in energy, physical performance, and other aspects 
                  of your well-being.
                </p>
              </>
            )}
          </div>
          
          <div className="mt-8 flex justify-center">
            <Link href="/search" className="btn flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find More Clinics
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Generate paths for all service categories using the full name format
  const paths = serviceCategories.map((category) => ({
    params: { category: getServiceSlug(category.id) },
  }));

  return {
    paths,
    // Use fallback: 'blocking' so that if we add more categories later,
    // they'll be generated at request time
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const categorySlug = params?.category as string;
  
  // Find the matching category from our service categories
  // This now needs to handle both old format (trt) and new format (testosterone-therapy)
  const categoryData = serviceCategories.find(cat => {
    // Check if the categorySlug matches the full service name
    const fullServiceSlug = getServiceSlug(cat.id);
    return fullServiceSlug === categorySlug;
  });
  
  // If no matching category, return 404
  if (!categoryData) {
    return {
      notFound: true,
    };
  }
  
  // Filter clinics by this category
  const clinicsInCategory = filterClinicsByCategory(mockClinics, categoryData.title);
  
  // Group clinics by state
  const clinicsByState = groupClinicsByState(clinicsInCategory);
  
  // Create an array of states with their clinic counts, sorted by count
  const statesByClinicCount = Object.entries(clinicsByState).map(([state, clinics]) => ({
    state,
    stateSlug: getStateSlug(state),
    fullName: getStateFullName(state),
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
      statesByClinicCount,
    },
    // Revalidate this page every day (in seconds)
    revalidate: 86400,
  };
};