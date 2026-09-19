import { useState, useRef, useEffect } from 'react';
import { FlaskConical, Thermometer, CloudRain, Sprout, MapPin, Navigation } from 'lucide-react';

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
  const debounceRef = useRef(null);

  const [result, setResult] = useState(null);
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
        rainfall: data.weather.rainfall,
        ...(data.zone
          ? { nitrogen: data.zone.N, phosphorus: data.zone.P, potassium: data.zone.K, ph: data.zone.ph }
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
        headers: { 'Content-Type': 'application/json' },
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
                    </div>
                    <div className={`text-xl font-serif shrink-0 ${i === 0 ? 'text-white' : 'text-[#5B7A3A]'}`}>
                      {Math.round(r.confidence * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {note && <p className="text-[11px] text-[#A8A391] mt-3">{note}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default FertilizerTreatment;