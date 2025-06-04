import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getCategoryById, getServiceSlug, getStateSlug } from '../lib/utils';
import { serviceCategories } from '../lib/mockData';

interface BreadcrumbProps {
  category?: string;
  state?: string;
  city?: string;
  clinic?: string;
  categoryTitle?: string;
  stateFullName?: string;
}

const Breadcrumbs: React.FC<BreadcrumbProps> = ({
  category,
  state,
  city,
  clinic,
  categoryTitle,
  stateFullName}) => {
  const router = useRouter();
  let breadcrumbs = [];

  // Home page crumb
  breadcrumbs.push({
    label: 'Home',
    href: '/',
    current: router.pathname === '/'});

  // Category crumb
  if (category) {
    // If categoryTitle wasn't provided, try to find it from service categories
    const categoryInfo = categoryTitle 
      ? { title: categoryTitle } 
      : getCategoryById(category, serviceCategories);

    // Use the full service name format for URLs
    const categorySlug = getServiceSlug(category);

    breadcrumbs.push({
      label: categoryInfo?.title || category,
      href: `/${categorySlug}`,
      current: router.pathname === '/[category]'});
  }

  // State crumb
  if (category && state) {
    // Use the full state name format for URLs
    const stateSlugForUrl = state.length === 2 ? getStateSlug(state) : state;

    breadcrumbs.push({
      label: stateFullName || state,
      href: `/${getServiceSlug(category)}/${stateSlugForUrl}`,
      current: router.pathname === '/[category]/[state]'});
  }

  // City crumb
  if (category && state && city) {
    // Use the full state name format for URLs
    const stateSlugForUrl = state.length === 2 ? getStateSlug(state) : state;

    breadcrumbs.push({
      label: city.replace(/-/g, ' '),
      href: `/${getServiceSlug(category)}/${stateSlugForUrl}/${city}`,
      current: router.pathname === '/[category]/[state]/[city]'});
  }

  // Clinic crumb
  if (category && state && city && clinic) {
    // Use the full state name format for URLs
    const stateSlugForUrl = state.length === 2 ? getStateSlug(state) : state;

    breadcrumbs.push({
      label: clinic.replace(/-/g, ' '),
      href: `/${getServiceSlug(category)}/${stateSlugForUrl}/${city}/${clinic}`,
      current: router.pathname === '/[category]/[state]/[city]/[clinic-slug]'});
  }

  return (
    <nav className="mb-4" aria-label="Breadcrumb">
      {/* Add schema.org structured data for breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': breadcrumbs.map((crumb, index) => ({
              '@type': 'ListItem',
              'position': index + 1,
              'name': crumb.label,
              'item': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com'}${crumb.href}`
            }))
          })
        }}
      />
      
      <ol className="flex flex-wrap items-center space-x-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="mx-1 h-4 w-4 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {crumb.current ? (
              <span className="text-gray-400" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-primary hover:text-red-400 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;