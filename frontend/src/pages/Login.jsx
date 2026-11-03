import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Mail, Lock, User as UserIcon, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SpotlightCard from '../components/SpotlightCard';
import ShinyText from '../components/ShinyText';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
    <div className="min-h-screen bg-[#070B06] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#84CC16]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 agri-animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1E3319] to-[#142311] border border-[#84CC16]/40 flex items-center justify-center mx-auto mb-3 shadow-[0_0_24px_rgba(132,204,22,0.3)] animate-float">
            <Sprout size={26} strokeWidth={2} className="text-[#84CC16]" />
          </div>
          <h1>
            <ShinyText text="AgriSense AI" speed={3.5} className="font-serif text-2xl sm:text-3xl font-bold" />
          </h1>
          <p className="text-xs text-[#A8B5A0] mt-1">Living Farm Intelligence &amp; Agronomic Core</p>
        </div>

        <SpotlightCard
          spotlightColor="rgba(132, 204, 22, 0.22)"
          borderColor="rgba(132, 204, 22, 0.5)"
          className="p-6 sm:p-7 space-y-5"
        >
          <div className="flex bg-[#0B1309] border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 text-xs py-2 rounded-lg font-semibold transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#84CC16] text-[#070B06] shadow-sm'
                  : 'text-[#8E9B85] hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 text-xs py-2 rounded-lg font-semibold transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#84CC16] text-[#070B06] shadow-sm'
                  : 'text-[#8E9B85] hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div className="relative">
                <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9B85]" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#10190D] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#FDFAF2] placeholder-[#6B7C63] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                />
              </div>
            )}
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9B85]" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full bg-[#10190D] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#FDFAF2] placeholder-[#6B7C63] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9B85]" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full bg-[#10190D] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#FDFAF2] placeholder-[#6B7C63] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
              />
            </div>
            {mode === 'register' && (
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9B85]" />
                <input
                  type="text"
                  name="region"
                  placeholder="Region / District (e.g. Pune, Latur)"
                  value={form.region}
                  onChange={handleChange}
                  className="w-full bg-[#10190D] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#FDFAF2] placeholder-[#6B7C63] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                />
              </div>
            )}

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full agri-btn-primary py-3 rounded-xl text-xs font-semibold transition disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? 'Authenticating...' : mode === 'login' ? 'Enter AgriSense' : 'Create Farm Account'}
            </button>
          </form>
        </SpotlightCard>
      </div>
    </div>
  );
}

export default Login;