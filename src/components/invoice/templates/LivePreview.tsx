'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  InvoiceTemplateData, 
  InvoiceTemplateConfig, 
  CompanyBranding, 
  AvailableTemplate 
} from '@/types/templates';
import { 
  AVAILABLE_TEMPLATES, 
  getTemplateById, 
  getDefaultTemplate 
} from '@/lib/pdf/templates';
import { useLivePreview, usePreviewTemplateSwitch } from '@/hooks/useLivePreview';
import InvoicePreview from './InvoicePreview';
import PrintPreview from './PrintPreview';
import TemplateSelector from './TemplateSelector';

export interface LivePreviewProps {
  formData: any; // InvoiceFormData
  userProfile?: any; // UserProfile
  branding?: CompanyBranding;
  className?: string;
  showControls?: boolean;
  enableTemplateSwitch?: boolean;
  enablePrintPreview?: boolean;
  defaultTemplateId?: string;
  onTemplateChange?: (templateId: string) => void;
}

export interface PreviewMode {
  type: 'live' | 'print' | 'template-selector';
  label: string;
  icon: string;
}

const PREVIEW_MODES: PreviewMode[] = [
  { type: 'live', label: 'Live Preview', icon: '👁️' },
  { type: 'print', label: 'Print Preview', icon: '🖨️' },
  { type: 'template-selector', label: 'Template Gallery', icon: '🎨' }
];

export default function LivePreview({
  formData,
  userProfile,
  branding,
  className = '',
  showControls = true,
  enableTemplateSwitch = true,
  enablePrintPreview = true,
  defaultTemplateId,
  onTemplateChange
}: LivePreviewProps) {
  // Preview state
  const [previewMode, setPreviewMode] = useState<PreviewMode['type']>('live');
  const [previewScale, setPreviewScale] = useState(0.7);
  const [showPreviewSettings, setShowPreviewSettings] = useState(false);
  
  // Live preview hook
  const livePreview = useLivePreview(formData, userProfile, {
    debounceMs: 200,
    enabled: true,
    autoUpdateOnChange: true
  });
  
  // Template switching hook
  const templateSwitch = usePreviewTemplateSwitch(
    defaultTemplateId || getDefaultTemplate().id
  );
  
  // Get current template
  const currentTemplate = getTemplateById(templateSwitch.selectedTemplateId) || getDefaultTemplate();
  
  // Handle template change
  const handleTemplateChange = useCallback((template: AvailableTemplate) => {
    templateSwitch.switchTemplate(template.id);
    onTemplateChange?.(template.id);
  }, [templateSwitch, onTemplateChange]);
  
  // Handle scale changes
  const handleScaleChange = useCallback((delta: number) => {
    setPreviewScale(prev => Math.max(0.3, Math.min(1.5, prev + delta)));
  }, []);
  
  // Handle preview mode changes
  const handlePreviewModeChange = useCallback((mode: PreviewMode['type']) => {
    setPreviewMode(mode);
  }, []);
  
  // Update preview when form data changes
  useEffect(() => {
    if (livePreview.isPreviewEnabled && formData) {
      livePreview.updatePreview(formData, userProfile);
    }
  }, [formData, userProfile, livePreview]);
  
  return (
    <div className={`live-preview ${className}`}>
      {/* Preview Controls */}
      {showControls && (
        <PreviewControls
          currentMode={previewMode}
          onModeChange={handlePreviewModeChange}
          previewScale={previewScale}
          onScaleChange={handleScaleChange}
          currentTemplate={currentTemplate}
          enableTemplateSwitch={enableTemplateSwitch}
          enablePrintPreview={enablePrintPreview}
          isUpdating={livePreview.isPreviewUpdating || templateSwitch.isTransitioning}
          showSettings={showPreviewSettings}
          onToggleSettings={() => setShowPreviewSettings(!showPreviewSettings)}
        />
      )}
      
      {/* Preview Content */}
      <div className="preview-content">
        {previewMode === 'live' && (
          <LivePreviewContent
            templateData={livePreview.previewData}
            template={currentTemplate}
            branding={branding}
            scale={previewScale}
            isUpdating={livePreview.isPreviewUpdating}
            isTransitioning={templateSwitch.isTransitioning}
          />
        )}
        
        {previewMode === 'print' && enablePrintPreview && livePreview.previewData && (
          <PrintPreview
            data={livePreview.previewData}
            config={currentTemplate.config}
            branding={branding}
            showControls={true}
          />
        )}
        
        {previewMode === 'template-selector' && enableTemplateSwitch && livePreview.previewData && (
          <TemplateSelector
            selectedTemplateId={templateSwitch.selectedTemplateId}
            onTemplateSelect={handleTemplateChange}
            branding={branding}
            previewData={livePreview.previewData}
            className="template-selector-preview"
          />
        )}
      </div>
      
      {/* Preview Settings Panel */}
      {showPreviewSettings && (
        <PreviewSettingsPanel
          previewScale={previewScale}
          onScaleChange={setPreviewScale}
          livePreview={livePreview}
          onClose={() => setShowPreviewSettings(false)}
        />
      )}
    </div>
  );
}

