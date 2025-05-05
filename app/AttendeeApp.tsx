import { FC } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const AttendeeApp: FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-700 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">LodgeTix Attendee Portal</h1>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      <footer className="bg-gray-100 p-4 border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="text-gray-600 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} LodgeTix. All rights reserved.
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Quick Links</h3>
              <ul className="text-sm space-y-1">
                <li>
                  <a href="/" className="text-primary-600 hover:text-primary-800">Main Website</a>
                </li>
                <li>
                  <a href={window.location.protocol + "//" + window.location.hostname.replace("app.", "")} className="text-primary-600 hover:text-primary-800">
                    Public Site
                  </a>
                </li>
                <li>
                  <a href={window.location.protocol + "//" + window.location.hostname.replace("app.", "admin.")} className="text-primary-600 hover:text-primary-800">
                    Admin Portal
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Placeholder components - these would be imported from actual files in a real implementation
const DashboardPage: FC = () => (
  <div className="p-4 bg-white rounded-lg shadow">
    <h2 className="text-xl font-bold mb-4">Your Dashboard</h2>
    <p>Welcome to your attendee dashboard. Here you can manage your event registrations and tickets.</p>
  </div>
);

const TicketsPage: FC = () => (
  <div className="p-4 bg-white rounded-lg shadow">
    <h2 className="text-xl font-bold mb-4">Your Tickets</h2>
    <p>View and manage your event tickets here.</p>
  </div>
);

const ProfilePage: FC = () => (
  <div className="p-4 bg-white rounded-lg shadow">
    <h2 className="text-xl font-bold mb-4">Your Profile</h2>
    <p>Update your personal information and preferences.</p>
  </div>
);

export default AttendeeApp; 