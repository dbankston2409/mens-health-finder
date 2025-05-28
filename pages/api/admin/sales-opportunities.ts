import type { NextApiRequest, NextApiResponse } from 'next';
import { getSalesOpportunityClinics } from '../../../apps/worker/utils/getSalesOpportunityClinics';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = '10', minClicks = '20', includeBasic = 'true' } = req.query;
    
    const opportunities = await getSalesOpportunityClinics({
      maxResults: parseInt(limit as string),
      minClicks: parseInt(minClicks as string),
      includeBasic: includeBasic === 'true',
      requireNoCallTracking: true
    });

    res.status(200).json({
      success: true,
      opportunities,
      count: opportunities.length
    });
    
  } catch (error) {
    console.error('Sales opportunities API error:', error);
    res.status(500).json({
      error: 'Failed to fetch sales opportunities',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}