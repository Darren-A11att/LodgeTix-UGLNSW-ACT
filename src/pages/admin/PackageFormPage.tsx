import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { AdminForm } from '../../components/admin/ui';
import adminAPI from '../../lib/api/admin';
import { PackageCreateRequest, AdminPackageDetails } from '../../lib/api/admin/packageAdminService';
import * as EventTypes from '../../shared/types/event';

const PackageFormPage: React.FC = () => {
  const { id, mode } = useParams<{ id?: string; mode: 'new' | 'edit' }>();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(!!id);
  const [error, setError] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<EventTypes.EventType[]>([]);
  const [initialValues, setInitialValues] = React.useState<Partial<PackageCreateRequest>>({
    name: '',
    description: '',
    parent_event_id: '',
    includes_description: []
  });

  // Fetch events for the parent event dropdown
  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await adminAPI.events.getEvents({});
        
        if (response.error) {
          console.error('Error fetching events:', response.error);
          return;
        }
        
        setEvents(response.data || []);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };
    
    fetchEvents();
  }, []);

  // Fetch package data if editing
  React.useEffect(() => {
    const fetchPackageData = async () => {
      if (!id) {
        setInitialLoading(false);
        return;
      }
      
      try {
        const response = await adminAPI.packages.getPackage(id);
        
        if (response.error) {
          setError(`Failed to fetch package data: ${response.error.message}`);
          setInitialLoading(false);
          return;
        }
        
        if (response.data) {
          const packageData = response.data as AdminPackageDetails;
          
          setInitialValues({
            name: packageData.name,
            description: packageData.description || '',
            parent_event_id: packageData.parent_event_id || '',
            includes_description: packageData.includes_description || []
          });
        }
      } catch (err: any) {
        setError(`An unexpected error occurred: ${err.message}`);
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchPackageData();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (values: Record<string, any>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert includes_description from comma-separated string to array if needed
      let includesDescription: string[] = [];
      
      if (typeof values.includes_description === 'string') {
        includesDescription = values.includes_description
          .split('\n')
          .map((item: string) => item.trim())
          .filter((item: string) => item);
      } else if (Array.isArray(values.includes_description)) {
        includesDescription = values.includes_description;
      }
      
      // Prepare the package data
      const packageData: PackageCreateRequest = {
        name: values.name,
        description: values.description,
        parent_event_id: values.parent_event_id || null,
        includes_description: includesDescription
      };
      
      let response;
      
      // Create or update based on mode
      if (id) {
        response = await adminAPI.packages.updatePackage(id, packageData);
      } else {
        response = await adminAPI.packages.createPackage(packageData);
      }
      
      if (response.error) {
        setError(`Failed to ${id ? 'update' : 'create'} package: ${response.error.message}`);
        return;
      }
      
      // Navigate to package detail page
      navigate(`/admin-portal/packages/${response.data?.id || id}/view`);
    } catch (err: any) {
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    if (id) {
      navigate(`/admin-portal/packages/${id}/view`);
    } else {
      navigate('/admin-portal/packages');
    }
  };

  if (initialLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-4">Loading package data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Define form sections and fields
  const formSections = [
    {
      title: 'Basic Information',
      description: 'Enter the basic details for this package.',
      fields: [
        {
          id: 'name',
          label: 'Package Name',
          type: 'text' as const,
          required: true,
          placeholder: 'Enter package name',
          defaultValue: initialValues.name
        },
        {
          id: 'description',
          label: 'Description',
          type: 'textarea' as const,
          placeholder: 'Enter package description',
          rows: 4,
          defaultValue: initialValues.description
        },
        {
          id: 'parent_event_id',
          label: 'Parent Event',
          type: 'select' as const,
          placeholder: 'Select parent event',
          helperText: 'Optional. Associate this package with a parent event.',
          defaultValue: initialValues.parent_event_id,
          options: [
            { label: 'None', value: '' },
            ...events.map(event => ({
              label: event.title,
              value: event.id
            }))
          ]
        }
      ]
    },
    {
      title: 'What\'s Included',
      description: 'Define what is included in this package.',
      fields: [
        {
          id: 'includes_description',
          label: 'Included Items',
          type: 'textarea' as const,
          placeholder: 'Enter each item on a new line',
          helperText: 'List what is included in this package. Enter each item on a new line.',
          rows: 6,
          defaultValue: Array.isArray(initialValues.includes_description) 
            ? initialValues.includes_description.join('\n') 
            : ''
        }
      ]
    }
  ];

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/admin-portal/packages')}
            className="mr-4 text-indigo-600 hover:text-indigo-900"
          >
            <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id ? 'Edit Package' : 'Create New Package'}
          </h1>
        </div>
        
        <AdminForm
          title={id ? 'Edit Package' : 'New Package'}
          description="Configure basic package information. You can add events and value-added services after creating the package."
          sections={formSections}
          initialValues={initialValues}
          isLoading={loading}
          error={error}
          submitButtonText={id ? 'Save Changes' : 'Create Package'}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          backTo="/admin-portal/packages"
        />
      </div>
    </div>
  );
};

export default PackageFormPage;