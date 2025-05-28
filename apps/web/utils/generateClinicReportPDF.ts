import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type PDFMode = 'download' | 'preview' | 'blob';

/**
 * Generates a PDF report for a clinic using html2canvas and jsPDF
 * 
 * @param clinicId - The ID of the clinic to generate a report for
 * @param mode - How to handle the generated PDF: 'download', 'preview', or 'blob' (returns Blob)
 * @param adminName - Optional admin name to include as preparer
 */
export const generateClinicReportPDF = async (
  clinicId: string,
  mode: PDFMode = 'download',
  adminName?: string
): Promise<Blob | null> => {
  // Create a container for the report that will be rendered to PDF
  const reportContainer = document.getElementById('pdf-report-container');
  if (!reportContainer) {
    console.error('PDF report container not found');
    return null;
  }
  
  try {
    // Add a class to the body to apply PDF-specific styling
    document.body.classList.add('generating-pdf');
    
    // Set up PDF document (A4 size)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // A4 dimensions (210mm x 297mm)
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Get all page sections that need to be rendered
    const pageSections = reportContainer.querySelectorAll('.pdf-page-section');
    
    // Process each section as a separate page
    for (let i = 0; i < pageSections.length; i++) {
      const section = pageSections[i] as HTMLElement;
      
      // Temporarily show only the current section
      pageSections.forEach((page, index) => {
        (page as HTMLElement).style.display = index === i ? 'block' : 'none';
      });
      
      // Render the section to canvas
      const canvas = await html2canvas(section, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Get the canvas as an image
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate aspect ratio to fit within page
      const imgWidth = pageWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add a new page for each section (except the first)
      if (i > 0) {
        pdf.addPage();
      }
      
      // Add the image to the PDF
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      
      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      const footerText = 'Powered by Men\'s Health Finder – https://menshealthfinder.com';
      pdf.text(
        footerText,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      
      // Add page number
      pdf.text(
        `Page ${i + 1} of ${pageSections.length}`,
        pageWidth - 15,
        pageHeight - 10,
        { align: 'right' }
      );
    }
    
    // Reset display for all sections
    pageSections.forEach((page) => {
      (page as HTMLElement).style.display = 'block';
    });
    
    // Handle the PDF based on the specified mode
    if (mode === 'download') {
      // Download the PDF
      pdf.save(`clinic-report-${clinicId}.pdf`);
      return null;
    } else if (mode === 'preview') {
      // Open in a new tab
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
      return null;
    } else {
      // Return as Blob for further processing (e.g., email attachment)
      return pdf.output('blob');
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  } finally {
    // Remove the PDF generation class
    document.body.classList.remove('generating-pdf');
    
    // Reset display for all sections
    if (reportContainer) {
      const pageSections = reportContainer.querySelectorAll('.pdf-page-section');
      pageSections.forEach((page) => {
        (page as HTMLElement).style.display = 'block';
      });
    }
  }
};

export default generateClinicReportPDF;