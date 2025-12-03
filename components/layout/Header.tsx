"use client";

import { Bell, Search, Calendar } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const today = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 min-h-[4rem] sm:min-h-[5rem]">
      {/* Page Title - avec espace pour le bouton menu sur mobile */}
      <div className="flex flex-col pl-14 lg:pl-0 min-w-0 flex-1">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent truncate">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{today}</span>
          </div>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Bar - caché sur mobile, visible sur tablette+ */}
        <div className="relative group hidden md:block">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-11 pr-4 py-2.5 w-48 lg:w-72 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all duration-200"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-focus-within:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-xs bg-slate-200 text-slate-600 rounded font-medium">⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-xs bg-slate-200 text-slate-600 rounded font-medium">K</kbd>
          </div>
        </div>

        {/* Search Button - visible sur mobile uniquement */}
        <button className="md:hidden p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200">
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200 group">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-full ring-2 ring-white" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75" />
        </button>

        {/* User Quick Menu - caché sur mobile */}
        <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 cursor-pointer hover:shadow-orange-500/40 transition-all duration-200">
            <span className="text-sm font-bold text-white">A</span>
          </div>
        </div>
      </div>
    </header>
  );
}


