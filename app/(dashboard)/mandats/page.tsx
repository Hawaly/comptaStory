"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Search, Calendar, User, Briefcase, Filter, ChevronRight, Clock, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Mandat,
  MandatStatus,
  MANDAT_STATUS_LABELS
} from "@/types/database";

type MandatWithClient = Mandat & {
  client: {
    name: string;
  } | null;
};

export default function MandatsPage() {
  const [mandats, setMandats] = useState<MandatWithClient[]>([]);
  const [filteredMandats, setFilteredMandats] = useState<MandatWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<MandatStatus | "all">("all");

  useEffect(() => {
    loadMandats();
  }, []);

  useEffect(() => {
    filterMandats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mandats, searchTerm, statusFilter]);

  async function loadMandats() {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("mandat")
        .select(`
          *,
          client:client_id (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setMandats(data || []);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Erreur lors du chargement des mandats");
    } finally {
      setIsLoading(false);
    }
  }

  function filterMandats() {
    let filtered = [...mandats];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (mandat) =>
          mandat.title.toLowerCase().includes(term) ||
          mandat.client?.name.toLowerCase().includes(term) ||
          mandat.mandat_type?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((mandat) => mandat.status === statusFilter);
    }

    setFilteredMandats(filtered);
  }

  return (
    <>
      <Header title="Mandats" subtitle="Gérez les mandats et contrats clients" />
      <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {mandats.length} <span className="text-sm sm:text-base font-normal text-slate-500">mandat(s)</span>
              </p>
              {filteredMandats.length !== mandats.length && (
                <p className="text-xs sm:text-sm text-slate-500">{filteredMandats.length} affiché(s)</p>
              )}
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm p-4 sm:p-5 mb-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Filtres</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher par titre, client ou type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-11"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MandatStatus | "all")}
              className="select"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
        </div>

        {/* Contenu */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center">
            <div className="relative inline-flex">
              <div className="w-16 h-16 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <p className="text-slate-600 font-medium mt-4">Chargement des mandats...</p>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-800 font-semibold mb-4">{error}</p>
            <button onClick={loadMandats} className="btn btn-danger px-5 py-2">
              Réessayer
            </button>
          </div>
        ) : filteredMandats.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">
              {mandats.length === 0
                ? "Aucun mandat pour le moment. Créez-en un depuis la fiche d'un client !"
                : "Aucun mandat ne correspond à vos critères de recherche."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMandats.map((mandat) => (
              <Link
                key={mandat.id}
                href={`/mandats/${mandat.id}`}
                className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg p-6 transition-all duration-300 hover:border-amber-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-amber-600 transition-colors">{mandat.title}</h3>
                    <span className={`badge ${
                      mandat.status === 'en_cours' ? 'badge-warning' :
                      mandat.status === 'termine' ? 'badge-success' :
                      'badge-danger'
                    }`}>
                      {MANDAT_STATUS_LABELS[mandat.status]}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center group-hover:from-amber-500 group-hover:to-orange-500 transition-all">
                    <ChevronRight className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" />
                  </div>
                </div>

                {mandat.client && (
                  <div className="flex items-center gap-2 text-slate-700 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <span className="font-medium">{mandat.client.name}</span>
                  </div>
                )}

                {mandat.mandat_type && (
                  <span className="inline-block px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg mb-3">
                    {mandat.mandat_type}
                  </span>
                )}

                {(mandat.start_date || mandat.end_date) && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {mandat.start_date && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span>Début : {new Date(mandat.start_date).toLocaleDateString("fr-FR")}</span>
                      </div>
                    )}
                    {mandat.end_date && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>Fin : {new Date(mandat.end_date).toLocaleDateString("fr-FR")}</span>
                      </div>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
