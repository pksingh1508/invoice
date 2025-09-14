'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  PrinterIcon, 
  DownloadIcon,
  CalendarIcon,
  UserIcon,
  MailIcon,
  MapPinIcon,
  CreditCardIcon,
  HashIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { InvoiceActionsDropdown } from '@/components/invoices/InvoiceActionsDropdown';
import { useInvoice, useInvoiceNavigation } from '@/hooks/useInvoiceActions';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { getDefaultTemplate } from '@/lib/pdf/templates';

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
} as const;

export default function InvoiceViewPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { navigateToInvoicesList, navigateToEditInvoice } = useInvoiceNavigation();
  
  const { invoice, isLoading, error } = useInvoice(invoiceId);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const handlePDFDownload = async () => {
    try {
      setIsDownloadingPDF(true);
      
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
          template_id: getDefaultTemplate().id,
          format: 'blob',
          quality: 'standard',
          for_email: false
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF');
      }
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `invoice-${invoice.id.slice(-6)}.pdf`;
      
      // Create blob and download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('PDF Download Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to download PDF');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">
            The invoice you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={navigateToInvoicesList}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = invoice.unit_net_price * invoice.qty;
  const vatAmount = subtotal * (invoice.vat_rate / 100);
  const total = subtotal + vatAmount;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={navigateToInvoicesList}
              className="gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Invoices
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Invoice #{invoice.id.slice(-6)}
              </h1>
              <p className="text-gray-600">
                Created {formatDate(invoice.created_at)}
              </p>
            </div>
            
            <Badge 
              variant="secondary"
              className={statusConfig[invoice.status as keyof typeof statusConfig]?.className}
            >
              {statusConfig[invoice.status as keyof typeof statusConfig]?.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <PrinterIcon className="w-4 h-4 mr-2" />
              Print
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePDFDownload}
              disabled={isDownloadingPDF}
            >
              <DownloadIcon className={`w-4 h-4 mr-2 ${isDownloadingPDF ? 'animate-spin' : ''}`} />
              {isDownloadingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            
            <Button 
              variant="default" 
              size="sm"
              onClick={() => navigateToEditInvoice(invoice.id)}
            >
              Edit Invoice
            </Button>
            
            <InvoiceActionsDropdown 
              invoice={invoice} 
              onPdfDownload={handlePDFDownload}
            />
          </div>
        </div>

        {/* Invoice Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HashIcon className="w-5 h-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invoice Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarIcon className="w-4 h-4" />
                  Issue Date
                </div>
                <div className="font-medium">
                  {formatDate(invoice.issued_at)}
                </div>
              </div>
              
              {invoice.due_date && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarIcon className="w-4 h-4" />
                    Due Date
                  </div>
                  <div className={`font-medium ${
                    new Date(invoice.due_date) < new Date() && invoice.status !== 'paid'
                      ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatDate(invoice.due_date)}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CreditCardIcon className="w-4 h-4" />
                  Currency
                </div>
                <div className="font-medium">{invoice.currency}</div>
              </div>
              
              {invoice.account_no && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <HashIcon className="w-4 h-4" />
                    Account No.
                  </div>
                  <div className="font-medium font-mono">{invoice.account_no}</div>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Client Information */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <UserIcon className="w-5 h-5" />
                Bill To
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="font-medium text-lg">{invoice.buyer_name}</div>
                
                {invoice.buyer_email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MailIcon className="w-4 h-4" />
                    {invoice.buyer_email}
                  </div>
                )}
                
                {invoice.buyer_address && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="whitespace-pre-wrap">{invoice.buyer_address}</div>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Service/Item Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Service Details</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium text-lg mb-2">{invoice.service_name}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Quantity</div>
                    <div className="font-medium">{invoice.qty}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Unit Price</div>
                    <div className="font-medium">
                      {formatCurrency(invoice.unit_net_price, invoice.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">VAT Rate</div>
                    <div className="font-medium">{invoice.vat_rate}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500">VAT Amount</div>
                    <div className="font-medium">
                      {formatCurrency(vatAmount, invoice.currency)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Link */}
            {invoice.payment_link && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Payment Link</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <a 
                    href={invoice.payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {invoice.payment_link}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totals Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(subtotal, invoice.currency)}
                </span>
              </div>
              
              {invoice.vat_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT ({invoice.vat_rate}%)</span>
                  <span className="font-medium">
                    {formatCurrency(vatAmount, invoice.currency)}
                  </span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total, invoice.currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}