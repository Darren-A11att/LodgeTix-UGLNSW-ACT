import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface Reservation {
  reservationId: string;
  eventId: string;
  ticketDefinitionId: string;
  quantity: number;
  expiresAt: Date;
}

interface ReservationContextType {
  reservation: Reservation | null;
  setReservation: (reservation: Reservation | null) => void;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

interface ReservationProviderProps {
  children: ReactNode;
}

export const ReservationProvider: React.FC<ReservationProviderProps> = ({ children }) => {
  const [reservation, setReservation] = useState<Reservation | null>(null);

  // Load initial reservation from localStorage if exists
  useEffect(() => {
    try {
      const storedReservation = localStorage.getItem('lodgetix_bypass_reservation');
      const storedExpiry = localStorage.getItem('lodgetix_bypass_expiry');
      
      if (storedReservation && storedExpiry) {
        const expiryDate = new Date(parseInt(storedExpiry));
        const parsedReservation = JSON.parse(storedReservation);
        setReservation({
          ...parsedReservation,
          expiresAt: expiryDate
        });
      }
    } catch (error) {
      console.error('Error loading stored reservation:', error);
    }
  }, []);

  // Store reservation in localStorage when it changes
  useEffect(() => {
    if (reservation) {
      try {
        localStorage.setItem('lodgetix_bypass_reservation', JSON.stringify(reservation));
        localStorage.setItem('lodgetix_bypass_expiry', reservation.expiresAt.getTime().toString());
      } catch (error) {
        console.error('Error storing reservation:', error);
      }
    }
  }, [reservation]);

  return (
    <ReservationContext.Provider value={{ reservation, setReservation }}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = (): ReservationContextType => {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};