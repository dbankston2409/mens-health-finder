import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { DevAdminBypass } from './DevAdminBypass';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const handleAuthChange = () => {
    // Force re-render of auth state
    window.location.reload();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <DevAdminBypass onAdminLogin={handleAuthChange} />
    </div>
  );
};

export default Layout;
