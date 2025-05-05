import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, FileText } from 'lucide-react';

const AdminCustomerDetailsPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          to="/admin/customers"
          className="mr-4 p-2 rounded-md hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold">Customer Details</h1>
      </div>
      
      {/* Placeholder content */}
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <User className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Customer #{customerId}</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          This page will display the details of customer {customerId}. View customer information, order history, and manage the customer account.
        </p>
        <Link
          to="/admin/customers"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <FileText className="-ml-1 mr-2 h-5 w-5" />
          Back to Customers
        </Link>
      </div>
    </div>
  );
};

export default AdminCustomerDetailsPage;