import { Link } from 'react-router-dom';
import { Sun, ScanLine, CloudSun, FlaskConical, Sprout, ArrowRight } from 'lucide-react';

function Dashboard() {
  const modules = [
    { icon: ScanLine, label: 'Disease Scan', path: '/disease-detection' },
    { icon: CloudSun, label: 'Weather', path: '/weather-advisory' },
    { icon: FlaskConical, label: 'Fertilizer', path: '/fertilizer-treatment' },
  ];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#DCE8C8] flex items-center justify-center">
          <Sun size={20} strokeWidth={1.8} className="text-[#5B7A3A]" />
        </div>
        <div>
          <div className="font-serif text-[19px] text-[#2E3B22] font-medium">Good morning, Farmer</div>
          <div className="text-xs text-[#7A8A6A]">Maharashtra</div>
        </div>
      </div>

      <Link
        to="/crop-recommendation"
        className="block bg-white rounded-3xl p-8 mb-4 text-center hover:shadow-sm transition"
      >
        <div className="w-12 h-12 rounded-full bg-[#DCE8C8] flex items-center justify-center mx-auto mb-3">
          <Sprout size={22} strokeWidth={1.8} className="text-[#5B7A3A]" />
        </div>
        <div className="font-serif text-lg text-[#2E3B22] font-medium">
          Ready to plan your next crop?
        </div>
        <div className="text-xs text-[#7A8A6A] mt-1 mb-5">Takes about a minute</div>
        <span className="inline-flex items-center gap-1.5 bg-[#5B7A3A] text-white text-sm px-6 py-2.5 rounded-full">
          Start now <ArrowRight size={14} />
        </span>
      </Link>

      <div className="text-xs text-[#7A8A6A] mb-3 uppercase tracking-wide">Explore modules</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {modules.map((m) => (
          <Link
            key={m.label}
            to={m.path}
            className="bg-[#EFE7D8] rounded-2xl p-4 text-center hover:bg-[#E5DCC8] transition"
          >
            <m.icon size={20} strokeWidth={1.8} className="text-[#8A7A5C] mx-auto" />
            <div className="text-xs text-[#2E3B22] mt-2">{m.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;