import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { Client, ClientQueryParams, PaginatedResponse } from '@/types/database';

// Type definitions
export interface ClientListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: keyof Client;
  sortOrder?: 'asc' | 'desc';
}

export interface ClientTableState {
  selectedClients: string[];
  currentPage: number;
  pageSize: number;
  sortBy: keyof Client;
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
}

// SWR fetcher for clients
const clientsFetcher = async (url: string): Promise<PaginatedResponse<Client>> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }
  return response.json();
};

// Hook for fetching client list with filters
export function useClientList(params: ClientListParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'name',
    sortOrder = 'asc'
  } = params;

  // Create URL with search params
  const url = useMemo(() => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: sortBy.toString(),
      sortOrder,
      ...(search && { search })
    });
    return `/api/clients?${searchParams}`;
  }, [page, limit, search, sortBy, sortOrder]);

  // Use SWR for data fetching
  const { data, error, mutate, isLoading } = useSWR<PaginatedResponse<Client>>(
    url,
    clientsFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    clients: data?.data || [],
    pagination: data?.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    },
    isLoading,
    error,
    refetch: mutate
  };
}

// Hook for managing client table state
export function useClientTableState() {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<keyof Client>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle client selection
  const handleSelectClient = useCallback((clientId: string, selected: boolean) => {
    setSelectedClients(prev => 
      selected 
        ? [...prev, clientId]
        : prev.filter(id => id !== clientId)
    );
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((clientIds: string[], selected: boolean) => {
    setSelectedClients(selected ? clientIds : []);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedClients([]);
  }, []);

  // Handle sorting
  const handleSort = useCallback((column: keyof Client) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  }, [sortBy]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search changes
    clearSelection(); // Clear selection when search changes
  }, [clearSelection]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSortBy('name');
    setSortOrder('asc');
    setCurrentPage(1);
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
    clearSelection(); // Clear selection when page size changes
  }, [clearSelection]);

  return {
    selectedClients,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    searchQuery,
    handleSelectClient,
    handleSelectAll,
    clearSelection,
    handleSort,
    handleSearch,
    resetFilters,
    setCurrentPage,
    setPageSize: handlePageSizeChange
  };
}

// Hook for individual client operations
export function useClientActions() {
  const [isPerforming, setIsPerforming] = useState(false);

  const deleteClient = async (clientId: string) => {
    setIsPerforming(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }

      return response.json();
    } catch (error) {
      throw error;
    } finally {
      setIsPerforming(false);
    }
  };

  const bulkDeleteClients = async (clientIds: string[]) => {
    setIsPerforming(true);
    try {
      const results = await Promise.allSettled(
        clientIds.map(id => deleteClient(id))
      );

      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        throw new Error(`Failed to delete ${failures.length} client(s)`);
      }

      return results;
    } catch (error) {
      throw error;
    } finally {
      setIsPerforming(false);
    }
  };

  return {
    deleteClient,
    bulkDeleteClients,
    isPerforming
  };
}

// Hook for fetching single client
export function useClient(clientId: string | null) {
  const url = clientId ? `/api/clients/${clientId}` : null;
  
  const { data, error, mutate, isLoading } = useSWR(
    url,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }
      const result = await response.json();
      return result.data;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    client: data,
    isLoading,
    error,
    refetch: mutate
  };
}