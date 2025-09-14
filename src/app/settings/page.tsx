'use client';

import React from 'react';
import { SettingsIcon, BuildingIcon } from 'lucide-react';
import { BusinessProfileSettings } from '@/components/settings/BusinessProfileSettings';

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Business Profile Settings */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <BuildingIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Business Profile</h2>
          </div>
          <BusinessProfileSettings />
        </div>
      </div>
    </div>
  );
}