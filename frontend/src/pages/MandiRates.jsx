import { useState, useEffect } from 'react';
import { Store, TrendingUp, TrendingDown, Volume2, VolumeX, Search, Award, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { speakText, stopSpeech, isSpeaking } from '../utils/speech';

const API_BASE = 'http://127.0.0.1:8000';

const CROP_TABS = [
  { id: '', label: 'All Crops' },
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

  const fetchRates = (crop = selectedCrop, district = searchDistrict) => {
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
  };

  useEffect(() => {
    fetchRates(selectedCrop, searchDistrict);
  }, [selectedCrop]);

  const handleDistrictSearch = (e) => {
    e.preventDefault();
    fetchRates(selectedCrop, searchDistrict);
  };

  const handleSpeak = (item) => {
    if (speakingId === item.crop && isSpeaking()) {
      stopSpeech();
      setSpeakingId(null);
      return;
    }

    const mspText = item.msp ? `Government MSP is ${item.msp} rupees per quintal.` : '';
    const topMandi = item.top_mandis?.[0];
    const topMandiText = topMandi
      ? `Highest price is at ${topMandi.market} in ${topMandi.district} at ${topMandi.price} rupees.`
      : '';
    const textToSpeak = `${item.crop_name}. Current modal price is ${item.modal_price} ${item.unit}. ${mspText} Recommendation: ${item.recommendation} ${topMandiText}`;

    setSpeakingId(item.crop);
    speakText(textToSpeak, () => setSpeakingId(null));
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-[#DCE8C8] flex items-center justify-center">
              <Store size={20} strokeWidth={2} className="text-[#5B7A3A]" />
            </div>
            <h2 className="font-serif text-[26px] font-medium text-[#22301A]">APMC Mandi Rates &amp; Markets</h2>
          </div>
          <p className="text-[#7A8A6A] text-sm">
            Live commodity prices, Govt. MSP comparisons, and highest paying mandis across Maharashtra.
          </p>
        </div>
        {updatedAt && (
          <div className="flex items-center gap-2 text-xs text-[#8A8A6A] bg-white px-3.5 py-2 rounded-xl shadow-sm border border-[#F0EEE4]">
            <RefreshCw size={13} className="text-[#5B7A3A]" />
            <span>Updated: {updatedAt}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] mb-6">
        <form onSubmit={handleDistrictSearch} className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A391]" />
            <input
              type="text"
              placeholder="Search district or market (e.g. Nashik, Latur, Pune, Akola)..."
              value={searchDistrict}
              onChange={(e) => setSearchDistrict(e.target.value)}
              className="w-full bg-[#F6F4EC] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#22301A] outline-none focus:ring-2 focus:ring-[#5B7A3A]/30 placeholder-[#A8A391]"
            />
          </div>
          <button
            type="submit"
            className="bg-[#5B7A3A] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#4A6830] transition shrink-0"
          >
            Filter Mandis
          </button>
          {searchDistrict && (
            <button
              type="button"
              onClick={() => {
                setSearchDistrict('');
                fetchRates(selectedCrop, '');
              }}
              className="bg-[#F6F4EC] text-[#7A8A6A] text-sm px-4 py-2.5 rounded-xl hover:bg-[#EFE7D8] transition shrink-0"
            >
              Clear
            </button>
          )}
        </form>

        {/* Crop Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CROP_TABS.map((tab) => {
            const active = selectedCrop === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCrop(tab.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                  active
                    ? 'bg-[#22301A] text-white'
                    : 'bg-[#F6F4EC] text-[#5B6A4A] hover:bg-[#EFE7D8] hover:text-[#22301A]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12 text-sm text-[#7A8A6A]">
          Loading APMC market data...
        </div>
      )}

      {/* Empty state */}
      {!loading && data.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center text-[#7A8A6A] shadow-sm">
          <Store size={32} className="mx-auto text-[#C8C2AE] mb-3" />
          <p className="font-medium text-[#22301A]">No mandi records found</p>
          <p className="text-xs text-[#A8A391] mt-1">Try clearing the district search or choosing another crop.</p>
        </div>
      )}

      {/* Commodity List */}
      {!loading && data.length > 0 && (
        <div className="space-y-5">
          {data.map((item) => {
            const mspDiff = item.msp ? item.modal_price - item.msp : null;
            const isAboveMsp = mspDiff !== null && mspDiff >= 0;
            const isSpeakingThis = speakingId === item.crop;

            return (
              <div
                key={item.crop}
                className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] border border-[#F0EEE4] hover:border-[#DCE8C8] transition"
              >
                {/* Card Top: Title, Badges, Audio */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EEE4]">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-serif text-xl font-medium text-[#22301A]">{item.crop_name}</h3>
                      <span className="text-[11px] bg-[#F6F4EC] text-[#7A8A6A] font-medium px-2.5 py-0.5 rounded-full">
                        {item.variety}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Audio Read-out button */}
                    <button
                      onClick={() => handleSpeak(item)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition ${
                        isSpeakingThis
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-[#F6F4EC] text-[#5B7A3A] hover:bg-[#DCE8C8]'
                      }`}
                      title="Audio: Bhaav Suniye"
                    >
                      {isSpeakingThis ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      <span>{isSpeakingThis ? 'Rukiye' : 'Bhaav Suniye 🔊'}</span>
                    </button>

                    {/* MSP Comparison Badge */}
                    {item.msp ? (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          isAboveMsp
                            ? 'bg-[#EAF1DC] text-[#4A6830]'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {isAboveMsp ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        {isAboveMsp ? `Above MSP (+₹${mspDiff})` : `Below MSP (-₹${Math.abs(mspDiff)})`}
                      </span>
                    ) : (
                      <span className="text-xs bg-[#F6F4EC] text-[#7A8A6A] font-medium px-2.5 py-1 rounded-full">
                        Market Driven
                      </span>
                    )}
                  </div>
                </div>

                {/* Price Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
                  <div className="bg-[#F6F4EC] rounded-xl p-3 text-center">
                    <div className="text-[11px] text-[#7A8A6A] font-semibold uppercase">Modal Price</div>
                    <div className="text-2xl font-serif font-semibold text-[#22301A] mt-0.5">
                      ₹{item.modal_price.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-[#A8A391]">{item.unit}</div>
                  </div>

                  <div className="bg-[#F6F4EC] rounded-xl p-3 text-center">
                    <div className="text-[11px] text-[#7A8A6A] font-semibold uppercase">Min – Max Range</div>
                    <div className="text-sm font-semibold text-[#22301A] mt-1.5">
                      ₹{item.min_price} – ₹{item.max_price}
                    </div>
                    <div className="text-[10px] text-[#A8A391]">Daily spread</div>
                  </div>

                  <div className="bg-[#F6F4EC] rounded-xl p-3 text-center">
                    <div className="text-[11px] text-[#7A8A6A] font-semibold uppercase">Govt. MSP</div>
                    <div className="text-sm font-semibold text-[#22301A] mt-1.5">
                      {item.msp ? `₹${item.msp.toLocaleString('en-IN')}` : 'No MSP'}
                    </div>
                    <div className="text-[10px] text-[#A8A391]">{item.msp ? 'Official floor price' : 'Open auction'}</div>
                  </div>

                  <div className="bg-[#F6F4EC] rounded-xl p-3 text-center">
                    <div className="text-[11px] text-[#7A8A6A] font-semibold uppercase">7-Day Trend</div>
                    <div
                      className={`text-sm font-semibold flex items-center justify-center gap-1 mt-1.5 ${
                        item.trend === 'up'
                          ? 'text-emerald-700'
                          : item.trend === 'down'
                          ? 'text-red-600'
                          : 'text-[#5B6A4A]'
                      }`}
                    >
                      {item.trend === 'up' && <TrendingUp size={15} />}
                      {item.trend === 'down' && <TrendingDown size={15} />}
                      {item.change_7d > 0 ? `+${item.change_7d}%` : `${item.change_7d}%`}
                    </div>
                    <div className="text-[10px] text-[#A8A391]">Weekly momentum</div>
                  </div>
                </div>

                {/* Expert Recommendation Pill */}
                <div className="bg-[#FDF9EE] border border-[#F2E8CE] rounded-xl p-3 flex items-start gap-2.5 mb-4">
                  <span className="text-base mt-0.5">💡</span>
                  <div>
                    <span className="text-xs font-bold text-[#8A6A2A] uppercase tracking-wide mr-1.5">
                      Market Strategy:
                    </span>
                    <span className="text-xs text-[#5A4A2A] font-medium leading-relaxed">
                      {item.recommendation}
                    </span>
                  </div>
                </div>

                {/* Top Mandis Section */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-[#7A8A6A] tracking-wide mb-2.5">
                    <Award size={14} className="text-[#5B7A3A]" />
                    <span>Top Paying APMC Markets for {item.crop_name.split(' ')[0]}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {item.top_mandis?.map((mandi, idx) => (
                      <div
                        key={mandi.market}
                        className={`rounded-xl p-3 border transition ${
                          idx === 0
                            ? 'bg-[#F2F7E9] border-[#C8DEAB]'
                            : 'bg-white border-[#F0EEE4]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-[#22301A] truncate">{mandi.market}</span>
                          {idx === 0 && (
                            <span className="text-[9px] bg-[#5B7A3A] text-white px-1.5 py-0.5 rounded-md font-semibold shrink-0">
                              Top Rate
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#7A8A6A] mb-1">{mandi.district} District</div>
                        <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-[#F0EEE4]">
                          <span className="font-serif font-bold text-base text-[#22301A]">
                            ₹{mandi.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-[#A8A391]">{mandi.arrival_tonnes}T arrival</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Advisory Footer */}
      <div className="mt-8 bg-[#F6F4EC] rounded-2xl p-5 text-xs text-[#7A8A6A] text-center leading-relaxed">
        <strong>Farmer Pro Tip:</strong> Always check moisture levels before bringing your produce to the mandi. Commodities with optimal moisture (below 10-12% for soybean &amp; wheat) fetch ₹150–₹250 higher per quintal at auction.
      </div>
    </div>
  );
}
