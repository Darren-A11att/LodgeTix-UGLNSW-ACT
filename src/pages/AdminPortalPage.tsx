import * as React from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Dialog, Menu, Disclosure } from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  CalendarIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  TicketIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  BuildingLibraryIcon,
  UserGroupIcon,
  GiftIcon,
  MapPinIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon,
  Bars4Icon,
  TagIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon, MagnifyingGlassIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

// Import admin pages
import {
  AdminDashboardPage,
  EventsListPage,
  EventDetailPage,
  EventFormPage,
  EventCapacityPage
} from './admin';

// Dashboard component
const Dashboard = () => {
  return (
    <div className="p-8 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Capacity</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="text-3xl font-bold text-indigo-600">68%</div>
            <p className="mt-1 text-sm text-gray-500">Events capacity filled</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
        {/* Recent registrations */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Registrations</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <li key={`reg-${index}`}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {["John Doe", "Jane Smith", "Robert Johnson", "Sarah Williams", "Michael Brown"][index]}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {["Completed", "Pending", "Completed", "In Progress", "Completed"][index]}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <TicketIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                        {index + 1} {index === 0 ? "ticket" : "tickets"}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <p>
                        {`${index + 1} day${index === 0 ? '' : 's'} ago`}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent activity */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <li key={`act-${index}`}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {["New registration", "Payment received", "Event updated", "Customer updated", "Ticket canceled"][index]}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {["Completed", "Successful", "Updated", "Modified", "Processed"][index]}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <UsersIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                        {["Admin User", "Payment System", "Admin User", "Customer Service", "Support Team"][index]}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <p>
                        {`${index + 1} hour${index === 0 ? '' : 's'} ago`}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Placeholder pages for each section
const CustomersPage = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h2 className="text-2xl font-bold mb-6">Customers</h2>
    <p>Customers management will be implemented here.</p>
  </div>
);

const EventsPage = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h2 className="text-2xl font-bold mb-6">Events</h2>
    <p>Events management will be implemented here.</p>
  </div>
);

const RegistrationsPage = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h2 className="text-2xl font-bold mb-6">Registrations</h2>
    <p>Registrations management will be implemented here.</p>
  </div>
);

const TicketsPage = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h2 className="text-2xl font-bold mb-6">Tickets</h2>
    <p>Tickets management will be implemented here.</p>
  </div>
);

const PackagesPage = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h2 className="text-2xl font-bold mb-6">Packages</h2>
    <p>Packages management will be implemented here.</p>
  </div>
);

const AttendeesPage = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h2 className="text-2xl font-bold mb-6">Attendees</h2>
    <p>Attendees management will be implemented here.</p>
  </div>
);

const PaymentsPage = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h2 className="text-2xl font-bold mb-6">Payments</h2>
    <p>Payments management will be implemented here.</p>
  </div>
);

const ReportsPage = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h2 className="text-2xl font-bold mb-6">Reports</h2>
    <p>Reports will be implemented here.</p>
  </div>
);

const MasonicDataPage = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h2 className="text-2xl font-bold mb-6">Masonic Data</h2>
    <p>Lodges and Grand Lodges management will be implemented here.</p>
  </div>
);

const LocationsPage = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h2 className="text-2xl font-bold mb-6">Locations</h2>
    <p>Locations management will be implemented here.</p>
  </div>
);

const ValueAddedServicesPage = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h2 className="text-2xl font-bold mb-6">Value-Added Services</h2>
    <p>VAS management will be implemented here.</p>
  </div>
);

const SystemConfigPage = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h2 className="text-2xl font-bold mb-6">System Configuration</h2>
    <p>System configuration will be implemented here.</p>
  </div>
);

