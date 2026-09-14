import { useState, useEffect, useRef } from 'react';
import { MapPin, Thermometer, Droplets, CloudRain, Sprout, Navigation } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

const fieldRules = {
  N: { min: 0, max: 200 },
  P: { min: 0, max: 200 },
  K: { min: 0, max: 250 },
  temperature: { min: -5, max: 55 },
  humidity: { min: 0, max: 100 },
  ph: { min: 0, max: 14 },
  rainfall: { min: 0, max: 5000 },
};

function getFieldError(name, value) {
  if (value === '' || value === null) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return 'Enter a valid number';
  const rule = fieldRules[name];
  if (!rule) return null;
  if (num < rule.min || num > rule.max) return `Must be between ${rule.min} and ${rule.max}`;
  return null;
}

function CropRecommendation() {
  const [form, setForm] = useState({
    N: '', P: '', K: '', temperature: '', humidity: '', ph: '', rainfall: '',
  });

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locationInfo, setLocationInfo] = useState(null);
  const [locError, setLocError] = useState('');
  const debounceRef = useRef(null);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const weatherFields = [
    { name: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer },
    { name: 'humidity', label: 'Humidity', unit: '%', icon: Droplets },
    { name: 'rainfall', label: 'Rainfall', unit: 'mm/yr', icon: CloudRain },
  ];
  const soilFields = [
    { name: 'N', label: 'Nitrogen' },
    { name: 'P', label: 'Phosphorus' },
    { name: 'K', label: 'Potassium' },
    { name: 'ph', label: 'Soil pH' },
  ];

  const allFilled = Object.values(form).every((v) => v !== '' && v !== null);
  const hasErrors = Object.keys(form).some((key) => getFieldError(key, form[key]));
  const rankLabels = ['Best Match', '2nd Choice', '3rd Choice'];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="font-serif text-[26px] font-medium text-[#22301A] mb-1">
        Crop Recommendation
      </h2>
      <p className="text-[#7A8A6A] text-sm mb-7">
        Get the best crop suggestions for your farm in Maharashtra.
      </p>

      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] space-y-7">
        {/* --- LOCATION --- */}
        <div>
          <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-3.5">
            Your Location
          </h3>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <MapPin size={17} strokeWidth={1.8} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0AA98]" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type your city or district..."
                className="w-full bg-[#F6F4EC] border border-transparent rounded-xl pl-11 pr-4 py-3 text-sm text-[#22301A] placeholder:text-[#A8A391] focus:outline-none focus:border-[#5B7A3A] focus:bg-white transition"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white rounded-xl mt-1.5 shadow-lg border border-[#F0EEE4] max-h-48 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#F6F4EC] first:rounded-t-xl last:rounded-b-xl transition"
                    >
                      <span className="text-[#22301A]">{s.name}</span>{' '}
                      <span className="text-[#B0AA98] text-xs">({s.district})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={resolving}
              className="flex items-center justify-center gap-2 bg-[#22301A] text-white text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#334423] transition disabled:opacity-50 whitespace-nowrap shadow-sm"
            >
              <Navigation size={15} strokeWidth={2} />
              {resolving ? 'Locating...' : 'Use My Location'}
            </button>
          </div>

          {locError && <p className="text-red-500 text-xs mt-2.5">{locError}</p>}

          {locationInfo && (
            <div className="mt-3 flex items-start gap-1.5 text-xs text-[#7A8A6A]">
              <MapPin size={13} className="mt-0.5 shrink-0 text-[#5B7A3A]" />
              <p>
                <strong className="text-[#22301A]">{locationInfo.place}</strong> ({locationInfo.district})
                {locationInfo.zone ? (
                  <>
                    {' '}· Zone: <strong className="text-[#22301A]">{locationInfo.zone.label}</strong>{' '}
                    <span className={locationInfo.zone.confidence === 'high' ? 'text-[#5B7A3A]' : 'text-[#C9A15A]'}>
                      ({locationInfo.zone.confidence === 'high' ? 'verified region' : 'estimated region'})
                    </span>{' '}
                    <span className="text-[#B0AA98]">— locked</span>
                  </>
                ) : (
                  <span className="text-amber-600"> · No zone match — enter soil manually below</span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="h-px bg-[#EEEBDD]"></div>

        {/* --- CLIMATE --- */}
        <div>
          <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-3.5">
            Climate
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {weatherFields.map((f) => {
              const fieldError = getFieldError(f.name, form[f.name]);
              return (
                <div
                  key={f.name}
                  className={`rounded-xl p-3.5 shadow-[0_1px_2px_rgba(176,143,82,0.08)] ${
                    fieldError ? 'bg-red-50 ring-1 ring-red-300' : 'bg-[#FBF3E3]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                    <f.icon size={14} strokeWidth={1.8} className={fieldError ? 'text-red-400' : 'text-[#B08F52]'} />
                  </div>
                  <label className="text-[10px] text-[#A8895A] block leading-tight mb-0.5">
                    {f.label}
                  </label>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      step="any"
                      name={f.name}
                      value={form[f.name]}
                      onChange={handleChange}
                      className="w-full bg-transparent text-[16px] font-medium text-[#3D2E14] focus:outline-none leading-tight min-w-0"
                    />
                    <span className="text-[10px] text-[#C4A876] shrink-0">{f.unit}</span>
                  </div>
                  {fieldError && <p className="text-[10px] text-red-500 mt-1">{fieldError}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-[#EEEBDD]"></div>

        {/* --- SOIL --- */}
        <div>
          <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-1">
            Soil
          </h3>
          <p className="text-xs text-[#7A8A6A] mb-3.5">
            Auto-filled based on your zone. Edit if you have your own Soil Health Card readings.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {soilFields.map((f) => {
              const fieldError = getFieldError(f.name, form[f.name]);
              return (
                <div
                  key={f.name}
                  className={`rounded-xl p-3.5 shadow-[0_1px_2px_rgba(91,122,58,0.08)] ${
                    fieldError ? 'bg-red-50 ring-1 ring-red-300' : 'bg-[#E5EFD5]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                    <Sprout size={14} strokeWidth={1.8} className={fieldError ? 'text-red-400' : 'text-[#5B7A3A]'} />
                  </div>
                  <label className="text-[10px] text-[#5B7A3A] block leading-tight mb-0.5">
                    {f.label}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    className="w-full bg-transparent text-[16px] font-medium text-[#22301A] focus:outline-none leading-tight"
                  />
                  {fieldError && <p className="text-[10px] text-red-500 mt-1">{fieldError}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!allFilled || loading || hasErrors}
          className="w-full bg-[#5B7A3A] text-white text-sm font-medium px-4 py-3.5 rounded-xl hover:bg-[#4C6B4C] transition disabled:opacity-40 shadow-[0_4px_12px_rgba(91,122,58,0.25)]"
        >
          {loading ? 'Predicting...' : 'Recommend Crop'}
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {result && (
          <div className="pt-1">
            <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-3.5">
              Top Suggestions
            </h3>
            <div className="space-y-2.5">
              {result.suggestions.map((s, i) => (
                <div
                  key={s.crop}
                  className={
                    i === 0
                      ? 'rounded-xl px-5 py-4 flex justify-between items-center bg-[#22301A] text-white shadow-[0_4px_16px_rgba(34,48,26,0.18)]'
                      : 'rounded-xl px-5 py-4 flex justify-between items-center bg-[#F6F4EC] text-[#22301A]'
                  }
                >
                  <div>
                    <div className={`text-[11px] font-medium ${i === 0 ? 'text-[#B8D08A]' : 'text-[#8A8A6A]'}`}>
                      {rankLabels[i]}
                    </div>
                    <div className="text-lg font-semibold capitalize mt-0.5">{s.crop}</div>
                  </div>
                  <div className={`text-2xl font-serif ${i === 0 ? 'text-white' : 'text-[#5B7A3A]'}`}>
                    {s.confidence}%
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs font-medium text-[#7A8A6A] mt-5 mb-2 uppercase tracking-wide">Why?</p>
            <ul className="text-sm text-[#22301A] space-y-1.5">
              {result.top_factors.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="text-[#5B7A3A] mt-1">●</span> {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default CropRecommendation;