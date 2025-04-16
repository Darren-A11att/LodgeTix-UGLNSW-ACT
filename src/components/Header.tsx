import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Compass, User, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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

  return (
    <header className="bg-white shadow-sm">
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Compass className="w-10 h-10 text-primary" />
            <div>
              <div className="text-xl font-bold text-primary">
                Grand Proclamation
              </div>
              <div className="text-xs text-slate-600">
                United Grand Lodge of NSW & ACT
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/" className={navLinkClasses} end>
              Home
            </NavLink>
            <NavLink to="/about" className={navLinkClasses}>
              About
            </NavLink>
            <NavLink to="/events" className={navLinkClasses}>
              Events
            </NavLink>
            <NavLink to="/contact" className={navLinkClasses}>
              Contact
            </NavLink>

            {user ? (
              <div className="relative ml-4">
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-slate-700 hover:text-secondary"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden lg:inline">Account</span>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 text-sm text-slate-700 border-b border-slate-200">
                      {user.email}
                    </div>
                    <Link
                      to="/register"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      My Registrations
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <div className="flex items-center">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center ml-4 space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-2 text-slate-700 hover:text-secondary"
                >
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary">
                  Register Now
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-primary"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 space-y-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-slate-700"
                }`
              }
              onClick={toggleMenu}
              end
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-slate-700"
                }`
              }
              onClick={toggleMenu}
            >
              About
            </NavLink>
            <NavLink
              to="/events"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-slate-700"
                }`
              }
              onClick={toggleMenu}
            >
              Events
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-slate-700"
                }`
              }
              onClick={toggleMenu}
            >
              Contact
            </NavLink>

            {user ? (
              <div className="border-t border-slate-200 my-2 pt-2">
                <div className="px-3 py-1 text-sm text-slate-500">
                  Signed in as: {user.email}
                </div>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-slate-700"
                    }`
                  }
                  onClick={toggleMenu}
                >
                  My Registrations
                </NavLink>
                <button
                  onClick={() => {
                    handleSignOut();
                    toggleMenu();
                  }}
                  className="flex items-center w-full text-left px-3 py-2 text-slate-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="border-t border-slate-200 my-2 pt-2 space-y-2">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-slate-700"
                  onClick={toggleMenu}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block w-full text-center btn-primary"
                  onClick={toggleMenu}
                >
                  Register Now
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
