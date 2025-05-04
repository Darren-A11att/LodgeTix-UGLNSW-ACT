import React, { useEffect, useState } from 'react';
import { PackageService } from '../../lib/packageService';

interface PackageAvailabilityProps {
  packageId: string;
  showReservedCount?: boolean;
}

/**
 * Component to display package availability information
 * Provides real-time updates when capacity changes
 */
const PackageAvailability: React.FC<PackageAvailabilityProps> = ({ 
  packageId,
  showReservedCount = false 
}) => {
  const [availability, setAvailability] = useState({
    available: 0,
    reserved: 0,
    sold: 0,
    max: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!packageId) {
      setError('Package ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch initial availability
    PackageService.getPackageAvailability(packageId)
      .then(data => {
        setAvailability(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching package availability:', err);
        setError('Failed to fetch availability');
        setLoading(false);
      });

    // Subscribe to real-time updates
    const subscription = PackageService.subscribeToPackageAvailabilityChanges(
      packageId,
      (data) => {
        setAvailability(data);
        setLoading(false);
      }
    );

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [packageId]);

  // Calculate percentage of capacity used
  const capacityPercentage = availability.max > 0 
    ? Math.round(((availability.sold + availability.reserved) / availability.max) * 100)
    : 0;

  // Determine availability status and styling
  const getStatusInfo = () => {
    if (availability.available <= 0) {
      return {
        label: 'Sold Out',
        colorClass: 'bg-red-600',
        textClass: 'text-red-600'
      };
    }
    
    if (capacityPercentage >= 80) {
      return {
        label: 'Limited Availability',
        colorClass: 'bg-amber-500',
        textClass: 'text-amber-500'
      };
    }
    
    return {
      label: 'Available',
      colorClass: 'bg-emerald-600',
      textClass: 'text-emerald-600'
    };
  };

  const status = getStatusInfo();

  if (loading) {
    return <div className="text-sm text-gray-500">Checking availability...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  if (availability.max === 0) {
    return <div className="text-sm text-gray-500">No capacity information available</div>;
  }

  return (
    <div className="w-full">
      {/* Status badge */}
      <div className="flex items-center mb-1">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.textClass} bg-opacity-10`}>
          <span className={`-ml-0.5 mr-1.5 h-2 w-2 rounded-full ${status.colorClass}`}></span>
          {status.label}
        </span>
        
        {/* Available count */}
        <span className="ml-2 text-sm text-gray-600">
          {availability.available} {availability.available === 1 ? 'seat' : 'seats'} available
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
        <div 
          className={`h-2.5 rounded-full ${status.colorClass}`} 
          style={{ width: `${Math.min(100, capacityPercentage)}%` }}
        ></div>
      </div>

      {/* Detailed information (optional) */}
      {showReservedCount && (
        <div className="text-xs text-gray-500 flex justify-between">
          <span>{capacityPercentage}% Full</span>
          <span>
            {availability.sold} sold, {availability.reserved} reserved / {availability.max} total
          </span>
        </div>
      )}
    </div>
  );
};

export default PackageAvailability;