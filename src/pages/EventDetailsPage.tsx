import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, DollarSign, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { events } from '../shared/data/events';
import { format, parseISO } from 'date-fns';
import EventPaymentCard from '../shared/components/EventPaymentCard';

const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Find the event by id
  const event = events.find(e => e.id === id);
  
  // If event not found, show error
  if (!event) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
          <p className="text-slate-600 mb-6">
            Sorry, the event you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/events" className="btn-primary">
            View All Events
          </Link>
        </div>
      </div>
    );
  }

  // Format date for add to calendar button
  const eventDate = parseISO(event.date);
  const formattedDate = format(eventDate, 'yyyy-MM-dd');
  
  // Extract time for calendar
  const [startTime] = event.time.split(' - ');
  
  // Create Google Calendar link
  const createGoogleCalendarLink = () => {
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const eventTitle = encodeURIComponent(event.title);
    const eventLocation = encodeURIComponent(event.location);
    const eventDescription = encodeURIComponent(event.description);
    
    // Format parameters for Google Calendar
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: eventTitle,
      dates: `${formattedDate.replace(/-/g, '')}T${startTime.replace(':', '')}00/${formattedDate.replace(/-/g, '')}T${startTime.replace(':', '')}00`,
      details: eventDescription,
      location: eventLocation,
    });
    
    return `${baseUrl}?${params.toString()}`;
  };
  
  // Handle direct registration
  const handleRegister = () => {
    // Navigate to registration page with event pre-selected
    navigate('/register', { state: { selectedEventId: event.id } });
  };
  
  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-primary text-white py-16">
        {event.imageSrc && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url('${event.imageSrc}')` }}
          ></div>
        )}
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            {event.type && (
              <div className="inline-block px-4 py-1 text-sm font-medium rounded-full bg-white/20 mb-4">
                {event.type}
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {event.title}
            </h1>
            <p className="text-xl opacity-90 mb-6">
              {event.description}
            </p>
          </div>
        </div>
      </section>
      
      {/* Event Details */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Event Information */}
            <div className="lg:col-span-2">
              <div className="bg-slate-50 rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-bold mb-6">Event Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-primary mt-1 mr-3" />
                    <div>
                      <h3 className="font-bold text-slate-900">Date</h3>
                      <p className="text-slate-700">{event.day}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-primary mt-1 mr-3" />
                    <div>
                      <h3 className="font-bold text-slate-900">Time</h3>
                      <p className="text-slate-700">{event.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-primary mt-1 mr-3" />
                    <div>
                      <h3 className="font-bold text-slate-900">Location</h3>
                      <p className="text-slate-700">{event.location}</p>
                    </div>
                  </div>
                  
                  {event.maxAttendees && (
                    <div className="flex items-start">
                      <Users className="w-5 h-5 text-primary mt-1 mr-3" />
                      <div>
                        <h3 className="font-bold text-slate-900">Capacity</h3>
                        <p className="text-slate-700">{event.maxAttendees} attendees maximum</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="font-bold text-xl mb-4">Event Description</h3>
                  <p className="text-slate-700 mb-4">{event.description}</p>
                  
                  {/* Additional content can be added here as needed */}
                  <div className="bg-primary/5 p-4 rounded-md border border-primary/10 mt-6">
                    <h4 className="font-bold mb-2">Important Information</h4>
                    <ul className="text-slate-700 list-disc list-inside space-y-2">
                      <li>Please arrive 15 minutes before the event start time</li>
                      <li>Bring your confirmation email or registration number</li>
                      {event.type === 'Ceremony' && (
                        <li>Appropriate Masonic regalia should be worn for this event</li>
                      )}
                      {event.type === 'Social' && (
                        <li>Dress code: Formal attire (Black tie)</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Location Map (Placeholder) */}
              <div className="bg-slate-50 rounded-lg p-6 mb-8">
                <h3 className="font-bold text-xl mb-4">Location</h3>
                <div className="h-64 bg-slate-200 rounded-md flex items-center justify-center">
                  <p className="text-slate-600">Map will be displayed here</p>
                </div>
                <p className="mt-4 text-slate-700">
                  {event.location}
                </p>
              </div>
            </div>
            
            {/* Right Column - Registration Panel */}
            <div>
              <div className="sticky top-4">
                <EventPaymentCard event={event} />
                
                <div className="mt-6">
                  <a 
                    href={createGoogleCalendarLink()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-outline w-full flex justify-center items-center"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Add to Calendar
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Related Events Section */}
          <div className="mt-12 border-t border-slate-200 pt-12">
            <h2 className="text-2xl font-bold mb-6">Related Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events
                .filter(e => e.id !== event.id && e.day === event.day)
                .slice(0, 3)
                .map(relatedEvent => (
                  <div key={relatedEvent.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-100">
                    <div className="p-6">
                      <div className="text-sm font-medium text-primary mb-2">{relatedEvent.day}</div>
                      <h3 className="font-bold mb-2">{relatedEvent.title}</h3>
                      <div className="flex items-center text-sm text-slate-600 mb-4">
                        <Clock className="w-4 h-4 mr-2 text-primary" />
                        {relatedEvent.time}
                      </div>
                      <Link to={`/events/${relatedEvent.id}`} className="text-primary font-medium hover:underline">
                        View Event
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventDetailsPage;