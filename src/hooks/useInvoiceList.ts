import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { InvoiceStatus } from '@/types/database';

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  sortBy?: 'invoice_number' | 'issued_at' | 'due_date' | 'total' | 'status' | 'buyer_name';
  sortOrder?: 'asc' | 'desc';
  status?: InvoiceStatus | 'all';
  search?: string;
}

export interface InvoiceListResponse {
  invoices: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkActionParams {
  action: 'mark_paid' | 'mark_sent' | 'mark_draft' | 'delete';
  invoiceIds: string[];
}

// Custom fetcher for invoice list
const fetcher = async (url: string): Promise<InvoiceListResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch invoices');
  }
  const result = await response.json();
  return result.data;
};

// Hook for fetching invoice list with filtering and pagination
export function useInvoiceList(params: InvoiceListParams = {}) {
  // Build query string from parameters
  const queryParams = useMemo(() => {
    const searchParams = new URLSearchParams();
    
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.limit !== undefined) searchParams.set('limit', params.limit.toString());
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.search?.trim()) searchParams.set('search', params.search.trim());
    
    return searchParams.toString();
  }, [params]);

  const swrKey = `/api/invoices${queryParams ? `?${queryParams}` : ''}`;

  const {
    data,
    error,
    isLoading,
    mutate: refetch
  } = useSWR<InvoiceListResponse>(swrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // 30 seconds
    errorRetryCount: 3
  });

  return {
    invoices: data?.invoices || [],
    pagination: data?.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    },
    isLoading,
    error,
    refetch
  };
}

// Hook for bulk operations on invoices
export function useInvoiceBulkActions() {
  const performBulkAction = async ({ action, invoiceIds }: BulkActionParams) => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, invoiceIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bulk action failed');
      }

      const result = await response.json();
      
      // Show success message
      const actionLabels = {
        mark_paid: 'marked as paid',
        mark_sent: 'marked as sent', 
        mark_draft: 'marked as draft',
        delete: 'deleted'
      };

      toast.success(`${invoiceIds.length} invoice(s) ${actionLabels[action]} successfully`);

      // Revalidate all invoice list queries
      await mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/invoices'),
        undefined,
        { revalidate: true }
      );

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bulk action failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  return { performBulkAction };
}

// Hook for invoice statistics (for dashboard or summary views)
export function useInvoiceStats() {
  // Custom fetcher for stats endpoint
  const statsFetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch invoice stats');
    }
    const result = await response.json();
    return result.data;
  };

  const { data, error, isLoading } = useSWR<{
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    draft: number;
    totalValue: number;
    paidValue: number;
    pendingValue: number;
  }>('/api/invoices/stats', statsFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  });

  return {
    stats: data,
    isLoading,
    error
  };
}

// Utility hook for managing invoice table state
export function useInvoiceTableState() {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<InvoiceListParams['sortBy']>('issued_at');
  const [sortOrder, setSortOrder] = useState<InvoiceListParams['sortOrder']>('desc');
  const [statusFilter, setStatusFilter] = useState<InvoiceListParams['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectInvoice = (invoiceId: string, selected: boolean) => {
    setSelectedInvoices(prev => 
      selected 
        ? [...prev, invoiceId]
        : prev.filter(id => id !== invoiceId)
    );
  };

  const handleSelectAll = (invoiceIds: string[], selected: boolean) => {
    setSelectedInvoices(selected ? invoiceIds : []);
  };

  const clearSelection = () => setSelectedInvoices([]);

  const handleSort = (column: InvoiceListParams['sortBy']) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  const handleFilter = (status: InvoiceListParams['status']) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
    setSortBy('issued_at');
    setSortOrder('desc');
  };

  return {
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
  };
}