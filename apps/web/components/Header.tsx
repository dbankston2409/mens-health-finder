import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '../lib/contexts/authContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, userData, logout } = useAuth();

  return (
    <header className="bg-[#111111] border-b border-[#222222] py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="relative w-48 h-12">
            <Image 
              src="/Men_s-Health-Finder-LOGO-White.png" 
              alt="Men's Health Finder Logo" 
              fill
              sizes="(max-width: 768px) 100vw, 192px"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-white hover:text-primary transition-colors text-sm font-medium">
            Home
          </Link>
          <Link href="/search" className="text-white hover:text-primary transition-colors text-sm font-medium">
            Find a Clinic
          </Link>
          <Link href="/about" className="text-white hover:text-primary transition-colors text-sm font-medium">
            About
          </Link>
          <Link href="/contact" className="text-white hover:text-primary transition-colors text-sm font-medium">
            Contact
          </Link>
          <div className="h-6 border-l border-[#333333] mx-1"></div>
          <Link 
            href="/sign-up" 
            className="bg-primary hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            List Your Clinic
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-white p-2 rounded-lg hover:bg-[#222222] transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#111111] border-t border-[#222222] py-4 px-4 absolute w-full shadow-lg">
          <nav className="flex flex-col space-y-4">
            <Link 
              href="/" 
              className="text-white hover:text-primary transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/search" 
              className="text-white hover:text-primary transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Find a Clinic
            </Link>
            <Link 
              href="/about" 
              className="text-white hover:text-primary transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className="text-white hover:text-primary transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="border-t border-[#222222] pt-4">
              <Link 
                href="/sign-up" 
                className="w-full inline-block text-center bg-primary hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                List Your Clinic
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;