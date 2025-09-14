'use client';

import React, { useState } from 'react';
import { TrashIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClientActions } from '@/hooks/useClientList';
import { mutate } from 'swr';
import { toast } from 'sonner';

interface ClientBulkActionsProps {
  selectedClients: string[];
  onClearSelection: () => void;
  disabled?: boolean;
}

export function ClientBulkActions({
  selectedClients,
  onClearSelection,
  disabled = false
}: ClientBulkActionsProps) {
  const { bulkDeleteClients, isPerforming } = useClientActions();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedCount = selectedClients.length;

  const handleBulkDelete = async () => {
    if (selectedClients.length === 0) return;

    try {
      await bulkDeleteClients(selectedClients);
      toast.success(`Successfully deleted ${selectedCount} client${selectedCount > 1 ? 's' : ''}`);
      
      // Refresh the clients list
      mutate((key) => typeof key === 'string' && key.startsWith('/api/clients'));
      
      // Clear selection
      onClearSelection();
      
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete clients');
    }
    
    setShowDeleteConfirm(false);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-blue-900">
          {selectedCount} client{selectedCount > 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        {!showDeleteConfirm ? (
          <>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={disabled || isPerforming}
              className="gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              Delete Selected
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              disabled={disabled || isPerforming}
              className="gap-2"
            >
              <XIcon className="w-4 h-4" />
              Clear Selection
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Delete {selectedCount} client{selectedCount > 1 ? 's' : ''}?
            </span>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isPerforming}
              className="gap-2"
            >
              {isPerforming ? 'Deleting...' : 'Confirm Delete'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isPerforming}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}