import React, { ReactNode } from 'react';

interface AdminLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function AdminLayout({ title, description, children }: AdminLayoutProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-gray-700">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <div className="p-6 bg-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}