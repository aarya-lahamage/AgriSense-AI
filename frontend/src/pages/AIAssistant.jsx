import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User as UserIcon, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://127.0.0.1:8000';

function AIAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello${user?.name ? ', ' + user.name : ''}! I'm a simple rule-based assistant — I can help you navigate this app and answer basic farming questions about soil, NPK, irrigation, and fertilizers.`,
      suggestions: [
        { label: 'Recommend a crop', path: '/crop-recommendation' },
        { label: 'Check weather', path: '/weather-advisory' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const messageText = text ?? input;
    if (!messageText.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', text: messageText }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/assistant/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.reply, suggestions: data.suggestions || [] },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: "Sorry, I couldn't reach the server. Please check that the backend is running.", suggestions: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-100px)]">
      <div className="mb-5">
        <h2 className="font-serif text-[26px] font-medium text-[#22301A] mb-1">AI Assistant</h2>
        <p className="text-[#7A8A6A] text-sm">
          A simple rule-based helper — not a full AI chatbot, but can guide you around the app.
        </p>
      </div>

      <div className="flex-1 bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)] overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-[#22301A]' : 'bg-[#DCE8C8]'
              }`}
            >
              {msg.role === 'user' ? (
                <UserIcon size={15} className="text-white" />
              ) : (
                <Bot size={15} className="text-[#5B7A3A]" />
              )}
            </div>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#22301A] text-white rounded-tr-sm'
                    : 'bg-[#F6F4EC] text-[#22301A] rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {msg.suggestions.map((s, si) =>
                    s.path ? (
                      <button
                        key={si}
                        onClick={() => navigate(s.path)}
                        className="flex items-center gap-1.5 bg-[#E5EFD5] text-[#5B7A3A] text-xs font-medium px-3 py-1.5 rounded-full hover:bg-[#DCE8C8] transition"
                      >
                        {s.label} <ArrowRight size={12} />
                      </button>
                    ) : (
                      <button
                        key={si}
                        onClick={() => sendMessage(s.label)}
                        className="bg-[#F6F4EC] text-[#7A8A6A] text-xs font-medium px-3 py-1.5 rounded-full hover:bg-[#EEEBDD] transition"
                      >
                        {s.label}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#DCE8C8] flex items-center justify-center shrink-0">
              <Bot size={15} className="text-[#5B7A3A]" />
            </div>
            <div className="bg-[#F6F4EC] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-[#A8A391]">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef}></div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about crops, fertilizer, weather..."
          className="flex-1 bg-white border border-transparent rounded-xl px-4 py-3 text-sm text-[#22301A] shadow-[0_1px_3px_rgba(34,48,26,0.06)] focus:outline-none focus:border-[#5B7A3A] transition"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-[#5B7A3A] text-white px-4 py-3 rounded-xl hover:bg-[#4C6B4C] transition disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default AIAssistant;