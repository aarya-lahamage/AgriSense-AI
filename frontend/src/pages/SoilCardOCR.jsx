import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScanLine, Upload, AlertTriangle, Sprout, ArrowRight } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

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
    if (!file) return;
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
        throw new Error(data.detail || 'OCR failed');
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const paramLabel = { N: 'Nitrogen (N)', P: 'Phosphorus (P)', K: 'Potassium (K)', pH: 'pH' };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-full bg-[#DCE8C8] flex items-center justify-center">
          <ScanLine size={17} strokeWidth={2} className="text-[#5B7A3A]" />
        </div>
        <h2 className="font-serif text-[26px] font-medium text-[#22301A]">Soil Card OCR</h2>
      </div>
      <p className="text-[#7A8A6A] text-sm mb-7">
        Upload a photo of your Soil Health Card to extract N, P, K, and pH values automatically.
      </p>

      {/* Upload area */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] mb-5">
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-[#D8D2BE] rounded-xl p-8 text-center hover:border-[#5B7A3A] transition">
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-56 mx-auto rounded-lg mb-3 object-contain" />
            ) : (
              <>
                <Upload size={28} strokeWidth={1.5} className="text-[#A8A391] mx-auto mb-3" />
                <p className="text-sm text-[#22301A] font-medium">Click to upload soil card image</p>
                <p className="text-xs text-[#A8A391] mt-1">PNG, JPG, or JPEG</p>
              </>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {file && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full mt-4 bg-[#5B7A3A] text-white text-sm font-medium py-3 rounded-xl hover:bg-[#4A6830] transition disabled:opacity-50"
          >
            {loading ? 'Extracting...' : 'Extract Soil Data'}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 rounded-2xl p-5 mb-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 font-medium">OCR Error</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] mb-5">
          <h3 className="text-[13px] font-semibold text-[#22301A] uppercase tracking-wide mb-4">
            Extracted Values
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {['N', 'P', 'K', 'pH'].map((key) => (
              <div key={key} className="bg-[#F6F4EC] rounded-xl p-4 text-center">
                <div className="text-[11px] text-[#7A8A6A] mb-1">{paramLabel[key]}</div>
                <div className="text-xl font-serif font-medium text-[#22301A]">
                  {result[key] !== null && result[key] !== undefined ? result[key] : '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action Bridge to Crop Advisor */}
          <button
            type="button"
            onClick={() =>
              navigate('/crop-recommendation', {
                state: {
                  N: result.N,
                  P: result.P,
                  K: result.K,
                  ph: result.pH,
                },
              })
            }
            className="w-full flex items-center justify-center gap-2 bg-[#5B7A3A] text-white text-sm font-medium py-3 rounded-xl hover:bg-[#4A6830] transition shadow-sm mb-4"
          >
            <Sprout size={17} />
            <span>Use in Crop Advisor</span>
            <ArrowRight size={15} />
          </button>

          {/* Raw text */}
          <details className="group">
            <summary className="text-xs text-[#5B7A3A] cursor-pointer hover:underline">
              Show raw OCR text
            </summary>
            <pre className="mt-3 bg-[#F6F4EC] rounded-xl p-4 text-xs text-[#22301A] whitespace-pre-wrap max-h-48 overflow-y-auto">
              {result.raw_text || 'No text extracted'}
            </pre>
          </details>
        </div>
      )}

      <p className="text-[11px] text-[#A8A391] text-center">
        Requires Tesseract OCR on the server. Accuracy depends on card image quality.
      </p>
    </div>
  );
}
