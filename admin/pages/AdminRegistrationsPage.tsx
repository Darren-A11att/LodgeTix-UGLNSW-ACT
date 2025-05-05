import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Edit,
  ExternalLink,
  AlertTriangle,
  Download,
  CalendarDays,
  FileText,
  Users,
  DollarSign
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Registration list item type
interface AdminRegistrationListItem {
  id: string;
  registrationNumber: string;
  eventName: string;
  customerName: string;
  email: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'canceled';
  totalAmount: number;
  attendeeCount: number;
}

// Table component for registrations
const RegistrationsTable: React.FC<{
  registrations: AdminRegistrationListItem[];
  onView: (registrationId: string) => void;
}> = ({ registrations, onView }) => {
  if (registrations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Registrations will appear here when users register for events.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Registration
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {registrations.map((registration) => (
            <tr key={registration.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">#{registration.registrationNumber}</div>
                    <div className="text-sm text-gray-500">{registration.attendeeCount} attendees</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {registration.eventName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {registration.customerName}
                </div>
                <div className="text-sm text-gray-500">
                  {registration.email}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(registration.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  registration.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : registration.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-red-100 text-red-800'
                }`}>
                  {registration.status === 'completed' ? 'Paid' : registration.status === 'pending' ? 'Pending' : 'Canceled'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatCurrency(registration.totalAmount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="relative inline-block text-left dropdown">
                  <button className="p-1 rounded-full hover:bg-gray-100 dropdown-button">
                    <MoreHorizontal className="h-5 w-5 text-gray-400" />
                  </button>
                  <div className="dropdown-content origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <Link
                        to={`/admin/registrations/${registration.id}`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="mr-3 h-4 w-4 text-gray-500" />
                        View Details
                      </Link>
                      <a
                        href="#"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={(e) => {
                          e.preventDefault();
                          onView(registration.id);
                        }}
                      >
                        <ExternalLink className="mr-3 h-4 w-4 text-gray-500" />
                        Send Receipt
                      </a>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Dropdown menu functionality (same as in events page)
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('.dropdown-button')) {
    // Toggle dropdown for the clicked button
    const dropdownContent = target.closest('.dropdown')?.querySelector('.dropdown-content');
    if (dropdownContent) {
      dropdownContent.classList.toggle('hidden');
    }
  } else {
    // Hide all dropdowns when clicking outside
    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
      dropdown.classList.add('hidden');
    });
  }
});

// Registration stats card component
interface RegistrationStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
}

const RegistrationStatCard: React.FC<RegistrationStatCardProps> = ({ title, value, icon, iconColor }) => (
  <div className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${iconColor}`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
      </div>
    </div>
  </div>
);

const AdminRegistrationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [registrations, setRegistrations] = useState<AdminRegistrationListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    totalRevenue: 0,
    pendingRegistrations: 0,
    totalAttendees: 0,
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [eventFilter, setEventFilter] = useState(searchParams.get('event') || '');
  
  // Mock events for filter dropdown
  const [events, setEvents] = useState<{id: string, title: string}[]>([]);

  // Load registrations and events for filters
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, title')
          .order('title', { ascending: true });
          
        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.error('Error fetching events for filter:', err);
      }
    };
    
    fetchEvents();
  }, []);
  
  // Load registrations with filters
  useEffect(() => {
    const fetchRegistrations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch registrations with their related data
        let query = supabase
          .from('registrations')
          .select(`
            id, 
            created_at, 
            customer_id,
            event_id,
            payment_status,
            payment_amount,
            events(title),
            customers(full_name, email),
            attendees(id)
          `, { count: 'exact' });
        
        // Apply search filter
        if (searchTerm) {
          query = query.or(`customers.full_name.ilike.%${searchTerm}%,customers.email.ilike.%${searchTerm}%`);
        }
        
        // Apply status filter
        if (statusFilter) {
          query = query.eq('payment_status', statusFilter);
        }
        
        // Apply event filter
        if (eventFilter) {
          query = query.eq('event_id', eventFilter);
        }
        
        // Apply pagination
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        
        query = query.order('created_at', { ascending: false }).range(from, to);
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        // Transform data to our interface format
        const transformedData = data?.map(reg => {
          const attendees = reg.attendees as any[];
          const customer = reg.customers as any;
          const event = reg.events as any;
          
          return {
            id: reg.id,
            registrationNumber: reg.id.substring(0, 8).toUpperCase(),
            eventName: event?.title || 'Unknown Event',
            customerName: customer?.full_name || 'Unknown Customer',
            email: customer?.email || 'No email provided',
            createdAt: reg.created_at,
            status: reg.payment_status as 'pending' | 'completed' | 'canceled',
            totalAmount: reg.payment_amount || 0,
            attendeeCount: attendees?.length || 0
          };
        }) || [];
        
        setRegistrations(transformedData);
        setTotalCount(count || 0);
        
        // Calculate stats
        const allRegs = await supabase
          .from('registrations')
          .select(`
            payment_status,
            payment_amount,
            attendees(id)
          `);
        
        if (allRegs.error) throw allRegs.error;
        
        const stats = {
          totalRegistrations: allRegs.data?.length || 0,
          totalRevenue: allRegs.data?.reduce((sum, reg) => 
            reg.payment_status === 'completed' ? sum + (reg.payment_amount || 0) : sum, 0) || 0,
          pendingRegistrations: allRegs.data?.filter(reg => reg.payment_status === 'pending').length || 0,
          totalAttendees: allRegs.data?.reduce((sum, reg) => {
            const attendees = reg.attendees as any[];
            return sum + (attendees?.length || 0);
          }, 0) || 0
        };
        
        setStats(stats);
      } catch (err) {
        console.error('Error fetching registrations:', err);
        setError('Failed to load registrations. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRegistrations();
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, eventFilter]);
  
  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter) params.set('status', statusFilter);
    if (eventFilter) params.set('event', eventFilter);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  }, [searchTerm, statusFilter, eventFilter, currentPage, setSearchParams]);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setCurrentPage(1);
  };
  
  // Handle filter reset
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setEventFilter('');
    setCurrentPage(1);
  };
  
  // Handle pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  // Handle view registration
  const handleViewRegistration = (registrationId: string) => {
    // In a real implementation, this might show a modal or navigate
    console.log(`Viewing registration: ${registrationId}`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Registrations</h1>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            // Export functionality would go here
            alert('Export functionality would be implemented here');
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Download className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Export
        </a>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RegistrationStatCard
          title="Total Registrations"
          value={stats.totalRegistrations}
          icon={<FileText className="h-5 w-5 text-blue-700" />}
          iconColor="bg-blue-100"
        />
        <RegistrationStatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign className="h-5 w-5 text-green-700" />}
          iconColor="bg-green-100"
        />
        <RegistrationStatCard
          title="Pending Registrations"
          value={stats.pendingRegistrations}
          icon={<CalendarDays className="h-5 w-5 text-yellow-700" />}
          iconColor="bg-yellow-100"
        />
        <RegistrationStatCard
          title="Total Attendees"
          value={stats.totalAttendees}
          icon={<Users className="h-5 w-5 text-purple-700" />}
          iconColor="bg-purple-100"
        />
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <div className="flex-1">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search by customer name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="sm:w-52">
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="completed">Paid</option>
                <option value="pending">Pending</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
            
            <div className="sm:w-64">
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
              >
                <option value="">All Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                Filter
              </button>
              
              {(searchTerm || statusFilter || eventFilter) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <X className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        /* Registrations table */
        <RegistrationsTable registrations={registrations} onView={handleViewRegistration} />
      )}
      
      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{' '}
                of <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 ring-1 ring-inset ring-gray-300 ${
                    currentPage === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Page numbers - simplified for brevity */}
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                  {currentPage} / {totalPages}
                </span>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 ring-1 ring-inset ring-gray-300 ${
                    currentPage === totalPages 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrationsPage;