import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import CropRecommendation from './pages/CropRecommendation';
import DiseaseDetection from './pages/DiseaseDetection';
import WeatherAdvisory from './pages/WeatherAdvisory';
import FertilizerTreatment from './pages/FertilizerTreatment';
import YieldProfit from './pages/YieldProfit';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';

const navItems = [
  { icon: '📊', label: 'Dashboard', path: '/' },
  { icon: '🌱', label: 'Crop Recommendation', path: '/crop-recommendation' },
  { icon: '🔬', label: 'Disease Detection', path: '/disease-detection' },
  { icon: '⛅', label: 'Weather Advisory', path: '/weather-advisory' },
  { icon: '🧪', label: 'Fertilizer & Treatment', path: '/fertilizer-treatment' },
  { icon: '🌾', label: 'Yield & Profit', path: '/yield-profit' },
  { icon: '🤖', label: 'AI Assistant', path: '/ai-assistant' },
  { icon: '👤', label: 'Profile', path: '/profile' },
];

function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 sm:hidden"
          onClick={onClose}
        ></div>
      )}
      <aside
        className={`fixed sm:static z-50 top-0 left-0 h-full w-64 bg-stone-900 text-stone-200 flex flex-col shrink-0 transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } sm:translate-x-0`}
      >
        <div className="px-6 py-6 border-b border-stone-700">
          <h1 className="text-2xl font-serif font-bold text-amber-400">🌱 AgriSense AI</h1>
          <p className="text-xs text-stone-400 mt-1">Smart Farming Assistant</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-amber-600 text-white font-medium'
                    : 'text-stone-300 hover:bg-stone-800'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-stone-100 flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <div className="sm:hidden flex items-center justify-between bg-stone-900 text-white px-4 py-3">
            <span className="font-serif font-bold text-amber-400">🌱 AgriSense AI</span>
            <button onClick={() => setSidebarOpen(true)} className="text-xl">☰</button>
          </div>

          <main className="flex-1 px-3 sm:px-6 md:px-10 py-6 sm:py-8 overflow-x-hidden">
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