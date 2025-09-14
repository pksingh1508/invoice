'use client';

import React from 'react';
import { InvoiceTemplateData, InvoiceTemplateConfig, CompanyBranding } from '@/types/templates';
import { formatCurrency } from '@/lib/utils/calculations';
import { applyBrandingToTemplate } from '@/lib/pdf/branding';

interface InvoicePreviewProps {
  data: InvoiceTemplateData;
  config: InvoiceTemplateConfig;
  branding?: CompanyBranding;
  className?: string;
  scale?: number; // Scale factor for preview (0.5 = 50% size)
}

export default function InvoicePreview({ 
  data, 
  config: baseConfig, 
  branding, 
  className = '',
  scale = 0.6 
}: InvoicePreviewProps) {
  // Apply branding to config if provided
  const config = branding ? applyBrandingToTemplate(baseConfig, branding) : baseConfig;
  
  // Convert scale to CSS transform
  const scaleStyle = {
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    width: `${100 / scale}%`
  };
  
  return (
    <div className={`invoice-preview ${className}`} style={scaleStyle}>
      <div 
        className="invoice-template bg-white shadow-lg"
        style={{
          width: '210mm',  // A4 width
          minHeight: '297mm', // A4 height
          fontFamily: config.fonts.primary,
          fontSize: `${config.fonts.sizes.body}px`,
          color: config.colors.text_primary,
          padding: `${config.layout.margins.top}px ${config.layout.margins.right}px ${config.layout.margins.bottom}px ${config.layout.margins.left}px`
        }}
      >
        {/* Header */}
        <InvoiceHeader data={data} config={config} />
        
        {/* Invoice Details */}
        <InvoiceDetails data={data} config={config} />
        
        {/* Items Table */}
        <ItemsTable data={data} config={config} />
        
        {/* Totals */}
        <InvoiceTotals data={data} config={config} />
        
        {/* Footer */}
        <InvoiceFooter data={data} config={config} />
      </div>
    </div>
  );
}

// Header Component
function InvoiceHeader({ data, config }: { data: InvoiceTemplateData; config: InvoiceTemplateConfig }) {
  const { header } = config.styles;
  
  const headerStyle = {
    backgroundColor: header.background_color || 'transparent',
    borderBottom: header.border_bottom ? `1px solid ${config.colors.border}` : 'none',
    paddingBottom: '20px',
    marginBottom: '30px'
  };
  
  if (header.layout === 'split') {
    return (
      <div style={headerStyle} className="flex justify-between items-start">
        <BusinessInfo data={data} config={config} />
        <InvoiceInfo data={data} config={config} />
      </div>
    );
  }
  
  if (header.layout === 'left') {
    return (
      <div style={{...headerStyle, backgroundColor: config.colors.primary, color: 'white', padding: '20px', margin: '-20px -20px 30px -20px'}}>
        <BusinessInfo data={data} config={config} inverse />
        <div style={{ marginTop: '20px' }}>
          <InvoiceInfo data={data} config={config} inverse />
        </div>
      </div>
    );
  }
  
  if (header.layout === 'center') {
    return (
      <div style={headerStyle} className="text-center">
        <BusinessInfo data={data} config={config} />
        <div style={{ marginTop: '20px' }}>
          <InvoiceInfo data={data} config={config} />
        </div>
      </div>
    );
  }
  
  return (
    <div style={headerStyle}>
      <BusinessInfo data={data} config={config} />
      <InvoiceInfo data={data} config={config} />
    </div>
  );
}

