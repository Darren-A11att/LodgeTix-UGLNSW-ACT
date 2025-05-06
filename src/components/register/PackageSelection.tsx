import React, { useState, useEffect } from 'react';
import { PackageService } from '../../lib/packageService';
import PackageAvailability from './PackageAvailability';

// Define interface for package data
interface Package {
  id: string;
  name: string;
  description: string | null;
  includes_description: string[] | null;
  parent_event_id: string;
  price: number;
}

interface PackageSelectionProps {
  parentEventId: string;
  onPackageSelected: (packageId: string, reservationId: string, expiresAt: string) => void;
  onError?: (message: string) => void;
}

/**
 * Component for selecting and reserving packages
 */
const PackageSelection: React.FC<PackageSelectionProps> = ({
  parentEventId,
  onPackageSelected,
  onError
}) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);

  // Load packages for the parent event
  useEffect(() => {
    if (!parentEventId) {
      setError('Parent event ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchPackages = async () => {
      try {
        const { data, error } = await fetch('/api/packages?parentEventId=' + parentEventId)
          .then(res => res.json());

        if (error) {
          throw new Error(error.message);
        }

        if (!data || data.length === 0) {
          setPackages([]);
          setError('No packages available for this event');
        } else {
          setPackages(data);
        }
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError(err instanceof Error ? err.message : 'Failed to load packages');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [parentEventId]);

  // Handle package selection
  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
  };

  // Handle package reservation
  const handleReservePackage = async () => {
    if (!selectedPackageId) {
      setError('Please select a package first');
      return;
    }

    setReserving(true);
    setError(null);

    try {
      const result = await PackageService.reservePackage(selectedPackageId);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to reserve package');
      }

      // Call the callback with reservation details
      onPackageSelected(
        result.data.packageId,
        result.data.reservationId,
        result.data.expiresAt
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reserve package';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">Loading packages...</div>
      </div>
    );
  }

  if (error && packages.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Available Packages</h2>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {packages.map((pkg) => (
          <div 
            key={pkg.id}
            className={`border rounded-lg overflow-hidden ${
              selectedPackageId === pkg.id 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-200'
            }`}
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{pkg.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{pkg.description}</p>
                </div>
                <div className="text-lg font-semibold">${pkg.price.toFixed(2)}</div>
              </div>

              {/* Package includes list */}
              {pkg.includes_description && pkg.includes_description.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Package includes:</h4>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    {pkg.includes_description.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Package availability component */}
              <div className="mt-4">
                <PackageAvailability packageId={pkg.id} />
              </div>
              
              {/* Selection radio button */}
              <div className="mt-4">
                <button
                  type="button"
                  className={`w-full px-4 py-2 rounded-md ${
                    selectedPackageId === pkg.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                  {selectedPackageId === pkg.id ? 'Selected' : 'Select Package'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reservation button */}
      <div className="mt-6">
        <button
          type="button"
          className={`w-full px-6 py-3 text-base font-medium rounded-md ${
            selectedPackageId && !reserving
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleReservePackage}
          disabled={!selectedPackageId || reserving}
        >
          {reserving ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Reserving Package...
            </span>
          ) : (
            'Reserve Package'
          )}
        </button>
      </div>
    </div>
  );
};

export default PackageSelection;