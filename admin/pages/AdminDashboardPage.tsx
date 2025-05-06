import React from 'react';
import AdminLayout from '../components/layout/AdminLayout';

export default function AdminDashboardPage() {
  return (
    <AdminLayout 
      title="Dashboard" 
      description="Overview of your system statistics and activities"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Events</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="text-3xl font-bold text-indigo-600">12</div>
            <p className="mt-1 text-sm text-gray-500">Active events</p>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Registrations</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="text-3xl font-bold text-indigo-600">245</div>
            <p className="mt-1 text-sm text-gray-500">Total registrations</p>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Revenue</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="text-3xl font-bold text-indigo-600">$24,500</div>
            <p className="mt-1 text-sm text-gray-500">Total revenue</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white shadow rounded-lg">
          <ul role="list" className="divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <li key={index} className="px-4 py-4 sm:px-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-medium">{index + 1}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {["New registration", "Payment received", "Event updated", "Customer updated", "Ticket canceled"][index]}
                    </p>
                    <p className="text-sm text-gray-500">
                      {["John Doe", "Jane Smith", "Admin User", "Sarah Johnson", "Mike Wilson"][index]}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-sm text-gray-500">
                      {`${index + 1} hour${index === 0 ? '' : 's'} ago`}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}