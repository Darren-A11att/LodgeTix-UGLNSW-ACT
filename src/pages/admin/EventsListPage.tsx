import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { DataTable } from '../../components/admin/ui';
import ConfirmDialog from '../../components/admin/ui/ConfirmDialog';
import adminAPI from '../../lib/api/admin';
import { QueryParams } from '../../lib/api/admin/adminApiService';
import * as EventTypes from '../../shared/types/event';

const EventsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = React.useState<EventTypes.EventType[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [eventToDelete, setEventToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  // Pagination state
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  
  // Sorting state
  const [sortBy, setSortBy] = React.useState('eventStart');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  
  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Fetch events on component mount and when pagination/sort/search changes
  React.useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const filters: Record<string, any> = {};
        
        // Build query params
        const params: QueryParams = {
          pagination: {
            page: pageIndex + 1,
            limit: pageSize
          },
          sort: {
            column: sortBy,
            ascending: sortDirection === 'asc'
          }
        };
        
        // Add search if provided
        if (searchQuery) {
          params.search = {
            columns: ['title', 'description', 'location'],
            query: searchQuery
          };
        }
        
        const response = await adminAPI.events.getEvents(params);
        
        if (response.error) {
          setError(`Failed to fetch events: ${response.error.message}`);
          return;
        }
        
        setEvents(response.data || []);
        setTotalCount(response.count || 0);
      } catch (err: any) {
        setError(`An unexpected error occurred: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [pageIndex, pageSize, sortBy, sortDirection, searchQuery]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
  };
  
  // Handle sort change
  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortBy(column);
    setSortDirection(direction);
  };
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPageIndex(0); // Reset to first page on new search
  };
  
  // Delete event
  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!eventToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await adminAPI.events.deleteEvent(eventToDelete);
      
      if (response.error) {
        setError(`Failed to delete event: ${response.error.message}`);
      } else {
        // Remove the deleted event from the list
        setEvents(events.filter(event => event.id !== eventToDelete));
        
        if (totalCount > 0) {
          setTotalCount(totalCount - 1);
        }
      }
    } catch (err: any) {
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setEventToDelete(null);
  };
  
  // Table columns definition
  const columns = [
    {
      id: 'title',
      header: 'Title',
      accessor: (event: EventTypes.EventType) => (
        <div className="font-medium text-gray-900">{event.title}</div>
      ),
      sortable: true
    },
    {
      id: 'eventStart',
      header: 'Date',
      accessor: (event: EventTypes.EventType) => {
        const startDate = new Date(event.eventStart);
        const endDate = new Date(event.eventEnd);
        
        // Format dates
        const formattedStart = startDate.toLocaleDateString();
        const formattedEnd = endDate.toLocaleDateString();
        
        // If same day event
        if (formattedStart === formattedEnd) {
          return formattedStart;
        }
        
        return `${formattedStart} - ${formattedEnd}`;
      },
      sortable: true
    },
    {
      id: 'location',
      header: 'Location',
      accessor: (event: EventTypes.EventType) => event.location || 'N/A',
      sortable: true
    },
    {
      id: 'type',
      header: 'Type',
      accessor: (event: EventTypes.EventType) => {
        const eventType = event.type || 'Unknown';
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {eventType}
          </span>
        );
      },
      sortable: true
    },
    {
      id: 'featured',
      header: 'Featured',
      accessor: (event: EventTypes.EventType) => {
        return event.featured ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            No
          </span>
        );
      },
      sortable: true
    }
  ];
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
          <Link
            to="/admin-portal/events/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Event
          </Link>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DataTable
          columns={columns}
          data={events}
          totalItems={totalCount}
          loading={loading}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          searchable={true}
          onSearch={handleSearch}
          actionColumn={{
            header: 'Actions',
            render: (event: EventTypes.EventType) => (
              <div className="flex justify-end space-x-3">
                <Link
                  to={`/admin-portal/events/${event.id}/view`}
                  className="text-indigo-600 hover:text-indigo-900"
                  title="View"
                >
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link
                  to={`/admin-portal/events/${event.id}/edit`}
                  className="text-indigo-600 hover:text-indigo-900"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
                <button
                  onClick={() => handleDeleteClick(event.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )
          }}
        />
      </div>
      
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        confirmType="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isProcessing={isDeleting}
      />
    </div>
  );
};

export default EventsListPage;