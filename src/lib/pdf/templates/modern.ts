import { InvoiceTemplateConfig, AvailableTemplate } from '@/types/templates';

// Modern Template Configuration
export const modernTemplateConfig: InvoiceTemplateConfig = {
  id: 'modern-bold',
  name: 'Modern Bold',
  description: 'Contemporary design with bold typography and vibrant colors',
  preview_image: '/images/templates/modern-preview.png',
  
  // Layout Configuration
  layout: {
    format: 'A4',
    orientation: 'portrait',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    }
  },
  
  // Color Scheme - Modern Violet & Pink
  colors: {
    primary: '#7C3AED',      // Vibrant Violet
    secondary: '#6366F1',    // Indigo
    accent: '#EC4899',       // Hot Pink
    text_primary: '#111827', // Almost Black
    text_secondary: '#6B7280', // Cool Gray
    background: '#FFFFFF',   // Pure White
    border: '#D1D5DB'       // Light Border
  },
  
  // Typography - More modern fonts
  fonts: {
    primary: 'Helvetica',
    secondary: 'Helvetica-Bold',
    sizes: {
      title: 28,        // Larger title
      heading: 18,      // Bigger headings
      body: 11,         // Slightly larger body
      small: 9
    }
  },
  
  // Component Styles
  styles: {
    header: {
      layout: 'left',          // Left-aligned for modern look
      logo_size: 'large',      // Bigger logo
      show_business_info: true,
      show_invoice_details: true,
      background_color: '#7C3AED', // Primary color background
      border_bottom: false     // No border for cleaner look
    },
    
    footer: {
      show_terms: true,
      show_payment_instructions: true,
      show_notes: true,
      text_align: 'center',    // Centered footer
      background_color: '#F9FAFB',
      border_top: false
    },
    
    table: {
      header_background: '#6366F1', // Indigo header
      header_text_color: '#FFFFFF',
      row_alternate_background: '#F8FAFC',
      border_style: 'none',    // Clean, borderless table
      show_item_numbers: false // More minimal
    },
    
    totals: {
      alignment: 'right',
      background_color: '#EC4899', // Accent color
      highlight_total: true,
      show_subtotals: true
    }
  }
};

// Export as Available Template
export const modernTemplate: AvailableTemplate = {
  id: 'modern-bold',
  name: 'Modern Bold',
  description: 'Contemporary design with bold typography and vibrant colors. Perfect for creative agencies, startups, and modern businesses.',
  category: 'modern',
  preview_image: '/images/templates/modern-preview.png',
  config: modernTemplateConfig,
  is_premium: false,
  is_default: false
};