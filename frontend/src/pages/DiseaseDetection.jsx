import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { speakText, stopSpeech, isSpeaking } from "../utils/speech";
import { Volume2, VolumeX } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

function DiseaseDetection() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [crop, setCrop] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [speakingIdx, setSpeakingIdx] = useState(null);

  const handleSubmit = async () => {
    if (!file) return setError("Please select an image file.");
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    if (crop) form.append("crop", crop);
    try {
      const res = await fetch(`${API_BASE}/predict/disease`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Prediction failed");
      setResult(data);
    } catch (e) {
      setError(e.message || "Could not get a diagnosis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">🔬 Disease Detection</h2>
      <p className="text-stone-500 mb-4">Upload a leaf photo to identify plant diseases early.</p>
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-3 w-full"
        />
        <input
          type="text"
          placeholder="Optional crop (e.g., wheat)"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          className="mb-3 w-full bg-[#F6F4EC] border border-transparent rounded-xl px-4 py-2"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#5B7A3A] text-white px-4 py-2 rounded-xl hover:bg-[#4C6B4C] disabled:opacity-40"
        >
          {loading ? "Analyzing..." : "Diagnose"}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {result && (
          <div className="mt-6 p-4 border rounded-xl bg-[#FBF3E3]">
            <h3 className="font-semibold mb-2">Result</h3>
            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
            <button
              onClick={() => {
                if (speakingIdx !== 0) {
                  setSpeakingIdx(0);
                  speakText(JSON.stringify(result), () => setSpeakingIdx(null));
                } else {
                  stopSpeech();
                  setSpeakingIdx(null);
                }
              }}
              className="mt-2 flex items-center text-[#5B7A3A]"
            >
              {speakingIdx === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span className="ml-1">Suniye</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiseaseDetection;