"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Plus, Search, Mail, Phone, Building2, Users, Filter, Eye, Pencil, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Client, 
  ClientType, 
  ClientStatus,
  CLIENT_TYPE_LABELS,
  CLIENT_STATUS_LABELS
} from "@/types/database";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<ClientType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");

  // Charger les clients
  useEffect(() => {
    loadClients();
  }, []);

  // Appliquer les filtres
  useEffect(() => {
    filterClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, searchTerm, typeFilter, statusFilter]);

  async function loadClients() {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("client")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setClients(data || []);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Erreur lors du chargement des clients");
    } finally {
      setIsLoading(false);
    }
  }

  function filterClients() {
    let filtered = [...clients];

    // Recherche par nom ou email
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(term) ||
          client.email?.toLowerCase().includes(term) ||
          client.company_name?.toLowerCase().includes(term)
      );
    }

    // Filtre par type
    if (typeFilter !== "all") {
      filtered = filtered.filter((client) => client.type === typeFilter);
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((client) => client.status === statusFilter);
    }

    setFilteredClients(filtered);
  }

  return (
    <>
      <Header title="Clients" subtitle="Gérez vos clients et leurs informations" />
      <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {clients.length} <span className="text-sm sm:text-base font-normal text-slate-500">client(s)</span>
              </p>
              {filteredClients.length !== clients.length && (
                <p className="text-sm text-slate-500">
                  {filteredClients.length} affiché(s)
                </p>
              )}
            </div>
          </div>
          <Link
            href="/clients/new"
            className="btn btn-primary px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau client</span>
          </Link>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm p-4 sm:p-5 mb-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Filtres</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Recherche */}
            <div className="md:col-span-2">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-11"
                />
              </div>
            </div>

            {/* Filtre Type */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ClientType | "all")}
                className="select"
              >
                <option value="all">Tous les types</option>
                <option value="oneshot">One-shot</option>
                <option value="mensuel">Mensuel</option>
              </select>
            </div>

            {/* Filtre Statut */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ClientStatus | "all")}
                className="select"
              >
                <option value="all">Tous les statuts</option>
                <option value="actif">Actif</option>
                <option value="potentiel">Potentiel</option>
                <option value="pause">Pause</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contenu */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center">
            <div className="relative inline-flex">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-500" />
              </div>
            </div>
            <p className="text-slate-600 font-medium text-base mt-4">Chargement des clients...</p>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-800 font-semibold text-base mb-4">{error}</p>
            <button
              onClick={loadClients}
              className="btn btn-danger px-5 py-2"
            >
              Réessayer
            </button>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium text-base">
              {clients.length === 0
                ? "Aucun client pour le moment. Créez-en un !"
                : "Aucun client ne correspond à vos critères de recherche."}
            </p>
            {clients.length === 0 && (
              <Link href="/clients/new" className="btn btn-primary px-5 py-2.5 mt-4 inline-flex">
                <Plus className="w-4 h-4" />
                Créer un client
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Vue mobile - Cartes */}
            <div className="lg:hidden space-y-3">
              {filteredClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="block bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 hover:shadow-md hover:border-blue-200 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm flex-shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 truncate">{client.name}</div>
                      {client.company_name && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{client.company_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`badge text-xs ${client.type === 'mensuel' ? 'badge-purple' : 'badge-info'}`}>
                      {CLIENT_TYPE_LABELS[client.type]}
                    </span>
                    <span className={`badge text-xs ${
                      client.status === 'actif' ? 'badge-success' :
                      client.status === 'potentiel' ? 'badge-warning' :
                      client.status === 'pause' ? 'badge-slate' :
                      'badge-danger'
                    }`}>
                      {CLIENT_STATUS_LABELS[client.status]}
                    </span>
                  </div>
                  {(client.email || client.phone) && (
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      {client.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Vue desktop - Tableau */}
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Contact</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="group">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/clients/${client.id}`}
                              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                            >
                              {client.name}
                            </Link>
                            {client.company_name && (
                              <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                                <Building2 className="w-3.5 h-3.5" />
                                {client.company_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${client.type === 'mensuel' ? 'badge-purple' : 'badge-info'}`}>
                          {CLIENT_TYPE_LABELS[client.type]}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          client.status === 'actif' ? 'badge-success' :
                          client.status === 'potentiel' ? 'badge-warning' :
                          client.status === 'pause' ? 'badge-slate' :
                          'badge-danger'
                        }`}>
                          {CLIENT_STATUS_LABELS[client.status]}
                        </span>
                      </td>
                      <td>
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <a href={`mailto:${client.email}`} className="hover:text-indigo-600 transition-colors">
                                {client.email}
                              </a>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <a href={`tel:${client.phone}`} className="hover:text-indigo-600 transition-colors">
                                {client.phone}
                              </a>
                            </div>
                          )}
                          {!client.email && !client.phone && (
                            <span className="text-sm text-slate-400">Aucun contact</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/clients/${client.id}`}
                            className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            title="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/clients/${client.id}/edit`}
                            className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/clients/${client.id}`}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}
