import React from 'react';
import { TicketType } from '../../../types/register';
import PackageTicketSection from './PackageTicketSection';
import TicketingSummary from './TicketingSummary';

interface UniformTicketingProps {
  selectedTicketId: string;
  availableTickets: TicketType[];
  attendeeCount: number;
  onSelectTicket: (ticketId: string) => void;
}

const UniformTicketing: React.FC<UniformTicketingProps> = ({
  selectedTicketId,
  availableTickets,
  attendeeCount,
  onSelectTicket
}) => {
  // Get selected ticket details
  const selectedTicket = availableTickets.find(ticket => ticket.id === selectedTicketId);
  
  // Calculate total price
  const totalPrice = (selectedTicket?.price || 0) * attendeeCount;
  
  // Generate summary for display
  const ticketSummary = selectedTicketId ? [
    {
      name: selectedTicket?.name || 'Selected Package',
      count: attendeeCount,
      price: selectedTicket?.price || 0
    }
  ] : [];

  return (
    <div className="space-y-6 mb-8">
      <div className="bg-slate-50 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-bold mb-2">Select One Ticket for All Attendees</h3>
        <p className="text-slate-600 mb-4">
          The selected ticket will apply to all {attendeeCount} attendees in your registration.
        </p>
      </div>
      
      <PackageTicketSection
        availableTickets={availableTickets}
        selectedTicketId={selectedTicketId}
        onSelectTicket={onSelectTicket}
      />
      
      <TicketingSummary
        ticketSummary={ticketSummary}
        totalPrice={totalPrice}
      />
    </div>
  );
};

export default UniformTicketing;