import React from 'react';
import { CheckCircle, AlertCircle, Users, TrendingUp, Loader2 } from 'lucide-react';
// LINTER FIX: Remove TicketType import if no longer directly used, or keep if needed for internal logic
// import { TicketType } from '../../../shared/types/register';
import { TicketDefinitionType } from '../../../shared/types/ticket';
// LINTER FIX: Import PackageType
import { PackageType } from '../../../lib/api/events';

interface PackageTicketSectionProps {
  // LINTER FIX: Explicitly allow PackageType or TicketDefinitionType
  availableTickets: (PackageType | TicketDefinitionType)[];
  selectedTicketId: string;
  onSelectTicket: (ticketId: string) => void;
  // New props for capacity handling
  capacityInfo?: Record<string, {
    available: number;
    isHighDemand: boolean;
    isSoldOut: boolean;
  }>;
  attendeeCount?: number;
  isReserving?: boolean;
  onSwitchToIndividualMode?: () => void;
}

const PackageTicketSection: React.FC<PackageTicketSectionProps> = ({
  availableTickets,
  selectedTicketId,
  onSelectTicket,
  capacityInfo = {},
  attendeeCount = 1,
  isReserving = false,
  onSwitchToIndividualMode
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
      {availableTickets.map(ticket => {
        // Get capacity information for this ticket if available
        const ticketCapacity = capacityInfo[ticket.id];
        const isSoldOut = ticketCapacity?.isSoldOut;
        const isHighDemand = ticketCapacity?.isHighDemand;
        const isNotEnoughSeats = ticketCapacity && attendeeCount > ticketCapacity.available;
        const showGroupWarning = isNotEnoughSeats && !isSoldOut;
        
        return (
          <div 
            key={ticket.id}
            className={`border rounded-lg p-6 cursor-pointer transition-colors ${
              isSoldOut ? 'border-red-200 bg-red-50/50' : 
              selectedTicketId === ticket.id 
                ? 'border-primary bg-primary/5' 
                : isHighDemand 
                  ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300' 
                  : 'border-slate-200 hover:border-primary/50'
            }`}
            onClick={() => !isSoldOut && !isReserving && onSelectTicket(ticket.id)}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center">
                  <h3 className="text-xl font-bold text-primary">{ticket.name}</h3>
                  
                  {/* Show capacity badges */}
                  {ticketCapacity && (
                    <div className="ml-2">
                      {isSoldOut ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Sold Out
                        </span>
                      ) : isHighDemand ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          High Demand
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <Users className="w-3 h-3 mr-1" />
                          Available
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-slate-600 mb-3">{ticket.description}</p>
                
                {/* Show capacity details */}
                {ticketCapacity && (
                  <div className={`text-sm mb-3 ${
                    isSoldOut ? 'text-red-600' : 
                    isHighDemand ? 'text-amber-600' : 
                    'text-green-600'
                  }`}>
                    {isSoldOut ? (
                      <span>No seats available</span>
                    ) : (
                      <span>{ticketCapacity.available} seats available</span>
                    )}
                    
                    {/* Show warning if not enough seats for the group */}
                    {showGroupWarning && (
                      <div className="mt-1 text-amber-600 flex items-start">
                        <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Not enough seats for all {attendeeCount} attendees</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-2">
                  <h4 className="font-medium mb-2">Includes:</h4>
                  <ul className="text-sm text-slate-700 space-y-1">
                    {/* Handle both TicketType and TicketDefinitionType */}
                    {('includes' in ticket && ticket.includes && Array.isArray(ticket.includes)) 
                      ? ticket.includes.map((item, i) => (
                        <li key={i} className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          {item}
                        </li>
                      ))
                      : <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          Standard admission for event
                        </li>
                    }
                  </ul>
                </div>
              </div>
              <div>
                {/* Price is now required, so we can remove the conditional */}
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
              
              {/* Conditional button rendering based on capacity */}
              {isReserving ? (
                <button
                  type="button"
                  disabled={true}
                  className="btn-outline opacity-50 cursor-not-allowed"
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </button>
              ) : isSoldOut ? (
                <div className="flex items-center">
                  <span className="btn-outline opacity-50 cursor-not-allowed">
                    Sold Out
                  </span>
                  {onSwitchToIndividualMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwitchToIndividualMode();
                      }}
                      className="ml-3 text-sm text-primary hover:underline px-2 py-1"
                    >
                      Try Individual Tickets
                    </button>
                  )}
                </div>
              ) : isNotEnoughSeats ? (
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTicket(ticket.id);
                    }}
                    className="btn-outline"
                  >
                    Select
                  </button>
                  {onSwitchToIndividualMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwitchToIndividualMode();
                      }}
                      className="ml-3 text-sm text-primary hover:underline px-2 py-1"
                    >
                      Select Individually
                    </button>
                  )}
                </div>
              ) : (
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
                  disabled={isReserving}
                >
                  {selectedTicketId === ticket.id ? 'Selected' : 'Select'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PackageTicketSection;