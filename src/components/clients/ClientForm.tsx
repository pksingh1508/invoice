'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { UserIcon, MailIcon, MapPinIcon, SaveIcon, ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Client, CreateClient, UpdateClient } from '@/types/database';
import { toast } from 'sonner';

interface ClientFormData {
  name: string;
  email: string;
  address: string;
}

interface ClientFormProps {
  initialData?: Partial<Client>;
  clientId?: string;
  mode?: 'create' | 'edit';
  onSuccess?: (client: Client) => void;
}

export function ClientForm({
  initialData,
  clientId,
  mode = 'create',
  onSuccess
}: ClientFormProps) {
  const { user } = useUser();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<ClientFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    address: initialData?.address || ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        address: initialData.address || ''
      });
    }
  }, [initialData]);

  // Handle form field changes
  const handleChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name is required
    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    // Email validation (if provided)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      toast.error('You must be logged in to save a client');
      return;
    }

    try {
      setLoading(true);

      // Prepare data for submission
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        address: formData.address.trim() || null
      };

      let response;
      if (mode === 'edit' && clientId) {
        // Update existing client
        response = await fetch(`/api/clients/${clientId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        });
      } else {
        // Create new client
        response = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...submitData,
            user_id: user.id
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${mode} client`);
      }

      const result = await response.json();
      toast.success(result.message || `Client ${mode === 'create' ? 'created' : 'updated'} successfully`);

      if (onSuccess && result.data) {
        onSuccess(result.data);
      } else {
        // Navigate back to clients list
        router.push('/clients');
      }

    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error instanceof Error ? error.message : `Failed to ${mode} client`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (mode === 'edit' && clientId) {
      router.push(`/clients/${clientId}`);
    } else {
      router.push('/clients');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserIcon className="w-6 h-6" />
                {mode === 'create' ? 'Add New Client' : 'Edit Client'}
              </h1>
              <p className="text-gray-600 mt-1">
                {mode === 'create' 
                  ? 'Enter client information to add them to your contacts'
                  : 'Update client information and contact details'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Client Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter client's full name or company name"
                className={errors.name ? 'border-red-500' : ''}
                disabled={loading}
                required
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>

            <Separator />

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <MailIcon className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter client's email address (optional)"
                className={errors.email ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
              <p className="text-gray-500 text-sm">
                Used for sending invoices and communication
              </p>
            </div>

            <Separator />

            {/* Address Field */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4" />
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('address', e.target.value)}
                placeholder="Enter client's billing address (optional)"
                rows={3}
                className={errors.address ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.address && (
                <p className="text-red-500 text-sm">{errors.address}</p>
              )}
              <p className="text-gray-500 text-sm">
                Will be used as the default billing address on invoices
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none gap-2"
          >
            <SaveIcon className="w-4 h-4" />
            {loading 
              ? (mode === 'create' ? 'Creating...' : 'Updating...')
              : (mode === 'create' ? 'Create Client' : 'Update Client')
            }
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}