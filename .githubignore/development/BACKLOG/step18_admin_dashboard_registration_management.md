# Step 18: Admin Dashboard - Registration Management

## Context for the Agentic AI Software Engineer

The LodgeTix system requires an administrative dashboard that allows event organizers to view and manage registrations. Currently, the system has no admin interface, and registration data can only be accessed directly through the database. Creating an admin dashboard will enable staff to efficiently manage event registrations, update statuses, and access attendee information.

Based on analysis of the codebase and database schema, the system needs:

1. A secure admin interface accessible only to authorized users
2. A registration management view to list, filter, and search registrations
3. Detailed views for individual registrations with attendee information
4. Functionality to update registration statuses and details
5. Export options for registration data

This dashboard will follow the design patterns used in the rest of the application and integrate with the Supabase database for data access and RLS (Row-Level Security) for proper access control.

## Objective

Build an administrative dashboard that enables registration management with the following capabilities:

1. View a list of all registrations with filtering and search functionality
2. Access detailed information for individual registrations
3. Update registration statuses and information
4. Generate reports and export registration data
5. Implement proper access control for admin users

## Pre-requisites

- Completed Steps 1-17, particularly the registration and payment flows
- Understanding of the database schema, especially the `registrations` and related tables
- Knowledge of React state management and Supabase authentication
- Familiarity with UI component patterns used in the application

## Analysis Steps

1. Examine the database schema to understand registration data structure:
   - `SELECT * FROM registrations LIMIT 5` to understand the main registration table
   - `SELECT * FROM attendee_links LIMIT 5` to understand how attendees are linked
   - `SELECT * FROM attendee_ticket_assignments LIMIT 5` to understand ticket assignments

2. Review existing pages and routing structure:
   - `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/pages/` to see current page components
   - Understand how to integrate new admin routes

3. Analyze authentication and authorization mechanisms:
   - Check for any existing admin role definitions in Supabase
   - Understand how to implement Row-Level Security for admin access

4. Review UI component patterns:
   - Analyze existing components for styling and interaction patterns
   - Identify reusable components for tables, filters, etc.

5. Understand current data fetching patterns:
   - Review how API functions are structured in the `src/lib/api` directory
   - Identify patterns for data loading, error handling, and state management

## Implementation Steps

1. Create admin dashboard layout and routing in a new directory `/src/pages/admin/`:

   ```typescript
   // /src/pages/admin/AdminLayout.tsx
   import React from 'react';
   import { Outlet, Navigate, useLocation } from 'react-router-dom';
   import { useAuth } from '../../context/AuthContext';
   
   const AdminLayout: React.FC = () => {
     const { user, isAdmin } = useAuth();
     const location = useLocation();
     
     // Redirect non-admin users
     if (!user || !isAdmin) {
       return <Navigate to="/login" state={{ from: location }} replace />;
     }
     
     return (
       <div className="flex h-screen bg-slate-50">
         {/* Admin Sidebar */}
         <div className="w-64 bg-primary text-white p-4">
           <h1 className="text-xl font-bold mb-6">LodgeTix Admin</h1>
           <nav className="space-y-2">
             <a href="/admin" className="block px-4 py-2 rounded hover:bg-primary-dark">Dashboard</a>
             <a href="/admin/registrations" className="block px-4 py-2 rounded hover:bg-primary-dark">Registrations</a>
             <a href="/admin/events" className="block px-4 py-2 rounded hover:bg-primary-dark">Events</a>
             <a href="/admin/users" className="block px-4 py-2 rounded hover:bg-primary-dark">Users</a>
             <a href="/admin/reports" className="block px-4 py-2 rounded hover:bg-primary-dark">Reports</a>
           </nav>
         </div>
         
         {/* Main Content */}
         <div className="flex-1 overflow-auto">
           <div className="p-6">
             <Outlet />
           </div>
         </div>
       </div>
     );
   };
   
   export default AdminLayout;
   ```

