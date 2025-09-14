'use client';

import React, { useState } from 'react';
import {
  MoreHorizontalIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  FileTextIcon,
  AlertTriangleIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useClientActions } from '@/hooks/useClientList';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Client } from '@/types/database';

export interface ClientActionsDropdownProps {
  client: Client;
  trigger?: React.ReactNode;
  align?: 'start' | 'center' | 'end';
}

export function ClientActionsDropdown({
  client,
  trigger,
  align = 'end'
}: ClientActionsDropdownProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { deleteClient, isPerforming } = useClientActions();
  const router = useRouter();

  const handleView = () => {
    router.push(`/clients/${client.id}`);
  };

  const handleEdit = () => {
    router.push(`/clients/${client.id}/edit`);
  };

  const handleViewInvoices = () => {
    router.push(`/clients/${client.id}/invoices`);
  };

  const handleDelete = async () => {
    try {
      await deleteClient(client.id);
      toast.success('Client deleted successfully');
      
      // Refresh the clients list
      mutate((key) => typeof key === 'string' && key.startsWith('/api/clients'));
      
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete client');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <MoreHorizontalIcon className="h-4 w-4" />
      <span className="sr-only">Open menu</span>
    </Button>
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger || defaultTrigger}
        </DropdownMenuTrigger>

        <DropdownMenuContent align={align} className="w-48">
          <DropdownMenuLabel>Client Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* View Actions */}
          <DropdownMenuItem onClick={handleView}>
            <EyeIcon className="w-4 h-4 mr-2" />
            View Details
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleEdit}>
            <EditIcon className="w-4 h-4 mr-2" />
            Edit Client
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Invoice Actions */}
          <DropdownMenuItem onClick={handleViewInvoices}>
            <FileTextIcon className="w-4 h-4 mr-2" />
            View Invoices
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Destructive Actions */}
          <DropdownMenuItem 
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 focus:text-red-600"
            disabled={isPerforming}
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete Client
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={showDeleteConfirm} 
        onOpenChange={setShowDeleteConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="w-5 h-5 text-red-500" />
              Delete Client
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{client.name}</strong>? 
              This action cannot be undone. All client data will be permanently removed, 
              but related invoices will remain in your system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isPerforming}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPerforming}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPerforming ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </div>
              ) : (
                'Delete Client'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}