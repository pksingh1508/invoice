import { useState } from 'react';
import { getDefaultTemplate } from '@/lib/pdf/templates';

// Get the default template for PDF generation
const DEFAULT_TEMPLATE = getDefaultTemplate();

/**
 * Utility function to download invoice PDFs
 */
export async function downloadInvoicePDF(invoiceId: string): Promise<void> {
  try {
    const response = await fetch('/api/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice_id: invoiceId,
        template_id: DEFAULT_TEMPLATE.id,
        format: 'blob',
        quality: 'standard',
        for_email: false
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate PDF');
    }
    
    // Get filename from response headers or create default
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `invoice-${invoiceId.slice(-6)}.pdf`;
    
    // Create blob and download
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('PDF Download Error:', error);
    throw error instanceof Error ? error : new Error('Failed to download PDF');
  }
}

/**
 * React hook for PDF download functionality with loading state
 */
export function usePDFDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const downloadPDF = async (invoiceId: string) => {
    try {
      setIsDownloading(true);
      await downloadInvoicePDF(invoiceId);
    } catch (error) {
      // Re-throw the error so the caller can handle it
      throw error;
    } finally {
      setIsDownloading(false);
    }
  };
  
  return { downloadPDF, isDownloading };
}