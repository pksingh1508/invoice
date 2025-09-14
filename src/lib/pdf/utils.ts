import { InvoiceTemplateData, TemplateValidationResult } from '@/types/templates';
import { PDFGenerationResult, PDFGenerationOptions } from './generator';

/**
 * PDF Quality Settings
 */
export const PDF_QUALITY_SETTINGS = {
  draft: {
    compressionLevel: 6,
    imageQuality: 0.6,
    optimizeFonts: false,
    description: 'Fast generation, lower quality'
  },
  standard: {
    compressionLevel: 3,
    imageQuality: 0.8,
    optimizeFonts: true,
    description: 'Balanced quality and speed'
  },
  high: {
    compressionLevel: 1,
    imageQuality: 1.0,
    optimizeFonts: true,
    description: 'Best quality, slower generation'
  }
} as const;

/**
 * PDF Size Limits (in bytes)
 */
export const PDF_SIZE_LIMITS = {
  email: 25 * 1024 * 1024,      // 25MB for email attachments
  download: 100 * 1024 * 1024,  // 100MB for direct downloads
  preview: 10 * 1024 * 1024     // 10MB for preview generation
} as const;

/**
 * Supported File Formats
 */
export const SUPPORTED_FORMATS = ['pdf', 'png', 'jpeg'] as const;
export type SupportedFormat = typeof SUPPORTED_FORMATS[number];

/**
 * Validate invoice data for PDF generation
 */
