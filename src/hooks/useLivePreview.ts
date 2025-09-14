'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { InvoiceTemplateData, CompanyBranding, InvoiceFormData } from '@/types/templates';
import { UserProfile } from '@/types/database';
import { createTemplateDataFromInvoice } from '@/lib/pdf/branding';

export interface LivePreviewOptions {
  debounceMs?: number;
  enabled?: boolean;
  autoUpdateOnChange?: boolean;
}

export interface LivePreviewState {
  templateData: InvoiceTemplateData | null;
  isUpdating: boolean;
  lastUpdated: Date | null;
  updateCount: number;
}

export interface UseLivePreviewReturn {
  previewData: InvoiceTemplateData | null;
  isPreviewUpdating: boolean;
  lastPreviewUpdate: Date | null;
  previewUpdateCount: number;
  updatePreview: (formData: InvoiceFormData, userProfile?: UserProfile) => void;
  forceUpdate: () => void;
  resetPreview: () => void;
  setPreviewEnabled: (enabled: boolean) => void;
  isPreviewEnabled: boolean;
}

/**
 * Custom hook for live invoice preview functionality
 */
export function useLivePreview(
  initialFormData?: InvoiceFormData,
  userProfile?: UserProfile,
  options: LivePreviewOptions = {}
): UseLivePreviewReturn {
  const {
    debounceMs = 300,
    enabled = true,
    autoUpdateOnChange = true
  } = options;

  // Preview state
  const [previewState, setPreviewState] = useState<LivePreviewState>({
    templateData: null,
    isUpdating: false,
    lastUpdated: null,
    updateCount: 0
  });

  const [isEnabled, setIsEnabled] = useState(enabled);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Convert form data to template data
  const convertFormDataToTemplateData = useCallback((
    formData: InvoiceFormData,
    profile?: UserProfile
  ): InvoiceTemplateData => {
    // Create mock invoice data structure from form data
    const mockInvoiceData = {
      id: 'preview-' + Date.now(),
      user_id: profile?.id || 'preview-user',
      buyer_name: formData.buyer_name || '',
      buyer_email: formData.buyer_email || '',
      buyer_address: formData.buyer_address || '',
      currency: formData.currency || 'USD',
      account_no: formData.account_no || '',
      service_name: formData.service_name || 'Professional Services',
      unit_net_price: formData.unit_net_price || 0,
      vat_rate: formData.vat_rate || 0,
      vat_amount: (formData.unit_net_price || 0) * (formData.qty || 1) * ((formData.vat_rate || 0) / 100),
      total_gross_price: ((formData.unit_net_price || 0) * (formData.qty || 1)) + 
                        ((formData.unit_net_price || 0) * (formData.qty || 1) * ((formData.vat_rate || 0) / 100)),
      qty: formData.qty || 1,
      payment_link: formData.payment_link || '',
      issued_at: new Date().toISOString(),
      due_date: formData.due_date || '',
      status: formData.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: formData.notes || ''
    };

    // Use existing conversion function
    return createTemplateDataFromInvoice(mockInvoiceData, profile || getDefaultProfile(), null);
  }, []);

  // Debounced update function
  const debouncedUpdate = useCallback((
    formData: InvoiceFormData,
    profile?: UserProfile
  ) => {
    if (!isEnabled) return;

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    setPreviewState(prev => ({ ...prev, isUpdating: true }));

    const newTimer = setTimeout(() => {
      try {
        const templateData = convertFormDataToTemplateData(formData, profile);
        
        setPreviewState(prev => ({
          templateData,
          isUpdating: false,
          lastUpdated: new Date(),
          updateCount: prev.updateCount + 1
        }));
      } catch (error) {
        console.error('Preview update error:', error);
        setPreviewState(prev => ({ 
          ...prev, 
          isUpdating: false 
        }));
      }
    }, debounceMs);

    setDebounceTimer(newTimer);
  }, [isEnabled, debounceTimer, debounceMs, convertFormDataToTemplateData]);

  // Manual update function (immediate, no debounce)
  const updatePreview = useCallback((
    formData: InvoiceFormData,
    profile?: UserProfile
  ) => {
    if (!isEnabled) return;

    try {
      setPreviewState(prev => ({ ...prev, isUpdating: true }));
      
      const templateData = convertFormDataToTemplateData(formData, profile);
      
      setPreviewState({
        templateData,
        isUpdating: false,
        lastUpdated: new Date(),
        updateCount: previewState.updateCount + 1
      });
    } catch (error) {
      console.error('Manual preview update error:', error);
      setPreviewState(prev => ({ 
        ...prev, 
        isUpdating: false 
      }));
    }
  }, [isEnabled, convertFormDataToTemplateData, previewState.updateCount]);

  // Force update function
  const forceUpdate = useCallback(() => {
    setPreviewState(prev => ({
      ...prev,
      lastUpdated: new Date(),
      updateCount: prev.updateCount + 1
    }));
  }, []);

  // Reset preview function
  const resetPreview = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
    
    setPreviewState({
      templateData: null,
      isUpdating: false,
      lastUpdated: null,
      updateCount: 0
    });
  }, [debounceTimer]);

  // Set preview enabled state
  const setPreviewEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      resetPreview();
    }
  }, [resetPreview]);

  // Initialize with initial form data
  useEffect(() => {
    if (initialFormData && userProfile && isEnabled) {
      updatePreview(initialFormData, userProfile);
    }
  }, [initialFormData, userProfile, isEnabled]); // Only run on mount

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    previewData: previewState.templateData,
    isPreviewUpdating: previewState.isUpdating,
    lastPreviewUpdate: previewState.lastUpdated,
    previewUpdateCount: previewState.updateCount,
    updatePreview: autoUpdateOnChange ? debouncedUpdate : updatePreview,
    forceUpdate,
    resetPreview,
    setPreviewEnabled,
    isPreviewEnabled: isEnabled
  };
}

/**
 * Hook specifically for form field changes with immediate preview updates
 */
export function useFormFieldPreview(
  formData: InvoiceFormData,
  userProfile?: UserProfile,
  options: LivePreviewOptions = {}
) {
  const livePreview = useLivePreview(formData, userProfile, {
    ...options,
    autoUpdateOnChange: true,
    debounceMs: options.debounceMs || 150 // Faster for field changes
  });

  // Auto-update when form data changes
  useEffect(() => {
    if (livePreview.isPreviewEnabled && formData) {
      livePreview.updatePreview(formData, userProfile);
    }
  }, [formData, userProfile, livePreview]);

  return livePreview;
}

/**
 * Default profile for preview when user profile is not available
 */
function getDefaultProfile(): UserProfile {
  return {
    id: 'preview-user',
    business_name: 'Your Business Name',
    business_email: 'contact@yourbusiness.com',
    business_phone: '+1 (555) 123-4567',
    business_address: '123 Business Street\nCity, State 12345\nCountry',
    logo_url: undefined,
    default_currency: 'USD',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Hook for managing preview template switching
 */
export function usePreviewTemplateSwitch(initialTemplateId: string = 'classic-professional') {
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const switchTemplate = useCallback(async (templateId: string) => {
    if (templateId === selectedTemplateId) return;

    setIsTransitioning(true);
    
    // Add small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 150));
    
    setSelectedTemplateId(templateId);
    setIsTransitioning(false);
  }, [selectedTemplateId]);

  return {
    selectedTemplateId,
    isTransitioning,
    switchTemplate,
    setSelectedTemplateId
  };
}