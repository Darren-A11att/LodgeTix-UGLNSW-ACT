import * as React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import adminAPI from '../../lib/api/admin';
import { EventCapacityUpdate } from '../../lib/api/admin/eventAdminService';

const EventCapacityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = React.useState<any>(null);
  const [capacity, setCapacity] = React.useState<{
    maxCapacity: number;
    reservedCount: number;
    soldCount: number;
  }>({
    maxCapacity: 0,
    reservedCount: 0,
    soldCount: 0
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  
  // Fetch event and capacity details
  React.useEffect(() => {
    const fetchEventAndCapacity = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch event details
        const eventResponse = await adminAPI.events.getEvent(id);
        
        if (eventResponse.error) {
          setError(`Failed to fetch event: ${eventResponse.error.message}`);
          return;
        }
        
        setEvent(eventResponse.data);
        
        // Fetch capacity details
        const capacityResponse = await adminAPI.events.getEventCapacity(id);
        
        if (capacityResponse.error) {
          setError(`Failed to fetch capacity: ${capacityResponse.error.message}`);
          return;
        }
        
        if (capacityResponse.data) {
          setCapacity({
            maxCapacity: capacityResponse.data.max_capacity,
            reservedCount: capacityResponse.data.reserved_count,
            soldCount: capacityResponse.data.sold_count
          });
        }
      } catch (err: any) {
        setError(`An unexpected error occurred: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventAndCapacity();
  }, [id]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const capacityData: EventCapacityUpdate = {
        maxCapacity: capacity.maxCapacity
      };
      
      const response = await adminAPI.events.updateEventCapacity(id, capacityData);
      
      if (response.error) {
        setError(`Failed to update capacity: ${response.error.message}`);
        return;
      }
      
      // Update capacity state with the response
      if (response.data) {
        setCapacity({
          maxCapacity: response.data.max_capacity,
          reservedCount: response.data.reserved_count,
          soldCount: response.data.sold_count
        });
      }
      
      setSuccessMessage('Capacity updated successfully');
    } catch (err: any) {
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle input change
  const handleMaxCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    
    if (!isNaN(value) && value >= 0) {
      setCapacity(prev => ({
        ...prev,
        maxCapacity: value
      }));
    }
  };
  
  // Calculate available capacity
  const availableCapacity = Math.max(0, capacity.maxCapacity - (capacity.reservedCount + capacity.soldCount));
  
  // Calculate usage percentage
  const usagePercentage = capacity.maxCapacity > 0
    ? Math.round(((capacity.reservedCount + capacity.soldCount) / capacity.maxCapacity) * 100)
    : 0;
  
  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6">
          <Link
            to={`/admin-portal/events/${id}/view`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back to Event
          </Link>
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          {event?.title || 'Event'} - Capacity Management
        </h1>
        <p className="text-gray-500 mb-6">
          Manage the maximum capacity for this event and view current usage.
        </p>
        
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
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
        
        {successMessage && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{successMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Current Capacity</h3>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Capacity</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{capacity.maxCapacity}</dd>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">Used</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {capacity.reservedCount + capacity.soldCount}
                      <span className="ml-2 text-base font-normal text-gray-500">
                        ({usagePercentage}%)
                      </span>
                    </dd>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">Available</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{availableCapacity}</dd>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                        Capacity Usage
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-indigo-600">
                        {usagePercentage}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                    <div
                      style={{ width: `${usagePercentage}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                    ></div>
                  </div>
                  <div className="flex text-xs text-gray-500">
                    <div className="w-1/2 text-left">
                      Reserved: {capacity.reservedCount}
                    </div>
                    <div className="w-1/2 text-right">
                      Sold: {capacity.soldCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Update Capacity</h3>
              <div className="mt-1 text-sm text-gray-500">
                <div className="rounded-md bg-blue-50 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-blue-700">
                        Increasing capacity will allow more tickets to be purchased.
                        Decreasing capacity is only allowed if the new capacity exceeds the current number of reserved and sold tickets.
                      </p>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="sm:flex sm:items-center">
                    <div className="w-full sm:max-w-xs">
                      <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-700">
                        Max Capacity
                      </label>
                      <input
                        type="number"
                        name="maxCapacity"
                        id="maxCapacity"
                        min={capacity.reservedCount + capacity.soldCount}
                        value={capacity.maxCapacity}
                        onChange={handleMaxCapacityChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-4">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Updating...' : 'Update Capacity'}
                      </button>
                    </div>
                  </div>
                  
                  {capacity.maxCapacity < (capacity.reservedCount + capacity.soldCount) && (
                    <p className="mt-2 text-sm text-red-600">
                      New capacity cannot be less than the current number of reserved and sold tickets ({capacity.reservedCount + capacity.soldCount}).
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCapacityPage;