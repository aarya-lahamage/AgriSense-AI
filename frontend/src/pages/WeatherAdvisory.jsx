import { useState, useEffect } from 'react';
import { Thermometer, Droplets, Wind, CloudRain, CloudSun, AlertTriangle, CheckCircle2, Info, Flame, RefreshCw, Volume2, VolumeX, Compass } from 'lucide-react';
import RadarWidget from '../components/RadarWidget';
import SpotlightCard from '../components/SpotlightCard';
import { speakText, stopSpeech, isSpeaking } from '../utils/speech';
import { useFarmLocation } from '../context/LocationContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const levelStyles = {
  ok: { bg: 'bg-[#0F2414]/70', icon: CheckCircle2, iconColor: 'text-[#4ADE80]', label: 'text-[#86EFAC]', border: 'border-[#22C55E]/40' },
  info: { bg: 'bg-[#0C1E2E]/70', icon: Info, iconColor: 'text-[#38BDF8]', label: 'text-[#7DD3FC]', border: 'border-[#38BDF8]/40' },
  warning: { bg: 'bg-[#291B08]/70', icon: AlertTriangle, iconColor: 'text-[#F59E0B]', label: 'text-[#FDE68A]', border: 'border-[#F59E0B]/40' },
  danger: { bg: 'bg-[#2A0F0D]/70', icon: Flame, iconColor: 'text-[#EF4444]', label: 'text-[#FCA5A5]', border: 'border-[#EF4444]/40' },
};

