'use client';

import React from 'react';
import { PlusIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { InvoiceStatusFilter } from '@/components/invoices/InvoiceStatusFilter';
import { InvoiceSearch } from '@/components/invoices/InvoiceSearch';
import { InvoicePagination } from '@/components/invoices/InvoicePagination';
import { InvoiceBulkActions } from '@/components/invoices/InvoiceBulkActions';
import { 
  useInvoiceList, 
  useInvoiceTableState 
} from '@/hooks/useInvoiceList';

export default function InvoicesPage() {
  const {
    selectedInvoices,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    statusFilter,
    searchQuery,
    handleSelectInvoice,
    handleSelectAll,
    clearSelection,
    handleSort,
    handleFilter,
    handleSearch,
    resetFilters,
    setCurrentPage,
    setPageSize
  } = useInvoiceTableState();

  // Fetch invoices with current filters
  const {
    invoices,
    pagination,
    isLoading,
    error,
    refetch
  } = useInvoiceList({
    page: currentPage,
    limit: pageSize,
    sortBy,
    sortOrder,
    status: statusFilter,
    search: searchQuery
  });

  const handleRefresh = () => {
    refetch();
    clearSelection();
  };

  const handleResetFilters = () => {
    resetFilters();
    clearSelection();
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-8 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Invoices
          </h3>
          <p className="text-red-600 mb-4">
            {error.message || 'Failed to load invoices. Please try again.'}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">
            Manage and track your invoices
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button asChild className="gap-2">
            <a href="/invoices/new">
              <PlusIcon className="w-4 h-4" />
              Create Invoice
            </a>
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
          {/* Search */}
          <InvoiceSearch
            value={searchQuery}
            onChange={handleSearch}
          />
          
          {/* Status Filter */}
          <InvoiceStatusFilter
            currentStatus={statusFilter}
            onStatusChange={handleFilter}
            statusCounts={{
              all: pagination.total,
              // TODO: Add individual status counts from API
            }}
          />
        </div>

        {/* Reset Filters */}
        {(searchQuery || statusFilter !== 'all') && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="self-start sm:self-center"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <InvoiceBulkActions
            selectedInvoices={selectedInvoices}
            onClearSelection={clearSelection}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Invoice Table */}
      <div className="space-y-4">
        <InvoiceTable
          invoices={invoices}
          selectedInvoices={selectedInvoices}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSelectInvoice={handleSelectInvoice}
          onSelectAll={handleSelectAll}
          onSort={handleSort}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {!isLoading && pagination.total > 0 && (
          <InvoicePagination
            pagination={pagination}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Empty State */}
      {!isLoading && invoices.length === 0 && !searchQuery && statusFilter === 'all' && (
        <div className="text-center py-12">
          <div className="max-w-sm mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No invoices yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first invoice. You can track payments, send to clients, and manage your business finances.
            </p>
            <Button asChild size="lg" className="gap-2">
              <a href="/invoices/new">
                <PlusIcon className="w-5 h-5" />
                Create Your First Invoice
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* No Results State */}
      {!isLoading && invoices.length === 0 && (searchQuery || statusFilter !== 'all') && (
        <div className="text-center py-12">
          <div className="max-w-sm mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No invoices found
            </h3>
            <p className="text-gray-600 mb-6">
              No invoices match your current filters. Try adjusting your search criteria or clearing the filters.
            </p>
            <Button variant="outline" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}