import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { speakText, stopSpeech } from "../utils/speech";
import { Volume2, VolumeX, ShieldAlert, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";
import LaserScannerOverlay from "../components/LaserScannerOverlay";
import AnimatedCounter from "../components/AnimatedCounter";
import SpotlightCard from "../components/SpotlightCard";
import ShinyText from "../components/ShinyText";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const CROPS = [
  { value: "general", label: "General / Auto Detect" },
  { value: "tomato", label: "Tomato (टोमॅटो)" },
  { value: "cotton", label: "Cotton (कापूस)" },
  { value: "soybean", label: "Soybean (सोयाबीन)" },
  { value: "wheat", label: "Wheat (गहू)" },
  { value: "rice", label: "Rice / Paddy (भात / धान)" },
  { value: "onion", label: "Onion (कांदा)" },
  { value: "grapes", label: "Grapes (द्राक्षे)" },
  { value: "sugarcane", label: "Sugarcane (ऊस)" },
];

function DiseaseDetection() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [crop, setCrop] = useState("general");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
    setError("");
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(selected ? URL.createObjectURL(selected) : "");
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a leaf image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    if (crop) {
      form.append("crop", crop);
    }

    try {
      const res = await fetch(`${API_BASE}/predict/disease?crop=${encodeURIComponent(crop)}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Prediction failed.");
      }

      setResult(data);
    } catch (e) {
      setError(e.message || "Could not connect to Disease Detection service.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeech = () => {
    if (speaking) {
      stopSpeech();
      setSpeaking(false);
      return;
    }

    if (!result) return;

    let text = "";
    if (result.is_healthy) {
      text = `Plant health check complete. ${result.crop} leaf is healthy with no visible pathology. ${result.symptoms} Preventive recommendation: ${result.organic_treatment}`;
    } else {
      text = `Disease detected: ${result.disease_name}. Hindi name: ${result.disease_name_hindi || ""}. Severity: ${result.severity}. Symptoms: ${result.symptoms}. Chemical remedy: ${result.chemical_treatment}. Organic remedy: ${result.organic_treatment}.`;
    }

    setSpeaking(true);
    speakText(text, () => setSpeaking(false));
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12 agri-animate-fade-in">
      {/* Cinematic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C150A] via-[#142311] to-[#1E3319] text-white p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 mb-2">
              <Sparkles size={13} />
              <ShinyText text="Deep Learning Vision Diagnostic" speed={4} className="text-[11px] font-semibold" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FDFAF2]">
              Plant Disease Diagnostic Scan
            </h2>
            <p className="text-xs sm:text-sm text-[#A3B39C] mt-1">
              Upload a clear photo of an infected or healthy crop leaf to analyze pathology, estimate severity, and get verified chemical &amp; organic treatments.
            </p>
          </div>
        </div>
      </div>

      <div className="agri-glass-card p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#8E9B85] uppercase tracking-wider mb-1.5">
              Select Crop Type
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full bg-[#10190D] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#FDFAF2] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
            >
              {CROPS.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#10190D] text-[#FDFAF2]">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8E9B85] uppercase tracking-wider mb-1.5">
              Leaf Photo
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleFileChange}
              className="w-full text-xs text-[#A8B5A0] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#84CC16]/20 file:text-[#BEF264] hover:file:bg-[#84CC16]/30 file:border file:border-[#84CC16]/30 cursor-pointer"
            />
          </div>
        </div>

        {preview && (
          <div className="relative border border-white/15 rounded-2xl p-4 bg-[#0B1309]/80 flex flex-col items-center">
            <p className="text-xs font-medium text-[#8E9B85] mb-2 self-start flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#84CC16] animate-ping" />
              Selected Image Preview
            </p>
            <div className="relative max-h-72 w-full flex items-center justify-center rounded-xl overflow-hidden">
              <img
                src={preview}
                alt="Leaf to analyze"
                className="max-h-72 object-contain rounded-xl shadow-lg border border-white/10"
              />
              {loading && (
                <LaserScannerOverlay
                  title="SPECTRAL LEAF ANALYSIS"
                  subtitle="Diagnosing cellular anomalies & foliar pathogens..."
                  laserColor="lime"
                />
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className="w-full sm:w-auto agri-btn-primary px-7 py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing Leaf Pathology...</span>
              </>
            ) : (
              <span>Run Disease Diagnostic</span>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-6 border border-white/10 rounded-2xl overflow-hidden shadow-xl agri-animate-fade-in">
            {/* Header banner */}
            <div
              className={`p-5 flex items-start justify-between ${
                result.is_healthy
                  ? "bg-gradient-to-r from-[#0F2913] to-[#16381C] border-b border-[#22C55E]/40"
                  : "bg-gradient-to-r from-[#2B1B0A] to-[#3B240E] border-b border-[#F59E0B]/40"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.is_healthy ? (
                  <CheckCircle className="text-[#4ADE80] shrink-0 mt-1" size={24} />
                ) : (
                  <ShieldAlert className="text-[#F59E0B] shrink-0 mt-1" size={24} />
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-[#FDFAF2]">
                      {result.disease_name}
                    </h3>
                    {result.disease_name_hindi && (
                      <span className="text-sm bg-black/40 px-2.5 py-0.5 rounded-full font-medium text-[#BEF264] border border-white/10">
                        {result.disease_name_hindi}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#D1DAC9] mt-1">
                    Crop: <span className="font-semibold text-white">{result.crop}</span> | Pathogen: <span className="font-semibold text-white">{result.pathogen_type}</span> | Severity: <span className="font-semibold text-white">{result.severity}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-2xl font-bold text-[#84CC16]">
                  <AnimatedCounter value={result.confidence} suffix="%" duration={1200} />
                </span>
                <p className="text-[10px] text-[#8E9B85] uppercase tracking-wider">Confidence</p>
              </div>
            </div>

            <div className="p-5 bg-[#0B1309]/90 space-y-4">
              {/* Symptoms */}
              <div>
                <h4 className="text-xs font-semibold text-[#8E9B85] uppercase tracking-wider mb-1">
                  Observed Diagnostic Symptoms
                </h4>
                <p className="text-sm text-[#FDFAF2] bg-[#10190D] p-3.5 rounded-xl border border-white/10">
                  {result.symptoms}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Chemical Treatment */}
                <SpotlightCard
                  spotlightColor="rgba(56, 189, 248, 0.16)"
                  borderColor="rgba(56, 189, 248, 0.4)"
                  className="border border-[#38BDF8]/30 bg-[#0A1A26]/80 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-[#7DD3FC] font-semibold text-sm mb-1.5">
                    <Sparkles size={16} className="text-[#38BDF8]" />
                    <h4>Chemical / Fungicidal Control</h4>
                  </div>
                  <p className="text-xs text-[#E0F2FE] leading-relaxed">
                    {result.chemical_treatment}
                  </p>
                </SpotlightCard>

                {/* Organic Treatment */}
                <SpotlightCard
                  spotlightColor="rgba(34, 197, 94, 0.16)"
                  borderColor="rgba(34, 197, 94, 0.4)"
                  className="border border-[#22C55E]/30 bg-[#0F2414]/80 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-[#86EFAC] font-semibold text-sm mb-1.5">
                    <CheckCircle size={16} className="text-[#4ADE80]" />
                    <h4>Organic &amp; Bio-Control Remedies</h4>
                  </div>
                  <p className="text-xs text-[#DCFCE7] leading-relaxed">
                    {result.organic_treatment}
                  </p>
                </SpotlightCard>
              </div>

              {/* Preventive Measures */}
              {result.preventive_measures && (
                <div className="border border-white/10 bg-[#10190D] rounded-xl p-3.5">
                  <h4 className="text-xs font-semibold text-[#8E9B85] mb-1">
                    Agronomic Prevention &amp; Field Sanitation
                  </h4>
                  <p className="text-xs text-[#D1DAC9] leading-relaxed">
                    {result.preventive_measures}
                  </p>
                </div>
              )}

              {/* Listen Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSpeech}
                  className="flex items-center gap-2 text-xs font-medium bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 hover:bg-[#84CC16]/30 px-3.5 py-2 rounded-xl transition cursor-pointer"
                >
                  {speaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  <span>{speaking ? "Stop Voice Advisory" : "Listen in Audio (Audio Advisory)"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiseaseDetection;
