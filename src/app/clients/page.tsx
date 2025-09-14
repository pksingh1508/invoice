'use client';

import React from 'react';
import { PlusIcon, RefreshCwIcon, UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientTable } from '@/components/clients/ClientTable';
import { ClientSearch } from '@/components/clients/ClientSearch';
import { ClientPagination } from '@/components/clients/ClientPagination';
import { ClientBulkActions } from '@/components/clients/ClientBulkActions';
import { 
  useClientList, 
  useClientTableState 
} from '@/hooks/useClientList';

export default function ClientsPage() {
  const {
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
    setPageSize
  } = useClientTableState();

  // Fetch clients with current filters
  const {
    clients,
    pagination,
    isLoading,
    error,
    refetch
  } = useClientList({
    page: currentPage,
    limit: pageSize,
    sortBy,
    sortOrder,
    search: searchQuery
  });

  // Debug log to check what we're getting
  console.log('Clients page data:', { clients, isLoading, error, pagination });

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
            Error Loading Clients
          </h3>
          <p className="text-red-600 mb-4">
            {error.message || 'Failed to load clients. Please try again.'}
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UsersIcon className="w-6 h-6" />
            Clients
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your client information and view their invoice history
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
            <a href="/clients/new">
              <PlusIcon className="w-4 h-4" />
              Add Client
            </a>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
          <ClientSearch
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* Reset Filters */}
        {searchQuery && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="self-start sm:self-center"
          >
            Clear Search
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedClients.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <ClientBulkActions
            selectedClients={selectedClients}
            onClearSelection={clearSelection}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Client Table */}
      <div className="space-y-4">
        <ClientTable
          clients={clients}
          selectedClients={selectedClients}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSelectClient={handleSelectClient}
          onSelectAll={handleSelectAll}
          onSort={handleSort}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {!isLoading && pagination.total > 0 && (
          <ClientPagination
            pagination={pagination}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Empty State */}
      {!isLoading && clients.length === 0 && !searchQuery && (
        <div className="text-center py-12">
          <div className="max-w-sm mx-auto">
            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No clients yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first client. You can store their contact information and track all their invoices.
            </p>
            <Button asChild size="lg" className="gap-2">
              <a href="/clients/new">
                <PlusIcon className="w-5 h-5" />
                Add Your First Client
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* No Results State */}
      {!isLoading && clients.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <div className="max-w-sm mx-auto">
            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No clients found
            </h3>
            <p className="text-gray-600 mb-6">
              No clients match your current search. Try adjusting your search criteria.
            </p>
            <Button variant="outline" onClick={handleResetFilters}>
              Clear Search
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}