import { createContext, useContext, useState } from 'react';

const LocationContext = createContext(null);
const STORAGE_KEY = 'agrisense_farm_location';
const API_BASE = 'http://127.0.0.1:8000';

// Default Maharashtra central farm location (used if none saved yet)
const DEFAULT_FARM_LOCATION = {
  name: 'Pune Farm',
  district: 'Pune',
  lat: 18.5204,
  lon: 73.8567,
  zone_id: 'scarcity_zone',
  zone: {
    label: 'Scarcity Zone / Western Ghats Transition',
    confidence: 'high',
    N: 75,
    P: 40,
    K: 45,
    ph: 7.2,
    soil_type: 'Medium Black Soil',
  },
  weather: {
    temperature: 28.0,
    humidity: 58.0,
    rainfall: 650.0,
  },
};

export function LocationProvider({ children }) {
  const [savedLocation, setSavedLocation] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_FARM_LOCATION;
    } catch {
      return DEFAULT_FARM_LOCATION;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-resolve full weather & zone details whenever a location is chosen

// Save a location (used by refreshLocation & other pages)
const saveLocation = (loc) => {
  try {
    const newLoc = { ...savedLocation, ...loc };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
    setSavedLocation(newLoc);
  } catch (e) {
    console.error('Failed to save location', e);
  }
};
// Refresh location on user request
  const refreshLocation = async () => {
  // If we already have a saved location (not default), use it without re‑prompting the user.
  if (savedLocation && savedLocation.lat && savedLocation.lon) {
    // Location already fetched; no need to request geolocation again.
    return;
  }
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported');
    return;
  }
  setLoading(true);
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      saveLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    },
    (err) => {
      console.warn('Location refresh failed', err);
    },
    { enableHighAccuracy: true }
  ).finally(() => setLoading(false));
};

  

  // expose refreshLocation in context value

  const clearLocation = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setSavedLocation(DEFAULT_FARM_LOCATION);
  };

  const openLocationModal = () => setIsModalOpen(true);
  const closeLocationModal = () => setIsModalOpen(false);

  return (
    <LocationContext.Provider
      value={{
        savedLocation,
        saveLocation,
        clearLocation,
        isModalOpen,
        openLocationModal,
        closeLocationModal,
        loadingLocation: loading,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useFarmLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useFarmLocation must be used within a LocationProvider');
  }
  return context;
}
