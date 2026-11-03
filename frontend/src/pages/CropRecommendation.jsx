import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Sprout,
  Printer,
  Repeat,
  Volume2,
  VolumeX,
  CheckCircle2,
  Share2,
  Upload,
  ScanLine,
  FileSearch,
  Check,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CropCalendar from '../components/CropCalendar';
import SpotlightCard from '../components/SpotlightCard';
import AnimatedCounter from '../components/AnimatedCounter';
import ShinyText from '../components/ShinyText';
import LaserScannerOverlay from '../components/LaserScannerOverlay';
import { speakText, stopSpeech, isSpeaking } from '../utils/speech';
import { useFarmLocation } from '../context/LocationContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
  const { token } = useAuth();
  const routeLocation = useLocation();
  const { savedLocation } = useFarmLocation();

  const stateInitial = routeLocation.state;
  const hasStateCard = stateInitial && (stateInitial.N !== undefined || stateInitial.ph !== undefined);

  const autoFilledRef = useRef({});

  // Form input values
  const [form, setForm] = useState(() => ({
    N: hasStateCard && stateInitial.N != null ? stateInitial.N : '',
    P: hasStateCard && stateInitial.P != null ? stateInitial.P : '',
    K: hasStateCard && stateInitial.K != null ? stateInitial.K : '',
    temperature: '',
    humidity: '',
    ph: hasStateCard && stateInitial.ph != null ? stateInitial.ph : '',
    rainfall: '',
  }));

  // Soil Input Mode: 'average' (default regional baseline) vs 'upload' (Soil Health Card OCR)
  const [soilMode, setSoilMode] = useState(() => (hasStateCard ? 'upload' : 'average'));

  // OCR Upload States
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrPreview, setOcrPreview] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrSuccess, setOcrSuccess] = useState(() => !!hasStateCard);

  const [isSpeakingResult, setIsSpeakingResult] = useState(false);

  const [result, setResult] = useState(null);
  const [rotationData, setRotationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-fill weather & agro-climatic averages when in 'average' mode
  useEffect(() => {
    if (!savedLocation) return;
    const weather = savedLocation.weather || {};
    const zone = savedLocation.zone || null;

    setForm((previous) => {
      const next = { ...previous };
      const values = {
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfall,
        ...(soilMode === 'average' ? {
          N: zone?.N,
          P: zone?.P,
          K: zone?.K,
          ph: zone?.ph,
        } : {}),
      };

      Object.entries(values).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return;
        const current = previous[key];
        const wasAutoFilled = Object.prototype.hasOwnProperty.call(autoFilledRef.current, key)
          && String(current) === String(autoFilledRef.current[key]);
        if (current === '' || current === null || current === undefined || wasAutoFilled) {
          next[key] = Number(value);
          autoFilledRef.current[key] = Number(value);
        }
      });
      return next;
    });
  }, [savedLocation, soilMode]);

  useEffect(() => {
    if (result?.suggestions?.[0]?.crop) {
      fetch(`${API_BASE}/rotation-suggestion/${result.suggestions[0].crop}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setRotationData(data))
        .catch(() => setRotationData(null));
    }
  }, [result]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // OCR File Selection
  const handleOcrFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrFile(file);
    setOcrError('');
    setOcrSuccess(false);

    const reader = new FileReader();
    reader.onload = () => setOcrPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // OCR Scanning & Auto-population
  const handleScanSoilCard = async () => {
    if (!ocrFile || ocrLoading) return;
    setOcrLoading(true);
    setOcrError('');
    try {
      const formData = new FormData();
      formData.append('file', ocrFile);

      const res = await fetch(`${API_BASE}/ocr/soil-card`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to scan Soil Health Card.');
      }

      const data = await res.json();

      // Auto-populate the N, P, K, pH form parameters directly!
      setForm((prev) => ({
        ...prev,
        N: data.N !== null && data.N !== undefined ? data.N : prev.N,
        P: data.P !== null && data.P !== undefined ? data.P : prev.P,
        K: data.K !== null && data.K !== undefined ? data.K : prev.K,
        ph: data.pH !== null && data.pH !== undefined ? data.pH : prev.ph,
      }));

      setOcrSuccess(true);
    } catch (err) {
      setOcrError(err.message || 'Could not process Soil Health Card. Please check your image or enter manually.');
    } finally {
      setOcrLoading(false);
    }
  };

  // Switch back to regional average data
  const handleResetToRegionalAverage = () => {
    setSoilMode('average');
    setOcrFile(null);
    setOcrPreview(null);
    setOcrSuccess(false);
    const zone = savedLocation?.zone;
    if (zone) {
      setForm((prev) => ({
        ...prev,
        N: zone.N ?? '',
        P: zone.P ?? '',
        K: zone.K ?? '',
        ph: zone.ph ?? '',
      }));
    }
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
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
    { name: 'N', label: 'Nitrogen (N)', sub: 'Available soil N' },
    { name: 'P', label: 'Phosphorus (P)', sub: 'Available soil P' },
    { name: 'K', label: 'Potassium (K)', sub: 'Available soil K' },
    { name: 'ph', label: 'Soil pH', sub: 'Acidity / Alkalinity' },
  ];

  const allFilled = Object.values(form).every((v) => v !== '' && v !== null);
  const hasErrors = Object.keys(form).some((key) => getFieldError(key, form[key]));
  const rankLabels = ['Primary Recommendation', 'Alternative Choice', 'Resilient Contingency'];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12 agri-animate-fade-in font-sans">
      {/* ── HEADER BANNER ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C150A] via-[#142311] to-[#1E3319] text-white p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 mb-2">
              <Sprout size={13} />
              <ShinyText text="ML Crop Recommendation Advisor" speed={4} className="text-[11px] font-semibold" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FDFAF2]">
              Which crop should you grow?
            </h2>
            <p className="text-xs sm:text-sm text-[#A3B39C] mt-1.5 leading-relaxed">
              Follow 2 simple steps: confirm your weather conditions, then choose how to enter your soil data (Regional Average or Soil Card Scan).
            </p>
          </div>
        </div>
      </div>

      {/* ── SIMPLE 2-STEP GUIDE BOX ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="bg-[#111C0F]/90 border border-[#84CC16]/30 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#84CC16] text-[#070B06] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
            1
          </div>
          <div>
            <div className="text-xs font-bold text-white">Review Weather &amp; Rain</div>
            <p className="text-[11px] text-white/60 mt-0.5 leading-snug">
              Auto-filled using live weather in {savedLocation?.name || 'your region'}.
            </p>
          </div>
        </div>

        <div className="bg-[#111C0F]/90 border border-[#84CC16]/30 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#84CC16] text-[#070B06] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
            2
          </div>
          <div>
            <div className="text-xs font-bold text-white">Select Soil Source</div>
            <p className="text-[11px] text-white/60 mt-0.5 leading-snug">
              Use regional averages, or scan your Soil Health Card to fill N-P-K automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="agri-glass-card p-6 sm:p-8 space-y-7">
        {/* --- FORM INPUTS --- */}
        <div className="space-y-6 no-print">
          {/* STEP 1: Microclimate Inputs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[#84CC16] uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#84CC16]/20 text-[#BEF264] flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Weather &amp; Rain (Auto-Detected)</span>
              </h3>
              <span className="text-[11px] text-[#8E9B85]">
                {savedLocation?.name || 'Maharashtra'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {weatherFields.map((f) => {
                const fieldError = getFieldError(f.name, form[f.name]);
                return (
                  <div
                    key={f.name}
                    className={`rounded-2xl p-4 border transition-all duration-200 ${
                      fieldError ? 'bg-red-950/40 border-red-500/50' : 'bg-[#0B1309]/80 border-white/10 hover:border-[#84CC16]/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mb-2.5 border border-white/10 text-[#F59E0B]">
                      <f.icon size={16} strokeWidth={2} />
                    </div>
                    <label className="text-[11px] font-semibold text-[#8E9B85] block leading-tight mb-1">{f.label}</label>
                    <div className="flex items-baseline gap-1.5">
                      <input
                        type="number"
                        step="any"
                        name={f.name}
                        value={form[f.name]}
                        onChange={handleChange}
                        className="w-full bg-transparent text-lg font-serif font-bold text-[#FDFAF2] focus:outline-none"
                      />
                      <span className="text-xs text-[#6B7C63] shrink-0 font-medium">{f.unit}</span>
                    </div>
                    {fieldError && <p className="text-[10px] text-red-400 mt-1">{fieldError}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-white/10" />

          {/* STEP 2: Soil Nutrients Mode */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div>
                <h3 className="text-xs font-bold text-[#84CC16] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#84CC16]/20 text-[#BEF264] flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Soil Nutrients (N, P, K &amp; pH)</span>
                </h3>
                <p className="text-xs text-[#8E9B85] mt-1">
                  Choose your soil data source below:
                </p>
              </div>

              {/* Clear Option Switcher */}
              <div className="flex items-center bg-[#070D06] border border-white/15 rounded-2xl p-1 shrink-0 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleResetToRegionalAverage()}
                  className={`text-xs px-4 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    soilMode === 'average'
                      ? 'bg-[#84CC16] text-[#070B06] shadow-[0_0_12px_rgba(132,204,22,0.35)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>Regional Average (No Card)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSoilMode('upload')}
                  className={`text-xs px-4 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    soilMode === 'upload'
                      ? 'bg-[#84CC16] text-[#070B06] shadow-[0_0_12px_rgba(132,204,22,0.35)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <ScanLine size={14} />
                  <span>I have Soil Health Card</span>
                </button>
              </div>
            </div>

            {/* In 'Upload Soil Card' Mode: Clear Photo Uploader */}
            {soilMode === 'upload' && (
              <div className="bg-[#0C150A] border border-[#84CC16]/40 rounded-2xl p-5 space-y-4 agri-animate-fade-in shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#BEF264] flex items-center gap-2">
                      <FileSearch size={16} className="text-[#84CC16]" />
                      <span>Take a photo or upload your Soil Health Card (SHC)</span>
                    </div>
                    <p className="text-[11px] text-white/60 mt-0.5">
                      Our system reads N, P, K and pH values directly from the paper report.
                    </p>
                  </div>
                  {ocrSuccess && (
                    <span className="text-[10px] font-bold bg-[#10B981]/20 text-[#86EFAC] border border-[#10B981]/40 px-3 py-1 rounded-full flex items-center gap-1">
                      <Check size={12} />
                      Values Loaded
                    </span>
                  )}
                </div>

                <div className="border-2 border-dashed border-[#84CC16]/40 hover:border-[#84CC16]/70 bg-[#070B06] rounded-2xl p-5 text-center transition cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleOcrFileChange}
                    disabled={ocrLoading}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                  />
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 flex items-center justify-center mx-auto shadow-xs">
                      <Upload size={18} />
                    </div>
                    <div className="text-xs font-semibold text-white">
                      {ocrFile ? ocrFile.name : 'Click to select or photograph Soil Card'}
                    </div>
                    <p className="text-[10px] text-[#8E9B85]">JPG, PNG, or mobile camera capture</p>
                  </div>
                </div>

                {/* Preview and OCR Trigger */}
                {ocrPreview && (
                  <div className="relative border border-white/10 rounded-2xl p-3 bg-[#0B1309] flex flex-col items-center">
                    <div className="relative max-h-56 w-full flex items-center justify-center rounded-xl overflow-hidden">
                      <img
                        src={ocrPreview}
                        alt="Soil Card Preview"
                        className="max-h-56 object-contain rounded-xl border border-white/10 shadow-md"
                      />
                      {ocrLoading && (
                        <LaserScannerOverlay
                          title="READING SOIL CARD"
                          subtitle="Extracting Nitrogen, Phosphorus, Potassium & pH..."
                          laserColor="lime"
                        />
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleScanSoilCard}
                  disabled={!ocrFile || ocrLoading}
                  className="w-full agri-btn-primary py-3 rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {ocrLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Reading Card via OCR...</span>
                    </>
                  ) : (
                    <>
                      <ScanLine size={15} />
                      <span>{ocrSuccess ? 'Re-scan Card' : 'Scan & Auto-Fill Values'}</span>
                    </>
                  )}
                </button>

                {ocrError && (
                  <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{ocrError}</span>
                  </div>
                )}
              </div>
            )}

            {/* In 'Regional Average' Mode: Informative Banner */}
            {soilMode === 'average' && (
              <div className="p-3.5 bg-[#142311]/70 border border-[#84CC16]/30 rounded-2xl flex items-center justify-between text-xs text-white/80">
                <span className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16] animate-pulse" />
                  <span>
                    Using government agro-climatic baseline averages for <strong>{savedLocation?.name || 'Maharashtra'}</strong>.
                  </span>
                </span>
                <span className="text-[10px] text-[#BEF264] font-bold bg-[#84CC16]/20 border border-[#84CC16]/40 px-2.5 py-1 rounded-full shrink-0">
                  Auto-Filled
                </span>
              </div>
            )}

            {/* 4 Soil Macronutrient Inputs (Always readable & editable) */}
            <div>
              <div className="text-[11px] text-white/50 mb-2 font-medium">
                Verify or edit your soil parameters before calculating:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {soilFields.map((f) => {
                  const fieldError = getFieldError(f.name, form[f.name]);
                  return (
                    <div
                      key={f.name}
                      className={`rounded-2xl p-4 border transition-all duration-200 ${
                        fieldError ? 'bg-red-950/40 border-red-500/50' : 'bg-[#0B1309]/80 border-white/10 hover:border-[#84CC16]/40'
                      }`}
                    >
                      <label className="text-xs font-bold text-[#FDFAF2] block mb-0.5">{f.label}</label>
                      <span className="text-[10px] text-[#8E9B85] block mb-2">{f.sub}</span>
                      <input
                        type="number"
                        step="any"
                        name={f.name}
                        value={form[f.name]}
                        onChange={handleChange}
                        placeholder={soilMode === 'upload' ? 'Scan to fill' : '0.0'}
                        className="w-full bg-[#10190D] border border-white/10 rounded-xl px-3 py-1.5 text-base font-serif font-bold text-[#FDFAF2] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                      />
                      {fieldError && <p className="text-[10px] text-red-400 mt-1">{fieldError}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!allFilled || loading || hasErrors}
            className="w-full agri-btn-primary active:scale-[0.99] text-white font-bold text-sm py-4 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer shadow-xl mt-4"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Finding Best Crops for Your Soil...</span>
              </>
            ) : (
              <>
                <Sprout size={18} />
                <span>Recommend Best Crops for My Land</span>
              </>
            )}
          </button>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        {/* --- RESULTS SECTION --- */}
        {result && (
          <div className="pt-4 space-y-6 border-t border-white/10 agri-animate-fade-in">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[#FDFAF2] uppercase tracking-wider">
                  Ranked Crop Recommendations
                </h3>
                <span className="text-xs text-[#BEF264] font-semibold">Trained on 2,200 multi-district samples</span>
              </div>

              <div className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <SpotlightCard
                    key={s.crop}
                    spotlightColor={i === 0 ? "rgba(132, 204, 22, 0.22)" : "rgba(132, 204, 22, 0.12)"}
                    borderColor={i === 0 ? "rgba(132, 204, 22, 0.5)" : "rgba(255, 255, 255, 0.15)"}
                    className={`rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                      i === 0
                        ? 'bg-gradient-to-r from-[#142311] to-[#1C3218] text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-[#84CC16]/40'
                        : 'bg-[#0B1309]/80 text-[#FDFAF2] border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          i === 0 ? 'bg-[#84CC16] text-[#070B06]' : 'bg-white/10 text-[#BEF264]'
                        }`}>
                          {rankLabels[i]}
                        </span>
                      </div>
                      <div className="text-xl font-serif font-bold capitalize mt-1.5 text-[#FDFAF2]">{s.crop}</div>
                      {(s.water_need || s.heat_limit) && (
                        <div className="text-xs mt-2 flex flex-wrap items-center gap-3 text-[#A3B39C]">
                          {s.water_need && (
                            <span className="flex items-center gap-1">
                              <Droplets size={13} className="text-[#38BDF8]" /> Water Demand: <strong className="capitalize text-[#FDFAF2]">{s.water_need}</strong>
                            </span>
                          )}
                          {s.heat_limit && (
                            <span className="flex items-center gap-1">
                              <Thermometer size={13} className="text-[#F59E0B]" /> Critical Heat Limit: <strong className="text-[#FDFAF2]">{s.heat_limit}°C</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right self-end sm:self-auto">
                      <div className={`text-3xl font-serif font-bold ${i === 0 ? 'text-[#84CC16]' : 'text-[#BEF264]'}`}>
                        <AnimatedCounter value={s.confidence} suffix="%" duration={1200} />
                      </div>
                      <div className="text-[10px] text-[#8E9B85] uppercase tracking-wider">Probability Index</div>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            </div>

            {/* Explainable AI Top Factors */}
            <div className="bg-[#0B1309]/80 p-4.5 rounded-2xl border border-white/10">
              <p className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider mb-2">
                Explainable AI: Key Driving Factors
              </p>
              <ul className="text-xs text-[#D1DAC9] space-y-1.5">
                {result.top_factors.map((r) => (
                  <li key={r} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#84CC16] shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <CropCalendar crop={result.suggestions[0].crop} />

            {/* Next Season Multi-Crop Rotation Planner */}
            {rotationData && rotationData.suggestions?.length > 0 && (
              <div className="bg-[#1C160B]/70 border border-[#F59E0B]/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Repeat size={16} className="text-[#F59E0B]" />
                  <span className="text-xs font-bold text-[#FDE68A] uppercase tracking-wider">
                    Next Season Agronomic Rotation
                  </span>
                </div>
                <p className="text-xs text-[#FCD34D] mb-3.5">
                  Following <strong className="capitalize text-white">{result.suggestions[0].crop}</strong> harvest, rotate with these crops to replenish nitrogen and break pest cycles:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rotationData.suggestions.map((item, idx) => (
                    <div key={idx} className="bg-[#0B1309]/90 rounded-xl p-3.5 border border-white/10 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#FDFAF2]">{item.next_crop}</span>
                        {item.season && (
                          <span className="text-[10px] bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 px-2 py-0.5 rounded-full font-semibold">
                            {item.season}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#A3B39C] mt-1.5 leading-relaxed">
                        {item.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2 no-print">
              <button
                type="button"
                onClick={() => {
                  if (isSpeakingResult && isSpeaking()) {
                    stopSpeech();
                    setIsSpeakingResult(false);
                    return;
                  }
                  const topCrop = result.suggestions[0];
                  let speech = `AgriSense AI recommends ${topCrop.crop} with ${topCrop.confidence} percent confidence. `;
                  if (rotationData?.suggestions?.length) {
                    speech += `For next season rotation, consider ${rotationData.suggestions[0].next_crop}. ${rotationData.suggestions[0].reason}`;
                  }
                  setIsSpeakingResult(true);
                  speakText(speech, () => setIsSpeakingResult(false));
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 transition text-xs font-semibold ${
                  isSpeakingResult
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 animate-pulse'
                    : 'bg-[#10190D] text-[#FDFAF2] border border-white/10 hover:border-white/30'
                }`}
              >
                {isSpeakingResult ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isSpeakingResult ? 'Stop Audio' : 'Audio Advisory (Suniye)'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 bg-white/10 text-white rounded-xl px-4 py-2.5 hover:bg-white/20 transition text-xs font-semibold border border-white/15 shadow-sm"
              >
                <Printer size={15} />
                <span>Print Diagnostic</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `AgriSense AI recommends ${result.suggestions[0].crop.charAt(0).toUpperCase() + result.suggestions[0].crop.slice(1)} (${result.suggestions[0].confidence}%) for my farm${savedLocation?.name ? ' in ' + savedLocation.name : ''}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white rounded-xl px-4 py-2.5 hover:bg-[#20bd5a] transition text-xs font-semibold shadow-sm"
              >
                <Share2 size={15} />
                <span>Share WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CropRecommendation;
