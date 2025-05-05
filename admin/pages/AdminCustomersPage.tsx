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
  Mail,
  Phone,
  AlertTriangle,
  Download,
  Users,
  UserPlus,
  User,
  Heart,
  Calendar
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';

// Customer list item type
interface AdminCustomerListItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  registrationCount: number;
  totalSpent: number;
  createdAt: string;
  lastActive: string;
  customerType: 'mason' | 'guest' | 'lady_partner' | 'unknown';
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Table component for customers
const CustomersTable: React.FC<{
  customers: AdminCustomerListItem[];
}> = ({ customers }) => {
  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter to find what you're looking for.
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
              Customer
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact Info
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Registrations
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Spent
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Active
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                    <div className="text-sm text-gray-500">Member since {new Date(customer.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-1" />
                  {customer.email}
                </div>
                {customer.phone && (
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Phone className="h-4 w-4 text-gray-400 mr-1" />
                    {customer.phone}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  customer.customerType === 'mason' 
                    ? 'bg-blue-100 text-blue-800' 
                    : customer.customerType === 'guest' 
                      ? 'bg-green-100 text-green-800' 
                      : customer.customerType === 'lady_partner'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                  {customer.customerType === 'mason' 
                    ? 'Mason' 
                    : customer.customerType === 'guest' 
                      ? 'Guest' 
                      : customer.customerType === 'lady_partner'
                        ? 'Lady Partner'
                        : 'Unknown'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {customer.registrationCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatCurrency(customer.totalSpent)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(customer.lastActive).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="relative inline-block text-left dropdown">
                  <button className="p-1 rounded-full hover:bg-gray-100 dropdown-button">
                    <MoreHorizontal className="h-5 w-5 text-gray-400" />
                  </button>
                  <div className="dropdown-content origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <Link
                        to={`/admin/customers/${customer.id}`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="mr-3 h-4 w-4 text-gray-500" />
                        View Profile
                      </Link>
                      <a
                        href={`mailto:${customer.email}`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Mail className="mr-3 h-4 w-4 text-gray-500" />
                        Send Email
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

// Dropdown menu functionality (same as other pages)
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

// Customer stats card component
interface CustomerStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
}

const CustomerStatCard: React.FC<CustomerStatCardProps> = ({ title, value, icon, iconColor }) => (
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

const AdminCustomersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalCustomers: 0,
    masonCount: 0,
    guestCount: 0,
    ladyPartnerCount: 0,
    activeCustomers: 0,
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  
  // Load customers with filters
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch customers with their related data
        let query = supabase
          .from('customers')
          .select(`
            id, 
            full_name, 
            email, 
            phone_number,
            customer_type,
            created_at,
            last_active,
            registrations(id, payment_amount)
          `, { count: 'exact' });
        
        // Apply search filter
        if (searchTerm) {
          query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
        }
        
        // Apply type filter
        if (typeFilter) {
          query = query.eq('customer_type', typeFilter);
        }
        
        // Apply pagination
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        
        query = query.order('last_active', { ascending: false }).range(from, to);
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        // Transform data to our interface format
        const transformedData = data?.map(customer => {
          const registrations = customer.registrations as any[] || [];
          const totalSpent = registrations.reduce((sum, reg) => 
            sum + (reg.payment_amount || 0), 0);
          
          return {
            id: customer.id,
            fullName: customer.full_name || 'Unknown',
            email: customer.email || 'No email',
            phone: customer.phone_number || '',
            registrationCount: registrations.length,
            totalSpent: totalSpent,
            createdAt: customer.created_at,
            lastActive: customer.last_active || customer.created_at,
            customerType: (customer.customer_type as 'mason' | 'guest' | 'lady_partner') || 'unknown'
          };
        }) || [];
        
        setCustomers(transformedData);
        setTotalCount(count || 0);
        
        // Calculate stats from all customers
        const { data: allCustomers, error: statsError } = await supabase
          .from('customers')
          .select('id, customer_type, last_active');
        
        if (statsError) throw statsError;
        
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const stats = {
          totalCustomers: allCustomers?.length || 0,
          masonCount: allCustomers?.filter(c => c.customer_type === 'mason').length || 0,
          guestCount: allCustomers?.filter(c => c.customer_type === 'guest').length || 0,
          ladyPartnerCount: allCustomers?.filter(c => c.customer_type === 'lady_partner').length || 0,
          activeCustomers: allCustomers?.filter(c => 
            c.last_active && new Date(c.last_active) > oneMonthAgo
          ).length || 0,
        };
        
        setStats(stats);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomers();
  }, [currentPage, itemsPerPage, searchTerm, typeFilter]);
  
  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (typeFilter) params.set('type', typeFilter);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  }, [searchTerm, typeFilter, currentPage, setSearchParams]);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setCurrentPage(1);
  };
  
  // Handle filter reset
  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
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
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex space-x-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // Export functionality would go here
              alert('Export functionality would be implemented here');
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
            Export
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // Add customer functionality would go here
              alert('Add customer functionality would be implemented here');
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserPlus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Customer
          </a>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <CustomerStatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={<Users className="h-5 w-5 text-blue-700" />}
          iconColor="bg-blue-100"
        />
        <CustomerStatCard
          title="Masons"
          value={stats.masonCount}
          icon={<User className="h-5 w-5 text-indigo-700" />}
          iconColor="bg-indigo-100"
        />
        <CustomerStatCard
          title="Guests"
          value={stats.guestCount}
          icon={<User className="h-5 w-5 text-green-700" />}
          iconColor="bg-green-100"
        />
        <CustomerStatCard
          title="Lady Partners"
          value={stats.ladyPartnerCount}
          icon={<Heart className="h-5 w-5 text-pink-700" />}
          iconColor="bg-pink-100"
        />
        <CustomerStatCard
          title="Active This Month"
          value={stats.activeCustomers}
          icon={<Calendar className="h-5 w-5 text-purple-700" />}
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
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="sm:w-52">
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Customer Types</option>
                <option value="mason">Masons</option>
                <option value="guest">Guests</option>
                <option value="lady_partner">Lady Partners</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Filter className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                Filter
              </button>
              
              {(searchTerm || typeFilter) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        /* Customers table */
        <CustomersTable customers={customers} />
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

export default AdminCustomersPage;