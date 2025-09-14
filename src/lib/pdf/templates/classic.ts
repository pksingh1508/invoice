import { InvoiceTemplateConfig, AvailableTemplate } from '@/types/templates';

// Classic Professional Template Configuration
export const classicTemplateConfig: InvoiceTemplateConfig = {
  id: 'classic-professional',
  name: 'Classic Professional',
  description: 'Traditional, clean layout perfect for established businesses',
  preview_image: '/images/templates/classic-preview.png',
  
  // Layout Configuration
  layout: {
    format: 'A4',
    orientation: 'portrait',
    margins: {
      top: 60,
      bottom: 60,
      left: 60,
      right: 60
    }
  },
  
  // Color Scheme - Professional Blue
  colors: {
    primary: '#2563EB',      // Professional Blue
    secondary: '#64748B',    // Slate Gray  
    accent: '#059669',       // Success Green
    text_primary: '#1E293B', // Dark Slate
    text_secondary: '#64748B', // Medium Slate
    background: '#FFFFFF',   // White
    border: '#E2E8F0'       // Light Gray Border
  },
  
  // Typography
  fonts: {
    primary: 'Helvetica',
    secondary: 'Helvetica-Bold',
    sizes: {
      title: 24,
      heading: 16,
      body: 10,
      small: 8
    }
  },
  
  // Component Styles
  styles: {
    header: {
      layout: 'split',
      logo_size: 'medium',
      show_business_info: true,
      show_invoice_details: true,
      background_color: undefined,
      border_bottom: true
    },
    
    footer: {
      show_terms: true,
      show_payment_instructions: true,
      show_notes: true,
      text_align: 'left',
      background_color: undefined,
      border_top: true
    },
    
    table: {
      header_background: '#2563EB',
      header_text_color: '#FFFFFF',
      row_alternate_background: '#F8FAFC',
      border_style: 'light',
      show_item_numbers: true
    },
    
    totals: {
      alignment: 'right',
      background_color: '#F1F5F9',
      highlight_total: true,
      show_subtotals: true
    }
  }
};

// Export as Available Template
export const classicTemplate: AvailableTemplate = {
  id: 'classic-professional',
  name: 'Classic Professional',
  description: 'Traditional, clean layout perfect for established businesses. Features a professional blue color scheme with clear typography and structured sections.',
  category: 'professional',
  preview_image: '/images/templates/classic-preview.png',
  config: classicTemplateConfig,
  is_premium: false,
  is_default: true
};