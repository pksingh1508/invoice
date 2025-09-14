'use client';

import React, { useState, useEffect } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface InvoiceSearchProps {
  value?: string;
  onChange: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function InvoiceSearch({
  value = '',
  onChange,
  placeholder = 'Search invoices, clients, or emails...',
  debounceMs = 300
}: InvoiceSearchProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, debounceMs]);

  // Update local state when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="pl-10 pr-10"
        />
        {localValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-auto w-auto p-1 hover:bg-gray-100 rounded-full"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}