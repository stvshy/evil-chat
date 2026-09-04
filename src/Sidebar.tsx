import React from 'react';
import { Plus, Lock, ChevronDown, Flame } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SidebarProps = {
  lang: 'en' | 'pl';
  onNewChat?: () => void;
  isLoading?: boolean;
};

const sidebarText = {
  en: {
    newChat: 'New Chat',
    history: 'Chat history',
    historySoon: 'Coming soon',
    historyDesc: 'Your conversations will appear here once accounts are enabled.',
    model: 'Model',
    modelValue: 'Model selection',
    signIn: 'Log in',
    signUp: 'Sign up',
    locked: 'Locked',
  },
  pl: {
    newChat: 'Nowy czat',
    history: 'Historia czatów',
    historySoon: 'Wkrótce dostępne',
    historyDesc: 'Historia będzie dostępna po uruchomieniu kont.',
    model: 'Model',
    modelValue: 'Wybór modelu',
    signIn: 'Login',
    signUp: 'Rejestracja',
    locked: 'Zablokowane',
  },
};

// Standardowe szkło dla małych przycisków
const glass = 'bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]';
// Gradientowe szkło dla wyboru modelu
const glassGradient = 'bg-gradient-to-br from-white/[0.06] via-transparent to-black/40 backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]';
// Bardzo przezroczyste i niewyraźne szkło dla historii czatów
const glassGhost = 'bg-black/10 backdrop-blur-md border border-white/[0.03] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.01)]';

export default function Sidebar({ lang, onNewChat, isLoading }: SidebarProps) {
  const s = sidebarText[lang];

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-zinc-900 bg-transparent overflow-y-auto relative z-10">
      
      {/* Tło pod spodem, żeby szkło miało co "rozmywać" (subtelny gradient) */}
      <div className="absolute inset-0 bg-[#070707] bg-gradient-to-b from-[#090909] to-[#040404] -z-10" />

      {/* New Chat */}
      <div className="p-4 shrink-0">
      <button
  type="button"
  onClick={onNewChat}
  disabled={isLoading}
  className="font-ui uppercase tracking-wider group w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 bg-gradient-to-r from-red-700 to-red-900 text-white font-semibold text-sm shadow-[0_0_20px_rgba(220,38,38,0.14)] border border-red-700/50 hover:from-red-600 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
>
          <Plus className="w-4 h-4" />
          <span>{s.newChat}</span>
        </button>
      </div>

      {/* Historia czatów */}
      <div className="flex-1 min-h-0 px-4 pt-1 pb-3 flex flex-col">
        <div className="flex items-center justify-between px-1 pb-2 shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            {s.history}
          </span>
          <Lock className="w-3.5 h-3.5 text-zinc-700" />
        </div>

        <div className={cn('flex-1 min-h-0 rounded-xl relative overflow-hidden', glassGhost)} title={s.historySoon}>
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6 relative z-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 border border-white/[0.03] shadow-inner">
              <Lock className="w-4 h-4 text-zinc-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">{s.historySoon}</p>
              <p className="text-xs leading-5 text-zinc-600/80 max-w-[180px]">{s.historyDesc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Model + logowanie/rejestracja */}
      <div className="shrink-0 p-4 border-t border-white/[0.03] space-y-3 relative">
        
        {/* Wybór modelu (z gradientem glass-effect) */}
        <button
          type="button"
          disabled
          title={s.locked}
          className={cn(
            'w-full flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left cursor-not-allowed transition-colors relative overflow-hidden', 
            glassGradient
          )}
        >
          <div className="flex items-center gap-3 min-w-0 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-black/50 border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
              <Flame className="w-4 h-4 text-red-500/60" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{s.model}</p>
              <p className="text-sm text-zinc-300 truncate font-medium mt-0.5">{s.modelValue}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 relative z-10">
            <Lock className="w-3.5 h-3.5 text-zinc-600" />
            <ChevronDown className="w-4 h-4 text-zinc-700" />
          </div>
        </button>

        {/* Logowanie / rejestracja */}
        <div className="grid grid-cols-2 gap-2">
          {/* Log in */}
          <button
            type="button"
            disabled
            title={s.locked}
            className={cn('flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-400 cursor-not-allowed hover:bg-white/[0.04] transition-colors', glass)}
          >
            <Lock className="w-3 h-3 text-zinc-600" />
            {s.signIn}
          </button>

          {/* Sign up */}
          <button
            type="button"
            disabled
            title={s.locked}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-900/20 backdrop-blur-xl px-3 py-2.5 text-xs font-semibold text-zinc-300 cursor-not-allowed shadow-[0_0_15px_rgba(220,38,38,0.06),inset_0_1px_0_0_rgba(255,255,255,0.05)]"
          >
            <Lock className="w-3 h-3 text-red-500/70" />
            {s.signUp}
          </button>
        </div>
      </div>
    </aside>
  );
}