import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function USOnlyPage() {
  return (
    <>
      <Head>
        <title>US Only Service - Men's Health Finder</title>
        <meta name="description" content="Men's Health Finder is currently available only in the United States" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* US Flag Icon */}
            <div className="mb-6">
              <svg className="w-20 h-20 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Men's Health Finder is US-Only
            </h1>
            
            <p className="text-gray-600 mb-8">
              We exclusively serve men's health clinics in the United States. 
              Our directory and services are specifically designed for the US healthcare system.
            </p>

            <div className="space-y-4 text-left">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Traveling to the US?
                </h3>
                <p className="text-sm text-gray-600">
                  Bookmark our site for when you arrive! We'll automatically detect your US location and show nearby clinics.
                </p>
              </div>

              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Using a VPN?
                </h3>
                <p className="text-sm text-gray-600">
                  Please connect to a US-based VPN server to access our services.
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Why US Only?
                </h3>
                <p className="text-sm text-gray-600">
                  We specialize in the US healthcare system, insurance providers, and FDA-approved treatments specific to American men's health clinics.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                If you believe you're seeing this message in error, please check your internet connection or VPN settings.
              </p>
            </div>

            <div className="mt-6">
              <Link href="/">
                <a className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Try Again →
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}