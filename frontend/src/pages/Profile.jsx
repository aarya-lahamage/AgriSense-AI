import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MapPin, LogOut, Sprout, FlaskConical, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://127.0.0.1:8000';

const MODULE_ICONS = {
  crop: Sprout,
  fertilizer: FlaskConical,
  yield: TrendingUp,
};

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Profile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setHistory(data.history || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="font-serif text-[26px] font-medium text-[#22301A] mb-1">Profile</h2>
      <p className="text-[#7A8A6A] text-sm mb-7">Your account details.</p>

      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] mb-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-full bg-[#22301A] flex items-center justify-center text-white text-lg font-medium">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-medium text-[#22301A]">{user.name}</div>
            <div className="text-xs text-[#7A8A6A]">{user.region || 'No region set'}</div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-[#F6F4EC] rounded-xl p-3.5 flex items-center gap-3">
            <Mail size={16} className="text-[#8A8A6A]" />
            <span className="text-sm text-[#22301A]">{user.email}</span>
          </div>
          <div className="bg-[#F6F4EC] rounded-xl p-3.5 flex items-center gap-3">
            <MapPin size={16} className="text-[#8A8A6A]" />
            <span className="text-sm text-[#22301A]">{user.region || 'Not set'}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 text-sm font-medium py-3 rounded-xl hover:bg-red-100 transition"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)]">
        <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-3.5">
          Recent Activity
        </h3>

        {loadingHistory && <p className="text-xs text-[#A8A391]">Loading...</p>}

        {!loadingHistory && history.length === 0 && (
          <div className="text-center py-6">
            <Clock size={22} strokeWidth={1.5} className="text-[#D8D2BE] mx-auto mb-2" />
            <p className="text-xs text-[#A8A391]">
              No predictions yet — try Crop Advisor, Fertilizer, or Yield &amp; Profit.
            </p>
          </div>
        )}

        {!loadingHistory && history.length > 0 && (
          <div className="space-y-2.5">
            {history.map((item) => {
              const Icon = MODULE_ICONS[item.module] || Clock;
              return (
                <div key={item.id} className="flex items-start gap-3 bg-[#F6F4EC] rounded-xl p-3.5">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <Icon size={14} strokeWidth={1.8} className="text-[#5B7A3A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#22301A] leading-snug">{item.summary}</p>
                    <p className="text-[11px] text-[#A8A391] mt-0.5">{timeAgo(item.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
