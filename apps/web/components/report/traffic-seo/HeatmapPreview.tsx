import React, { useRef, useEffect } from 'react';
import { HeatmapPoint } from '../../../utils/hooks/useClinicTrafficReport';

interface HeatmapPreviewProps {
  data: HeatmapPoint[];
  clinicName: string;
  className?: string;
}

const HeatmapPreview: React.FC<HeatmapPreviewProps> = ({
  data,
  clinicName,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background mockup of a clinic profile
    drawProfileMockup(ctx, canvas.width, canvas.height, clinicName);
    
    // Draw heatmap points
    data.forEach(point => {
      const x = (point.x / 100) * canvas.width;
      const y = (point.y / 100) * canvas.height;
      const radius = 15 + (point.intensity * 25);
      
      // Create gradient for heatmap point
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${Math.min(0.8, point.intensity)})`);
      gradient.addColorStop(0.5, `rgba(255, 165, 0, ${Math.min(0.5, point.intensity * 0.7)})`);
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      
      // Draw heatmap point
      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [data, clinicName]);
  
  // Helper function to draw a mockup of a clinic profile
  const drawProfileMockup = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    clinicName: string
  ) => {
    // Background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Header area
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height * 0.3);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height * 0.3);
    
    // Clinic name
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(clinicName, width * 0.05, height * 0.1);
    
    // Clinic address
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Arial';
    ctx.fillText('123 Main Street, City, State', width * 0.05, height * 0.15);
    
    // Action buttons
    const buttonWidth = width * 0.2;
    const buttonHeight = height * 0.08;
    const buttonMargin = width * 0.02;
    const buttonY = height * 0.2;
    
    // Phone button
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(width * 0.7, buttonY, buttonWidth, buttonHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Call', width * 0.7 + buttonWidth / 2 - 15, buttonY + buttonHeight / 2 + 5);
    
    // Website button
    ctx.fillStyle = '#10b981';
    ctx.fillRect(width * 0.7 - buttonWidth - buttonMargin, buttonY, buttonWidth, buttonHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Website', width * 0.7 - buttonWidth - buttonMargin + buttonWidth / 2 - 30, buttonY + buttonHeight / 2 + 5);
    
    // Services section
    const servicesY = height * 0.35;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Services', width * 0.05, servicesY);
    
    // Service items
    ctx.fillStyle = '#4b5563';
    ctx.font = '14px Arial';
    const services = ['TRT Therapy', 'ED Treatment', 'Weight Management', 'HGH Therapy'];
    services.forEach((service, index) => {
      const y = servicesY + (index + 1) * 25;
      ctx.fillText(`• ${service}`, width * 0.07, y);
    });
    
    // Reviews section
    const reviewsY = height * 0.6;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Reviews', width * 0.05, reviewsY);
    
    // Star rating
    const starX = width * 0.05;
    const starY = reviewsY + 30;
    const starSize = 20;
    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < 5; i++) {
      drawStar(ctx, starX + i * (starSize + 5), starY, starSize);
    }
    ctx.fillStyle = '#4b5563';
    ctx.font = '14px Arial';
    ctx.fillText('4.8 (36 reviews)', starX + 5 * (starSize + 5) + 10, starY + 5);
    
    // Review cards
    const reviewCardHeight = height * 0.1;
    const reviewCardsY = reviewsY + 50;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(width * 0.05, reviewCardsY, width * 0.9, reviewCardHeight);
    ctx.strokeStyle = '#e5e7eb';
    ctx.strokeRect(width * 0.05, reviewCardsY, width * 0.9, reviewCardHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(width * 0.05, reviewCardsY + reviewCardHeight + 10, width * 0.9, reviewCardHeight);
    ctx.strokeStyle = '#e5e7eb';
    ctx.strokeRect(width * 0.05, reviewCardsY + reviewCardHeight + 10, width * 0.9, reviewCardHeight);
    
    // Contact form
    const contactY = height * 0.85;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Contact Us', width * 0.05, contactY);
    
    // Form fields
    const formY = contactY + 30;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(width * 0.05, formY, width * 0.9, height * 0.1);
    ctx.strokeStyle = '#e5e7eb';
    ctx.strokeRect(width * 0.05, formY, width * 0.9, height * 0.1);
  };
  
  // Helper to draw a star
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number
  ) => {
    const spikes = 5;
    const outerRadius = size / 2;
    const innerRadius = outerRadius / 2;
    
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-medium mb-4">Profile Engagement Heatmap</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Visual representation of user clicks and engagement on the clinic profile
      </p>
      
      <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white">
        <canvas 
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full"
        />
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full"></span>
          <span className="text-xs text-gray-600 dark:text-gray-400">High Activity</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"></span>
          <span className="text-xs text-gray-600 dark:text-gray-400">Medium Activity</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-gradient-to-r from-yellow-300 to-green-300 rounded-full"></span>
          <span className="text-xs text-gray-600 dark:text-gray-400">Low Activity</span>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic">
        * Heatmap based on {data.length} click events. Hover over areas to see details.
      </div>
    </div>
  );
};

export default HeatmapPreview;