import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon,
  UsersIcon,
  TicketIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  EllipsisHorizontalIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../src/lib/supabase';

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Helper function to format percentages
const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

// Stat card component
interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon, iconColor }) => (
  <div className="bg-white shadow rounded-lg overflow-hidden">
    <div className="p-5">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-md p-3 ${iconColor}`}>
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd>
            <div className="text-lg font-medium text-gray-900">{value}</div>
          </dd>
        </div>
      </div>
    </div>
    {change && (
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span 
            className={`inline-flex items-center font-medium ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 
              'text-gray-500'
            }`}
          >
            {changeType === 'positive' && <ArrowUpIcon className="h-4 w-4 mr-1" />}
            {changeType === 'negative' && <ArrowDownIcon className="h-4 w-4 mr-1" />}
            {change}
          </span>
          <span className="text-gray-500 ml-1">from last month</span>
        </div>
      </div>
    )}
  </div>
);

// Quick stats item component
interface QuickStatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
}

const QuickStat: React.FC<QuickStatProps> = ({ title, value, icon, iconColor }) => (
  <div className="bg-white rounded-lg shadow p-5">
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

// Event list item component
interface EventListItemProps {
  id: string;
  title: string;
  date: string;
  registrations: number;
  capacity: number;
}

const EventListItem: React.FC<EventListItemProps> = ({ id, title, date, registrations, capacity }) => (
  <Link to={`/events/${id}`} className="block">
    <div className="border-b border-gray-200 py-4 hover:bg-gray-50 px-4 rounded-md -mx-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{date}</p>
        </div>
        <div className="flex items-center">
          <div className="mr-8">
            <span className="text-sm font-medium">{registrations}</span>
            <span className="text-xs text-gray-500 ml-1">/ {capacity}</span>
          </div>
          <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                registrations / capacity > 0.9 
                  ? 'bg-red-500' 
                  : registrations / capacity > 0.7 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, (registrations / capacity) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  </Link>
);

// Registration item component
interface RegistrationItemProps {
  id: string;
  customerName: string;
  eventName: string;
  date: string;
  status: 'pending' | 'completed' | 'canceled';
  amount: number;
}

const RegistrationItem: React.FC<RegistrationItemProps> = ({ 
  id, customerName, eventName, date, status, amount 
}) => (
  <Link to={`/registrations/${id}`} className="block">
    <div className="border-b border-gray-200 py-4 hover:bg-gray-50 px-4 rounded-md -mx-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{customerName}</h3>
          <p className="text-xs text-gray-500 mt-1">{eventName}</p>
          <p className="text-xs text-gray-500 mt-1">{date}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-sm font-medium px-2 py-1 rounded-full text-xs ${
            status === 'completed' 
              ? 'bg-green-100 text-green-800' 
              : status === 'pending' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
          }`}>
            {status === 'completed' ? 'Paid' : status === 'pending' ? 'Pending' : 'Canceled'}
          </span>
          <span className="text-sm font-medium mt-2">{formatCurrency(amount)}</span>
        </div>
      </div>
    </div>
  </Link>
);

