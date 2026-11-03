import { Compass, CloudRain } from 'lucide-react';

/**
 * RadarWidget:
 * Atmospheric Doppler & Microclimate radar sweep display.
 * Features rotating scan beam, concentric distance rings, crosshairs,
 * and radar blips for sensor stations and precipitation fronts.
 */
export default function RadarWidget({
  title = 'Atmospheric Doppler Radar',
  subtitle = 'Radius 25km • Live Sweep',
  compact = false,
  className = '',
}) {
  return (
    <div className={`relative flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0B1209]/80 border border-emerald-900/40 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <h4 className="text-xs font-semibold text-zinc-200 tracking-wide uppercase">{title}</h4>
        </div>
        <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
          {subtitle}
        </span>
      </div>

      {/* Radar Scope */}
      <div className={`relative ${compact ? 'w-48 h-48' : 'w-56 h-56 sm:w-64 sm:h-64'} flex items-center justify-center rounded-full bg-emerald-950/20 border border-emerald-500/20 shadow-[inset_0_0_30px_rgba(16,185,129,0.08)]`}>
        {/* Concentric rings */}
        <div className="absolute w-3/4 h-3/4 rounded-full border border-emerald-500/15" />
        <div className="absolute w-1/2 h-1/2 rounded-full border border-emerald-500/20" />
        <div className="absolute w-1/4 h-1/4 rounded-full border border-dashed border-emerald-500/30" />

        {/* Crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-px bg-emerald-500/15" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-full w-px bg-emerald-500/15" />
        </div>

        {/* Cardinal Directions */}
        <span className="absolute top-1 text-[9px] font-mono text-emerald-400/60 font-bold">N</span>
        <span className="absolute bottom-1 text-[9px] font-mono text-emerald-400/60 font-bold">S</span>
        <span className="absolute left-1 text-[9px] font-mono text-emerald-400/60 font-bold">W</span>
        <span className="absolute right-1 text-[9px] font-mono text-emerald-400/60 font-bold">E</span>

        {/* Rotating Radar Sweep Cone */}
        <div className="absolute inset-0 radar-sweep-beam pointer-events-none rounded-full overflow-hidden">
          <div
            className="w-1/2 h-1/2 origin-bottom-right"
            style={{
              background: 'conic-gradient(from 0deg, rgba(132, 204, 22, 0.45) 0deg, rgba(52, 211, 153, 0.15) 30deg, transparent 60deg)',
            }}
          />
          {/* Leading beam line */}
          <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-lime-400 to-transparent -translate-y-1/2 origin-left shadow-[0_0_8px_#a3e635]" />
        </div>

        {/* Radar Blip 1: Approaching Cloud / Shower */}
        <div className="absolute top-[28%] right-[26%] flex items-center gap-1 group cursor-pointer z-10">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <span className="hidden group-hover:inline-block absolute left-4 -top-1 bg-black/90 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded border border-cyan-500/40 whitespace-nowrap">
            Rain Cloud (NW 8km)
          </span>
        </div>

        {/* Radar Blip 2: Field Sensor Node A */}
        <div className="absolute bottom-[32%] left-[28%] flex items-center gap-1 group cursor-pointer z-10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-400"></span>
          </span>
          <span className="hidden group-hover:inline-block absolute left-3.5 -top-1 bg-black/90 text-lime-300 text-[10px] px-1.5 py-0.5 rounded border border-lime-500/40 whitespace-nowrap">
            Sensor Node #1 (Nominal)
          </span>
        </div>

        {/* Center Target Indicator */}
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] z-10" />
      </div>

      {/* Telemetry Footer */}
      <div className="w-full flex items-center justify-between mt-3 text-[10px] font-mono text-zinc-400 z-10 border-t border-emerald-950/80 pt-2">
        <span className="flex items-center gap-1">
          <Compass className="w-3 h-3 text-emerald-400" />
          <span>AZ: 312° NNE</span>
        </span>
        <span className="flex items-center gap-1">
          <CloudRain className="w-3 h-3 text-cyan-400" />
          <span>PRECIP: 12% PROB</span>
        </span>
      </div>
    </div>
  );
}
