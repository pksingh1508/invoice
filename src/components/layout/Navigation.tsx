'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { 
  HomeIcon, 
  FileTextIcon, 
  UsersIcon, 
  SettingsIcon,
  BuildingIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Invoices',
    href: '/invoices',
    icon: FileTextIcon,
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: UsersIcon,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center px-4">
              <BuildingIcon className="w-6 h-6 text-blue-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">Invoice Generator</span>
            </Link>
            
            {/* Navigation Items */}
            <div className="flex space-x-8 ml-8">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || 
                                 (item.href !== '/dashboard' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors',
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* User Button */}
          <div className="flex items-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </nav>
  );
}
