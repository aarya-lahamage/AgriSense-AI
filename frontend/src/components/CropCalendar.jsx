import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000';

function CropCalendar({ crop }) {
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!crop) {
      setCalendar(null);
      return;
    }
    let isMounted = true;
    setLoading(true);
    fetch(`${API_BASE}/crop-calendar/${encodeURIComponent(crop)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setCalendar(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [crop]);

  if (!crop || loading) return null;
  if (!calendar) return null;

  return (
    <div className="mt-5 bg-[#FBF3E3] rounded-xl p-5 border border-[#F0EEE4]">
      <h4 className="text-[12px] font-semibold text-[#22301A] uppercase tracking-wide mb-4">
        {crop} - Seasonal Calendar
      </h4>
      <div className="flex flex-col sm:flex-row justify-between gap-4 relative">
        {/* Connection line for larger screens */}
        <div className="hidden sm:block absolute top-4 left-6 right-6 h-[2px] bg-[#EFE7D8] z-0"></div>
        
        {/* Step 1: Sowing */}
        <div className="relative z-10 flex flex-col items-start sm:items-center flex-1">
          <div className="w-8 h-8 rounded-full bg-[#5B7A3A] text-white flex items-center justify-center text-xs font-bold shadow-sm mb-2">1</div>
          <div className="text-[11px] uppercase text-[#7A8A6A] font-semibold">Sowing</div>
          <div className="text-sm font-medium text-[#22301A] sm:text-center mt-0.5">{calendar.sowing}</div>
        </div>

        {/* Step 2: Fertilizer */}
        <div className="relative z-10 flex flex-col items-start sm:items-center flex-1">
          <div className="w-8 h-8 rounded-full bg-[#5B7A3A] text-white flex items-center justify-center text-xs font-bold shadow-sm mb-2">2</div>
          <div className="text-[11px] uppercase text-[#7A8A6A] font-semibold">Fertilizer</div>
          <div className="text-sm font-medium text-[#22301A] sm:text-center mt-0.5">{calendar.fertilizer}</div>
        </div>

        {/* Step 3: Harvest */}
        <div className="relative z-10 flex flex-col items-start sm:items-center flex-1">
          <div className="w-8 h-8 rounded-full bg-[#5B7A3A] text-white flex items-center justify-center text-xs font-bold shadow-sm mb-2">3</div>
          <div className="text-[11px] uppercase text-[#7A8A6A] font-semibold">Harvest</div>
          <div className="text-sm font-medium text-[#22301A] sm:text-center mt-0.5">{calendar.harvest}</div>
        </div>
      </div>
    </div>
  );
}

export default CropCalendar;
