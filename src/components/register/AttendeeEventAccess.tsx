import React, { useEffect, useState } from 'react';
import { AttendeeAccessService, AttendeeAccess } from '../../lib/attendeeAccessService';

interface AttendeeEventAccessProps {
  attendeeId: string;
}

/**
 * Component to display an attendee's event access
 */
const AttendeeEventAccess: React.FC<AttendeeEventAccessProps> = ({ attendeeId }) => {
  const [accessRecords, setAccessRecords] = useState<AttendeeAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<Record<string, { title: string }>>({});

  useEffect(() => {
    if (!attendeeId) {
      setError('Attendee ID is required');
      setLoading(false);
      return;
    }

    // Load the attendee's access records
    const loadAccessRecords = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const records = await AttendeeAccessService.getAttendeeAccess(attendeeId);
        setAccessRecords(records);
        
        // Extract event IDs to fetch event details
        const eventIds = records.map(record => record.event_id);
        if (eventIds.length > 0) {
          await fetchEventDetails(eventIds);
        }
      } catch (err) {
        console.error('Error loading attendee access:', err);
        setError('Failed to load event access information');
      } finally {
        setLoading(false);
      }
    };

    loadAccessRecords();
  }, [attendeeId]);

  /**
   * Fetch event details for the given event IDs
   */
  const fetchEventDetails = async (eventIds: string[]) => {
    try {
      const { data, error } = await fetch('/api/events?ids=' + eventIds.join(','))
        .then(res => res.json());
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Build a mapping of event ID to event details
      const detailsMap: Record<string, { title: string }> = {};
      data.forEach((event: any) => {
        detailsMap[event.id] = { title: event.title };
      });
      
      setEventDetails(detailsMap);
    } catch (err) {
      console.error('Error fetching event details:', err);
    }
  };

  /**
   * Format the access source for display
   */
  const formatAccessSource = (source: string, sourceId: string | null): string => {
    switch (source) {
      case 'ticket':
        return 'Individual Ticket';
      case 'package':
        return 'Package';
      case 'manual':
        return 'Manually Granted';
      case 'comp':
        return 'Complimentary';
      default:
        return source;
    }
  };

  /**
   * Format the date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">Loading event access...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (accessRecords.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500">No event access records found for this attendee.</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Access Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price Paid
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Granted On
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {accessRecords.map((record) => (
            <tr key={record.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {eventDetails[record.event_id]?.title || 'Unknown Event'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatAccessSource(record.access_source, record.source_id)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${record.price_paid.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(record.access_granted_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {record.is_active ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Revoked
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendeeEventAccess;