"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Plus, Search, Calendar, Receipt, Filter, RefreshCw, XCircle, TrendingDown, Eye } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Expense,
  ExpenseCategory,
  ExpenseType,
  EXPENSE_TYPE_LABELS
} from "@/types/database";
import { formatAmount } from "@/lib/expenseHelpers";

type ExpenseWithRelations = Expense & {
  category: ExpenseCategory | null;
  client: { name: string } | null;
  mandat: { title: string } | null;
};

export default function DepensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseWithRelations[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<ExpenseType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  useEffect(() => {
    loadCategories();
    loadExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, searchTerm, typeFilter, categoryFilter, monthFilter]);

  async function loadCategories() {
    const { data } = await supabase
      .from("expense_category")
      .select("*")
      .order("name");
    setCategories(data || []);
  }

  async function loadExpenses() {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("expense")
        .select(`
          *,
          category:category_id (*),
          client:client_id (name),
          mandat:mandat_id (title)
        `)
        .order("date", { ascending: false });

      if (fetchError) throw fetchError;

      setExpenses(data || []);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Erreur lors du chargement des dépenses");
    } finally {
      setIsLoading(false);
    }
  }

  function filterExpenses() {
    let filtered = [...expenses];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.label.toLowerCase().includes(term) ||
          expense.notes?.toLowerCase().includes(term)
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((expense) => expense.type === typeFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((expense) => 
        expense.category_id?.toString() === categoryFilter
      );
    }

    if (monthFilter !== "all") {
      filtered = filtered.filter((expense) => {
        const expenseMonth = new Date(expense.date).toISOString().slice(0, 7);
        return expenseMonth === monthFilter;
      });
    }

    setFilteredExpenses(filtered);
  }

  // Stats
  const stats = {
    total: expenses.reduce((sum, e) => sum + e.amount, 0),
    thisMonth: expenses
      .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
      .reduce((sum, e) => sum + e.amount, 0),
    thisYear: expenses
      .filter(e => new Date(e.date).getFullYear() === new Date().getFullYear())
      .reduce((sum, e) => sum + e.amount, 0),
    recurring: expenses.filter(e => e.is_recurring === 'mensuel').length,
  };

  return (
    <>
      <Header title="Dépenses" subtitle="Suivez vos dépenses et catégories" />
      <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-rose-200 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500">Ce mois</p>
                <p className="text-lg sm:text-2xl font-bold text-rose-600 mt-1 truncate">{formatAmount(stats.thisMonth)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500">Cette année</p>
                <p className="text-lg sm:text-2xl font-bold text-indigo-600 mt-1 truncate">{formatAmount(stats.thisYear)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-slate-500/10 to-slate-600/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500">Total</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-1 truncate">{formatAmount(stats.total)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500">Récurrentes</p>
                <p className="text-xl sm:text-3xl font-bold text-amber-600 mt-1">{stats.recurring}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {expenses.length} <span className="text-sm sm:text-base font-normal text-slate-500">dépense(s)</span>
              </p>
              {filteredExpenses.length !== expenses.length && (
                <p className="text-xs sm:text-sm text-slate-500">{filteredExpenses.length} affichée(s)</p>
              )}
            </div>
          </div>
          <Link href="/depenses/new" className="btn btn-primary px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" />
            <span>Nouvelle dépense</span>
          </Link>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm p-4 sm:p-5 mb-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Filtres</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-11"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ExpenseType | "all")}
              className="select"
            >
              <option value="all">Tous les types</option>
              <option value="yourstory">YourStory</option>
              <option value="client_mandat">Client/Mandat</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
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
              <div className="w-16 h-16 rounded-full border-4 border-rose-100 border-t-rose-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-rose-500" />
              </div>
            </div>
            <p className="text-slate-600 font-medium mt-4">Chargement des dépenses...</p>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">
              {expenses.length === 0
                ? "Aucune dépense. Créez-en une !"
                : "Aucune dépense ne correspond à vos critères."}
            </p>
            {expenses.length === 0 && (
              <Link href="/depenses/new" className="btn btn-primary px-5 py-2.5 mt-4 inline-flex">
                <Plus className="w-4 h-4" />
                Créer une dépense
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Vue mobile - Cartes */}
            <div className="lg:hidden space-y-3">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 truncate">{expense.label}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(expense.date).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-slate-900 text-lg">
                        {formatAmount(expense.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge text-xs ${expense.type === 'yourstory' ? 'badge-purple' : 'badge-info'}`}>
                      {EXPENSE_TYPE_LABELS[expense.type]}
                    </span>
                    {expense.category && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg">
                        {expense.category.name}
                      </span>
                    )}
                    {expense.is_recurring === 'mensuel' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-full">
                        <RefreshCw className="w-3 h-3" /> Récurrente
                      </span>
                    )}
                    {expense.receipt_path && (
                      <a
                        href={`/api/expenses/${expense.id}/receipt`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg"
                      >
                        <Eye className="w-3 h-3" /> Justificatif
                      </a>
                    )}
                  </div>
                  {(expense.client || expense.mandat) && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      {expense.client && <span>Client : {expense.client.name}</span>}
                      {expense.client && expense.mandat && <span> • </span>}
                      {expense.mandat && <span>Mandat : {expense.mandat.title}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Vue desktop - Tableau */}
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Libellé</th>
                    <th>Type</th>
                    <th>Catégorie</th>
                    <th className="text-right">Montant</th>
                    <th className="text-center">Justificatif</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="group">
                      <td>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{new Date(expense.date).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-slate-900">{expense.label}</div>
                        {expense.is_recurring === 'mensuel' && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-full">
                            <RefreshCw className="w-3 h-3" /> Récurrente
                          </span>
                        )}
                        {expense.client && (
                          <div className="text-sm text-slate-500 mt-1">
                            Client : {expense.client.name}
                          </div>
                        )}
                        {expense.mandat && (
                          <div className="text-sm text-slate-500">
                            Mandat : {expense.mandat.title}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${expense.type === 'yourstory' ? 'badge-purple' : 'badge-info'}`}>
                          {EXPENSE_TYPE_LABELS[expense.type]}
                        </span>
                      </td>
                      <td>
                        {expense.category ? (
                          <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg">
                            {expense.category.name}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">Sans catégorie</span>
                        )}
                      </td>
                      <td className="text-right">
                        <span className="font-bold text-slate-900">
                          {formatAmount(expense.amount)}
                        </span>
                      </td>
                      <td className="text-center">
                        {expense.receipt_path ? (
                          <a
                            href={`/api/expenses/${expense.id}/receipt`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
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
