import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DetailView, DetailSection } from '../../components/admin/ui';
import ConfirmDialog from '../../components/admin/ui/ConfirmDialog';
import adminAPI from '../../lib/api/admin';
import { AdminEventDetails } from '../../lib/api/admin/eventAdminService';
import * as EventTypes from '../../shared/types/event';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = React.useState<AdminEventDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  // Fetch event details
  React.useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await adminAPI.events.getEvent(id);
        
        if (response.error) {
          setError(`Failed to fetch event: ${response.error.message}`);
          return;
        }
        
        setEvent(response.data);
      } catch (err: any) {
        setError(`An unexpected error occurred: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id]);
  
  // Delete event
  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    
    try {
      const response = await adminAPI.events.deleteEvent(id);
      
      if (response.error) {
        setError(`Failed to delete event: ${response.error.message}`);
        setDeleteDialogOpen(false);
      } else {
        // Navigate back to events list
        navigate('/admin-portal/events');
      }
    } catch (err: any) {
      setError(`An unexpected error occurred: ${err.message}`);
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Format detail sections
  const getSections = (): DetailSection[] => {
    if (!event) return [];
    
    const mainSection: DetailSection = {
      title: 'Event Details',
      fields: [
        { label: 'Title', value: event.title },
        { label: 'Description', value: event.description || 'No description', type: 'text' },
        { 
          label: 'Event Start', 
          value: new Date(event.eventStart).toLocaleString(), 
          type: 'date' 
        },
        { 
          label: 'Event End', 
          value: new Date(event.eventEnd).toLocaleString(), 
          type: 'date' 
        },
        { label: 'Location', value: event.location || 'No location specified' },
        { label: 'Type', value: event.type || 'Not specified' },
        { 
          label: 'Featured', 
          value: !!event.featured,
          type: 'boolean'
        },
        { 
          label: 'Multi-day Event', 
          value: !!event.isMultiDay,
          type: 'boolean'
        },
        { 
          label: 'Individually Purchasable', 
          value: !!event.isPurchasableIndividually,
          type: 'boolean'
        }
      ]
    };
    
    // Add location details if available
    if (event.latitude && event.longitude) {
      mainSection.fields.push(
        { label: 'Latitude', value: event.latitude },
        { label: 'Longitude', value: event.longitude }
      );
    }
    
    // Add image if available
    if (event.imageUrl) {
      mainSection.fields.push({
        label: 'Event Image',
        value: event.imageUrl,
        type: 'image'
      });
    }
    
    // Add capacity info if available
    const capacitySection: DetailSection = {
      title: 'Capacity and Availability',
      fields: []
    };
    
    if (event.capacity) {
      capacitySection.fields = [
        { label: 'Maximum Capacity', value: event.capacity.max_capacity },
        { label: 'Reserved Tickets', value: event.capacity.reserved_count },
        { label: 'Sold Tickets', value: event.capacity.sold_count },
        { 
          label: 'Available Tickets', 
          value: Math.max(0, event.capacity.max_capacity - (event.capacity.reserved_count + event.capacity.sold_count)) 
        }
      ];
    } else {
      capacitySection.fields.push({
        label: 'Capacity',
        value: 'No capacity information available'
      });
    }
    
    // Add ticket definitions if available
    const ticketsSection: DetailSection = {
      title: 'Ticket Types',
      fields: []
    };
    
    if (event.ticketDefinitions && event.ticketDefinitions.length > 0) {
      event.ticketDefinitions.forEach((ticket, index) => {
        ticketsSection.fields.push({
          label: `Ticket ${index + 1}`,
          value: (
            <div>
              <p className="font-medium">{ticket.name}</p>
              <p className="text-sm text-gray-500">{ticket.description}</p>
              <p className="text-sm mt-1">
                <span className="font-medium">Price:</span> ${ticket.price.toFixed(2)}
              </p>
              {ticket.availability_type && (
                <p className="text-sm">
                  <span className="font-medium">Availability:</span> {ticket.availability_type}
                </p>
              )}
            </div>
          ),
          type: 'custom'
        });
      });
    } else {
      ticketsSection.fields.push({
        label: 'Tickets',
        value: 'No ticket types defined'
      });
    }
    
    // Add child events if applicable
    const childEventsSection: DetailSection = {
      title: 'Child Events',
      fields: []
    };
    
    if (event.childEvents && event.childEvents.length > 0) {
      childEventsSection.fields.push({
        label: 'Child Events',
        value: event.childEvents.map(child => child.title),
        type: 'list'
      });
    } else {
      childEventsSection.fields.push({
        label: 'Child Events',
        value: 'No child events'
      });
    }
    
    // Return all sections
    const sections = [mainSection, capacitySection, ticketsSection];
    
    // Only add child events section if this is a parent event
    if (!event.parentEventId) {
      sections.push(childEventsSection);
    }
    
    return sections;
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <DetailView
          title={event?.title || 'Event Details'}
          subtitle={event?.description?.substring(0, 100) || ''}
          sections={getSections()}
          loading={loading}
          error={error || undefined}
          backTo="/admin-portal/events"
          backLabel="Back to Events"
          editPath={id ? `/admin-portal/events/${id}/edit` : undefined}
          onDelete={() => setDeleteDialogOpen(true)}
        />
      </div>
      
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        confirmType="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        isProcessing={isDeleting}
      />
    </div>
  );
};

export default EventDetailPage;