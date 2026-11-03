import { useState, useEffect } from 'react';
import { TrendingUp, CloudRain, Thermometer, Navigation, Ruler, IndianRupee, Wallet, Printer, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedCounter from '../components/AnimatedCounter';
import SpotlightCard from '../components/SpotlightCard';
import ShinyText from '../components/ShinyText';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-12 agri-animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C150A] via-[#142311] to-[#1E3319] text-white p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 mb-2">
            <TrendingUp size={13} />
            <ShinyText text="Economic Forecasting & Harvest Analytics" speed={4} className="text-[11px] font-semibold" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FDFAF2]">
            Yield &amp; Profit Prediction
          </h2>
          <p className="text-xs sm:text-sm text-[#A3B39C] mt-1">
            Estimate expected crop yield and seasonal net profit using regional climate modeling and production economics.
          </p>
        </div>
      </div>

      <div className="agri-glass-card p-6 sm:p-8 space-y-7">
        {/* --- FORM INPUTS (Hidden during print) --- */}
        <div className="space-y-7 no-print">
          {/* --- CROP --- */}
          <div>
            <h3 className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider mb-2.5">
              Select Crop
            </h3>
            <select
              name="crop"
              value={form.crop}
              onChange={handleChange}
              className="w-full bg-[#10190D] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#FDFAF2] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
            >
              <option value="" className="bg-[#10190D]">Select crop</option>
              {crops.map((c) => <option key={c} value={c} className="bg-[#10190D]">{c}</option>)}
            </select>
          </div>

          <div className="h-px bg-white/10" />

          {/* --- SEASONAL CLIMATE --- */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider">
                Seasonal Climate
              </h3>
              <button
                type="button"
                onClick={getSeasonalEstimate}
                disabled={resolving}
                className="flex items-center gap-1.5 text-xs text-[#BEF264] hover:text-[#84CC16] disabled:opacity-50 transition cursor-pointer"
              >
                <Navigation size={13} strokeWidth={2} />
                {resolving ? 'Fetching...' : 'Get estimate for my area'}
              </button>
            </div>
            <p className="text-xs text-[#8E9B85] mb-3.5">
              Expected rainfall and temperature for the full growing season.
            </p>
            {locError && <p className="text-red-400 text-xs mb-2">{locError}</p>}
            {climateNote && <p className="text-xs text-[#BEF264] mb-2.5">✓ {climateNote}</p>}
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

          {/* --- BUSINESS INPUTS --- */}
          <div>
            <h3 className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider mb-1">
              Farm &amp; Market Details
            </h3>
            <p className="text-xs text-[#8E9B85] mb-3.5">
              Used to calculate your total production and estimated profit.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {businessFields.map((f) => {
                const fieldError = getError(f.name, form[f.name]);
                return (
                  <div
                    key={f.name}
                    className={`rounded-2xl p-4 border transition ${
                      fieldError ? 'bg-red-950/40 border-red-500/50' : 'bg-[#0B1309]/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center mb-2 border border-white/10 text-[#84CC16]">
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
            <div className={`rounded-2xl p-4 border transition ${getError('cultivation_cost', form.cultivation_cost) ? 'bg-red-950/40 border-red-500/50' : 'bg-[#0B1309]/80 border-white/10 hover:border-white/20'}`}>
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center mb-2 border border-white/10 text-[#84CC16]">
                <Wallet size={14} strokeWidth={1.8} />
              </div>
              <label className="text-[10px] text-[#8E9B85] block leading-tight mb-1">
                Total Cultivation Cost (seeds, labor, fertilizer, machinery)
              </label>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  step="any"
                  name="cultivation_cost"
                  value={form.cultivation_cost}
                  onChange={handleChange}
                  className="w-full bg-transparent text-base font-serif font-bold text-[#FDFAF2] focus:outline-none min-w-0"
                />
                <span className="text-[10px] text-[#6B7C63] shrink-0 font-medium">₹ total</span>
              </div>
              {getError('cultivation_cost', form.cultivation_cost) && (
                <p className="text-[10px] text-red-400 mt-1">{getError('cultivation_cost', form.cultivation_cost)}</p>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!allFilled || loading || hasErrors}
            className="w-full agri-btn-primary py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {loading ? 'Calculating Harvest Model...' : 'Predict Yield & Profit'}
          </button>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        {result && (
          <div className="pt-2 space-y-4 agri-animate-fade-in">
            <h3 className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider mb-1">
              Harvest &amp; Profit Forecast
            </h3>

            <SpotlightCard
              spotlightColor="rgba(132, 204, 22, 0.22)"
              borderColor="rgba(132, 204, 22, 0.5)"
              className="rounded-2xl p-5 bg-gradient-to-r from-[#142311] to-[#1C3218] text-white shadow-lg border border-[#84CC16]/40 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/15">
                <TrendingUp size={22} strokeWidth={1.8} className="text-[#84CC16]" />
              </div>
              <div>
                <div className="text-[11px] text-[#BEF264] uppercase tracking-wide">Predicted Yield</div>
                <div className="text-2xl font-serif font-bold text-[#FDFAF2] mt-0.5">
                  <AnimatedCounter value={result.predicted_yield_tonnes_per_ha} decimals={2} duration={1000} />{' '}
                  <span className="text-sm font-sans font-normal text-[#A3B39C]">tonnes / hectare</span>
                </div>
              </div>
            </SpotlightCard>

            <div className="grid grid-cols-2 gap-3">
              <SpotlightCard
                spotlightColor="rgba(132, 204, 22, 0.14)"
                borderColor="rgba(132, 204, 22, 0.3)"
                className="bg-[#0B1309]/80 rounded-2xl p-4 border border-white/10"
              >
                <div className="text-[10px] text-[#8E9B85] uppercase tracking-wider">Total Production</div>
                <div className="text-lg font-serif font-bold text-[#FDFAF2] mt-0.5">
                  <AnimatedCounter value={result.profit.total_production_tonnes} decimals={2} duration={1000} />{' '}
                  <span className="text-xs font-sans font-normal text-[#8E9B85]">tonnes</span>
                </div>
              </SpotlightCard>
              <SpotlightCard
                spotlightColor="rgba(56, 189, 248, 0.14)"
                borderColor="rgba(56, 189, 248, 0.3)"
                className="bg-[#0B1309]/80 rounded-2xl p-4 border border-white/10"
              >
                <div className="text-[10px] text-[#8E9B85] uppercase tracking-wider">Est. Gross Revenue</div>
                <div className="text-lg font-serif font-bold text-[#FDFAF2] mt-0.5">
                  <AnimatedCounter value={result.profit.estimated_revenue} prefix="₹" duration={1200} />
                </div>
              </SpotlightCard>
            </div>

            <SpotlightCard
              spotlightColor={result.profit.estimated_profit >= 0 ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}
              borderColor={result.profit.estimated_profit >= 0 ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}
              className={`rounded-2xl p-5 border ${
                result.profit.estimated_profit >= 0
                  ? 'bg-[#0F2913]/70 border-[#22C55E]/40 text-[#4ADE80]'
                  : 'bg-[#2A0F0D]/70 border-[#EF4444]/40 text-[#F87171]'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider opacity-80">
                Estimated Net Profit
              </div>
              <div className="text-2xl font-serif font-bold mt-0.5">
                <AnimatedCounter value={result.profit.estimated_profit} prefix="₹" duration={1400} />
              </div>
            </SpotlightCard>

            <p className="text-[11px] text-[#8E9B85] leading-relaxed">{result.disclaimer}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 bg-white/10 text-white rounded-xl px-4 py-2 hover:bg-white/20 transition-colors text-xs font-semibold border border-white/15 cursor-pointer"
              >
                <Printer size={15} />
                <span>Print / Save</span>
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `AgriSense AI predicts a yield of ${result.predicted_yield_tonnes_per_ha} tonnes/ha with an estimated profit of ₹${result.profit.estimated_profit.toLocaleString('en-IN')} for ${form.crop} on my farm.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white rounded-xl px-4 py-2 hover:bg-[#20bd5a] transition-colors text-xs font-semibold cursor-pointer"
              >
                <Share2 size={15} />
                <span>Share on WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default YieldProfit;
