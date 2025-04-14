import React from 'react';
import { FormState } from '../../../context/RegisterFormContext';

interface TicketingSummaryProps {
  ticketSummary: {name: string; count: number; price: number}[];
  totalPrice: number;
  allAttendeesHaveTickets?: boolean;
}

const TicketingSummary: React.FC<TicketingSummaryProps> = ({
  ticketSummary,
  totalPrice,
  allAttendeesHaveTickets = true
}) => {
  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
      <h3 className="font-bold text-lg mb-2">Order Summary</h3>
      {ticketSummary.length > 0 ? (
        <div>
          {ticketSummary.map((item, index) => (
            <div key={index} className="flex justify-between mb-2">
              <span>{item.name}</span>
              <span>{item.count} x ${item.price} = ${item.price * item.count}</span>
            </div>
          ))}
          
          <div className="flex justify-between font-bold border-t border-slate-200 pt-2 mt-2">
            <span>Total</span>
            <span>${totalPrice}</span>
          </div>
        </div>
      ) : (
        <div className="text-red-500 text-sm">
          No tickets selected. Please select tickets for all attendees.
        </div>
      )}
    </div>
  );
};

export default TicketingSummary;