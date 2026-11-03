import React, { useState, useEffect } from 'react';
import SpotlightCard from './SpotlightCard';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function CropCalendar({ crop }) {
  const [calendar, setCalendar] = useState(null);

  useEffect(() => {
    if (!crop) return;
    let isMounted = true;
    fetch(`${API_BASE}/crop-calendar/${encodeURIComponent(crop)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setCalendar(data);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [crop]);

  if (!crop || !calendar) return null;

  return (
    <SpotlightCard
      spotlightColor="rgba(132, 204, 22, 0.16)"
      borderColor="rgba(132, 204, 22, 0.35)"
      className="mt-5 bg-[#0B1309]/80 rounded-2xl p-5 border border-white/10"
    >
      <h4 className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider mb-4">
        {crop} - Seasonal Growth Calendar
      </h4>
      <div className="flex flex-col sm:flex-row justify-between gap-4 relative">
        {/* Connection line for larger screens */}
        <div className="hidden sm:block absolute top-4 left-6 right-6 h-[2px] bg-white/10 z-0"></div>
        
        {/* Step 1: Sowing */}
        <div className="relative z-10 flex flex-col items-start sm:items-center flex-1">
          <div className="w-8 h-8 rounded-full bg-[#142311] text-[#BEF264] border border-[#84CC16]/40 flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(132,204,22,0.3)] mb-2">1</div>
          <div className="text-[10px] uppercase text-[#8E9B85] font-semibold tracking-wider">Sowing Window</div>
          <div className="text-sm font-medium text-[#FDFAF2] sm:text-center mt-0.5">{calendar.sowing}</div>
        </div>

        {/* Step 2: Fertilizer */}
        <div className="relative z-10 flex flex-col items-start sm:items-center flex-1">
          <div className="w-8 h-8 rounded-full bg-[#142311] text-[#BEF264] border border-[#84CC16]/40 flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(132,204,22,0.3)] mb-2">2</div>
          <div className="text-[10px] uppercase text-[#8E9B85] font-semibold tracking-wider">Nutrient Application</div>
          <div className="text-sm font-medium text-[#FDFAF2] sm:text-center mt-0.5">{calendar.fertilizer}</div>
        </div>

        {/* Step 3: Harvest */}
        <div className="relative z-10 flex flex-col items-start sm:items-center flex-1">
          <div className="w-8 h-8 rounded-full bg-[#142311] text-[#BEF264] border border-[#84CC16]/40 flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(132,204,22,0.3)] mb-2">3</div>
          <div className="text-[10px] uppercase text-[#8E9B85] font-semibold tracking-wider">Harvest Window</div>
          <div className="text-sm font-medium text-[#FDFAF2] sm:text-center mt-0.5">{calendar.harvest}</div>
        </div>
      </div>
    </SpotlightCard>
  );
}

export default CropCalendar;
