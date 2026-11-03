import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
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
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFarmLocation } from '../context/LocationContext';
import SpotlightCard from '../components/SpotlightCard';
import AnimatedCounter from '../components/AnimatedCounter';
import ShinyText from '../components/ShinyText';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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

  // Maharashtra Agro-Climatic Season Info
  const getSeasonInfo = () => {
    const month = new Date().getMonth(); // 0-indexed
    if (month >= 5 && month <= 9) {
      return { name: 'Kharif Season', sub: 'Monsoon Sowings & Active Crop Protection' };
    } else if (month >= 10 || month <= 2) {
      return { name: 'Rabi Season', sub: 'Post-Monsoon Irrigation & Harvest Prep' };
    } else {
      return { name: 'Zaid / Summer Season', sub: 'Irrigated Cash Crops & Soil Nourishment' };
    }
  };

  useEffect(() => {
    const lat = Number(savedLocation?.lat || 18.5204);
    const lon = Number(savedLocation?.lon || 73.8567);

    // 1. Fetch live weather & agro advisories
    fetch(`${API_BASE}/weather-advisory?lat=${lat}&lon=${lon}&crop=general`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWeatherData(data))
      .catch(() => setWeatherData(null))
      .finally(() => setLoadingWeather(false));

    // 2. Fetch real APMC mandi ticker rates
    fetch(`${API_BASE}/mandi-prices`)
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setMandiHighlights(res.data.slice(0, 3));
        }
      })
      .catch(() => {});

    // 3. Fetch user's recorded expenses if logged in
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
    <div className="w-full max-w-[1400px] mx-auto space-y-6 pb-16 agri-animate-fade-in font-sans">
      {/* ── 1. GREETING, REAL-TIME STATUS & FARM LOCATION ──────────────────── */}
      <div className="agri-glass-card p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-[#84CC16]/20 border border-[#84CC16]/40 flex items-center justify-center text-[#BEF264] shrink-0 shadow-[0_0_20px_rgba(132,204,22,0.25)]">
            <Sprout size={28} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Farmer'}
              </h1>
              <span className="text-xl">🌱</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60 mt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#84CC16]/20 text-[#BEF264] font-semibold border border-[#84CC16]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16] animate-pulse" />
                {season.name}
              </span>
              <span>•</span>
              <span className="text-white/70">{season.sub}</span>
            </div>
          </div>
        </div>

        {/* Location Selector */}
        <button
          onClick={openLocationModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#84CC16]/40 text-xs text-white/90 font-medium transition cursor-pointer self-start md:self-auto"
        >
          <MapPin size={15} className="text-[#84CC16] shrink-0" />
          <span className="truncate max-w-[200px]">
            {savedLocation?.name ? `${savedLocation.name}${savedLocation.district ? ` (${savedLocation.district})` : ''}` : 'Pune, Maharashtra'}
          </span>
          <span className="text-[10px] text-[#BEF264] uppercase font-bold tracking-wider ml-1">Change</span>
        </button>
      </div>

      {/* ── 2. DECISION HERO BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#11200E] via-[#162A13] to-[#1E3A1A] p-7 sm:p-9 text-white border border-[#84CC16]/30 shadow-[0_16px_50px_rgba(0,0,0,0.6)]">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-[#84CC16]/40 text-[#BEF264] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles size={13} className="text-[#84CC16]" />
            <ShinyText text="AGRISENSE DECISION INTELLIGENCE" speed={3.5} className="text-[11px] font-bold tracking-wider" />
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-tight">
            Plan your next season with data-backed accuracy.
          </h2>

          <p className="text-sm text-white/75 leading-relaxed font-normal">
            Evaluate soil nutrients (N, P, K, pH), microclimate risks, APMC price benchmarks, and leaf diagnostics to optimize yield and minimize chemical input costs.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              to="/crop-recommendation"
              className="agri-btn-primary px-6 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-lg"
            >
              <span>Start Crop Advisor</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/soil-card-ocr"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold transition border border-white/20 backdrop-blur-sm"
            >
              <FileSearch size={16} className="text-[#38BDF8]" />
              <span>Scan Soil Health Card</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. LIVE FARM RADAR: WEATHER & APMC MARKET RATES ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Live Weather & Spray Conditions */}
        <SpotlightCard
          spotlightColor="rgba(132, 204, 22, 0.15)"
          borderColor="rgba(132, 204, 22, 0.35)"
          className="p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <CloudSun size={18} className="text-[#F59E0B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Live Farm Conditions
                </h3>
              </div>
              <Link
                to="/weather-advisory"
                className="text-xs text-[#BEF264] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Full Advisory</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {loadingWeather ? (
              <div className="py-8 text-center text-xs text-white/40">
                <span className="w-5 h-5 border-2 border-[#84CC16]/30 border-t-[#84CC16] rounded-full animate-spin inline-block mb-2" />
                <p>Connecting to Open-Meteo farm radar...</p>
              </div>
            ) : weatherData ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-4xl font-serif font-bold text-white">
                      {weatherData.current.temperature}°C
                    </span>
                    <div className="text-xs text-white/60 mt-0.5">
                      Humidity {weatherData.current.humidity}% • Wind {Math.round(weatherData.current.wind_speed)} km/h
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-white/50 block">Today's Rain</span>
                    <span className="text-lg font-serif font-bold text-[#38BDF8]">
                      {weatherData.current.rainfall_today} mm
                    </span>
                  </div>
                </div>

                {/* Spray Window Status */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
                      Agro Spray Recommendation
                    </div>
                    {weatherData.advisories?.[0] ? (
                      <p className="text-xs text-white/80 font-medium mt-1">
                        {weatherData.advisories[0].title}: {weatherData.advisories[0].action}
                      </p>
                    ) : (
                      <p className="text-xs text-white/80 font-medium mt-1">
                        Conditions checked for spray safety
                      </p>
                    )}
                  </div>
                  {weatherData.best_spray_score >= 50 ? (
                    <span className="text-[10px] font-bold bg-[#10B981]/20 text-[#86EFAC] border border-[#10B981]/30 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                      <CheckCircle2 size={12} />
                      Safe Today
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                      <AlertTriangle size={12} />
                      Caution
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/50 py-4">Select your district to see live weather.</p>
            )}
          </div>

          <div className="text-[11px] text-white/40 pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
            <span>Open-Meteo Satellite Model</span>
            <span className="text-[#84CC16]">Live Telemetry</span>
          </div>
        </SpotlightCard>

        {/* APMC Mandi Ticker */}
        <SpotlightCard
          spotlightColor="rgba(16, 185, 129, 0.15)"
          borderColor="rgba(16, 185, 129, 0.35)"
          className="p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-[#10B981]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  APMC Mandi Price Ticker
                </h3>
              </div>
              <Link
                to="/mandi-rates"
                className="text-xs text-[#BEF264] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>All Mandis</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {mandiHighlights.length > 0 ? (
              <div className="space-y-2.5">
                {mandiHighlights.map((m) => (
                  <div
                    key={m.crop}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5"
                  >
                    <div>
                      <div className="text-xs font-bold text-white capitalize">{m.crop}</div>
                      <div className="text-[10px] text-white/50">
                        Top Hub: {m.top_mandis?.[0]?.market || 'Maharashtra APMC'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-serif font-bold text-white">
                        ₹{m.modal_price} <span className="text-[10px] font-sans text-white/50">/ q</span>
                      </div>
                      <div className="text-[10px] font-semibold text-[#84CC16]">
                        {m.change_7d > 0 ? `+${m.change_7d}% weekly` : `${m.change_7d}%`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/50 py-4">Fetching current APMC market auctions...</p>
            )}
          </div>

          <div className="text-[11px] text-white/40 pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
            <span>Govt. MSP Benchmark</span>
            <Link to="/mandi-rates" className="text-[#84CC16] hover:underline font-semibold">
              Explore 10+ Commodities →
            </Link>
          </div>
        </SpotlightCard>
      </div>

      {/* ── 4. TRACKED EXPENSES QUICK BANNER (If user has logged expenses) ── */}
      {totalExpenses !== null && (
        <div className="bg-[#142311] border border-[#84CC16]/40 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#84CC16]/20 border border-[#84CC16]/30 flex items-center justify-center text-[#BEF264]">
              <IndianRupee size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#84CC16] uppercase tracking-wide">
                Tracked Operational Input Costs
              </div>
              <div className="text-2xl font-serif font-bold text-white">
                <AnimatedCounter value={totalExpenses} prefix="₹" duration={1000} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link
              to="/expenses"
              className="text-xs bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl border border-white/15 transition"
            >
              Add Expense
            </Link>
            <Link
              to="/farm-budget"
              className="text-xs agri-btn-primary px-4 py-2 rounded-xl transition"
            >
              Budget Planner
            </Link>
          </div>
        </div>
      )}

      {/* ── 5. ALL 12 REAL OPERATIONAL AGRI-ENGINES ───────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-[#84CC16] uppercase tracking-wider">
              Agronomic Decision &amp; Management Engines
            </h3>
            <p className="text-xs text-white/50">Complete suite of 12 tools for farmers across Maharashtra</p>
          </div>
          <span className="text-xs font-semibold text-[#BEF264] bg-[#84CC16]/20 border border-[#84CC16]/30 px-3 py-1 rounded-full">
            12 Engines Ready
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {[
            {
              icon: Sprout,
              title: 'Crop Advisor',
              desc: 'ML multi-variable crop recommendation',
              path: '/crop-recommendation',
              color: 'text-[#84CC16]',
              badge: 'Popular',
            },
            {
              icon: ScanLine,
              title: 'Disease Scan',
              desc: 'Leaf pathology AI diagnostic',
              path: '/disease-detection',
              color: 'text-[#38BDF8]',
              badge: 'Vision AI',
            },
            {
              icon: CloudSun,
              title: 'Weather & Spray',
              desc: 'Live 4-day spray radar & advisories',
              path: '/weather-advisory',
              color: 'text-[#F59E0B]',
              badge: 'Live',
            },
            {
              icon: Store,
              title: 'Mandi Rates',
              desc: 'APMC market prices & MSP trends',
              path: '/mandi-rates',
              color: 'text-[#10B981]',
              badge: 'Real-time',
            },
            {
              icon: FlaskConical,
              title: 'Fertilizer Rx',
              desc: 'NPK formulations for soil color & crop',
              path: '/fertilizer-treatment',
              color: 'text-[#EC4899]',
            },
            {
              icon: TrendingUp,
              title: 'Yield & Profit',
              desc: 'Harvest volume & gross margin calculator',
              path: '/yield-profit',
              color: 'text-[#84CC16]',
            },
            {
              icon: FileSearch,
              title: 'Soil Card OCR',
              desc: 'Auto-scan lab health cards (SHC)',
              path: '/soil-card-ocr',
              color: 'text-[#38BDF8]',
            },
            {
              icon: IndianRupee,
              title: 'Farm Expenses',
              desc: 'Log seeds, fertilizers & labor expenses',
              path: '/expenses',
              color: 'text-[#F59E0B]',
            },
            {
              icon: Calculator,
              title: 'Farm Budget',
              desc: 'Seasonal cashflow & margin planner',
              path: '/farm-budget',
              color: 'text-[#10B981]',
            },
            {
              icon: ClipboardList,
              title: 'Farm Report',
              desc: 'Unified summary of past predictions',
              path: '/farm-report',
              color: 'text-[#84CC16]',
            },
            {
              icon: Landmark,
              title: 'Gov. Schemes',
              desc: 'PM-Kisan, solar pumps & subsidies',
              path: '/government-schemes',
              color: 'text-[#38BDF8]',
            },
            {
              icon: MessageCircle,
              title: 'AI Assistant',
              desc: 'Multilingual voice agronomist Q&A',
              path: '/ai-assistant',
              color: 'text-[#84CC16]',
              badge: 'Voice AI',
            },
          ].map((item) => (
            <Link
              key={item.title}
              to={item.path}
              className="group block"
            >
              <SpotlightCard
                className="h-full p-4.5 flex flex-col justify-between"
                spotlightColor="rgba(132, 204, 22, 0.16)"
                borderColor="rgba(132, 204, 22, 0.35)"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                      <item.icon size={18} />
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-white group-hover:text-[#BEF264] transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-white/50 mt-1 line-clamp-1">
                    {item.desc}
                  </div>
                </div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-4 flex items-center gap-1 group-hover:text-[#84CC16] group-hover:translate-x-1 transition-all">
                  <span>Open Tool</span>
                  <span>→</span>
                </div>
              </SpotlightCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
