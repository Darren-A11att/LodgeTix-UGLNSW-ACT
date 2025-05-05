import React, { useState, useEffect, useMemo } from 'react';
import EventCard from '../shared/components/EventCard';
import { getEvents } from '../lib/api/events';
import { EventType } from '../shared/types/event';
import { Filter, Loader2, AlertTriangle, Calendar } from 'lucide-react';
import { format, parseISO, isValid, compareAsc } from 'date-fns';
import { Link } from 'react-router-dom';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const EVENTS_PER_PAGE = 9;

  const [filterType, setFilterType] = useState<string | null>(null);

  const fetchInitialData = async (type: string | null) => {
    setLoading(true);
    setEvents([]);
    setError(null);
    
    try {
      const eventsResponse = await getEvents({
        page: 1,
        limit: EVENTS_PER_PAGE,
        filterType: type,
      });
      
      const { events: fetchedEvents, totalCount: fetchedTotalCount } = eventsResponse;
      
      setEvents(fetchedEvents);
      setTotalCount(fetchedTotalCount);
      setCurrentPage(1);

    } catch (err) {
      console.error('Error in initial data fetch:', err);
      setError('Unable to load page data. Please try again later.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreEvents = async (page: number, type: string | null) => {
    setIsLoadingMore(true);
    setError(null);
    try {
      const { events: fetchedEvents, totalCount: fetchedTotalCount } = await getEvents({
        page: page,
        limit: EVENTS_PER_PAGE,
        filterType: type,
      });
      setEvents(prevEvents => [...prevEvents, ...fetchedEvents]);
      setTotalCount(fetchedTotalCount);
      setCurrentPage(page);
    } catch (err) { 
      console.error('Error fetching more events:', err);
      setError('Unable to load more events.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchInitialData(filterType);
  }, []);

  useEffect(() => {
    const isInitialMount = currentPage === 1 && events.length === 0;
    if (!isInitialMount) {
        fetchInitialData(filterType);
    }
  }, [filterType]);

  const uniqueTypes = Array.isArray(events) ? Array.from(new Set(events.map(event => event.type).filter(Boolean))) : [];

  const handleLoadMore = () => {
    if (!isLoadingMore) {
      fetchMoreEvents(currentPage + 1, filterType);
    }
  };

  const eventsGroupedAndSortedByDate = useMemo(() => {
    if (!Array.isArray(events)) return [];

    const childEvents = events.filter(event => event.parentEventId !== null);

    const grouped: Record<string, { dateObj: Date; events: EventType[] }> = {};

    childEvents.forEach(event => {
      if (event.eventStart) {
        try {
          const dateObj = parseISO(event.eventStart);
          if (isValid(dateObj)) {
            const dateKey = format(dateObj, 'yyyy-MM-dd');
            if (!grouped[dateKey]) {
              grouped[dateKey] = { dateObj: dateObj, events: [] };
            }
            grouped[dateKey].events.push(event);
          }
        } catch (e) {
          console.warn(`Error parsing date for event ${event.id}: ${event.eventStart}`, e);
        }
      }
    });

    Object.values(grouped).forEach(group => {
      group.events.sort((a, b) => {
        try {
          return compareAsc(parseISO(a.eventStart!), parseISO(b.eventStart!));
        } catch {
          return 0;
        }
      });
    });

    return Object.entries(grouped)
      .map(([dateKey, groupData]) => ({
        date: dateKey,
        formattedDate: format(groupData.dateObj, 'EEEE, MMMM d'),
        events: groupData.events,
      }))
      .sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)));

  }, [events]);

  if (loading) {
    return (
      <div className="container-custom py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-xl text-slate-600">Loading Events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-12">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 text-center flex flex-col items-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
          <h2 className="text-lg font-bold mb-2">Error Loading Events</h2>
          <p>{error}</p>
          <button 
            className="mt-4 btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="bg-primary text-white py-16">
        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-6">Events Schedule</h1>
          <p className="text-xl max-w-3xl">
            Browse the complete schedule of events for the Grand Proclamation weekend.
            Filter by day or event type to find the ceremonies and activities you're interested in.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8 bg-slate-50 p-6 rounded-lg shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                <Filter className="w-5 h-5 mr-2 text-primary" />
                <span className="font-semibold">Filters:</span>
              </div>
              
              <div className="flex-grow md:flex-grow-0">
                <select
                  value={filterType || ''}
                  onChange={e => setFilterType(e.target.value ? e.target.value : null)}
                  className="w-full md:w-auto px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  title="Filter events by type"
                  aria-label="Filter events by type"
                >
                  <option value="">All Event Types</option>
                  {uniqueTypes.map(type => (
                    type ? <option key={type} value={type}>{type}</option> : null
                  ))}
                </select>
              </div>
              
              {filterType && (
                <button
                  onClick={() => setFilterType(null)}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {eventsGroupedAndSortedByDate.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-primary">Schedule Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {eventsGroupedAndSortedByDate.map(dayGroup => (
                  <div key={dayGroup.date} className="bg-slate-50 p-6 rounded-lg shadow-sm border-l-4 border-primary">
                    <div className="flex items-center mb-3">
                      <Calendar className="w-5 h-5 text-primary mr-2" />
                      <h3 className="text-lg font-bold">{dayGroup.formattedDate}</h3>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {dayGroup.events.map(event => (
                        <li key={event.id}>
                          <Link 
                            to={`/events/${event.slug}`} 
                            className="text-primary hover:underline"
                            title={event.time || 'Time TBC'}
                          >
                            {event.title || 'Untitled Event'}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-6 text-primary">
            {loading ? 'Loading...' : `${eventsGroupedAndSortedByDate.flatMap(g => g.events).length} ${eventsGroupedAndSortedByDate.flatMap(g => g.events).length === 1 ? 'Child Event' : 'Child Events'}`}
            {filterType ? ` (${filterType})` : ''}
          </h2>
          
          {loading && events.length === 0 ? (
            <p>Loading events...</p> 
          ) : !loading && events.length === 0 && !filterType ? (
             <div className="text-center py-12 bg-slate-50 rounded-lg">
               <p className="text-lg text-slate-700">No events are currently scheduled.</p>
            </div>
          ) : !loading && events.length === 0 && filterType ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-lg text-slate-700">No events match your current filter.</p>
              <button
                onClick={() => setFilterType(null)}
                className="mt-4 btn-outline"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsGroupedAndSortedByDate.map(dayGroup => (
                dayGroup.events.map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              ))}
            </div>
          )}

          {!loading && totalCount && events.length < totalCount && (
            <div className="text-center mt-12">
              <button 
                onClick={handleLoadMore} 
                disabled={isLoadingMore}
                className="btn-primary disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                ) : null}
                Load More Events
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default EventsPage;