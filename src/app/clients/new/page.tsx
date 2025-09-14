'use client';

import React from 'react';
import { ClientForm } from '@/components/clients/ClientForm';

export default function NewClientPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <ClientForm mode="create" />
    </div>
  );
}