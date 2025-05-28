import { useMemo } from 'react';

export interface CancellationReason {
  id: string;
  name: string;
  count: number;
  amount: number;
  color: string;
}

export interface LostClient {
  id: string;
  clinicId: string;
  clinicName: string;
  amount: number;
  reason: string;
  date: string;
  package: string;
  salesRep?: string;
  region?: string;
}

export interface LostRevenueData {
  totalLost: number;
  lostThisMonth: number;
  lostThisYear: number;
  reasons: CancellationReason[];
  clients: LostClient[];
}

// This function will parse the raw data and calculate lost revenue statistics
export const calculateLostRevenue = (
  data: LostClient[], 
  filters: { 
    package?: string; 
    salesRep?: string; 
    region?: string;
    startDate?: Date;
    endDate?: Date;
  }
): LostRevenueData => {
  // Apply filters
  let filteredData = [...data];
  
  if (filters.package) {
    filteredData = filteredData.filter(client => client.package === filters.package);
  }
  
  if (filters.salesRep) {
    filteredData = filteredData.filter(client => client.salesRep === filters.salesRep);
  }
  
  if (filters.region) {
    filteredData = filteredData.filter(client => client.region === filters.region);
  }
  
  if (filters.startDate) {
    filteredData = filteredData.filter(client => 
      new Date(client.date) >= filters.startDate!
    );
  }
  
  if (filters.endDate) {
    filteredData = filteredData.filter(client => 
      new Date(client.date) <= filters.endDate!
    );
  }
  
  // Calculate total lost revenue
  const totalLost = filteredData.reduce((sum, client) => sum + client.amount, 0);
  
  // Calculate lost revenue this month
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const lostThisMonth = filteredData
    .filter(client => {
      const date = new Date(client.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    })
    .reduce((sum, client) => sum + client.amount, 0);
  
  // Calculate lost revenue this year
  const lostThisYear = filteredData
    .filter(client => {
      const date = new Date(client.date);
      return date.getFullYear() === thisYear;
    })
    .reduce((sum, client) => sum + client.amount, 0);
  
  // Calculate lost revenue by reason
  const reasonsMap = new Map<string, { count: number; amount: number }>();
  
  filteredData.forEach(client => {
    const reason = client.reason;
    const current = reasonsMap.get(reason) || { count: 0, amount: 0 };
    
    reasonsMap.set(reason, {
      count: current.count + 1,
      amount: current.amount + client.amount
    });
  });
  
  // Colors for different cancellation reasons
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#FFD166', // Yellow
    '#118AB2', // Blue
    '#073B4C', // Dark Blue
    '#8A6552', // Brown
    '#9A348E', // Purple
    '#F86624'  // Orange
  ];
  
  // Convert to reasons array
  const reasons: CancellationReason[] = Array.from(reasonsMap.entries())
    .map(([name, { count, amount }], index) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      count,
      amount,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.amount - a.amount); // Sort by amount (highest first)
  
  return {
    totalLost,
    lostThisMonth,
    lostThisYear,
    reasons,
    clients: filteredData
  };
};

// React hook for memoized calculation
export const useLostRevenue = (
  data: LostClient[], 
  filters: { 
    package?: string; 
    salesRep?: string; 
    region?: string;
    startDate?: Date;
    endDate?: Date;
  }
): LostRevenueData => {
  return useMemo(() => calculateLostRevenue(data, filters), [
    data,
    filters.package,
    filters.salesRep,
    filters.region,
    filters.startDate,
    filters.endDate
  ]);
};