// Preview Controls Component
interface PreviewControlsProps {
  currentMode: PreviewMode['type'];
  onModeChange: (mode: PreviewMode['type']) => void;
  previewScale: number;
  onScaleChange: (delta: number) => void;
  currentTemplate: AvailableTemplate;
  enableTemplateSwitch: boolean;
  enablePrintPreview: boolean;
  isUpdating: boolean;
  showSettings: boolean;
  onToggleSettings: () => void;
}

function PreviewControls({
  currentMode,
  onModeChange,
  previewScale,
  onScaleChange,
  currentTemplate,
  enableTemplateSwitch,
  enablePrintPreview,
  isUpdating,
  showSettings,
  onToggleSettings
}: PreviewControlsProps) {
  return (
    <div className="preview-controls bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Preview Mode Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {PREVIEW_MODES.map((mode) => {
              // Skip disabled modes
              if (mode.type === 'print' && !enablePrintPreview) return null;
              if (mode.type === 'template-selector' && !enableTemplateSwitch) return null;
              
              return (
                <button
                  key={mode.type}
                  onClick={() => onModeChange(mode.type)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentMode === mode.type
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-1">{mode.icon}</span>
                  {mode.label}
                </button>
              );
            })}
          </div>
          
          {/* Current Template Info */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Template:</span>
            <span className="font-medium text-gray-900">{currentTemplate.name}</span>
            {isUpdating && (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-blue-600">Updating...</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Scale Controls */}
          {currentMode === 'live' && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Zoom:</label>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onScaleChange(-0.1)}
                  className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  disabled={previewScale <= 0.3}
                >
                  −
                </button>
                <span className="text-sm font-mono w-12 text-center">
                  {Math.round(previewScale * 100)}%
                </span>
                <button
                  onClick={() => onScaleChange(0.1)}
                  className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  disabled={previewScale >= 1.5}
                >
                  +
                </button>
              </div>
            </div>
          )}
          
          {/* Settings Button */}
          <button
            onClick={onToggleSettings}
            className={`p-2 rounded-md transition-colors ${
              showSettings 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Live Preview Content Component
interface LivePreviewContentProps {
  templateData: InvoiceTemplateData | null;
  template: AvailableTemplate;
  branding?: CompanyBranding;
  scale: number;
  isUpdating: boolean;
  isTransitioning: boolean;
}

function LivePreviewContent({
  templateData,
  template,
  branding,
  scale,
  isUpdating,
  isTransitioning
}: LivePreviewContentProps) {
  if (!templateData) {
    return (
      <div className="preview-placeholder flex items-center justify-center h-96 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">Start filling the form to see the preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="live-preview-content">
      <div className="preview-container bg-gray-50 p-6 rounded-lg">
        <div 
          className={`preview-wrapper transition-opacity duration-200 ${
            isUpdating || isTransitioning ? 'opacity-50' : 'opacity-100'
          }`}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: `${100 / scale}%`
          }}
        >
          <InvoicePreview
            data={templateData}
            config={template.config}
            branding={branding}
            scale={1} // We handle scaling in the wrapper
            className="shadow-lg"
          />
        </div>
        
        {/* Update Indicator */}
        {isUpdating && (
          <div className="update-indicator absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Updating...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Preview Settings Panel Component
interface PreviewSettingsPanelProps {
  previewScale: number;
  onScaleChange: (scale: number) => void;
  livePreview: any; // UseLivePreviewReturn
  onClose: () => void;
}

function PreviewSettingsPanel({
  previewScale,
  onScaleChange,
  livePreview,
  onClose
}: PreviewSettingsPanelProps) {
  return (
    <div className="preview-settings-panel absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Preview Settings</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Scale Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview Scale: {Math.round(previewScale * 100)}%
          </label>
          <input
            type="range"
            min="0.3"
            max="1.5"
            step="0.05"
            value={previewScale}
            onChange={(e) => onScaleChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>30%</span>
            <span>150%</span>
          </div>
        </div>
        
        {/* Preview Stats */}
        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Updates:</span>
            <span className="font-mono">{livePreview.previewUpdateCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Update:</span>
            <span className="font-mono text-xs">
              {livePreview.lastPreviewUpdate?.toLocaleTimeString() || 'Never'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${
              livePreview.isPreviewUpdating ? 'text-blue-600' : 'text-green-600'
            }`}>
              {livePreview.isPreviewUpdating ? 'Updating...' : 'Ready'}
            </span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="border-t pt-4 space-y-2">
          <button
            onClick={livePreview.forceUpdate}
            className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Force Update
          </button>
          <button
            onClick={livePreview.resetPreview}
            className="w-full px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
          >
            Reset Preview
          </button>
        </div>
      </div>
    </div>
  );
}