"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  FileText,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PieChart,
  RefreshCw,
  Clock,
  Users,
  Plus,
  ChevronRight
} from "lucide-react";
import { Invoice, Expense, ExpenseCategory } from "@/types/database";
import { 
  getPaidInvoices,
  getExpenses,
  getUnpaidInvoices,
  getRecurringExpenses,
  calculateKPIs,
  aggregateRevenueByClient,
  aggregateExpensesByCategory,
  getMonthRange,
  getYearRange
} from "@/lib/dashboardStats";
import { formatAmount } from "@/lib/expenseHelpers";
import Link from "next/link";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // KPIs
  const [monthKPIs, setMonthKPIs] = useState({ revenue: 0, expenses: 0, profit: 0, invoiceCount: 0, expenseCount: 0 });
  const [yearKPIs, setYearKPIs] = useState({ revenue: 0, expenses: 0, profit: 0, invoiceCount: 0, expenseCount: 0 });

  // Données pour visualisations
  const [topClients, setTopClients] = useState<{ name: string; total: number }[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<{ name: string; total: number }[]>([]);
  const [upcomingInvoices, setUpcomingInvoices] = useState<Array<{
    id: number;
    invoice_number: string;
    total_ttc: number;
    due_date: string | null;
    client: { name: string } | null;
  }>>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<Array<{
    id: number;
    label: string;
    amount: number;
    category: { name: string } | null;
  }>>([]);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth]);

  async function loadDashboardData() {
    setIsLoading(true);

    try {
      // Calculer les plages de dates
      const monthRange = getMonthRange(selectedYear, selectedMonth);
      const yearRange = getYearRange(selectedYear);

      // Charger les données en parallèle
      const [
        monthInvoices,
        yearInvoices,
        monthExpenses,
        yearExpenses,
        unpaid,
        recurring,
      ] = await Promise.all([
        getPaidInvoices(monthRange.startDate, monthRange.endDate),
        getPaidInvoices(yearRange.startDate, yearRange.endDate),
        getExpenses(monthRange.startDate, monthRange.endDate),
        getExpenses(yearRange.startDate, yearRange.endDate),
        getUnpaidInvoices(),
        getRecurringExpenses(),
      ]);

      // Calculer les KPIs
      setMonthKPIs(calculateKPIs(monthInvoices, monthExpenses));
      setYearKPIs(calculateKPIs(yearInvoices, yearExpenses));

      // Top clients (sur l'année)
      const clientInvoices = yearInvoices.filter(inv => inv.client !== null) as Array<Invoice & { client: { id: number; name: string } }>;
      setTopClients(aggregateRevenueByClient(clientInvoices, 5));

      // Dépenses par catégorie (sur l'année)
      const categorizedExpenses = yearExpenses as Array<Expense & { category: ExpenseCategory | null }>;
      setExpensesByCategory(aggregateExpensesByCategory(categorizedExpenses));

      // Prochains paiements
      setUpcomingInvoices(unpaid.slice(0, 10));

      // Dépenses récurrentes
      setRecurringExpenses(recurring);

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <>
        <Header title="Dashboard" subtitle="Vue d'ensemble de votre activité" />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-indigo-500" />
              </div>
            </div>
            <p className="text-slate-500 font-medium">Chargement des données...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Dashboard" subtitle="Vue d'ensemble de votre activité" />
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fade-in">
        {/* Sélecteur de période */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Vue comptable
            </h2>
            <p className="text-sm text-slate-500 mt-1 capitalize">{monthName}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="select"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2024, i).toLocaleDateString('fr-FR', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="select"
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPIs du mois */}
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Ce mois</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {/* Revenus */}
            <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-xs sm:text-sm font-medium text-slate-600">CA (Payé)</span>
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">
                  {formatAmount(monthKPIs.revenue)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 sm:mt-3">
                  <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-emerald-50 text-emerald-600">
                    <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="text-xs font-semibold">{monthKPIs.invoiceCount}</span>
                  </div>
                  <span className="text-xs text-slate-500 hidden sm:inline">facture(s)</span>
                </div>
              </div>
            </div>

            {/* Dépenses */}
            <div className="group relative bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-rose-200 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-600">Dépenses</span>
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {formatAmount(monthKPIs.expenses)}
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-50 text-rose-600">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{monthKPIs.expenseCount}</span>
                  </div>
                  <span className="text-xs text-slate-500">dépense(s)</span>
                </div>
              </div>
            </div>

            {/* Bénéfice */}
            <div className={`group relative bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${
              monthKPIs.profit >= 0 ? 'hover:border-indigo-200' : 'hover:border-amber-200'
            }`}>
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 ${
                monthKPIs.profit >= 0 ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10' : 'bg-gradient-to-br from-amber-500/10 to-orange-500/10'
              }`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-600">Bénéfice</span>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl shadow-lg group-hover:scale-110 transition-transform ${
                    monthKPIs.profit >= 0 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-indigo-500/20' 
                      : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20'
                  }`}>
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {formatAmount(monthKPIs.profit)}
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    monthKPIs.profit >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {monthKPIs.profit >= 0 ? 'Positif' : 'Négatif'}
                  </span>
                </div>
              </div>
            </div>

            {/* Marge */}
            <div className="group relative bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-violet-200 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-600">Marge</span>
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {monthKPIs.revenue > 0 
                    ? ((monthKPIs.profit / monthKPIs.revenue) * 100).toFixed(1)
                    : '0.0'}%
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <span className="px-2 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-semibold">
                    Rentabilité
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs de l'année */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Bilan Annuel {selectedYear}</h3>
                <p className="text-sm text-slate-400">Récapitulatif de l&apos;année</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-slate-300">CA Total</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {formatAmount(yearKPIs.revenue)}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-medium text-slate-300">Dépenses</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {formatAmount(yearKPIs.expenses)}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className={`w-4 h-4 ${yearKPIs.profit >= 0 ? 'text-indigo-400' : 'text-amber-400'}`} />
                <span className="text-sm font-medium text-slate-300">Bénéfice</span>
              </div>
              <div className={`text-3xl font-bold ${yearKPIs.profit >= 0 ? 'text-white' : 'text-amber-400'}`}>
                {formatAmount(yearKPIs.profit)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top clients */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Top Clients</h3>
                  <p className="text-xs text-slate-500">CA {selectedYear}</p>
                </div>
              </div>
              <Link href="/clients" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Voir tout <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {topClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Users className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topClients.map((client, index) => {
                  const maxTotal = topClients[0]?.total || 1;
                  const percentage = (client.total / maxTotal) * 100;
                  const colors = ['from-blue-500 to-cyan-500', 'from-indigo-500 to-purple-500', 'from-violet-500 to-purple-500', 'from-fuchsia-500 to-pink-500', 'from-rose-500 to-red-500'];

                  return (
                    <div key={index} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">{client.name}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          {formatAmount(client.total)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${colors[index % colors.length]} h-full rounded-full transition-all duration-700 ease-out`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dépenses par catégorie */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Dépenses</h3>
                  <p className="text-xs text-slate-500">Par catégorie {selectedYear}</p>
                </div>
              </div>
              <Link href="/depenses" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Voir tout <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {expensesByCategory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <PieChart className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expensesByCategory.map((category, index) => {
                  const maxTotal = expensesByCategory[0]?.total || 1;
                  const percentage = (category.total / maxTotal) * 100;
                  const colors = ['from-rose-500 to-pink-500', 'from-orange-500 to-amber-500', 'from-amber-500 to-yellow-500', 'from-lime-500 to-green-500', 'from-teal-500 to-cyan-500'];

                  return (
                    <div key={index} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">{category.name}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          {formatAmount(category.total)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${colors[index % colors.length]} h-full rounded-full transition-all duration-700 ease-out`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prochains paiements */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Factures en attente</h3>
                  <p className="text-xs text-slate-500">{upcomingInvoices.length} facture(s)</p>
                </div>
              </div>
              <Link href="/factures" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Voir tout <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {upcomingInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <FileText className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">Aucune facture en attente</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {upcomingInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/factures/${invoice.id}`}
                    className="block p-4 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-xl border border-amber-200/60 transition-all duration-200 group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">{invoice.invoice_number}</h4>
                        {invoice.client && (
                          <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                            <User className="w-3 h-3" />
                            {invoice.client.name}
                          </p>
                        )}
                        {invoice.due_date && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            Échéance : {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-amber-600 text-lg">
                          {formatAmount(invoice.total_ttc)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Total à recevoir</span>
                <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {formatAmount(upcomingInvoices.reduce((sum, inv) => sum + inv.total_ttc, 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Abonnements récurrents */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Dépenses Récurrentes</h3>
                  <p className="text-xs text-slate-500">Mensuelles</p>
                </div>
              </div>
            </div>
            {recurringExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <RefreshCw className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">Aucune dépense récurrente</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {recurringExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200/60"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900">{expense.label}</h4>
                        {expense.category && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                            {expense.category.name}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-indigo-600 text-lg">
                          {formatAmount(expense.amount)}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          /mois
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Total mensuel</span>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {formatAmount(recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Actions rapides</h3>
                <p className="text-sm text-white/70">Accès direct à vos tâches courantes</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/factures/new"
                className="group flex flex-col items-center gap-3 p-5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/30 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-colors group-hover:scale-110 duration-200">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-white text-center">Nouvelle facture</span>
              </Link>
              
              <Link
                href="/depenses/new"
                className="group flex flex-col items-center gap-3 p-5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/30 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-colors group-hover:scale-110 duration-200">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-white text-center">Nouvelle dépense</span>
              </Link>
              
              <Link
                href="/clients"
                className="group flex flex-col items-center gap-3 p-5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/30 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-colors group-hover:scale-110 duration-200">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-white text-center">Voir clients</span>
              </Link>
              
              <Link
                href="/factures"
                className="group flex flex-col items-center gap-3 p-5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/30 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-colors group-hover:scale-110 duration-200">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-white text-center">Toutes factures</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
