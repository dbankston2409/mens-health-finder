import Head from 'next/head';
import Link from 'next/link';

const About = () => {
  return (
    <>
      <Head>
        <title>About Us | Men's Health Finder</title>
        <meta name="description" content="Learn about Men's Health Finder and our mission to connect men with specialized healthcare providers" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-8">About Men's Health Finder</h1>
            
            <div className="prose prose-lg prose-invert max-w-none">
              <p className="text-xl text-textSecondary mb-8">
                Men's Health Finder is the premier online directory connecting men with specialized healthcare providers across the United States.
              </p>
              
              <h2 className="text-2xl font-bold mt-12 mb-4">Our Mission</h2>
              <p>
                Our mission is to make it easy for men to find quality healthcare providers specializing in men's health issues. 
                We believe in removing barriers to care by providing a comprehensive, easy-to-use platform that connects men with 
                the right healthcare providers for their specific needs.
              </p>
              
              <h2 className="text-2xl font-bold mt-12 mb-4">Why Men's Health Matters</h2>
              <p>
                Men face unique health challenges and often delay seeking medical care until problems become severe. 
                We're dedicated to changing this pattern by making it easier to find specialized care for issues like 
                testosterone deficiency, erectile dysfunction, hair loss, and weight management.
              </p>
              
              <h2 className="text-2xl font-bold mt-12 mb-4">For Patients</h2>
              <p>
                Men's Health Finder offers a user-friendly platform to search for specialized clinics based on location and services. 
                Our directory includes detailed clinic profiles, verified reviews, and easy booking options to help you make informed decisions about your care.
              </p>
              
              <h2 className="text-2xl font-bold mt-12 mb-4">For Providers</h2>
              <p>
                We offer tiered listing options for men's health clinics looking to reach more patients. 
                Our platform provides visibility, credibility, and new patient acquisition opportunities through 
                our comprehensive directory and booking system.
              </p>
              
              <div className="bg-gray-900 rounded-xl p-8 my-12">
                <h2 className="text-2xl font-bold mb-4">Join Men's Health Finder Today</h2>
                <p className="mb-6">
                  Whether you're seeking specialized care or a provider looking to grow your practice, 
                  Men's Health Finder connects the right patients with the right providers.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/search" className="btn">
                    Find a Clinic
                  </Link>
                  <Link href="/sign-up" className="btn bg-gray-800 hover:bg-gray-700">
                    List Your Clinic
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default About;
