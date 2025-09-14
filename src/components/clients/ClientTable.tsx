'use client';

import React from 'react';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  ArrowUpDownIcon,
  UserIcon,
  MailIcon,
  MapPinIcon,
  CalendarIcon,
  FileTextIcon
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date';
import { Client } from '@/types/database';
import { ClientListParams } from '@/hooks/useClientList';
import { ClientActionsDropdown } from './ClientActionsDropdown';

export interface ClientTableProps {
  clients: Client[];
  selectedClients: string[];
  sortBy?: keyof Client;
  sortOrder?: 'asc' | 'desc';
  onSelectClient: (clientId: string, selected: boolean) => void;
  onSelectAll: (clientIds: string[], selected: boolean) => void;
  onSort: (column: keyof Client) => void;
  isLoading?: boolean;
}

export function ClientTable({
  clients,
  selectedClients,
  sortBy,
  sortOrder,
  onSelectClient,
  onSelectAll,
  onSort,
  isLoading = false
}: ClientTableProps) {
  // Ensure clients is always an array
  const clientsArray = Array.isArray(clients) ? clients : [];
  
  // Debug log to check what we're receiving
  if (!Array.isArray(clients)) {
    console.log('ClientTable received non-array clients:', clients, 'type:', typeof clients);
  }
  
  const allSelected = clientsArray.length > 0 && selectedClients.length === clientsArray.length;
  const someSelected = selectedClients.length > 0 && selectedClients.length < clientsArray.length;

  const handleSelectAllChange = (checked: boolean) => {
    onSelectAll(clientsArray.map(client => client.id), checked);
  };

  const getSortIcon = (column: keyof Client) => {
    if (sortBy !== column) {
      return <ArrowUpDownIcon className="w-4 h-4 opacity-50" />;
    }
    return sortOrder === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4" />
      : <ChevronDownIcon className="w-4 h-4" />;
  };

  const getColumnIcon = (column: string) => {
    switch (column) {
      case 'name':
        return <UserIcon className="w-4 h-4" />;
      case 'email':
        return <MailIcon className="w-4 h-4" />;
      case 'address':
        return <MapPinIcon className="w-4 h-4" />;
      case 'created_at':
        return <CalendarIcon className="w-4 h-4" />;
      default:
        return <FileTextIcon className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (clientsArray.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No clients found</p>
          <p className="text-gray-400 text-sm mt-2">
            Add your first client to get started
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
                  aria-label="Select all clients"
                />
              </th>
              
              {/* Name Column */}
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium text-gray-900 hover:text-blue-600"
                  onClick={() => onSort('name')}
                >
                  <span className="flex items-center gap-2">
                    {getColumnIcon('name')}
                    Name
                    {getSortIcon('name')}
                  </span>
                </Button>
              </th>

              {/* Email Column */}
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium text-gray-900 hover:text-blue-600"
                  onClick={() => onSort('email')}
                >
                  <span className="flex items-center gap-2">
                    {getColumnIcon('email')}
                    Email
                    {getSortIcon('email')}
                  </span>
                </Button>
              </th>

              {/* Address Column */}
              <th className="px-4 py-3 text-left">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  {getColumnIcon('address')}
                  Address
                </span>
              </th>

              {/* Created Date Column */}
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium text-gray-900 hover:text-blue-600"
                  onClick={() => onSort('created_at')}
                >
                  <span className="flex items-center gap-2">
                    {getColumnIcon('created_at')}
                    Created
                    {getSortIcon('created_at')}
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
            {clientsArray.map((client) => (
              <tr 
                key={client.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Selection Checkbox */}
                <td className="px-4 py-4">
                  <Checkbox
                    checked={selectedClients.includes(client.id)}
                    onCheckedChange={(checked) => 
                      onSelectClient(client.id, checked as boolean)
                    }
                    aria-label={`Select client ${client.name}`}
                  />
                </td>

                {/* Name */}
                <td className="px-4 py-4">
                  <div className="font-medium text-gray-900">
                    {client.name}
                  </div>
                </td>

                {/* Email */}
                <td className="px-4 py-4">
                  <div className="text-gray-900">
                    {client.email || (
                      <span className="text-gray-400 italic">No email</span>
                    )}
                  </div>
                </td>

                {/* Address */}
                <td className="px-4 py-4 max-w-xs">
                  <div className="text-gray-900 truncate">
                    {client.address || (
                      <span className="text-gray-400 italic">No address</span>
                    )}
                  </div>
                </td>

                {/* Created Date */}
                <td className="px-4 py-4 text-sm text-gray-900">
                  {formatDate(client.created_at)}
                </td>

                {/* Actions */}
                <td className="px-4 py-4 text-right">
                  <ClientActionsDropdown client={client} />
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4">
        {clientsArray.map((client) => (
          <div 
            key={client.id}
            className="bg-white border rounded-lg p-4 space-y-3"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedClients.includes(client.id)}
                  onCheckedChange={(checked) => 
                    onSelectClient(client.id, checked as boolean)
                  }
                  aria-label={`Select client ${client.name}`}
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {client.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {client.email || 'No email'}
                  </div>
                </div>
              </div>
              <ClientActionsDropdown 
                client={client}
                trigger={
                  <Button variant="outline" size="sm">
                    Actions
                  </Button>
                }
                align="end"
              />
            </div>

            {/* Card Body */}
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-gray-500 flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" />
                  Address
                </div>
                <div className="font-medium">
                  {client.address || 'No address provided'}
                </div>
              </div>
              <div>
                <div className="text-gray-500 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  Created
                </div>
                <div className="font-medium">
                  {formatDate(client.created_at)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}