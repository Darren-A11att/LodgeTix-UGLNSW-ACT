import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Loader2, AlertTriangle } from 'lucide-react';
import EventCard from '../shared/components/EventCard';
import { getFeaturedEvents, getParentEvent } from '../lib/api/events';
import { EventType } from '../shared/types/event';
import { format, parseISO, isValid, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

// Define type for countdown state
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
}

// Define type for the structured date range return value
interface FormattedDateRange {
  startDay: string;
  startSuffix: string;
  endDay: string | null;
  endSuffix: string | null;
  monthYear: string;
}

const HomePage: React.FC = () => {
  // State for featured events and loading/error
  const [featuredEvents, setFeaturedEvents] = useState<EventType[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState<boolean>(true);
  const [errorFeatured, setErrorFeatured] = useState<string | null>(null);

  // State for parent event and loading/error
  const [parentEvent, setParentEvent] = useState<EventType | null>(null);
  const [isLoadingParent, setIsLoadingParent] = useState<boolean>(true);
  const [errorParent, setErrorParent] = useState<string | null>(null);

  // State for countdown timer
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  // Fetch featured events on mount
  useEffect(() => {
    const fetchFeatured = async () => {
      setIsLoadingFeatured(true);
      setErrorFeatured(null);
      try {
        const events = await getFeaturedEvents(3);
        setFeaturedEvents(events);
      } catch (err) {
        console.error("Error fetching featured events:", err);
        setErrorFeatured("Could not load featured events.");
      } finally {
        setIsLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, []);

  // Fetch parent event on mount
  useEffect(() => {
    const fetchParent = async () => {
      setIsLoadingParent(true);
      setErrorParent(null);
      try {
        const event = await getParentEvent();
        if (event) {
          setParentEvent(event);
        } else {
          setErrorParent("Could not find the main event.");
        }
      } catch (err) {
        console.error("Error fetching parent event:", err);
        setErrorParent("Could not load main event details.");
      } finally {
        setIsLoadingParent(false);
      }
    };
    fetchParent();
  }, []);

  // Countdown Timer Logic
  useEffect(() => {
    if (!parentEvent?.eventStart) {
      setTimeLeft(null); // Reset if no start date
      return; 
    }

    let targetDate: Date;
    try {
      targetDate = parseISO(parentEvent.eventStart);
      if (!isValid(targetDate)) throw new Error('Invalid date');
    } catch (e) {
      console.error("Invalid parent event start date for countdown:", parentEvent.eventStart);
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        // Time is up
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return null; // Stop the interval
      }

      const days = differenceInDays(targetDate, now);
      const hours = differenceInHours(targetDate, now) % 24; // Hours remaining in the current day
      const minutes = differenceInMinutes(targetDate, now) % 60; // Minutes remaining in the current hour
      
      setTimeLeft({ days, hours, minutes });
      return difference; // Return difference to check if interval should continue
    };

    // Initial calculation
    const initialDifference = calculateTimeLeft();
    if (initialDifference === null) return; // Don't start interval if time is already up

    // Update every second
    const timer = setInterval(() => {
      if (calculateTimeLeft() === null) {
        clearInterval(timer);
      }
    }, 1000);

    // Cleanup interval on component unmount or when parentEvent changes
    return () => clearInterval(timer);

  }, [parentEvent]); // Rerun when parentEvent data is available


  // Helper to format date range with ordinal suffixes separated for superscript
  const formatDateRange = (
    startIso: string | undefined,
    endIso: string | null | undefined
  ): FormattedDateRange | string => { // Updated return type
    if (!startIso) return 'Date TBC';
    try {
      const startDate = parseISO(startIso);
      if (!isValid(startDate)) return 'Date TBC';

      const startDayOrdinalFormatted = format(startDate, 'do'); // e.g., 12th
      const monthYearFormatted = format(startDate, 'MMMM yyyy'); // e.g., September 2025
      
      // Extract day and suffix for start date
      const startMatch = startDayOrdinalFormatted.match(/(\d+)(\w+)/);
      if (!startMatch) return 'Date TBC'; // Safety check
      const startDay = startMatch[1];
      const startSuffix = startMatch[2];

      let endDay: string | null = null;
      let endSuffix: string | null = null;

      if (endIso) {
        const endDate = parseISO(endIso);
        if (isValid(endDate)) {
          // Check if end date is different from start date
          if (format(endDate, 'yyyy-MM-dd') !== format(startDate, 'yyyy-MM-dd')) {
            const endDayOrdinalFormatted = format(endDate, 'do'); // e.g., 14th
            const endMatch = endDayOrdinalFormatted.match(/(\d+)(\w+)/);
            if (endMatch) {
              endDay = endMatch[1];
              endSuffix = endMatch[2];
            }
          }
        }
      }
      
      // Return the structured object
      return {
        startDay,
        startSuffix,
        endDay,
        endSuffix,
        monthYear: monthYearFormatted,
      };

    } catch {
      console.error("Error formatting date range:");
      return 'Date TBC';
    }
  };

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
              {isLoadingParent ? 'Loading...' : (parentEvent?.title || 'Grand Proclamation 2025')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-slate-100">
              Join us for the Grand Proclamation ceremony of the United Grand Lodge of NSW & ACT
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/register" 
                className="btn-secondary"
                state={{ checkForDrafts: true }}
              >
                Register Now
              </Link>
              <Link to="/events" className="btn-outline bg-white/10 text-white border-white">
                View Schedule
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Information - Use Parent Event Data */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          {isLoadingParent ? (
            <div className="text-center"><Loader2 className="w-8 h-8 animate-spin text-primary inline-block"/></div>
          ) : errorParent ? (
            <div className="text-center text-red-600 bg-red-50 p-4 rounded"><AlertTriangle className="w-6 h-6 inline mr-2"/>{errorParent}</div>
          ) : parentEvent ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Date - Updated Rendering Logic */}
              <div className="bg-slate-50 p-6 rounded-lg shadow-sm flex">
                <Calendar className="w-12 h-12 text-primary mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Date</h3>
                  <p className="text-slate-700">
                    {(() => {
                      const rangeData = formatDateRange(parentEvent.eventStart, parentEvent.eventEnd);
                      if (typeof rangeData === 'string') {
                        return rangeData; // Display 'Date TBC' or error string
                      }
                      // Render with superscript
                      return (
                        <>
                          {rangeData.startDay}
                          <sup>{rangeData.startSuffix}</sup>
                          {rangeData.endDay && (
                            <>
                              {' '}to {rangeData.endDay}
                              <sup>{rangeData.endSuffix}</sup>
                            </>
                          )}
                          {' '}{rangeData.monthYear}
                        </>
                      );
                    })()}
                  </p>
                </div>
              </div>
              {/* Location */}
              <div className="bg-slate-50 p-6 rounded-lg shadow-sm flex">
                <MapPin className="w-12 h-12 text-primary mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Location</h3>
                  <p className="text-slate-700">{parentEvent.location || 'Location TBC'}</p>
                </div>
              </div>
              {/* Attendance */}
              <div className="bg-slate-50 p-6 rounded-lg shadow-sm flex">
                <Users className="w-12 h-12 text-primary mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Attendance</h3>
                  <p className="text-slate-700">
                    {/* Capacity information now comes from ticket_definitions table */}
                    Expected high attendance
                  </p>
                </div>
              </div>
            </div>
          ) : null /* Should not happen if no error, but handles edge case */}
        </div>
      </section>

      {/* Functional Countdown Timer */}
      <section className="py-12 bg-secondary/10">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-8">Time Until The Grand Proclamation</h2>
          {isLoadingParent ? (
             <div className="text-center"><Loader2 className="w-8 h-8 animate-spin text-primary inline-block"/></div>
          ) : timeLeft ? (
            <div className="flex justify-center gap-4 md:gap-8">
              {/* Days */}
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md w-20 md:w-28">
                <div className="text-3xl md:text-4xl font-bold text-primary">{timeLeft.days}</div>
                <div className="text-sm text-slate-600">Days</div>
              </div>
              {/* Hours */}
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md w-20 md:w-28">
                <div className="text-3xl md:text-4xl font-bold text-primary">{timeLeft.hours}</div>
                <div className="text-sm text-slate-600">Hours</div>
              </div>
              {/* Minutes */}
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md w-20 md:w-28">
                <div className="text-3xl md:text-4xl font-bold text-primary">{timeLeft.minutes}</div>
                <div className="text-sm text-slate-600">Minutes</div>
              </div>
              {/* Seconds block removed */}
            </div>
          ) : (
            <p className="text-lg text-slate-600">The event time has arrived or the date is unavailable!</p>
          )}
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
          
          {/* Handle Loading State for Featured */}
          {isLoadingFeatured && (
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary inline-block"/>
              <p className="text-slate-600 ml-2">Loading featured events...</p>
            </div>
          )}

          {/* Handle Error State for Featured */}
          {errorFeatured && (
            <div className="text-center text-red-600 bg-red-50 p-4 rounded">
               <AlertTriangle className="w-6 h-6 inline mr-2"/>{errorFeatured}
            </div>
          )}

          {/* Render Featured Events when loaded and no error */}
          {!isLoadingFeatured && !errorFeatured && featuredEvents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {/* Show message if no featured events found */}
          {!isLoadingFeatured && !errorFeatured && featuredEvents.length === 0 && (
            <div className="text-center text-slate-500">
              <p>No featured events available at the moment.</p>
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/events" className="btn-outline inline-block">
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
          <Link 
            to="/register" 
            className="btn-secondary inline-block"
            state={{ checkForDrafts: true }}
          >
            Register Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;