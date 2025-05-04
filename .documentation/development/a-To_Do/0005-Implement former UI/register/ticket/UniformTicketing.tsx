import React from 'react';
import { TicketType, MasonData, LadyPartnerData, GuestData, GuestPartnerData } from '../../../shared/types/register';
import PackageTicketSection from './PackageTicketSection';

// Define AttendeeType locally (or import if moved to shared types)
interface AttendeeType {
  type: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner';
  index: number;
  name: string;
  title: string;
  data: MasonData | LadyPartnerData | GuestData | GuestPartnerData;
  relatedTo?: string;
}

interface UniformTicketingProps {
  selectedTicketId: string;
  availableTickets: TicketType[];
  allAttendees: AttendeeType[];
  onSelectTicket: (ticketId: string) => void;
}

const UniformTicketing: React.FC<UniformTicketingProps> = ({
  selectedTicketId,
  availableTickets,
  allAttendees,
  onSelectTicket
}) => {
  return (
    <div className="space-y-6 mb-8">
      <div className="bg-slate-50 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-bold mb-2">Select One Ticket for All Attendees</h3>
        <p className="text-slate-600 mb-4">
          The selected ticket will apply to all {allAttendees.length} attendees in your registration.
        </p>
      </div>
      
      <PackageTicketSection
        availableTickets={availableTickets}
        selectedTicketId={selectedTicketId}
        onSelectTicket={onSelectTicket}
      />
    </div>
  );
};

export default UniformTicketing;