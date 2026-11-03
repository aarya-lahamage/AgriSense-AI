import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  Home,
  Sprout,
  ScanLine,
  CloudSun,
  FlaskConical,
  TrendingUp,
  MessageCircle,
  User,
  ClipboardList,
  Landmark,
  IndianRupee,
  Calculator,
  Store,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Cpu
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider, useFarmLocation } from './context/LocationContext';
import LocationModal from './components/LocationModal';
import LocationBar from './components/LocationBar';
import ShinyText from './components/ShinyText';

import Dashboard from './pages/Dashboard';
import CropRecommendation from './pages/CropRecommendation';
import DiseaseDetection from './pages/DiseaseDetection';
import WeatherAdvisory from './pages/WeatherAdvisory';
import FertilizerTreatment from './pages/FertilizerTreatment';
import YieldProfit from './pages/YieldProfit';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';
import Login from './pages/Login';
import FarmReport from './pages/FarmReport';
import GovernmentSchemes from './pages/GovernmentSchemes';
import Expenses from './pages/Expenses';
import SoilCardOCR from './pages/SoilCardOCR';
import FarmBudgetPlanner from './pages/FarmBudgetPlanner';
import MandiRates from './pages/MandiRates';
import AdaptiveIntelligence from './pages/AdaptiveIntelligence';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Cpu, label: 'Adaptive Intelligence', path: '/adaptive-intelligence' },
  { icon: Sprout, label: 'Crop Advisor', path: '/crop-recommendation' },
  { icon: ScanLine, label: 'Disease Scan', path: '/disease-detection' },
  { icon: CloudSun, label: 'Weather', path: '/weather-advisory' },
  { icon: Store, label: 'Mandi Rates', path: '/mandi-rates' },
  { icon: FlaskConical, label: 'Fertilizer', path: '/fertilizer-treatment' },
  { icon: TrendingUp, label: 'Yield & Profit', path: '/yield-profit' },
  { icon: IndianRupee, label: 'Expenses', path: '/expenses' },
  { icon: Calculator, label: 'Farm Budget', path: '/farm-budget' },
  { icon: ClipboardList, label: 'Farm Report', path: '/farm-report' },
  { icon: Landmark, label: 'Gov. Schemes', path: '/government-schemes' },
  { icon: MessageCircle, label: 'AI Assistant', path: '/ai-assistant' },
  { icon: User, label: 'Profile', path: '/profile' },
];

function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        id="main-sidebar"
        aria-label="AgriSense Navigation"
        className={`fixed z-50 top-0 left-0 h-screen w-[230px] bg-[#091008] border-r border-white/10 flex flex-col shrink-0 transform transition-transform duration-250 ease-out shadow-[4px_0_30px_rgba(0,0,0,0.7)] ${
          open ? 'translate-x-0' : '-translate-x-full'
        } sm:translate-x-0`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#84CC16]/20 border border-[#84CC16]/40 flex items-center justify-center text-[#84CC16] shadow-[0_0_15px_rgba(132,204,22,0.3)] group-hover:scale-105 transition-transform">
              <Sprout size={18} strokeWidth={2.4} />
            </div>
            <div>
              <div className="font-serif text-white font-bold text-[16px] leading-tight flex items-center gap-1.5 tracking-tight">
                <ShinyText text="AgriSense" speed={3.5} className="font-serif font-bold text-[16px]" /> <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-[#84CC16]/20 text-[#BEF264] font-semibold border border-[#84CC16]/30">AI</span>
              </div>
              <div className="text-[10px] text-white/40 tracking-wider uppercase font-semibold">Living Farm Intel</div>
            </div>
          </Link>

          <button
            onClick={onClose}
            aria-label="Close navigation sidebar"
            className="sm:hidden p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-[#172613] to-[#111C0F] text-[#BEF264] border border-[#84CC16]/30 shadow-[0_0_15px_rgba(132,204,22,0.12)]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#84CC16] rounded-r-full shadow-[0_0_8px_#84CC16]" />
                )}
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={isActive ? 'text-[#84CC16]' : 'text-white/40'}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile Footer */}
        <Link
          to="/profile"
          onClick={onClose}
          aria-label="View user profile"
          className="flex items-center gap-2.5 px-4 py-3.5 border-t border-white/5 bg-[#0D150C] hover:bg-[#131F11] transition"
        >
          <div className="w-8 h-8 rounded-lg bg-[#84CC16]/20 border border-[#84CC16]/30 flex items-center justify-center text-[#BEF264] text-xs font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white font-semibold truncate">{user?.name || 'Farmer'}</div>
            <div className="text-[10px] text-white/40 truncate">{user?.region || 'Maharashtra'}</div>
          </div>
        </Link>
      </aside>
    </>
  );
}

