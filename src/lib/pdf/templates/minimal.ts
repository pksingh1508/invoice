import { InvoiceTemplateConfig, AvailableTemplate } from '@/types/templates';

// Minimal Template Configuration
export const minimalTemplateConfig: InvoiceTemplateConfig = {
  id: 'minimal-clean',
  name: 'Minimal Clean',
  description: 'Ultra-clean design focusing on content clarity and simplicity',
  preview_image: '/images/templates/minimal-preview.png',
  
  // Layout Configuration
  layout: {
    format: 'A4',
    orientation: 'portrait',
    margins: {
      top: 80,          // More generous margins
      bottom: 80,
      left: 80,
      right: 80
    }
  },
  
  // Color Scheme - Minimal Grayscale with Accent
  colors: {
    primary: '#374151',      // Dark Gray
    secondary: '#9CA3AF',    // Medium Gray
    accent: '#F59E0B',       // Amber accent
    text_primary: '#111827', // Almost Black
    text_secondary: '#6B7280', // Subtle Gray
    background: '#FFFFFF',   // Pure White
    border: '#E5E7EB'       // Very Light Gray
  },
  
  // Typography - Clean and readable
  fonts: {
    primary: 'Helvetica',
    secondary: 'Helvetica-Bold',
    sizes: {
      title: 20,        // Modest title size
      heading: 14,      // Subtle headings
      body: 10,         // Standard body
      small: 8
    }
  },
  
  // Component Styles
  styles: {
    header: {
      layout: 'center',        // Centered for balance
      logo_size: 'small',      // Subtle logo
      show_business_info: true,
      show_invoice_details: true,
      background_color: undefined, // No background
      border_bottom: false     // Clean, no borders
    },
    
    footer: {
      show_terms: true,
      show_payment_instructions: false, // Minimal info
      show_notes: true,
      text_align: 'center',
      background_color: undefined,
      border_top: false        // No borders
    },
    
    table: {
      header_background: '#F9FAFB', // Very subtle background
      header_text_color: '#374151', // Dark text, not white
      row_alternate_background: undefined, // No alternating colors
      border_style: 'light',   // Minimal borders
      show_item_numbers: false // No line numbers for cleaner look
    },
    
    totals: {
      alignment: 'right',
      background_color: undefined, // No background
      highlight_total: false,   // Subtle total highlight
      show_subtotals: false     // Minimal breakdown
    }
  }
};

// Export as Available Template
export const minimalTemplate: AvailableTemplate = {
  id: 'minimal-clean',
  name: 'Minimal Clean',
  description: 'Ultra-clean design focusing on content clarity and simplicity. Perfect for consultants, freelancers, and businesses that prefer understated elegance.',
  category: 'minimal',
  preview_image: '/images/templates/minimal-preview.png',
  config: minimalTemplateConfig,
  is_premium: false,
  is_default: false
};