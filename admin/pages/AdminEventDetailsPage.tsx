import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Tag, 
  Link as LinkIcon,
  Image,
  AlertTriangle,
  Trash2,
  Plus,
  Download,
  Upload,
  CheckCircle,
  Copy
} from 'lucide-react';
import { getAdminEventById, updateEvent, AdminEventDetail } from '../lib/api/events';

interface TabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ id, label, icon, isActive, onClick }) => (
  <button
    id={id}
    className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm ${
      isActive
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
    onClick={onClick}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </button>
);

// Event Form
const EventForm: React.FC<{
  event: AdminEventDetail | null;
  isLoading: boolean;
  onSave: (eventData: Partial<AdminEventDetail>) => void;
}> = ({ event, isLoading, onSave }) => {
  const [formData, setFormData] = useState<Partial<AdminEventDetail>>({
    title: '',
    slug: '',
    description: '',
    eventStart: '',
    eventEnd: '',
    location: '',
    capacity: 0,
    status: 'draft',
    type: '',
    importantInformation: '',
    inclusions: '',
    featuredImageUrl: ''
  });
  
  // Update form when event data is loaded
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        slug: event.slug,
        description: event.description,
        eventStart: event.eventStart ? new Date(event.eventStart).toISOString().slice(0, 16) : '',
        eventEnd: event.eventEnd ? new Date(event.eventEnd).toISOString().slice(0, 16) : '',
        location: event.location,
        capacity: event.capacity,
        status: event.status,
        type: event.type,
        importantInformation: event.importantInformation,
        inclusions: event.inclusions,
        featuredImageUrl: event.featuredImageUrl,
        parentEventId: event.parentEventId
      });
    }
  }, [event]);
  
  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle number inputs
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  // Generate slug from title
  const generateSlug = () => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      setFormData(prev => ({ ...prev, slug }));
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Event details and general information.
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Event Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                value={formData.title}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                Slug
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  required
                  className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                  value={formData.slug}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={generateSlug}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm hover:bg-gray-100"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                This will be used in the event URL: /events/{formData.slug}
              </p>
            </div>
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventStart" className="block text-sm font-medium text-gray-700">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                name="eventStart"
                id="eventStart"
                required
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                value={formData.eventStart}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="eventEnd" className="block text-sm font-medium text-gray-700">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                name="eventEnd"
                id="eventEnd"
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                value={formData.eventEnd || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              name="location"
              id="location"
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={formData.location}
              onChange={handleChange}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                Capacity
              </label>
              <input
                type="number"
                name="capacity"
                id="capacity"
                min="0"
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                value={formData.capacity}
                onChange={handleNumberChange}
              />
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Event Type
              </label>
              <select
                id="type"
                name="type"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="Social">Social</option>
                <option value="Ceremony">Ceremony</option>
                <option value="Conference">Conference</option>
                <option value="Dinner">Dinner</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Information Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Additional Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Extra details and featured content for the event.
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6 space-y-4">
          <div>
            <label htmlFor="importantInformation" className="block text-sm font-medium text-gray-700">
              Important Information
            </label>
            <textarea
              id="importantInformation"
              name="importantInformation"
              rows={2}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
              value={formData.importantInformation}
              onChange={handleChange}
            />
            <p className="mt-1 text-xs text-gray-500">
              Information that will be highlighted on the event page.
            </p>
          </div>
          
          <div>
            <label htmlFor="inclusions" className="block text-sm font-medium text-gray-700">
              Inclusions
            </label>
            <textarea
              id="inclusions"
              name="inclusions"
              rows={2}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
              value={formData.inclusions}
              onChange={handleChange}
            />
            <p className="mt-1 text-xs text-gray-500">
              What's included with the event (e.g., meals, drinks, etc.)
            </p>
          </div>
          
          <div>
            <label htmlFor="featuredImageUrl" className="block text-sm font-medium text-gray-700">
              Featured Image URL
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                name="featuredImageUrl"
                id="featuredImageUrl"
                className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                value={formData.featuredImageUrl}
                onChange={handleChange}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              URL to the featured image for this event.
            </p>
          </div>
          
          {formData.featuredImageUrl && (
            <div className="mt-2">
              <p className="block text-sm font-medium text-gray-700 mb-2">Image Preview</p>
              <div className="border border-gray-300 rounded-md overflow-hidden w-full max-w-md h-48 flex items-center justify-center">
                <img
                  src={formData.featuredImageUrl}
                  alt="Featured"
                  className="object-cover"
                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Image+Not+Found')}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Save Buttons */}
      <div className="flex justify-end space-x-3">
        <Link
          to="/admin/events"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Save className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
          Save Event
        </button>
      </div>
    </form>
  );
};

// Tickets Management Tab
const TicketsTab: React.FC<{
  eventId: string;
  tickets: AdminEventDetail['ticketTypes'];
}> = ({ eventId, tickets = [] }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Ticket Types</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage ticket types and pricing for this event.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-0.5 mr-2 h-4 w-4" />
          Add Ticket Type
        </button>
      </div>
      
      {tickets.length > 0 ? (
        <div className="overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sold
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ticket.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${ticket.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.availableQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.soldQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Tag className="h-full w-full" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No ticket types</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create ticket types to start selling tickets.
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Ticket Type
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Attendees Tab
const AttendeesTab: React.FC<{ eventId: string }> = ({ eventId }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Attendees</h3>
          <p className="mt-1 text-sm text-gray-500">
            View and manage attendees for this event.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="-ml-0.5 mr-2 h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="-ml-0.5 mr-2 h-4 w-4" />
            Import
          </button>
        </div>
      </div>
      
      <div className="text-center py-8">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <Users className="h-full w-full" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No attendees yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Attendees will appear here as they register.
        </p>
      </div>
    </div>
  );
};

const AdminEventDetailsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [event, setEvent] = useState<AdminEventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId || eventId === 'new') {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const eventData = await getAdminEventById(eventId);
        setEvent(eventData);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [eventId]);
  
  const handleSaveEvent = async (eventData: Partial<AdminEventDetail>) => {
    setIsLoading(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      if (eventId && eventId !== 'new') {
        // Update existing event
        await updateEvent(eventId, eventData);
        
        // Refresh event data
        const updatedEvent = await getAdminEventById(eventId);
        setEvent(updatedEvent);
        
        // Show success message
        setSaveSuccess(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        // Create new event (placeholder - would call createEvent in a real implementation)
        console.log('Create new event with data:', eventData);
        
        // Navigate to events list after creation
        navigate('/admin/events');
      }
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Failed to save event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Determine page title
  const pageTitle = eventId === 'new' 
    ? 'Create New Event' 
    : isLoading 
      ? 'Loading Event...' 
      : `Edit Event: ${event?.title || 'Unknown'}`;
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center">
          <Link
            to="/admin/events"
            className="mr-4 p-2 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
        </div>
        
        {event && (
          <div className="mt-2 sm:mt-0 flex items-center space-x-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              event.status === 'published' 
                ? 'bg-green-100 text-green-800' 
                : event.status === 'draft' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-800'
            }`}>
              {event.status}
            </span>
            
            <Link
              to={`/events/${event.slug}`}
              target="_blank"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <LinkIcon className="h-4 w-4 mr-1" />
              View Event
            </Link>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
      
      {/* Success message */}
      {saveSuccess && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Event saved successfully!
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Event Information Card (mini summary) */}
      {event && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4 flex items-center">
            <Calendar className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-lg font-medium">
                {new Date(event.eventStart).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4 flex items-center">
            <MapPin className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="text-lg font-medium">{event.location || 'TBD'}</p>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4 flex items-center">
            <Users className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Registrations</p>
              <p className="text-lg font-medium">
                {event.registered} / {event.capacity}
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4 flex items-center">
            <Clock className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-lg font-medium">
                {event.eventEnd 
                  ? `${Math.ceil((new Date(event.eventEnd).getTime() - new Date(event.eventStart).getTime()) / (1000 * 60 * 60))} hours` 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          <Tab
            id="details-tab"
            label="Details"
            icon={<Calendar className="h-4 w-4" />}
            isActive={activeTab === 'details'}
            onClick={() => setActiveTab('details')}
          />
          <Tab
            id="tickets-tab"
            label="Tickets"
            icon={<Tag className="h-4 w-4" />}
            isActive={activeTab === 'tickets'}
            onClick={() => setActiveTab('tickets')}
          />
          <Tab
            id="attendees-tab"
            label="Attendees"
            icon={<Users className="h-4 w-4" />}
            isActive={activeTab === 'attendees'}
            onClick={() => setActiveTab('attendees')}
          />
        </nav>
      </div>
      
      {/* Tab content */}
      {activeTab === 'details' && (
        <EventForm
          event={event}
          isLoading={isLoading}
          onSave={handleSaveEvent}
        />
      )}
      
      {activeTab === 'tickets' && (
        <TicketsTab
          eventId={eventId || ''}
          tickets={event?.ticketTypes || []}
        />
      )}
      
      {activeTab === 'attendees' && (
        <AttendeesTab eventId={eventId || ''} />
      )}
    </div>
  );
};

export default AdminEventDetailsPage;