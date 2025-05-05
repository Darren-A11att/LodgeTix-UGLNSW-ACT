import React from 'react';
import EventCard, { EventCardProps } from './EventCard'; // Import the EventCard component
import { Link } from 'react-router-dom';
import Button from './Button'; // Import Button

// Placeholder data - replace with actual data fetching later
const featuredEvents: EventCardProps[] = [
  {
    id: 'welcome-reception',
    slug: 'welcome-reception',
    imageUrl: 'https://images.unsplash.com/photo-1529678316758-219a1a35a15a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Replace with actual image
    imageAlt: 'Welcome reception event with table settings',
    category: 'Social',
    title: 'Welcome Reception',
    date: 'Friday, September 12',
    time: '18:00 - 21:00',
    location: 'Grand Ballroom, Sydney Masonic Centre',
    attendeeInfo: '500 attendees max',
    description: 'Start your Grand Proclamation weekend with a casual welcome reception. Meet and greet fellow attende...',
    price: 75,
  },
  {
    id: 'proclamation-ceremony',
    slug: 'proclamation-ceremony',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2832&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Replace with actual image
    imageAlt: 'Grand Proclamation Ceremony venue',
    category: 'Ceremony',
    title: 'Grand Proclamation Ceremony',
    date: 'Saturday, September 13',
    time: '14:00 - 16:30',
    location: 'Main Auditorium, Sydney Masonic Centre',
    attendeeInfo: '800 attendees max',
    description: 'The formal ceremony for the Proclamation of the Grand Master and his officers. This is the main even...',
    price: 150,
  },
  {
    id: 'gala-dinner',
    slug: 'gala-dinner',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbdf6af5?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Replace with actual image
    imageAlt: 'Grand Proclamation Gala Dinner with purple lighting',
    category: 'Social',
    title: 'Grand Proclamation Gala Dinner',
    date: 'Saturday, September 13',
    time: '19:00 - 23:00',
    location: 'International Convention Centre, Sydney',
    attendeeInfo: '1000 attendees max',
    description: 'A formal black-tie dinner celebrating the Grand Proclamation. The evening will include fine dining, ...',
    price: 200,
  },
];

const FeaturedEventsSection: React.FC = () => {
  return (
    <div className="bg-gray-50 py-16 sm:py-24">
      <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">Featured Events</h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Experience the highlight ceremonies and events of the Grand Proclamation weekend
          </p>
        </div>
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </div>
        <div className="mt-12 text-center">
          {/* Use Button component */}
          <Button href="/events" variant="secondary" size="lg"> 
            View All Events
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedEventsSection; 