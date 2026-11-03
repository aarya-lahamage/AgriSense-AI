import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScanLine, Upload, AlertTriangle, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import LaserScannerOverlay from '../components/LaserScannerOverlay';
import AnimatedCounter from '../components/AnimatedCounter';
import ShinyText from '../components/ShinyText';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function SoilCardOCR() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(selected);
  };

  const handleUpload = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/ocr/soil-card`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'OCR processing failed');
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Could not process Soil Health Card.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferToAdvisor = () => {
    if (!result) return;
    navigate('/crop-recommendation', {
      state: {
        N: result.N,
        P: result.P,
        K: result.K,
        ph: result.pH,
      },
    });
  };

  // Use structured parameters array if available, otherwise fall back to flat keys
  const parametersList = result?.parameters || null;
  const hasAnyValue = parametersList
    ? parametersList.some((p) => p.value !== null && p.value !== undefined)
    : result && (result.N !== null || result.P !== null || result.K !== null || result.pH !== null);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-12 agri-animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C150A] via-[#142311] to-[#1E3319] text-white p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#38BDF8]/20 text-[#7DD3FC] border border-[#38BDF8]/30 mb-2">
            <ScanLine size={13} />
            <ShinyText text="Computer Vision OCR Scanner" speed={4} className="text-[11px] font-semibold" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FDFAF2]">
            Soil Health Card OCR Scanner
          </h2>
          <p className="text-xs sm:text-sm text-[#A3B39C] mt-1">
            Upload your official Soil Health Card to automatically extract pH, EC, Organic Carbon, N, P, K, Sulphur,
            Zinc, Boron, Iron, Manganese and Copper without manual typing.
          </p>
        </div>
      </div>

      <div className="agri-glass-card p-6 sm:p-7 space-y-6">
        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-semibold text-[#8E9B85] uppercase tracking-wider mb-2">
            Upload Soil Health Card Image / Document
          </label>
          <div className="border-2 border-dashed border-[#84CC16]/30 hover:border-[#84CC16]/60 bg-[#0B1309]/80 rounded-2xl p-6 text-center transition cursor-pointer relative">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={loading}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
            />
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 flex items-center justify-center mx-auto shadow-xs">
                <Upload size={22} />
              </div>
              <div className="text-sm font-semibold text-[#FDFAF2]">
                {file ? file.name : 'Click or drop Soil Health Card image here'}
              </div>
              <p className="text-xs text-[#8E9B85]">Supports JPG, PNG, WEBP, or scanned lab reports</p>
            </div>
          </div>
        </div>

        {/* Image Preview */}
        {preview && (
          <div className="relative border border-white/10 rounded-2xl p-3 bg-[#0B1309]/90">
            <div className="text-xs font-semibold text-[#8E9B85] mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Document Preview
            </div>
            <div className="relative max-h-64 flex items-center justify-center rounded-xl overflow-hidden">
              <img src={preview} alt="Soil Card Preview" className="max-h-64 rounded-xl object-contain mx-auto shadow-md border border-white/10" />
              {loading && (
                <LaserScannerOverlay
                  title="SOIL CARD OCR MATRIX"
                  subtitle="Extracting chemical parameters..."
                  laserColor="amber"
                />
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full agri-btn-primary py-3.5 rounded-2xl text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Scanning Text via OCR Engine...</span>
            </>
          ) : (
            <>
              <ScanLine size={16} />
              <span>Extract Chemical Parameters</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Extracted Parameters Card */}
        {result && (
          <div className="space-y-4 pt-4 border-t border-white/10 agri-animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#BEF264]">
                <CheckCircle2 size={16} className="text-[#84CC16]" />
                <span>Extracted Soil Chemistry Values</span>
              </div>
              {!hasAnyValue && (
                <div className="flex items-center gap-1 text-[10px] text-amber-400">
                  <Info size={12} />
                  <span>No values detected — try a clearer image</span>
                </div>
              )}
            </div>

            {/* Structured Parameters Table */}
            {parametersList ? (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#8E9B85]">Parameter</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#8E9B85]">Value</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#8E9B85]">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parametersList.map((p, idx) => (
                      <tr
                        key={p.key}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                      >
                        <td className="px-4 py-2.5 font-semibold text-[#FDFAF2]">{p.name}</td>
                        <td className="px-4 py-2.5 text-right font-serif font-bold text-[#FDFAF2]">
                          {p.value !== null && p.value !== undefined ? (
                            <AnimatedCounter value={p.value} decimals={p.value % 1 !== 0 ? 2 : 0} duration={800} />
                          ) : (
                            <span className="text-[#8E9B85] font-sans text-[10px]">Not detected</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-[#8E9B85]">{p.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Fallback: legacy 4-card grid for old response format */
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Nitrogen (N)', val: result.N, unit: 'kg/ha', decimals: 0 },
                  { label: 'Phosphorus (P)', val: result.P, unit: 'kg/ha', decimals: 0 },
                  { label: 'Potassium (K)', val: result.K, unit: 'kg/ha', decimals: 0 },
                  { label: 'pH Reading', val: result.pH, unit: 'pH', decimals: 1 },
                ].map((p) => (
                  <div key={p.label} className="bg-[#0B1309]/80 p-3.5 rounded-2xl border border-white/10 hover:border-lime-500/30 transition-colors">
                    <div className="text-[10px] text-[#8E9B85] uppercase font-semibold">{p.label}</div>
                    <div className="text-xl font-serif font-bold text-[#FDFAF2] mt-1">
                      {p.val !== null && p.val !== undefined ? (
                        <AnimatedCounter value={p.val} decimals={p.decimals} duration={1000} />
                      ) : (
                        <span className="text-[#8E9B85] text-sm">Not found</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#8E9B85] mt-0.5">{p.unit}</div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleTransferToAdvisor}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#142311] hover:bg-[#1E3319] active:scale-[0.99] text-[#BEF264] border border-[#84CC16]/40 font-semibold text-xs py-3.5 rounded-2xl transition shadow-sm cursor-pointer"
            >
              <span>Auto-Fill into Crop Advisor &amp; Recommend Crops</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
