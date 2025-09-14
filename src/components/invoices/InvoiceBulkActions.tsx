'use client';

import React, { useState } from 'react';
import {
  MoreHorizontalIcon,
  CheckIcon,
  SendIcon,
  FileIcon,
  TrashIcon,
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
import { Badge } from '@/components/ui/badge';
import { useInvoiceBulkActions, BulkActionParams } from '@/hooks/useInvoiceList';

export interface InvoiceBulkActionsProps {
  selectedInvoices: string[];
  onClearSelection: () => void;
  disabled?: boolean;
}

interface ConfirmationState {
  action: BulkActionParams['action'] | null;
  title: string;
  description: string;
  confirmText: string;
  variant: 'default' | 'destructive';
}

const bulkActionConfig = {
  mark_paid: {
    label: 'Mark as Paid',
    icon: CheckIcon,
    confirmTitle: 'Mark Invoices as Paid',
    confirmDescription: 'Are you sure you want to mark the selected invoices as paid? This action cannot be undone.',
    confirmText: 'Mark as Paid',
    variant: 'default' as const
  },
  mark_sent: {
    label: 'Mark as Sent', 
    icon: SendIcon,
    confirmTitle: 'Mark Invoices as Sent',
    confirmDescription: 'Are you sure you want to mark the selected invoices as sent?',
    confirmText: 'Mark as Sent',
    variant: 'default' as const
  },
  mark_draft: {
    label: 'Mark as Draft',
    icon: FileIcon,
    confirmTitle: 'Mark Invoices as Draft',
    confirmDescription: 'Are you sure you want to mark the selected invoices as draft?',
    confirmText: 'Mark as Draft',
    variant: 'default' as const
  },
  delete: {
    label: 'Delete Invoices',
    icon: TrashIcon,
    confirmTitle: 'Delete Invoices',
    confirmDescription: 'Are you sure you want to delete the selected invoices? This action cannot be undone and all invoice data will be permanently removed.',
    confirmText: 'Delete Forever',
    variant: 'destructive' as const
  }
};

export function InvoiceBulkActions({
  selectedInvoices,
  onClearSelection,
  disabled = false
}: InvoiceBulkActionsProps) {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);
  const [isPerforming, setIsPerforming] = useState(false);
  
  const { performBulkAction } = useInvoiceBulkActions();

  const handleActionClick = (action: BulkActionParams['action']) => {
    const config = bulkActionConfig[action];
    setConfirmationState({
      action,
      title: config.confirmTitle,
      description: config.confirmDescription.replace(
        'the selected invoices', 
        `${selectedInvoices.length} invoice${selectedInvoices.length === 1 ? '' : 's'}`
      ),
      confirmText: config.confirmText,
      variant: config.variant
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmationState?.action) return;

    setIsPerforming(true);
    try {
      await performBulkAction({
        action: confirmationState.action,
        invoiceIds: selectedInvoices
      });
      onClearSelection();
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsPerforming(false);
      setConfirmationState(null);
    }
  };

  const handleCancelAction = () => {
    setConfirmationState(null);
  };

  if (selectedInvoices.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
          {selectedInvoices.length} selected
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={disabled || isPerforming}
              className="gap-2"
            >
              <MoreHorizontalIcon className="w-4 h-4" />
              Bulk Actions
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>
              Actions for {selectedInvoices.length} invoice{selectedInvoices.length === 1 ? '' : 's'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Status Change Actions */}
            <DropdownMenuItem 
              onClick={() => handleActionClick('mark_paid')}
              className="text-green-600 focus:text-green-600"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              {bulkActionConfig.mark_paid.label}
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => handleActionClick('mark_sent')}
              className="text-blue-600 focus:text-blue-600"
            >
              <SendIcon className="w-4 h-4 mr-2" />
              {bulkActionConfig.mark_sent.label}
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => handleActionClick('mark_draft')}
              className="text-gray-600 focus:text-gray-600"
            >
              <FileIcon className="w-4 h-4 mr-2" />
              {bulkActionConfig.mark_draft.label}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Destructive Actions */}
            <DropdownMenuItem 
              onClick={() => handleActionClick('delete')}
              className="text-red-600 focus:text-red-600"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              {bulkActionConfig.delete.label}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearSelection}
          disabled={disabled || isPerforming}
        >
          Clear Selection
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={!!confirmationState} 
        onOpenChange={(open) => !open && handleCancelAction()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmationState?.variant === 'destructive' && (
                <AlertTriangleIcon className="w-5 h-5 text-red-500" />
              )}
              {confirmationState?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationState?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={handleCancelAction}
              disabled={isPerforming}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isPerforming}
              className={
                confirmationState?.variant === 'destructive' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : ''
              }
            >
              {isPerforming ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                confirmationState?.confirmText
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}