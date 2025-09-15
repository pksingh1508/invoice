import { InvoiceTemplateConfig, AvailableTemplate } from '@/types/templates';

// Business Template Configuration
export const businessTemplateConfig: InvoiceTemplateConfig = {
  id: 'business-professional',
  name: 'Business Professional',
  description: 'Professional business template with company branding and formal layout',
  preview_image: '/images/templates/business-preview.png',
  
  // Layout Configuration
  layout: {
    format: 'A4',
    orientation: 'portrait',
    margins: {
      top: 40,
      bottom: 40,
      left: 40,
      right: 40
    }
  },
  
  // Color Scheme - Business Blue
  colors: {
    primary: '#00BFFF',        // Sky Blue (like in the screenshot)
    secondary: '#0099CC',      // Darker Blue
    accent: '#FF6B35',         // Orange accent
    text_primary: '#2C3E50',   // Dark Blue-Gray
    text_secondary: '#7F8C8D', // Medium Gray
    background: '#FFFFFF',     // White
    border: '#BDC3C7'         // Light Gray Border
  },
  
  // Typography
  fonts: {
    primary: 'Helvetica',
    secondary: 'Helvetica-Bold',
    sizes: {
      title: 32,        // Large company name
      heading: 18,      // Section headings
      body: 10,         // Regular text
      small: 9          // Small details
    }
  },
  
  // Component Styles
  styles: {
    header: {
      layout: 'split',           // Company info and logo split
      logo_size: 'large',        // Large logo
      show_business_info: true,
      show_invoice_details: false, // Details shown separately
      background_color: undefined,
      border_bottom: true
    },
    
    footer: {
      show_terms: false,
      show_payment_instructions: false,
      show_notes: false,
      text_align: 'center',
      background_color: undefined,
      border_top: false
    },
    
    table: {
      header_background: '#E8F4FD', // Light blue header
      header_text_color: '#2C3E50',
      row_alternate_background: '#F8FBFF',
      border_style: 'heavy',       // Heavy borders for business style
      show_item_numbers: true
    },
    
    totals: {
      alignment: 'right',
      background_color: '#00BFFF',  // Blue background for total
      highlight_total: true,
      show_subtotals: true
    }
  }
};

// Export as Available Template
export const businessTemplate: AvailableTemplate = {
  id: 'business-professional',
  name: 'Business Professional',
  description: 'Professional business template with company branding, formal layout, and signature section. Perfect for established businesses and corporate invoicing.',
  category: 'professional',
  preview_image: '/images/templates/business-preview.png',
  config: businessTemplateConfig,
  is_premium: false,
  is_default: false
};