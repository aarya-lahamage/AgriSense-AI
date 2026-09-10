import { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://127.0.0.1:8000';

function CropRecommendation() {
  const [form, setForm] = useState({
    N: '', P: '', K: '', temperature: '', humidity: '', ph: '', rainfall: '',
  });

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locationInfo, setLocationInfo] = useState(null); // { place, zone_id, zone }
  const [locError, setLocError] = useState('');
  const debounceRef = useRef(null);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Autocomplete: debounce city search as user types
  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/city-search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.results || []);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  }, [query]);

    const resolveLocation = async (lat, lon, place, district) => {
    setResolving(true);
    setLocError('');
    try {
      let url = `${API_BASE}/resolve-location?lat=${lat}&lon=${lon}`;
      if (place) url += `&place=${encodeURIComponent(place)}`;
      if (district) url += `&district=${encodeURIComponent(district)}`;

      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Could not resolve location');
      }
      const data = await res.json();
      setLocationInfo(data);

      setForm((prev) => ({
        ...prev,
        temperature: data.weather.temperature,
        humidity: data.weather.humidity,
        rainfall: data.weather.rainfall,
        ...(data.zone
          ? { N: data.zone.N, P: data.zone.P, K: data.zone.K, ph: data.zone.ph }
          : {}),
      }));
    } catch (err) {
      setLocError(err.message);
      setLocationInfo(null);
    } finally {
      setResolving(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Location is not supported by this browser.');
      return;
    }
    setResolving(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolveLocation(position.coords.latitude, position.coords.longitude);
        setQuery('');
      },
      () => {
        setResolving(false);
        setLocError('Location access denied. Try typing your city instead.');
      }
    );
  };

    const selectSuggestion = (s) => {
    setQuery(s.name);
    setShowSuggestions(false);
    resolveLocation(s.lat, s.lon, s.name, s.district);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = {};
      for (const key in form) payload[key] = parseFloat(form[key]);

      const res = await fetch(`${API_BASE}/predict/crop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Prediction failed');
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Could not get a prediction. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const soilFields = [
    { name: 'N', label: 'Nitrogen (N)' },
    { name: 'P', label: 'Phosphorus (P)' },
    { name: 'K', label: 'Potassium (K)' },
    { name: 'ph', label: 'Soil pH' },
  ];
  const weatherFields = [
    { name: 'temperature', label: 'Temp (°C)' },
    { name: 'humidity', label: 'Humidity (%)' },
    { name: 'rainfall', label: 'Rainfall (mm/yr)' },
  ];

  const allFilled = Object.values(form).every((v) => v !== '' && v !== null);
  const rankLabels = ['🥇 Best Match', '🥈 2nd Choice', '🥉 3rd Choice'];

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-0">
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800 mb-2">
        🌱 Crop Recommendation
      </h2>
      <p className="text-stone-500 mb-6 text-sm sm:text-base">
        Get the best crop suggestions for your farm in Maharashtra.
      </p>

      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* --- LOCATION SECTION --- */}
        <div>
          <h3 className="font-semibold text-stone-700 mb-2">1. Your Location</h3>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type your city or district..."
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-stone-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 border-b border-stone-50 last:border-0"
                    >
                      {s.name} <span className="text-stone-400 text-xs">({s.district})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={resolving}
              className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-amber-600 transition disabled:opacity-50 whitespace-nowrap"
            >
              {resolving ? 'Locating...' : '📍 Use My Location'}
            </button>
          </div>

          {locError && <p className="text-red-500 text-xs mt-2">{locError}</p>}

          {locationInfo && (
            <p className="mt-2 text-xs text-stone-500">
              📍 <strong>{locationInfo.place}</strong> ({locationInfo.district})
              {locationInfo.zone ? (
                <>
                  {' '}· Zone: <strong>{locationInfo.zone.label}</strong>{' '}
                  {locationInfo.zone.confidence === 'high' ? '🟢' : '🟡'}{' '}
                  <span className="text-stone-400">(locked)</span>
                </>
              ) : (
                <span className="text-amber-600"> · No zone match — enter soil manually below</span>
              )}
            </p>
          )}
        </div>

        <hr className="border-stone-100" />

        {/* --- WEATHER (auto-filled, editable) --- */}
        <div>
          <h3 className="font-semibold text-stone-700 mb-2">2. Climate</h3>
          <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
            {weatherFields.map((f) => (
              <div key={f.name}>
                <label className="text-xs text-stone-500 block mb-1">{f.label}</label>
                <input
                  type="number"
                  step="any"
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            ))}
          </div>
        </div>

        <hr className="border-stone-100" />

        {/* --- SOIL (auto-filled from zone, still editable) --- */}
        <div>
          <h3 className="font-semibold text-stone-700 mb-2">3. Soil</h3>
          <p className="text-xs text-stone-400 mb-3">
            Auto-filled based on your zone. Edit these if you have your own
            Soil Health Card readings.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {soilFields.map((f) => (
              <div key={f.name}>
                <label className="text-xs text-stone-500 block mb-1">{f.label}</label>
                <input
                  type="number"
                  step="any"
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!allFilled || loading}
          className="w-full bg-stone-900 text-white text-sm px-4 py-3 rounded-lg hover:bg-amber-600 transition disabled:opacity-40"
        >
          {loading ? 'Predicting...' : 'Recommend Crop'}
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {result && (
          <div className="border-t border-stone-200 pt-4">
            <p className="text-stone-500 text-sm mb-3">Top Crop Suggestions:</p>
            <div className="space-y-3">
              {result.suggestions.map((s, i) => (
                <div key={s.crop} className="border border-stone-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-stone-600">{rankLabels[i]}</p>
                    <p className="text-sm font-bold text-amber-600">{s.confidence}%</p>
                  </div>
                  <p className="text-xl font-serif font-bold text-stone-800 capitalize">
                    {s.crop}
                  </p>
                  <div className="w-full bg-stone-100 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full"
                      style={{ width: `${s.confidence}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-stone-500 text-sm mt-4 mb-1">Why?</p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1">
              {result.top_factors.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default CropRecommendation;