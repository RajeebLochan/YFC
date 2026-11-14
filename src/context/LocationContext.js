import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export function useLocation() {
  return useContext(LocationContext);
}

export function LocationProvider({ children }) {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: '',
    loading: true,
    error: null,
    granted: false,
  });

  useEffect(() => {
    // Auto-detect location when the app loads
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    // Request location permission
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get readable address
        let address = 'Your delivery area';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            {
              headers: { 'Accept-Language': 'en' },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const parts = [];
            if (data.address) {
              const a = data.address;
              if (a.suburb || a.neighbourhood || a.hamlet || a.village) {
                parts.push(a.suburb || a.neighbourhood || a.hamlet || a.village);
              }
              if (a.city || a.town || a.county) {
                parts.push(a.city || a.town || a.county);
              }
              if (a.state_district || a.state) {
                parts.push(a.state_district || a.state);
              }
            }
            if (parts.length > 0) {
              address = parts.join(', ');
            } else if (data.display_name) {
              // Use first 3 parts of display_name
              address = data.display_name.split(',').slice(0, 3).join(',').trim();
            }
          }
        } catch {
          // Keep default address if reverse geocoding fails
        }

        setLocation({
          latitude,
          longitude,
          address,
          loading: false,
          error: null,
          granted: true,
        });
      },
      (err) => {
        let errorMsg = 'Location access denied';
        if (err.code === 2) errorMsg = 'Location unavailable';
        if (err.code === 3) errorMsg = 'Location request timed out';

        setLocation({
          latitude: null,
          longitude: null,
          address: 'Your delivery area',
          loading: false,
          error: errorMsg,
          granted: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  return (
    <LocationContext.Provider value={location}>{children}</LocationContext.Provider>
  );
}

export default LocationContext;
