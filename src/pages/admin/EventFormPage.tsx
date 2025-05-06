import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminForm } from '../../components/admin/ui';
import adminAPI from '../../lib/api/admin';
import { EventCreateRequest } from '../../lib/api/admin/eventAdminService';
import * as EventTypes from '../../shared/types/event';

// Define event types for dropdown
const EVENT_TYPES = [
  { value: 'Conference', label: 'Conference' },
  { value: 'Ceremony', label: 'Ceremony' },
  { value: 'Dinner', label: 'Dinner' },
  { value: 'Social', label: 'Social' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Workshop', label: 'Workshop' },
  { value: 'Other', label: 'Other' }
];

const EventFormPage: React.FC = () => {
  const { id, mode } = useParams<{ id?: string; mode?: 'edit' | 'new' }>();
  const isNewEvent = !id || mode === 'new';
  const navigate = useNavigate();
  const [event, setEvent] = React.useState<Partial<EventCreateRequest>>({});
  const [loading, setLoading] = React.useState(!isNewEvent);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Fetch event details if editing
  React.useEffect(() => {
    const fetchEvent = async () => {
      if (isNewEvent) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await adminAPI.events.getEvent(id!);
        
        if (response.error) {
          setError(`Failed to fetch event: ${response.error.message}`);
          return;
        }
        
        if (response.data) {
          // Format dates for form inputs
          const startDate = new Date(response.data.eventStart);
          const endDate = new Date(response.data.eventEnd);
          
          // Format as ISO string and remove milliseconds
          const formattedStart = startDate.toISOString().slice(0, 19);
          const formattedEnd = endDate.toISOString().slice(0, 19);
          
          setEvent({
            ...response.data,
            eventStart: formattedStart,
            eventEnd: formattedEnd
          });
        }
      } catch (err: any) {
        setError(`An unexpected error occurred: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id, isNewEvent]);
  
  // Handle form submission
  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const eventData: EventCreateRequest = {
        title: values.title,
        slug: values.slug || generateSlug(values.title),
        description: values.description,
        eventStart: values.eventStart,
        eventEnd: values.eventEnd,
        location: values.location,
        latitude: values.latitude ? parseFloat(values.latitude) : undefined,
        longitude: values.longitude ? parseFloat(values.longitude) : undefined,
        type: values.type,
        imageUrl: values.imageUrl,
        isMultiDay: values.isMultiDay,
        parentEventId: values.parentEventId || null,
        eventIncludes: values.eventIncludes 
          ? values.eventIncludes.split('\n').filter(Boolean) 
          : null,
        importantInformation: values.importantInformation,
        isPurchasableIndividually: values.isPurchasableIndividually,
        featured: values.featured
      };
      
      let response;
      
      if (isNewEvent) {
        response = await adminAPI.events.createEvent(eventData);
      } else {
        response = await adminAPI.events.updateEvent(id!, eventData);
      }
      
      if (response.error) {
        setError(`Failed to ${isNewEvent ? 'create' : 'update'} event: ${response.error.message}`);
        return;
      }
      
      // Navigate to event detail page
      navigate(`/admin-portal/events/${response.data?.id || id}/view`);
    } catch (err: any) {
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  // Form sections definition
  const formSections = [
    {
      title: 'Basic Information',
      fields: [
        {
          id: 'title',
          label: 'Event Title',
          type: 'text' as const,
          required: true,
          placeholder: 'Enter event title'
        },
        {
          id: 'slug',
          label: 'URL Slug',
          type: 'text' as const,
          placeholder: 'Enter URL slug (auto-generated if left blank)',
          helperText: 'Used in the event URL. Will be auto-generated from title if left blank.'
        },
        {
          id: 'description',
          label: 'Description',
          type: 'textarea' as const,
          placeholder: 'Enter event description',
          rows: 4
        },
        {
          id: 'type',
          label: 'Event Type',
          type: 'select' as const,
          options: EVENT_TYPES
        },
        {
          id: 'featured',
          label: 'Featured Event',
          type: 'checkbox' as const,
          placeholder: 'Display this event in featured sections'
        }
      ]
    },
    {
      title: 'Date and Time',
      fields: [
        {
          id: 'eventStart',
          label: 'Start Date and Time',
          type: 'datetime-local' as const,
          required: true
        },
        {
          id: 'eventEnd',
          label: 'End Date and Time',
          type: 'datetime-local' as const,
          required: true
        },
        {
          id: 'isMultiDay',
          label: 'Multi-day Event',
          type: 'checkbox' as const,
          placeholder: 'This event spans multiple days'
        }
      ]
    },
    {
      title: 'Location',
      fields: [
        {
          id: 'location',
          label: 'Location Name',
          type: 'text' as const,
          placeholder: 'Enter venue or location name'
        },
        {
          id: 'latitude',
          label: 'Latitude',
          type: 'number' as const,
          step: 'any',
          placeholder: 'Enter latitude coordinate'
        },
        {
          id: 'longitude',
          label: 'Longitude',
          type: 'number' as const,
          step: 'any',
          placeholder: 'Enter longitude coordinate'
        }
      ]
    },
    {
      title: 'Additional Information',
      fields: [
        {
          id: 'imageUrl',
          label: 'Event Image URL',
          type: 'text' as const,
          placeholder: 'Enter image URL'
        },
        {
          id: 'eventIncludes',
          label: 'What This Event Includes',
          type: 'textarea' as const,
          placeholder: 'Enter each included item on a new line',
          rows: 3,
          helperText: 'List each included item on a separate line'
        },
        {
          id: 'importantInformation',
          label: 'Important Information',
          type: 'textarea' as const,
          placeholder: 'Enter important information about this event',
          rows: 3
        },
        {
          id: 'isPurchasableIndividually',
          label: 'Individually Purchasable',
          type: 'checkbox' as const,
          placeholder: 'This event can be purchased individually'
        }
      ]
    }
  ];
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          {isNewEvent ? 'Create New Event' : 'Edit Event'}
        </h1>
        
        <AdminForm
          title={isNewEvent ? 'Event Details' : 'Edit Event Details'}
          description={isNewEvent
            ? 'Create a new event with the information below.'
            : 'Update the event information below.'}
          sections={formSections}
          initialValues={event}
          isLoading={loading}
          error={error || undefined}
          submitButtonText={isNewEvent ? 'Create Event' : 'Update Event'}
          onSubmit={handleSubmit}
          backTo="/admin-portal/events"
        />
      </div>
    </div>
  );
};

export default EventFormPage;