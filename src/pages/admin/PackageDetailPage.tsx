import * as React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { DetailView } from '../../components/admin/ui';
import ConfirmDialog from '../../components/admin/ui/ConfirmDialog';
import adminAPI from '../../lib/api/admin';
import { AdminPackageDetails } from '../../lib/api/admin/packageAdminService';

const PackageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [packageData, setPackageData] = React.useState<AdminPackageDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [removeEventDialogOpen, setRemoveEventDialogOpen] = React.useState(false);
  const [eventToRemove, setEventToRemove] = React.useState<string | null>(null);
  const [isRemovingEvent, setIsRemovingEvent] = React.useState(false);

  // Fetch package details
  React.useEffect(() => {
    const fetchPackageDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await adminAPI.packages.getPackage(id);
        
        if (response.error) {
          setError(`Failed to fetch package details: ${response.error.message}`);
          return;
        }
        
        setPackageData(response.data);
      } catch (err: any) {
        setError(`An unexpected error occurred: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPackageDetails();
  }, [id]);

  // Delete package
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    
    try {
      const response = await adminAPI.packages.deletePackage(id);
      
      if (response.error) {
        setError(`Failed to delete package: ${response.error.message}`);
        setDeleteDialogOpen(false);
      } else {
        // Navigate back to packages list
        navigate('/admin-portal/packages');
      }
    } catch (err: any) {
      setError(`An unexpected error occurred: ${err.message}`);
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Remove event from package
  const handleRemoveEventClick = (eventId: string) => {
    setEventToRemove(eventId);
    setRemoveEventDialogOpen(true);
  };
  
  const confirmRemoveEvent = async () => {
    if (!id || !eventToRemove) return;
    
    setIsRemovingEvent(true);
    
    try {
      const response = await adminAPI.packages.removeEventFromPackage(id, eventToRemove);
      
      if (response.error) {
        setError(`Failed to remove event: ${response.error.message}`);
      } else {
        // Update local state to reflect the change
        if (packageData && packageData.events) {
          setPackageData({
            ...packageData,
            events: packageData.events.filter(event => event.id !== eventToRemove)
          });
        }
      }
    } catch (err: any) {
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setIsRemovingEvent(false);
      setRemoveEventDialogOpen(false);
      setEventToRemove(null);
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-4">Loading package details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-yellow-50 p-4 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">No Data</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Package not found or no data available.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sections for the DetailView
  const sections = [
    {
      title: 'Package Details',
      fields: [
        {
          label: 'Name',
          value: packageData.name
        },
        {
          label: 'Description',
          value: packageData.description || 'No description provided'
        },
        {
          label: 'Created',
          value: new Date(packageData.created_at).toLocaleString()
        },
        {
          label: 'Parent Event',
          value: packageData.parent_event_id ? (
            <Link 
              to={`/admin-portal/events/${packageData.parent_event_id}/view`}
              className="text-indigo-600 hover:text-indigo-900"
            >
              View Event Details
            </Link>
          ) : 'None'
        }
      ]
    },
    {
      title: 'What\'s Included',
      fields: packageData.includes_description && packageData.includes_description.length > 0 ? [
        {
          label: 'Included Items',
          value: (
            <ul className="list-disc pl-5">
              {packageData.includes_description.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )
        }
      ] : [
        {
          label: 'Included Items',
          value: 'No included items specified'
        }
      ]
    },
    {
      title: 'Capacity Information',
      fields: packageData.capacity ? [
        {
          label: 'Maximum Capacity',
          value: packageData.capacity.max,
          icon: <UsersIcon className="h-5 w-5 text-gray-400" />
        },
        {
          label: 'Available',
          value: packageData.capacity.available,
          variant: 'success'
        },
        {
          label: 'Reserved',
          value: packageData.capacity.reserved,
          variant: 'warning'
        },
        {
          label: 'Sold',
          value: packageData.capacity.sold,
          variant: 'info'
        }
      ] : [
        {
          label: 'Capacity',
          value: 'No capacity information available'
        }
      ]
    },
    {
      title: 'Included Events',
      customContent: (
        <div className="mt-4">
          {packageData.events && packageData.events.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Events ({packageData.events.length})</h3>
                <Link 
                  to={`/admin-portal/packages/${id}/events/add`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="-ml-0.5 mr-1 h-4 w-4" /> Add Event
                </Link>
              </div>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Event Title</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Location</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {packageData.events.map(event => (
                      <tr key={event.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {event.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {event.eventStart ? new Date(event.eventStart).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {event.location || 'N/A'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-3">
                            <Link 
                              to={`/admin-portal/events/${event.id}/view`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleRemoveEventClick(event.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding an event to this package.</p>
              <div className="mt-6">
                <Link
                  to={`/admin-portal/packages/${id}/events/add`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add Event
                </Link>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Value-Added Services',
      customContent: (
        <div className="mt-4">
          {packageData.valueAddedServices && packageData.valueAddedServices.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">VAS ({packageData.valueAddedServices.length})</h3>
                <Link 
                  to={`/admin-portal/packages/${id}/vas/add`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="-ml-0.5 mr-1 h-4 w-4" /> Add VAS
                </Link>
              </div>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Service</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Price</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {packageData.valueAddedServices.map(vas => (
                      <tr key={vas.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {vas.value_added_services?.name || 'Unknown Service'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${vas.price_override || vas.value_added_services?.price || 0}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-3">
                            <Link
                              to={`/admin-portal/vas/${vas.vas_id}/view`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </Link>
                            <button
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No value-added services</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a value-added service to this package.</p>
              <div className="mt-6">
                <Link
                  to={`/admin-portal/packages/${id}/vas/add`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add VAS
                </Link>
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin-portal/packages')}
              className="mr-4 text-indigo-600 hover:text-indigo-900"
            >
              <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">{packageData.name}</h1>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/admin-portal/packages/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Edit
            </Link>
            <button
              onClick={handleDeleteClick}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Delete
            </button>
          </div>
        </div>
        
        <DetailView sections={sections} />
      </div>
      
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Package"
        message="Are you sure you want to delete this package? This action cannot be undone."
        confirmText="Delete"
        confirmType="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        isProcessing={isDeleting}
      />
      
      <ConfirmDialog
        isOpen={removeEventDialogOpen}
        title="Remove Event"
        message="Are you sure you want to remove this event from the package? This will not delete the event itself."
        confirmText="Remove"
        confirmType="warning"
        onConfirm={confirmRemoveEvent}
        onCancel={() => {
          setRemoveEventDialogOpen(false);
          setEventToRemove(null);
        }}
        isProcessing={isRemovingEvent}
      />
    </div>
  );
};

export default PackageDetailPage;