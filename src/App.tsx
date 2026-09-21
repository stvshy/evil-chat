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

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const initialHeightRef = useRef<number>(0);

  // Śledzi rzeczywistą wysokość widocznego obszaru i wykrywa klawiaturę na telefonie
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    if (!initialHeightRef.current) {
      initialHeightRef.current = vv.height;
    }

    let lastWidth = window.innerWidth;

    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    const updateViewportHeight = () => {
      const vh = vv.height;
      const vw = window.innerWidth;
      const isMobile = vw < 640;

      if (Math.abs(vw - lastWidth) > 50) {
        lastWidth = vw;
        initialHeightRef.current = vh;
      } else if (vh > initialHeightRef.current) {
        initialHeightRef.current = vh;
      }

      const heightDiff = initialHeightRef.current - vh;
      const isFocused = document.activeElement === textareaRef.current;
      const keyboardOpen = isMobile && (heightDiff > 140 || (isFocused && heightDiff > 80));

      setIsKeyboardOpen(keyboardOpen);
      if (keyboardOpen) {
        document.documentElement.style.setProperty('--keyboard-vh', `${vh}px`);
      } else {
        document.documentElement.style.removeProperty('--keyboard-vh');
        resetScroll();
      }
    };

    updateViewportHeight();
    vv.addEventListener('resize', updateViewportHeight);
    vv.addEventListener('scroll', updateViewportHeight);
    window.addEventListener('resize', updateViewportHeight);

    return () => {
      vv.removeEventListener('resize', updateViewportHeight);
      vv.removeEventListener('scroll', updateViewportHeight);
      window.removeEventListener('resize', updateViewportHeight);
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

  useEffect(() => {
    if (isKeyboardOpen) {
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 200);
    }
  }, [isKeyboardOpen]);

  const handleTextareaFocus = () => {
    if (window.innerWidth < 640) {
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        scrollToBottom();
      }, 100);
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 300);
    }
  };

  const handleTextareaBlur = () => {
    if (window.innerWidth < 640) {
      const resetScroll = () => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };
      resetScroll();
      setTimeout(resetScroll, 100);
      setTimeout(resetScroll, 250);
      setTimeout(() => {
        resetScroll();
        setIsKeyboardOpen(false);
        document.documentElement.style.removeProperty('--keyboard-vh');
      }, 350);
    }
  };

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
    <div
      className={cn(
        "flex flex-col h-dvh overflow-hidden bg-[#050505] text-gray-200 font-sans selection:bg-red-900/50",
        isKeyboardOpen && "max-sm:h-[var(--keyboard-vh)]"
      )}
    >
      <style>{`
        @keyframes wave-scale {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #1f1f22; 
          border-radius: 10px;
          border: 0.5px solid #27272a; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #27272a; 
          border-color: #3f3f46;     
        }
      `}</style>

      <header className="sticky top-0 z-20 flex items-center justify-between px-3 py-2.5 sm:px-6 sm:py-4 bg-[#0a0a0a]/80 bg-gradient-to-r from-red-950/20 from-0% via-red-950/[0.1] via-50% to-red-950/20 to-100% backdrop-blur-md border-b border-red-900/10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-red-600 to-red-900 shadow-[0_0_15px_rgba(220,38,38,0.3)] shrink-0">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] sm:text-[17.8px] font-bold tracking-tight text-white">{t.title} <span className="text-[16px] sm:text-[18px]">😈</span></h1>
            <div className="mt-[1px] sm:mt-[2px]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full inline-block',
                    status.available && !status.checking ? 'bg-green-400' : 'bg-red-500'
                  )}
                />
                <span className={cn(
                  'font-tech text-[9.0px] sm:text-[10.8px] font-semibold uppercase tracking-widest', 
                  status.available && !status.checking ? 'text-green-400' : 'text-red-500/80'
                )}>
                  {status.checking ? t.statusChecking : (status.available ? t.statusAvailable : t.statusUnavailable)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors shrink-0"
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

      <div className="flex flex-1 min-h-0 relative">
        <Sidebar lang={lang} onNewChat={handleNewChat} isLoading={isLoading} />

        <div className="flex flex-col flex-1 min-w-0 relative">
          
          <main className="flex-1 overflow-y-auto w-full custom-scrollbar relative overscroll-y-contain">
            <div className={cn(
              "max-w-5xl mx-auto px-3 sm:px-4 pt-[22px] space-y-4 sm:space-y-8 sm:pt-[32px]",
              isKeyboardOpen ? "pb-16 sm:pb-40" : "pb-28 sm:pb-40"
            )}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4",
                    message.role === 'user' 
                      ? "ml-auto flex-row-reverse max-w-[95%] md:max-w-[88%]" 
                      : "mr-auto max-w-[95%] md:max-w-[78%]",
                    message.role === 'system' && "mx-auto max-w-full justify-center"
                  )}
                >
                  {message.role !== 'system' && (
                    <div className="flex-shrink-0 mt-1">
                      {message.role === 'assistant' ? (
                        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-red-900 to-black border border-red-800/50 shadow-[0_0_10px_rgba(153,27,27,0.2)]">
                          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-800">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "font-chat px-3.5 py-3 sm:px-5 sm:py-4 rounded-2xl text-[13.5px] sm:text-[14.7px] leading-relaxed shadow-sm min-w-0",
                      message.role === 'user'
                        ? "bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-tr-sm"
                        : message.role === 'assistant'
                        ? "bg-[#111111] text-zinc-300 border border-red-900/20 rounded-tl-sm"
                        : "bg-red-950/30 text-red-400 border border-red-900/50 rounded-xl text-sm flex items-center gap-2"
                    )}
                    style={{ wordSpacing: '0.6px',
                      letterSpacing: '0.3px'
                    }}
                  >
                    {message.role === 'system' && <AlertCircle className="w-4 h-4" />}
                    {message.role === 'user' || message.role === 'system' ? (
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    ) : (
                      <div className="prose prose-invert max-w-none break-words">
                        <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 max-w-[95%] md:max-w-[78%] mr-auto">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-red-900 to-black border border-red-800/50 shadow-[0_0_10px_rgba(153,27,27,0.2)]">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                    </div>
                  </div>
                  <div className="px-3.5 py-3 sm:px-5 sm:py-4 rounded-2xl bg-[#111111] border border-red-900/20 rounded-tl-sm flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                    <span className="text-xs sm:text-sm font-medium text-red-500/80 animate-pulse">{t.loading}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </main>

          <div className={cn(
            "absolute left-0 z-10 pointer-events-none transition-all duration-150",
            isKeyboardOpen
              ? "bottom-0 right-0"
              : "bottom-0 sm:-bottom-2 right-0 sm:right-[8px]"
          )}>
            
            {/* Tło i blur, gdy klawiatura jest zamknięta */}
            <div className={cn("absolute inset-0 pointer-events-none", isKeyboardOpen ? "hidden" : "block")}>
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
              <div className="absolute inset-0 backdrop-blur-[2px]" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)' }} />
              <div className="absolute inset-0 backdrop-blur-[8px]" style={{ maskImage: 'linear-gradient(to bottom, transparent 30%, black 60%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 30%, black 60%, black 100%)' }} />
              <div className="absolute inset-0 backdrop-blur-[16px]" style={{ maskImage: 'linear-gradient(to bottom, transparent 60%, black 85%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 60%, black 85%, black 100%)' }} />
              <div className="absolute inset-0 backdrop-blur-[32px]" style={{ maskImage: 'linear-gradient(to bottom, transparent 85%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 85%, black 100%)' }} />
            </div>

            {/* Tło i blur pod textinputem, gdy klawiatura jest wysunięta na telefonie */}
            <div className={cn("absolute inset-x-0 bottom-0 -top-3 pointer-events-none", isKeyboardOpen ? "block sm:hidden" : "hidden")}>
              {/* Płynny gradient przyciemnienia */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, transparent 0%, rgba(5,5,5,0.15) 30%, rgba(5,5,5,0.6) 65%, rgba(5,5,5,0.96) 100%)'
                }}
              />
              {/* Progresywne warstwy blur dla ultra-płynnego przejścia tuż nad textinputem */}
              <div
                className="absolute inset-0 backdrop-blur-[2px]"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 40%, black 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40%, black 100%)'
                }}
              />
              <div
                className="absolute inset-0 backdrop-blur-[6px]"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 25%, black 60%, black 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 25%, black 60%, black 100%)'
                }}
              />
              <div
                className="absolute inset-0 backdrop-blur-[12px]"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 45%, black 75%, black 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 45%, black 75%, black 100%)'
                }}
              />
              <div
                className="absolute inset-0 backdrop-blur-[20px]"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 65%, black 90%, black 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 65%, black 90%, black 100%)'
                }}
              />
            </div>
        
            <div className={cn(
              "max-w-5xl mx-auto relative px-3 sm:px-4 w-full pointer-events-auto",
              isKeyboardOpen
                ? "py-2 sm:pt-16 sm:pb-8"
                : "pt-8 pb-3 sm:pt-16 sm:pb-8"
            )}>
              {error && (
                <div className="absolute top-2 left-0 right-0 flex justify-center px-2">
                  <div className="bg-red-950/80 text-red-400 text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-red-900/50 backdrop-blur-sm flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {error}
                  </div>
                </div>
              )}
              <form
                onSubmit={handleSubmit}
                className="relative flex items-center gap-2 bg-[#111] border border-zinc-800 rounded-3xl p-1.5 sm:p-2 shadow-2xl shadow-black/50 focus-within:border-red-900/50 focus-within:ring-1 focus-within:ring-red-900/50 transition-all duration-300"
              >
               <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleTextareaFocus}
                onBlur={handleTextareaBlur}
                placeholder={t.placeholder}
                className="font-chat w-full max-h-[140px] sm:max-h-[200px] bg-transparent text-zinc-100 placeholder:text-zinc-600 px-3 py-2.5 sm:px-4 sm:py-3 outline-none resize-none overflow-y-auto text-[14px] sm:text-[15.3px]"
                rows={1}
               />
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 mr-0.5 sm:mr-1">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-colors border shrink-0",
                      isListening
                        ? "bg-[#220000] border-red-900/50 text-red-500 shadow-[0_0_10px_rgba(220,38,38,0.2)]"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                    )}
                    title={isListening ? "Stop listening" : "Speech to text"}
                  >
                    {isListening ? (
                      <div className="flex items-center justify-center gap-[3px] h-4 w-4">
                        <div className="w-[3px] h-full bg-current rounded-full animate-[wave-scale_1s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
                        <div className="w-[3px] h-full bg-current rounded-full animate-[wave-scale_1s_ease-in-out_infinite]" style={{ animationDelay: '200ms' }} />
                        <div className="w-[3px] h-full bg-current rounded-full animate-[wave-scale_1s_ease-in-out_infinite]" style={{ animationDelay: '400ms' }} />
                      </div>
                    ) : (
                      <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-white transition-colors shrink-0",
                      !input.trim() || isLoading
                        ? "bg-red-700/6 text-white/30 border border-red-900/20 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 -ml-[1.7px] mt-0.5" />
                  </button>
                </div>
              </form>
              <div className={cn("text-center mt-[9px]", isKeyboardOpen && "hidden sm:block")}>
                <p className="font-tech text-[6.5px] sm:text-[7.5px] text-zinc-600/50 font-semibold uppercase tracking-[1.6px] sm:mb-[-21px] mb-[0px]">
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