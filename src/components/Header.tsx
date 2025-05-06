'use client'

import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, Compass } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
      <nav className="container-custom mx-auto p-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Compass className="w-10 h-10 text-primary" />
            <div>
              <div className="text-xl font-bold text-primary">Grand Proclamation</div>
              <div className="text-xs text-slate-600">United Grand Lodge of NSW &amp; ACT</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <NavLink key={item.name} to={item.href} className={navLinkClasses}>
                {item.name}
              </NavLink>
            ))}
            <div className="flex items-center ml-4 space-x-2">
              <Link to="/login" className="px-3 py-2 text-slate-700 hover:text-secondary">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary">
                Register Now
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            type="button" 
            className="md:hidden p-2 rounded-md text-primary"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md ${
                    isActive ? "bg-slate-50 text-secondary font-medium" : "text-slate-700 hover:bg-slate-50 hover:text-secondary"
                  }`
                }
                onClick={toggleMenu}
              >
                {item.name}
              </NavLink>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-200">
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-slate-700 hover:bg-slate-50 hover:text-secondary"
                onClick={toggleMenu}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 mt-1 rounded-md bg-primary text-white hover:bg-primary-dark text-center"
                onClick={toggleMenu}
              >
                Register Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
