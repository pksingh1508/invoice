'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ClientSearchProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function ClientSearch({ 
  value, 
  onChange, 
  placeholder = "Search clients by name or email...",
  className = ""
}: ClientSearchProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounced search
  const debouncedOnChange = useCallback(
    debounce((query: string) => {
      onChange(query);
    }, 300),
    [onChange]
  );

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {localValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
            aria-label="Clear search"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}