import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Define a simple Dashboard component
const Dashboard = () => {
  return (
    <div className="p-8 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-medium text-black">Dashboard</h2>
      <p className="mt-2 text-gray-500">Welcome to the admin dashboard.</p>
    </div>
  );
};

const AdminPage = () => {
  // Using React.useState instead of destructuring useState from React
  const [count, setCount] = React.useState(0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Admin Portal</div>
        <h1 className="mt-1 text-2xl font-medium text-black">LodgeTix Administration</h1>
      </div>
      
      <div className="mt-4 mb-8">
        <p className="text-gray-700">Count: {count}</p>
        <button
          onClick={() => setCount(count + 1)}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Increment
        </button>
      </div>
      
      {/* Routing for admin pages */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
};

export default AdminPage;