// Business Info Component
function BusinessInfo({ data, config, inverse = false }: { 
  data: InvoiceTemplateData; 
  config: InvoiceTemplateConfig;
  inverse?: boolean;
}) {
  const textColor = inverse ? 'white' : config.colors.text_primary;
  const secondaryColor = inverse ? 'rgba(255,255,255,0.8)' : config.colors.text_secondary;
  
  return (
    <div>
      {data.business.logo_url && (
        <img 
          src={data.business.logo_url} 
          alt="Company Logo"
          style={{
            height: config.styles.header.logo_size === 'large' ? '60px' : 
                   config.styles.header.logo_size === 'medium' ? '40px' : '30px',
            marginBottom: '10px'
          }}
        />
      )}
      <h1 style={{ 
        fontSize: `${config.fonts.sizes.title}px`,
        fontWeight: 'bold',
        margin: '0 0 10px 0',
        color: textColor
      }}>
        {data.business.name}
      </h1>
      {config.styles.header.show_business_info && (
        <div style={{ fontSize: `${config.fonts.sizes.small}px`, color: secondaryColor }}>
          <div>{data.business.email}</div>
          {data.business.phone && <div>{data.business.phone}</div>}
          {data.business.address && <div style={{ whiteSpace: 'pre-line' }}>{data.business.address}</div>}
        </div>
      )}
    </div>
  );
}

// Invoice Info Component
function InvoiceInfo({ data, config, inverse = false }: { 
  data: InvoiceTemplateData; 
  config: InvoiceTemplateConfig;
  inverse?: boolean;
}) {
  if (!config.styles.header.show_invoice_details) return null;
  
  const textColor = inverse ? 'white' : config.colors.text_primary;
  const secondaryColor = inverse ? 'rgba(255,255,255,0.8)' : config.colors.text_secondary;
  
  return (
    <div>
      <h2 style={{ 
        fontSize: `${config.fonts.sizes.heading}px`,
        fontWeight: 'bold',
        margin: '0 0 10px 0',
        color: config.colors.primary
      }}>
        INVOICE
      </h2>
      <div style={{ fontSize: `${config.fonts.sizes.body}px` }}>
        <div style={{ color: textColor }}>
          <strong>Invoice #:</strong> {data.invoice.number}
        </div>
        <div style={{ color: secondaryColor, marginTop: '5px' }}>
          <strong>Date:</strong> {data.invoice.issued_date}
        </div>
        {data.invoice.due_date && (
          <div style={{ color: secondaryColor, marginTop: '5px' }}>
            <strong>Due Date:</strong> {data.invoice.due_date}
          </div>
        )}
        <div style={{ 
          color: getStatusColor(data.invoice.status, config.colors),
          marginTop: '5px',
          textTransform: 'uppercase',
          fontSize: `${config.fonts.sizes.small}px`,
          fontWeight: 'bold'
        }}>
          {data.invoice.status}
        </div>
      </div>
    </div>
  );
}

// Invoice Details (Bill To)
function InvoiceDetails({ data, config }: { data: InvoiceTemplateData; config: InvoiceTemplateConfig }) {
  return (
    <div style={{ marginBottom: '30px' }}>
      <h3 style={{
        fontSize: `${config.fonts.sizes.heading}px`,
        fontWeight: 'bold',
        color: config.colors.text_primary,
        margin: '0 0 10px 0'
      }}>
        Bill To:
      </h3>
      <div style={{ 
        fontSize: `${config.fonts.sizes.body}px`,
        color: config.colors.text_secondary 
      }}>
        <div style={{ fontWeight: 'bold', color: config.colors.text_primary }}>
          {data.client.name}
        </div>
        {data.client.email && <div>{data.client.email}</div>}
        {data.client.address && <div style={{ whiteSpace: 'pre-line' }}>{data.client.address}</div>}
      </div>
    </div>
  );
}

