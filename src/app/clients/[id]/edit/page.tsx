'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientForm } from '@/components/clients/ClientForm';
import { useClient } from '@/hooks/useClientList';

export default function EditClientPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const { client, isLoading, error } = useClient(clientId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
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
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h2>
          <p className="text-gray-600 mb-6">
            The client you're trying to edit doesn't exist or you don't have permission to edit it.
          </p>
          <Button asChild>
            <a href="/clients">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Clients
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <ClientForm 
        initialData={client}
        clientId={clientId}
        mode="edit"
      />
    </div>
  );
}