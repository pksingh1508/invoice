import { AvailableTemplate, TemplateCategory } from '@/types/templates';
import { classicTemplate } from './classic';
import { modernTemplate } from './modern';
import { minimalTemplate } from './minimal';

// All available templates
export const AVAILABLE_TEMPLATES: AvailableTemplate[] = [
  classicTemplate,    // Default template
  modernTemplate,
  minimalTemplate
];

// Get template by ID
export function getTemplateById(id: string): AvailableTemplate | undefined {
  return AVAILABLE_TEMPLATES.find(template => template.id === id);
}

// Get templates by category
export function getTemplatesByCategory(category: TemplateCategory): AvailableTemplate[] {
  return AVAILABLE_TEMPLATES.filter(template => template.category === category);
}

// Get default template
export function getDefaultTemplate(): AvailableTemplate {
  const defaultTemplate = AVAILABLE_TEMPLATES.find(template => template.is_default);
  return defaultTemplate || AVAILABLE_TEMPLATES[0];
}

// Get premium templates
export function getPremiumTemplates(): AvailableTemplate[] {
  return AVAILABLE_TEMPLATES.filter(template => template.is_premium);
}

// Get free templates
export function getFreeTemplates(): AvailableTemplate[] {
  return AVAILABLE_TEMPLATES.filter(template => !template.is_premium);
}

// Template categories with counts
export function getTemplateCategories(): Array<{
  category: TemplateCategory;
  name: string;
  description: string;
  count: number;
  templates: AvailableTemplate[];
}> {
  const categories: TemplateCategory[] = ['professional', 'modern', 'minimal', 'creative', 'corporate'];
  
  return categories.map(category => {
    const templates = getTemplatesByCategory(category);
    
    const categoryInfo = {
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
    }[category];
    
    return {
      category,
      name: categoryInfo.name,
      description: categoryInfo.description,
      count: templates.length,
      templates
    };
  }).filter(cat => cat.count > 0); // Only return categories that have templates
}

// Validate template ID
export function isValidTemplateId(id: string): boolean {
  return AVAILABLE_TEMPLATES.some(template => template.id === id);
}

// Export individual templates for direct import
export { classicTemplate, modernTemplate, minimalTemplate };

// Export template configurations
export { classicTemplateConfig } from './classic';
export { modernTemplateConfig } from './modern';
export { minimalTemplateConfig } from './minimal';