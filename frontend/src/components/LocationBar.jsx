import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import { useFarmLocation } from '../context/LocationContext';
import SpotlightCard from './SpotlightCard';

export default function LocationBar() {
  const {
    savedLocation,
    fetchGps,
    loadingLocation,
    resolving,
    error,
    openLocationModal,
  } = useFarmLocation();

  // If no location saved yet, show a prominent setup banner
  if (!savedLocation) {
    return (
      <SpotlightCard
        spotlightColor="rgba(132, 204, 22, 0.2)"
        borderColor="rgba(132, 204, 22, 0.4)"
        className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#84CC16]/40 bg-[#0C150A]/95 p-4 sm:flex-row sm:items-center sm:justify-between shadow-xl"
        aria-label="Set farm location"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#84CC16]/20 border border-[#84CC16]/40 flex items-center justify-center shrink-0 text-[#BEF264] shadow-[0_0_15px_rgba(132,204,22,0.3)]">
            <MapPin size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-[#FDFAF2] flex items-center gap-2">
              <span>Set Your Farm Location</span>
              <span className="text-[10px] font-semibold bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 px-2 py-0.5 rounded-full">
                Required for Live Weather & Soil
              </span>
            </div>
            <p className="text-xs text-[#A3B39C] mt-0.5">
              Auto-fetch hyper-local Open-Meteo weather radar, agro-spray safety windows, and district soil telemetry.
            </p>
            {error && <p role="alert" className="mt-1 text-xs text-red-400">{error}</p>}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fetchGps()}
            disabled={loadingLocation || resolving}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl agri-btn-primary px-4 py-2.5 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shadow-md"
          >
            <Navigation size={14} className={loadingLocation ? 'animate-spin' : ''} />
            {loadingLocation ? 'Detecting GPS…' : 'Use Current GPS'}
          </button>
          <button
            type="button"
            onClick={openLocationModal}
            disabled={loadingLocation || resolving}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-[#FDFAF2] transition hover:bg-white/20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MapPin size={14} /> Search City / Village
          </button>
        </div>
      </SpotlightCard>
    );
  }

  return (
    <SpotlightCard
      spotlightColor="rgba(132, 204, 22, 0.14)"
      borderColor="rgba(132, 204, 22, 0.35)"
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0B1309]/80 backdrop-blur-md p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-lg"
      aria-label="Shared farm location"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#84CC16]/20 border border-[#84CC16]/30 flex items-center justify-center shrink-0 text-[#BEF264] mt-0.5">
          <MapPin size={16} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#8E9B85]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84CC16] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#84CC16]"></span>
            </span>
            <span>Current Farm Location</span>
            {savedLocation.lat && savedLocation.lon && (
              <span className="font-mono text-[#84CC16]/70 hidden md:inline">
                ({Number(savedLocation.lat).toFixed(4)}°N, {Number(savedLocation.lon).toFixed(4)}°E)
              </span>
            )}
          </div>
          <div className="mt-0.5 break-words text-sm font-bold text-[#FDFAF2]">
            {savedLocation.name || 'Selected location'}
            {savedLocation.district && savedLocation.district !== savedLocation.name && (
              <span className="text-xs font-normal text-[#8E9B85] ml-1.5">({savedLocation.district})</span>
            )}
          </div>
          {error && <p role="alert" className="mt-1 text-xs text-red-400">{error}</p>}
          {resolving && <p className="mt-1 text-xs text-[#BEF264]">Updating telemetry for this location…</p>}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fetchGps()}
          disabled={loadingLocation || resolving}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl agri-btn-primary px-3.5 py-2 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Navigation size={13} className={loadingLocation ? 'animate-spin' : ''} />
          {loadingLocation ? 'Detecting GPS…' : 'Fetch GPS'}
        </button>
        <button
          type="button"
          onClick={openLocationModal}
          disabled={loadingLocation || resolving}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-[#FDFAF2] transition hover:bg-white/20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={13} /> Change
        </button>
      </div>
    </SpotlightCard>
  );
}