function WeatherAdvisory() {
  const { savedLocation, locationVersion } = useFarmLocation();
  const [data, setData] = useState(null);
  const [crops, setCrops] = useState({});
  const [selectedCrop, setSelectedCrop] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/crops`)
      .then((r) => (r.ok ? r.json() : {}))
      .then(setCrops)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const lat = Number(savedLocation?.lat);
    const lon = Number(savedLocation?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return;
    }

    const controller = new AbortController();
    fetch(`${API_BASE}/weather-advisory?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&crop=${encodeURIComponent(selectedCrop)}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.detail || 'Could not fetch weather');
        return body;
      })
      .then((weather) => {
        setData(weather);
        setError('');
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message || 'Could not fetch weather');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [savedLocation?.lat, savedLocation?.lon, selectedCrop, refreshKey, locationVersion]);

  const refresh = () => {
    setLoading(true);
    setRefreshKey((value) => value + 1);
  };
  const changeCrop = (cropKey) => {
    setLoading(true);
    setSelectedCrop(cropKey);
  };

  const stats = data
    ? [
        { label: 'Ambient Temperature', value: `${data.current.temperature}°C`, icon: Thermometer, color: 'text-[#D4A359]' },
        { label: 'Relative Humidity', value: `${data.current.humidity}%`, icon: Droplets, color: 'text-[#38BDF8]' },
        {
          label: 'Wind Speed',
          value: `${Math.round(data.current.wind_speed)} km/h`,
          sub: data.current.wind_gusts ? `Gusts ${Math.round(data.current.wind_gusts)} km/h` : null,
          icon: Wind,
          color: 'text-[#84CC16]',
        },
        { label: 'Rainfall Today', value: `${data.current.rainfall_today} mm`, icon: CloudRain, color: 'text-[#2B698C]' },
      ]
    : [];

  const formatDay = (dateStr, i) =>
    i === 0 ? 'Today' : new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' });

  const scoreColor = (score) =>
    score >= 70 ? 'text-[#3F7535]' : score >= 40 ? 'text-[#9E6B18]' : 'text-[#B43826]';
  const scoreBar = (score) =>
    score >= 70 ? 'bg-[#3F7535]' : score >= 40 ? 'bg-[#9E6B18]' : 'bg-[#B43826]';

  const handleSpeakAdvisories = () => {
    if (speaking && isSpeaking()) {
      stopSpeech();
      setSpeaking(false);
      return;
    }
    if (!data?.advisories?.length) return;
    const topThree = data.advisories
      .slice(0, 3)
      .map((a) => `${a.title}. ${a.message}`)
      .join(' ');
    setSpeaking(true);
    speakText(`Weather advisory for ${data.crop}. ${topThree}`, () => setSpeaking(false));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 agri-animate-fade-in">
      {/* Cinematic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C150A] via-[#142311] to-[#1E3319] text-white p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#38BDF8]/20 text-[#7DD3FC] border border-[#38BDF8]/30 mb-2">
              <Compass size={13} />
              <span>Microclimate Telemetry &amp; Spray Radar</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FDFAF2]">
              Weather &amp; Operational Advisories
            </h2>
            <p className="text-xs sm:text-sm text-[#A3B39C] mt-1">
              Hourly rain forecast, wind drift modeling, crop heat threshold alerts, and disease vulnerability indices.
            </p>
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-xs text-white font-semibold px-4 py-2.5 rounded-xl border border-white/20 transition shadow-sm cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Radar</span>
          </button>
        </div>
      </div>

      {/* Crop Selector Tabs */}
      <div className="agri-glass-card p-5 space-y-2.5">
        <div className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider">
          Select Crop for Tailored Pathogen &amp; Irrigation Rules
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(crops).map(([key, label]) => {
            const isSelected = selectedCrop === key;
            return (
              <button
                key={key}
                onClick={() => changeCrop(key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#84CC16] text-[#070B06] font-bold shadow-[0_0_15px_rgba(132,204,22,0.4)]'
                    : 'bg-[#10190D]/80 text-[#A8B5A0] hover:text-white border border-white/10 hover:border-white/25'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="agri-glass-card p-10 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#84CC16]/20 border-t-[#84CC16] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#A8B5A0]">Connecting to Open-Meteo microclimate sensors...</p>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="agri-glass-card p-8 text-center space-y-3">
          <CloudSun className="w-10 h-10 text-[#84CC16] mx-auto opacity-80" />
          <h3 className="text-base font-serif font-semibold text-[#FDFAF2]">Location Required for Microclimate</h3>
          <p className="text-xs text-[#8E9B85] max-w-md mx-auto">
            Please set your farm location using the top location bar to fetch hyper-local Open-Meteo forecasts, spray windows, and crop disease risks.
          </p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {/* Microclimate Sensors & Atmospheric Radar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            <div className="md:col-span-2 grid grid-cols-2 gap-3.5">
              {stats.map((s) => (
                <div key={s.label} className="bg-[#0B1309]/80 p-4.5 rounded-2xl border border-white/10 shadow-xs hover:border-[#84CC16]/30 transition flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[#8E9B85] uppercase tracking-wider">{s.label}</span>
                    <s.icon size={16} className={s.color} />
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#FDFAF2]">{s.value}</div>
                  {s.sub && <div className="text-[10px] text-[#A3B39C] mt-0.5">{s.sub}</div>}
                </div>
              ))}
            </div>
            <div className="md:col-span-1">
              <RadarWidget
                title="Doppler Scan"
                subtitle="Live Microclimate"
                compact={true}
                className="h-full justify-between"
              />
            </div>
          </div>

          {/* Actionable Advisories List */}
          <div className="agri-glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-[#FDFAF2] uppercase tracking-wider">
                  Operational Farming Advisories ({data.crop})
                </h3>
                <p className="text-xs text-[#A3B39C]">Real-time recommendations for spraying, watering, and pathogen risks</p>
              </div>

              <button
                onClick={handleSpeakAdvisories}
                className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-xl border transition cursor-pointer ${
                  speaking
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 animate-pulse'
                    : 'bg-[#10190D] text-[#FDFAF2] border-white/15 hover:border-white/30'
                }`}
              >
                {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span>{speaking ? 'Stop' : 'Audio Brief'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {data.advisories.map((a, i) => {
                const style = levelStyles[a.level] || levelStyles.info;
                const IconComponent = style.icon;
                return (
                  <div
                    key={i}
                    className={`rounded-2xl p-4.5 border ${style.border} ${style.bg} transition-all`}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent size={18} className={`${style.iconColor} shrink-0 mt-0.5`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-[#FDFAF2]">{a.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/40 border border-white/10 ${style.label}`}>
                            {a.action}
                          </span>
                        </div>
                        <p className="text-xs text-[#D1DAC9] mt-1.5 leading-relaxed">{a.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4-Day Spray & Disease Radar */}
          <div className="agri-glass-card p-6 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-[#FDFAF2] uppercase tracking-wider">
                4-Day Spray Suitability &amp; Disease Pressure Radar
              </h3>
              <p className="text-xs text-[#A3B39C]">Calculates droplet drift, rain wash-off risk, and fungal pathogen thresholds</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {data.forecast.map((d, i) => {
                const isRainy = d.rainfall >= 2;
                return (
                  <SpotlightCard
                    key={d.date}
                    spotlightColor={isRainy ? 'rgba(56, 189, 248, 0.18)' : 'rgba(132, 204, 22, 0.15)'}
                    borderColor={isRainy ? 'rgba(56, 189, 248, 0.4)' : 'rgba(132, 204, 22, 0.35)'}
                    className={`rounded-2xl p-4 border text-center transition-all ${
                      isRainy ? 'bg-[#0A1A26]/80 border-[#38BDF8]/30' : 'bg-[#0B1309]/80 border-white/10'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-[#8E9B85] mb-1">{formatDay(d.date, i)}</div>
                    <div className="text-xl font-serif font-bold text-[#FDFAF2]">{Math.round(d.max_temp)}°</div>
                    <div className="text-[11px] text-[#A3B39C]">{Math.round(d.min_temp)}° min</div>

                    <div className={`text-[10px] font-semibold mt-2 ${isRainy ? 'text-[#7DD3FC]' : 'text-[#8E9B85]'}`}>
                      {d.rainfall} mm rain • {Math.round(d.max_wind)} km/h
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/10">
                      <div className={`text-base font-serif font-bold ${scoreColor(d.spray_score)}`}>
                        {d.spray_score}
                        <span className="text-[10px] font-sans font-normal text-[#8E9B85]">/100</span>
                      </div>
                      <div className="text-[10px] text-[#8E9B85] uppercase tracking-wider">Spray Score</div>
                      <div className="h-1.5 bg-black/40 rounded-full mt-1.5 overflow-hidden border border-white/10">
                        <div
                          className={`h-full rounded-full ${scoreBar(d.spray_score)}`}
                          style={{ width: `${d.spray_score}%` }}
                        />
                      </div>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeatherAdvisory;
