import { Activity } from 'lucide-react';

/**
 * LaserScannerOverlay:
 * Futuristic HUD vision scanner overlay for Disease Detection and Soil Card OCR.
 * Displays cybernetic corner reticles, laser sweeping beam, scanline texture,
 * and real-time vision telemetry status.
 */
export default function LaserScannerOverlay({
  title = 'AI SPECTRAL SCANNER ACTIVE',
  subtitle = 'Analyzing leaf pathology & cellular contours...',
  laserColor = 'lime', // 'lime' or 'amber' or 'emerald'
}) {
  const colorMap = {
    lime: {
      beam: 'bg-gradient-to-b from-transparent via-lime-400 to-transparent shadow-[0_0_20px_rgba(132,204,22,0.8)]',
      border: 'border-lime-400',
      text: 'text-lime-300',
      badge: 'bg-lime-950/80 border-lime-500/50 text-lime-400',
      dot: 'bg-lime-400 shadow-[0_0_8px_#a3e635]',
    },
    amber: {
      beam: 'bg-gradient-to-b from-transparent via-amber-400 to-transparent shadow-[0_0_20px_rgba(251,191,36,0.8)]',
      border: 'border-amber-400',
      text: 'text-amber-300',
      badge: 'bg-amber-950/80 border-amber-500/50 text-amber-400',
      dot: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    },
    emerald: {
      beam: 'bg-gradient-to-b from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(52,211,153,0.8)]',
      border: 'border-emerald-400',
      text: 'text-emerald-300',
      badge: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400',
      dot: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    },
  };

  const scheme = colorMap[laserColor] || colorMap.lime;

  return (
    <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none rounded-xl backdrop-blur-[2px] bg-black/40 flex flex-col justify-between p-4">
      {/* Corner Reticles */}
      <div className={`absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 ${scheme.border} transition-all duration-300`} />
      <div className={`absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 ${scheme.border} transition-all duration-300`} />
      <div className={`absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 ${scheme.border} transition-all duration-300`} />
      <div className={`absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 ${scheme.border} transition-all duration-300`} />

      {/* Cybernetic Scanlines grid effect */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Sweeping Laser Line */}
      <div
        className={`laser-scanner-beam absolute left-0 right-0 h-1 ${scheme.beam}`}
        style={{
          boxShadow: '0 0 15px currentColor, 0 0 30px currentColor',
        }}
      />

      {/* Top HUD Telemetry Indicator */}
      <div className="flex items-center justify-between z-10">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-medium backdrop-blur-md ${scheme.badge}`}>
          <span className={`w-2 h-2 rounded-full animate-ping ${scheme.dot}`} />
          <span>{title}</span>
        </div>
        <div className="text-[10px] font-mono tracking-widest text-emerald-400/80 uppercase">
          RES: 1080P // SENS: 99.4%
        </div>
      </div>

      {/* Bottom Scanning Details */}
      <div className="z-10 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 animate-spin ${scheme.text}`} style={{ animationDuration: '3s' }} />
          <span className="text-zinc-200 text-xs">{subtitle}</span>
        </div>
        <span className="text-zinc-500 text-[10px] hidden sm:inline">CONVNET v4.2</span>
      </div>
    </div>
  );
}
