import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext(null);
const STORAGE_KEY = 'agrisense_farm_location';

export function LocationProvider({ children }) {
  const [savedLocation, setSavedLocation] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const saveLocation = (loc) => {
    if (!loc) {
      clearLocation();
      return;
    }
    const cleanLoc = {
      name: loc.name || loc.place || 'Selected Farm',
      district: loc.district || '',
      lat: parseFloat(loc.lat),
      lon: parseFloat(loc.lon),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanLoc));
    } catch (e) {
      console.error('Failed to save farm location to localStorage', e);
    }
    setSavedLocation(cleanLoc);
  };

  const clearLocation = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setSavedLocation(null);
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
