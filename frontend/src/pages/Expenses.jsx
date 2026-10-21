import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, Plus, Trash2, X } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

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

  const fetchExpenses = () => {
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
  };

  useEffect(() => {
    fetchExpenses();
  }, [token]);

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
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-full bg-[#DCE8C8] flex items-center justify-center">
          <IndianRupee size={17} strokeWidth={2} className="text-[#5B7A3A]" />
        </div>
        <h2 className="font-serif text-[26px] font-medium text-[#22301A]">Farm Expenses</h2>
      </div>
      <p className="text-[#7A8A6A] text-sm mb-7">Track and manage your farming costs.</p>

      {/* Total card */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] mb-5">
        <div className="text-[12px] font-semibold text-[#22301A] uppercase tracking-wide mb-1">Total Expenses</div>
        <div className="text-3xl font-serif font-medium text-[#22301A]">
          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
        </div>
      </div>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 bg-[#5B7A3A] text-white text-sm font-medium py-3 rounded-xl hover:bg-[#4A6830] transition mb-5"
        >
          <Plus size={16} /> Add Expense
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide">New Expense</h3>
            <button onClick={() => { setShowForm(false); setError(''); }} className="text-[#A8A391] hover:text-[#22301A]">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-xs text-[#7A8A6A] mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F6F4EC] rounded-xl px-3.5 py-2.5 text-sm text-[#22301A] border-none outline-none focus:ring-2 focus:ring-[#5B7A3A]/30"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#7A8A6A] mb-1 block">Amount (₹)</label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full bg-[#F6F4EC] rounded-xl px-3.5 py-2.5 text-sm text-[#22301A] outline-none focus:ring-2 focus:ring-[#5B7A3A]/30"
                required
              />
            </div>
            <div>
              <label className="text-xs text-[#7A8A6A] mb-1 block">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. DAP for wheat"
                className="w-full bg-[#F6F4EC] rounded-xl px-3.5 py-2.5 text-sm text-[#22301A] outline-none focus:ring-2 focus:ring-[#5B7A3A]/30"
              />
            </div>
            <div>
              <label className="text-xs text-[#7A8A6A] mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#F6F4EC] rounded-xl px-3.5 py-2.5 text-sm text-[#22301A] outline-none focus:ring-2 focus:ring-[#5B7A3A]/30"
                required
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#5B7A3A] text-white text-sm font-medium py-3 rounded-xl hover:bg-[#4A6830] transition disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Expense'}
            </button>
          </form>
        </div>
      )}

      {/* Expense list */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)]">
        <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-3.5">
          All Expenses
        </h3>

        {loading && <p className="text-xs text-[#A8A391]">Loading...</p>}

        {!loading && expenses.length === 0 && (
          <div className="text-center py-6">
            <IndianRupee size={22} strokeWidth={1.5} className="text-[#D8D2BE] mx-auto mb-2" />
            <p className="text-xs text-[#A8A391]">No expenses recorded yet. Start tracking your farm costs!</p>
          </div>
        )}

        {!loading && expenses.length > 0 && (
          <div className="space-y-2.5">
            {expenses.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-[#F6F4EC] rounded-xl p-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] bg-[#DCE8C8] text-[#5B7A3A] font-medium px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-[#A8A391]">{formatDate(item.date)}</span>
                  </div>
                  <p className="text-sm font-medium text-[#22301A]">
                    ₹{Number(item.amount).toLocaleString('en-IN')}
                  </p>
                  {item.note && (
                    <p className="text-[11px] text-[#7A8A6A] mt-0.5">{item.note}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-[#A8A391] hover:text-red-500 transition shrink-0"
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
