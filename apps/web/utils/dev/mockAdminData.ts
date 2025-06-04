/**
 * Mock data for admin dashboard in development mode
 * Used to bypass Firebase permission issues
 */

import { mockClinics } from '../../lib/mockData';

export const mockAdminMetrics = {
  sales: {
    totalRevenue: 24950.00,
    activeClinics: 42,
    conversion: 0.18,
    revenueByTier: {
      high: 15000.00,
      low: 9500.00,
      free: 450.00},
    subscriptionsByTier: {
      high: 10,
      low: 19,
      free: 13},
    revenueByMonth: [
      { month: 'Jan', revenue: 1200 },
      { month: 'Feb', revenue: 1800 },
      { month: 'Mar', revenue: 2400 },
      { month: 'Apr', revenue: 2100 },
      { month: 'May', revenue: 2900 },
      { month: 'Jun', revenue: 3200 },
      { month: 'Jul', revenue: 3600 },
      { month: 'Aug', revenue: 3900 },
      { month: 'Sep', revenue: 4200 }]},
  
  traffic: {
    totalPageviews: 58742,
    uniqueVisitors: 28451,
    avgSessionDuration: 187, // seconds
    bounceRate: 0.42,
    topReferrers: [
      { source: 'Google', visits: 18245 },
      { source: 'Direct', visits: 5621 },
      { source: 'Facebook', visits: 3842 },
      { source: 'Twitter', visits: 1253 },
      { source: 'Reddit', visits: 984 }],
    trafficByDay: [
      { date: '2023-09-01', visits: 1837 },
      { date: '2023-09-02', visits: 1942 },
      { date: '2023-09-03', visits: 1756 },
      { date: '2023-09-04', visits: 1988 },
      { date: '2023-09-05', visits: 2104 },
      { date: '2023-09-06', visits: 2231 },
      { date: '2023-09-07', visits: 2087 },
      { date: '2023-09-08', visits: 2190 },
      { date: '2023-09-09', visits: 2305 },
      { date: '2023-09-10', visits: 2145 }]},
  
  seo: {
    totalKeywords: 428,
    topPositions: 64, // keywords in top 3
    avgPosition: 18.4,
    topSearchTerms: [
      { term: 'trt clinic near me', position: 3, volume: 4800 },
      { term: 'testosterone replacement therapy', position: 5, volume: 3600 },
      { term: 'men\'s health clinic', position: 2, volume: 2900 },
      { term: 'ed treatment', position: 8, volume: 5400 },
      { term: 'low testosterone symptoms', position: 4, volume: 2200 }],
    siteHealth: 0.87,
    indexedPages: 384},
  
  engagement: {
    contactClicks: 3842,
    callClicks: 1256,
    websiteClicks: 2190,
    saveClicks: 874,
    reviewsSubmitted: 286,
    avgTimeOnProfile: 164, // seconds
    topClinics: mockClinics.slice(0, 5).map(clinic => ({
      id: clinic.id,
      name: clinic.name,
      city: clinic.city,
      state: clinic.state,
      tier: clinic.tier,
      views: Math.floor(Math.random() * 500) + 100,
      calls: Math.floor(Math.random() * 50) + 10}))},
  
  lostRevenue: {
    totalEstimate: 15800.00,
    reasonBreakdown: {
      'Incomplete profiles': 4200.00,
      'Missing contact info': 3600.00,
      'Low review count': 2800.00,
      'Poor website performance': 2400.00,
      'Inactive accounts': 2800.00},
    clinicBreakdown: mockClinics.slice(2, 7).map(clinic => ({
      id: clinic.id,
      name: clinic.name,
      reason: ['Incomplete profile', 'Missing contact info', 'Low review count', 'Poor website performance'][Math.floor(Math.random() * 4)],
      estimate: Math.floor(Math.random() * 2000) + 500}))},
  
  websiteHealth: {
    performance: 0.82,
    accessibility: 0.91,
    bestPractices: 0.87,
    seo: 0.94,
    issuesByCategory: {
      Performance: ['Optimize images', 'Reduce unused JavaScript', 'Eliminate render-blocking resources'],
      Accessibility: ['Improve keyboard navigation', 'Add ARIA labels'],
      'Best Practices': ['HTTPS usage', 'Avoid deprecated APIs'],
      SEO: ['Add meta descriptions', 'Fix crawlable links']}},
  
  notifications: [
    {
      id: '1',
      type: 'alert',
      message: 'Prime Men\'s Health subscription payment failed',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      clinicId: 1},
    {
      id: '2',
      type: 'info',
      message: 'New clinic validated: Superior Men\'s Clinic',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      clinicId: 4},
    {
      id: '3',
      type: 'success',
      message: 'Monthly traffic report generated',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)},
    {
      id: '4',
      type: 'warning',
      message: 'SEO performance dropped for 3 clinics',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)},
    {
      id: '5',
      type: 'alert',
      message: 'Elite Men\'s Clinic website is down',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      clinicId: 2}]};

