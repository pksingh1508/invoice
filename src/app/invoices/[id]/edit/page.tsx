'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvoiceForm from '@/components/invoice/InvoiceForm';
import { useInvoice, useInvoiceNavigation } from '@/hooks/useInvoiceActions';

export default function InvoiceEditPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { navigateToInvoice, navigateToInvoicesList } = useInvoiceNavigation();
  
  const { invoice, isLoading, error } = useInvoice(invoiceId);

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
            The invoice you're trying to edit doesn't exist or you don't have permission to edit it.
          </p>
          <Button onClick={navigateToInvoicesList}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  // Transform invoice data for the form (using the same field names as InvoiceForm expects)
  const initialData = {
    // Client details - using database field names that the form expects
    buyer_name: invoice.buyer_name,
    buyer_email: invoice.buyer_email || '',
    buyer_address: invoice.buyer_address || '',
    
    // Service details - using database field names
    service_name: invoice.service_name,
    qty: invoice.qty,
    unit_net_price: invoice.unit_net_price,
    
    // Tax and other details
    vat_rate: invoice.vat_rate,
    currency: invoice.currency,
    
    // Additional details
    account_no: invoice.account_no || '',
    payment_link: invoice.payment_link || '',
    due_date: invoice.due_date || '',
    status: invoice.status,
    
    // Notes (optional field)
    notes: invoice.notes || ''
  };


  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigateToInvoice(invoiceId)}
              className="gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Invoice
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Invoice #{invoice.id.slice(-6)}
              </h1>
              <p className="text-gray-600">
                Make changes to your invoice details
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Form */}
        <InvoiceForm 
          initialData={initialData}
          invoiceId={invoiceId} // Pass invoiceId for update mode
          onSuccess={() => navigateToInvoice(invoiceId)}
          mode="edit"
        />
      </div>
    </div>
  );
}