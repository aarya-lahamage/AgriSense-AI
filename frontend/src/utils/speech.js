/**
 * AgriSense AI — Free Native Speech Synthesis (Text-to-Speech)
 * 100% browser native, 0 API keys, 0 network latency.
 */

let cachedVoices = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function speakText(text, onEnd) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  if (!text || !text.trim()) return false;

  // Clean markdown / formatting
  const clean = text
    .replace(/[*_#`~[\]]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/₹/g, 'Rupees ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.95; // comfortable listening pace for farmers
  utterance.pitch = 1.0;

  // Try to find an Indian English or Hindi voice
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    (v) =>
      v.lang.includes('en-IN') ||
      v.lang.includes('hi-IN') ||
      v.name.toLowerCase().includes('india') ||
      v.name.toLowerCase().includes('hindi')
  );

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
}