export const mockClinicQueueData = mockClinics.map(clinic => ({
  id: String(clinic.id),
  name: clinic.name,
  address: clinic.address || `${Math.floor(Math.random() * 1000) + 100} Main St, ${clinic.city}, ${clinic.state} ${Math.floor(Math.random() * 90000) + 10000}`,
  city: clinic.city,
  state: clinic.state,
  phone: clinic.phone || `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
  website: clinic.website || `https://${clinic.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
  services: clinic.services || ['TRT', 'ED Treatment'],
  status: ['pending', 'active', 'paused'][Math.floor(Math.random() * 3)],
  tags: ['needs-validation', 'incomplete-profile', 'high-potential'][Math.floor(Math.random() * 3)].split('-'),
  validationStatus: {
    verified: Math.random() > 0.5,
    method: ['manual', 'auto'][Math.floor(Math.random() * 2)],
    websiteOK: Math.random() > 0.3},
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)}));

export const mockClinicDetails = (id: string) => {
  const clinic = mockClinics.find(c => c.id === Number(id));
  
  if (!clinic) return null;
  
  return {
    ...clinic,
    id: String(clinic.id),
    trafficData: {
      views: {
        total: Math.floor(Math.random() * 5000) + 1000,
        byDay: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
          count: Math.floor(Math.random() * 50) + 10}))},
      calls: {
        total: Math.floor(Math.random() * 500) + 100,
        byDay: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
          count: Math.floor(Math.random() * 5) + 1}))},
      websiteClicks: {
        total: Math.floor(Math.random() * 800) + 200,
        byDay: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
          count: Math.floor(Math.random() * 10) + 3}))}},
    billingHistory: [
      {
        id: 'inv-001',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        amount: clinic.tier === 'high' ? 299.99 : clinic.tier === 'low' ? 149.99 : 0,
        status: 'paid',
        plan: clinic.tier},
      {
        id: 'inv-002',
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        amount: clinic.tier === 'high' ? 299.99 : clinic.tier === 'low' ? 149.99 : 0,
        status: 'paid',
        plan: clinic.tier},
      {
        id: 'inv-003',
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        amount: clinic.tier === 'high' ? 299.99 : clinic.tier === 'low' ? 149.99 : 0,
        status: 'paid',
        plan: clinic.tier}],
    communicationLog: [
      {
        id: 'comm-001',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        type: 'email',
        subject: 'Monthly Performance Report',
        notes: 'Sent monthly performance report with website analytics',
        user: 'admin@test.com'},
      {
        id: 'comm-002',
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        type: 'call',
        subject: 'Subscription Renewal',
        notes: 'Discussed renewal options, client interested in upgrading to High tier',
        user: 'admin@test.com'},
      {
        id: 'comm-003',
        date: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
        type: 'email',
        subject: 'Welcome to Men\'s Health Finder',
        notes: 'Sent welcome email with account setup instructions',
        user: 'admin@test.com'}],
    adminNotes: [
      {
        id: 'note-001',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        text: 'Clinic owner expressed interest in upgrading to High tier in next billing cycle',
        user: 'admin@test.com'},
      {
        id: 'note-002',
        date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        text: 'Profile needs updated photos of the facility',
        user: 'admin@test.com'}],
    tags: ['active', 'verified', 'premium-potential']};
};

export const mockSeoPerformance = {
  overallScore: 83,
  indexedPages: 384,
  lastSitemapUpdate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  topKeywords: [
    { keyword: 'trt clinic near me', position: 3, change: 1, volume: 4800 },
    { keyword: 'testosterone replacement therapy', position: 5, change: -2, volume: 3600 },
    { keyword: 'men\'s health clinic', position: 2, change: 0, volume: 2900 },
    { keyword: 'ed treatment', position: 8, change: 3, volume: 5400 },
    { keyword: 'low testosterone symptoms', position: 4, change: 1, volume: 2200 }],
  clinicSeoPerformance: mockClinics.slice(0, 10).map(clinic => ({
    id: String(clinic.id),
    name: clinic.name,
    city: clinic.city,
    state: clinic.state,
    tier: clinic.tier,
    localRanking: Math.floor(Math.random() * 10) + 1,
    keywordsRanked: Math.floor(Math.random() * 50) + 10,
    organicTraffic: Math.floor(Math.random() * 1000) + 100})),
  cityRankings: [
    { city: 'Austin', state: 'TX', position: 2, searchVolume: 2400 },
    { city: 'Dallas', state: 'TX', position: 3, searchVolume: 3100 },
    { city: 'Houston', state: 'TX', position: 5, searchVolume: 4200 },
    { city: 'San Antonio', state: 'TX', position: 4, searchVolume: 1800 },
    { city: 'Temecula', state: 'CA', position: 1, searchVolume: 780 }]};