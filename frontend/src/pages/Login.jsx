import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Mail, Lock, User as UserIcon, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://127.0.0.1:8000';

function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', region: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/login' : '/register';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, region: form.region || null };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Something went wrong');

      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4EC] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#DCE8C8] flex items-center justify-center mx-auto mb-3">
            <Sprout size={22} strokeWidth={1.8} className="text-[#5B7A3A]" />
          </div>
          <h1 className="font-serif text-2xl font-medium text-[#22301A]">AgriSense AI</h1>
          <p className="text-sm text-[#7A8A6A] mt-1">Smart Farming Assistant</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)]">
          <div className="flex bg-[#F6F4EC] rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 text-sm py-2 rounded-lg transition ${
                mode === 'login' ? 'bg-white text-[#22301A] font-medium shadow-sm' : 'text-[#7A8A6A]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 text-sm py-2 rounded-lg transition ${
                mode === 'register' ? 'bg-white text-[#22301A] font-medium shadow-sm' : 'text-[#7A8A6A]'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div className="relative">
                <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0AA98]" />
                <input
                  type="text" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required
                  className="w-full bg-[#F6F4EC] border border-transparent rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#22301A] focus:outline-none focus:border-[#5B7A3A] focus:bg-white transition"
                />
              </div>
            )}
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0AA98]" />
              <input
                type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required
                className="w-full bg-[#F6F4EC] border border-transparent rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#22301A] focus:outline-none focus:border-[#5B7A3A] focus:bg-white transition"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0AA98]" />
              <input
                type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required minLength={6}
                className="w-full bg-[#F6F4EC] border border-transparent rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#22301A] focus:outline-none focus:border-[#5B7A3A] focus:bg-white transition"
              />
            </div>
            {mode === 'register' && (
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0AA98]" />
                <input
                  type="text" name="region" placeholder="Region (optional)" value={form.region} onChange={handleChange}
                  className="w-full bg-[#F6F4EC] border border-transparent rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#22301A] focus:outline-none focus:border-[#5B7A3A] focus:bg-white transition"
                />
              </div>
            )}

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#5B7A3A] text-white text-sm font-medium py-3 rounded-xl hover:bg-[#4C6B4C] transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;