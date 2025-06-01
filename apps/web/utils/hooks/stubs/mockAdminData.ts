/**
 * Mock data for admin-related hooks when Firebase access fails
 * This allows testing UI without proper Firebase permissions
 */

// Mock traffic data
export const mockTrafficData = {
  views: {
    total: 245,
    lastMonth: 89,
    thisMonth: 156,
    trend: 'up',
    percentChange: 75
  },
  clicks: {
    total: 42,
    lastMonth: 15,
    thisMonth: 27,
    trend: 'up',
    percentChange: 80
  },
  callsTracked: {
    total: 18,
    lastMonth: 6,
    thisMonth: 12,
    trend: 'up',
    percentChange: 100
  },
  conversionRate: 7.35,
  sources: [
    { source: 'google', count: 154, percentage: 63 },
    { source: 'direct', count: 48, percentage: 19 },
    { source: 'referral', count: 28, percentage: 11 },
    { source: 'social', count: 15, percentage: 7 }
  ],
  pages: [
    { url: '/clinic/1', views: 78, clicks: 12 },
    { url: '/search?q=testosterone', views: 42, clicks: 8 }
  ],
  dailyViews: [
    { date: '2023-05-01', views: 5 },
    { date: '2023-05-02', views: 7 },
    { date: '2023-05-03', views: 3 },
    { date: '2023-05-04', views: 8 },
    { date: '2023-05-05', views: 10 },
    { date: '2023-05-06', views: 12 },
    { date: '2023-05-07', views: 9 }
  ]
};

// Mock billing data
export const mockBillingData = {
  currentPlan: 'advanced',
  status: 'active',
  nextBillingDate: '2023-06-15',
  paymentMethod: {
    type: 'card',
    last4: '4242',
    expMonth: 12,
    expYear: 2025
  },
  transactions: [
    {
      id: 'tx_123456',
      date: '2023-05-15',
      amount: 199.99,
      description: 'Monthly subscription - Advanced Plan',
      status: 'completed'
    },
    {
      id: 'tx_123455',
      date: '2023-04-15',
      amount: 199.99,
      description: 'Monthly subscription - Advanced Plan',
      status: 'completed'
    },
    {
      id: 'tx_123454',
      date: '2023-03-15',
      amount: 199.99,
      description: 'Monthly subscription - Advanced Plan',
      status: 'completed'
    }
  ]
};

// Mock admin logs
export const mockAdminLogs = [
  {
    id: 'log_1001',
    timestamp: new Date('2023-05-20T14:25:32'),
    action: 'note',
    user: {
      id: 'admin1',
      name: 'Admin User',
      email: 'admin@example.com'
    },
    note: 'Clinic requested call back about upgrading package.',
    tags: ['callback', 'sales']
  },
  {
    id: 'log_1000',
    timestamp: new Date('2023-05-15T11:12:45'),
    action: 'update',
    user: {
      id: 'admin1',
      name: 'Admin User',
      email: 'admin@example.com'
    },
    changes: [
      { field: 'name', oldValue: 'Men\'s Health Center', newValue: 'Advanced Men\'s Health Center' },
      { field: 'phone', oldValue: '555-123-4567', newValue: '555-987-6543' }
    ]
  },
  {
    id: 'log_999',
    timestamp: new Date('2023-05-10T09:30:18'),
    action: 'note',
    user: {
      id: 'admin2',
      name: 'Support Team',
      email: 'support@example.com'
    },
    note: 'Clinic reported issue with website link. Verified and fixed.',
    tags: ['support', 'resolved']
  }
];

// Mock communications data
export const mockCommsData = [
  {
    id: 'comm_501',
    timestamp: new Date('2023-05-22T10:15:00'),
    type: 'email',
    direction: 'outbound',
    from: {
      name: 'Support Team',
      email: 'support@example.com'
    },
    to: {
      name: 'Clinic Manager',
      email: 'manager@example.com'
    },
    subject: 'Your Monthly Performance Report',
    content: 'Dear Clinic Manager,\n\nYour monthly performance report is ready. We\'re pleased to see a 15% increase in traffic to your listing.\n\nBest regards,\nSupport Team',
    status: 'delivered'
  },
  {
    id: 'comm_500',
    timestamp: new Date('2023-05-20T14:30:45'),
    type: 'phone',
    direction: 'inbound',
    from: {
      name: 'Clinic Owner',
      phone: '555-123-4567'
    },
    to: {
      name: 'Sales Team',
      phone: '800-555-1234'
    },
    duration: '12:45',
    summary: 'Clinic owner called about upgrading to Premium package. Discussed benefits and pricing. Will follow up with email proposal.',
    status: 'completed',
    tags: ['sales', 'upgrade']
  },
  {
    id: 'comm_499',
    timestamp: new Date('2023-05-18T09:10:22'),
    type: 'email',
    direction: 'inbound',
    from: {
      name: 'Clinic Manager',
      email: 'manager@example.com'
    },
    to: {
      name: 'Support Team',
      email: 'support@example.com'
    },
    subject: 'Question about review system',
    content: 'Hello Support,\n\nWe\'ve noticed several new reviews on our listing. Is there a way to respond to them?\n\nThank you,\nClinic Manager',
    status: 'replied',
    tags: ['support', 'reviews']
  }
];