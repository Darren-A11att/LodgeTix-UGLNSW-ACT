import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  TicketIcon,
  UserGroupIcon,
  CreditCardIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import {
  ChartBarIcon,
  ChevronRightIcon
} from '@heroicons/react/20/solid';
import adminAPI from '../../lib/api/admin';

interface StatItem {
  name: string;
  stat: string | number;
  previousStat?: string | number;
  change?: string | number;
  changeType?: 'increase' | 'decrease';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  href: string;
}

const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<StatItem[]>([]);
  const [recentRegistrations, setRecentRegistrations] = React.useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<any[]>([]);
  
  // Fetch dashboard data
  React.useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Initialize default values for stats
        let registrationStats = { total: 0, completed: 0, pending: 0, cancelled: 0, totalRevenue: 0 };
        let customerStats = { totalCustomers: 0, newCustomersLast30Days: 0, avgRegistrationsPerCustomer: 0, avgSpendPerCustomer: 0 };
        let upcomingEventsList: any[] = [];
        let recentRegistrationsList: any[] = [];
        let eventCount = 0;
        
        // Fetch registration stats (with error handling)
        try {
          const registrationStatsResponse = await adminAPI.registrations.getRegistrationStats();
          if (!registrationStatsResponse.error && registrationStatsResponse.data) {
            registrationStats = registrationStatsResponse.data;
          }
        } catch (error) {
          console.error('Failed to fetch registration stats:', error);
          // Continue with default values
        }
        
        // Fetch customer stats (with error handling)
        try {
          const customerStatsResponse = await adminAPI.customers.getCustomerStats();
          if (!customerStatsResponse.error && customerStatsResponse.data) {
            customerStats = customerStatsResponse.data;
          }
        } catch (error) {
          console.error('Failed to fetch customer stats:', error);
          // Continue with default values
        }
        
        // Fetch events (with error handling)
        try {
          const eventsResponse = await adminAPI.events.getEvents({
            pagination: { page: 1, limit: 5 },
            sort: { column: 'eventStart', ascending: true },
            filters: {
              eventStart: { gte: new Date().toISOString() }
            }
          });
          
          if (!eventsResponse.error) {
            upcomingEventsList = eventsResponse.data || [];
            eventCount = eventsResponse.count || 0;
          }
        } catch (error) {
          console.error('Failed to fetch upcoming events:', error);
          // Continue with default values
        }
        
        // Fetch recent registrations (with error handling)
        try {
          const registrationsResponse = await adminAPI.registrations.getRegistrations({
            pagination: { page: 1, limit: 5 },
            sort: { column: 'createdAt', ascending: false }
          });
          
          if (!registrationsResponse.error) {
            recentRegistrationsList = registrationsResponse.data || [];
          }
        } catch (error) {
          console.error('Failed to fetch recent registrations:', error);
          // Continue with default values
        }
        
        // Set state with whatever data we were able to fetch
        setUpcomingEvents(upcomingEventsList);
        setRecentRegistrations(recentRegistrationsList);
        
        // Build stats array with available data
        const newStats: StatItem[] = [
          {
            name: 'Total Revenue',
            stat: `$${registrationStats.totalRevenue.toFixed(2)}`,
            icon: CreditCardIcon,
            color: 'bg-green-500',
            href: '/admin-portal/registrations'
          },
          {
            name: 'Registrations',
            stat: registrationStats.total,
            icon: TicketIcon,
            color: 'bg-indigo-500',
            href: '/admin-portal/registrations'
          },
          {
            name: 'Customers',
            stat: customerStats.totalCustomers,
            previousStat: customerStats.totalCustomers - customerStats.newCustomersLast30Days,
            change: customerStats.newCustomersLast30Days,
            changeType: 'increase',
            icon: UserGroupIcon,
            color: 'bg-blue-500',
            href: '/admin-portal/customers'
          },
          {
            name: 'Event Count',
            stat: eventCount,
            icon: CalendarIcon,
            color: 'bg-purple-500',
            href: '/admin-portal/events'
          }
        ];
        
        setStats(newStats);
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(`An unexpected error occurred loading the dashboard. Some features may not display correctly.`);
        // Still set loading to false to show partial results
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats cards */}
        <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
                  </div>
                </div>
              ))
            : stats.map((item) => (
                <div
                  key={item.name}
                  className="relative bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="absolute h-full w-1.5 left-0 top-0" style={{ backgroundColor: item.color.replace('bg-', 'var(--') + ')' }}></div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md p-3" style={{ backgroundColor: item.color.replace('bg-', 'var(--') + '/20)' }}>
                        <item.icon className="h-6 w-6" style={{ color: item.color.replace('bg-', 'var(--') + ')' }} aria-hidden="true" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {item.name}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {item.stat}
                          </div>
                          
                          {item.change !== undefined && (
                            <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                              item.changeType === 'increase' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {item.changeType === 'increase' ? '+' : '-'}
                              {item.change}
                              <span className="ml-1 text-gray-500">
                                (30d)
                              </span>
                            </div>
                          )}
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link
                        to={item.href}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View all
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
        </div>
        
        {/* Recent activity and upcoming events */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Upcoming events */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Events</h3>
              <Link
                to="/admin-portal/events/new"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-0.5 mr-1 h-4 w-4" />
                New
              </Link>
            </div>
            <ul className="divide-y divide-gray-200">
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <li key={index} className="animate-pulse px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </li>
                  ))
                : upcomingEvents.length > 0
                  ? upcomingEvents.map((event) => (
                      <li key={event.id} className="px-4 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <CalendarIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{event.title}</p>
                              <p className="text-sm text-gray-500">
                                {formatDate(event.eventStart)} {event.location ? `at ${event.location}` : ''}
                              </p>
                            </div>
                          </div>
                          <div>
                            <Link
                              to={`/admin-portal/events/${event.id}/view`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))
                  : (
                      <li className="px-4 py-4 text-center text-gray-500">
                        No upcoming events
                      </li>
                    )}
            </ul>
            <div className="border-t border-gray-200 px-4 py-4">
              <Link
                to="/admin-portal/events"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all events
              </Link>
            </div>
          </div>
          
          {/* Recent registrations */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Registrations</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <li key={index} className="animate-pulse px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </li>
                  ))
                : recentRegistrations.length > 0
                  ? recentRegistrations.map((registration) => (
                      <li key={registration.id} className="px-4 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <TicketIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                Registration #{registration.registrationId?.substring(0, 8) || registration.id.substring(0, 8)}
                              </p>
                              <div className="flex text-sm text-gray-500">
                                <p>{formatDate(registration.createdAt)}</p>
                                <p className="ml-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    registration.status === 'completed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : registration.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {registration.status}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <Link
                              to={`/admin-portal/registrations/${registration.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))
                  : (
                      <li className="px-4 py-4 text-center text-gray-500">
                        No recent registrations
                      </li>
                    )}
            </ul>
            <div className="border-t border-gray-200 px-4 py-4">
              <Link
                to="/admin-portal/registrations"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all registrations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;