const AdminDashboardPage: React.FC = () => {
  // Dashboard state
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    pendingRegistrations: 0,
    // Stats for trend display
    revenueChange: 4.75,
    registrationsChange: 12.5,
    attendeesChange: -1.39,
    eventsChange: 10.18
  });
  
  const [upcomingEvents, setUpcomingEvents] = useState<EventListItemProps[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<RegistrationItemProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch events data
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, event_start, title')
          .order('event_start', { ascending: true });
          
        if (eventsError) throw eventsError;
        
        const now = new Date();
        const activeEvents = eventsData?.filter(event => 
          new Date(event.event_start) > now
        ).length || 0;
        
        // Fetch registrations data
        const { data: registrationsData, error: registrationsError } = await supabase
          .from('registrations')
          .select('id, payment_status, payment_amount, created_at, customer_id, event_id')
          .order('created_at', { ascending: false });
          
        if (registrationsError) throw registrationsError;
        
        const totalRevenue = registrationsData
          ?.filter(reg => reg.payment_status === 'completed')
          .reduce((sum, reg) => sum + (reg.payment_amount || 0), 0) || 0;
          
        const pendingRegistrations = registrationsData
          ?.filter(reg => reg.payment_status === 'pending').length || 0;
          
        setStats({
          ...stats,
          totalEvents: eventsData?.length || 0,
          activeEvents,
          totalRegistrations: registrationsData?.length || 0,
          totalRevenue,
          pendingRegistrations
        });
        
        // Prepare upcoming events data
        if (eventsData) {
          const upcomingEventsData = eventsData
            .filter(event => new Date(event.event_start) > now)
            .slice(0, 5)
            .map(event => {
              // In a real app, you'd fetch real capacity and registrations data
              const mockCapacity = Math.floor(Math.random() * 100) + 50;
              const mockRegistrations = Math.floor(Math.random() * mockCapacity);
              
              return {
                id: event.id,
                title: event.title,
                date: new Date(event.event_start).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }),
                registrations: mockRegistrations,
                capacity: mockCapacity
              };
            });
          
          setUpcomingEvents(upcomingEventsData);
        }
        
        // Prepare recent registrations data
        if (registrationsData) {
          const recentRegs = registrationsData.slice(0, 5).map(reg => {
            // In a real app, you'd join with customers and events tables
            return {
              id: reg.id,
              customerName: `Customer ${reg.customer_id.substring(0, 5)}`,
              eventName: `Event ${reg.event_id.substring(0, 5)}`,
              date: new Date(reg.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }),
              status: reg.payment_status as 'pending' | 'completed' | 'canceled',
              amount: reg.payment_amount || 0
            };
          });
          
          setRecentRegistrations(recentRegs);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Link
            to="/events/new"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New Event
          </Link>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change={formatPercentage(stats.revenueChange)}
          changeType={stats.revenueChange >= 0 ? 'positive' : 'negative'}
          icon={<CurrencyDollarIcon className="h-6 w-6 text-white" />}
          iconColor="bg-indigo-500"
        />
        
        <StatCard
          title="Total Registrations"
          value={stats.totalRegistrations.toString()}
          change={formatPercentage(stats.registrationsChange)}
          changeType={stats.registrationsChange >= 0 ? 'positive' : 'negative'}
          icon={<TicketIcon className="h-6 w-6 text-white" />}
          iconColor="bg-purple-500"
        />
        
        <StatCard
          title="Active Events"
          value={stats.activeEvents.toString()}
          change={formatPercentage(stats.eventsChange)}
          changeType={stats.eventsChange >= 0 ? 'positive' : 'negative'}
          icon={<CalendarIcon className="h-6 w-6 text-white" />}
          iconColor="bg-green-500"
        />
        
        <StatCard
          title="Attendee Growth"
          value={`${stats.totalRegistrations * 1.2}`} 
          change={formatPercentage(stats.attendeesChange)}
          changeType={stats.attendeesChange >= 0 ? 'positive' : 'negative'}
          icon={<UsersIcon className="h-6 w-6 text-white" />}
          iconColor="bg-blue-500"
        />
      </div>
      
      {/* Quick stats row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <QuickStat
          title="Pending Registrations"
          value={stats.pendingRegistrations}
          icon={<ClockIcon className="h-5 w-5 text-yellow-700" />}
          iconColor="bg-yellow-100"
        />
        
        <QuickStat
          title="High Demand Events"
          value="3"
          icon={<ExclamationTriangleIcon className="h-5 w-5 text-red-700" />}
          iconColor="bg-red-100"
        />
        
        <QuickStat
          title="Revenue This Month"
          value={formatCurrency(stats.totalRevenue * 0.3)}
          icon={<ChartBarIcon className="h-5 w-5 text-green-700" />}
          iconColor="bg-green-100"
        />
      </div>
      
      {/* Two column layout for lists */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Upcoming events */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Events</h2>
            <Link
              to="/events"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>
          
          <div className="px-6 py-4">
            {upcomingEvents.length > 0 ? (
              <div className="space-y-1">
                {upcomingEvents.map((event) => (
                  <EventListItem
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    date={event.date}
                    registrations={event.registrations}
                    capacity={event.capacity}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-4 text-center">No upcoming events</p>
            )}
          </div>
        </div>
        
        {/* Recent registrations */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Registrations</h2>
            <Link
              to="/registrations"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>
          
          <div className="px-6 py-4">
            {recentRegistrations.length > 0 ? (
              <div className="space-y-1">
                {recentRegistrations.map((registration) => (
                  <RegistrationItem
                    key={registration.id}
                    id={registration.id}
                    customerName={registration.customerName}
                    eventName={registration.eventName}
                    date={registration.date}
                    status={registration.status}
                    amount={registration.amount}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-4 text-center">No recent registrations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;