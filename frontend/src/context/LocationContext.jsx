import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const LocationContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const STORAGE_KEY = 'agrisense:selected-location';

function readStoredLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (Number.isFinite(Number(value?.lat)) && Number.isFinite(Number(value?.lon))) {
      return { ...value, lat: Number(value.lat), lon: Number(value.lon) };
    }
  } catch {
    // Ignore invalid or unavailable local storage.
  }
  return null;
}

function gpsErrorMessage(error) {
  if (error?.code === 1) return 'Location permission was denied. Allow location access in your browser settings and try again.';
  if (error?.code === 2) return 'Your device could not determine the location. Try again or search for a place.';
  if (error?.code === 3) return 'Getting your location timed out. Please try again.';
  return error?.message || 'Could not get your current location.';
}

export function LocationProvider({ children }) {
  const [savedLocation, setSavedLocation] = useState(readStoredLocation);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationVersion, setLocationVersion] = useState(0);
  const requestId = useRef(0);

  const selectLocation = useCallback(async (location) => {
    const lat = Number(location?.lat);
    const lon = Number(location?.lon ?? location?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Please select a valid location.');
      return false;
    }

    const id = ++requestId.current;
    setLocationVersion((version) => version + 1);
    const base = {
      ...location,
      lat,
      lon,
      name: location?.name || 'Selected location',
      weather: undefined,
      zone: undefined,
      source: location?.source || 'search',
    };
    setSavedLocation(base);
    setError('');
    setResolving(true);
    try {
      const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
      if (location?.name && location?.district) {
        params.set('place', location.name);
        params.set('district', location.district);
      }
      const response = await fetch(`${API_BASE}/resolve-location?${params.toString()}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = data?.detail || data?.message || 'Could not load weather and soil data for this location.';
        throw new Error(typeof detail === 'string' ? detail : 'Could not resolve this location.');
      }
      if (id !== requestId.current) return false;
      const resolved = {
        ...base,
        ...data,
        lat,
        lon,
        name: location?.source === 'gps'
          ? (data?.place || data?.name || data?.location?.name || location?.name || 'Current location (GPS)')
          : (location?.name || data?.place || data?.name || data?.location?.name || 'Selected location'),
        district: location?.district || data?.district || '',
        weather: data?.weather ?? data?.location?.weather ?? null,
        zone: data?.zone ?? data?.soil ?? data?.location?.zone ?? null,
        zone_id: data?.zone_id ?? null,
        source: location?.source || 'search',
      };
      setSavedLocation(resolved);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(resolved)); } catch { /* Storage is optional. */ }
      return true;
    } catch (err) {
      if (id === requestId.current) {
        // Keep the newly selected coordinates, but do not keep weather/soil from the old location.
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(base)); } catch { /* Storage is optional. */ }
        setError(err?.message || 'Could not load data for this location.');
      }
      return false;
    } finally {
      if (id === requestId.current) setResolving(false);
    }
  }, []);

  const fetchGps = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('This browser does not support location. Search for your location instead.');
      return Promise.resolve(false);
    }
    setLoadingLocation(true);
    setError('');
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const ok = await selectLocation({
              lat: coords.latitude,
              lon: coords.longitude,
              name: 'Current location (GPS)',
              accuracy: coords.accuracy,
              source: 'gps',
            });
            resolve(ok);
          } finally {
            setLoadingLocation(false);
          }
        },
        (gpsError) => {
          setError(gpsErrorMessage(gpsError));
          setLoadingLocation(false);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  }, [selectLocation]);

  // Compatibility with older modules: saveLocation selects coordinates; refreshLocation
  // refreshes data for the current selection. Use fetchGps for a fresh device GPS request.
  const saveLocation = useCallback((location) => selectLocation(location), [selectLocation]);
  const refreshLocation = useCallback(async () => {
    if (!savedLocation) return fetchGps();
    return selectLocation({ ...savedLocation, source: savedLocation.source || 'refresh' });
  }, [fetchGps, savedLocation, selectLocation]);

  const openLocationModal = useCallback(() => setIsModalOpen(true), []);
  const closeLocationModal = useCallback(() => setIsModalOpen(false), []);

  const value = useMemo(() => ({
    savedLocation,
    saveLocation,
    selectLocation,
    fetchGps,
    loadingLocation,
    resolving,
    error,
    locationVersion,
    refreshLocation,
    isModalOpen,
    openLocationModal,
    closeLocationModal,
  }), [savedLocation, saveLocation, selectLocation, fetchGps, loadingLocation, resolving, error, locationVersion, refreshLocation, isModalOpen, openLocationModal, closeLocationModal]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useFarmLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useFarmLocation must be used within a LocationProvider');
  return context;
}
