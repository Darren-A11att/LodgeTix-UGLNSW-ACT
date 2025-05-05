import React from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  Mail,
  Phone,
  MapPin,
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Compass className="w-8 h-8 text-secondary" />
              <div className="text-xl font-bold">Grand Proclamation</div>
            </div>
            <p className="text-slate-300 mb-4">
              The official website for the Grand Proclamation ceremony of the
              United Grand Lodge of NSW & ACT.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-white hover:text-secondary"
                aria-label="Facebook"
              >
                <FacebookIcon size={20} />
              </a>
              <a
                href="#"
                className="text-white hover:text-secondary"
                aria-label="Instagram"
              >
                <InstagramIcon size={20} />
              </a>
              <a
                href="#"
                className="text-white hover:text-secondary"
                aria-label="YouTube"
              >
                <YoutubeIcon size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-slate-300 hover:text-secondary">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-300 hover:text-secondary"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/events"
                  className="text-slate-300 hover:text-secondary"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  to="/register/type"
                  className="text-slate-300 hover:text-secondary"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-slate-300 hover:text-secondary"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/register/type"
                  className="text-slate-300 hover:text-secondary"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default navigation
                    
                    // Import and use the registration store
                    import('../store/registrationStore').then((module) => {
                      // First, clear the registration state
                      module.useRegistrationStore.getState().clearRegistration();
                      
                      // Then navigate to the type selection page
                      window.location.href = '/register/type';
                    });
                  }}
                >
                  New Registration
                </Link>
              </li>
              <li>
                <a
                  href={window.location.protocol + "//app." + window.location.hostname.replace("www.", "")}
                  className="text-slate-300 hover:text-secondary"
                >
                  Attendee Portal
                </a>
              </li>
              <li>
                <a
                  href={window.location.protocol + "//admin." + window.location.hostname.replace("www.", "")}
                  className="text-slate-300 hover:text-secondary"
                >
                  Admin Portal
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-secondary mt-0.5 mr-2" />
                <span className="text-slate-300">
                  Sydney Masonic Centre
                  <br />
                  66 Goulburn St, Sydney NSW 2000
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 text-secondary mr-2" />
                <a
                  href="tel:+61298620400"
                  className="text-slate-300 hover:text-secondary"
                >
                  +61 2 9862 0400
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 text-secondary mr-2" />
                <a
                  href="mailto:info@grandProclamation.org.au"
                  className="text-slate-300 hover:text-secondary"
                >
                  info@grandProclamation.org.au
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400 text-sm">
          <p>
            &copy; {new Date().getFullYear()} United Grand Lodge of NSW & ACT.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
