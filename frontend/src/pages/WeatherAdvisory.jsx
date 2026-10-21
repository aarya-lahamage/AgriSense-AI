import { useState, useEffect } from 'react';
import { MapPin, Navigation, Thermometer, Droplets, Wind, CloudRain, AlertTriangle, CheckCircle2, Info, Flame, SprayCan, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import CropCalendar from '../components/CropCalendar';
import { speakText, stopSpeech, isSpeaking } from '../utils/speech';

const API_BASE = 'http://127.0.0.1:8000';

const levelStyles = {
  ok: { bg: 'bg-[#E5EFD5]', icon: CheckCircle2, iconColor: 'text-[#5B7A3A]', label: 'text-[#5B7A3A]', chip: 'bg-[#5B7A3A]' },
  info: { bg: 'bg-[#E3EDF7]', icon: Info, iconColor: 'text-[#4A7BA7]', label: 'text-[#4A7BA7]', chip: 'bg-[#4A7BA7]' },
  warning: { bg: 'bg-[#FBF3E3]', icon: AlertTriangle, iconColor: 'text-[#C9A15A]', label: 'text-[#A8895A]', chip: 'bg-[#C9A15A]' },
  danger: { bg: 'bg-[#FBE9E7]', icon: Flame, iconColor: 'text-[#C75B44]', label: 'text-[#C75B44]', chip: 'bg-[#C75B44]' },
};

function WeatherAdvisory() {
  const [data, setData] = useState(null);
  const [coords, setCoords] = useState(null);
  const [crops, setCrops] = useState({});
  const [selectedCrop, setSelectedCrop] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/crops`)
      .then((r) => r.json())
      .then(setCrops)
      .catch(() => {});
  }, []);

  const loadWeather = async (lat, lon, cropKey = selectedCrop) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/weather-advisory?lat=${lat}&lon=${lon}&crop=${cropKey}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Could not fetch weather');
      }
      setData(await res.json());
      setCoords({ lat, lon });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Location is not supported by this browser.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
      () => {
        setLoading(false);
        setError('Location access denied. Please allow location access.');
      }
    );
  };

  const refresh = () => {
    if (coords) loadWeather(coords.lat, coords.lon);
    else requestLocation();
  };

  const changeCrop = (cropKey) => {
    setSelectedCrop(cropKey);
    if (coords) loadWeather(coords.lat, coords.lon, cropKey);
  };

  const stats = data
    ? [
        { label: 'Temperature', value: `${data.current.temperature}°C`, icon: Thermometer },
        { label: 'Humidity', value: `${data.current.humidity}%`, icon: Droplets },
        {
          label: 'Wind',
          value: `${Math.round(data.current.wind_speed)} km/h`,
          sub: data.current.wind_gusts ? `gusts ${Math.round(data.current.wind_gusts)}` : null,
          icon: Wind,
        },
        { label: 'Rain today', value: `${data.current.rainfall_today} mm`, icon: CloudRain },
      ]
    : [];

  const formatDay = (dateStr, i) =>
    i === 0 ? 'Today' : new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' });

  const scoreColor = (score) =>
    score >= 70 ? 'text-[#5B7A3A]' : score >= 40 ? 'text-[#C9A15A]' : 'text-[#C75B44]';
  const scoreBar = (score) =>
    score >= 70 ? 'bg-[#5B7A3A]' : score >= 40 ? 'bg-[#C9A15A]' : 'bg-[#C75B44]';

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
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="font-serif text-[26px] font-medium text-[#22301A] mb-1">
        Weather Advisory
      </h2>
      <p className="text-[#7A8A6A] text-sm mb-7">
        Live weather for your farm, with practical farming advice.
      </p>

      {!data && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)]">
          <div className="w-12 h-12 rounded-full bg-[#DCE8C8] flex items-center justify-center mx-auto mb-3">
            <MapPin size={22} strokeWidth={1.8} className="text-[#5B7A3A]" />
          </div>
          <p className="text-[#22301A] font-medium mb-1">Check your farm's weather</p>
          <p className="text-xs text-[#7A8A6A] mb-5">
            We'll use your location to fetch live conditions
          </p>
          <button
            onClick={requestLocation}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-[#5B7A3A] text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-[#4C6B4C] transition disabled:opacity-50 shadow-[0_4px_12px_rgba(91,122,58,0.25)]"
          >
            <Navigation size={15} strokeWidth={2} />
            {loading ? 'Fetching...' : 'Use My Location'}
          </button>
          {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
        </div>
      )}

      {data && (
        <div className="space-y-5">
          {/* Crop selector */}
          <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)]">
            <label className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide block mb-2.5">
              Your Crop
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => changeCrop(e.target.value)}
              className="w-full bg-[#F6F4EC] border border-transparent rounded-xl px-4 py-3 text-sm text-[#22301A] focus:outline-none focus:border-[#5B7A3A] focus:bg-white transition"
            >
              {Object.entries(crops).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <p className="text-[11px] text-[#A8A391] mt-2">
              Advice below is tailored to this crop's heat and humidity tolerance.
            </p>
            <CropCalendar crop={selectedCrop === 'general' ? null : selectedCrop} />
          </div>

          {/* Current conditions */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide">
                Current Conditions
              </h3>
              <button
                onClick={refresh}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-[#5B7A3A] hover:text-[#4C6B4C] disabled:opacity-50 transition"
              >
                <RefreshCw size={13} strokeWidth={2} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Updating...' : 'Refresh'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="bg-[#F6F4EC] rounded-xl p-3.5">
                  <s.icon size={16} strokeWidth={1.8} className="text-[#8A8A6A] mb-2" />
                  <div className="text-[10px] text-[#8A8A6A]">{s.label}</div>
                  <div className="text-[17px] font-medium text-[#22301A]">{s.value}</div>
                  {s.sub && <div className="text-[10px] text-[#A8A391] mt-0.5">{s.sub}</div>}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#B0AA98] mt-3">
              Wind measured at 10m height. Other apps may show gusts instead, which read higher.
            </p>
          </div>

          {/* Best spraying window */}
          {data.best_spray_day && (
            <div className="bg-[#22301A] rounded-2xl p-5 text-white shadow-[0_4px_16px_rgba(34,48,26,0.18)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#334423] flex items-center justify-center shrink-0">
                  <SprayCan size={17} strokeWidth={1.8} className="text-[#B8D08A]" />
                </div>
                <div>
                  <div className="text-[11px] text-[#B8D08A] uppercase tracking-wide">
                    Best spraying window
                  </div>
                  <div className="text-[15px] font-medium mt-0.5">
                    {new Date(data.best_spray_day).toLocaleDateString('en-IN', {
                      weekday: 'long', day: 'numeric', month: 'short',
                    })}
                    <span className="text-[#B8D08A] text-xs ml-2">
                      {data.best_spray_score}/100 suitability
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advisories */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide">
                What To Do — {data.crop}
              </h3>
              <button
                type="button"
                onClick={handleSpeakAdvisories}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition ${
                  speaking
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    : 'bg-[#F6F4EC] text-[#5B7A3A] hover:bg-[#DCE8C8]'
                }`}
                title="Audio: Advisory Suniye"
              >
                {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                <span>{speaking ? 'Rukiye' : 'Advisory Suniye 🔊'}</span>
              </button>
            </div>
            <div className="space-y-3">
              {data.advisories.map((a, i) => {
                const style = levelStyles[a.level];
                const Icon = style.icon;
                return (
                  <div key={i} className={`${style.bg} rounded-xl p-4`}>
                    <div className="flex gap-3">
                      <Icon size={18} strokeWidth={1.8} className={`${style.iconColor} shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className={`text-sm font-medium ${style.label}`}>{a.title}</div>
                          {a.action && (
                            <span className={`${style.chip} text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0`}>
                              {a.action}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#5A5A4E] mt-1 leading-relaxed">{a.message}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

                  {/* Forecast with spray score */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)]">
            <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-1">
              4-Day Outlook
            </h3>
            <p className="text-[11px] text-[#A8A391] mb-1">
              Spray score (0-100) is based on rain, wind and heat — it's the
              same for every crop, since these risks apply to any spray
              operation.
            </p>
            <div className="flex items-center gap-3 text-[10px] text-[#A8A391] mb-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#5B7A3A]"></span>Good (70+)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#C9A15A]"></span>Caution (40-69)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#C75B44]"></span>Avoid (&lt;40)
              </span>
            </div>

            {/* Disease Risk 4-Day Trend Indicator */}
            <div className="bg-[#FBF3E3] rounded-xl p-3.5 mb-4 border border-[#EFE7D8]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-[#A8895A]" />
                  <span className="text-[11px] font-semibold text-[#22301A] uppercase tracking-wide">
                    4-Day Disease Risk Trend ({data.crop})
                  </span>
                </div>
                <span className="text-[11px] text-[#7A6A3A] font-medium">
                  {(() => {
                    const risks = data.forecast.map((d) => d.disease_risk);
                    if (risks[3] === 'high' && risks[0] !== 'high') return '⚠️ Risk rising over 4 days';
                    if (risks.includes('high')) return '⚠️ High disease pressure forecast';
                    if (risks.includes('moderate')) return 'Elevated moisture — monitor crops';
                    return 'Favorable weather — low disease risk';
                  })()}
                </span>
              </div>

              {/* 4-bar / 4-dot indicator */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {data.forecast.map((d, i) => {
                  const risk = d.disease_risk || 'low';
                  const barColor =
                    risk === 'high' ? 'bg-[#C75B44]' : risk === 'moderate' ? 'bg-[#C9A15A]' : 'bg-[#5B7A3A]';
                  const textColor =
                    risk === 'high' ? 'text-[#C75B44]' : risk === 'moderate' ? 'text-[#C9A15A]' : 'text-[#5B7A3A]';
                  return (
                    <div key={d.date} className="bg-white/80 rounded-lg p-2 border border-[#EEEBDD]">
                      <div className="text-[10px] text-[#8A8A6A] font-medium">{formatDay(d.date, i)}</div>
                      <div className="w-full bg-[#E5E0D0] h-1.5 rounded-full overflow-hidden my-1.5">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{
                            width: risk === 'high' ? '100%' : risk === 'moderate' ? '60%' : '30%',
                          }}
                        />
                      </div>
                      <div className={`text-[10px] font-semibold capitalize ${textColor}`}>
                        {risk} Risk
                      </div>
                      <div className="text-[9px] text-[#A8A391]">
                        {d.humidity ? `${Math.round(d.humidity)}% RH` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {data.forecast.map((d, i) => {
                const isRainy = d.rainfall >= 2;
                return (
                  <div
                    key={d.date}
                    className={`rounded-xl p-3 text-center ${isRainy ? 'bg-[#E3EDF7]' : 'bg-[#F6F4EC]'}`}
                  >
                    <div className="text-[10px] text-[#8A8A6A] mb-1.5">{formatDay(d.date, i)}</div>
                    <div className="text-[15px] font-medium text-[#22301A]">{Math.round(d.max_temp)}°</div>
                    <div className="text-[11px] text-[#A8A391]">{Math.round(d.min_temp)}°</div>
                    <div className={`text-[10px] mt-1.5 ${isRainy ? 'text-[#4A7BA7] font-medium' : 'text-[#B0AA98]'}`}>
                      {d.rainfall}mm · {Math.round(d.max_wind)}km/h
                    </div>
                    <div className="mt-2 pt-2 border-t border-black/5">
                      <div className={`text-[13px] font-semibold ${scoreColor(d.spray_score)}`}>
                        {d.spray_score}
                        <span className="text-[9px] font-normal text-[#A8A391]">/100</span>
                      </div>
                      <div className="text-[9px] text-[#A8A391] leading-tight">spray score</div>
                      <div className="h-1 bg-[#E5E0D0] rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-1 rounded-full ${scoreBar(d.spray_score)}`}
                          style={{ width: `${d.spray_score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
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