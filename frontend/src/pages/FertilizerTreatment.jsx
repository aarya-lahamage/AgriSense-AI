  import { useState, useRef, useEffect } from 'react';
import { FlaskConical, Thermometer, CloudRain, Sprout, MapPin, Navigation, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';




const API_BASE = 'http://127.0.0.1:8000';

const numericRules = {
  nitrogen: { min: 0, max: 200 },
  phosphorus: { min: 0, max: 200 },
  potassium: { min: 0, max: 250 },
  ph: { min: 0, max: 14 },
  rainfall: { min: 0, max: 5000 },
  temperature: { min: -5, max: 55 },
};

function getError(name, value) {
  if (value === '' || value === null) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return 'Enter a valid number';
  const rule = numericRules[name];
  if (!rule) return null;
  if (num < rule.min || num > rule.max) return `Must be between ${rule.min} and ${rule.max}`;
  return null;
}

function FertilizerTreatment() {
  const { token } = useAuth();

  const [options, setOptions] = useState({ soil_types: [], crop_types: [] });
  const [form, setForm] = useState({
    nitrogen: '', phosphorus: '', potassium: '', ph: '', rainfall: '', temperature: '',
    soil_color: '', crop: '',
  });

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locationInfo, setLocationInfo] = useState(null);
  const [locError, setLocError] = useState('');
  const [shops, setShops] = useState([]);
  const [shopsStatus, setShopsStatus] = useState(null);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopsError, setShopsError] = useState('');
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const debounceRef = useRef(null);

  const [result, setResult] = useState(null);

  // Resolve location and store coordinates
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
      setCoords({ lat, lon });
      setForm((prev) => ({
        ...prev,
        temperature: data.weather.temperature,
        rainfall: data.weather.rainfall,
        ...(data.zone ? { nitrogen: data.zone.N, phosphorus: data.zone.P, potassium: data.zone.K, ph: data.zone.ph } : {}),
      }));
    } catch (err) {
      setLocError(err.message);
      setLocationInfo(null);
      setCoords({ lat: null, lon: null });
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
      (pos) => {
        resolveLocation(pos.coords.latitude, pos.coords.longitude);
        setQuery('');
      },
      () => {
        setResolving(false);
        setLocError('Location access denied. Try typing your city instead.');
      }
    );
  };

  const fetchNearbyShops = async () => {
    if (!coords.lat || !coords.lon) return;
    setShopsLoading(true);
    setShopsError('');
    setShopsStatus(null);
    try {
      const res = await fetch(`${API_BASE}/nearby-shops?lat=${coords.lat}&lon=${coords.lon}`);
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail || data.message || 'Failed to get shops';
        throw new Error(msg);
      }
      setShops(data.shops || []);
      setShopsStatus(data.status || 'success');
    } catch (e) {
      setShopsError(e.message);
    } finally {
      setShopsLoading(false);
    }
  };
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/fertilizer-options`)
      .then((r) => r.json())
      .then(setOptions)
      .catch(() => {});
  }, []);

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



  const selectSuggestion = (s) => {
    setQuery(s.name);
    setShowSuggestions(false);
    resolveLocation(s.lat, s.lon, s.name, s.district);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const climateFields = [
    { name: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer },
    { name: 'rainfall', label: 'Rainfall', unit: 'mm/yr', icon: CloudRain },
  ];
  const npkFields = [
    { name: 'nitrogen', label: 'Nitrogen' },
    { name: 'phosphorus', label: 'Phosphorus' },
    { name: 'potassium', label: 'Potassium' },
    { name: 'ph', label: 'Soil pH' },
  ];

  const allFilled =
    climateFields.every((f) => form[f.name] !== '') &&
    npkFields.every((f) => form[f.name] !== '') &&
    form.soil_color !== '' && form.crop !== '';
  const hasErrors = Object.keys(numericRules).some((key) => getError(key, form[key]));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        nitrogen: parseFloat(form.nitrogen),
        phosphorus: parseFloat(form.phosphorus),
        potassium: parseFloat(form.potassium),
        ph: parseFloat(form.ph),
        rainfall: parseFloat(form.rainfall),
        temperature: parseFloat(form.temperature),
        soil_color: form.soil_color,
        crop: form.crop,
      };
      const res = await fetch(`${API_BASE}/predict/fertilizer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.detail)
          ? data.detail.map((d) => d.msg).join(', ')
          : data.detail || 'Prediction failed';
        throw new Error(msg);
      }
      setResult(data.suggestions);
      setNote(data.note || '');
    } catch (err) {
      setError(err.message || 'Could not get a recommendation.');
    } finally {
      setLoading(false);
    }
  };

  const rankLabels = ['Best Match', '2nd Option', '3rd Option'];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="font-serif text-[26px] font-medium text-[#22301A] mb-1">
        Fertilizer Recommendation
      </h2>
      <p className="text-[#7A8A6A] text-sm mb-7">
        Get the right fertilizer for your crop and soil conditions.
      </p>

      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] space-y-7">
        {/* --- FORM INPUTS (Hidden during print) --- */}
        <div className="space-y-7 no-print">
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
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type your city or district..."
                className="w-full bg-[#F6F4EC] border border-transparent rounded-xl pl-11 pr-4 py-3 text-sm text-[#22301A] placeholder:text-[#A8A391] focus:outline-none focus:border-[#5B7A3A] focus:bg-white transition"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white rounded-xl mt-1.5 shadow-lg border border-[#F0EEE4] max-h-48 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      type="button" key={i}
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
              type="button" onClick={useMyLocation} disabled={resolving}
              className="flex items-center justify-center gap-2 bg-[#22301A] text-white text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#334423] transition disabled:opacity-50 whitespace-nowrap shadow-sm"
            >
              <Navigation size={15} strokeWidth={2} />
              {resolving ? 'Locating...' : 'Use My Location'}
            </button>
          </div>
          {locError && <p className="text-red-500 text-xs mt-2.5">{locError}</p>}
          {locationInfo && (
            <p className="mt-2.5 text-xs text-[#7A8A6A]">
              📍 <strong className="text-[#22301A]">{locationInfo.place}</strong> — climate and soil nutrients auto-filled below.
            </p>
          )}
        </div>

        <div className="h-px bg-[#EEEBDD]"></div>

        {/* --- CROP & SOIL COLOR --- */}
        <div>
          <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-3.5">
            Crop &amp; Soil Color
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#7A8A6A] block mb-1.5">Crop</label>
              <select
                name="crop" value={form.crop} onChange={handleChange}
                className="w-full bg-[#F6F4EC] border border-transparent rounded-xl px-4 py-3 text-sm text-[#22301A] focus:outline-none focus:border-[#5B7A3A] focus:bg-white transition"
              >
                <option value="">Select crop</option>
                {options.crop_types.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#7A8A6A] block mb-1.5">Soil color</label>
              <select
                name="soil_color" value={form.soil_color} onChange={handleChange}
                className="w-full bg-[#F6F4EC] border border-transparent rounded-xl px-4 py-3 text-sm text-[#22301A] focus:outline-none focus:border-[#5B7A3A] focus:bg-white transition"
              >
                <option value="">Select soil color</option>
                {options.soil_types.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#EEEBDD]"></div>

        {/* --- CLIMATE --- */}
        <div>
          <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-3.5">
            Climate
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {climateFields.map((f) => {
              const fieldError = getError(f.name, form[f.name]);
              return (
                <div key={f.name} className={`rounded-xl p-3.5 shadow-[0_1px_2px_rgba(176,143,82,0.08)] ${fieldError ? 'bg-red-50 ring-1 ring-red-300' : 'bg-[#FBF3E3]'}`}>
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                    <f.icon size={14} strokeWidth={1.8} className={fieldError ? 'text-red-400' : 'text-[#B08F52]'} />
                  </div>
                  <label className="text-[10px] text-[#A8895A] block leading-tight mb-0.5">{f.label}</label>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number" step="any" name={f.name} value={form[f.name]} onChange={handleChange}
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

        {/* --- SOIL NUTRIENTS --- */}
        <div>
          <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-1">Soil Nutrients</h3>
          <p className="text-xs text-[#7A8A6A] mb-3.5">
            Auto-filled from your zone. Edit if you have your own Soil Health Card readings.
          </p>
          <div className="grid grid-cols-4 gap-3">
            {npkFields.map((f) => {
              const fieldError = getError(f.name, form[f.name]);
              return (
                <div key={f.name} className={`rounded-xl p-3.5 shadow-[0_1px_2px_rgba(91,122,58,0.08)] ${fieldError ? 'bg-red-50 ring-1 ring-red-300' : 'bg-[#E5EFD5]'}`}>
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                    <Sprout size={14} strokeWidth={1.8} className={fieldError ? 'text-red-400' : 'text-[#5B7A3A]'} />
                  </div>
                  <label className="text-[10px] text-[#5B7A3A] block leading-tight mb-0.5">{f.label}</label>
                  <input
                    type="number" step="any" name={f.name} value={form[f.name]} onChange={handleChange}
                    className="w-full bg-transparent text-[16px] font-medium text-[#22301A] focus:outline-none leading-tight"
                  />
                  {fieldError && <p className="text-[10px] text-red-500 mt-1">{fieldError}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSubmit} disabled={!allFilled || loading || hasErrors}
          className="w-full bg-[#5B7A3A] text-white text-sm font-medium px-4 py-3.5 rounded-xl hover:bg-[#4C6B4C] transition disabled:opacity-40 shadow-[0_4px_12px_rgba(91,122,58,0.25)]"
        >
          {loading ? 'Analyzing...' : 'Recommend Fertilizer'}
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {result && (
          <div className="pt-1">
            <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-3.5">
              Recommendations
            </h3>
            <div className="space-y-2.5">
              {result.map((r, i) => (
                <div
                  key={r.fertilizer}
                  className={i === 0
                    ? 'rounded-xl px-5 py-4 bg-[#22301A] text-white shadow-[0_4px_16px_rgba(34,48,26,0.18)]'
                    : 'rounded-xl px-5 py-4 bg-[#F6F4EC] text-[#22301A]'}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className={`text-[11px] font-medium ${i === 0 ? 'text-[#B8D08A]' : 'text-[#8A8A6A]'}`}>
                        {rankLabels[i]}
                      </div>
                      <div className="text-lg font-semibold mt-0.5">{r.fertilizer}</div>
                      <div className={`text-xs mt-1 ${i === 0 ? 'text-[#DCE8C8]' : 'text-[#7A8A6A]'}`}>
                        {r.description}
                      </div>
                      {r.price_estimate && (
                        <div className={`text-[11px] mt-2 font-medium flex items-center gap-1 ${i === 0 ? 'text-[#B8D08A]' : 'text-[#5B7A3A]'}`}>
                          <span>{r.price_estimate}</span>
                          <span className={i === 0 ? 'text-[#A3B87A] font-normal' : 'text-[#8A8A6A] font-normal'}>
                            (approx — confirm with your dealer)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`text-xl font-serif shrink-0 ${i === 0 ? 'text-white' : 'text-[#5B7A3A]'}`}>
                      {Math.round(r.confidence * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {note && <p className="text-[11px] text-[#A8A391] mt-3">{note}</p>}

{/* Find nearby shops button, WhatsApp Share, & Print / Save */}
<div className="mt-4 flex flex-wrap gap-3 no-print">
  <button
    type="button"
    onClick={() => window.print()}
    className="inline-flex items-center justify-center gap-2 bg-[#22301A] text-white rounded-xl px-5 py-3 hover:bg-[#334423] transition-colors text-sm font-medium w-full sm:w-auto"
  >
    <Printer size={16} />
    Print / Save
  </button>

  <button
    onClick={fetchNearbyShops}
    disabled={shopsLoading || !coords.lat}
    className="bg-[#5B7A3A] text-white rounded-xl px-5 py-3 hover:bg-[#4C6B4C] disabled:opacity-50"
  >
    {shopsLoading ? 'Searching...' : 'Find nearby shops'}
  </button>

  <a
    href={`https://wa.me/?text=${encodeURIComponent(
      `AgriSense AI recommends ${result[0].fertilizer} (${Math.round(result[0].confidence * 100)}%) for my farm${query ? ' in ' + query : ''}.`
    )}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl px-5 py-3 hover:bg-[#20bd5a] transition-colors text-sm font-medium w-full sm:w-auto"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
    Share on WhatsApp
  </a>
</div>

{/* Shops results */}
{shopsLoading && <p className="text-sm text-[#7A8A6A] mt-2">Loading nearby shops...</p>}
{shopsError && <p className="text-sm text-red-500 mt-2">{shopsError}</p>}

{!shopsLoading && !shopsError && shopsStatus === 'service_error' && (
  <p className="text-sm text-[#7A8A6A] mt-2">Map data service abhi busy hai, thodi der baad try karo ya neeche Google Maps use karo.</p>
)}

{!shopsLoading && !shopsError && shopsStatus === 'no_results' && (
  <p className="text-sm text-[#7A8A6A] mt-2">Is area mein map data mein dukaanein nahi mili.</p>
)}

{shops.length > 0 && (
  <div className="space-y-3 mt-3">
    {shops.map((shop, i) => (
      <div key={i} className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)]">
        <h4 className="font-medium text-[#22301A]">{shop.name}</h4>
        <p className="text-sm text-[#7A8A6A]">
          {shop.distance_km.toFixed(2)} km{shop.address ? ` — ${shop.address}` : ''}
        </p>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lon}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-[#5B7A3A] underline text-sm"
        >
          Directions
        </a>
      </div>
    ))}
  </div>
)}

{!shopsLoading && !shopsError && shopsStatus && (
  <div className="mt-4 flex flex-wrap items-center gap-3 no-print">
    <a
      href={`https://www.google.com/maps/search/fertilizer+shop/@${coords.lat},${coords.lon},13z`}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-[#5B7A3A] text-white rounded-xl px-4 py-2 hover:bg-[#4C6B4C] text-sm"
    >
      Google Maps pe fertilizer shops dhoondo
    </a>
    <a
      href={`https://www.google.com/maps/search/krushi+kendra/@${coords.lat},${coords.lon},13z`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#5B7A3A] underline text-sm"
    >
      Krushi Kendra dhoondo
    </a>
  </div>
)}
          </div>
        )}
      </div>
    </div>
  );
}

export default FertilizerTreatment;
