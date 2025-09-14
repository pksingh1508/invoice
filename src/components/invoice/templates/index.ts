// Export all template components
export { default as InvoicePreview } from './InvoicePreview';
export { default as TemplateSelector, TemplateThumbnail } from './TemplateSelector';
export { default as LivePreview } from './LivePreview';
export { default as PrintPreview, SimplePrintPreview } from './PrintPreview';

// Re-export template utilities
export { 
  AVAILABLE_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  getDefaultTemplate,
  getFreeTemplates,
  getPremiumTemplates,
  getTemplateCategories,
  isValidTemplateId
} from '@/lib/pdf/templates';

// Re-export branding utilities
export {
  applyBrandingToTemplate,
  generateBrandingFromProfile,
  createTemplateDataFromInvoice,
  validateBranding,
  generateCSSVariables,
  createRenderOptions
} from '@/lib/pdf/branding';

// Re-export types
export type {
  InvoiceTemplateData,
  InvoiceTemplateConfig,
  AvailableTemplate,
  CompanyBranding,
  TemplateRenderOptions,
  TemplateCategory,
  InvoiceItem
} from '@/types/templates';