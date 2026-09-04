import React from 'react';
import { Plus, Lock, ChevronDown, Flame } from 'lucide-react';

type SidebarProps = {
  lang: 'en' | 'pl';
  onNewChat?: () => void;
  isLoading?: boolean;
};

// Sidebar ma własny słownik tekstów, żeby komponent był samodzielny i łatwo przenośny.
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
    historyDesc: 'Historia rozmów będzie dostępna po uruchomieniu kont.',
    model: 'Model',
    modelValue: 'Wybór modelu',
    signIn: 'Zaloguj się',
    signUp: 'Zarejestruj się',
    locked: 'Zablokowane',
  },
};

export default function Sidebar({ lang, onNewChat, isLoading }: SidebarProps) {
  const s = sidebarText[lang];

  return (
    // "lg:flex" -> pasek widoczny od ~1024px (komputer / szerszy ekran), ukryty na telefonie i tablecie w pionie.
    // Zmień "lg" na "md" w tej linii, jeśli ma się pojawiać wcześniej.
    <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-zinc-900 bg-[#090909] overflow-y-auto">
      {/* New Chat */}
      <div className="p-4">
        <button
          type="button"
          onClick={onNewChat}
          disabled={isLoading}
          className="group w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 bg-gradient-to-r from-red-700 to-red-900 text-white font-semibold text-sm shadow-[0_0_20px_rgba(220,38,38,0.14)] border border-red-700/50 hover:from-red-600 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{s.newChat}</span>
        </button>
      </div>

      {/* Historia czatów — zablokowana */}
      <div className="px-4 pt-1">
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            {s.history}
          </span>
          <Lock className="w-3.5 h-3.5 text-zinc-700" />
        </div>

        <div
          className="rounded-xl border border-zinc-900 bg-black/40 p-4 opacity-60"
          title={s.historySoon}
        >
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-950 border border-zinc-800">
              <Lock className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-400">{s.historySoon}</p>
            <p className="text-xs leading-5 text-zinc-600">{s.historyDesc}</p>
          </div>
        </div>
      </div>

      {/* Model + logowanie/rejestracja — zablokowane, przypięte do dołu */}
      <div className="mt-auto p-4 border-t border-zinc-900 space-y-3">
        {/* Wybór modelu */}
        <button
          type="button"
          disabled
          title={s.locked}
          className="w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-900 bg-black/40 px-3.5 py-3 text-left opacity-55 cursor-not-allowed"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-red-500/50" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">{s.model}</p>
              <p className="text-sm text-zinc-400 truncate">{s.modelValue}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Lock className="w-3.5 h-3.5 text-zinc-700" />
            <ChevronDown className="w-4 h-4 text-zinc-800" />
          </div>
        </button>

        {/* Logowanie / rejestracja */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled
            title={s.locked}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-900 bg-black/40 px-3 py-2.5 text-xs font-semibold text-zinc-500 opacity-55 cursor-not-allowed"
          >
            <Lock className="w-3 h-3" />
            {s.signIn}
          </button>
          <button
            type="button"
            disabled
            title={s.locked}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-900 bg-black/40 px-3 py-2.5 text-xs font-semibold text-zinc-500 opacity-55 cursor-not-allowed"
          >
            <Lock className="w-3 h-3" />
            {s.signUp}
          </button>
        </div>
      </div>
    </aside>
  );
}