// Items Table
function ItemsTable({ data, config }: { data: InvoiceTemplateData; config: InvoiceTemplateConfig }) {
  const { table } = config.styles;
  
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '20px',
    fontSize: `${config.fonts.sizes.body}px`
  };
  
  const headerStyle = {
    backgroundColor: table.header_background,
    color: table.header_text_color,
    padding: '10px',
    textAlign: 'left' as const,
    fontWeight: 'bold',
    borderBottom: table.border_style !== 'none' ? `1px solid ${config.colors.border}` : 'none'
  };
  
  const cellStyle = {
    padding: '10px',
    borderBottom: table.border_style !== 'none' ? `1px solid ${config.colors.border}` : 'none'
  };
  
  return (
    <div style={{ marginBottom: '30px' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {table.show_item_numbers && <th style={headerStyle}>#</th>}
            <th style={headerStyle}>Description</th>
            <th style={headerStyle}>Qty</th>
            <th style={headerStyle}>Unit Price</th>
            <th style={headerStyle}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr 
              key={index}
              style={{
                backgroundColor: table.row_alternate_background && index % 2 === 1 ? 
                  table.row_alternate_background : 'transparent'
              }}
            >
              {table.show_item_numbers && (
                <td style={cellStyle}>{index + 1}</td>
              )}
              <td style={cellStyle}>{item.description}</td>
              <td style={cellStyle}>{item.quantity}</td>
              <td style={cellStyle}>{formatCurrency(item.unit_price, data.invoice.currency)}</td>
              <td style={cellStyle}>{formatCurrency(item.total, data.invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Totals Section
function InvoiceTotals({ data, config }: { data: InvoiceTemplateData; config: InvoiceTemplateConfig }) {
  const { totals } = config.styles;
  
  const containerStyle = {
    backgroundColor: totals.background_color || 'transparent',
    padding: totals.background_color ? '15px' : '0',
    marginBottom: '30px',
    marginLeft: totals.alignment === 'right' ? 'auto' : '0',
    width: totals.alignment === 'right' ? '300px' : '100%'
  };
  
  return (
    <div style={containerStyle}>
      {totals.show_subtotals && (
        <div className="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>{formatCurrency(data.totals.subtotal, data.invoice.currency)}</span>
        </div>
      )}
      {data.totals.vat_rate > 0 && (
        <div className="flex justify-between mb-2">
          <span>VAT ({data.totals.vat_rate}%):</span>
          <span>{formatCurrency(data.totals.vat_amount, data.invoice.currency)}</span>
        </div>
      )}
      <div 
        className="flex justify-between"
        style={{
          fontWeight: totals.highlight_total ? 'bold' : 'normal',
          fontSize: totals.highlight_total ? `${config.fonts.sizes.heading}px` : `${config.fonts.sizes.body}px`,
          color: totals.highlight_total ? config.colors.primary : config.colors.text_primary,
          borderTop: totals.show_subtotals ? `1px solid ${config.colors.border}` : 'none',
          paddingTop: totals.show_subtotals ? '10px' : '0'
        }}
      >
        <span>Total:</span>
        <span>{formatCurrency(data.totals.total, data.invoice.currency)}</span>
      </div>
    </div>
  );
}

// Footer Component
function InvoiceFooter({ data, config }: { data: InvoiceTemplateData; config: InvoiceTemplateConfig }) {
  const { footer } = config.styles;
  
  if (!footer.show_notes && !footer.show_terms && !footer.show_payment_instructions) {
    return null;
  }
  
  const footerStyle = {
    backgroundColor: footer.background_color || 'transparent',
    borderTop: footer.border_top ? `1px solid ${config.colors.border}` : 'none',
    paddingTop: '20px',
    textAlign: footer.text_align as 'left' | 'center' | 'right',
    fontSize: `${config.fonts.sizes.small}px`,
    color: config.colors.text_secondary
  };
  
  return (
    <div style={footerStyle}>
      {footer.show_terms && data.terms && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Terms:</strong> {data.terms}
        </div>
      )}
      {footer.show_payment_instructions && data.payment_instructions && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Payment Instructions:</strong> {data.payment_instructions}
        </div>
      )}
      {footer.show_notes && data.invoice.notes && (
        <div>
          <strong>Notes:</strong> {data.invoice.notes}
        </div>
      )}
    </div>
  );
}

// Helper function to get status color
function getStatusColor(status: string, colors: InvoiceTemplateConfig['colors']): string {
  switch (status) {
    case 'paid':
      return '#059669'; // Green
    case 'sent':
      return '#2563EB'; // Blue
    case 'overdue':
      return '#DC2626'; // Red
    case 'cancelled':
      return '#6B7280'; // Gray
    default:
      return colors.text_secondary;
  }
}