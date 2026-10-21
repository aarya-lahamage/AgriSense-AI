import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MapPin, LogOut, Sprout, FlaskConical, TrendingUp, Clock, Pencil, Trash2, X, Check } from 'lucide-react';
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

  const fetchHistory = () => {
    if (!token) return;
    fetch(`${API_BASE}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setHistory(data.history || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const startEdit = () => {
    setEditName(user?.name || '');
    setEditRegion(user?.region || '');
    setEditError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditError('');
  };

  const saveEdit = async () => {
    setSaving(true);
    setEditError('');
    try {
      const res = await fetch(`${API_BASE}/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, region: editRegion }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updated = await res.json();
      // Update the auth context with new user data
      login(token, updated);
      setEditing(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!confirm('Delete ALL prediction history? This cannot be undone.')) return;
    setDeletingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      setHistory([]);
    } catch {
      // silently fail
    } finally {
      setDeletingHistory(false);
    }
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
          <div className="flex-1">
            <div className="text-lg font-medium text-[#22301A]">{user.name}</div>
            <div className="text-xs text-[#7A8A6A]">{user.region || 'No region set'}</div>
          </div>
          {!editing && (
            <button
              onClick={startEdit}
              className="text-[#5B7A3A] hover:text-[#22301A] transition p-1.5 rounded-lg hover:bg-[#F6F4EC]"
              title="Edit profile"
            >
              <Pencil size={16} />
            </button>
          )}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="bg-[#F6F4EC] rounded-xl p-4 mb-4 space-y-3">
            <div>
              <label className="text-xs text-[#7A8A6A] mb-1 block">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-white rounded-xl px-3.5 py-2.5 text-sm text-[#22301A] outline-none focus:ring-2 focus:ring-[#5B7A3A]/30"
              />
            </div>
            <div>
              <label className="text-xs text-[#7A8A6A] mb-1 block">Region</label>
              <input
                type="text"
                value={editRegion}
                onChange={(e) => setEditRegion(e.target.value)}
                placeholder="e.g. Pune, Maharashtra"
                className="w-full bg-white rounded-xl px-3.5 py-2.5 text-sm text-[#22301A] outline-none focus:ring-2 focus:ring-[#5B7A3A]/30"
              />
            </div>
            {editError && <p className="text-xs text-red-500">{editError}</p>}
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#5B7A3A] text-white text-sm font-medium py-2.5 rounded-xl hover:bg-[#4A6830] transition disabled:opacity-50"
              >
                <Check size={14} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center justify-center gap-1.5 bg-white text-[#22301A] text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-[#F0EEE4] transition border border-[#E5E0D0]"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}

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
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide">
            Recent Activity
          </h3>
          {history.length > 0 && (
            <button
              onClick={handleDeleteHistory}
              disabled={deletingHistory}
              className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 transition disabled:opacity-50"
            >
              <Trash2 size={12} /> {deletingHistory ? 'Deleting...' : 'Clear All'}
            </button>
          )}
        </div>

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
