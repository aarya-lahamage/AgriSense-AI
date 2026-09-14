import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Sprout, ScanLine, CloudSun, FlaskConical, TrendingUp, MessageCircle, User, Lightbulb, ChevronRight } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import CropRecommendation from './pages/CropRecommendation';
import DiseaseDetection from './pages/DiseaseDetection';
import WeatherAdvisory from './pages/WeatherAdvisory';
import FertilizerTreatment from './pages/FertilizerTreatment';
import YieldProfit from './pages/YieldProfit';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Sprout, label: 'Crop Advisor', path: '/crop-recommendation' },
  { icon: ScanLine, label: 'Disease Scan', path: '/disease-detection' },
  { icon: CloudSun, label: 'Weather', path: '/weather-advisory' },
  { icon: FlaskConical, label: 'Fertilizer', path: '/fertilizer-treatment' },
  { icon: TrendingUp, label: 'Yield & Profit', path: '/yield-profit' },
  { icon: MessageCircle, label: 'AI Assistant', path: '/ai-assistant' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const farmingTips = [
  "Rotate crops each season to keep soil nutrients balanced.",
  "Test your soil every 2-3 years for accurate fertilizer planning.",
  "Early morning irrigation reduces water loss to evaporation.",
  "Mulching helps retain soil moisture during dry spells.",
];
const todayTip = farmingTips[new Date().getDate() % farmingTips.length];

function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={onClose}></div>
      )}
      <aside
        className={`fixed z-50 top-0 left-0 h-screen w-[230px] bg-white flex flex-col shrink-0 transform transition-transform duration-200 shadow-[1px_0_0_rgba(34,48,26,0.06),4px_0_20px_rgba(34,48,26,0.03)] ${
          open ? 'translate-x-0' : '-translate-x-full'
        } sm:translate-x-0`}
      >
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="w-9 h-9 rounded-full bg-[#DCE8C8] flex items-center justify-center">
            <Sprout size={17} strokeWidth={2} className="text-[#5B7A3A]" />
          </div>
          <div>
            <div className="font-serif text-[#22301A] font-medium text-[16px] leading-tight">AgriSense</div>
            <div className="text-[10px] text-[#A8A391]">Smart Farming</div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition ${
                  isActive
                    ? 'bg-[#EAF1DC] text-[#22301A] font-medium'
                    : 'text-[#8A8A82] hover:bg-[#F6F4EC] hover:text-[#22301A]'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#5B7A3A] rounded-r-full"></span>
                )}
                <Icon size={17} strokeWidth={1.8} className={isActive ? 'text-[#5B7A3A]' : ''} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-3">
          <div className="bg-[#FBF3E3] rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb size={13} strokeWidth={2} className="text-[#C9A15A]" />
              <span className="text-[10px] text-[#A8895A] uppercase tracking-wide font-medium">
                Tip of the Day
              </span>
            </div>
            <p className="text-[11px] text-[#5A4A2E] leading-snug">{todayTip}</p>
          </div>
        </div>

        <Link
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-2.5 px-5 py-4 border-t border-[#F0EEE4] hover:bg-[#F6F4EC] transition"
        >
          <div className="w-8 h-8 rounded-full bg-[#22301A] flex items-center justify-center text-white text-xs font-medium">
            GF
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-[#22301A] font-medium truncate">Guest Farmer</div>
            <div className="text-[10px] text-[#A8A391]">Maharashtra</div>
          </div>
          <ChevronRight size={15} className="text-[#C0BBA8]" />
        </Link>
      </aside>
    </>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F6F4EC]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="sm:ml-[230px] flex flex-col min-h-screen">
          <div className="sm:hidden flex items-center justify-between bg-white border-b border-[#E5E0D0] px-4 py-3">
            <span className="font-serif text-[#22301A] font-medium flex items-center gap-1.5">
              <Sprout size={16} className="text-[#5B7A3A]" /> AgriSense
            </span>
            <button onClick={() => setSidebarOpen(true)} className="text-xl text-[#22301A]">☰</button>
          </div>

          <main className="flex-1 px-4 sm:px-6 md:px-10 py-6 sm:py-8 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/crop-recommendation" element={<CropRecommendation />} />
              <Route path="/disease-detection" element={<DiseaseDetection />} />
              <Route path="/weather-advisory" element={<WeatherAdvisory />} />
              <Route path="/fertilizer-treatment" element={<FertilizerTreatment />} />
              <Route path="/yield-profit" element={<YieldProfit />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;