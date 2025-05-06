'use client'

import { useState } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
} from '@headlessui/react'
import {
  Bars3Icon,
  BellIcon,
  CalendarIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  TicketIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'

// Import pages
import AdminDashboardPage from './pages/AdminDashboardPage'

const routes = [
  { name: 'Dashboard', path: 'dashboard', icon: HomeIcon },
  { name: 'Customers', path: 'customers', icon: UsersIcon },
  { name: 'Events', path: 'events', icon: CalendarIcon },
  { name: 'Registrations', path: 'registrations', icon: ClipboardDocumentCheckIcon },
  { name: 'Tickets', path: 'tickets', icon: TicketIcon },
  { name: 'Payments', path: 'payments', icon: BanknotesIcon },
  { name: 'Reports', path: 'reports', icon: ChartPieIcon },
]

const userNavigation = [
  { name: 'Your profile', href: '/admin/profile' },
  { name: 'Settings', href: '/admin/settings' },
  { name: 'Sign out', href: '/admin/logout' },
]

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ')
}

export default function AdminPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  
  // Determine which route is active
  const getIsActive = (path: string) => {
    return location.pathname === `/admin/${path}` || 
      (path === 'dashboard' && (location.pathname === '/admin' || location.pathname === '/admin/'))
  }

  return (
    <>
      <div>
        <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                  <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                  </button>
                </div>
              </TransitionChild>
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-600 px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center">
                  <img
                    alt="LodgeTix Admin"
                    src="/favicon.svg"
                    className="h-8 w-auto"
                  />
                  <span className="ml-4 text-xl font-bold text-white">LodgeTix Admin</span>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {routes.map((item) => (
                          <li key={item.name}>
                            <a
                              href={`/admin/${item.path}`}
                              className={classNames(
                                getIsActive(item.path)
                                  ? 'bg-indigo-700 text-white'
                                  : 'text-indigo-200 hover:bg-indigo-700 hover:text-white',
                                'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                              )}
                            >
                              <item.icon
                                aria-hidden="true"
                                className={classNames(
                                  getIsActive(item.path) ? 'text-white' : 'text-indigo-200 group-hover:text-white',
                                  'size-6 shrink-0',
                                )}
                              />
                              {item.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                    <li className="mt-auto">
                      <a
                        href="/admin/settings"
                        className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-indigo-200 hover:bg-indigo-700 hover:text-white"
                      >
                        <Cog6ToothIcon
                          aria-hidden="true"
                          className="size-6 shrink-0 text-indigo-200 group-hover:text-white"
                        />
                        Settings
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-600 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <img
                alt="LodgeTix Admin"
                src="/favicon.svg"
                className="h-8 w-auto"
              />
              <span className="ml-4 text-xl font-bold text-white">LodgeTix Admin</span>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {routes.map((item) => (
                      <li key={item.name}>
                        <a
                          href={`/admin/${item.path}`}
                          className={classNames(
                            getIsActive(item.path)
                              ? 'bg-indigo-700 text-white'
                              : 'text-indigo-200 hover:bg-indigo-700 hover:text-white',
                            'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                          )}
                        >
                          <item.icon
                            aria-hidden="true"
                            className={classNames(
                              getIsActive(item.path) ? 'text-white' : 'text-indigo-200 group-hover:text-white',
                              'size-6 shrink-0',
                            )}
                          />
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="mt-auto">
                  <a
                    href="/admin/settings"
                    className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-indigo-200 hover:bg-indigo-700 hover:text-white"
                  >
                    <Cog6ToothIcon
                      aria-hidden="true"
                      className="size-6 shrink-0 text-indigo-200 group-hover:text-white"
                    />
                    Settings
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="lg:pl-72">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-xs sm:gap-x-6 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-gray-700 lg:hidden">
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>

            {/* Separator */}
            <div aria-hidden="true" className="h-6 w-px bg-gray-900/10 lg:hidden" />

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <form action="#" method="GET" className="grid flex-1 grid-cols-1">
                <input
                  name="search"
                  type="search"
                  placeholder="Search"
                  aria-label="Search"
                  className="col-start-1 row-start-1 block size-full bg-white pl-8 text-base text-gray-900 outline-hidden placeholder:text-gray-400 sm:text-sm/6"
                />
                <MagnifyingGlassIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 size-5 self-center text-gray-400"
                />
              </form>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                  <span className="sr-only">View notifications</span>
                  <BellIcon aria-hidden="true" className="size-6" />
                </button>

                {/* Separator */}
                <div aria-hidden="true" className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10" />

                {/* Profile dropdown */}
                <Menu as="div" className="relative">
                  <MenuButton className="-m-1.5 flex items-center p-1.5">
                    <span className="sr-only">Open user menu</span>
                    <div className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <span className="text-sm font-medium">SA</span>
                    </div>
                    <span className="hidden lg:flex lg:items-center">
                      <span aria-hidden="true" className="ml-4 text-sm/6 font-semibold text-gray-900">
                        System Admin
                      </span>
                      <ChevronDownIcon aria-hidden="true" className="ml-2 size-5 text-gray-400" />
                    </span>
                  </MenuButton>
                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                  >
                    {userNavigation.map((item) => (
                      <MenuItem key={item.name}>
                        <a
                          href={item.href}
                          className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                        >
                          {item.name}
                        </a>
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Menu>
              </div>
            </div>
          </div>

          <main className="py-10">
            <Routes>
              <Route path="/" element={
                <div className="px-4 sm:px-6 lg:px-8">
                  <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                      <h1 className="text-base font-semibold leading-6 text-gray-900">Admin Dashboard</h1>
                      <p className="mt-2 text-sm text-gray-700">
                        Welcome to the LodgeTix Admin Portal. Manage events, customers, tickets, and more.
                      </p>
                    </div>
                  </div>
                  <div className="mt-8 flow-root">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                      <div className="p-6 bg-white">
                        <p>Welcome to the LodgeTix Admin Portal. Please select an option from the sidebar to get started.</p>
                      </div>
                    </div>
                  </div>
                </div>
              } />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              {/* Add more routes as components are created */}
              {/* <Route path="customers" element={<AdminCustomersPage />} /> */}
              {/* <Route path="events" element={<AdminEventsPage />} /> */}
              {/* <Route path="registrations" element={<AdminRegistrationsPage />} /> */}
              {/* <Route path="tickets" element={<AdminTicketsPage />} /> */}
              {/* <Route path="payments" element={<AdminPaymentsPage />} /> */}
              {/* <Route path="reports" element={<AdminReportsPage />} /> */}
              {/* <Route path="settings" element={<AdminSettingsPage />} /> */}
              {/* <Route path="profile" element={<AdminProfilePage />} /> */}
              {/* <Route path="logout" element={<Navigate to="/admin" replace />} /> */}
            </Routes>
          </main>
        </div>
      </div>
    </>
  )
}