function TopHeaderNav() {
  const { user } = useAuth();
  const { savedLocation, openLocationModal } = useFarmLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchTerm.toLowerCase().trim();
    if (!query) return;

    if (query.includes('crop') || query.includes('recom') || query.includes('plant')) {
      navigate('/crop-recommendation');
    } else if (query.includes('disease') || query.includes('leaf') || query.includes('scan')) {
      navigate('/disease-detection');
    } else if (query.includes('weather') || query.includes('rain') || query.includes('spray')) {
      navigate('/weather-advisory');
    } else if (query.includes('fertilizer') || query.includes('npk')) {
      navigate('/fertilizer-treatment');
    } else if (query.includes('yield') || query.includes('profit') || query.includes('harvest')) {
      navigate('/yield-profit');
    } else if (query.includes('mandi') || query.includes('price') || query.includes('rate')) {
      navigate('/mandi-rates');
    } else if (query.includes('soil') || query.includes('card') || query.includes('ocr')) {
      navigate('/soil-card-ocr');
    } else if (query.includes('budget') || query.includes('cost')) {
      navigate('/farm-budget');
    } else if (query.includes('scheme') || query.includes('subsid') || query.includes('pm')) {
      navigate('/government-schemes');
    } else if (query.includes('ai') || query.includes('assist') || query.includes('chat') || query.includes('ask')) {
      navigate('/ai-assistant');
    } else if (query.includes('expense')) {
      navigate('/expenses');
    } else if (query.includes('report')) {
      navigate('/farm-report');
    } else if (query.includes('profile')) {
      navigate('/profile');
    } else {
      navigate('/');
    }
    setSearchTerm('');
  };

  return (
    <header className="hidden sm:flex items-center justify-between px-6 py-3.5 bg-[#091008]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Season Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#162512] border border-[#84CC16]/30 text-xs text-[#BEF264] font-semibold shadow-[0_0_12px_rgba(132,204,22,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16] animate-pulse" />
          <Sprout size={13} className="text-[#84CC16]" />
          <span>Kharif Season 2026</span>
        </div>

        {/* Location Dropdown Pill */}
        <button
          onClick={openLocationModal}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-xs text-white/80 font-medium transition cursor-pointer"
        >
          <span className="text-[#84CC16]">📍</span>
          <span>{savedLocation?.name || 'Pune, Maharashtra'}</span>
          <ChevronDown size={13} className="text-white/40" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search fields, crops, or modules..."
            className="w-56 lg:w-72 bg-white/5 border border-white/10 focus:border-[#84CC16]/50 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none transition"
          />
        </form>

        {/* Notifications */}
        <button
          className="relative w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
          aria-label="Notifications"
        >
          <Bell size={14} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#84CC16] shadow-[0_0_6px_#84CC16]" />
        </button>

        {/* Avatar */}
        <Link
          to="/profile"
          className="w-8 h-8 rounded-full bg-[#84CC16]/20 border border-[#84CC16]/40 flex items-center justify-center text-[#BEF264] text-xs font-bold shadow-[0_0_10px_rgba(132,204,22,0.25)] hover:scale-105 transition-transform"
        >
          {user?.name?.charAt(0).toUpperCase() || 'A'}
        </Link>
      </div>
    </header>
  );
}

function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B06] flex flex-col items-center justify-center gap-3 text-xs text-white/60">
        <div className="w-8 h-8 border-2 border-[#84CC16]/20 border-t-[#84CC16] rounded-full animate-spin" />
        <span>Authenticating AgriSense session...</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[#070B06] text-[#E2E8F0]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="sm:ml-[230px] flex flex-col min-h-screen">
        <TopHeaderNav />

        {/* Mobile Header Bar */}
        <header className="sm:hidden sticky top-0 z-30 flex items-center justify-between bg-[#091008]/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#84CC16]/20 border border-[#84CC16]/40 flex items-center justify-center text-[#84CC16]">
              <Sprout size={16} strokeWidth={2.4} />
            </div>
            <ShinyText text="AgriSense AI" speed={3.5} className="font-serif font-bold text-base" />
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 rounded-xl text-white/80 hover:bg-white/10 transition"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 px-3 sm:px-6 md:px-8 py-5 sm:py-6 overflow-x-hidden">
          <LocationBar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/adaptive-intelligence" element={<AdaptiveIntelligence />} />
            <Route path="/crop-recommendation" element={<CropRecommendation />} />
            <Route path="/disease-detection" element={<DiseaseDetection />} />
            <Route path="/weather-advisory" element={<WeatherAdvisory />} />
            <Route path="/fertilizer-treatment" element={<FertilizerTreatment />} />
            <Route path="/yield-profit" element={<YieldProfit />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/farm-report" element={<FarmReport />} />
            <Route path="/government-schemes" element={<GovernmentSchemes />} />
            <Route path="/mandi-rates" element={<MandiRates />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/soil-card-ocr" element={<SoilCardOCR />} />
            <Route path="/farm-budget" element={<FarmBudgetPlanner />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <LocationModal />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
