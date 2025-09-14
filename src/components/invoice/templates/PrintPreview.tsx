'use client';

import React, { useState, useRef, useCallback } from 'react';
import { InvoiceTemplateData, InvoiceTemplateConfig, CompanyBranding } from '@/types/templates';
import { applyBrandingToTemplate } from '@/lib/pdf/branding';
import InvoicePreview from './InvoicePreview';

interface PrintPreviewProps {
  data: InvoiceTemplateData;
  config: InvoiceTemplateConfig;
  branding?: CompanyBranding;
  className?: string;
  showControls?: boolean;
}

export default function PrintPreview({
  data,
  config: baseConfig,
  branding,
  className = '',
  showControls = true
}: PrintPreviewProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [printScale, setPrintScale] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);

  // Apply branding to config
  const config = branding ? applyBrandingToTemplate(baseConfig, branding) : baseConfig;

  // Handle print functionality
  const handlePrint = useCallback(() => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printContent = printRef.current.innerHTML;
        const printStyles = generatePrintStyles(config);
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice ${data.invoice.number}</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>${printStyles}</style>
            </head>
            <body class="print-body">
              ${printContent}
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load, then print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  }, [config, data.invoice.number]);

  // Handle print preview mode
  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode(!isPreviewMode);
  }, [isPreviewMode]);

  // Handle scale changes
  const handleScaleChange = useCallback((newScale: number) => {
    setPrintScale(Math.max(0.5, Math.min(2, newScale)));
  }, []);

  return (
    <div className={`print-preview ${className}`}>
      {/* Print Controls */}
      {showControls && (
        <div className="print-controls bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">Print Preview</h3>
              
              {/* Scale Control */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Scale:</label>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleScaleChange(printScale - 0.1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm"
                    disabled={printScale <= 0.5}
                  >
                    −
                  </button>
                  <span className="text-sm font-mono w-12 text-center">
                    {Math.round(printScale * 100)}%
                  </span>
                  <button
                    onClick={() => handleScaleChange(printScale + 0.1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm"
                    disabled={printScale >= 2}
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Preview Mode Toggle */}
              <button
                onClick={togglePreviewMode}
                className={`px-3 py-1 text-sm rounded ${
                  isPreviewMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isPreviewMode ? 'Exit Preview' : 'Print Preview'}
              </button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Browser Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Area */}
      <div 
        className={`print-preview-area ${isPreviewMode ? 'print-preview-mode' : ''}`}
        style={{
          backgroundColor: isPreviewMode ? '#f5f5f5' : 'white',
          minHeight: isPreviewMode ? '100vh' : 'auto',
          padding: isPreviewMode ? '20px' : '0'
        }}
      >
        <div 
          ref={printRef}
          className="print-content"
          style={{
            transform: `scale(${printScale})`,
            transformOrigin: 'top left',
            width: isPreviewMode ? '210mm' : '100%',
            margin: isPreviewMode ? '0 auto' : '0',
            backgroundColor: 'white',
            boxShadow: isPreviewMode ? '0 0 10px rgba(0,0,0,0.1)' : 'none',
            position: 'relative'
          }}
        >
          <PrintOptimizedInvoice data={data} config={config} />
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          .print-controls,
          .no-print {
            display: none !important;
          }
          
          .print-preview-area {
            background: white !important;
            padding: 0 !important;
            min-height: auto !important;
          }
          
          .print-content {
            transform: none !important;
            width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .no-page-break {
            page-break-inside: avoid;
          }
        }
        
        .print-preview-mode {
          overflow: auto;
        }
        
        .print-body {
          margin: 0;
          padding: 20mm;
          font-family: Arial, sans-serif;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
      `}</style>
    </div>
  );
}

// Print-optimized invoice component
function PrintOptimizedInvoice({ 
  data, 
  config 
}: { 
  data: InvoiceTemplateData; 
  config: InvoiceTemplateConfig; 
}) {
  return (
    <div className="print-invoice" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '20mm',
      fontFamily: config.fonts.primary,
      fontSize: `${config.fonts.sizes.body}px`,
      color: config.colors.text_primary,
      backgroundColor: config.colors.background,
      lineHeight: 1.4
    }}>
      {/* Use existing InvoicePreview but with print-optimized scaling */}
      <InvoicePreview 
        data={data} 
        config={config} 
        scale={1}
        className="print-optimized"
      />
    </div>
  );
}

// Generate print-specific CSS
function generatePrintStyles(config: InvoiceTemplateConfig): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 20mm;
      font-family: ${config.fonts.primary}, Arial, sans-serif;
      font-size: ${config.fonts.sizes.body}px;
      color: ${config.colors.text_primary};
      background: ${config.colors.background};
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }
    
    .invoice-preview {
      width: 100%;
      height: auto;
      transform: none !important;
    }
    
    .invoice-template {
      width: 100%;
      min-height: auto;
      padding: 0;
      box-shadow: none;
    }
    
    h1, h2, h3 {
      color: ${config.colors.primary};
      font-weight: bold;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th {
      background-color: ${config.styles.table.header_background} !important;
      color: ${config.styles.table.header_text_color} !important;
      padding: 8px;
      text-align: left;
      font-weight: bold;
    }
    
    td {
      padding: 8px;
      border-bottom: 1px solid ${config.colors.border};
    }
    
    .no-page-break {
      page-break-inside: avoid;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    @page {
      size: A4;
      margin: 20mm;
    }
  `;
}

// Simplified print preview for embedding
export function SimplePrintPreview({ 
  data, 
  config, 
  branding 
}: { 
  data: InvoiceTemplateData; 
  config: InvoiceTemplateConfig; 
  branding?: CompanyBranding; 
}) {
  const finalConfig = branding ? applyBrandingToTemplate(config, branding) : config;
  
  return (
    <div className="simple-print-preview">
      <button
        onClick={() => window.print()}
        className="print-button mb-4 inline-flex items-center px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print
      </button>
      
      <div className="border border-gray-300 rounded shadow-sm">
        <PrintOptimizedInvoice data={data} config={finalConfig} />
      </div>
      
      <style jsx global>{`
        @media print {
          .print-button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}