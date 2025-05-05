import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, FileText } from 'lucide-react';

const AdminSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      {/* Placeholder content */}
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <Settings className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          This page will allow configuration of system-wide settings. Manage email templates, payment settings, and other configuration options.
        </p>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <FileText className="-ml-1 mr-2 h-5 w-5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default AdminSettingsPage;