import React from 'react';
import { CheckCircle } from 'lucide-react';
import { TicketType } from '../../../shared/types/register';

interface PackageTicketSectionProps {
  availableTickets: TicketType[];
  selectedTicketId: string;
  onSelectTicket: (ticketId: string) => void;
}

const PackageTicketSection: React.FC<PackageTicketSectionProps> = ({
  availableTickets,
  selectedTicketId,
  onSelectTicket
}) => {
  if (!availableTickets || !Array.isArray(availableTickets)) {
    // Return placeholder or loading state if no tickets are available
    return (
      <div className="p-4 border rounded-lg bg-slate-50">
        <p className="text-center text-slate-500">No ticket packages available</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {availableTickets.map(ticket => (
        <div 
          key={ticket.id}
          className={`border rounded-lg p-6 cursor-pointer transition-colors ${
            selectedTicketId === ticket.id 
              ? 'border-primary bg-primary/5' 
              : 'border-slate-200 hover:border-primary/50'
          }`}
          onClick={() => onSelectTicket(ticket.id)}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-primary">{ticket.name}</h3>
              <p className="text-slate-600 mb-4">{ticket.description}</p>
              
              <div className="mt-2">
                <h4 className="font-medium mb-2">Includes:</h4>
                <ul className="text-sm text-slate-700 space-y-1">
                  {ticket.includes && Array.isArray(ticket.includes) 
                    ? ticket.includes.map((item, i) => (
                      <li key={i} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {item}
                      </li>
                    ))
                    : <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Standard admission
                      </li>
                  }
                </ul>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">${ticket.price}</div>
              <div className="text-sm text-slate-500">per person</div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className={`w-6 h-6 rounded-full border ${
              selectedTicketId === ticket.id 
                ? 'border-primary bg-primary' 
                : 'border-slate-300'
            } flex items-center justify-center`}>
              {selectedTicketId === ticket.id && (
                <div className="w-2 h-2 rounded-full bg-white"></div>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTicket(ticket.id);
              }}
              className={
                selectedTicketId === ticket.id 
                  ? "btn-primary" 
                  : "btn-outline"
              }
            >
              {selectedTicketId === ticket.id ? 'Selected' : 'Select'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PackageTicketSection;