2. Create registration list page in `/src/pages/admin/RegistrationsPage.tsx`:

   ```typescript
   import React, { useState, useEffect } from 'react';
   import { Link } from 'react-router-dom';
   import { Search, Filter, DownloadIcon, Eye } from 'lucide-react';
   import { fetchRegistrations } from '../../lib/api/admin';
   
   interface Registration {
     id: string;
     created_at: string;
     total_price_paid: number;
     payment_status: string;
     registration_type: string;
     primary_attendee: {
       name: string;
       email: string;
     };
     attendee_count: number;
   }
   
   const RegistrationsPage: React.FC = () => {
     // State for registrations and filters
     const [registrations, setRegistrations] = useState<Registration[]>([]);
     const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     
     // Filter state
     const [searchTerm, setSearchTerm] = useState('');
     const [statusFilter, setStatusFilter] = useState('all');
     const [dateFilter, setDateFilter] = useState('all');
     
     // Load registrations
     useEffect(() => {
       const loadRegistrations = async () => {
         setIsLoading(true);
         try {
           const data = await fetchRegistrations();
           setRegistrations(data);
           setFilteredRegistrations(data);
           setError(null);
         } catch (err) {
           console.error('Error loading registrations:', err);
           setError('Failed to load registrations. Please try again.');
         } finally {
           setIsLoading(false);
         }
       };
       
       loadRegistrations();
     }, []);
     
     // Apply filters
     useEffect(() => {
       let filtered = [...registrations];
       
       // Apply search
       if (searchTerm) {
         const term = searchTerm.toLowerCase();
         filtered = filtered.filter(reg => 
           reg.id.toLowerCase().includes(term) ||
           reg.primary_attendee.name.toLowerCase().includes(term) ||
           reg.primary_attendee.email.toLowerCase().includes(term)
         );
       }
       
       // Apply status filter
       if (statusFilter !== 'all') {
         filtered = filtered.filter(reg => reg.payment_status === statusFilter);
       }
       
       // Apply date filter
       if (dateFilter !== 'all') {
         const now = new Date();
         const today = new Date(now.setHours(0, 0, 0, 0));
         const weekAgo = new Date(today);
         weekAgo.setDate(today.getDate() - 7);
         const monthAgo = new Date(today);
         monthAgo.setMonth(today.getMonth() - 1);
         
         filtered = filtered.filter(reg => {
           const regDate = new Date(reg.created_at);
           if (dateFilter === 'today') {
             return regDate >= today;
           } else if (dateFilter === 'week') {
             return regDate >= weekAgo;
           } else if (dateFilter === 'month') {
             return regDate >= monthAgo;
           }
           return true;
         });
       }
       
       setFilteredRegistrations(filtered);
     }, [registrations, searchTerm, statusFilter, dateFilter]);
     
     // Handle export
     const handleExport = () => {
       // Implementation for exporting registration data
       alert('Export functionality will be implemented');
     };
     
     return (
       <div>
         <div className="flex justify-between items-center mb-6">
           <h1 className="text-2xl font-bold">Registrations</h1>
           <button
             onClick={handleExport}
             className="btn-outline flex items-center"
           >
             <DownloadIcon className="w-4 h-4 mr-2" />
             Export
           </button>
         </div>
         
         {/* Filters */}
         <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
           <div className="flex flex-wrap gap-4">
             {/* Search */}
             <div className="flex-1 min-w-[200px]">
               <div className="relative">
                 <input
                   type="text"
                   placeholder="Search by ID, name, or email"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                 />
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
               </div>
             </div>
             
             {/* Status Filter */}
             <div className="w-[200px]">
               <select
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
               >
                 <option value="all">All Statuses</option>
                 <option value="completed">Completed</option>
                 <option value="pending">Pending</option>
                 <option value="failed">Failed</option>
               </select>
             </div>
             
             {/* Date Filter */}
             <div className="w-[200px]">
               <select
                 value={dateFilter}
                 onChange={(e) => setDateFilter(e.target.value)}
                 className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
               >
                 <option value="all">All Dates</option>
                 <option value="today">Today</option>
                 <option value="week">Past Week</option>
                 <option value="month">Past Month</option>
               </select>
             </div>
           </div>
         </div>
         
         {/* Registrations Table */}
         {isLoading ? (
           <div className="flex justify-center py-12">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
           </div>
         ) : error ? (
           <div className="bg-red-50 p-6 rounded-lg">
             <p className="text-red-700">{error}</p>
             <button
               onClick={() => window.location.reload()}
               className="mt-4 text-primary underline"
             >
               Try Again
             </button>
           </div>
         ) : (
           <div className="bg-white rounded-lg shadow-sm overflow-hidden">
             <table className="min-w-full divide-y divide-slate-200">
               <thead className="bg-slate-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                     ID
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                     Date
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                     Primary Attendee
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                     Count
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                     Type
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                     Amount
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                     Status
                   </th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                     Actions
                   </th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-slate-200">
                 {filteredRegistrations.length === 0 ? (
                   <tr>
                     <td colSpan={8} className="px-6 py-4 text-center text-slate-500">
                       No registrations found
                     </td>
                   </tr>
                 ) : (
                   filteredRegistrations.map((registration) => (
                     <tr key={registration.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                         {registration.id.substring(0, 8)}...
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                         {new Date(registration.created_at).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                         <div>{registration.primary_attendee.name}</div>
                         <div className="text-xs text-slate-500">{registration.primary_attendee.email}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                         {registration.attendee_count}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                         {registration.registration_type}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                         ${registration.total_price_paid?.toFixed(2) || '0.00'}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                           ${registration.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 
                             registration.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                             'bg-red-100 text-red-800'}`}
                         >
                           {registration.payment_status}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <Link 
                           to={`/admin/registrations/${registration.id}`}
                           className="text-primary hover:text-primary-dark"
                         >
                           <Eye className="h-5 w-5" />
                         </Link>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
         )}
       </div>
     );
   };
   
   export default RegistrationsPage;
   ```

3. Create detailed registration view in `/src/pages/admin/RegistrationDetailsPage.tsx`:

   ```typescript
   import React, { useState, useEffect } from 'react';
   import { useParams, Link } from 'react-router-dom';
   import { ArrowLeft, Download, Edit, CheckCircle, XCircle } from 'lucide-react';
   import { fetchRegistrationDetails, updateRegistrationStatus } from '../../lib/api/admin';
   
   const RegistrationDetailsPage: React.FC = () => {
     const { id } = useParams<{ id: string }>();
     const [registration, setRegistration] = useState<any>(null);
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     const [isUpdating, setIsUpdating] = useState(false);
     const [showStatusModal, setShowStatusModal] = useState(false);
     const [newStatus, setNewStatus] = useState('');
     
     // Load registration details
     useEffect(() => {
       const loadRegistrationDetails = async () => {
         if (!id) return;
         
         setIsLoading(true);
         try {
           const data = await fetchRegistrationDetails(id);
           setRegistration(data);
           setError(null);
         } catch (err) {
           console.error('Error loading registration details:', err);
           setError('Failed to load registration details');
         } finally {
           setIsLoading(false);
         }
       };
       
       loadRegistrationDetails();
     }, [id]);
     
     // Handle status update
     const handleUpdateStatus = async () => {
       if (!id || !newStatus) return;
       
       setIsUpdating(true);
       try {
         await updateRegistrationStatus(id, newStatus);
         
         // Update local state
         setRegistration((prev: any) => ({
           ...prev,
           registration: {
             ...prev.registration,
             payment_status: newStatus
           }
         }));
         
         setShowStatusModal(false);
         setError(null);
       } catch (err) {
         console.error('Error updating registration status:', err);
         setError('Failed to update registration status');
       } finally {
         setIsUpdating(false);
       }
     };
     
     // Handle download receipt
     const handleDownloadReceipt = () => {
       alert('Receipt download functionality will be implemented');
     };
     
     if (isLoading) {
       return (
         <div className="flex justify-center py-12">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
         </div>
       );
     }
     
     if (error || !registration) {
       return (
         <div className="bg-red-50 p-6 rounded-lg">
           <h2 className="text-lg font-bold text-red-700 mb-2">Error</h2>
           <p className="text-red-700">{error || 'Registration not found'}</p>
           <Link to="/admin/registrations" className="mt-4 text-primary underline block">
             Back to Registrations
           </Link>
         </div>
       );
     }
     
     // Get primary attendee
     const primaryAttendee = registration.attendeeLinks?.[0]?.masons || registration.attendeeLinks?.[0]?.guests;
     
     return (
       <div>
         {/* Header with back button */}
         <div className="flex justify-between items-center mb-6">
           <div className="flex items-center">
             <Link to="/admin/registrations" className="mr-4">
               <ArrowLeft className="h-5 w-5 text-slate-600" />
             </Link>
             <h1 className="text-2xl font-bold">Registration Details</h1>
           </div>
           <div className="flex space-x-2">
             <button
               onClick={handleDownloadReceipt}
               className="btn-outline flex items-center"
             >
               <Download className="w-4 h-4 mr-2" />
               Download Receipt
             </button>
             <button
               onClick={() => {
                 setNewStatus(registration.registration.payment_status);
                 setShowStatusModal(true);
               }}
               className="btn-primary flex items-center"
             >
               <Edit className="w-4 h-4 mr-2" />
               Update Status
             </button>
           </div>
         </div>
         
         {/* Registration Overview */}
         <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
           <h2 className="text-lg font-bold mb-4">Registration Overview</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div>
               <p className="text-slate-500 text-sm">Registration ID</p>
               <p className="font-medium">{registration.registration.id}</p>
             </div>
             <div>
               <p className="text-slate-500 text-sm">Date</p>
               <p className="font-medium">{new Date(registration.registration.created_at).toLocaleString()}</p>
             </div>
             <div>
               <p className="text-slate-500 text-sm">Registration Type</p>
               <p className="font-medium">{registration.registration.registration_type}</p>
             </div>
             <div>
               <p className="text-slate-500 text-sm">Payment Status</p>
               <p className="font-medium">
                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                   ${registration.registration.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 
                     registration.registration.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                     'bg-red-100 text-red-800'}`}
                 >
                   {registration.registration.payment_status}
                 </span>
               </p>
             </div>
             <div>
               <p className="text-slate-500 text-sm">Total Paid</p>
               <p className="font-medium">${registration.registration.total_price_paid?.toFixed(2) || '0.00'}</p>
             </div>
             <div>
               <p className="text-slate-500 text-sm">Payment ID</p>
               <p className="font-medium truncate">{registration.registration.stripe_payment_intent_id || 'N/A'}</p>
             </div>
           </div>
         </div>
         
         {/* Primary Attendee Information */}
         {primaryAttendee && (
           <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
             <h2 className="text-lg font-bold mb-4">Primary Attendee</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <div>
                 <p className="text-slate-500 text-sm">Name</p>
                 <p className="font-medium">{primaryAttendee.title} {primaryAttendee.first_name} {primaryAttendee.last_name}</p>
               </div>
               <div>
                 <p className="text-slate-500 text-sm">Email</p>
                 <p className="font-medium">{primaryAttendee.email}</p>
               </div>
               <div>
                 <p className="text-slate-500 text-sm">Phone</p>
                 <p className="font-medium">{primaryAttendee.phone}</p>
               </div>
               {primaryAttendee.lodge_id && (
                 <div>
                   <p className="text-slate-500 text-sm">Lodge</p>
                   <p className="font-medium">{primaryAttendee.lodges?.name || 'N/A'}</p>
                 </div>
               )}
               {primaryAttendee.rank && (
                 <div>
                   <p className="text-slate-500 text-sm">Rank</p>
                   <p className="font-medium">{primaryAttendee.rank}</p>
                 </div>
               )}
             </div>
           </div>
         )}
         
         {/* All Attendees */}
         <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
           <h2 className="text-lg font-bold mb-4">All Attendees</h2>
           
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-slate-200">
               <thead className="bg-slate-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ticket</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Special Needs</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-slate-200">
                 {registration.attendeeLinks.map((link: any, index: number) => {
                   const attendee = link.masons || link.guests;
                   const ticket = registration.ticketAssignments.find(
                     (t: any) => t.attendee_link_id === link.id
                   );
                   
                   return (
                     <tr key={link.id}>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="font-medium">{attendee.title} {attendee.first_name} {attendee.last_name}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                         {link.masons ? 'Mason' : 'Guest'}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm">
                         {ticket?.ticket_definitions?.name || 'No ticket'}
                         {ticket && (
                           <div className="text-xs text-slate-500">${ticket.price_at_assignment?.toFixed(2)}</div>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm">
                         <div>{attendee.email}</div>
                         <div className="text-xs text-slate-500">{attendee.phone}</div>
                       </td>
                       <td className="px-6 py-4 text-sm">
                         {attendee.dietary_requirements && (
                           <div>
                             <span className="font-medium">Dietary:</span> {attendee.dietary_requirements}
                           </div>
                         )}
                         {attendee.special_needs && (
                           <div>
                             <span className="font-medium">Special Needs:</span> {attendee.special_needs}
                           </div>
                         )}
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
         </div>
         
         {/* Status Update Modal */}
         {showStatusModal && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg p-6 max-w-md w-full">
               <h2 className="text-lg font-bold mb-4">Update Registration Status</h2>
               
               <div className="mb-4">
                 <label className="block text-sm font-medium text-slate-700 mb-1">
                   Status
                 </label>
                 <select
                   value={newStatus}
                   onChange={(e) => setNewStatus(e.target.value)}
                   className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                 >
                   <option value="pending">Pending</option>
                   <option value="completed">Completed</option>
                   <option value="failed">Failed</option>
                 </select>
               </div>
               
               <div className="flex justify-end space-x-2">
                 <button
                   onClick={() => setShowStatusModal(false)}
                   className="btn-outline"
                   disabled={isUpdating}
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleUpdateStatus}
                   className="btn-primary flex items-center"
                   disabled={isUpdating}
                 >
                   {isUpdating ? (
                     <>
                       <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                       Updating...
                     </>
                   ) : (
                     <>
                       <CheckCircle className="h-4 w-4 mr-2" />
                       Update
                     </>
                   )}
                 </button>
               </div>
             </div>
           </div>
         )}
       </div>
     );
   };
   
   export default RegistrationDetailsPage;
   ```

4. Create admin API functions in `/src/lib/api/admin.ts`:

   ```typescript
   import { supabase } from '../supabase';

   /**
    * Fetches all registrations with basic information
    * @returns Array of registrations with primary attendee info
    */
   export async function fetchRegistrations() {
     try {
       // Fetch all registrations
       const { data: registrations, error: registrationsError } = await supabase
         .from('registrations')
         .select(`
           id,
           registration_type,
           total_price_paid,
           payment_status,
           stripe_payment_intent_id,
           created_at,
           parent_event_id,
           customer_id
         `)
         .order('created_at', { ascending: false });
       
       if (registrationsError) {
         console.error('Error fetching registrations:', registrationsError);
         throw new Error('Failed to fetch registrations');
       }
       
       // Fetch attendee links for all registrations to get primary attendee and count
       const registrationIds = registrations.map(reg => reg.id);
       
       const { data: attendeeLinks, error: linksError } = await supabase
         .from('attendee_links')
         .select(`
           id,
           registration_id,
           mason_id,
           guest_id,
           masons(id, title, first_name, last_name, email),
           guests(id, title, first_name, last_name, email)
         `)
         .in('registration_id', registrationIds);
       
       if (linksError) {
         console.error('Error fetching attendee links:', linksError);
         throw new Error('Failed to fetch attendee details');
       }
       
       // Process and combine the data
       const processedRegistrations = registrations.map(registration => {
         // Get all attendee links for this registration
         const links = attendeeLinks.filter(link => link.registration_id === registration.id);
         
         // Find primary attendee (first mason or guest)
         const primaryLink = links[0];
         const primaryAttendee = primaryLink?.masons || primaryLink?.guests;
         
         return {
           ...registration,
           attendee_count: links.length,
           primary_attendee: primaryAttendee ? {
             name: `${primaryAttendee.title} ${primaryAttendee.first_name} ${primaryAttendee.last_name}`,
             email: primaryAttendee.email
           } : {
             name: 'Unknown',
             email: 'Unknown'
           }
         };
       });
       
       return processedRegistrations;
     } catch (err) {
       console.error('Unexpected error fetching registrations:', err);
       throw err;
     }
   }

   /**
    * Fetches detailed information for a single registration
    * @param registrationId Registration ID to fetch
    * @returns Detailed registration data with attendees and tickets
    */
   export async function fetchRegistrationDetails(registrationId: string) {
     try {
       // Fetch the basic registration record
       const { data: registration, error: registrationError } = await supabase
         .from('registrations')
         .select(`
           id,
           registration_type,
           total_price_paid,
           payment_status,
           agree_to_terms,
           stripe_payment_intent_id,
           created_at,
           parent_event_id,
           customer_id
         `)
         .eq('id', registrationId)
         .single();
       
       if (registrationError) {
         console.error('Error fetching registration:', registrationError);
         throw new Error('Registration not found');
       }
       
       // Fetch related attendee ticket assignments
       const { data: ticketAssignments, error: ticketsError } = await supabase
         .from('attendee_ticket_assignments')
         .select(`
           id,
           attendee_link_id,
           ticket_definition_id,
           price_at_assignment,
           ticket_definitions(id, name, description, price)
         `)
         .eq('registration_id', registrationId);
       
       if (ticketsError) {
         console.error('Error fetching ticket assignments:', ticketsError);
         throw new Error('Failed to fetch ticket details');
       }
       
       // Fetch related attendee links
       const { data: attendeeLinks, error: attendeeLinksError } = await supabase
         .from('attendee_links')
         .select(`
           id,
           registration_id,
           mason_id,
           guest_id,
           masons(id, title, first_name, last_name, phone, email, rank, lodge_id, dietary_requirements, special_needs, lodges(name, number)),
           guests(id, title, first_name, last_name, phone, email, dietary_requirements, special_needs)
         `)
         .eq('registration_id', registrationId);
       
       if (attendeeLinksError) {
         console.error('Error fetching attendee links:', attendeeLinksError);
         throw new Error('Failed to fetch attendee details');
       }
       
       // Return combined data
       return {
         registration,
         ticketAssignments: ticketAssignments || [],
         attendeeLinks: attendeeLinks || []
       };
     } catch (err) {
       console.error('Unexpected error fetching registration details:', err);
       throw err;
     }
   }

   /**
    * Updates the status of a registration
    * @param registrationId Registration ID to update
    * @param status New status value
    * @returns Success indicator
    */
   export async function updateRegistrationStatus(registrationId: string, status: string) {
     try {
       const { error } = await supabase
         .from('registrations')
         .update({ payment_status: status })
         .eq('id', registrationId);
       
       if (error) {
         console.error('Error updating registration status:', error);
         throw new Error('Failed to update registration status');
       }
       
       return true;
     } catch (err) {
       console.error('Unexpected error updating registration status:', err);
       throw err;
     }
   }

   /**
    * Exports registration data to CSV
    * @param filters Optional filters to apply
    * @returns CSV data as string
    */
   export async function exportRegistrationsCSV(filters = {}) {
     try {
       // Implementation for exporting to CSV
       // This would fetch registrations with optional filters
       // and format them as CSV
       
       // For now, we'll return a placeholder implementation
       return 'Registration data in CSV format';
     } catch (err) {
       console.error('Error exporting registrations:', err);
       throw new Error('Failed to export registrations');
     }
   }
   ```

5. Add admin routes to the main router in `/src/App.tsx`:

   ```typescript
   // Add these imports
   import AdminLayout from './pages/admin/AdminLayout';
   import AdminDashboard from './pages/admin/AdminDashboard';
   import RegistrationsPage from './pages/admin/RegistrationsPage';
   import RegistrationDetailsPage from './pages/admin/RegistrationDetailsPage';
   
   // Add these routes inside your Router component
   <Route path="/admin" element={<AdminLayout />}>
     <Route index element={<AdminDashboard />} />
     <Route path="registrations" element={<RegistrationsPage />} />
     <Route path="registrations/:id" element={<RegistrationDetailsPage />} />
   </Route>
   ```

6. Implement Row-Level Security (RLS) in Supabase for admin access:

   ```sql
   -- Create an is_admin() function to check if a user has admin role
   CREATE OR REPLACE FUNCTION public.is_admin()
   RETURNS BOOLEAN AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1
       FROM auth.users
       WHERE auth.uid() = id
       AND raw_user_meta_data->>'role' = 'admin'
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Apply RLS to registrations table
   ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

   -- Policy for admins to see all registrations
   CREATE POLICY "Admins can see all registrations" 
     ON public.registrations
     FOR SELECT 
     USING (is_admin());

   -- Policy for admins to update registrations
   CREATE POLICY "Admins can update registrations" 
     ON public.registrations
     FOR UPDATE 
     USING (is_admin());

   -- Apply similar policies to other relevant tables (attendee_links, attendee_ticket_assignments, etc.)
   ```

7. Create a simple admin dashboard in `/src/pages/admin/AdminDashboard.tsx`:

   ```typescript
   import React, { useState, useEffect } from 'react';
   import { Link } from 'react-router-dom';
   import { Users, Calendar, CreditCard, ChevronRight } from 'lucide-react';
   import { fetchDashboardStats } from '../../lib/api/admin';

   const AdminDashboard: React.FC = () => {
     const [stats, setStats] = useState({
       totalRegistrations: 0,
       pendingRegistrations: 0,
       completedRegistrations: 0,
       totalRevenue: 0,
       totalAttendees: 0
     });
     const [isLoading, setIsLoading] = useState(true);
     
     useEffect(() => {
       const loadDashboardStats = async () => {
         setIsLoading(true);
         try {
           // In a real implementation, this would fetch actual stats
           // For now, we'll use placeholder data
           setStats({
             totalRegistrations: 128,
             pendingRegistrations: 12,
             completedRegistrations: 116,
             totalRevenue: 45600,
             totalAttendees: 243
           });
         } catch (err) {
           console.error('Error loading dashboard stats:', err);
         } finally {
           setIsLoading(false);
         }
       };
       
       loadDashboardStats();
     }, []);
     
     // Stat cards to display
     const statCards = [
       {
         title: 'Total Registrations',
         value: stats.totalRegistrations,
         icon: <Users className="h-8 w-8 text-primary" />,
         link: '/admin/registrations'
       },
       {
         title: 'Pending Registrations',
         value: stats.pendingRegistrations,
         icon: <Calendar className="h-8 w-8 text-yellow-500" />,
         link: '/admin/registrations?status=pending'
       },
       {
         title: 'Completed Registrations',
         value: stats.completedRegistrations,
         icon: <CreditCard className="h-8 w-8 text-green-500" />,
         link: '/admin/registrations?status=completed'
       },
       {
         title: 'Total Revenue',
         value: `$${stats.totalRevenue.toLocaleString()}`,
         icon: <CreditCard className="h-8 w-8 text-blue-500" />,
         link: '/admin/reports'
       },
       {
         title: 'Total Attendees',
         value: stats.totalAttendees,
         icon: <Users className="h-8 w-8 text-indigo-500" />,
         link: '/admin/registrations'
       }
     ];
     
     return (
       <div>
         <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
         
         {isLoading ? (
           <div className="flex justify-center py-12">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
             {statCards.map((card, index) => (
               <Link
                 key={index}
                 to={card.link}
                 className="bg-white p-6 rounded-lg shadow-sm hover:shadow transition-shadow"
               >
                 <div className="flex justify-between">
                   <div>
                     <p className="text-slate-500 mb-1">{card.title}</p>
                     <p className="text-2xl font-bold">{card.value}</p>
                   </div>
                   <div className="flex flex-col justify-between items-end">
                     {card.icon}
                     <ChevronRight className="h-5 w-5 text-slate-400" />
                   </div>
                 </div>
               </Link>
             ))}
           </div>
         )}
         
         {/* Recent Activity Section */}
         <div className="bg-white p-6 rounded-lg shadow-sm">
           <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
           <p className="text-slate-500 italic">
             Recent activity will be displayed here in a future update.
           </p>
         </div>
       </div>
     );
   };
   
   export default AdminDashboard;
   ```

## Testing Steps

1. Test admin authentication and authorization:
   - Verify that only admin users can access the dashboard
   - Check that regular users are redirected to login page
   - Test Row-Level Security using different user roles

2. Test registration listing functionality:
   - Check that all registrations are displayed correctly
   - Verify search functionality works with different terms
   - Test status and date filters

3. Test registration detail view:
   - Verify all registration details are displayed correctly
   - Check that attendee information is accurate
   - Test ticket assignment details display

4. Test status update functionality:
   - Verify status changes are saved to the database
   - Check that the UI updates correctly after status changes
   - Test error handling for failed updates

5. Test export functionality:
   - Verify CSV export includes all required data
   - Check that filters are applied to exports
   - Test error handling for export failures

## Verification Checklist

- [ ] Admin dashboard displays accurate statistics
- [ ] Registration list shows all registrations with correct filtering
- [ ] Registration details page displays complete information
- [ ] Status updates work correctly and persist to the database
- [ ] Export functionality produces valid CSV or Excel files
- [ ] Access controls prevent unauthorized users from accessing admin features
- [ ] UI is responsive and works on both desktop and mobile devices
- [ ] Error handling is implemented for all API calls
- [ ] Loading states are shown during data fetching
- [ ] Navigation between different admin pages works correctly

## Common Errors and Solutions

1. Authentication/authorization issues
   - Verify Supabase RLS policies are correctly implemented
   - Check that user roles are being properly assigned
   - Ensure that auth context is correctly integrated with admin routes

2. Missing or incorrect registration data
   - Check database queries for proper joins and selections
   - Verify that data transformations maintain required fields
   - Implement fallbacks for missing data in the UI

3. Status update failures
   - Check for database permission issues
   - Verify the API endpoint is correctly implemented
   - Implement proper error handling in the UI

4. Export functionality problems
   - Ensure proper CSV formatting with headers
   - Check for large data handling with pagination
   - Verify file downloads work correctly in different browsers

5. Performance issues with large datasets
   - Implement pagination for registration listing
   - Use optimized queries to fetch only required data
   - Consider caching strategies for frequently accessed data
