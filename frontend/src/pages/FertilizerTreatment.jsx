import { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import SpotlightCard from '../components/SpotlightCard';
import AnimatedCounter from '../components/AnimatedCounter';
import ShinyText from '../components/ShinyText';
import { FlaskConical, Thermometer, CloudRain, Sprout, Printer, Share2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

import { useFarmLocation } from '../context/LocationContext';






const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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



  const [shops, setShops] = useState([]);

  const [shopsStatus, setShopsStatus] = useState(null);

  const [shopsLoading, setShopsLoading] = useState(false);

  const [shopsError, setShopsError] = useState('');



  const [result, setResult] = useState(null);



  // Resolve location and store coordinates

// resolveLocation is now handled via useFarmLocation context



// Use location from shared context

  const { savedLocation } = useFarmLocation();
  const shopsReqRef = useRef(0);
  const autoFilledRef = useRef({});



  // Autofill only values returned for the currently selected location.
  const num = (value) =>
    value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
      ? Number(value)
      : null;

  useEffect(() => {
    const weather = savedLocation?.weather;
    const zone = savedLocation?.zone;
    const values = {
      temperature: num(weather?.temperature),
      rainfall: num(weather?.rainfall),
      nitrogen: num(zone?.N),
      phosphorus: num(zone?.P),
      potassium: num(zone?.K),
      ph: num(zone?.ph),
    };
    setForm((previous) => {
      const next = { ...previous };
      Object.entries(values).forEach(([key, value]) => {
        if (value === null) return;
        const current = previous[key];
        const wasAutoFilled = Object.prototype.hasOwnProperty.call(autoFilledRef.current, key)
          && String(current) === String(autoFilledRef.current[key]);
        if (current === '' || current === null || current === undefined || wasAutoFilled) {
          next[key] = value;
          autoFilledRef.current[key] = value;
        }
      });
      return next;
    });
  }, [savedLocation?.weather, savedLocation?.zone]);

  const locationKey = `${savedLocation?.lat}_${savedLocation?.lon}`;
  const [prevLocationKey, setPrevLocationKey] = useState(locationKey);
  if (prevLocationKey !== locationKey) {
    setPrevLocationKey(locationKey);
    setShops([]);
    setShopsStatus(null);
    setShopsError('');
    setShopsLoading(false);
  }

  const fetchNearbyShops = async () => {
    const lat = Number(savedLocation?.lat);
    const lon = Number(savedLocation?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setShopsError('Please select or detect your location first.');
      return;
    }
    const requestId = ++shopsReqRef.current;
    setShopsLoading(true);
    setShopsError('');
    setShopsStatus(null);
    try {
      const response = await fetch(`${API_BASE}/nearby-shops?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.message || 'Failed to get nearby shops.');
      if (requestId !== shopsReqRef.current) return;
      setShops(Array.isArray(data.shops) ? data.shops : []);
      setShopsStatus(data.status || 'success');
    } catch (err) {
      if (requestId !== shopsReqRef.current) return;
      setShopsError(err?.message || 'Could not load nearby shops.');
      setShops([]);
    } finally {
      if (requestId === shopsReqRef.current) setShopsLoading(false);
    }
  };

  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null); // {msg, type}



  const showToast = (msg, type = 'success') => {

    setToast({ msg, type });

  };



  const handleToastClose = () => setToast(null);



  useEffect(() => {

    fetch(`${API_BASE}/fertilizer-options`)

      .then((r) => r.json())

      .then(setOptions)

      .catch(() => {});

  }, []);



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
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-12 agri-animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C150A] via-[#142311] to-[#1E3319] text-white p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 mb-2">
            <FlaskConical size={13} />
            <ShinyText text="Nutrient Optimization & N-P-K Balance" speed={4} className="text-[11px] font-semibold" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FDFAF2]">
            Precision Fertilizer Recommendation
          </h2>
          <p className="text-xs sm:text-sm text-[#A3B39C] mt-1">
            Determine balanced mineral application rates tailored to crop nutritional stages, soil color, and microclimate.
          </p>
        </div>
      </div>

      <div className="agri-glass-card p-6 sm:p-8 space-y-7">
        {/* --- FORM INPUTS (Hidden during print) --- */}
        <div className="space-y-7 no-print">
          {/* --- CROP & SOIL COLOR --- */}
          <div>
            <h3 className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider mb-3">
              Crop &amp; Soil Color
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#8E9B85] block mb-1.5">Crop</label>
                <select
                  name="crop"
                  value={form.crop}
                  onChange={handleChange}
                  className="w-full bg-[#10190D] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#FDFAF2] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                >
                  <option value="" className="bg-[#10190D]">Select crop</option>
                  {options.crop_types.map((c) => (
                    <option key={c} value={c} className="bg-[#10190D]">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#8E9B85] block mb-1.5">Soil color</label>
                <select
                  name="soil_color"
                  value={form.soil_color}
                  onChange={handleChange}
                  className="w-full bg-[#10190D] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#FDFAF2] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                >
                  <option value="" className="bg-[#10190D]">Select soil color</option>
                  {options.soil_types.map((s) => (
                    <option key={s} value={s} className="bg-[#10190D]">{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          {/* --- CLIMATE --- */}
          <div>
            <h3 className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider mb-3">
              Climate Parameters
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {climateFields.map((f) => {
                const fieldError = getError(f.name, form[f.name]);
                return (
                  <div
                    key={f.name}
                    className={`rounded-2xl p-4 border transition ${
                      fieldError ? 'bg-red-950/40 border-red-500/50' : 'bg-[#0B1309]/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center mb-2 border border-white/10 text-[#F59E0B]">
                      <f.icon size={14} strokeWidth={1.8} />
                    </div>
                    <label className="text-[10px] text-[#8E9B85] block leading-tight mb-1">{f.label}</label>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        step="any"
                        name={f.name}
                        value={form[f.name]}
                        onChange={handleChange}
                        className="w-full bg-transparent text-base font-serif font-bold text-[#FDFAF2] focus:outline-none min-w-0"
                      />
                      <span className="text-[10px] text-[#6B7C63] shrink-0 font-medium">{f.unit}</span>
                    </div>
                    {fieldError && <p className="text-[10px] text-red-400 mt-1">{fieldError}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-white/10" />

          {/* --- SOIL NUTRIENTS --- */}
          <div>
            <h3 className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider mb-1">
              Soil Nutrients (N-P-K &amp; pH)
            </h3>
            <p className="text-xs text-[#8E9B85] mb-3.5">
              Auto-filled from your agro-climatic zone. Edit if you have your Soil Health Card readings.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {npkFields.map((f) => {
                const fieldError = getError(f.name, form[f.name]);
                return (
                  <div
                    key={f.name}
                    className={`rounded-2xl p-4 border transition ${
                      fieldError ? 'bg-red-950/40 border-red-500/50' : 'bg-[#0B1309]/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center mb-2 border border-white/10 text-[#84CC16]">
                      <Sprout size={14} strokeWidth={1.8} />
                    </div>
                    <label className="text-[10px] text-[#8E9B85] block leading-tight mb-1">{f.label}</label>
                    <input
                      type="number"
                      step="any"
                      name={f.name}
                      value={form[f.name]}
                      onChange={handleChange}
                      className="w-full bg-transparent text-base font-serif font-bold text-[#FDFAF2] focus:outline-none"
                    />
                    {fieldError && <p className="text-[10px] text-red-400 mt-1">{fieldError}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!allFilled || loading || hasErrors}
            className="w-full agri-btn-primary py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {loading ? 'Analyzing Soil Chemistry...' : 'Recommend Fertilizer'}
          </button>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>



        {result && (
          <div className="pt-2 space-y-4 agri-animate-fade-in">
            <h3 className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider mb-2">
              Optimal Fertilizer Formulations
            </h3>

            <div className="space-y-3">
              {result.map((r, i) => (
                <SpotlightCard
                  key={r.fertilizer}
                  spotlightColor={i === 0 ? "rgba(132, 204, 22, 0.22)" : "rgba(132, 204, 22, 0.12)"}
                  borderColor={i === 0 ? "rgba(132, 204, 22, 0.5)" : "rgba(255, 255, 255, 0.15)"}
                  className={`rounded-2xl p-5 border transition ${
                    i === 0
                      ? 'bg-gradient-to-r from-[#142311] to-[#1C3218] border-[#84CC16]/40 text-white shadow-lg'
                      : 'bg-[#0B1309]/80 border-white/10 text-[#FDFAF2]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${i === 0 ? 'text-[#84CC16]' : 'text-[#8E9B85]'}`}>
                        {rankLabels[i]}
                      </div>
                      <div className="text-lg font-serif font-bold mt-0.5 text-[#FDFAF2]">{r.fertilizer}</div>
                      <div className="text-xs mt-1 text-[#A3B39C] leading-relaxed">
                        {r.description}
                      </div>
                      {r.price_estimate && (
                        <div className={`text-[11px] mt-2 font-medium flex items-center gap-1 ${i === 0 ? 'text-[#BEF264]' : 'text-[#84CC16]'}`}>
                          <span>{r.price_estimate}</span>
                          <span className="text-[#8E9B85] font-normal">(approximate price)</span>
                        </div>
                      )}
                    </div>
                    <div className={`text-2xl font-serif font-bold shrink-0 ${i === 0 ? 'text-[#84CC16]' : 'text-[#BEF264]'}`}>
                      <AnimatedCounter value={Math.round(r.confidence * 100)} suffix="%" duration={1000} />
                    </div>
                  </div>
                </SpotlightCard>
              ))}
            </div>

            {note && <p className="text-[11px] text-[#8E9B85] mt-3 leading-relaxed">{note}</p>}



            {/* Action buttons */}
            <div className="mt-4 flex flex-wrap gap-3 no-print">
              <button
                type="button"
                onClick={() => {
                  showToast('Preparing report for printing...');
                  window.print();
                }}
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white rounded-xl px-5 py-3 hover:bg-white/20 transition-colors text-xs font-semibold border border-white/15 cursor-pointer w-full sm:w-auto"
              >
                <Printer size={15} />
                <span>Print / Save</span>
              </button>

              <button
                onClick={fetchNearbyShops}
                disabled={shopsLoading || !savedLocation?.lat}
                className="agri-btn-primary rounded-xl px-5 py-3 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {shopsLoading ? 'Searching Supply Hubs...' : 'Find nearby shops'}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `AgriSense AI recommends ${result[0].fertilizer} (${Math.round(result[0].confidence * 100)}%) for my farm${savedLocation?.name ? ' in ' + savedLocation.name : ''}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl px-5 py-3 hover:bg-[#20bd5a] transition-colors text-xs font-semibold cursor-pointer w-full sm:w-auto"
              >
                <Share2 size={15} />
                <span>Share on WhatsApp</span>
              </a>
            </div>

            {/* Shops results */}
            {shopsLoading && (
              <div className="agri-glass-card p-4 mt-3 text-xs text-[#A8B5A0] flex items-center justify-center gap-3">
                <LoadingSpinner size={20} />
                <span>Searching agricultural supply shops nearby...</span>
              </div>
            )}

            {shopsError && (
              <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3.5 mt-3 text-xs text-red-300">
                {shopsError}
              </div>
            )}

            {!shopsLoading && shopsStatus === 'service_error' && (
              <div className="bg-[#1C160B]/70 border border-[#F59E0B]/30 rounded-xl p-3.5 mt-3 text-xs text-[#FDE68A]">
                Map data service is busy right now. Please try again or use the Google Maps links below.
              </div>
            )}

            {!shopsLoading && shopsStatus === 'no_results' && (
              <div className="bg-[#1C160B]/70 border border-[#F59E0B]/30 rounded-xl p-3.5 mt-3 text-xs text-[#FDE68A]">
                No agricultural dealers located within 15 km in local records. Use the Google Maps search below.
              </div>
            )}

            {!shopsLoading && shops.length > 0 && (
              <div className="space-y-3 mt-3">
                {shops.map((shop, i) => (
                  <div key={i} className="bg-[#0B1309]/80 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition">
                    <h4 className="font-bold text-[#FDFAF2] text-sm">{shop.name}</h4>
                    <p className="text-xs text-[#8E9B85] mt-0.5">
                      {shop.distance_km.toFixed(1)} km{shop.address ? ` — ${shop.address}` : ''}
                      {shop.phone ? ` · 📞 ${shop.phone}` : ''}
                    </p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-[#84CC16] hover:underline text-xs font-semibold"
                    >
                      Directions →
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Permanent Google Maps search buttons */}
            {!shopsLoading && (shopsStatus || shops.length > 0) && savedLocation?.lat && (
              <div className="mt-4 flex flex-wrap items-center gap-3 no-print">
                <a
                  href={`https://www.google.com/maps/search/fertilizer+shop/@${savedLocation.lat},${savedLocation.lon},13z`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#142311] text-[#BEF264] border border-[#84CC16]/30 rounded-xl px-4 py-2.5 hover:bg-[#1E3319] text-xs font-semibold transition"
                >
                  Fertilizer Dealers (Google Maps)
                </a>
                <a
                  href={`https://www.google.com/maps/search/krushi+kendra/@${savedLocation.lat},${savedLocation.lon},13z`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#10190D] text-[#FDFAF2] border border-white/10 rounded-xl px-4 py-2.5 hover:border-white/25 text-xs font-semibold transition"
                >
                  Krushi Kendra Hubs
                </a>
              </div>
            )}

          </div>

        )}

      </div>

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={handleToastClose}
        />
      )}

    </div>

  );

}



export default FertilizerTreatment;