// Navigation structure organized by category
const navigation = [
  // Main section
  { name: 'Dashboard', path: 'dashboard', icon: HomeIcon },
  
  // People section
  { 
    name: 'People', 
    icon: UsersIcon,
    children: [
      { name: 'Customers', path: 'customers', icon: UsersIcon },
      { name: 'Attendees', path: 'attendees', icon: UserGroupIcon },
      { name: 'Masonic Data', path: 'masonic-data', icon: BuildingLibraryIcon },
    ]
  },
  
  // Events section
  {
    name: 'Events', 
    icon: CalendarIcon,
    children: [
      { name: 'Events', path: 'events', icon: CalendarIcon },
      { name: 'Packages', path: 'packages', icon: GiftIcon },
      { name: 'Locations', path: 'locations', icon: MapPinIcon },
    ]
  },
  
  // Sales section
  {
    name: 'Sales',
    icon: TicketIcon,
    children: [
      { name: 'Registrations', path: 'registrations', icon: ClipboardDocumentCheckIcon },
      { name: 'Tickets', path: 'tickets', icon: TicketIcon },
      { name: 'Value-Added Services', path: 'value-added-services', icon: TagIcon },
      { name: 'Payments', path: 'payments', icon: BanknotesIcon },
    ]
  },
  
  // Analytics section
  { name: 'Reports', path: 'reports', icon: ChartPieIcon },
  
  // System section
  { name: 'System Configuration', path: 'system-config', icon: AdjustmentsHorizontalIcon },
];

// User navigation
const userNavigation = [
  { name: 'Your profile', href: '/admin-portal/profile' },
  { name: 'Settings', href: '/admin-portal/settings' },
  { name: 'Sign out', href: '/' },
];

