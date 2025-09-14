'use client';

import React, { useState } from 'react';
import { AvailableTemplate, TemplateCategory, CompanyBranding, InvoiceTemplateData } from '@/types/templates';
import { AVAILABLE_TEMPLATES, getTemplateCategories, getDefaultTemplate } from '@/lib/pdf/templates';
import InvoicePreview from './InvoicePreview';

interface TemplateSelectorProps {
  selectedTemplateId?: string;
  onTemplateSelect: (template: AvailableTemplate) => void;
  branding?: CompanyBranding;
  previewData?: InvoiceTemplateData;
  className?: string;
}

export default function TemplateSelector({
  selectedTemplateId,
  onTemplateSelect,
  branding,
  previewData,
  className = ''
}: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('professional');
  const [previewTemplate, setPreviewTemplate] = useState<AvailableTemplate | null>(null);
  
  const categories = getTemplateCategories();
  const selectedTemplate = AVAILABLE_TEMPLATES.find(t => t.id === selectedTemplateId) || getDefaultTemplate();
  
  // Sample preview data if none provided
  const sampleData: InvoiceTemplateData = previewData || {
    business: {
      name: 'Your Business Name',
      email: 'contact@yourbusiness.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business Street\\nCity, State 12345',
      logo_url: undefined
    },
    client: {
      name: 'Client Company',
      email: 'client@company.com',
      address: '456 Client Avenue\\nClient City, State 67890'
    },
    invoice: {
      id: 'sample-id',
      number: 'INV-2024-0001',
      issued_date: 'January 15, 2024',
      due_date: 'February 15, 2024',
      currency: 'USD',
      status: 'sent',
      account_no: 'ACC-12345',
      payment_link: 'https://pay.yourbusiness.com/invoice-001',
      notes: 'Thank you for your business!'
    },
    items: [{
      description: 'Professional Services',
      quantity: 1,
      unit_price: 1500.00,
      total: 1500.00,
      vat_rate: 10
    }],
    totals: {
      subtotal: 1500.00,
      vat_amount: 150.00,
      vat_rate: 10,
      total: 1650.00
    },
    terms: 'Payment is due within 30 days of invoice date.',
    payment_instructions: 'Please remit payment to the account specified above.'
  };
  
  return (
    <div className={`template-selector ${className}`}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Template Selection */}
        <div className="lg:w-1/3">
          <h3 className="text-lg font-semibold mb-4">Choose Template</h3>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <button
                key={category.category}
                onClick={() => setActiveCategory(category.category)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeCategory === category.category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
          
          {/* Template Grid */}
          <div className="space-y-3">
            {categories
              .find(c => c.category === activeCategory)
              ?.templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={template.id === selectedTemplateId}
                onSelect={() => onTemplateSelect(template)}
                onPreview={() => setPreviewTemplate(template)}
              />
            ))}
          </div>
          
          {/* Current Selection */}
          {selectedTemplate && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900">Selected Template</h4>
              <p className="text-sm text-blue-700">{selectedTemplate.name}</p>
              <p className="text-xs text-blue-600">{selectedTemplate.description}</p>
            </div>
          )}
        </div>
        
        {/* Template Preview */}
        <div className="lg:w-2/3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Preview: {previewTemplate?.name || selectedTemplate.name}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Show Selected
              </button>
              {previewTemplate && previewTemplate.id !== selectedTemplateId && (
                <button
                  onClick={() => onTemplateSelect(previewTemplate)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Select This Template
                </button>
              )}
            </div>
          </div>
          
          {/* Preview Container */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-2 text-center text-sm text-gray-600">
              Template Preview (60% scale)
            </div>
            <div className="bg-white p-4 overflow-auto" style={{ maxHeight: '80vh' }}>
              <InvoicePreview
                data={sampleData}
                config={(previewTemplate || selectedTemplate).config}
                branding={branding}
                scale={0.6}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Template Card Component
interface TemplateCardProps {
  template: AvailableTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

function TemplateCard({ template, isSelected, onSelect, onPreview }: TemplateCardProps) {
  return (
    <div
      className={`template-card border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1" onClick={onSelect}>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">{template.name}</h4>
            {template.is_default && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Default
              </span>
            )}
            {template.is_premium && (
              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                Premium
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
          
          {/* Color Preview */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Colors:</span>
            <div className="flex gap-1">
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: template.config.colors.primary }}
                title="Primary"
              />
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: template.config.colors.secondary }}
                title="Secondary"
              />
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: template.config.colors.accent }}
                title="Accent"
              />
            </div>
          </div>
          
          {/* Template Features */}
          <div className="text-xs text-gray-500">
            <div>Layout: {template.config.styles.header.layout}</div>
            <div>Font: {template.config.fonts.primary}</div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Preview
          </button>
          {isSelected ? (
            <div className="px-3 py-1 text-xs bg-blue-600 text-white rounded text-center">
              Selected
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Select
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Template Thumbnail Component (for future use)
export function TemplateThumbnail({ 
  template, 
  size = 'small' 
}: { 
  template: AvailableTemplate; 
  size?: 'small' | 'medium' | 'large';
}) {
  const dimensions = {
    small: { width: '60px', height: '80px' },
    medium: { width: '120px', height: '160px' },
    large: { width: '180px', height: '240px' }
  }[size];
  
  return (
    <div
      className="template-thumbnail border border-gray-300 rounded overflow-hidden bg-white shadow-sm"
      style={dimensions}
    >
      {template.preview_image ? (
        <img 
          src={template.preview_image} 
          alt={`${template.name} preview`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center text-xs text-gray-500"
          style={{ backgroundColor: template.config.colors.background }}
        >
          <div className="text-center p-2">
            <div 
              className="w-4 h-1 mb-1 mx-auto"
              style={{ backgroundColor: template.config.colors.primary }}
            />
            <div 
              className="w-3 h-0.5 mb-0.5 mx-auto"
              style={{ backgroundColor: template.config.colors.secondary }}
            />
            <div 
              className="w-3 h-0.5 mx-auto"
              style={{ backgroundColor: template.config.colors.secondary }}
            />
          </div>
        </div>
      )}
    </div>
  );
}