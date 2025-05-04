import React, { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface ReservationTimerProps {
  expiryTime: Date | null;
  className?: string;
}

const ReservationTimer: React.FC<ReservationTimerProps> = ({
  expiryTime,
  className = ''
}) => {
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  // Format remaining time for display
  const formatRemainingTime = (ms: number | null): string => {
    if (ms === null) return '';
    
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Is the reservation expired
  const isExpired = remainingTime !== null && remainingTime <= 0;
  
  // Is the reservation expiring soon (within 2 minutes)
  const isExpiringSoon = remainingTime !== null && remainingTime <= 120000 && remainingTime > 0;
  
  // Update remaining time without redirecting on expiry
  useEffect(() => {
    if (!expiryTime) {
      setRemainingTime(null);
      return;
    }
    
    // Make sure we have our no-redirect flag set
    localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
    
    const intervalId = setInterval(() => {
      const now = new Date();
      const timeLeft = expiryTime.getTime() - now.getTime();
      
      if (timeLeft <= 0) {
        setRemainingTime(0);
        clearInterval(intervalId);
        
        // Don't reset the reservation or do anything that would cause redirection
        console.log('Reservation timer expired but keeping session active to prevent redirection');
      } else {
        setRemainingTime(timeLeft);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [expiryTime]);

  if (!expiryTime) {
    return null;
  }

  // Set default classes based on status
  const bgColorClass = isExpired ? 'bg-red-50 border-red-200' : 
                       isExpiringSoon ? 'bg-yellow-50 border-yellow-200' : 
                       'bg-blue-50 border-blue-100';
                       
  const iconColorClass = isExpired ? 'text-red-500' : 
                         isExpiringSoon ? 'text-yellow-500' : 
                         'text-blue-500';
                         
  const headerColorClass = isExpired ? 'text-red-800' : 
                           isExpiringSoon ? 'text-yellow-800' : 
                           'text-blue-800';
                           
  const textColorClass = isExpired ? 'text-red-700' : 
                         isExpiringSoon ? 'text-yellow-700' : 
                         'text-blue-700';

  return (
    <div className={`p-4 rounded-lg flex items-start gap-3 border ${bgColorClass} ${className}`}>
      <Clock className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColorClass}`} />
      <div>
        <h4 className={`font-medium ${headerColorClass}`}>
          {isExpired ? 'Reservation Expired' : 
           isExpiringSoon ? 'Reservation Expiring Soon' : 
           'Ticket Reserved'}
        </h4>
        <p className={`text-sm ${textColorClass}`}>
          {isExpired ? 
            'Your ticket reservation has expired. Please select another ticket.' : 
            `Reserved for ${formatRemainingTime(remainingTime)}. Complete registration soon.`}
        </p>
      </div>
    </div>
  );
};

export default ReservationTimer;