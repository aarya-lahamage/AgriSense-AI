import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Bot,
  User as UserIcon,
  ArrowRight,
  Volume2,
  VolumeX,
  Trash2,
  Cpu,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { speakText, stopSpeech, isSpeaking } from '../utils/speech';
import ShinyText from '../components/ShinyText';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const QUICK_QUESTIONS = [
  'सोयाबीन पिकासाठी पेरणीवेळी खताचे योग्य प्रमाण काय असावे?',
  'कपाशीवरील गुलाबी बोंडअळीच्या नियंत्रणासाठी काय उपाय करावा?',
  'कांदा पिकावरील करपा रोगासाठी प्रभावी फवारणी कोणती?',
  'How can I improve soil electrical conductivity (EC) safely?',
];

function makeWelcomeMessage(name) {
  return {
    role: 'assistant',
    text: `Namaste${name ? `, ${name}` : ''}! I am your AgriSense AI Agronomist. Ask me about crop nutrition, pest outbreaks, weather spraying windows, APMC mandi rates, or government subsidies in Marathi, Hindi, or English.`,
    suggestions: [
      { label: 'Recommend a crop', path: '/crop-recommendation' },
      { label: 'Scan leaf for disease', path: '/disease-detection' },
      { label: 'Check Weather Forecast', path: '/weather-advisory' },
    ],
  };
}

function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(() => [makeWelcomeMessage(user?.name)]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [_error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const handleSend = async (messageText) => {
    const query = (messageText || input).trim();
    if (!query || loading) return;

    setError('');
    const userMessage = { role: 'user', text: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/assistant/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      if (!response.ok) {
        throw new Error('Agronomic knowledge service is temporarily unavailable.');
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        text: data.replyPrimary || data.replyAlternate || 'I could not process this request right now.',
        suggestions: data.suggestions || [],
        grounding: data.grounding || null,
        queryForFeedback: query,
        feedbackGiven: null,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleFeedback = async (idx, helpful) => {
    const msg = messages[idx];
    if (!msg || msg.feedbackGiven !== undefined && msg.feedbackGiven !== null) return;

    try {
      await fetch(`${API_BASE}/adaptive/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: msg.queryForFeedback || 'General inquiry',
          response: msg.text,
          helpful,
          farmer_name: user?.name || 'Farmer',
          language: 'mr'
        })
      });

      setMessages((prev) =>
        prev.map((m, i) => (i === idx ? { ...m, feedbackGiven: helpful } : m))
      );
    } catch (err) {
      console.error('Failed to submit feedback', err);
    }
  };

  const handleClear = () => {
    stopSpeech();
    setSpeakingIdx(null);
    setMessages([makeWelcomeMessage(user?.name)]);
    setError('');
  };

  const handleSpeak = (idx, text) => {
    if (speakingIdx === idx && isSpeaking()) {
      stopSpeech();
      setSpeakingIdx(null);
      return;
    }
    setSpeakingIdx(idx);
    speakText(text, () => setSpeakingIdx(null));
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12 agri-animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C150A] via-[#142311] to-[#1E3319] text-white p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 mb-2">
              <Cpu size={13} />
              <ShinyText text="Multi-Lingual Agronomic Intelligence" speed={4} className="text-[11px] font-semibold" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FDFAF2]">
              AI Agricultural Assistant
            </h2>
            <p className="text-xs sm:text-sm text-[#A3B39C] mt-1">
              Context-aware answers on pest attacks, fertilizer splits, weather risks, and government subsidies with native audio speech.
            </p>
          </div>

          <button
            onClick={handleClear}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-xs text-white font-semibold px-4 py-2.5 rounded-xl border border-white/20 transition shadow-sm cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-[#0B1309]/80 border border-white/10 text-[#A8B5A0] hover:text-[#FDFAF2] hover:border-[#84CC16]/40 transition shadow-xs cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="agri-glass-card flex flex-col h-[540px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-[#1E3319] text-[#BEF264] border border-[#84CC16]/30'
                      : 'bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30'
                  }`}
                >
                  {isUser ? <UserIcon size={16} /> : <Bot size={16} />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#142311] text-[#FDFAF2] border border-[#84CC16]/30 rounded-tr-xs shadow-md'
                      : 'bg-[#0B1309]/90 text-[#FDFAF2] border border-white/10 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line text-[#FDFAF2]">{m.text}</div>

                  {/* Grounding source badge */}
                  {!isUser && m.grounding && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#84CC16]/80">
                      <ShieldCheck size={11} />
                      <span className="font-semibold">Grounded:</span>
                      <span className="text-[#A3B39C]">{m.grounding.source || 'Adaptive KB'}</span>
                      {m.grounding.verified_by && (
                        <span className="text-[#6B7C63]">· {m.grounding.verified_by}</span>
                      )}
                    </div>
                  )}

                  {/* Audio speak + feedback row for assistant messages */}
                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleSpeak(idx, m.text)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#84CC16] hover:underline cursor-pointer"
                      >
                        {speakingIdx === idx ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        <span>{speakingIdx === idx ? 'Stop Voice' : 'Listen in Audio'}</span>
                      </button>

                      {/* Feedback buttons — only for non-welcome assistant messages */}
                      {m.queryForFeedback && (
                        <div className="flex items-center gap-1.5">
                          {m.feedbackGiven !== null && m.feedbackGiven !== undefined ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#84CC16] font-semibold">
                              <Check size={11} /> Feedback recorded
                            </span>
                          ) : (
                            <>
                              <span className="text-[10px] text-[#6B7C63] mr-0.5">Helpful?</span>
                              <button
                                onClick={() => handleFeedback(idx, true)}
                                title="Mark helpful"
                                className="p-1 rounded-lg hover:bg-[#84CC16]/20 text-[#6B7C63] hover:text-[#84CC16] transition cursor-pointer"
                              >
                                <ThumbsUp size={12} />
                              </button>
                              <button
                                onClick={() => handleFeedback(idx, false)}
                                title="Mark not helpful"
                                className="p-1 rounded-lg hover:bg-red-500/20 text-[#6B7C63] hover:text-red-400 transition cursor-pointer"
                              >
                                <ThumbsDown size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contextual navigation pills */}
                  {m.suggestions?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/10 flex flex-wrap gap-2">
                      {m.suggestions.map((s) => (
                        <Link
                          key={s.path}
                          to={s.path}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/10 text-[#BEF264] px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/20 transition"
                        >
                          <span>{s.label}</span>
                          <ArrowRight size={11} />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-[#8E9B85]">
              <div className="w-8 h-8 rounded-xl bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/40 flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(132,204,22,0.3)]">
                <Bot size={16} />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#84CC16] animate-ping" />
                <span className="text-[#BEF264] font-medium">AgriSense assistant is analyzing agronomic knowledge...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/10 bg-[#070B06]/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything about farming (e.g., 'Cotton me pink bollworm kaise roke?')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#10190D] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#FDFAF2] placeholder-[#6B7C63] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="agri-btn-primary p-2.5 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;
