import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, FlaskConical, TrendingUp, ClipboardList, ArrowRight, Calendar, Sparkles } from 'lucide-react';
import SpotlightCard from '../components/SpotlightCard';
import ShinyText from '../components/ShinyText';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const MODULE_META = {
  crop: {
    label: 'Crop Recommendation',
    sub: 'ML Agronomic Decision',
    icon: Sprout,
    link: '/crop-recommendation',
    color: 'text-[#84CC16]',
    bg: 'bg-[#84CC16]/20',
    border: 'border-[#84CC16]/30',
  },
  fertilizer: {
    label: 'Fertilizer Prescription',
    sub: 'Targeted NPK Formulation',
    icon: FlaskConical,
    link: '/fertilizer-treatment',
    color: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/20',
    border: 'border-[#F59E0B]/30',
  },
  yield: {
    label: 'Yield & Profit Projection',
    sub: 'Multi-Season Revenue Model',
    icon: TrendingUp,
    link: '/yield-profit',
    color: 'text-[#38BDF8]',
    bg: 'bg-[#38BDF8]/20',
    border: 'border-[#38BDF8]/30',
  },
};

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function FarmReport() {
  const { token, user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/farm-report`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load farm report');
        return r.json();
      })
      .then(setReport)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12 agri-animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C150A] via-[#142311] to-[#1E3319] text-white p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 mb-2">
            <ClipboardList size={13} />
            <ShinyText text="Consolidated Farm Intelligence Snapshot" speed={4} className="text-[11px] font-semibold" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FDFAF2]">
            Unified Farm Report
          </h2>
          <p className="text-xs sm:text-sm text-[#A3B39C] mt-1">
            Single view of your most recent predictions and prescriptions across Crop, Fertilizer, and Yield modules for {user?.name || 'your farm'}.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="agri-glass-card p-10 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#84CC16]/20 border-t-[#84CC16] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#A8B5A0]">Compiling multi-module diagnostic reports...</p>
        </div>
      ) : error ? (
        <div className="agri-glass-card p-6 border border-red-500/40 text-red-300 text-xs">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {['crop', 'fertilizer', 'yield'].map((moduleKey) => {
            const meta = MODULE_META[moduleKey];
            const item = report?.[moduleKey];
            const Icon = meta.icon;

            return (
              <SpotlightCard
                key={moduleKey}
                spotlightColor="rgba(132, 204, 22, 0.16)"
                borderColor="rgba(132, 204, 22, 0.4)"
                className="p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${meta.bg} ${meta.color} flex items-center justify-center border ${meta.border} shadow-xs`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-serif font-bold text-[#FDFAF2]">{meta.label}</h3>
                      <div className="text-[10px] text-[#8E9B85] uppercase tracking-wider">{meta.sub}</div>
                    </div>
                  </div>

                  {item && (
                    <span className="text-[11px] text-[#A8B5A0] flex items-center gap-1 font-medium bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
                      <Calendar size={12} />
                      {formatDate(item.created_at)}
                    </span>
                  )}
                </div>

                {item ? (
                  <div className="bg-[#0B1309]/80 p-4 rounded-2xl border border-white/10 space-y-2">
                    <div className="text-xs font-semibold text-[#BEF264] flex items-center gap-1.5">
                      <Sparkles size={13} className="text-[#84CC16]" />
                      <span>Latest Recorded Recommendation:</span>
                    </div>
                    <p className="text-xs text-[#D1DAC9] leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#0B1309]/80 p-4 rounded-2xl border border-white/10 text-xs text-[#8E9B85] flex items-center justify-between">
                    <span>No prediction run yet for this module.</span>
                    <Link
                      to={meta.link}
                      className="text-xs font-bold text-[#BEF264] hover:underline flex items-center gap-1"
                    >
                      <span>Run Now</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </SpotlightCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
