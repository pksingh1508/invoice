'use client';

import React from 'react';
import { 
  FilterIcon, 
  CheckIcon,
  Circle,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InvoiceStatus } from '@/types/database';
import { InvoiceListParams } from '@/hooks/useInvoiceList';

export interface StatusFilterProps {
  currentStatus: InvoiceListParams['status'];
  onStatusChange: (status: InvoiceListParams['status']) => void;
  statusCounts?: Record<string, number>;
}

const statusConfig = {
  all: { 
    label: 'All Invoices', 
    icon: FileText,
    badgeClass: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  },
  draft: { 
    label: 'Draft', 
    icon: FileText,
    badgeClass: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  },
  sent: { 
    label: 'Sent', 
    icon: Clock,
    badgeClass: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  paid: { 
    label: 'Paid', 
    icon: CheckIcon,
    badgeClass: 'bg-green-100 text-green-800 hover:bg-green-200'
  },
  overdue: { 
    label: 'Overdue', 
    icon: AlertCircle,
    badgeClass: 'bg-red-100 text-red-800 hover:bg-red-200'
  }
} as const;

export function InvoiceStatusFilter({
  currentStatus = 'all',
  onStatusChange,
  statusCounts = {}
}: StatusFilterProps) {
  const currentConfig = statusConfig[currentStatus as keyof typeof statusConfig];
  const CurrentIcon = currentConfig.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FilterIcon className="w-4 h-4" />
          Status: {currentConfig.label}
          {statusCounts[currentStatus] !== undefined && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {statusCounts[currentStatus]}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const count = statusCounts[status];
          const isSelected = currentStatus === status;

          return (
            <DropdownMenuCheckboxItem
              key={status}
              checked={isSelected}
              onCheckedChange={() => onStatusChange(status as InvoiceListParams['status'])}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span>{config.label}</span>
              </div>
              {count !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              )}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Quick filter buttons for mobile or simplified UI
export function InvoiceStatusTabs({
  currentStatus = 'all',
  onStatusChange,
  statusCounts = {}
}: StatusFilterProps) {
  const statuses = ['all', 'draft', 'sent', 'paid', 'overdue'] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => {
        const config = statusConfig[status];
        const Icon = config.icon;
        const count = statusCounts[status];
        const isActive = currentStatus === status;

        return (
          <Button
            key={status}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStatusChange(status)}
            className="gap-2"
          >
            <Icon className="w-4 h-4" />
            {config.label}
            {count !== undefined && (
              <Badge 
                variant={isActive ? 'secondary' : 'outline'} 
                className="text-xs"
              >
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}