'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { invoiceQueries } from '@/lib/database/invoices';
import { clientQueries } from '@/lib/database/clients';
import { profileQueries } from '@/lib/database/profiles';
import { 
  calculateInvoiceTotals, 
  formatCurrency, 
  parseNumber,
  sanitizeNumericInput 
} from '@/lib/utils/calculations';
import { 
  invoiceFormSchema, 
  transformInvoiceFormData,
  type InvoiceFormData 
} from '@/lib/validation/schemas';
import { Client, UserProfile, InvoiceStatus } from '@/types/database';

interface InvoiceFormProps {
  initialData?: Partial<InvoiceFormData>;
  invoiceId?: string;
  onSuccess?: (invoiceId: string) => void;
  onSubmitSuccess?: (formData: any) => Promise<void>;
  mode?: 'create' | 'edit';
}

export default function InvoiceForm({ 
  initialData, 
  invoiceId, 
  onSuccess, 
  onSubmitSuccess, 
  mode = 'create' 
}: InvoiceFormProps) {
  const { user } = useUser();
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<InvoiceFormData>({
    buyer_name: '',
    buyer_email: '',
    buyer_address: '',
    service_name: '',
    currency: 'USD',
    unit_net_price: 0,
    qty: 1,
    vat_rate: 0,
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
  const [clients, setClients] = useState<Client[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: '', email: '', address: '' });

  // Calculated values
  const calculations = calculateInvoiceTotals(
    formData.unit_net_price,
    formData.qty,
    formData.vat_rate
  );

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load user profile and clients
        const [profileResult, clientsResult] = await Promise.all([
          profileQueries.getCurrentProfile(),
          clientQueries.getAllClients()
        ]);

        if (profileResult.data) {
          setUserProfile(profileResult.data);
          setFormData(prev => ({
            ...prev,
            currency: profileResult.data?.default_currency || 'USD'
          }));
        }

        if (clientsResult.data) {
          setClients(clientsResult.data);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    if (user) {
      loadInitialData();
    }
  }, [user]);

  // Handle form field changes
  const handleChange = useCallback((field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Handle numeric input changes
  const handleNumericChange = (field: keyof InvoiceFormData, value: string) => {
    const sanitized = sanitizeNumericInput(value);
    const numericValue = parseNumber(sanitized);
    handleChange(field, numericValue);
  };

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        buyer_name: selectedClient.name,
        buyer_email: selectedClient.email || '',
        buyer_address: selectedClient.address || ''
      }));
    }
  };

  // Handle new client creation
  const handleCreateClient = async () => {
    if (!newClientData.name.trim()) return;

    try {
      setLoading(true);
      const result = await clientQueries.createClient({
        user_id: user!.id,
        ...newClientData
      });

      if (result.error) {
        alert('Error creating client: ' + result.error);
        return;
      }

      if (result.data) {
        // Add to clients list
        if (result.data) {
          setClients(prev => [...prev, result.data!]);
        }
        
        // Select the new client
        handleClientSelect(result.data.id);
        
        // Reset form and close
        setNewClientData({ name: '', email: '', address: '' });
        setShowClientForm(false);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const transformedData = transformInvoiceFormData(formData);
    const result = invoiceFormSchema.safeParse(transformedData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((error: any) => {
        if (error.path && error.path.length > 0) {
          newErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      alert('You must be logged in to create an invoice');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...transformInvoiceFormData(formData),
        user_id: user.id
      };

      let result;
      if (invoiceId) {
        // Update existing invoice
        result = await invoiceQueries.updateInvoice(invoiceId, submitData);
      } else {
        // Create new invoice
        result = await invoiceQueries.createInvoice(submitData);
      }

      if (result.error) {
        alert('Error saving invoice: ' + result.error);
        return;
      }

      if (result.data) {
        if (onSuccess) {
          onSuccess(result.data.id);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  // Status options
  const statusOptions: { value: InvoiceStatus; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Currency options
  const currencyOptions = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {invoiceId ? 'Edit Invoice' : 'Create New Invoice'}
          </h1>
          <p className="text-gray-600 mt-2">
            Fill in the details below to generate your professional invoice
          </p>
        </div>

        {/* Business Details Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">From (Your Business)</h2>
          {userProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <strong>{userProfile.business_name || 'Your Business'}</strong>
                <p>{userProfile.business_email}</p>
                {userProfile.business_phone && <p>{userProfile.business_phone}</p>}
              </div>
              <div>
                {userProfile.business_address && (
                  <p className="whitespace-pre-line">{userProfile.business_address}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">
              <a href="/settings" className="text-blue-600 hover:underline">
                Complete your business profile
              </a> to see your details here.
            </p>
          )}
        </div>

        {/* Client Selection Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Bill To (Client)</h2>
            <button
              type="button"
              onClick={() => setShowClientForm(!showClientForm)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showClientForm ? 'Cancel' : 'Add New Client'}
            </button>
          </div>

          {/* Client Selector */}
          {clients.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Existing Client
              </label>
              <select
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.email && `(${client.email})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* New Client Form */}
          {showClientForm && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900">Add New Client</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={newClientData.name}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newClientData.email}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={newClientData.address}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleCreateClient}
                disabled={!newClientData.name.trim() || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Add Client
              </button>
            </div>
          )}

          {/* Manual Client Entry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                value={formData.buyer_name}
                onChange={(e) => handleChange('buyer_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.buyer_name ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.buyer_name && (
                <p className="text-red-500 text-sm mt-1">{errors.buyer_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Email
              </label>
              <input
                type="email"
                value={formData.buyer_email}
                onChange={(e) => handleChange('buyer_email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.buyer_email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.buyer_email && (
                <p className="text-red-500 text-sm mt-1">{errors.buyer_email}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Address
              </label>
              <textarea
                value={formData.buyer_address}
                onChange={(e) => handleChange('buyer_address', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.buyer_address ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.buyer_address && (
                <p className="text-red-500 text-sm mt-1">{errors.buyer_address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Details Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency *
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.currency ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                {currencyOptions.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
              {errors.currency && (
                <p className="text-red-500 text-sm mt-1">{errors.currency}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.due_date ? 'border-red-500' : 'border-gray-300'
                }`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.due_date && (
                <p className="text-red-500 text-sm mt-1">{errors.due_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number
            </label>
            <input
              type="text"
              value={formData.account_no}
              onChange={(e) => handleChange('account_no', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.account_no ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Optional bank account or reference number"
            />
            {errors.account_no && (
              <p className="text-red-500 text-sm mt-1">{errors.account_no}</p>
            )}
          </div>
        </div>

        {/* Service Details Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Service Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Description *
            </label>
            <input
              type="text"
              value={formData.service_name}
              onChange={(e) => handleChange('service_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.service_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe the service or product"
              required
            />
            {errors.service_name && (
              <p className="text-red-500 text-sm mt-1">{errors.service_name}</p>
            )}
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.qty ? 'border-red-500' : 'border-gray-300'
                }`}
                min="1"
                required
              />
              {errors.qty && (
                <p className="text-red-500 text-sm mt-1">{errors.qty}</p>
              )}
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.unit_net_price ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0.01"
                required
              />
              {errors.unit_net_price && (
                <p className="text-red-500 text-sm mt-1">{errors.unit_net_price}</p>
              )}
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.vat_rate ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0"
                max="100"
              />
              {errors.vat_rate && (
                <p className="text-red-500 text-sm mt-1">{errors.vat_rate}</p>
              )}
            </div>
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(calculations.subtotal, formData.currency)}</span>
            </div>
            {formData.vat_rate > 0 && (
              <div className="flex justify-between">
                <span>VAT ({formData.vat_rate}%):</span>
                <span>{formatCurrency(calculations.vatAmount, formData.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(calculations.totalAmount, formData.currency)}</span>
            </div>
          </div>
        </div>

        {/* Additional Details Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Additional Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Link
            </label>
            <input
              type="url"
              value={formData.payment_link}
              onChange={(e) => handleChange('payment_link', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.payment_link ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://... (Optional payment link)"
            />
            {errors.payment_link && (
              <p className="text-red-500 text-sm mt-1">{errors.payment_link}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Additional notes or terms (optional)"
            />
            {errors.notes && (
              <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
            )}
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
  );
}