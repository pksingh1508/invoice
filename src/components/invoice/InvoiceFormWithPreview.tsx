'use client';

import React, { useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { LivePreview } from '@/components/invoice/templates';
import { useLivePreview } from '@/hooks/useLivePreview';
import { generateBrandingFromProfile } from '@/lib/pdf/branding';
import { InvoiceFormData } from '@/types/templates';
import { UserProfile } from '@/types/database';

interface InvoiceFormWithPreviewProps {
  initialData?: Partial<InvoiceFormData>;
  invoiceId?: string;
  userProfile?: UserProfile;
  onSuccess?: (invoiceId: string) => void;
  className?: string;
  showPreview?: boolean;
  defaultTemplateId?: string;
}

export default function InvoiceFormWithPreview({
  initialData,
  invoiceId,
  userProfile,
  onSuccess,
  className = '',
  showPreview = true,
  defaultTemplateId
}: InvoiceFormWithPreviewProps) {
  const { user } = useUser();
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<InvoiceFormData>({
    buyer_name: '',
    buyer_email: '',
    buyer_address: '',
    service_name: '',
    unit_net_price: 0,
    qty: 1,
    vat_rate: 0,
    currency: 'USD',
    account_no: '',
    payment_link: '',
    due_date: '',
    status: 'draft',
    notes: '',
    ...initialData
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    defaultTemplateId || 'classic-professional'
  );
  const [previewLayout, setPreviewLayout] = useState<'side' | 'top' | 'hidden'>('side');
  
  // Generate branding from profile
  const branding = userProfile ? generateBrandingFromProfile(userProfile) : undefined;
  
  // Handle form field changes
  const handleChange = useCallback((field: keyof InvoiceFormData, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  }, [errors]);
  
  // Handle numeric input changes
  const handleNumericChange = (field: keyof InvoiceFormData, value: string) => {
    const numericValue = parseFloat(value) || 0;
    handleChange(field, numericValue);
  };
  
  // Handle template change from preview
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
  }, []);
  
  // Handle form submission (placeholder)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Here you would submit the form data
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onSuccess) {
        onSuccess('new-invoice-id');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Layout classes based on preview layout
  const layoutClasses = {
    side: 'lg:grid-cols-2',
    top: 'grid-cols-1',
    hidden: 'grid-cols-1'
  };
  
  return (
    <div className={`invoice-form-with-preview min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {invoiceId ? 'Edit Invoice' : 'Create New Invoice'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Fill in the details and see the live preview
            </p>
          </div>
          
          {/* Layout Controls */}
          {showPreview && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Preview:</label>
              <select
                value={previewLayout}
                onChange={(e) => setPreviewLayout(e.target.value as typeof previewLayout)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="side">Side by Side</option>
                <option value="top">Top</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`grid gap-6 p-6 ${previewLayout !== 'hidden' ? layoutClasses[previewLayout] : layoutClasses.hidden}`}>
        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Invoice Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Invoice Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleChange('due_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
            
            {/* Client Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Client Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.buyer_name}
                    onChange={(e) => handleChange('buyer_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter client name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={formData.buyer_email}
                    onChange={(e) => handleChange('buyer_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="client@company.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Address
                </label>
                <textarea
                  value={formData.buyer_address}
                  onChange={(e) => handleChange('buyer_address', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Client address..."
                />
              </div>
            </div>
            
            {/* Service Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Service Details
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Description *
                </label>
                <input
                  type="text"
                  value={formData.service_name}
                  onChange={(e) => handleChange('service_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the service or product"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.qty}
                    onChange={(e) => handleNumericChange('qty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_net_price}
                    onChange={(e) => handleNumericChange('unit_net_price', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    VAT Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.vat_rate}
                    onChange={(e) => handleNumericChange('vat_rate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>
            
            {/* Additional Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Additional Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.account_no}
                    onChange={(e) => handleChange('account_no', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional bank account or reference"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Link
                  </label>
                  <input
                    type="url"
                    value={formData.payment_link}
                    onChange={(e) => handleChange('payment_link', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://... (Optional payment link)"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes or terms (optional)"
                />
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (invoiceId ? 'Update Invoice' : 'Create Invoice')}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                disabled={loading}
                className="flex-1 sm:flex-none px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        
        {/* Preview Section */}
        {showPreview && previewLayout !== 'hidden' && (
          <div className="bg-white rounded-lg shadow-sm">
            <LivePreview
              formData={formData}
              userProfile={userProfile}
              branding={branding}
              defaultTemplateId={selectedTemplateId}
              onTemplateChange={handleTemplateChange}
              enableTemplateSwitch={true}
              enablePrintPreview={true}
              showControls={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}