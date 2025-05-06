import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { DataTable } from '../../components/admin/ui';
import adminAPI from '../../lib/api/admin';
import { QueryParams } from '../../lib/api/admin/adminApiService';
import * as EventTypes from '../../shared/types/event';

const PackageEventsAddPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = React.useState<EventTypes.EventType[]>([]);
  const [packageEvents, setPackageEvents] = React.useState<string[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [addingEvents, setAddingEvents] = React.useState(false);
  const [selectedEvents, setSelectedEvents] = React.useState<string[]>([]);
  const [success, setSuccess] = React.useState<string | null>(null);
  
  // Pagination state
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  
  // Sorting state
  const [sortBy, setSortBy] = React.useState('title');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  
  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Fetch events already in the package
  React.useEffect(() => {
    const fetchPackageEvents = async () => {
      if (!id) return;
      
      try {
        const response = await adminAPI.packages.getPackageEvents(id);
        
        if (response.error) {
          console.error('Error fetching package events:', response.error);
          return;
        }
        
        if (response.data) {
          setPackageEvents(response.data.map(event => event.id));
        }
      } catch (err) {
        console.error('Error fetching package events:', err);
      }
    };
    
    fetchPackageEvents();
  }, [id]);
  
  // Fetch available events
  React.useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      
      try {
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
  
  // Handle selection change
  const handleSelectionChange = (selectedIds: any[]) => {
    setSelectedEvents(selectedIds);
  };
  
  // Handle add events to package
  const handleAddEvents = async () => {
    if (!id || selectedEvents.length === 0) return;
    
    setAddingEvents(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Add each selected event to the package
      const promises = selectedEvents.map(eventId => 
        adminAPI.packages.addEventToPackage(id, { event_id: eventId })
      );
      
      const results = await Promise.all(promises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        setError(`Failed to add ${errors.length} events to the package.`);
      } else {
        setSuccess(`Successfully added ${selectedEvents.length} events to the package.`);
        setSelectedEvents([]);
        
        // Update the list of package events
        setPackageEvents(prev => [...prev, ...selectedEvents]);
      }
    } catch (err: any) {
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setAddingEvents(false);
    }
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
        if (!event.eventStart) return 'N/A';
        
        const startDate = new Date(event.eventStart);
        const endDate = event.eventEnd ? new Date(event.eventEnd) : null;
        
        // Format dates
        const formattedStart = startDate.toLocaleDateString();
        const formattedEnd = endDate ? endDate.toLocaleDateString() : null;
        
        // If same day event or no end date
        if (!endDate || formattedStart === formattedEnd) {
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
      id: 'status',
      header: 'Status',
      accessor: (event: EventTypes.EventType) => {
        const isInPackage = packageEvents.includes(event.id);
        
        if (isInPackage) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Already in package
            </span>
          );
        }
        
        return null;
      }
    }
  ];
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/admin-portal/packages/${id}/view`)}
              className="mr-4 text-indigo-600 hover:text-indigo-900"
            >
              <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Add Events to Package</h1>
          </div>
          <button
            onClick={handleAddEvents}
            disabled={selectedEvents.length === 0 || addingEvents}
            className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              selectedEvents.length === 0 || addingEvents
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Selected Events ({selectedEvents.length})
          </button>
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
        
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-4 bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-700">
            Select events to add to this package. Events already in the package will be marked as "Already in package".
          </p>
        </div>
        
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
          selectable={true}
          selectedRows={selectedEvents}
          onSelectionChange={handleSelectionChange}
          keyField="id"
        />
      </div>
    </div>
  );
};

export default PackageEventsAddPage;