import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MapPin, LogOut, Sprout, FlaskConical, TrendingUp, Clock, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SpotlightCard from '../components/SpotlightCard';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
  const { user, token, logout, login } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete history state
  const [deletingHistory, setDeletingHistory] = useState(false);

  const fetchHistory = useCallback(() => {
    if (!token) return;
    fetch(`${API_BASE}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setHistory(data.history || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleStartEdit = () => {
    setEditName(user?.name || '');
    setEditRegion(user?.region || '');
    setEditError('');
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditError('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError('Name cannot be empty');
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      const res = await fetch(`${API_BASE}/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName.trim(), region: editRegion.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to update profile');
      }
      const updatedUser = await res.json();
      login(token, updatedUser);
      setEditing(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!window.confirm('Clear all your prediction logs and diagnostic history?')) return;
    setDeletingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setHistory([]);
      }
    } catch {
      // silently handle
    } finally {
      setDeletingHistory(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-12 agri-animate-fade-in">
      {/* Profile Card */}
      <SpotlightCard
        spotlightColor="rgba(132, 204, 22, 0.18)"
        borderColor="rgba(132, 204, 22, 0.45)"
        className="p-6 sm:p-8 space-y-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E3319] to-[#142311] text-[#84CC16] font-serif font-bold text-2xl flex items-center justify-center border border-[#84CC16]/40 shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[#FDFAF2]">{user?.name || 'Farmer'}</h2>
              <div className="text-xs text-[#8E9B85] flex items-center gap-1.5 mt-0.5">
                <Mail size={13} />
                <span>{user?.email}</span>
              </div>
              <div className="text-xs text-[#BEF264] font-semibold flex items-center gap-1.5 mt-1">
                <MapPin size={13} className="text-[#84CC16]" />
                <span>{user?.region || 'Maharashtra'}</span>
              </div>
            </div>
          </div>

          {!editing && (
            <button
              onClick={handleStartEdit}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#10190D] hover:bg-[#1C2B18] text-[#FDFAF2] px-3.5 py-2 rounded-xl border border-white/15 transition cursor-pointer"
            >
              <Pencil size={13} />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Edit Profile Form */}
        {editing && (
          <form onSubmit={handleSaveProfile} className="bg-[#0B1309]/90 p-4.5 rounded-2xl border border-white/10 space-y-3.5">
            <div className="text-xs font-bold text-[#84CC16] uppercase tracking-wider">Edit Account Details</div>
            {editError && <p className="text-xs text-red-400">{editError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8E9B85] mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#10190D] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-[#FDFAF2] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8E9B85] mb-1">Farming Region / District</label>
                <input
                  type="text"
                  value={editRegion}
                  onChange={(e) => setEditRegion(e.target.value)}
                  className="w-full bg-[#10190D] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-[#FDFAF2] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3.5 py-1.5 rounded-xl border border-white/15 text-xs font-semibold text-[#8E9B85] hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="agri-btn-primary px-4 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 flex justify-between items-center border-t border-white/10">
          <span className="text-xs text-[#8E9B85]">Registered Account • AgriSense 2.0</span>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F87171] hover:bg-red-950/40 border border-transparent hover:border-red-500/30 px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </SpotlightCard>

      {/* Prediction History Stream */}
      <div className="agri-glass-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div>
            <h3 className="text-sm font-serif font-bold text-[#FDFAF2]">Diagnostic &amp; Prediction Logs</h3>
            <p className="text-xs text-[#8E9B85]">Recent actions and ML recommendations associated with your farm</p>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleDeleteHistory}
              disabled={deletingHistory}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F87171] hover:underline cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {loadingHistory ? (
          <div className="py-8 text-center text-xs text-[#8E9B85]">Loading prediction activity...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8E9B85]">No recorded predictions yet. Run your first crop recommendation or leaf scan.</div>
        ) : (
          <div className="space-y-2.5">
            {history.map((item) => {
              const Icon = MODULE_ICONS[item.module] || Sprout;
              return (
                <div
                  key={item.id}
                  className="bg-[#0B1309]/80 p-3.5 rounded-2xl border border-white/10 flex items-start gap-3 hover:border-white/20 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#FDFAF2] capitalize">{item.module} Diagnostic</span>
                      <span className="text-[10px] text-[#8E9B85] flex items-center gap-1 shrink-0">
                        <Clock size={11} />
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-[#A3B39C] mt-1 leading-relaxed truncate">{item.summary}</p>
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
