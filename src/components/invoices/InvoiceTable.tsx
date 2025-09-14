'use client';

import React from 'react';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  ArrowUpDownIcon,
  CalendarIcon,
  UserIcon,
  DollarSignIcon,
  FileTextIcon
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { InvoiceStatus } from '@/types/database';
import { InvoiceListParams } from '@/hooks/useInvoiceList';
import { InvoiceActionsDropdown } from './InvoiceActionsDropdown';

export interface InvoiceTableProps {
  invoices: any[];
  selectedInvoices: string[];
  sortBy?: InvoiceListParams['sortBy'];
  sortOrder?: InvoiceListParams['sortOrder'];
  onSelectInvoice: (invoiceId: string, selected: boolean) => void;
  onSelectAll: (invoiceIds: string[], selected: boolean) => void;
  onSort: (column: InvoiceListParams['sortBy']) => void;
  isLoading?: boolean;
}

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800 hover:bg-green-200' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800 hover:bg-red-200' },
} as const;

export function InvoiceTable({
  invoices,
  selectedInvoices,
  sortBy,
  sortOrder,
  onSelectInvoice,
  onSelectAll,
  onSort,
  isLoading = false
}: InvoiceTableProps) {
  const allSelected = invoices.length > 0 && selectedInvoices.length === invoices.length;
  const someSelected = selectedInvoices.length > 0 && selectedInvoices.length < invoices.length;

  const handleSelectAllChange = (checked: boolean) => {
    onSelectAll(invoices.map(invoice => invoice.id), checked);
  };

  const getSortIcon = (column: InvoiceListParams['sortBy']) => {
    if (sortBy !== column) {
      return <ArrowUpDownIcon className="w-4 h-4 opacity-50" />;
    }
    return sortOrder === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4" />
      : <ChevronDownIcon className="w-4 h-4" />;
  };

  const getColumnIcon = (column: string) => {
    switch (column) {
      case 'issued_at':
      case 'due_date':
        return <CalendarIcon className="w-4 h-4" />;
      case 'buyer_name':
        return <UserIcon className="w-4 h-4" />;
      case 'total':
        return <DollarSignIcon className="w-4 h-4" />;
      default:
        return <FileTextIcon className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No invoices found</p>
          <p className="text-gray-400 text-sm mt-2">
            Create your first invoice to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead className="bg-gray-50 border-b">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      // Cast to HTMLInputElement to access indeterminate property
                      const input = el.querySelector('input') as HTMLInputElement;
                      if (input) input.indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={handleSelectAllChange}
                  aria-label="Select all invoices"
                />
              </th>
              
              {/* Invoice Number Column */}
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium text-gray-900 hover:text-blue-600"
                  onClick={() => onSort('invoice_number')}
                >
                  <span className="flex items-center gap-2">
                    {getColumnIcon('invoice_number')}
                    Invoice #
                    {getSortIcon('invoice_number')}
                  </span>
                </Button>
              </th>

              {/* Client Column */}
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium text-gray-900 hover:text-blue-600"
                  onClick={() => onSort('buyer_name')}
                >
                  <span className="flex items-center gap-2">
                    {getColumnIcon('buyer_name')}
                    Client
                    {getSortIcon('buyer_name')}
                  </span>
                </Button>
              </th>

              {/* Issue Date Column */}
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium text-gray-900 hover:text-blue-600"
                  onClick={() => onSort('issued_at')}
                >
                  <span className="flex items-center gap-2">
                    {getColumnIcon('issued_at')}
                    Issue Date
                    {getSortIcon('issued_at')}
                  </span>
                </Button>
              </th>

              {/* Due Date Column */}
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium text-gray-900 hover:text-blue-600"
                  onClick={() => onSort('due_date')}
                >
                  <span className="flex items-center gap-2">
                    {getColumnIcon('due_date')}
                    Due Date
                    {getSortIcon('due_date')}
                  </span>
                </Button>
              </th>

              {/* Amount Column */}
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium text-gray-900 hover:text-blue-600"
                  onClick={() => onSort('total')}
                >
                  <span className="flex items-center gap-2">
                    {getColumnIcon('total')}
                    Amount
                    {getSortIcon('total')}
                  </span>
                </Button>
              </th>

              {/* Status Column */}
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium text-gray-900 hover:text-blue-600"
                  onClick={() => onSort('status')}
                >
                  <span className="flex items-center gap-2">
                    Status
                    {getSortIcon('status')}
                  </span>
                </Button>
              </th>

              {/* Actions Column */}
              <th className="px-4 py-3 text-right">
                <span className="text-sm font-medium text-gray-900">Actions</span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr 
                key={invoice.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Selection Checkbox */}
                <td className="px-4 py-4">
                  <Checkbox
                    checked={selectedInvoices.includes(invoice.id)}
                    onCheckedChange={(checked) => 
                      onSelectInvoice(invoice.id, checked as boolean)
                    }
                    aria-label={`Select invoice ${invoice.invoice_number || invoice.id}`}
                  />
                </td>

                {/* Invoice Number */}
                <td className="px-4 py-4">
                  <div className="font-medium text-gray-900">
                    #{invoice.invoice_number || invoice.id.slice(-6)}
                  </div>
                  <div className="text-sm text-gray-500 truncate max-w-32">
                    {invoice.service_name}
                  </div>
                </td>

                {/* Client */}
                <td className="px-4 py-4">
                  <div className="font-medium text-gray-900">
                    {invoice.buyer_name}
                  </div>
                  {invoice.buyer_email && (
                    <div className="text-sm text-gray-500 truncate max-w-48">
                      {invoice.buyer_email}
                    </div>
                  )}
                </td>

                {/* Issue Date */}
                <td className="px-4 py-4 text-sm text-gray-900">
                  {invoice.issued_at ? formatDate(invoice.issued_at) : '-'}
                </td>

                {/* Due Date */}
                <td className="px-4 py-4 text-sm">
                  <span className={
                    invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid'
                      ? 'text-red-600 font-medium'
                      : 'text-gray-900'
                  }>
                    {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                  </span>
                </td>

                {/* Amount */}
                <td className="px-4 py-4">
                  <div className="font-medium text-gray-900">
                    {formatCurrency(
                      invoice.unit_net_price * invoice.qty * (1 + (invoice.vat_rate || 0) / 100),
                      invoice.currency
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {invoice.qty} × {formatCurrency(invoice.unit_net_price, invoice.currency)}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <Badge 
                    variant="secondary"
                    className={statusConfig[invoice.status as keyof typeof statusConfig]?.className}
                  >
                    {statusConfig[invoice.status as keyof typeof statusConfig]?.label || invoice.status}
                  </Badge>
                </td>

                {/* Actions */}
                <td className="px-4 py-4 text-right">
                  <InvoiceActionsDropdown invoice={invoice} />
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4">
        {invoices.map((invoice) => (
          <div 
            key={invoice.id}
            className="bg-white border rounded-lg p-4 space-y-3"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedInvoices.includes(invoice.id)}
                  onCheckedChange={(checked) => 
                    onSelectInvoice(invoice.id, checked as boolean)
                  }
                  aria-label={`Select invoice ${invoice.invoice_number || invoice.id}`}
                />
                <div>
                  <div className="font-medium text-gray-900">
                    #{invoice.invoice_number || invoice.id.slice(-6)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {invoice.buyer_name}
                  </div>
                </div>
              </div>
              <Badge 
                variant="secondary"
                className={statusConfig[invoice.status as keyof typeof statusConfig]?.className}
              >
                {statusConfig[invoice.status as keyof typeof statusConfig]?.label || invoice.status}
              </Badge>
            </div>

            {/* Card Body */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  Issue Date
                </div>
                <div className="font-medium">
                  {invoice.issued_at ? formatDate(invoice.issued_at) : '-'}
                </div>
              </div>
              <div>
                <div className="text-gray-500 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  Due Date
                </div>
                <div className={
                  invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid'
                    ? 'text-red-600 font-medium'
                    : 'font-medium'
                }>
                  {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="font-semibold text-lg">
                    {formatCurrency(
                      invoice.unit_net_price * invoice.qty * (1 + (invoice.vat_rate || 0) / 100),
                      invoice.currency
                    )}
                  </div>
                </div>
                <InvoiceActionsDropdown 
                  invoice={invoice}
                  trigger={
                    <Button variant="outline" size="sm">
                      Actions
                    </Button>
                  }
                  align="end"
                />
              </div>
            </div>
          </div>
        ))}
        
        {/* Mobile Empty State */}
        {invoices.length === 0 && (
          <div className="text-center py-12">
            <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No invoices found</p>
            <p className="text-gray-400 text-sm mt-2">
              Create your first invoice to get started
            </p>
          </div>
        )}
      </div>
    </>
  );
}