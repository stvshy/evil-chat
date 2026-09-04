import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Flame, Loader2, AlertCircle, Mic } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactCountryFlag from 'react-country-flag';
import Sidebar from './Sidebar';

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
    statusAvailable: "AVAILABLE",
    statusUnavailable: "UNAVAILABLE",
    statusChecking: "CHECKING...",
    initialMessage: "What do you want? Ask quickly, I don't have all day for your pathetic drivel. 🤡",
    placeholder: "Write something stupid...",
    loading: "EvilChat is thinking...",
    errorConnection: "Failed to connect to the backend. Run the server `python main.py` locally.",
    footer: "EVILCHAT MIGHT MAKE MISTAKES. BUT YOU'RE STILL WORSE."
  },
  pl: {
    title: "EvilChat",
    subtitle: "LOCAL RAG + Groq API",
    statusAvailable: "DOSTĘPNY",
    statusUnavailable: "NIEDOSTĘPNY",
    statusChecking: "SPRAWDZANIE...",
    initialMessage: "Czego chcesz? Pytaj szybko, nie mam całego dnia na twoje żałosne wypociny. 🤡",
    placeholder: "Napisz coś głupiego...",
    loading: "EvilChat myśli...",
    errorConnection: "Nie udało się połączyć z backendem. Uruchom serwer `python main.py` lokalnie.",
    footer: "EVILCHAT MOŻE POPEŁNIAĆ BŁĘDY. ALE I TAK MNIEJ NIŻ TY."
  }
};

export default function App() {
  const [lang, setLang] = useState<'en' | 'pl'>('en');
  const t = translations[lang];

  const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:7860';

  const [status, setStatus] = useState<{ available: boolean; backend: boolean; model: boolean; checking: boolean }>({
    available: false,
    backend: false,
    model: false,
    checking: true,
  });

  // Web STT (Rozpoznawanie mowy) state & ref
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    const initialCheckRef = { current: true } as { current: boolean };
    async function checkStatus() {
      if (!mounted) return;
      if (initialCheckRef.current) {
        setStatus((s) => ({ ...s, checking: true }));
      }
      try {
        const res = await fetch(`${apiUrl}/status`);
        if (!res.ok) throw new Error('status error');
        const data = await res.json();
        if (!mounted) return;
        const backend = Boolean(data.backend);
        const model = Boolean(data.model);
        const available = Boolean(data.available ?? (backend && model));
        setStatus({ available, backend, model, checking: false });
      } catch (e) {
        if (!mounted) return;
        setStatus({ available: false, backend: false, model: false, checking: false });
      } finally {
        initialCheckRef.current = false;
      }
    }

    checkStatus();
    const id = window.setInterval(checkStatus, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [apiUrl]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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
 
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(lang === 'pl' ? 'Twoja przeglądarka nie obsługuje rozpoznawania mowy.' : 'Your browser does not support Speech Recognition.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang === 'pl' ? 'pl-PL' : 'en-US';

    const originalInput = input;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (e: any) => {
      let currentTranscript = '';
      for (let i = 0; i < e.results.length; i++) {
        currentTranscript += e.results[i][0].transcript;
      }
      
      const separator = originalInput.trim().length > 0 ? ' ' : '';
      const newText = originalInput + separator + currentTranscript;
      
      setInput(newText);

      // Dostosuj wysokość textarea w miarę mówienia
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    };

    recognition.onerror = (e: any) => {
      console.error('Speech recognition error', e.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Przerwij nasłuchiwanie w momencie wysyłania
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/chat`, {
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

  const handleNewChat = () => {
    setMessages([{ id: Date.now().toString(), role: 'assistant', content: t.initialMessage }]);
    setInput('');
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-gray-200 font-sans selection:bg-red-900/50">
      {/* Dodany wewnątrz komponentu styl dla animacji fal dźwiękowych */}
      <style>{`
        @keyframes wave-scale {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0a0a0a]/80 bg-gradient-to-r from-red-950/20 from-0% via-red-950/[0.1] via-50% to-red-950/20 to-100% backdrop-blur-md border-b border-red-900/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-[44px] h-[44px] rounded-xl bg-gradient-to-br from-red-600 to-red-900 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[17.8px] font-bold tracking-tight text-white">{t.title} <span className="text-[18px]">😈</span></h1>
            <div className="mt-[2px]">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full inline-block',
                    status.available && !status.checking ? 'bg-green-400' : 'bg-red-500'
                  )}
                />
                <span className={cn('text-[10.1px] font-medium uppercase tracking-widest', status.available && !status.checking ? 'text-green-400' : 'text-red-500/80')}>
                  {status.checking ? t.statusChecking : (status.available ? t.statusAvailable : t.statusUnavailable)}
                </span>
              </div>
            </div>
          </div>
        </div>

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

      <div className="flex flex-1 min-h-0">
        <Sidebar lang={lang} onNewChat={handleNewChat} isLoading={isLoading} />

        <div className="flex flex-col flex-1 min-w-0">
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
              {/* Formularz ma teraz "items-center", co centruje wszystkie przyciski idealnie w pionie wg textarea */}
              <form
                onSubmit={handleSubmit}
                className="relative flex items-center gap-2 bg-[#111] border border-zinc-800 rounded-3xl p-2 shadow-xl focus-within:border-red-900/50 focus-within:ring-1 focus-within:ring-red-900/50 transition-all duration-300"
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
                <div className="flex items-center gap-2 flex-shrink-0 mr-1">
                  {/* Przycisk mikrofonu (STT) */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full transition-colors border",
                      isListening
                        ? "bg-[#220000] border-red-900/50 text-red-500 shadow-[0_0_10px_rgba(220,38,38,0.2)]"
                        : "bg-zinc-800 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700"
                    )}
                    title={isListening ? "Stop listening" : "Speech to text"}
                  >
                    {isListening ? (
                      // Animacja fal dźwiękowych
                      <div className="flex items-center justify-center gap-[3px] h-4 w-4">
                        <div className="w-[3px] h-full bg-current rounded-full animate-[wave-scale_1s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
                        <div className="w-[3px] h-full bg-current rounded-full animate-[wave-scale_1s_ease-in-out_infinite]" style={{ animationDelay: '200ms' }} />
                        <div className="w-[3px] h-full bg-current rounded-full animate-[wave-scale_1s_ease-in-out_infinite]" style={{ animationDelay: '400ms' }} />
                      </div>
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>

                  {/* Czerwony przycisk do wysyłania (podobny do tego z New Chat) */}
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors"
                  >
                    <Send className="w-5 h-5 -ml-[1.7px] mt-0.5" />
                  </button>
                </div>
              </form>
              <div className="text-center mt-3">
                <p className="text-[8.3px] text-zinc-600 font-medium tracking-wide mb-[-9px]">
                  {t.footer}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}