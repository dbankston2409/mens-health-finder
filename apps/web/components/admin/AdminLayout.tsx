import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../lib/contexts/authContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();
  const { logout, userData } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const isActive = (path: string) => {
    return router.pathname.startsWith(path) ? 'bg-primary bg-opacity-20 text-primary' : 'hover:bg-gray-800';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#111111]">
        {/* Admin Header */}
        <header className="bg-[#0A0A0A] shadow-md border-b border-[#222222] z-50">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="mr-4 p-2 rounded-md hover:bg-gray-800"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={isSidebarOpen ? "M4 6h16M4 12h16M4 18h16" : "M4 6h16M4 12h16M4 18h16"} 
                  />
                </svg>
              </button>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                {/* Notification Bell */}
                <button className="p-2 rounded-full hover:bg-gray-800 relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full"></span>
                </button>
              </div>

              {/* User Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-800">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                    {userData?.name ? userData.name.charAt(0) : 'U'}
                  </div>
                  <span>{userData?.name || 'Admin'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-[#0A0A0A] border border-[#222222] rounded-md shadow-lg hidden group-hover:block z-50">
                  <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-gray-800">
                    Profile Settings
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-800"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside 
            className={`w-64 bg-[#0A0A0A] border-r border-[#222222] shadow-lg fixed top-[57px] h-full transition-all duration-300 z-40 ${
              isSidebarOpen ? 'left-0' : '-left-64'
            }`}
          >
            <nav className="py-6 px-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs uppercase font-semibold text-gray-500 px-3 mb-2">Dashboard</h3>
                  <Link 
                    href="/admin/overview" 
                    className={`flex items-center px-3 py-2 rounded-md text-sm ${isActive('/admin/overview')}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Overview
                  </Link>
                </div>

                <div>
                  <h3 className="text-xs uppercase font-semibold text-gray-500 px-3 mb-2">Client Management</h3>
                  <div className="space-y-1">
                    <Link 
                      href="/admin/clients" 
                      className={`flex items-center px-3 py-2 rounded-md text-sm ${isActive('/admin/clients')}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Clients
                    </Link>
                    <Link 
                      href="/admin/validation-queue" 
                      className={`flex items-center px-3 py-2 rounded-md text-sm ${isActive('/admin/validation-queue')}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Validation Queue
                    </Link>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs uppercase font-semibold text-gray-500 px-3 mb-2">Site Management</h3>
                  <div className="space-y-1">
                    <Link 
                      href="/admin/content" 
                      className={`flex items-center px-3 py-2 rounded-md text-sm ${isActive('/admin/content')}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Content
                    </Link>
                    <Link 
                      href="/admin/analytics" 
                      className={`flex items-center px-3 py-2 rounded-md text-sm ${isActive('/admin/analytics')}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Analytics
                    </Link>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs uppercase font-semibold text-gray-500 px-3 mb-2">Settings</h3>
                  <div className="space-y-1">
                    <Link 
                      href="/admin/settings" 
                      className={`flex items-center px-3 py-2 rounded-md text-sm ${isActive('/admin/settings')}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      General
                    </Link>
                    <Link 
                      href="/admin/users" 
                      className={`flex items-center px-3 py-2 rounded-md text-sm ${isActive('/admin/users')}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      User Accounts
                    </Link>
                    <Link 
                      href="/admin/settings/outreach" 
                      className={`flex items-center px-3 py-2 rounded-md text-sm ${isActive('/admin/settings/outreach')}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      Outreach Campaigns
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <div 
            className={`flex-1 transition-all duration-300 ${
              isSidebarOpen ? 'ml-64' : 'ml-0'
            }`}
          >
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold">{title}</h1>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminLayout;