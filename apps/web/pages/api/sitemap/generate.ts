import type { NextApiRequest, NextApiResponse } from 'next';
import { generateSitemapDaily } from '../../../utils/seo/sitemapGenerator';

/**
 * API endpoint to generate the sitemap
 * 
 * @param req - The API request
 * @param res - The API response
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Generate sitemap
    const success = await generateSitemapDaily();
    
    if (success) {
      res.status(200).json({ 
        success: true, 
        message: 'Sitemap generated successfully'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate sitemap'
      });
    }
  } catch (error) {
    console.error('Error in sitemap generation API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while generating the sitemap'
    });
  }
}