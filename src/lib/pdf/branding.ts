import { 
  CompanyBranding, 
  InvoiceTemplateConfig, 
  TemplateRenderOptions,
  InvoiceTemplateData 
} from '@/types/templates';
import { UserProfile } from '@/types/database';

/**
 * Apply company branding to a template configuration
 */
export function applyBrandingToTemplate(
  baseConfig: InvoiceTemplateConfig,
  branding: CompanyBranding
): InvoiceTemplateConfig {
  const brandedConfig: InvoiceTemplateConfig = {
    ...baseConfig,
    colors: {
      ...baseConfig.colors,
      // Override primary color with company brand color
      primary: branding.primary_color,
      // Use secondary color if provided
      ...(branding.secondary_color && { secondary: branding.secondary_color })
    },
    fonts: {
      ...baseConfig.fonts,
      // Override font family if specified
      ...(branding.font_family && {
        primary: branding.font_family,
        secondary: `${branding.font_family}-Bold`
      })
    }
  };

  // Apply custom template customizations if provided
  if (branding.template_customizations) {
    return deepMergeTemplateConfigs(brandedConfig, branding.template_customizations);
  }

  return brandedConfig;
}

/**
 * Generate company branding from user profile
 */
export function generateBrandingFromProfile(profile: UserProfile): CompanyBranding {
  return {
    logo_url: profile.logo_url,
    primary_color: '#2563EB', // Default blue, could be customizable in profile
    secondary_color: '#64748B',
    font_family: 'Helvetica',
    preferred_template_id: 'classic-professional'
  };
}

/**
 * Convert user profile and invoice data to template data
 */
export function createTemplateDataFromInvoice(
  invoiceData: any, // From database
  userProfile: UserProfile,
  clientData?: any
): InvoiceTemplateData {
  return {
    // Business information from user profile
    business: {
      name: userProfile.business_name || 'Your Business',
      email: userProfile.business_email || '',
      phone: userProfile.business_phone,
      address: userProfile.business_address,
      logo_url: userProfile.logo_url,
      website: '', // Could be added to profile later
      tax_number: '' // Could be added to profile later
    },
    
    // Client information
    client: {
      name: invoiceData.buyer_name,
      email: invoiceData.buyer_email,
      address: invoiceData.buyer_address,
      phone: '' // Could be extended from client data
    },
    
    // Invoice details
    invoice: {
      id: invoiceData.id,
      number: extractInvoiceNumber(invoiceData.service_name), // Extract from service_name
      issued_date: formatDate(invoiceData.issued_at || invoiceData.created_at),
      due_date: invoiceData.due_date ? formatDate(invoiceData.due_date) : undefined,
      currency: invoiceData.currency,
      status: invoiceData.status,
      account_no: invoiceData.account_no,
      payment_link: invoiceData.payment_link,
      notes: invoiceData.notes
    },
    
    // Items (currently single item, could be extended for multiple items)
    items: [{
      description: cleanServiceName(invoiceData.service_name),
      quantity: invoiceData.qty || 1,
      unit_price: parseFloat(invoiceData.unit_net_price || '0'),
      total: parseFloat(invoiceData.unit_net_price || '0') * (invoiceData.qty || 1),
      vat_rate: parseFloat(invoiceData.vat_rate || '0')
    }],
    
    // Totals
    totals: {
      subtotal: parseFloat(invoiceData.unit_net_price || '0') * (invoiceData.qty || 1),
      vat_amount: parseFloat(invoiceData.vat_amount || '0'),
      vat_rate: parseFloat(invoiceData.vat_rate || '0'),
      total: parseFloat(invoiceData.total_gross_price || '0'),
      discount_amount: 0, // Not implemented yet
      discount_rate: 0    // Not implemented yet
    },
    
    // Additional information
    terms: 'Payment is due within 30 days of invoice date.', // Default terms
    payment_instructions: invoiceData.payment_link ? 
      `Please use the following link to pay: ${invoiceData.payment_link}` : 
      'Please remit payment to the account specified above.'
  };
}

/**
 * Extract invoice number from service name (removes the "Invoice #INV-XXXX - " prefix)
 */
function extractInvoiceNumber(serviceName: string): string {
  const match = serviceName.match(/Invoice #(INV-\d+-\d+)/);
  return match ? match[1] : 'INV-0000';
}

/**
 * Clean service name by removing invoice number prefix
 */
function cleanServiceName(serviceName: string): string {
  const cleaned = serviceName.replace(/^Invoice #INV-\d+-\d+ - /, '');
  return cleaned || 'Professional Services';
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

/**
 * Deep merge template configurations
 */
function deepMergeTemplateConfigs(
  base: InvoiceTemplateConfig,
  override: Partial<InvoiceTemplateConfig>
): InvoiceTemplateConfig {
  const merged = { ...base };
  
  Object.keys(override).forEach(key => {
    const overrideValue = (override as any)[key];
    const baseValue = (base as any)[key];
    
    if (overrideValue && typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
      (merged as any)[key] = { ...baseValue, ...overrideValue };
    } else if (overrideValue !== undefined) {
      (merged as any)[key] = overrideValue;
    }
  });
  
  return merged;
}

/**
 * Validate branding configuration
 */
export function validateBranding(branding: CompanyBranding): { 
  isValid: boolean; 
  errors: string[]; 
} {
  const errors: string[] = [];
  
  // Validate primary color (hex color format)
  if (!branding.primary_color) {
    errors.push('Primary color is required');
  } else if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(branding.primary_color)) {
    errors.push('Primary color must be a valid hex color (e.g., #2563EB)');
  }
  
  // Validate secondary color if provided
  if (branding.secondary_color && 
      !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(branding.secondary_color)) {
    errors.push('Secondary color must be a valid hex color (e.g., #64748B)');
  }
  
  // Validate logo URL if provided
  if (branding.logo_url && !isValidUrl(branding.logo_url)) {
    errors.push('Logo URL must be a valid URL');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to validate URLs
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Generate CSS variables for template styling
 */
export function generateCSSVariables(branding: CompanyBranding): Record<string, string> {
  return {
    '--brand-primary': branding.primary_color,
    '--brand-secondary': branding.secondary_color || '#64748B',
    '--brand-font': branding.font_family || 'Helvetica'
  };
}

/**
 * Create render options with branding applied
 */
export function createRenderOptions(
  templateId: string,
  templateData: InvoiceTemplateData,
  branding?: CompanyBranding,
  options?: Partial<TemplateRenderOptions>
): TemplateRenderOptions {
  return {
    template_id: templateId,
    data: templateData,
    branding,
    preview_mode: false,
    watermark: options?.watermark,
    page_numbers: options?.page_numbers !== false, // Default to true
    output_format: options?.output_format || 'pdf',
    quality: options?.quality || 'standard',
    ...options
  };
}