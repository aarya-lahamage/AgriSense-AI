import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, FlaskConical, TrendingUp, ClipboardList } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

const MODULE_META = {
  crop: {
    label: 'Crop Recommendation',
    icon: Sprout,
    link: '/crop-recommendation',
    color: 'text-[#5B7A3A]',
    bg: 'bg-[#DCE8C8]',
  },
  fertilizer: {
    label: 'Fertilizer Recommendation',
    icon: FlaskConical,
    link: '/fertilizer-treatment',
    color: 'text-[#5B7A3A]',
    bg: 'bg-[#E5EFD5]',
  },
  yield: {
    label: 'Yield & Profit Prediction',
    icon: TrendingUp,
    link: '/yield-profit',
    color: 'text-[#5B7A3A]',
    bg: 'bg-[#FBF3E3]',
  },
};

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FarmReport() {
  const { token } = useAuth();
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
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-full bg-[#DCE8C8] flex items-center justify-center">
          <ClipboardList size={17} strokeWidth={2} className="text-[#5B7A3A]" />
        </div>
        <h2 className="font-serif text-[26px] font-medium text-[#22301A]">My Farm Report</h2>
      </div>
      <p className="text-[#7A8A6A] text-sm mb-7">
        A snapshot of your latest results across all three modules.
      </p>

      {loading && (
        <p className="text-sm text-[#7A8A6A]">Loading your report...</p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {report && (
        <div className="space-y-4">
          {Object.entries(MODULE_META).map(([key, meta]) => {
            const entry = report[key];
            const Icon = meta.icon;
            return (
              <div
                key={key}
                className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)]"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full ${meta.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={18} strokeWidth={1.8} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-[#22301A] uppercase tracking-wide mb-1">
                      {meta.label}
                    </div>
                    {entry ? (
                      <>
                        <p className="text-sm text-[#22301A] font-medium">{entry.summary}</p>
                        <p className="text-[11px] text-[#A8A391] mt-1">{formatDate(entry.created_at)}</p>
                      </>
                    ) : (
                      <p className="text-sm text-[#7A8A6A]">
                        You haven't tried {meta.label} yet.{' '}
                        <Link to={meta.link} className="text-[#5B7A3A] underline">
                          Try it now →
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {report && (
        <p className="text-[11px] text-[#A8A391] mt-5 text-center">
          Each card shows only your most recent result. Use the sidebar to run a new prediction.
        </p>
      )}
    </div>
  );
}
