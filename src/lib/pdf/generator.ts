import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { 
  InvoiceTemplateData, 
  InvoiceTemplateConfig, 
  CompanyBranding, 
  TemplateRenderOptions 
} from '@/types/templates';
import { 
  getTemplateById, 
  getDefaultTemplate 
} from '@/lib/pdf/templates';
import { applyBrandingToTemplate } from '@/lib/pdf/branding';

// Import PDF template components
import ClassicTemplate from './components/ClassicTemplate';

// Template component mapping
const TEMPLATE_COMPONENTS = {
  'classic-professional': ClassicTemplate,
  // Will add more templates here
  // 'modern-bold': ModernTemplate,
  // 'minimal-clean': MinimalTemplate,
} as const;

export interface PDFGenerationResult {
  success: boolean;
  blob?: Blob;
  arrayBuffer?: ArrayBuffer;
  error?: string;
  filename?: string;
  size?: number;
}

export interface PDFGenerationOptions {
  format?: 'blob' | 'arrayBuffer' | 'base64';
  quality?: 'draft' | 'standard' | 'high';
  filename?: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
  };
}

/**
 * Main PDF Generator Class
 */
export class InvoicePDFGenerator {
  private static instance: InvoicePDFGenerator;
  
  private constructor() {}
  
  static getInstance(): InvoicePDFGenerator {
    if (!InvoicePDFGenerator.instance) {
      InvoicePDFGenerator.instance = new InvoicePDFGenerator();
    }
    return InvoicePDFGenerator.instance;
  }
  
  /**
   * Generate PDF from template and data
   */
  async generatePDF(
    renderOptions: TemplateRenderOptions,
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      // Validate input
      const validation = this.validateRenderOptions(renderOptions);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }
      
      // Get template configuration
      const template = getTemplateById(renderOptions.template_id);
      if (!template) {
        return {
          success: false,
          error: `Template not found: ${renderOptions.template_id}`
        };
      }
      
      // Apply branding if provided
      let config = template.config;
      if (renderOptions.branding) {
        config = applyBrandingToTemplate(config, renderOptions.branding);
      }
      
      // Get the React component for this template
      const TemplateComponent = TEMPLATE_COMPONENTS[renderOptions.template_id as keyof typeof TEMPLATE_COMPONENTS];
      if (!TemplateComponent) {
        return {
          success: false,
          error: `Template component not implemented: ${renderOptions.template_id}`
        };
      }
      
      // Create React element
      const element = React.createElement(TemplateComponent, {
        data: renderOptions.data,
        config: config
      });
      
      // Set PDF metadata
      const metadata = this.createMetadata(renderOptions, options.metadata);
      
      // Generate PDF
      // @ts-ignore - Temporary fix for template props compatibility
      const pdfDoc = await pdf(element).toBlob();
      
      // Convert to requested format
      const result = await this.convertToFormat(pdfDoc, options.format || 'blob');
      
      // Generate filename
      const filename = options.filename || this.generateFilename(renderOptions.data);
      
