import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Flame, Loader2, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactCountryFlag from 'react-country-flag';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const translations = {
  en: {
    title: "EvilChat",
    subtitle: "Local RAG + Groq API",
    initialMessage: "What do you want? Ask quickly, I don't have all day for your pathetic drivel. 😈",
    placeholder: "Write something stupid...",
    loading: "EvilChat is thinking...",
    errorConnection: "Failed to connect to the backend. Run the server `python main.py` locally.",
    footer: "EVILCHAT MIGHT MAKE MISTAKES. BUT YOU'RE STILL WORSE."
  },
  pl: {
    title: "EvilChat",
    subtitle: "LOCAL RAG + Groq API",
    initialMessage: "Czego chcesz? Pytaj szybko, nie mam całego dnia na twoje żałosne wypociny. 😈",
    placeholder: "Napisz coś głupiego...",
    loading: "EvilChat myśli...",
    errorConnection: "Nie udało się połączyć z backendem. Uruchom serwer `python main.py` lokalnie.",
    footer: "EVILCHAT MOŻE POPEŁNIAĆ BŁĘDY. ALE I TAK JESTEŚ GORSZY."
  }
};

export default function App() {
  const [lang, setLang] = useState<'en' | 'pl'>('en');
  const t = translations[lang];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t.initialMessage,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update initial message if language changes and no other messages exist
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === '1') {
      setMessages([{ id: '1', role: 'assistant', content: t.initialMessage }]);
    }
  }, [lang, t.initialMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Call the local FastAPI backend
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content, language: lang }),
      });

      if (!response.ok) {
        throw new Error(t.errorConnection);
      }

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred.');
      // Add a system error message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: t.errorConnection,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'pl' : 'en');
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-gray-200 font-sans selection:bg-red-900/50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">{t.title} <span className="text-xl">😈</span></h1>
            <p className="text-xs font-medium text-red-500/80 uppercase tracking-widest">{t.subtitle}</p>
          </div>
        </div>
        
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
          title={lang === 'en' ? "Switch to Polish" : "Switch to English"}
        >
          <ReactCountryFlag
            countryCode={lang === 'en' ? 'PL' : 'GB'}
            svg
            style={{ width: '1.2em', height: '1.2em' }}
          />
          <span className="text-xs font-medium text-zinc-300 uppercase">{lang === 'en' ? 'pl' : 'en'}</span>
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-4 max-w-[85%]",
              message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto",
              message.role === 'system' && "mx-auto max-w-full justify-center"
            )}
          >
            {message.role !== 'system' && (
              <div className="flex-shrink-0 mt-1">
                {message.role === 'assistant' ? (
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-900 to-black border border-red-800/50 shadow-[0_0_10px_rgba(153,27,27,0.2)]">
                    <Bot className="w-5 h-5 text-red-400" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                )}
              </div>
            )}

            <div
              className={cn(
                "px-5 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                message.role === 'user'
                  ? "bg-zinc-800/80 text-zinc-100 border border-zinc-700/50 rounded-tr-sm"
                  : message.role === 'assistant'
                  ? "bg-[#111111] text-zinc-300 border border-red-900/20 rounded-tl-sm"
                  : "bg-red-950/30 text-red-400 border border-red-900/50 rounded-xl text-sm flex items-center gap-2"
              )}
            >
              {message.role === 'system' && <AlertCircle className="w-4 h-4" />}
              {message.role === 'user' || message.role === 'system' ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 max-w-[85%] mr-auto">
            <div className="flex-shrink-0 mt-1">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-900 to-black border border-red-800/50 shadow-[0_0_10px_rgba(153,27,27,0.2)]">
                <Bot className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <div className="px-5 py-4 rounded-2xl bg-[#111111] border border-red-900/20 rounded-tl-sm flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
              <span className="text-sm font-medium text-red-500/80 animate-pulse">{t.loading}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <div className="w-full bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pt-6 pb-6 px-4">
        <div className="max-w-4xl mx-auto relative">
          {error && (
            <div className="absolute -top-12 left-0 right-0 flex justify-center">
              <div className="bg-red-950/80 text-red-400 text-xs px-4 py-2 rounded-full border border-red-900/50 backdrop-blur-sm flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                {error}
              </div>
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2 bg-[#111] border border-zinc-800 rounded-3xl p-2 shadow-xl focus-within:border-red-900/50 focus-within:ring-1 focus-within:ring-red-900/50 transition-all duration-300"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              className="w-full max-h-[200px] bg-transparent text-zinc-100 placeholder:text-zinc-600 px-4 py-3 outline-none resize-none overflow-y-auto text-[15px]"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white transition-colors mb-1 mr-1"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
          <div className="text-center mt-3">
            <p className="text-[11px] text-zinc-600 font-medium tracking-wide">
              {t.footer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
