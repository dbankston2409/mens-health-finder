import type { NextApiRequest, NextApiResponse } from 'next';
import { getActiveAlerts } from '../../../apps/worker/utils/alertEngine';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = '20' } = req.query;
    
    const alerts = await getActiveAlerts(parseInt(limit as string));

    res.status(200).json({
      success: true,
      alerts,
      count: alerts.length
    });
    
  } catch (error) {
    console.error('Alerts API error:', error);
    res.status(500).json({
      error: 'Failed to fetch alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}