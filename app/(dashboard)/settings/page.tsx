import { Header } from "@/components/layout/Header";
import { Settings, Building2, Database, Mail, Globe } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <Header title="Paramètres" subtitle="Configuration de votre application" />
      <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="max-w-4xl space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Paramètres généraux</h2>
                  <p className="text-sm text-slate-500">Configuration de l&apos;entreprise</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom de l&apos;agence
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="YourStory"
                      className="input pl-11 bg-slate-50"
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email de contact
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="contact@yourstory.com"
                      className="input pl-11 bg-slate-50"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Database Settings */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Base de données</h2>
                  <p className="text-sm text-slate-500">Configuration Supabase (lecture seule)</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Supabase URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={process.env.NEXT_PUBLIC_SUPABASE_URL || "Non configuré"}
                      className="input pl-11 bg-slate-50 font-mono text-sm"
                      disabled
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-emerald-700">Connexion active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Settings className="w-5 h-5" />
              <h3 className="font-bold">À propos</h3>
            </div>
            <p className="text-white/80 text-sm">
              YourStory Compta v1.0 - Application de gestion comptable développée avec Next.js, Tailwind CSS et Supabase.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

