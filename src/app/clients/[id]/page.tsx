'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  EditIcon,
  MailIcon,
  MapPinIcon,
  CalendarIcon,
  FileTextIcon,
  PlusIcon,
  UsersIcon,
  DollarSignIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClient } from '@/hooks/useClientList';
import { useInvoiceList } from '@/hooks/useInvoiceList';
import { formatDate } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';
import { ClientActionsDropdown } from '@/components/clients/ClientActionsDropdown';

// Simplified invoice table for client view
function ClientInvoiceTable({ clientName }: { clientName: string }) {
  const { invoices, isLoading, error } = useInvoiceList({
    limit: 50, // Show more invoices for client view
    search: clientName // Filter by client name
  });

  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500 text-sm">Loading invoices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Error loading invoices: {error.message}</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="p-8 text-center">
        <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No invoices yet
        </h3>
        <p className="text-gray-600 mb-4">
          This client doesn't have any invoices yet. Create their first invoice to get started.
        </p>
        <Button asChild className="gap-2">
          <a href={`/invoices/new?client=${encodeURIComponent(clientName)}`}>
            <PlusIcon className="w-4 h-4" />
            Create Invoice
          </a>
        </Button>
      </div>
    );
  }

  // Calculate client stats
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const draftInvoices = invoices.filter(inv => inv.status === 'draft').length;
  const sentInvoices = invoices.filter(inv => inv.status === 'sent').length;
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.unit_net_price * inv.qty * (1 + inv.vat_rate / 100)), 0);

  const pendingRevenue = invoices
    .filter(inv => ['sent', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + (inv.unit_net_price * inv.qty * (1 + inv.vat_rate / 100)), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileTextIcon className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">{totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSignIcon className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRevenue, invoices[0]?.currency || 'USD')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSignIcon className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(pendingRevenue, invoices[0]?.currency || 'USD')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Paid</p>
                <p className="font-semibold text-green-600">{paidInvoices}</p>
              </div>
              <div>
                <p className="text-gray-600">Sent</p>
                <p className="font-semibold text-blue-600">{sentInvoices}</p>
              </div>
              <div>
                <p className="text-gray-600">Draft</p>
                <p className="font-semibold text-gray-600">{draftInvoices}</p>
              </div>
              <div>
                <p className="text-gray-600">Overdue</p>
                <p className="font-semibold text-red-600">{overdueInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoice History</CardTitle>
          <Button asChild size="sm" className="gap-2">
            <a href={`/invoices/new?client=${encodeURIComponent(clientName)}`}>
              <PlusIcon className="w-4 h-4" />
              New Invoice
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {invoices.map((invoice) => {
              const total = invoice.unit_net_price * invoice.qty * (1 + invoice.vat_rate / 100);
              const statusConfig = {
                draft: 'bg-gray-100 text-gray-800',
                sent: 'bg-blue-100 text-blue-800', 
                paid: 'bg-green-100 text-green-800',
                overdue: 'bg-red-100 text-red-800',
              };

              return (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/invoices/${invoice.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">#{invoice.id.slice(-6)}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {invoice.service_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(total, invoice.currency)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(invoice.issued_at)}
                      </p>
                    </div>
                    
                    <Badge className={statusConfig[invoice.status as keyof typeof statusConfig]}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const { client, isLoading, error } = useClient(clientId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h2>
          <p className="text-gray-600 mb-6">
            The client you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push('/clients')}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/clients')}
              className="gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Clients
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UsersIcon className="w-6 h-6" />
                {client.name}
              </h1>
              <p className="text-gray-600">
                Client since {formatDate(client.created_at)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/clients/${client.id}/edit`)}
              className="gap-2"
            >
              <EditIcon className="w-4 h-4" />
              Edit Client
            </Button>
            
            <ClientActionsDropdown client={client} />
          </div>
        </div>

        {/* Client Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <UsersIcon className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Client Name</p>
                    <p className="font-medium">{client.name}</p>
                  </div>
                </div>

                {client.email && (
                  <div className="flex items-center gap-3">
                    <MailIcon className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{client.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Client Since</p>
                    <p className="font-medium">{formatDate(client.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {client.address && (
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium whitespace-pre-wrap">{client.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invoices">Invoice History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="invoices" className="space-y-4">
            <ClientInvoiceTable clientName={client.name} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}