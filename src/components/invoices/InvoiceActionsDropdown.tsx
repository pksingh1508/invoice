'use client';

import React, { useState } from 'react';
import {
  MoreHorizontalIcon,
  EyeIcon,
  EditIcon,
  CopyIcon,
  TrashIcon,
  CheckIcon,
  SendIcon,
  FileIcon,
  MailIcon,
  DownloadIcon,
  PrinterIcon,
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
import { useInvoiceActions, useInvoiceNavigation } from '@/hooks/useInvoiceActions';

export interface InvoiceActionsDropdownProps {
  invoice: any;
  trigger?: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  onEmailSend?: (invoiceId: string) => void;
  onPdfDownload?: (invoiceId: string) => void;
}

interface ConfirmationState {
  action: 'delete' | 'mark_paid' | 'mark_sent' | 'mark_draft' | null;
  title: string;
  description: string;
  confirmText: string;
  variant: 'default' | 'destructive';
}

export function InvoiceActionsDropdown({
  invoice,
  trigger,
  align = 'end',
  onEmailSend,
  onPdfDownload
}: InvoiceActionsDropdownProps) {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);
  const { 
    deleteInvoice, 
    updateInvoiceStatus, 
    duplicateInvoice, 
    isPerforming 
  } = useInvoiceActions();
  const { 
    navigateToInvoice, 
    navigateToEditInvoice, 
    navigateToInvoicesList 
  } = useInvoiceNavigation();

  const handleActionClick = (action: ConfirmationState['action']) => {
    const config = {
      delete: {
        title: 'Delete Invoice',
        description: `Are you sure you want to delete this invoice? This action cannot be undone and all invoice data will be permanently removed.`,
        confirmText: 'Delete Forever',
        variant: 'destructive' as const
      },
      mark_paid: {
        title: 'Mark as Paid',
        description: 'Are you sure you want to mark this invoice as paid? This action cannot be undone.',
        confirmText: 'Mark as Paid',
        variant: 'default' as const
      },
      mark_sent: {
        title: 'Mark as Sent',
        description: 'Are you sure you want to mark this invoice as sent?',
        confirmText: 'Mark as Sent',
        variant: 'default' as const
      },
      mark_draft: {
        title: 'Mark as Draft',
        description: 'Are you sure you want to mark this invoice as draft?',
        confirmText: 'Mark as Draft',
        variant: 'default' as const
      }
    };

    if (action && config[action]) {
      setConfirmationState({
        action,
        ...config[action]
      });
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmationState?.action) return;

    try {
      switch (confirmationState.action) {
        case 'delete':
          await deleteInvoice(invoice.id);
          navigateToInvoicesList();
          break;
        case 'mark_paid':
        case 'mark_sent':
        case 'mark_draft':
          await updateInvoiceStatus(invoice.id, confirmationState.action);
          break;
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setConfirmationState(null);
    }
  };

  const handleDuplicate = async () => {
    try {
      const newInvoice = await duplicateInvoice(invoice.id);
      if (newInvoice) {
        navigateToEditInvoice(newInvoice.id);
      }
    } catch (error) {
      console.error('Duplicate failed:', error);
    }
  };

  const handleEmailSend = () => {
    if (onEmailSend) {
      onEmailSend(invoice.id);
    } else {
      // TODO: Implement default email functionality
      console.log('Email sending not implemented yet');
    }
  };

  const handlePdfDownload = () => {
    if (onPdfDownload) {
      onPdfDownload(invoice.id);
    } else {
      // TODO: Implement default PDF download
      console.log('PDF download not implemented yet');
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
          <DropdownMenuLabel>Invoice Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* View Actions */}
          <DropdownMenuItem onClick={() => navigateToInvoice(invoice.id)}>
            <EyeIcon className="w-4 h-4 mr-2" />
            View Invoice
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigateToEditInvoice(invoice.id)}>
            <EditIcon className="w-4 h-4 mr-2" />
            Edit Invoice
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Document Actions */}
          <DropdownMenuItem onClick={handlePdfDownload}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download PDF
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => window.print()}>
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleEmailSend}>
            <MailIcon className="w-4 h-4 mr-2" />
            Send via Email
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Copy Action */}
          <DropdownMenuItem onClick={handleDuplicate} disabled={isPerforming}>
            <CopyIcon className="w-4 h-4 mr-2" />
            Duplicate Invoice
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Status Actions */}
          {invoice.status !== 'paid' && (
            <DropdownMenuItem 
              onClick={() => handleActionClick('mark_paid')}
              className="text-green-600 focus:text-green-600"
              disabled={isPerforming}
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              Mark as Paid
            </DropdownMenuItem>
          )}

          {invoice.status !== 'sent' && (
            <DropdownMenuItem 
              onClick={() => handleActionClick('mark_sent')}
              className="text-blue-600 focus:text-blue-600"
              disabled={isPerforming}
            >
              <SendIcon className="w-4 h-4 mr-2" />
              Mark as Sent
            </DropdownMenuItem>
          )}

          {invoice.status !== 'draft' && (
            <DropdownMenuItem 
              onClick={() => handleActionClick('mark_draft')}
              className="text-gray-600 focus:text-gray-600"
              disabled={isPerforming}
            >
              <FileIcon className="w-4 h-4 mr-2" />
              Mark as Draft
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Destructive Actions */}
          <DropdownMenuItem 
            onClick={() => handleActionClick('delete')}
            className="text-red-600 focus:text-red-600"
            disabled={isPerforming}
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete Invoice
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={!!confirmationState} 
        onOpenChange={(open) => !open && setConfirmationState(null)}
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
              onClick={() => setConfirmationState(null)}
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