// Helper function for class names
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AdminPortalPage = () => {
  // Using React.useState instead of destructuring useState from React
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<string[]>([]);
  const location = useLocation();
  
  // Determine active route and parent section
  const getIsActive = (path) => {
    const currentPath = location.pathname.replace(/\/$/, ''); // Remove trailing slash if present
    if (path === 'dashboard' && currentPath === '/admin-portal') {
      return true;
    }
    return currentPath === `/admin-portal/${path}`;
  };

  // Toggle section expansion
  const toggleSection = (sectionName: string) => {
    if (expandedSections.includes(sectionName)) {
      setExpandedSections(expandedSections.filter(name => name !== sectionName));
    } else {
      setExpandedSections([...expandedSections, sectionName]);
    }
  };

  // Check if a section or any of its children are active
  const isSectionActive = (section) => {
    if (section.path && getIsActive(section.path)) {
      return true;
    }
    
    if (section.children) {
      return section.children.some(child => getIsActive(child.path));
    }
    
    return false;
  };
  
  // Automatically expand sections with active children
  React.useEffect(() => {
    const activeSections = navigation
      .filter(item => item.children && item.children.some(child => getIsActive(child.path)))
      .map(item => item.name);
    
    if (activeSections.length > 0) {
      setExpandedSections(prev => {
        const newExpandedSections = [...prev];
        activeSections.forEach(section => {
          if (!newExpandedSections.includes(section)) {
            newExpandedSections.push(section);
          }
        });
        return newExpandedSections;
      });
    }
  }, [location.pathname]);

  // Render navigation item
  const renderNavItem = (item, mobile = false) => {
    // If item has children, render as expandable section
    if (item.children) {
      const isExpanded = expandedSections.includes(item.name);
      const isActive = isSectionActive(item);
      
      return (
        <li key={item.name}>
          <Disclosure as="div" defaultOpen={isActive}>
            {() => (
              <>
                <button
                  className={classNames(
                    isActive ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-700 hover:text-white',
                    'group flex w-full items-center gap-x-3 rounded-md p-2 text-left text-sm font-semibold'
                  )}
                  onClick={() => toggleSection(item.name)}
                >
                  <item.icon
                    className={classNames(
                      isActive ? 'text-white' : 'text-indigo-200 group-hover:text-white',
                      'h-6 w-6 shrink-0'
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.name}</span>
                  <ChevronRightIcon
                    className={classNames(
                      isExpanded ? 'rotate-90 text-indigo-200' : 'text-indigo-200',
                      'h-5 w-5 shrink-0 transition-transform duration-150'
                    )}
                  />
                </button>
                {isExpanded && (
                  <ul className="mt-1 space-y-1 pl-9">
                    {item.children.map(child => (
                      <li key={child.name}>
                        <Link
                          to={`/admin-portal/${child.path}`}
                          className={classNames(
                            getIsActive(child.path)
                              ? 'bg-indigo-700 text-white'
                              : 'text-indigo-200 hover:bg-indigo-700 hover:text-white',
                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold'
                          )}
                        >
                          <child.icon
                            className={classNames(
                              getIsActive(child.path) ? 'text-white' : 'text-indigo-200 group-hover:text-white',
                              'h-5 w-5 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Disclosure>
        </li>
      );
    }
    
    // Otherwise render as a simple link
    return (
      <li key={item.name}>
        <Link
          to={`/admin-portal/${item.path}`}
          className={classNames(
            getIsActive(item.path)
              ? 'bg-indigo-700 text-white'
              : 'text-indigo-200 hover:bg-indigo-700 hover:text-white',
            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold'
          )}
        >
          <item.icon
            className={classNames(
              getIsActive(item.path) ? 'text-white' : 'text-indigo-200 group-hover:text-white',
              'h-6 w-6 shrink-0'
            )}
            aria-hidden="true"
          />
          {item.name}
        </Link>
      </li>
    );
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Mobile sidebar */}
      <Dialog 
        as="div"
        className="relative z-50 lg:hidden" 
        open={sidebarOpen} 
        onClose={setSidebarOpen}
      >
        <div className="fixed inset-0 bg-gray-900/80" />
        
        <div className="fixed inset-0 flex">
          <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute top-0 left-full flex w-16 justify-center pt-5">
              <button 
                type="button" 
                className="-m-2.5 p-2.5" 
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            
            {/* Mobile sidebar content */}
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-600 px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <img
                  className="h-8 w-auto"
                  src="/favicon.svg"
                  alt="LodgeTix"
                />
                <span className="ml-4 text-xl font-bold text-white">Admin</span>
              </div>
              
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map(item => renderNavItem(item, true))}
                    </ul>
                  </li>
                  <li className="mt-auto">
                    <Link
                      to="/admin-portal/system-config"
                      className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold text-indigo-200 hover:bg-indigo-700 hover:text-white"
                    >
                      <Cog6ToothIcon
                        className="h-6 w-6 shrink-0 text-indigo-200 group-hover:text-white"
                        aria-hidden="true"
                      />
                      Settings
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-600 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <img
              className="h-8 w-auto"
              src="/favicon.svg"
              alt="LodgeTix"
            />
            <span className="ml-4 text-xl font-bold text-white">Admin</span>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map(item => renderNavItem(item))}
                </ul>
              </li>
              <li className="mt-auto">
                <Link
                  to="/admin-portal/system-config"
                  className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold text-indigo-200 hover:bg-indigo-700 hover:text-white"
                >
                  <Cog6ToothIcon
                    className="h-6 w-6 shrink-0 text-indigo-200 group-hover:text-white"
                    aria-hidden="true"
                  />
                  Settings
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button 
            type="button" 
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden" 
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1">
              <form className="flex flex-1" action="#" method="GET">
                <label htmlFor="search-field" className="sr-only">
                  Search
                </label>
                <div className="relative w-full">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    id="search-field"
                    className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                    placeholder="Search..."
                    type="search"
                    name="search"
                  />
                </div>
              </form>
            </div>
            
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
              </button>

              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10" />

              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="-m-1.5 flex items-center p-1.5">
                  <span className="sr-only">Open user menu</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                    <span className="text-sm font-medium text-indigo-600">SA</span>
                  </div>
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold text-gray-900">Admin User</span>
                    <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Menu.Button>
                <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                  {userNavigation.map((item) => (
                    <Menu.Item key={item.name}>
                      {({ active }) => (
                        <a
                          href={item.href}
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'block px-3 py-1 text-sm text-gray-900'
                          )}
                        >
                          {item.name}
                        </a>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Menu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <Routes>
              {/* Main routes */}
              <Route path="/" element={<AdminDashboardPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              
              {/* People section */}
              <Route path="customers" element={<CustomersPage />} />
              <Route path="attendees" element={<AttendeesPage />} />
              <Route path="masonic-data" element={<MasonicDataPage />} />
              
              {/* Events section */}
              <Route path="events" element={<EventsListPage />} />
              <Route path="events/:id/view" element={<EventDetailPage />} />
              <Route path="events/new" element={<EventFormPage />} />
              <Route path="events/:id/edit" element={<EventFormPage />} />
              <Route path="events/:id/capacity" element={<EventCapacityPage />} />
              <Route path="packages" element={<PackagesPage />} />
              <Route path="locations" element={<LocationsPage />} />
              
              {/* Sales section */}
              <Route path="registrations" element={<RegistrationsPage />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="value-added-services" element={<ValueAddedServicesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              
              {/* Analysis section */}
              <Route path="reports" element={<ReportsPage />} />
              
              {/* System section */}
              <Route path="system-config" element={<SystemConfigPage />} />
              
              <Route path="*" element={<Navigate to="/admin-portal" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPortalPage;