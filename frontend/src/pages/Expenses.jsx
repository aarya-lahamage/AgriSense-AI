import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, Plus, Trash2, X } from 'lucide-react';
import AnimatedCounter from '../components/AnimatedCounter';
import SpotlightCard from '../components/SpotlightCard';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const CATEGORIES = [
  'Seeds', 'Fertilizer', 'Pesticide', 'Labour', 'Irrigation',
  'Equipment', 'Transport', 'Rent', 'Other',
];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Expenses() {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchExpenses = useCallback(() => {
    if (!token) return;
    fetch(`${API_BASE}/expenses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setExpenses(data.expenses || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    setSubmitting(true);
    setError('');
    fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ category, amount: Number(amount), note, date }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to add expense');
        setCategory(CATEGORIES[0]);
        setAmount('');
        setNote('');
        setDate(new Date().toISOString().slice(0, 10));
        setShowForm(false);
        fetchExpenses();
      })
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false));
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this expense?')) return;
    fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to delete');
        fetchExpenses();
      })
      .catch(() => {});
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-12 agri-animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C150A] via-[#142311] to-[#1E3319] text-white p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 mb-2">
            <IndianRupee size={13} />
            <span>Farm Operational Ledger</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FDFAF2]">
            Farm Expenses &amp; Cashflow
          </h2>
          <p className="text-xs sm:text-sm text-[#A3B39C] mt-1">
            Track fertilizers, seeds, labor, machinery hire, and input purchases for transparent cost accounting.
          </p>
        </div>
      </div>

      {/* Total card */}
      <SpotlightCard
        spotlightColor="rgba(132, 204, 22, 0.2)"
        borderColor="rgba(132, 204, 22, 0.45)"
        className="p-6 border border-white/10"
      >
        <div className="text-xs font-semibold text-[#8E9B85] uppercase tracking-wider mb-1">Total Operating Expenses</div>
        <div className="text-3xl font-serif font-bold text-[#84CC16]">
          <AnimatedCounter value={total} prefix="₹" duration={1200} />
        </div>
      </SpotlightCard>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 agri-btn-primary py-3.5 rounded-2xl text-sm font-semibold cursor-pointer"
        >
          <Plus size={16} /> Add Expense
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <div className="agri-glass-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider">Record New Expense</h3>
            <button onClick={() => { setShowForm(false); setError(''); }} className="text-[#8E9B85] hover:text-white cursor-pointer">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3.5">
            <div>
              <label className="text-xs text-[#8E9B85] mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#10190D] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#FDFAF2] outline-none focus:ring-2 focus:ring-[#84CC16]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#10190D]">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#8E9B85] mb-1 block">Amount (₹)</label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full bg-[#10190D] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#FDFAF2] outline-none focus:ring-2 focus:ring-[#84CC16]"
                required
              />
            </div>
            <div>
              <label className="text-xs text-[#8E9B85] mb-1 block">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. DAP for wheat"
                className="w-full bg-[#10190D] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#FDFAF2] outline-none focus:ring-2 focus:ring-[#84CC16]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8E9B85] mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#10190D] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#FDFAF2] outline-none focus:ring-2 focus:ring-[#84CC16]"
                required
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full agri-btn-primary py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Adding...' : 'Add Expense'}
            </button>
          </form>
        </div>
      )}

      {/* Expense list */}
      <div className="agri-glass-card p-6 space-y-4">
        <h3 className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider pb-2 border-b border-white/10">
          Recorded Expense Ledger
        </h3>

        {loading && <p className="text-xs text-[#8E9B85]">Loading expense transactions...</p>}

        {!loading && expenses.length === 0 && (
          <div className="text-center py-6">
            <IndianRupee size={22} strokeWidth={1.5} className="text-[#6B7C63] mx-auto mb-2" />
            <p className="text-xs text-[#8E9B85]">No expenses recorded yet. Start tracking your farm costs!</p>
          </div>
        )}

        {!loading && expenses.length > 0 && (
          <div className="space-y-2.5">
            {expenses.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-[#0B1309]/80 border border-white/10 rounded-xl p-3.5 hover:border-white/20 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 font-medium px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-[#8E9B85]">{formatDate(item.date)}</span>
                  </div>
                  <p className="text-sm font-medium text-[#FDFAF2]">
                    ₹{Number(item.amount).toLocaleString('en-IN')}
                  </p>
                  {item.note && (
                    <p className="text-[11px] text-[#A3B39C] mt-0.5">{item.note}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-[#8E9B85] hover:text-red-400 transition shrink-0 cursor-pointer p-1"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
