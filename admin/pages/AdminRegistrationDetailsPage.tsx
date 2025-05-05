import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, FileText } from 'lucide-react';

const AdminRegistrationDetailsPage: React.FC = () => {
  const { registrationId } = useParams<{ registrationId: string }>();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          to="/admin/registrations"
          className="mr-4 p-2 rounded-md hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold">Registration Details</h1>
      </div>
      
      {/* Placeholder content */}
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <ClipboardList className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Registration #{registrationId}</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          This page will display the details of registration {registrationId}. View attendees, payment information, and manage the registration status.
        </p>
        <Link
          to="/admin/registrations"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <FileText className="-ml-1 mr-2 h-5 w-5" />
          Back to Registrations
        </Link>
      </div>
    </div>
  );
};

export default AdminRegistrationDetailsPage;