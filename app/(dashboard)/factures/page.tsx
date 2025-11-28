"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Plus, Search, Calendar, User, FileText, Filter, Eye, Send, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Invoice,
  InvoiceStatus,
  INVOICE_STATUS_LABELS
} from "@/types/database";
import { formatCurrency } from "@/lib/invoiceHelpers";

type InvoiceWithClient = Invoice & {
  client: {
    name: string;
  } | null;
};

export default function FacturesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, searchTerm, statusFilter, monthFilter]);

  async function loadInvoices() {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("invoice")
        .select(`
          *,
          client:client_id (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setInvoices(data || []);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Erreur lors du chargement des factures");
    } finally {
      setIsLoading(false);
    }
  }

  function filterInvoices() {
    let filtered = [...invoices];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoice_number.toLowerCase().includes(term) ||
          invoice.client?.name.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    if (monthFilter !== "all") {
      filtered = filtered.filter((invoice) => {
        const invoiceMonth = new Date(invoice.issue_date).toISOString().slice(0, 7);
        return invoiceMonth === monthFilter;
      });
    }

    setFilteredInvoices(filtered);
  }

  // Calculer les stats
  const stats = {
    total: invoices.length,
    brouillon: invoices.filter(i => i.status === 'brouillon').length,
    envoyee: invoices.filter(i => i.status === 'envoyee').length,
    payee: invoices.filter(i => i.status === 'payee').length,
    totalARecevoir: invoices
      .filter(i => i.status === 'envoyee')
      .reduce((sum, i) => sum + i.total_ttc, 0),
  };

  return (
    <>
      <Header title="Factures" subtitle="Gérez vos factures et suivez les paiements" />
      <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-slate-500/10 to-slate-600/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500">Brouillons</p>
                <p className="text-xl sm:text-3xl font-bold text-slate-900 mt-1">{stats.brouillon}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500">Envoyées</p>
                <p className="text-xl sm:text-3xl font-bold text-amber-600 mt-1">{stats.envoyee}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500">Payées</p>
                <p className="text-xl sm:text-3xl font-bold text-emerald-600 mt-1">{stats.payee}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500">À recevoir</p>
                <p className="text-lg sm:text-2xl font-bold text-indigo-600 mt-1 truncate">{formatCurrency(stats.totalARecevoir)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {stats.total} <span className="text-sm sm:text-base font-normal text-slate-500">facture(s)</span>
              </p>
              {filteredInvoices.length !== invoices.length && (
                <p className="text-xs sm:text-sm text-slate-500">{filteredInvoices.length} affichée(s)</p>
              )}
            </div>
          </div>
          <Link href="/factures/new" className="btn btn-primary px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" />
            <span>Nouvelle facture</span>
          </Link>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm p-4 sm:p-5 mb-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Filtres</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher par numéro ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-11"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "all")}
              className="select"
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="envoyee">Envoyée</option>
              <option value="payee">Payée</option>
              <option value="annulee">Annulée</option>
            </select>

            <input
              type="month"
              value={monthFilter === "all" ? "" : monthFilter}
              onChange={(e) => setMonthFilter(e.target.value || "all")}
              className="input"
            />
          </div>
        </div>

        {/* Liste */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center">
            <div className="relative inline-flex">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-500" />
              </div>
            </div>
            <p className="text-slate-600 font-medium mt-4">Chargement des factures...</p>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">
              {invoices.length === 0
                ? "Aucune facture. Créez-en une !"
                : "Aucune facture ne correspond à vos critères."}
            </p>
            {invoices.length === 0 && (
              <Link href="/factures/new" className="btn btn-primary px-5 py-2.5 mt-4 inline-flex">
                <Plus className="w-4 h-4" />
                Créer une facture
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Vue mobile - Cartes */}
            <div className="lg:hidden space-y-3">
              {filteredInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/factures/${invoice.id}`}
                  className="block bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900">{invoice.invoice_number}</div>
                      {invoice.client && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                          <User className="w-3 h-3" />
                          <span className="truncate">{invoice.client.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-slate-900">
                        {formatCurrency(invoice.total_ttc)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(invoice.issue_date).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <span className={`badge text-xs ${
                      invoice.status === 'payee' ? 'badge-success' :
                      invoice.status === 'envoyee' ? 'badge-warning' :
                      invoice.status === 'annulee' ? 'badge-danger' :
                      'badge-slate'
                    }`}>
                      {INVOICE_STATUS_LABELS[invoice.status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Vue desktop - Tableau */}
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th className="text-right">Montant TTC</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="group">
                      <td>
                        <Link
                          href={`/factures/${invoice.id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td>
                        {invoice.client && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                              {invoice.client.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{invoice.client.name}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{new Date(invoice.issue_date).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          invoice.status === 'payee' ? 'badge-success' :
                          invoice.status === 'envoyee' ? 'badge-warning' :
                          invoice.status === 'annulee' ? 'badge-danger' :
                          'badge-slate'
                        }`}>
                          {INVOICE_STATUS_LABELS[invoice.status]}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(invoice.total_ttc)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/factures/${invoice.id}`}
                            className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            title="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/factures/${invoice.id}`}
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
