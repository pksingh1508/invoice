import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Fetcher for individual invoice
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch invoice');
  }
  const result = await response.json();
  return result.data;
};

// Hook for fetching individual invoice
export function useInvoice(id: string | null) {
  const { data, error, isLoading, mutate: refetch } = useSWR(
    id ? `/api/invoices/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    invoice: data,
    isLoading,
    error,
    refetch
  };
}

// Hook for invoice actions (update, delete, status changes, duplicate)
export function useInvoiceActions() {
  const [isPerforming, setIsPerforming] = useState(false);
  const router = useRouter();

  const updateInvoice = async (id: string, updateData: any) => {
    setIsPerforming(true);
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update invoice');
      }

      const result = await response.json();
      toast.success(result.message || 'Invoice updated successfully');

      // Revalidate all related data
      await Promise.all([
        mutate(`/api/invoices/${id}`),
        mutate((key) => typeof key === 'string' && key.startsWith('/api/invoices')),
        mutate('/api/dashboard/stats')
      ]);

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update invoice';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsPerforming(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    setIsPerforming(true);
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete invoice');
      }

      const result = await response.json();
      toast.success(result.message || 'Invoice deleted successfully');

      // Revalidate all related data
      await Promise.all([
        mutate((key) => typeof key === 'string' && key.startsWith('/api/invoices')),
        mutate('/api/dashboard/stats')
      ]);

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete invoice';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsPerforming(false);
    }
  };

  const updateInvoiceStatus = async (id: string, action: 'mark_paid' | 'mark_sent' | 'mark_draft') => {
    setIsPerforming(true);
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update invoice status');
      }

      const result = await response.json();
      toast.success(result.message || 'Invoice status updated successfully');

      // Revalidate all related data
      await Promise.all([
        mutate(`/api/invoices/${id}`),
        mutate((key) => typeof key === 'string' && key.startsWith('/api/invoices')),
        mutate('/api/dashboard/stats')
      ]);

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update invoice status';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsPerforming(false);
    }
  };

  const duplicateInvoice = async (id: string) => {
    setIsPerforming(true);
    try {
      const response = await fetch(`/api/invoices/${id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate invoice');
      }

      const result = await response.json();
      toast.success(result.message || 'Invoice duplicated successfully');

      // Revalidate all related data
      await Promise.all([
        mutate((key) => typeof key === 'string' && key.startsWith('/api/invoices')),
        mutate('/api/dashboard/stats')
      ]);

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate invoice';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsPerforming(false);
    }
  };

  return {
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    duplicateInvoice,
    isPerforming
  };
}

// Hook for navigation actions
export function useInvoiceNavigation() {
  const router = useRouter();

  const navigateToInvoice = (id: string) => {
    router.push(`/invoices/${id}`);
  };

  const navigateToEditInvoice = (id: string) => {
    router.push(`/invoices/${id}/edit`);
  };

  const navigateToInvoicesList = () => {
    router.push('/invoices');
  };

  const navigateToNewInvoice = () => {
    router.push('/invoices/new');
  };

  return {
    navigateToInvoice,
    navigateToEditInvoice,
    navigateToInvoicesList,
    navigateToNewInvoice
  };
}