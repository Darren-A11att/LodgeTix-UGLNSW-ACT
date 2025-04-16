import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import EventCard from '../shared/components/EventCard';
import { events } from '../shared/data/events';

const HomePage: React.FC = () => {
  // Display only featured events on the homepage
  const featuredEvents = events.filter(event => event.featured).slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-primary text-white py-20">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 hero-background-image"
        ></div>
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Grand Proclamation 2025
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-slate-100">
              Join us for the Grand Proclamation ceremony of the United Grand Lodge of NSW & ACT
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn-secondary">
                Register Now
              </Link>
              <Link to="/events" className="btn-outline bg-white/10 text-white border-white">
                View Schedule
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Information */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 rounded-lg shadow-sm flex">
              <Calendar className="w-12 h-12 text-primary mr-4 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Date</h3>
                <p className="text-slate-700">September 12-14, 2025</p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-lg shadow-sm flex">
              <MapPin className="w-12 h-12 text-primary mr-4 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Location</h3>
                <p className="text-slate-700">Sydney Masonic Centre</p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-lg shadow-sm flex">
              <Users className="w-12 h-12 text-primary mr-4 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Attendance</h3>
                <p className="text-slate-700">Expected 1,500+ attendees</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Timer (mock) */}
      <section className="py-12 bg-secondary/10">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-8">Time Until The Grand Proclamation</h2>
          <div className="flex justify-center gap-4 md:gap-8">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md w-20 md:w-28">
              <div className="text-3xl md:text-4xl font-bold text-primary">256</div>
              <div className="text-sm text-slate-600">Days</div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md w-20 md:w-28">
              <div className="text-3xl md:text-4xl font-bold text-primary">12</div>
              <div className="text-sm text-slate-600">Hours</div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md w-20 md:w-28">
              <div className="text-3xl md:text-4xl font-bold text-primary">45</div>
              <div className="text-sm text-slate-600">Minutes</div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md w-20 md:w-28">
              <div className="text-3xl md:text-4xl font-bold text-primary">30</div>
              <div className="text-sm text-slate-600">Seconds</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Events</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Experience the highlight ceremonies and events of the Grand Proclamation weekend
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/events" className="btn-outline">
              View All Events
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-6">Be Part of This Historic Occasion</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join fellow Freemasons from around the world for this momentous celebration. 
            Reserve your place today for the Grand Proclamation ceremony.
          </p>
          <Link to="/register" className="btn-secondary">
            Register Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;