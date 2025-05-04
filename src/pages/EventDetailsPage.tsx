'use client'; // Mark as client component

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, AlertCircle, Loader2, TrendingUp } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import EventPaymentCard from '../shared/components/EventPaymentCard';
import { getEventById, getChildEvents, getRelatedEvents, getEventCapacity } from '../lib/api/events';
import { EventType } from '../shared/types/event';
import { generateGoogleCalendarUrl, CalendarEventData } from '../lib/calendarUtils';

// Capacity display component to be used in the event details
const CapacityDisplay: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [capacityInfo, setCapacityInfo] = useState<{
    totalCapacity: number;
    availableCount: number;
    usagePercentage: number;
    reservedCount: number;
    soldCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCapacity = async () => {
      setIsLoading(true);
      try {
        const capacity = await getEventCapacity(eventId);
        setCapacityInfo(capacity);
      } catch (err) {
        console.error('Error fetching capacity:', err);
        setError('Unable to load capacity information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCapacity();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="flex items-center text-slate-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        <span>Loading capacity information...</span>
      </div>
    );
  }

  if (error || !capacityInfo) {
    return <p className="text-slate-700">Limited availability</p>;
  }

  const { availableCount, totalCapacity, usagePercentage, reservedCount, soldCount } = capacityInfo;
  const isSoldOut = availableCount === 0;
  const isHighDemand = usagePercentage >= 80;

  if (isSoldOut) {
    return (
      <div className="flex items-start">
        <AlertCircle className="w-4 h-4 mr-2 mt-0.5 text-red-600 flex-shrink-0" />
        <div>
          <div className="flex items-center text-red-600">
            <span className="font-medium">Sold Out</span>
          </div>
          <p className="text-sm text-red-500 mt-1">All {totalCapacity} tickets have been claimed</p>
        </div>
      </div>
    );
  }

  if (isHighDemand) {
    return (
      <div className="flex items-start">
        <TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-amber-600 flex-shrink-0" />
        <div>
          <div className="flex items-center text-amber-600">
            <span className="font-medium">High demand</span>
          </div>
          <p className="text-sm text-amber-500 mt-1">
            Only {availableCount} of {totalCapacity} seats remaining
            {reservedCount > 0 && ` (${reservedCount} currently reserved)`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start">
      <Users className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
      <div>
        <div className="flex items-center text-green-600">
          <span className="font-medium">Available</span>
        </div>
        <p className="text-sm text-green-500 mt-1">
          {availableCount} of {totalCapacity} seats available
          {soldCount > 0 && ` (${soldCount} already sold)`}
        </p>
      </div>
    </div>
  );
};

const EventDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  // State variables for data, loading, and errors
  const [event, setEvent] = useState<EventType | null>(null);
  const [childEvents, setChildEvents] = useState<EventType[]>([]);
  const [relatedEvents, setRelatedEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect to fetch data when component mounts or slug changes
  useEffect(() => {
    if (!slug) {
      setError("No event identifier provided.");
      setIsLoading(false);
      return;
    }

    const fetchEventData = async () => {
      setIsLoading(true);
      setError(null);
      setEvent(null);
      setChildEvents([]);
      setRelatedEvents([]);

      try {
        const fetchedEvent = await getEventById(slug);
        
        if (fetchedEvent) {
          setEvent(fetchedEvent);
          
          // Fetch child events if it's a multi-day parent
          if (fetchedEvent.is_multi_day) { 
            const children = await getChildEvents(fetchedEvent.id);
            setChildEvents(children);
          }
          
          // Fetch related events (same day, excluding self and children)
          if (fetchedEvent.event_start) {
            try {
              const startDate = parseISO(fetchedEvent.event_start);
              if (isValid(startDate)) {
                const dateString = format(startDate, 'yyyy-MM-dd'); // Format as YYYY-MM-DD
                const related = await getRelatedEvents(fetchedEvent.id, dateString);
                setRelatedEvents(related);
              } else {
                 console.warn(`Cannot fetch related events: Invalid start date parsed from ${fetchedEvent.event_start}`);
              }
            } catch (parseError) {
              console.error(`Error parsing event_start for related events: ${fetchedEvent.event_start}`, parseError);
            }
          } else {
             console.warn("Cannot fetch related events: Event event_start is missing.")
          }
          
        } else {
          setError("Event not found.");
        }
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("Failed to load event details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [slug]); // Dependency array includes 'slug'

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="ml-4 text-lg text-slate-600">Loading event details...</p>
      </div>
    );
  }

  // Error state (includes event not found)
  if (error || !event) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">{error ? "Error" : "Event Not Found"}</h2>
          <p className="text-slate-600 mb-6">
            {error || "Sorry, the event you're looking for doesn't exist or has been removed."}
          </p>
          <Link to="/events" className="btn-primary">
            View All Events
          </Link>
        </div>
      </div>
    );
  }

  // --- Success State: Event data is available ---

  const handleRegister = () => {
    if (event && event.id) {
      navigate('/register', { state: { selectedEventId: event.id } });
    } else {
      console.error("Cannot register: event data is missing.");
    }
  };
  
  // --- Prepare Data for Google Calendar Link ---
  let startDateTime: Date | undefined = undefined;
  let endDateTime: Date | undefined = undefined;
  let googleCalendarUrl = '#'; 
  let isCalendarLinkDisabled = true;

  if (event && event.event_start) {
    try {
      startDateTime = parseISO(event.event_start);

      if (event.event_end) {
        endDateTime = parseISO(event.event_end);
      }

      if (startDateTime && isValid(startDateTime)) {
         const validEndDateTime = endDateTime && isValid(endDateTime) ? endDateTime : undefined;

         const calendarData: CalendarEventData = {
           title: event.title || 'Event',
           description: event.description ?? '',
           location: event.location ?? '',
           startDateTime: startDateTime,
           endDateTime: validEndDateTime,
         };
         googleCalendarUrl = generateGoogleCalendarUrl(calendarData);
         isCalendarLinkDisabled = false;
      } else {
         console.warn("Could not generate calendar link: Invalid start date/time after parsing ISO string.");
      }
    } catch (e) {
      console.error("Error parsing event ISO date/time for calendar link:", e);
    }
  }
  // --- End Prepare Data ---

  return (
    <div>
      {/* Hero Banner - Use fetched data */}
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
            {/* Use event.description, removed short_description */}
            <p className="text-xl opacity-90 mb-6">
              {event.description}
            </p>
          </div>
        </div>
      </section>
      
      {/* Event Details - Use fetched data */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Event Information */}
            <div className="lg:col-span-2">
              <div className="bg-slate-50 rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-bold mb-6">Event Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Date Display: Use new 'day' format */}
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-primary mt-1 mr-3" />
                    <div>
                      <h3 className="font-bold text-slate-900">Date</h3>
                      <p className="text-slate-700">
                        {event.day || 'Date not available'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Time Display: Use new 'time' and 'until' formats */}
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-primary mt-1 mr-3" />
                    <div>
                      <h3 className="font-bold text-slate-900">Time</h3>
                      <p className="text-slate-700">
                        {event.time || 'Time not available'}
                        {event.until ? ` - ${event.until}` : ''} 
                      </p>
                    </div>
                  </div>
                  
                  {/* Location Display */}
                   <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-primary mt-1 mr-3" />
                    <div>
                      <h3 className="font-bold text-slate-900">Location</h3>
                      <p className="text-slate-700">{event.location || 'Location not specified'}</p>
                    </div>
                  </div>
                  
                  {/* Capacity Display - Uses event_capacity table */}
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-primary mt-1 mr-3" />
                    <div>
                      <h3 className="font-bold text-slate-900">Capacity</h3>
                      <CapacityDisplay eventId={event.id} />
                    </div>
                  </div>
                </div>
                
                {/* Display Child Events if they exist */}
                {childEvents.length > 0 && (
                   <div className="border-t border-slate-200 pt-6 mb-6">
                    <h3 className="font-bold text-xl mb-4">Event Schedule</h3>
                    <ul className="space-y-3">
                      {childEvents.map(child => (
                        <li key={child.id} className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                           <div>
                             <Link to={`/events/${child.slug}`} className="font-medium text-primary hover:underline">{child.title}</Link>
                             <p className="text-sm text-slate-600">{child.day} at {child.time}</p>
                           </div>
                           <Link to={`/events/${child.slug}`} className="text-sm text-primary hover:underline">View Day</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="font-bold text-xl mb-4">Event Description</h3>
                  <p className="text-slate-700 mb-4 whitespace-pre-wrap">{event.description || 'No description available.'}</p>
                  
                  <div className="bg-primary/5 p-4 rounded-md border border-primary/10 mt-6">
                    <h4 className="font-bold mb-2">Important Information</h4>
                    <ul className="text-slate-700 list-disc list-inside space-y-2">
                      <li>Please arrive 15 minutes before the event start time.</li>
                      <li>Bring your confirmation email or registration number.</li>
                      {event.type === 'Ceremony' && (
                        <li>Appropriate Masonic regalia should be worn for this event.</li>
                      )}
                      {event.type === 'Social' && (
                        <li>Dress code: Formal attire (Black tie).</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Location Map */}
              <div className="bg-slate-50 rounded-lg p-6 mb-8">
                <h3 className="font-bold text-xl mb-4">Location</h3>
                {event.latitude && event.longitude ? (
                   <div className="h-64 bg-slate-200 rounded-md flex flex-col items-center justify-center text-center">
                    <MapPin className="w-10 h-10 text-primary mb-3" />
                    {/* Removed unused @ts-expect-error */}
                    <p className="text-slate-700 font-medium mb-3"> 
                      {event.location || ''} 
                    </p> 
                    <a 
                       href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="btn-secondary btn-sm"
                    >
                       View Map
                    </a>
                  </div>
                ) : (
                  <div className="h-64 bg-slate-200 rounded-md flex items-center justify-center">
                    <p className="text-slate-600 italic">Map integration coming soon!</p> 
                  </div>
                )}
                {/* Display location name below map/placeholder - use empty string fallback */}
                <p className="mt-4 text-slate-700">
                  {event.location || ''}
                </p>
              </div>
            </div>
            
            {/* Right Column - Registration Panel */}
            <div>
              <div className="sticky top-4">
                <EventPaymentCard event={event} /> 
                
                {/* Google Calendar Link */}
                <div className="mt-6 w-full"> 
                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn-outline w-full flex items-center justify-center ${isCalendarLinkDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    {...(isCalendarLinkDisabled ? { 'aria-disabled': 'true' } : {})}
                    onClick={(e) => { if (isCalendarLinkDisabled) e.preventDefault(); }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Add to Google Calendar
                  </a>
                </div>

                 {/* Register Button */}
                 <div className="mt-4">
                    <button 
                      onClick={handleRegister} 
                      className="btn-primary w-full"
                      disabled={!event || !event.id} // Keep original register button logic
                    >
                      Register Now
                    </button>               
                 </div>
              </div>
            </div>
          </div>
          
          {/* Related Events Section - Check for nullish coalescing here if needed */}
          {relatedEvents.length > 0 && (
            <div className="mt-12 border-t border-slate-200 pt-12">
              <h2 className="text-2xl font-bold mb-6">Related Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedEvents.map(relatedEvent => (
                    <div key={relatedEvent.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-100 transition-shadow hover:shadow-lg">
                      {/* Ensure imageSrc uses ?? */}
                      {relatedEvent.imageSrc && (
                        <Link to={`/events/${relatedEvent.slug}`}>
                          <img src={relatedEvent.imageSrc} alt={relatedEvent.title ?? 'Related Event'} className="w-full h-40 object-cover"/>
                        </Link>
                       )}
                      <div className="p-6">
                        {/* Ensure day uses ?? */}
                        <div className="text-sm font-medium text-primary mb-2">{relatedEvent.day ?? 'Date N/A'}</div> 
                        {/* Ensure title uses ?? */}
                        <h3 className="font-bold mb-2 truncate">{relatedEvent.title ?? 'Untitled Event'}</h3> 
                        <div className="flex items-center text-sm text-slate-600 mb-4">
                          <Clock className="w-4 h-4 mr-2 text-primary" />
                           {/* Ensure time uses ?? */} 
                          {relatedEvent.time ?? 'Time N/A'} 
                        </div>
                        <Link to={`/events/${relatedEvent.slug}`} className="text-primary font-medium hover:underline">
                          View Event
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default EventDetailsPage;