import { useState, useEffect, useCallback } from 'react';
import { Store, Volume2, VolumeX, RefreshCw, Search, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { speakText, stopSpeech, isSpeaking } from '../utils/speech';
import SpotlightCard from '../components/SpotlightCard';
import AnimatedCounter from '../components/AnimatedCounter';
import ShinyText from '../components/ShinyText';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const CROP_TABS = [
  { id: '', label: 'All Commodities' },
  { id: 'soybean', label: 'Soybean (सोयाबीन)' },
  { id: 'cotton', label: 'Cotton (कापूस)' },
  { id: 'onion', label: 'Onion (कांदा)' },
  { id: 'tur', label: 'Tur / Arhar (तूर)' },
  { id: 'gram', label: 'Gram / Chana (चना)' },
  { id: 'wheat', label: 'Wheat (गहू)' },
  { id: 'tomato', label: 'Tomato (टोमॅटो)' },
  { id: 'sugarcane', label: 'Sugarcane (ऊस)' },
  { id: 'maize', label: 'Maize (मका)' },
  { id: 'grapes', label: 'Grapes (द्राक्षे)' },
];

export default function MandiRates() {
  const [data, setData] = useState([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [loading, setLoading] = useState(true);
  const [speakingId, setSpeakingId] = useState(null);

  const fetchRates = useCallback((crop = selectedCrop, district = searchDistrict) => {
    setLoading(true);
    let url = `${API_BASE}/mandi-prices`;
    const params = [];
    if (crop) params.push(`crop=${encodeURIComponent(crop)}`);
    if (district) params.push(`district=${encodeURIComponent(district)}`);
    if (params.length) url += `?${params.join('&')}`;

    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
        setUpdatedAt(res.updated_at || '');
      })
      .catch((err) => console.error('Failed to load mandi rates', err))
      .finally(() => setLoading(false));
  }, [selectedCrop, searchDistrict]);

  useEffect(() => {
    fetchRates(selectedCrop, searchDistrict);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCrop]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRates(selectedCrop, searchDistrict);
  };

  const handleAudioAdvice = (item) => {
    if (speakingId === item.crop && isSpeaking()) {
      stopSpeech();
      setSpeakingId(null);
      return;
    }
    const mspText = item.msp ? `MSP benchmark is ₹${item.msp} per quintal.` : 'This crop trades on open market demand without MSP.';
    const text = `APMC market rate for ${item.crop_name}. Modal price is ₹${item.modal_price} per quintal. ${mspText} Recommendation: ${item.recommendation}`;
    setSpeakingId(item.crop);
    speakText(text, () => setSpeakingId(null));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 agri-animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C150A] via-[#142311] to-[#1E3319] text-white p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 mb-2">
              <Store size={13} />
              <ShinyText text="APMC Market Rates & Government MSP" speed={4} className="text-[11px] font-semibold" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FDFAF2]">
              Live Mandi Price Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-[#A3B39C] mt-1">
              Real-time daily modal auction prices, 7-day trend analysis, MSP floor comparison, and top Maharashtra trading hubs.
              {updatedAt && <span className="block mt-1 text-[11px] text-[#BEF264]/80">Updated: {updatedAt}</span>}
            </p>
          </div>

          <button
            onClick={() => fetchRates(selectedCrop, searchDistrict)}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-xs text-white font-semibold px-4 py-2.5 rounded-xl border border-white/20 transition shadow-sm cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Update Rates</span>
          </button>
        </div>
      </div>

      {/* Filters & District Search */}
      <div className="agri-glass-card p-5 sm:p-6 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9B85]" />
            <input
              type="text"
              placeholder="Filter by Maharashtra District or APMC (e.g. Latur, Akola, Nashik)..."
              value={searchDistrict}
              onChange={(e) => setSearchDistrict(e.target.value)}
              className="w-full bg-[#10190D] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#FDFAF2] placeholder-[#6B7C63] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
            />
          </div>
          <button
            type="submit"
            className="agri-btn-primary px-5 py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
          >
            Filter Mandis
          </button>
        </form>

        {/* Commodity Category Tabs */}
        <div>
          <div className="text-[11px] font-bold text-[#8E9B85] uppercase tracking-wider mb-2">
            Filter by Commodity
          </div>
          <div className="flex flex-wrap gap-2">
            {CROP_TABS.map((tab) => {
              const isSelected = selectedCrop === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCrop(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#84CC16] text-[#070B06] font-bold shadow-[0_0_12px_rgba(132,204,22,0.35)]'
                      : 'bg-[#10190D]/80 text-[#A8B5A0] hover:text-white border border-white/10 hover:border-white/25'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Commodity Cards Feed */}
      {loading ? (
        <div className="agri-glass-card p-10 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#84CC16]/20 border-t-[#84CC16] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#A8B5A0]">Fetching verified APMC market prices and arrival records...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="agri-glass-card p-8 text-center text-xs text-[#8E9B85]">
          No APMC mandi auctions matching your criteria. Try resetting the filter.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item) => {
            const hasMsp = item.msp && item.msp > 0;
            const diffFromMsp = hasMsp ? item.modal_price - item.msp : null;
            const isAboveMsp = diffFromMsp && diffFromMsp >= 0;

            return (
              <SpotlightCard
                key={item.crop}
                spotlightColor="rgba(132, 204, 22, 0.16)"
                borderColor="rgba(132, 204, 22, 0.4)"
                className="p-6 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-serif font-bold text-[#FDFAF2]">
                        {item.crop_name}
                      </h3>
                      <span className="text-[10px] font-semibold bg-white/10 text-[#BEF264] px-2 py-0.5 rounded-md border border-white/10">
                        {item.variety}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8E9B85] mt-0.5">
                      Trading Unit: <strong className="text-[#FDFAF2]">{item.unit}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      onClick={() => handleAudioAdvice(item)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                        speakingId === item.crop
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 animate-pulse'
                          : 'bg-[#10190D] text-[#FDFAF2] border-white/15 hover:border-white/30'
                      }`}
                    >
                      {speakingId === item.crop ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      <span>Audio Advisory</span>
                    </button>

                    <div className="text-right">
                      <div className="text-2xl font-serif font-bold text-[#84CC16]">
                        <AnimatedCounter value={item.modal_price} prefix="₹" duration={1000} />
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[11px] font-semibold">
                        {item.change_7d >= 0 ? (
                          <span className="text-[#4ADE80] flex items-center">
                            <TrendingUp size={12} className="mr-0.5" /> +{item.change_7d}%
                          </span>
                        ) : (
                          <span className="text-[#F87171] flex items-center">
                            <TrendingDown size={12} className="mr-0.5" /> {item.change_7d}%
                          </span>
                        )}
                        <span className="text-[#8E9B85] font-normal">7-day</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#0B1309]/80 p-3 rounded-2xl border border-white/10">
                    <div className="text-[10px] font-semibold text-[#8E9B85] uppercase">Modal Auction Price</div>
                    <div className="text-base font-serif font-bold text-[#FDFAF2] mt-0.5">₹{item.modal_price}</div>
                  </div>
                  <div className="bg-[#0B1309]/80 p-3 rounded-2xl border border-white/10">
                    <div className="text-[10px] font-semibold text-[#8E9B85] uppercase">Price Range</div>
                    <div className="text-xs font-bold text-[#FDFAF2] mt-1">₹{item.min_price} – ₹{item.max_price}</div>
                  </div>
                  <div className="bg-[#0B1309]/80 p-3 rounded-2xl border border-white/10">
                    <div className="text-[10px] font-semibold text-[#8E9B85] uppercase">MSP Floor Benchmark</div>
                    <div className="text-base font-serif font-bold text-[#84CC16] mt-0.5">
                      {hasMsp ? `₹${item.msp}` : 'Market Driven'}
                    </div>
                  </div>
                  <div className="bg-[#0B1309]/80 p-3 rounded-2xl border border-white/10">
                    <div className="text-[10px] font-semibold text-[#8E9B85] uppercase">Market Position</div>
                    <div className="text-xs font-bold mt-1">
                      {hasMsp ? (
                        isAboveMsp ? (
                          <span className="text-[#4ADE80]">+{diffFromMsp} above MSP</span>
                        ) : (
                          <span className="text-[#F87171]">{diffFromMsp} below MSP</span>
                        )
                      ) : (
                        <span className="text-[#8E9B85]">Open Auction</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selling Recommendation Banner */}
                {item.recommendation && (
                  <div className="bg-[#84CC16]/10 border border-[#84CC16]/30 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-[#BEF264]">
                    <CheckCircle2 size={16} className="text-[#84CC16] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#FDFAF2]">Market Recommendation: </strong>
                      <span>{item.recommendation}</span>
                    </div>
                  </div>
                )}

                {/* Top Mandis Breakdown */}
                {item.top_mandis?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-[#8E9B85] uppercase tracking-wider mb-2">
                      Top Performing APMC Mandi Hubs (Maharashtra)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      {item.top_mandis.map((m) => (
                        <div
                          key={m.market}
                          className="bg-[#0B1309]/80 p-3 rounded-xl border border-white/10 text-xs flex justify-between items-center hover:border-white/20 transition"
                        >
                          <div>
                            <div className="font-bold text-[#FDFAF2]">{m.market}</div>
                            <div className="text-[10px] text-[#8E9B85]">{m.district} • {m.arrival_tonnes}t arrival</div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-serif font-bold text-[#84CC16]">₹{m.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
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
