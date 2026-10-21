import { useState, useEffect } from 'react';
import { TrendingUp, CloudRain, Thermometer, Sprout, Navigation, Ruler, IndianRupee, Wallet, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://127.0.0.1:8000';

const numericRules = {
  rainfall: { min: 0, max: 5000 },
  avg_temp: { min: -5, max: 55 },
  land_area_acres: { min: 0.1, max: 10000 },
  price_per_quintal: { min: 1, max: 100000 },
  cultivation_cost: { min: 0, max: 100000000 },
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

function YieldProfit() {
  const { token } = useAuth();

  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState({
    crop: '', rainfall: '', avg_temp: '',
    land_area_acres: '', price_per_quintal: '', cultivation_cost: '',
  });

  const [coords, setCoords] = useState(null);
  const [climateNote, setClimateNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [locError, setLocError] = useState('');

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/yield-crops`)
      .then((r) => r.json())
      .then((d) => setCrops(d.crops || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getSeasonalEstimate = () => {
    if (!form.crop) {
      setLocError('Select a crop first, so we know the right season length.');
      return;
    }
    if (!navigator.geolocation) {
      setLocError('Location is not supported by this browser.');
      return;
    }
    setResolving(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lon: longitude });
          const res = await fetch(
            `${API_BASE}/yield-seasonal-estimate?lat=${latitude}&lon=${longitude}&crop=${encodeURIComponent(form.crop)}`
          );
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || 'Could not fetch seasonal estimate');
          }
          const data = await res.json();
          setForm((prev) => ({
            ...prev,
            rainfall: data.avg_rainfall ?? prev.rainfall,
            avg_temp: data.avg_temp ?? prev.avg_temp,
          }));
          setClimateNote(data.note);
        } catch (err) {
          setLocError(err.message);
        } finally {
          setResolving(false);
        }
      },
      () => {
        setResolving(false);
        setLocError('Location access denied. Enter rainfall and temperature manually below.');
      }
    );
  };

  const climateFields = [
    { name: 'rainfall', label: 'Seasonal Rainfall', unit: 'mm', icon: CloudRain },
    { name: 'avg_temp', label: 'Avg Temperature', unit: '°C', icon: Thermometer },
  ];
  const businessFields = [
    { name: 'land_area_acres', label: 'Land Area', unit: 'acres', icon: Ruler },
    { name: 'price_per_quintal', label: 'Market Price', unit: '₹/quintal', icon: IndianRupee },
  ];

  const allFilled = ['crop', 'rainfall', 'avg_temp', 'land_area_acres', 'price_per_quintal', 'cultivation_cost']
    .every((k) => form[k] !== '');
  const hasErrors = Object.keys(numericRules).some((key) => getError(key, form[key]));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        crop: form.crop,
        rainfall: parseFloat(form.rainfall),
        avg_temp: parseFloat(form.avg_temp),
        land_area_acres: parseFloat(form.land_area_acres),
        price_per_quintal: parseFloat(form.price_per_quintal),
        cultivation_cost: parseFloat(form.cultivation_cost),
      };
      const res = await fetch(`${API_BASE}/predict/yield`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.detail) ? data.detail.map((d) => d.msg).join(', ') : data.detail || 'Prediction failed';
        throw new Error(msg);
      }
      setResult(data);
    } catch (err) {
      setError(err.message || 'Could not get a prediction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="font-serif text-[26px] font-medium text-[#22301A] mb-1">
        Yield &amp; Profit Prediction
      </h2>
      <p className="text-[#7A8A6A] text-sm mb-7">
        Estimate expected crop yield and profit for the season.
      </p>

      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] space-y-7">
        {/* --- FORM INPUTS (Hidden during print) --- */}
        <div className="space-y-7 no-print">
          {/* --- CROP --- */}
          <div>
            <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-3.5">Crop</h3>
          <select
            name="crop" value={form.crop} onChange={handleChange}
            className="w-full bg-[#F6F4EC] border border-transparent rounded-xl px-4 py-3 text-sm text-[#22301A] focus:outline-none focus:border-[#5B7A3A] focus:bg-white transition"
          >
            <option value="">Select crop</option>
            {crops.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="h-px bg-[#EEEBDD]"></div>

        {/* --- SEASONAL CLIMATE --- */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide">
              Seasonal Climate
            </h3>
            <button
              type="button" onClick={getSeasonalEstimate} disabled={resolving}
              className="flex items-center gap-1.5 text-xs text-[#5B7A3A] hover:text-[#4C6B4C] disabled:opacity-50 transition"
            >
              <Navigation size={13} strokeWidth={2} />
              {resolving ? 'Fetching...' : 'Get estimate for my area'}
            </button>
          </div>
          <p className="text-xs text-[#7A8A6A] mb-3.5">
            Enter the expected rainfall and temperature for the <em>whole growing season</em> — not today's weather, since crops take months to mature.
          </p>
          {locError && <p className="text-red-500 text-xs mb-2">{locError}</p>}
          {climateNote && <p className="text-[11px] text-[#5B7A3A] mb-2.5">✓ {climateNote}</p>}
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

        {/* --- BUSINESS INPUTS --- */}
        <div>
          <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-1">
            Farm &amp; Market Details
          </h3>
          <p className="text-xs text-[#7A8A6A] mb-3.5">
            Used to calculate your total production and estimated profit.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {businessFields.map((f) => {
              const fieldError = getError(f.name, form[f.name]);
              return (
                <div key={f.name} className={`rounded-xl p-3.5 shadow-[0_1px_2px_rgba(91,122,58,0.08)] ${fieldError ? 'bg-red-50 ring-1 ring-red-300' : 'bg-[#E5EFD5]'}`}>
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                    <f.icon size={14} strokeWidth={1.8} className={fieldError ? 'text-red-400' : 'text-[#5B7A3A]'} />
                  </div>
                  <label className="text-[10px] text-[#5B7A3A] block leading-tight mb-0.5">{f.label}</label>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number" step="any" name={f.name} value={form[f.name]} onChange={handleChange}
                      className="w-full bg-transparent text-[16px] font-medium text-[#22301A] focus:outline-none leading-tight min-w-0"
                    />
                    <span className="text-[10px] text-[#7A9A5A] shrink-0">{f.unit}</span>
                  </div>
                  {fieldError && <p className="text-[10px] text-red-500 mt-1">{fieldError}</p>}
                </div>
              );
            })}
          </div>
          <div className={`rounded-xl p-3.5 shadow-[0_1px_2px_rgba(91,122,58,0.08)] ${getError('cultivation_cost', form.cultivation_cost) ? 'bg-red-50 ring-1 ring-red-300' : 'bg-[#E5EFD5]'}`}>
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
              <Wallet size={14} strokeWidth={1.8} className="text-[#5B7A3A]" />
            </div>
            <label className="text-[10px] text-[#5B7A3A] block leading-tight mb-0.5">
              Total Cultivation Cost (seeds, labor, fertilizer, etc.)
            </label>
            <div className="flex items-baseline gap-1">
              <input
                type="number" step="any" name="cultivation_cost" value={form.cultivation_cost} onChange={handleChange}
                className="w-full bg-transparent text-[16px] font-medium text-[#22301A] focus:outline-none leading-tight min-w-0"
              />
              <span className="text-[10px] text-[#7A9A5A] shrink-0">₹ total</span>
            </div>
            {getError('cultivation_cost', form.cultivation_cost) && (
              <p className="text-[10px] text-red-500 mt-1">{getError('cultivation_cost', form.cultivation_cost)}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit} disabled={!allFilled || loading || hasErrors}
          className="w-full bg-[#5B7A3A] text-white text-sm font-medium px-4 py-3.5 rounded-xl hover:bg-[#4C6B4C] transition disabled:opacity-40 shadow-[0_4px_12px_rgba(91,122,58,0.25)]"
        >
          {loading ? 'Calculating...' : 'Predict Yield & Profit'}
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {result && (
          <div className="pt-1 space-y-3">
            <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-1">Results</h3>

            <div className="rounded-xl px-5 py-4 bg-[#22301A] text-white shadow-[0_4px_16px_rgba(34,48,26,0.18)] flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-[#334423] flex items-center justify-center shrink-0">
                <TrendingUp size={20} strokeWidth={1.8} className="text-[#B8D08A]" />
              </div>
              <div>
                <div className="text-[11px] text-[#B8D08A] uppercase tracking-wide">Predicted Yield</div>
                <div className="text-xl font-serif font-medium mt-0.5">
                  {result.predicted_yield_tonnes_per_ha} tonnes/hectare
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F6F4EC] rounded-xl p-4">
                <div className="text-[10px] text-[#8A8A6A] uppercase">Total Production</div>
                <div className="text-lg font-medium text-[#22301A] mt-0.5">
                  {result.profit.total_production_tonnes} tonnes
                </div>
              </div>
              <div className="bg-[#F6F4EC] rounded-xl p-4">
                <div className="text-[10px] text-[#8A8A6A] uppercase">Est. Revenue</div>
                <div className="text-lg font-medium text-[#22301A] mt-0.5">
                  ₹{result.profit.estimated_revenue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-4 ${result.profit.estimated_profit >= 0 ? 'bg-[#E5EFD5]' : 'bg-[#FBE9E7]'}`}>
              <div className={`text-[10px] uppercase ${result.profit.estimated_profit >= 0 ? 'text-[#5B7A3A]' : 'text-[#C75B44]'}`}>
                Estimated Profit
              </div>
              <div className={`text-2xl font-serif font-medium mt-0.5 ${result.profit.estimated_profit >= 0 ? 'text-[#22301A]' : 'text-[#C75B44]'}`}>
                ₹{result.profit.estimated_profit.toLocaleString('en-IN')}
              </div>
            </div>

            <p className="text-[11px] text-[#A8A391] leading-relaxed">{result.disclaimer}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 bg-[#22301A] text-white rounded-xl px-4 py-2 hover:bg-[#334423] transition-colors text-sm font-medium"
              >
                <Printer size={16} />
                Print / Save
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `AgriSense AI predicts a yield of ${result.predicted_yield_tonnes_per_ha} tonnes/ha with an estimated profit of ₹${result.profit.estimated_profit.toLocaleString('en-IN')} for ${form.crop} on my farm.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white rounded-xl px-4 py-2 hover:bg-[#20bd5a] transition-colors text-sm font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                Share on WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default YieldProfit;
