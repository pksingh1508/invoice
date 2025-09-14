'use client';

import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ClientPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
}

export function ClientPagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  isLoading = false
}: ClientPaginationProps) {
  const { page, limit, total, totalPages } = pagination;
  
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const pageSizeOptions = [10, 25, 50, 100];

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      {/* Results info */}
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{total}</span> clients
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-6">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Rows per page</span>
          <Select
            value={limit.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious || isLoading}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeftIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious || isLoading}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 mx-2">
            <span className="text-sm font-medium">
              Page {page} of {totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext || isLoading}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext || isLoading}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}