      return {
        success: true,
        blob: result.blob,
        arrayBuffer: result.arrayBuffer,
        filename,
        size: pdfDoc.size
      };
      
    } catch (error) {
      console.error('PDF Generation Error:', error);
      return {
        success: false,
        error: `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Generate PDF and trigger download
   */
  async downloadPDF(
    renderOptions: TemplateRenderOptions,
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    const result = await this.generatePDF(renderOptions, { ...options, format: 'blob' });
    
    if (result.success && result.blob) {
      this.triggerDownload(result.blob, result.filename || 'invoice.pdf');
    }
    
    return result;
  }
  
  /**
   * Generate PDF for email attachment
   */
  async generateForEmail(
    renderOptions: TemplateRenderOptions,
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    return this.generatePDF(renderOptions, { 
      ...options, 
      format: 'arrayBuffer',
      quality: 'high'
    });
  }
  
  /**
   * Validate render options
   */
  private validateRenderOptions(options: TemplateRenderOptions): { 
    isValid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];
    
    // Check template ID
    if (!options.template_id) {
      errors.push('Template ID is required');
    } else if (!getTemplateById(options.template_id)) {
      errors.push(`Invalid template ID: ${options.template_id}`);
    }
    
    // Check data
    if (!options.data) {
      errors.push('Invoice data is required');
    } else {
      // Validate required data fields
      if (!options.data.business?.name) {
        errors.push('Business name is required');
      }
      if (!options.data.client?.name) {
        errors.push('Client name is required');
      }
      if (!options.data.invoice?.number) {
        errors.push('Invoice number is required');
      }
      if (!options.data.items || options.data.items.length === 0) {
        errors.push('At least one invoice item is required');
      }
      if (!options.data.totals?.total) {
        errors.push('Invoice total is required');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Create PDF metadata
   */
  private createMetadata(
    renderOptions: TemplateRenderOptions,
    customMetadata?: PDFGenerationOptions['metadata']
  ) {
    const { data } = renderOptions;
    
    return {
      title: customMetadata?.title || `Invoice ${data.invoice.number}`,
      author: customMetadata?.author || data.business.name,
      subject: customMetadata?.subject || `Invoice for ${data.client.name}`,
      keywords: customMetadata?.keywords || ['invoice', 'billing', data.business.name, data.client.name],
      creator: customMetadata?.creator || 'Invoice Generator',
      producer: customMetadata?.producer || 'React-PDF',
      creationDate: new Date(),
      modificationDate: new Date()
    };
  }
  
  /**
   * Convert PDF to different formats
   */
  private async convertToFormat(
    blob: Blob, 
    format: 'blob' | 'arrayBuffer' | 'base64'
  ): Promise<{
    blob?: Blob;
    arrayBuffer?: ArrayBuffer;
    base64?: string;
  }> {
    switch (format) {
      case 'blob':
        return { blob };
      
      case 'arrayBuffer':
        const arrayBuffer = await blob.arrayBuffer();
        return { arrayBuffer };
      
      case 'base64':
        const base64 = await this.blobToBase64(blob);
        return { base64 };
      
      default:
        return { blob };
    }
  }
  
  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]); // Remove data:application/pdf;base64, prefix
        } else {
          reject(new Error('Failed to convert to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  /**
   * Generate filename based on invoice data
   */
  private generateFilename(data: InvoiceTemplateData): string {
    const invoiceNumber = data.invoice.number.replace(/[^a-zA-Z0-9]/g, '-');
    const clientName = data.client.name.replace(/[^a-zA-Z0-9]/g, '-');
    const date = new Date().toISOString().split('T')[0];
    
    return `invoice-${invoiceNumber}-${clientName}-${date}.pdf`;
  }
  
  /**
   * Trigger browser download
   */
  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}

/**
 * Convenience functions for direct usage
 */
export const pdfGenerator = InvoicePDFGenerator.getInstance();

export async function generateInvoicePDF(
  renderOptions: TemplateRenderOptions,
  options?: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  return pdfGenerator.generatePDF(renderOptions, options);
}

export async function downloadInvoicePDF(
  renderOptions: TemplateRenderOptions,
  options?: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  return pdfGenerator.downloadPDF(renderOptions, options);
}

export async function generateInvoicePDFForEmail(
  renderOptions: TemplateRenderOptions,
  options?: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  return pdfGenerator.generateForEmail(renderOptions, options);
}

/**
 * Utility function to create render options from invoice data
 */
export function createRenderOptionsFromInvoiceData(
  templateId: string,
  invoiceData: any,
  userProfile: any,
  branding?: CompanyBranding
): TemplateRenderOptions {
  // This would use the branding utility to convert database data to template data
  // For now, we'll create a basic structure
  const templateData: InvoiceTemplateData = {
    business: {
      name: userProfile?.business_name || 'Your Business',
      email: userProfile?.business_email || '',
      phone: userProfile?.business_phone,
      address: userProfile?.business_address,
      logo_url: userProfile?.logo_url
    },
    client: {
      name: invoiceData.buyer_name,
      email: invoiceData.buyer_email,
      address: invoiceData.buyer_address
    },
    invoice: {
      id: invoiceData.id,
      number: invoiceData.service_name?.match(/Invoice #(INV-\d+-\d+)/)?.[1] || 'INV-0000',
      issued_date: new Date(invoiceData.issued_at || invoiceData.created_at).toLocaleDateString(),
      due_date: invoiceData.due_date ? new Date(invoiceData.due_date).toLocaleDateString() : undefined,
      currency: invoiceData.currency,
      status: invoiceData.status,
      account_no: invoiceData.account_no,
      payment_link: invoiceData.payment_link,
      notes: invoiceData.notes
    },
    items: [{
      description: invoiceData.service_name?.replace(/^Invoice #INV-\d+-\d+ - /, '') || 'Professional Services',
      quantity: invoiceData.qty || 1,
      unit_price: parseFloat(invoiceData.unit_net_price || '0'),
      total: parseFloat(invoiceData.unit_net_price || '0') * (invoiceData.qty || 1),
      vat_rate: parseFloat(invoiceData.vat_rate || '0')
    }],
    totals: {
      subtotal: parseFloat(invoiceData.unit_net_price || '0') * (invoiceData.qty || 1),
      vat_amount: parseFloat(invoiceData.vat_amount || '0'),
      vat_rate: parseFloat(invoiceData.vat_rate || '0'),
      total: parseFloat(invoiceData.total_gross_price || '0')
    },
    terms: 'Payment is due within 30 days of invoice date.',
    payment_instructions: invoiceData.payment_link ? 
      `Please use the following link to pay: ${invoiceData.payment_link}` : 
      'Please remit payment to the account specified above.'
  };
  
  return {
    template_id: templateId,
    data: templateData,
    branding,
    preview_mode: false,
    page_numbers: true,
    output_format: 'pdf',
    quality: 'standard'
  };
}