export function validateInvoiceData(data: InvoiceTemplateData): TemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Business validation
  if (!data.business.name?.trim()) {
    errors.push('Business name is required');
  }
  if (!data.business.email?.trim()) {
    warnings.push('Business email is recommended for professional invoices');
  }
  if (data.business.logo_url && !isValidImageUrl(data.business.logo_url)) {
    warnings.push('Business logo URL may not be accessible');
  }
  
  // Client validation
  if (!data.client.name?.trim()) {
    errors.push('Client name is required');
  }
  if (!data.client.email?.trim() && !data.client.address?.trim()) {
    warnings.push('Client email or address is recommended');
  }
  
  // Invoice validation
  if (!data.invoice.number?.trim()) {
    errors.push('Invoice number is required');
  }
  if (!data.invoice.issued_date?.trim()) {
    errors.push('Invoice issue date is required');
  }
  if (!data.invoice.currency?.trim()) {
    errors.push('Currency is required');
  }
  
  // Items validation
  if (!data.items || data.items.length === 0) {
    errors.push('At least one invoice item is required');
  } else {
    data.items.forEach((item, index) => {
      if (!item.description?.trim()) {
        errors.push(`Item ${index + 1}: Description is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (!item.unit_price || item.unit_price < 0) {
        errors.push(`Item ${index + 1}: Unit price must be 0 or greater`);
      }
      if (item.total !== item.quantity * item.unit_price) {
        warnings.push(`Item ${index + 1}: Total may not match quantity × unit price`);
      }
    });
  }
  
  // Totals validation
  if (!data.totals) {
    errors.push('Invoice totals are required');
  } else {
    if (data.totals.total <= 0) {
      warnings.push('Invoice total is zero or negative');
    }
    if (data.totals.vat_rate && (data.totals.vat_rate < 0 || data.totals.vat_rate > 100)) {
      errors.push('VAT rate must be between 0% and 100%');
    }
  }
  
  return {
    is_valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Optimize PDF generation options based on use case
 */
export function optimizePDFOptions(
  purpose: 'email' | 'download' | 'preview',
  options: PDFGenerationOptions = {}
): PDFGenerationOptions {
  const baseOptions: PDFGenerationOptions = { ...options };
  
  switch (purpose) {
    case 'email':
      return {
        ...baseOptions,
        format: 'arrayBuffer',
        quality: 'high',
        metadata: {
          ...baseOptions.metadata,
          creator: 'Invoice Generator',
          producer: 'React-PDF'
        }
      };
      
    case 'download':
      return {
        ...baseOptions,
        format: 'blob',
        quality: options.quality || 'standard',
        metadata: {
          ...baseOptions.metadata,
          creator: 'Invoice Generator'
        }
      };
      
    case 'preview':
      return {
        ...baseOptions,
        format: 'blob',
        quality: 'draft',
        metadata: {
          ...baseOptions.metadata,
          title: 'Invoice Preview'
        }
      };
      
    default:
      return baseOptions;
  }
}

/**
 * Validate PDF size for different purposes
 */
export function validatePDFSize(
  size: number,
  purpose: 'email' | 'download' | 'preview'
): { isValid: boolean; message?: string } {
  const limit = PDF_SIZE_LIMITS[purpose];
  
  if (size > limit) {
    return {
      isValid: false,
      message: `PDF size (${formatBytes(size)}) exceeds ${purpose} limit (${formatBytes(limit)})`
    };
  }
  
  return { isValid: true };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generate secure filename for PDF
 */
export function generateSecureFilename(
  invoiceNumber: string,
  clientName: string,
  extension: string = 'pdf'
): string {
  // Sanitize inputs
  const cleanInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '-');
  const cleanClientName = clientName.replace(/[^a-zA-Z0-9-_]/g, '-');
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Generate filename
  const filename = `invoice-${cleanInvoiceNumber}-${cleanClientName}-${timestamp}.${extension}`;
  
  // Ensure filename isn't too long
  const maxLength = 100;
  if (filename.length > maxLength) {
    const truncatedClient = cleanClientName.substring(0, 20);
    return `invoice-${cleanInvoiceNumber}-${truncatedClient}-${timestamp}.${extension}`;
  }
  
  return filename;
}

/**
 * Validate image URL accessibility
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/') === true;
  } catch {
    return false;
  }
}

/**
 * Basic image URL validation (synchronous)
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:', 'data:'].includes(parsedUrl.protocol) &&
           /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(parsedUrl.pathname);
  } catch {
    return false;
  }
}

/**
 * Error handling utilities
 */
export class PDFGenerationError extends Error {
  public code: string;
  public details?: any;
  
  constructor(message: string, code: string = 'PDF_GENERATION_ERROR', details?: any) {
    super(message);
    this.name = 'PDFGenerationError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Common error codes and messages
 */
export const PDF_ERROR_CODES = {
  INVALID_TEMPLATE: {
    code: 'INVALID_TEMPLATE',
    message: 'Invalid or unsupported template'
  },
  INVALID_DATA: {
    code: 'INVALID_DATA',
    message: 'Invalid invoice data provided'
  },
  GENERATION_FAILED: {
    code: 'GENERATION_FAILED',
    message: 'PDF generation failed'
  },
  SIZE_LIMIT_EXCEEDED: {
    code: 'SIZE_LIMIT_EXCEEDED',
    message: 'Generated PDF exceeds size limit'
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network error during PDF generation'
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Unauthorized access to invoice'
  }
} as const;

/**
 * Handle PDF generation errors with user-friendly messages
 */
export function handlePDFError(error: any): { 
  userMessage: string; 
  technicalMessage: string; 
  code: string 
} {
  if (error instanceof PDFGenerationError) {
    return {
      userMessage: error.message,
      technicalMessage: error.message,
      code: error.code
    };
  }
  
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return {
      userMessage: 'Network connection error. Please check your internet connection and try again.',
      technicalMessage: error.message,
      code: PDF_ERROR_CODES.NETWORK_ERROR.code
    };
  }
  
  if (error.message.includes('size') || error.message.includes('limit')) {
    return {
      userMessage: 'The generated PDF is too large. Please try a different template or contact support.',
      technicalMessage: error.message,
      code: PDF_ERROR_CODES.SIZE_LIMIT_EXCEEDED.code
    };
  }
  
  // Generic error
  return {
    userMessage: 'An error occurred while generating the PDF. Please try again or contact support.',
    technicalMessage: error.message || 'Unknown error',
    code: PDF_ERROR_CODES.GENERATION_FAILED.code
  };
}

/**
 * Performance monitoring utilities
 */
export class PDFPerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  
  start(): void {
    this.startTime = performance.now();
  }
  
  end(): number {
    this.endTime = performance.now();
    return this.getDuration();
  }
  
  getDuration(): number {
    return this.endTime - this.startTime;
  }
  
  getFormattedDuration(): string {
    const duration = this.getDuration();
    if (duration < 1000) {
      return `${Math.round(duration)}ms`;
    }
    return `${(duration / 1000).toFixed(2)}s`;
  }
}

/**
 * Create performance monitor for PDF operations
 */
export function createPDFPerformanceMonitor(): PDFPerformanceMonitor {
  return new PDFPerformanceMonitor();
}

/**
 * Batch PDF generation utilities
 */
export interface BatchPDFRequest {
  invoiceId: string;
  templateId?: string;
  options?: PDFGenerationOptions;
}

export interface BatchPDFResult {
  invoiceId: string;
  success: boolean;
  result?: PDFGenerationResult;
  error?: string;
}

/**
 * Process multiple PDF generation requests
 */
export async function processBatchPDFGeneration(
  requests: BatchPDFRequest[],
  concurrency: number = 3
): Promise<BatchPDFResult[]> {
  const results: BatchPDFResult[] = [];
  
  // Process in chunks to limit concurrency
  for (let i = 0; i < requests.length; i += concurrency) {
    const chunk = requests.slice(i, i + concurrency);
    const chunkPromises = chunk.map(async (request) => {
      try {
        // This would need to be implemented based on your specific API
        const response = await fetch('/api/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoice_id: request.invoiceId,
            template_id: request.templateId,
            ...request.options
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.blob();
        return {
          invoiceId: request.invoiceId,
          success: true,
          result: {
            success: true,
            blob: result,
            filename: `invoice-${request.invoiceId}.pdf`,
            size: result.size
          }
        } as BatchPDFResult;
        
      } catch (error) {
        return {
          invoiceId: request.invoiceId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        } as BatchPDFResult;
      }
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  
  return results;
}