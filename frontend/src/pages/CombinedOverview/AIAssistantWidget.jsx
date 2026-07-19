import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, User, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import chatbotApi from '@/services/chatbotApi';

const SUGGESTIONS = [
  { text: "How did my content perform this week?", emoji: "📊" },
  { text: "Which platform is performing the best?", emoji: "🏆" },
  { text: "What type of content gets most engagement?", emoji: "💡" },
  { text: "Give me a summary of my growth", emoji: "📈" },
];

const AIAssistantWidget = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    const newMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatbotApi.sendMessage(trimmed);

      // The backend may return different fields depending on state
      const reply = response?.reply
        || response?.message
        || "I couldn't generate a response. Please try again.";

      const warning = response?.dataWarning;

      setMessages([
        ...newMessages,
        { role: 'assistant', content: reply, warning },
      ]);
    } catch (err) {
      const errMsg = err?.response?.status === 404
        ? 'Chatbot endpoint not found. Check that the backend is running and the /chatbot route is mounted.'
        : err?.response?.data?.error
          || 'Something went wrong. Make sure the ML engine is running (python ml_engine/chatbot_local_server.py).';

      setMessages([
        ...newMessages,
        { role: 'assistant', content: errMsg, isError: true },
      ]);
      setError(errMsg);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col h-full bg-[#0D1117] rounded-2xl border border-white/8 overflow-hidden shadow-2xl">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3.5 border-b border-white/8 flex items-center gap-3 bg-white/[0.02]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">AI Assistant</h3>
          <p className="text-[11px] text-slate-500">Your intelligent analytics companion</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-medium">Live</span>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          /* Welcome screen */
          <div className="space-y-5 h-full flex flex-col justify-start pt-2">
            {/* Welcome card */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 flex items-start gap-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm mb-1">👋 Hi {firstName}!</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  I'm your AI analytics assistant powered by your platform data.
                  Ask me anything about your content performance.
                </p>
              </div>
            </div>

            {/* Suggested prompts */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Suggested Questions
              </p>
              <div className="space-y-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s.text)}
                    disabled={isLoading}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white/4 hover:bg-white/8 border border-white/6 hover:border-indigo-500/30 text-sm text-slate-300 transition-all duration-200 flex items-center gap-3 group"
                  >
                    <span className="text-base shrink-0">{s.emoji}</span>
                    <span className="flex-1 leading-snug">{s.text}</span>
                    <svg className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message history */
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === 'user'
                    ? 'bg-violet-600'
                    : msg.isError
                      ? 'bg-red-500/20 border border-red-500/30'
                      : 'bg-gradient-to-br from-indigo-500 to-violet-600'
                }`}>
                  {msg.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-white" />
                    : msg.isError
                      ? <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      : <Bot className="w-3.5 h-3.5 text-white" />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[82%] space-y-1.5 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                  <div className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-sm'
                      : msg.isError
                        ? 'bg-red-500/10 text-red-300 border border-red-500/20 rounded-tl-sm'
                        : 'bg-white/6 text-slate-200 border border-white/8 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.warning && (
                    <div className="px-3 py-2 rounded-xl bg-amber-500/8 border border-amber-500/20 text-[11px] text-amber-400 leading-relaxed">
                      ⚠️ {msg.warning}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white/6 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span className="text-xs text-slate-500">Analyzing your data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input ──────────────────────────────────────────────── */}
      <div className="shrink-0 p-3 border-t border-white/8 bg-white/[0.01]">
        <div className="relative flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your analytics..."
            className="flex-1 resize-none bg-white/5 border border-white/10 focus:border-indigo-500/60 rounded-xl pl-4 pr-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all leading-relaxed max-h-24 overflow-y-auto"
            style={{ height: '42px' }}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
          >
            {isLoading
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Send className="w-4 h-4 text-white translate-x-[1px]" />
            }
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-600 mt-2">
          AI responses may not always be accurate. Verify important insights.
        </p>
      </div>
    </div>
  );
};

export default AIAssistantWidget;
