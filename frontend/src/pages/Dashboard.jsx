import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  CloudSun,
  Sprout,
  ScanLine,
  FlaskConical,
  TrendingUp,
  IndianRupee,
  FileSearch,
  Calculator,
  Store,
  ClipboardList,
  Landmark,
  MessageCircle,
  ArrowRight,
  MapPin,
  Droplets,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFarmLocation } from '../context/LocationContext';

const API_BASE = 'http://127.0.0.1:8000';

export default function Dashboard() {
  const { user, token } = useAuth();
  const { savedLocation, openLocationModal } = useFarmLocation();

  const [weatherData, setWeatherData] = useState(null);
  const [mandiHighlights, setMandiHighlights] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Determine current agro-season in Maharashtra
  const getSeasonInfo = () => {
    const month = new Date().getMonth(); // 0-indexed
    if (month >= 5 && month <= 9) {
      return { name: 'Kharif Season', sub: 'Monsoon Sowings & Crop Protection' };
    } else if (month >= 10 || month <= 2) {
      return { name: 'Rabi Season', sub: 'Post-Monsoon & Winter Harvests' };
    } else {
      return { name: 'Zaid / Summer Season', sub: 'Irrigated Cash Crops & Pulses' };
    }
  };

  useEffect(() => {
    // 1. Fetch Weather (use saved farm location, or fallback to Pune / Central MH coords)
    const lat = savedLocation?.lat || 18.5204;
    const lon = savedLocation?.lon || 73.8567;

    fetch(`${API_BASE}/weather-advisory?lat=${lat}&lon=${lon}&crop=general`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWeatherData(data))
      .catch(() => {})
      .finally(() => setLoadingWeather(false));

    // 2. Fetch Top Mandi Highlights
    fetch(`${API_BASE}/mandi-prices`)
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res?.data) {
          // pick 3 popular crops: soybean, cotton, onion
          const picks = res.data.slice(0, 3);
          setMandiHighlights(picks);
        }
      })
      .catch(() => {});

    // 3. Fetch User's Total Expenses if logged in
    if (token) {
      fetch(`${API_BASE}/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.total !== undefined) {
            setTotalExpenses(data.total);
          }
        })
        .catch(() => {});
    }
  }, [savedLocation, token]);

  const season = getSeasonInfo();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* ── 1. GREETING & LOCATION HEADER ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] border border-[#F0EEE4]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DCE8C8] flex items-center justify-center shrink-0">
            <Sun size={24} strokeWidth={2} className="text-[#5B7A3A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-[26px] font-semibold text-[#22301A]">
                {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Farmer'}
              </h1>
              <span className="text-xl">🌾</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#7A8A6A] mt-1">
              <span className="font-medium text-[#5B7A3A] bg-[#EAF1DC] px-2 py-0.5 rounded-md">
                {season.name}
              </span>
              <span>•</span>
              <span>{season.sub}</span>
            </div>
          </div>
        </div>

        {/* Location badge & change button */}
        <button
          onClick={openLocationModal}
          className="flex items-center gap-2 self-start sm:self-center text-xs font-medium text-[#22301A] bg-[#F6F4EC] hover:bg-[#EFE7D8] px-3.5 py-2 rounded-xl transition border border-[#E5E0D0]"
        >
          <MapPin size={14} className="text-[#5B7A3A] shrink-0" />
          <span className="truncate max-w-[150px]">
            {savedLocation?.name || user?.region || 'Maharashtra'}
          </span>
          <span className="text-[10px] text-[#A8A391] uppercase tracking-wider ml-1">Change</span>
        </button>
      </div>

      {/* ── 2. HERO CALLOUT: PLAN NEXT CROP ───────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#22301A] to-[#3A4E2B] rounded-3xl p-6 sm:p-8 text-white shadow-[0_8px_30px_rgba(34,48,26,0.2)]">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-[#DCE8C8] mb-3">
            <Sparkles size={13} />
            <span>AI Agricultural Decision Engine</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium leading-tight mb-2">
            Ready to plan your next crop yield &amp; soil health?
          </h2>
          <p className="text-xs sm:text-sm text-[#DCE8C8]/80 mb-6 leading-relaxed">
            Get personalized crop recommendations with 92% ML accuracy, soil replenishment suggestions, and optimal seasonal sowing dates.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/crop-recommendation"
              className="inline-flex items-center gap-2 bg-[#DCE8C8] text-[#22301A] text-sm font-semibold px-6 py-3 rounded-full hover:bg-white transition shadow-sm"
            >
              <span>Start Crop Advisor</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/soil-card-ocr"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-5 py-3 rounded-full transition backdrop-blur-sm border border-white/20"
            >
              <FileSearch size={15} />
              <span>Scan Soil Health Card</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. LIVE RADAR: WEATHER & MANDI SNAPSHOTS ──────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Weather Radar Card */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] border border-[#F0EEE4] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CloudSun size={18} className="text-[#5B7A3A]" />
                <h3 className="text-xs font-semibold text-[#22301A] uppercase tracking-wider">
                  Live Farm Conditions
                </h3>
              </div>
              <Link
                to="/weather-advisory"
                className="text-xs text-[#5B7A3A] font-semibold hover:underline flex items-center gap-1"
              >
                <span>Full Outlook</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {loadingWeather ? (
              <p className="text-xs text-[#A8A391] py-4">Checking live conditions...</p>
            ) : weatherData ? (
              <div>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-serif font-bold text-[#22301A]">
                    {weatherData.current.temperature}°C
                  </span>
                  <span className="text-xs text-[#7A8A6A]">
                    Humidity: {weatherData.current.humidity}% • Rain today: {weatherData.current.rainfall_today}mm
                  </span>
                </div>

                {/* Spray condition pill */}
                <div className="bg-[#F6F4EC] rounded-2xl p-3.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#22301A]">Spraying Window</span>
                    {weatherData.best_spray_score >= 50 ? (
                      <span className="text-[10px] bg-[#EAF1DC] text-[#4A6830] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Suitable Today
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Delay Spraying
                      </span>
                    )}
                  </div>
                  {weatherData.advisories?.[0] && (
                    <p className="text-[11px] text-[#7A8A6A] mt-1.5 leading-snug">
                      {weatherData.advisories[0].title}: {weatherData.advisories[0].action}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#A8A391]">Select location to load weather</p>
            )}
          </div>

          <div className="text-[11px] text-[#A8A391] pt-2 border-t border-[#F0EEE4]">
            Data powered by Open-Meteo &amp; Agronomic Risk Models
          </div>
        </div>

        {/* Mandi Rates Snapshot Card */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] border border-[#F0EEE4] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-[#5B7A3A]" />
                <h3 className="text-xs font-semibold text-[#22301A] uppercase tracking-wider">
                  APMC Mandi Ticker
                </h3>
              </div>
              <Link
                to="/mandi-rates"
                className="text-xs text-[#5B7A3A] font-semibold hover:underline flex items-center gap-1"
              >
                <span>All Mandis</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {mandiHighlights.length > 0 ? (
              <div className="space-y-2.5 mb-3">
                {mandiHighlights.map((m) => (
                  <div
                    key={m.crop}
                    className="flex items-center justify-between bg-[#F6F4EC] rounded-xl px-3.5 py-2.5"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#22301A] capitalize">{m.crop}</div>
                      <div className="text-[10px] text-[#7A8A6A]">
                        Top: {m.top_mandis?.[0]?.market || 'Maharashtra'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-serif font-bold text-[#22301A]">
                        ₹{m.modal_price}
                      </div>
                      <div className="text-[10px] text-[#5B7A3A] font-medium">
                        {m.change_7d > 0 ? `+${m.change_7d}% weekly` : `${m.change_7d}%`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#A8A391] py-4">Loading APMC rates...</p>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#A8A391] pt-2 border-t border-[#F0EEE4]">
            <span>Govt. MSP &amp; Local Auction Benchmark</span>
            <Link to="/mandi-rates" className="text-[#5B7A3A] font-semibold hover:underline">
              Check Prices →
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4. FINANCIAL SNAPSHOT BANNER ──────────────────────── */}
      {totalExpenses !== null && (
        <div className="bg-[#FBF3E3] border border-[#EFE7D8] rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#B08F52] shadow-sm">
              <IndianRupee size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#7A6A3A] uppercase tracking-wide">
                Tracked Farm Expenses
              </div>
              <div className="text-xl font-serif font-bold text-[#22301A]">
                ₹{totalExpenses.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link
              to="/expenses"
              className="text-xs bg-white text-[#22301A] font-medium px-4 py-2 rounded-xl border border-[#E5E0D0] hover:bg-[#F0EEE4] transition"
            >
              Add Expense
            </Link>
            <Link
              to="/farm-budget"
              className="text-xs bg-[#5B7A3A] text-white font-medium px-4 py-2 rounded-xl hover:bg-[#4A6830] transition"
            >
              Budget Planner
            </Link>
          </div>
        </div>
      )}

      {/* ── 5. ALL EXPLORE MODULES GRID ───────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-[#7A8A6A] uppercase tracking-wider">
            All Farm Modules &amp; Tools
          </h3>
          <span className="text-xs text-[#A8A391]">11 Tools Ready</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {[
            {
              icon: Sprout,
              title: 'Crop Advisor',
              desc: 'ML crop recommendation',
              path: '/crop-recommendation',
              color: 'text-[#5B7A3A]',
              bg: 'bg-[#DCE8C8]',
            },
            {
              icon: ScanLine,
              title: 'Disease Scan',
              desc: 'Leaf pathology detection',
              path: '/disease-detection',
              color: 'text-[#4A7BA7]',
              bg: 'bg-[#E3EDF7]',
            },
            {
              icon: CloudSun,
              title: 'Weather & Spray',
              desc: 'Live 4-day spray radar',
              path: '/weather-advisory',
              color: 'text-[#C9A15A]',
              bg: 'bg-[#FBF3E3]',
            },
            {
              icon: Store,
              title: 'Mandi Rates',
              desc: 'APMC prices & top hubs',
              path: '/mandi-rates',
              color: 'text-[#5B7A3A]',
              bg: 'bg-[#E5EFD5]',
            },
            {
              icon: FlaskConical,
              title: 'Fertilizer Rx',
              desc: 'Targeted NPK dosage',
              path: '/fertilizer-treatment',
              color: 'text-[#8A5A3A]',
              bg: 'bg-[#F5E8DC]',
            },
            {
              icon: TrendingUp,
              title: 'Yield & Profit',
              desc: 'Harvest & margin estimate',
              path: '/yield-profit',
              color: 'text-[#5B7A3A]',
              bg: 'bg-[#DCE8C8]',
            },
            {
              icon: FileSearch,
              title: 'Soil Card OCR',
              desc: 'Auto-scan NPK values',
              path: '/soil-card-ocr',
              color: 'text-[#4A7BA7]',
              bg: 'bg-[#E3EDF7]',
            },
            {
              icon: IndianRupee,
              title: 'Farm Expenses',
              desc: 'Track farm input costs',
              path: '/expenses',
              color: 'text-[#8A6A2A]',
              bg: 'bg-[#FBF3E3]',
            },
            {
              icon: Calculator,
              title: 'Farm Budget',
              desc: 'Cost & cashflow planner',
              path: '/farm-budget',
              color: 'text-[#22301A]',
              bg: 'bg-[#EAF1DC]',
            },
            {
              icon: ClipboardList,
              title: 'Farm Report',
              desc: 'Latest predictions summary',
              path: '/farm-report',
              color: 'text-[#5B7A3A]',
              bg: 'bg-[#DCE8C8]',
            },
            {
              icon: Landmark,
              title: 'Gov. Schemes',
              desc: 'Subsidies & PM-Kisan',
              path: '/government-schemes',
              color: 'text-[#4A7BA7]',
              bg: 'bg-[#E3EDF7]',
            },
            {
              icon: MessageCircle,
              title: 'AI Assistant',
              desc: 'Agri Q&A with voice speak',
              path: '/ai-assistant',
              color: 'text-[#5B7A3A]',
              bg: 'bg-[#E5EFD5]',
            },
          ].map((item) => (
            <Link
              key={item.title}
              to={item.path}
              className="group bg-white rounded-2xl p-4 border border-[#F0EEE4] hover:border-[#DCE8C8] hover:shadow-[0_4px_16px_rgba(34,48,26,0.06)] transition flex flex-col justify-between"
            >
              <div>
                <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                  <item.icon size={18} className={item.color} />
                </div>
                <div className="text-sm font-semibold text-[#22301A] group-hover:text-[#5B7A3A] transition">
                  {item.title}
                </div>
                <div className="text-[11px] text-[#7A8A6A] mt-0.5 line-clamp-1">
                  {item.desc}
                </div>
              </div>
              <div className="text-[10px] text-[#A8A391] font-semibold uppercase tracking-wider mt-3 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Open</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}