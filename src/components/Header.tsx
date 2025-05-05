'use client'

import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Compass, User, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Dialog } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md ${
      isActive
        ? "text-secondary font-medium"
        : "text-slate-700 hover:text-secondary"
    }`;

  // Define your site's navigation structure
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Events', href: '/events' },
    { name: 'Contact', href: '/contact' },
  ];

  // Function to determine active link style
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'text-primary font-semibold' : 'text-gray-900 font-semibold';

  return (
    <header className="bg-white sticky top-0 z-40 shadow-sm">
      <nav aria-label="Global" className="container-custom mx-auto flex items-center justify-between p-6 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <span className="sr-only">Grand Proclamation</span>
            <img
              alt="Grand Proclamation Logo"
              src="/favicon.svg" 
              className="h-8 w-auto"
            />
            <span className="font-bold text-gray-900">Grand Proclamation</span>
                </Link>
              </div>

          {/* Mobile Menu Button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            aria-label="Open main menu"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <NavLink key={item.name} to={item.href} className={getNavLinkClass}>
              {item.name}
            </NavLink>
          ))}
        </div>
        
        {/* Desktop Account Link */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <NavLink to="/account" className={getNavLinkClass}>
            Account <span aria-hidden="true">&rarr;</span>
            </NavLink>
        </div>
      </nav>
      
      {/* Mobile Menu Dialog */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50" /> 
        <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between">
            <Link to="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
              <span className="sr-only">Grand Proclamation</span>
              <img
                alt="Grand Proclamation Logo"
                src="/favicon.svg"
                className="h-8 w-auto"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              aria-label="Close menu"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          {/* Mobile Menu Body */}
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              {/* Mobile Navigation Links */}
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
            <NavLink
                    key={item.name}
                    to={item.href}
              className={({ isActive }) =>
                      `-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold ${isActive ? 'text-primary bg-gray-50' : 'text-gray-900 hover:bg-gray-50'}`
              }
                    onClick={() => setMobileMenuOpen(false)}
            >
                    {item.name}
            </NavLink>
                ))}
                </div>
              {/* Mobile Account Link */}
              <div className="py-6">
                <NavLink
                  to="/account"
                  className={({ isActive }) =>
                    `-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold ${isActive ? 'text-primary bg-gray-50' : 'text-gray-900 hover:bg-gray-50'}`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Account
                </NavLink>
              </div>
              </div>
      </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
};

export default Header;
