import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, X, Check, Search, AlertCircle } from 'lucide-react';
import { useFarmLocation } from '../context/LocationContext';
import SpotlightCard from './SpotlightCard';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function LocationModal() {
  const {
    savedLocation, selectLocation, fetchGps, loadingLocation, resolving, error,
    isModalOpen, closeLocationModal,
  } = useFarmLocation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [localError, setLocalError] = useState('');
  const debounceRef = useRef(null);
  const requestRef = useRef(0);

  const displayedSuggestions = isModalOpen && query.trim().length >= 2 ? suggestions : [];

  useEffect(() => {
    const value = query.trim();
    if (!isModalOpen || value.length < 2) {
      return;
    }
    const requestId = ++requestRef.current;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setLocalError('');
      try {
        const response = await fetch(`${API_BASE}/city-search?query=${encodeURIComponent(value)}`);
        const data = await response.json().catch(() => ({}));
        if (requestId === requestRef.current) {
          setSuggestions(response.ok && Array.isArray(data.results) ? data.results : []);
        }
      } catch {
        if (requestId === requestRef.current) {
          setSuggestions([]);
          setLocalError('Could not fetch location suggestions. Check that the backend is running.');
        }
      } finally {
        if (requestId === requestRef.current) setSearching(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, isModalOpen]);

  if (!isModalOpen) return null;

  const handleClose = () => {
    setQuery('');
    setSuggestions([]);
    setLocalError('');
    clearTimeout(debounceRef.current);
    closeLocationModal();
  };

  const handleSelect = async (place) => {
    setLocalError('');
    const ok = await selectLocation({ ...place, lon: place.lon ?? place.lng, source: 'search' });
    if (ok) handleClose();
  };

  const handleUseGPS = async () => {
    setLocalError('');
    const ok = await fetchGps();
    if (ok) handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" role="dialog" aria-modal="true" aria-labelledby="farm-location-title">
      <SpotlightCard
        spotlightColor="rgba(132, 204, 22, 0.2)"
        borderColor="rgba(132, 204, 22, 0.5)"
        className="p-6 w-full max-w-md shadow-2xl border border-white/15 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#84CC16]/20 border border-[#84CC16]/30 flex items-center justify-center text-[#BEF264]"><MapPin size={16} /></div>
            <div>
              <h3 id="farm-location-title" className="font-serif text-lg font-bold text-[#FDFAF2]">Farm Location</h3>
              <p className="text-[11px] text-[#8E9B85]">Shared across microclimate and agronomic modules</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} aria-label="Close location dialog" className="p-1 rounded-lg text-[#8E9B85] hover:text-white hover:bg-white/10 transition cursor-pointer"><X size={18} /></button>
        </div>

        {savedLocation && (
          <div className="bg-[#142311] border border-[#84CC16]/40 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#BEF264] uppercase font-bold tracking-wider block">Currently Saved</span>
              <span className="text-sm font-bold text-[#FDFAF2]">{savedLocation.name}{savedLocation.district ? ` (${savedLocation.district})` : ''}</span>
            </div>
            <span className="w-6 h-6 rounded-full bg-[#84CC16] text-[#070B06] flex items-center justify-center font-bold"><Check size={13} /></span>
          </div>
        )}

        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9B85]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type city or district (e.g. Pune, Nashik)..."
              autoFocus
              className="w-full bg-[#10190D] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#FDFAF2] placeholder-[#6B7C63] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
            />
          </div>

          <button
            type="button"
            onClick={handleUseGPS}
            disabled={loadingLocation || resolving}
            className="w-full flex items-center justify-center gap-2 bg-white/10 text-[#FDFAF2] border border-white/15 hover:bg-white/20 transition rounded-xl py-2.5 text-xs font-semibold disabled:opacity-50 cursor-pointer"
          >
            <Navigation size={14} className="text-[#84CC16]" />
            {loadingLocation ? 'Detecting GPS Location…' : resolving ? 'Loading location data…' : 'Use My GPS Location'}
          </button>

          {(localError || error) && (
            <div role="alert" className="flex items-start gap-1.5 text-xs text-red-300 bg-red-950/40 p-2.5 rounded-xl border border-red-500/40">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{localError || error}</span>
            </div>
          )}
          {searching && <p className="text-xs text-[#8E9B85]">Searching locations…</p>}
          {displayedSuggestions.length > 0 && (
            <div className="max-h-48 overflow-y-auto divide-y divide-white/10 border border-white/10 rounded-xl bg-[#0B1309] shadow-lg">
              {displayedSuggestions.map((place, i) => (
                <button
                  key={`${place.name}-${place.lat}-${i}`}
                  type="button"
                  disabled={resolving}
                  onClick={() => handleSelect(place)}
                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#10190D] transition flex items-center justify-between group disabled:opacity-50 cursor-pointer"
                >
                  <span className="font-medium text-[#FDFAF2]">{place.name} <span className="text-[#8E9B85] font-normal">({place.district})</span></span>
                  <span className="text-[10px] text-[#84CC16]">Select →</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </SpotlightCard>
    </div>
  );
}
