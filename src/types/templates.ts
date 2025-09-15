// Invoice Template Types and Interfaces

export interface InvoiceTemplateData {
  // Business/Seller Information
  business: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    logo_url?: string;
    website?: string;
    tax_number?: string;
    signature_url?: string;
  };
  
  // Client/Buyer Information
  client: {
    name: string;
    email?: string;
    address?: string;
    phone?: string;
  };
  
  // Invoice Details
  invoice: {
    id: string;
    number: string;
    issued_date: string;
    due_date?: string;
    currency: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    account_no?: string;
    payment_link?: string;
    notes?: string;
  };
  
  // Service/Items Information
  items: InvoiceItem[];
  
  // Totals
  totals: {
    subtotal: number;
    vat_amount: number;
    vat_rate: number;
    total: number;
    discount_amount?: number;
    discount_rate?: number;
  };
  
  // Additional Information
  terms?: string;
  payment_instructions?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  vat_rate?: number;
}

// Template Configuration
export interface InvoiceTemplateConfig {
  id: string;
  name: string;
  description: string;
  preview_image?: string;
  
  // Layout Configuration
  layout: {
    format: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
  
  // Color Scheme
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text_primary: string;
    text_secondary: string;
    background: string;
    border: string;
  };
  
  // Typography
  fonts: {
    primary: string;
    secondary: string;
    sizes: {
      title: number;
      heading: number;
      body: number;
      small: number;
    };
  };
  
  // Component Styles
  styles: {
    header: TemplateHeaderStyle;
    footer: TemplateFooterStyle;
    table: TemplateTableStyle;
    totals: TemplateTotalsStyle;
  };
}

export interface TemplateHeaderStyle {
  layout: 'left' | 'right' | 'center' | 'split';
  logo_size: 'small' | 'medium' | 'large';
  show_business_info: boolean;
  show_invoice_details: boolean;
  background_color?: string;
  border_bottom?: boolean;
}

export interface TemplateFooterStyle {
  show_terms: boolean;
  show_payment_instructions: boolean;
  show_notes: boolean;
  text_align: 'left' | 'center' | 'right';
  background_color?: string;
  border_top?: boolean;
}

export interface TemplateTableStyle {
  header_background: string;
  header_text_color: string;
  row_alternate_background?: string;
  border_style: 'none' | 'light' | 'medium' | 'heavy';
  show_item_numbers: boolean;
}

export interface TemplateTotalsStyle {
  alignment: 'left' | 'right';
  background_color?: string;
  highlight_total: boolean;
  show_subtotals: boolean;
}

// Template Categories
export type TemplateCategory = 'professional' | 'modern' | 'minimal' | 'creative' | 'corporate';

// Available Templates
export interface AvailableTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  preview_image: string;
  config: InvoiceTemplateConfig;
  is_premium?: boolean;
  is_default?: boolean;
}

// Company Branding Configuration
export interface CompanyBranding {
  logo_url?: string;
  primary_color: string;
  secondary_color?: string;
  font_family?: string;
  letterhead_image?: string;
  
  // Custom styling overrides
  custom_css?: string;
  
  // Template preferences
  preferred_template_id?: string;
  template_customizations?: Partial<InvoiceTemplateConfig>;
}

// Template Rendering Options
export interface TemplateRenderOptions {
  template_id: string;
  data: InvoiceTemplateData;
  branding?: CompanyBranding;
  preview_mode?: boolean;
  watermark?: string;
  page_numbers?: boolean;
  
  // Output options
  output_format?: 'pdf' | 'html' | 'png';
  quality?: 'draft' | 'standard' | 'high';
};

// Invoice Form Data for creating/editing invoices (matching database schema)
export interface InvoiceFormData {
  // Client/Buyer Information
  buyer_name: string;
  buyer_email?: string;
  buyer_address?: string;
  
  // Service/Item Information
  service_name: string;
  unit_net_price: number;
  qty: number;
  vat_rate: number;
  
  // Invoice Details
  currency: string;
  account_no?: string;
  payment_link?: string;
  due_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  
  // Additional Information
  notes?: string;
}

// Template Validation
export interface TemplateValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

// Export default template categories and their descriptions
export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { name: string; description: string }> = {
  professional: {
    name: 'Professional',
    description: 'Clean, traditional layouts perfect for established businesses'
  },
  modern: {
    name: 'Modern',
    description: 'Contemporary designs with bold typography and clean lines'
  },
  minimal: {
    name: 'Minimal',
    description: 'Simple, elegant templates that focus on content clarity'
  },
  creative: {
    name: 'Creative',
    description: 'Unique designs with artistic elements for creative industries'
  },
  corporate: {
    name: 'Corporate',
    description: 'Formal templates suitable for large organizations and enterprises'
  }
};

// Default color palettes for different template types
export const DEFAULT_COLOR_PALETTES = {
  professional: {
    primary: '#2563EB',    // Blue
    secondary: '#64748B',  // Slate
    accent: '#059669',     // Emerald
    text_primary: '#1E293B',
    text_secondary: '#64748B',
    background: '#FFFFFF',
    border: '#E2E8F0'
  },
  modern: {
    primary: '#7C3AED',    // Violet
    secondary: '#6366F1',  // Indigo
    accent: '#EC4899',     // Pink
    text_primary: '#111827',
    text_secondary: '#6B7280',
    background: '#FFFFFF',
    border: '#D1D5DB'
  },
  minimal: {
    primary: '#374151',    // Gray
    secondary: '#9CA3AF',  // Gray
    accent: '#F59E0B',     // Amber
    text_primary: '#111827',
    text_secondary: '#6B7280',
    background: '#FFFFFF',
    border: '#E5E7EB'
  },
  creative: {
    primary: '#DC2626',    // Red
    secondary: '#EA580C',  // Orange
    accent: '#16A34A',     // Green
    text_primary: '#1F2937',
    text_secondary: '#4B5563',
    background: '#FEFEFE',
    border: '#F3F4F6'
  },
  corporate: {
    primary: '#1E40AF',    // Blue
    secondary: '#1F2937',  // Gray
    accent: '#059669',     // Emerald
    text_primary: '#111827',
    text_secondary: '#374151',
    background: '#FFFFFF',
    border: '#D1D5DB'
  }
};