import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-[#111111] pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          <div className="md:col-span-4">
            <div className="relative w-48 h-12 mb-6">
              <Image 
                src="/Men_s-Health-Finder-LOGO-White.png" 
                alt="Men's Health Finder Logo" 
                fill
                sizes="(max-width: 768px) 100vw, 192px"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <p className="text-[#AAAAAA] mb-6 text-sm max-w-xs">
              The premier directory connecting men with specialized healthcare providers across the United States.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/menshealthfinder" 
                className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center text-white hover:bg-primary transition-colors"
                aria-label="Follow us on Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center text-white hover:bg-primary transition-colors"
                aria-label="Follow us on Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a 
                href="https://www.instagram.com/menshealthfinder/" 
                className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center text-white hover:bg-primary transition-colors"
                aria-label="Follow us on Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913a5.885 5.885 0 001.384 2.126A5.868 5.868 0 004.14 23.37c.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558a5.898 5.898 0 002.126-1.384 5.86 5.86 0 001.384-2.126c.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913a5.89 5.89 0 00-1.384-2.126A5.847 5.847 0 0019.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227a3.81 3.81 0 01-.899 1.382 3.744 3.744 0 01-1.38.896c-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421a3.716 3.716 0 01-1.379-.899 3.644 3.644 0 01-.9-1.38c-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 01-2.88 0 1.44 1.44 0 012.88 0z" />
                </svg>
              </a>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-white text-lg font-bold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-[#AAAAAA] hover:text-primary transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-[#AAAAAA] hover:text-primary transition-colors text-sm">
                  Find a Clinic
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-[#AAAAAA] hover:text-primary transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#AAAAAA] hover:text-primary transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-3">
            <h3 className="text-white text-lg font-bold mb-6">Treatments</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/search?service=TRT" className="text-[#AAAAAA] hover:text-primary transition-colors text-sm">
                  Testosterone Replacement
                </Link>
              </li>
              <li>
                <Link href="/search?service=ED" className="text-[#AAAAAA] hover:text-primary transition-colors text-sm">
                  ED Treatment
                </Link>
              </li>
              <li>
                <Link href="/search?service=Hair Loss" className="text-[#AAAAAA] hover:text-primary transition-colors text-sm">
                  Hair Loss
                </Link>
              </li>
              <li>
                <Link href="/search?service=Weight Loss" className="text-[#AAAAAA] hover:text-primary transition-colors text-sm">
                  Weight Management
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-3">
            <h3 className="text-white text-lg font-bold mb-6">For Clinic Owners</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/sign-up" className="text-[#AAAAAA] hover:text-primary transition-colors text-sm">
                  List Your Clinic
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-[#AAAAAA] hover:text-primary transition-colors text-sm">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-[#AAAAAA] hover:text-primary transition-colors text-sm">
                  Login to Dashboard
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-[#AAAAAA] hover:text-primary transition-colors text-sm">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-[#222222] pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#666666] text-sm mb-4 md:mb-0">&copy; {new Date().getFullYear()} Men's Health Finder. All rights reserved.</p>
            <div className="flex flex-wrap gap-6">
              <Link href="/privacy" className="text-[#666666] hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-[#666666] hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/sitemap" className="text-[#666666] hover:text-white text-sm transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;