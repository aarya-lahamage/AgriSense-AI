/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, X, Check, Search, AlertCircle } from 'lucide-react';
import { useFarmLocation } from '../context/LocationContext';

const API_BASE = 'http://127.0.0.1:8000';

export default function LocationModal() {
  const { savedLocation, saveLocation, isModalOpen, closeLocationModal } = useFarmLocation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!isModalOpen) {
      setQuery('');
      setSuggestions([]);
      setError('');
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/city-search?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
        }
      } catch {
        setError('Could not fetch suggestions');
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query]);

  if (!isModalOpen) return null;

  const handleSelect = (place) => {
    saveLocation({
      name: place.name,
      district: place.district,
      lat: place.lat,
      lon: place.lon,
    });
    closeLocationModal();
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(`${API_BASE}/resolve-location?lat=${lat}&lon=${lon}`);
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.detail || 'Location not in Maharashtra bounds');
          }
          const data = await res.json();
          saveLocation({
            name: data.place || data.district || 'Current Farm',
            district: data.district || '',
            lat,
            lon,
            zone: data.zone,
            weather: data.weather,
            zone_id: data.zone_id,
          });
          closeLocationModal();
        } catch (err) {
          setError(err.message || 'Failed to resolve GPS coordinates');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError('Location access was denied in browser permissions');
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#EEEBDD]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E5EFD5] flex items-center justify-center text-[#5B7A3A]">
              <MapPin size={16} />
            </div>
            <div>
              <h3 className="font-serif text-[18px] font-medium text-[#22301A]">Farm Location</h3>
              <p className="text-[11px] text-[#8A8A6A]">Used across Crop, Fertilizer, Weather & Yield</p>
            </div>
          </div>
          <button
            onClick={closeLocationModal}
            className="p-1 rounded-lg text-[#8A8A6A] hover:bg-[#F6F4EC] transition"
          >
            <X size={18} />
          </button>
        </div>

        {savedLocation && (
          <div className="bg-[#FBF3E3] border border-[#EFE7D8] rounded-xl p-3 mb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#A8895A] uppercase font-semibold block">Currently Saved</span>
              <span className="text-sm font-medium text-[#22301A]">
                {savedLocation.name}
                {savedLocation.district ? ` (${savedLocation.district})` : ''}
              </span>
            </div>
            <span className="w-6 h-6 rounded-full bg-[#5B7A3A] text-white flex items-center justify-center">
              <Check size={13} />
            </span>
          </div>
        )}

        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A391]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type city or district (e.g. Pune, Nashik)..."
              autoFocus
              className="w-full bg-[#F6F4EC] border border-transparent rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#22301A] placeholder:text-[#A8A391] focus:outline-none focus:border-[#5B7A3A] focus:bg-white transition"
            />
          </div>

          <button
            type="button"
            onClick={handleUseGPS}
            disabled={locating}
            className="w-full flex items-center justify-center gap-2 bg-[#F6F4EC] text-[#22301A] border border-[#EEEBDD] hover:bg-[#EFE7D8] transition rounded-xl py-2.5 text-xs font-medium disabled:opacity-50"
          >
            <Navigation size={14} className="text-[#5B7A3A]" />
            {locating ? 'Detecting GPS Location...' : 'Use My GPS Location'}
          </button>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="max-h-48 overflow-y-auto divide-y divide-[#F0EEE4] border border-[#EEEBDD] rounded-xl bg-white shadow-sm mt-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#F6F4EC] transition flex items-center justify-between group"
                >
                  <span className="font-medium text-[#22301A] group-hover:text-[#5B7A3A]">
                    {s.name} <span className="text-[#8A8A6A] font-normal">({s.district})</span>
                  </span>
                  <span className="text-[10px] text-[#A8A391]">Select →</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
