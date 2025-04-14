import React, { useState } from 'react';
import EventCard from '../shared/components/EventCard';
import { events } from '../shared/data/events';
import { Calendar, Clock, Filter } from 'lucide-react';

const EventsPage: React.FC = () => {
  const [filterDay, setFilterDay] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Get unique days from events
  const uniqueDays = Array.from(new Set(events.map(event => event.day)));
  
  // Get unique event types
  const uniqueTypes = Array.from(new Set(events.map(event => event.type)));

  // Filter events based on selected filters
  const filteredEvents = events.filter(event => {
    const matchesDay = !filterDay || event.day === filterDay;
    const matchesType = !filterType || event.type === filterType;
    return matchesDay && matchesType;
  });

  const resetFilters = () => {
    setFilterDay(null);
    setFilterType(null);
  };

  return (
    <div>
      <section className="bg-primary text-white py-16">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-6">Events Schedule</h1>
          <p className="text-xl max-w-3xl">
            Browse the complete schedule of events for the Grand Installation weekend.
            Filter by day or event type to find the ceremonies and activities you're interested in.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          {/* Filters */}
          <div className="mb-8 bg-slate-50 p-6 rounded-lg shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                <Filter className="w-5 h-5 mr-2 text-primary" />
                <span className="font-semibold">Filters:</span>
              </div>
              
              <div className="flex-grow md:flex-grow-0">
                <select
                  value={filterDay || ''}
                  onChange={e => setFilterDay(e.target.value || null)}
                  className="w-full md:w-auto px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">All Days</option>
                  {uniqueDays.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-grow md:flex-grow-0">
                <select
                  value={filterType || ''}
                  onChange={e => setFilterType(e.target.value || null)}
                  className="w-full md:w-auto px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">All Event Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              {(filterDay || filterType) && (
                <button
                  onClick={resetFilters}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Schedule Overview */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-primary">Schedule Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-lg shadow-sm border-l-4 border-primary">
                <div className="flex items-center mb-3">
                  <Calendar className="w-5 h-5 text-primary mr-2" />
                  <h3 className="text-lg font-bold">Friday, September 12</h3>
                </div>
                <p className="text-slate-700">
                  Arrival, registration, and welcome events
                </p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-lg shadow-sm border-l-4 border-primary">
                <div className="flex items-center mb-3">
                  <Calendar className="w-5 h-5 text-primary mr-2" />
                  <h3 className="text-lg font-bold">Saturday, September 13</h3>
                </div>
                <p className="text-slate-700">
                  Main installation ceremony and gala dinner
                </p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-lg shadow-sm border-l-4 border-primary">
                <div className="flex items-center mb-3">
                  <Calendar className="w-5 h-5 text-primary mr-2" />
                  <h3 className="text-lg font-bold">Sunday, September 14</h3>
                </div>
                <p className="text-slate-700">
                  Thanksgiving service and farewell lunch
                </p>
              </div>
            </div>
          </div>

          {/* Events Listing */}
          <h2 className="text-2xl font-bold mb-6 text-primary">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'} 
            {filterDay ? ` on ${filterDay}` : ''} 
            {filterType ? ` (${filterType})` : ''}
          </h2>
          
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-lg text-slate-700">No events match your current filters.</p>
              <button
                onClick={resetFilters}
                className="mt-4 btn-outline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default EventsPage;