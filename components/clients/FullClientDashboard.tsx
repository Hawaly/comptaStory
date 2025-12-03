"use client";

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  FileText, 
  Receipt, 
  Briefcase,
  Calendar,
  Activity,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  BarChart3,
  PieChart,
  Users,
  Layers
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import type { Client, SocialMediaStrategy, Mandat, Invoice } from '@/types/database';

interface FullClientDashboardProps {
  client: Client;
}

interface DashboardData {
  strategies: SocialMediaStrategy[];
  mandats: Mandat[];
  factures: Invoice[];
  depenses: any[];
  contracts: any[];
}

interface TimelineItem {
  id: string;
  type: 'strategy' | 'mandat' | 'facture' | 'contract';
  title: string;
  subtitle: string;
  date: Date;
  status: string;
  amount?: number;
  icon: any;
  color: string;
}

export function FullClientDashboard({ client }: FullClientDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [client.id]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Charger toutes les données en parallèle
      const [strategiesRes, mandatsRes, facturesRes, depensesRes, contractsRes] = await Promise.all([
        supabase
          .from('social_media_strategy')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('mandat')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('invoice')
          .select('*')
          .eq('client_id', client.id)
          .order('issue_date', { ascending: false }),
        supabase
          .from('expense')
          .select('*')
          .eq('client_id', client.id)
          .order('date', { ascending: false }),
        supabase
          .from('contract')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
      ]);

      const dashboardData: DashboardData = {
        strategies: strategiesRes.data || [],
        mandats: mandatsRes.data || [],
        factures: facturesRes.data || [],
        depenses: depensesRes.data || [],
        contracts: contractsRes.data || [],
      };

      setData(dashboardData);
      buildTimeline(dashboardData);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildTimeline = (dashboardData: DashboardData) => {
    const items: TimelineItem[] = [];

    // Ajouter stratégies
    dashboardData.strategies.slice(0, 3).forEach(strategy => {
      items.push({
        id: `strategy-${strategy.id}`,
        type: 'strategy',
        title: `Stratégie v${strategy.version}`,
        subtitle: strategy.contexte_general?.substring(0, 80) || 'Stratégie social media',
        date: new Date(strategy.created_at),
        status: strategy.status,
        icon: Target,
        color: 'orange'
      });
    });

    // Ajouter mandats
    dashboardData.mandats.slice(0, 3).forEach(mandat => {
      items.push({
        id: `mandat-${mandat.id}`,
        type: 'mandat',
        title: mandat.title,
        subtitle: mandat.description?.substring(0, 80) || 'Nouveau mandat',
        date: new Date(mandat.created_at),
        status: mandat.status,
        icon: Briefcase,
        color: 'blue'
      });
    });

    // Ajouter factures
    dashboardData.factures.slice(0, 3).forEach(facture => {
      items.push({
        id: `facture-${facture.id}`,
        type: 'facture',
        title: `Facture ${facture.invoice_number}`,
        subtitle: `${facture.total_ttc?.toLocaleString('fr-CH')} CHF`,
        date: new Date(facture.issue_date),
        status: facture.status,
        amount: facture.total_ttc,
        icon: FileText,
        color: 'purple'
      });
    });

    // Trier par date décroissante
    items.sort((a, b) => b.date.getTime() - a.date.getTime());
    setTimelineItems(items.slice(0, 8));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!data) return null;

  // Calculs statistiques
  const stats = {
    strategies: {
      total: data.strategies.length,
      active: data.strategies.filter(s => s.status === 'actif').length,
      draft: data.strategies.filter(s => s.status === 'brouillon').length,
    },
    mandats: {
      total: data.mandats.length,
      enCours: data.mandats.filter(m => m.status === 'en_cours').length,
      termine: data.mandats.filter(m => m.status === 'termine').length,
    },
    factures: {
      total: data.factures.length,
      montantTotal: data.factures.reduce((sum, f) => sum + (f.total_ttc || 0), 0),
      payees: data.factures.filter(f => f.status === 'payee').length,
      enAttente: data.factures.filter(f => f.status === 'envoyee').length,
      annulees: data.factures.filter(f => f.status === 'annulee').length,
    },
    depenses: {
      total: data.depenses.length,
      montantTotal: data.depenses.reduce((sum, d) => sum + (d.amount || 0), 0),
    },
  };

  const revenuNet = stats.factures.montantTotal - stats.depenses.montantTotal;
  const tauxPaiement = stats.factures.total > 0 
    ? (stats.factures.payees / stats.factures.total) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* En-tête Dashboard */}
      <div className="bg-gradient-to-r from-brand-orange via-brand-orange-light to-yellow-400 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{client.name}</h1>
            {client.company_name && (
              <p className="text-xl text-white/90">{client.company_name}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              {client.email && (
                <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                  <FileText className="w-4 h-4" />
                  {client.email}
                </span>
              )}
              {client.phone && (
                <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                  <Activity className="w-4 h-4" />
                  {client.phone}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link
              href={`/clients/${client.id}/strategies`}
              className="flex items-center gap-2 px-6 py-3 bg-white text-brand-orange rounded-xl font-bold hover:shadow-xl transition-all"
            >
              <Target className="w-5 h-5" />
              Stratégies
            </Link>
            <Link
              href={`/clients/${client.id}`}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition-all"
            >
              <Eye className="w-5 h-5" />
              Vue Détaillée
            </Link>
          </div>
        </div>
      </div>

      {/* Cartes Statistiques Principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stratégies */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 hover:shadow-2xl transition-all cursor-pointer group">
          <Link href={`/clients/${client.id}/strategies`} className="block">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Target className="w-8 h-8" />
                </div>
                <ArrowUpRight className="w-6 h-6 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-sm font-semibold mb-2 text-white/90">Stratégies Social Media</h3>
              <div className="text-4xl font-bold mb-2">{stats.strategies.total}</div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {stats.strategies.active} actives
                </span>
                <span className="flex items-center gap-1 text-white/70">
                  {stats.strategies.draft} brouillons
                </span>
              </div>
            </div>
          </Link>
        </Card>

        {/* Mandats */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 hover:shadow-2xl transition-all cursor-pointer group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Briefcase className="w-8 h-8" />
              </div>
              <TrendingUp className="w-6 h-6 opacity-50" />
            </div>
            <h3 className="text-sm font-semibold mb-2 text-white/90">Mandats</h3>
            <div className="text-4xl font-bold mb-2">{stats.mandats.total}</div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                {stats.mandats.enCours} en cours
              </span>
              <span className="text-white/70">
                {stats.mandats.termine} terminés
              </span>
            </div>
          </div>
        </Card>

        {/* Revenus */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 hover:shadow-2xl transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <DollarSign className="w-8 h-8" />
              </div>
              {revenuNet > 0 ? (
                <ArrowUpRight className="w-6 h-6 text-green-200" />
              ) : (
                <ArrowDownRight className="w-6 h-6 text-red-200" />
              )}
            </div>
            <h3 className="text-sm font-semibold mb-2 text-white/90">Revenu Net</h3>
            <div className="text-4xl font-bold mb-2">
              {revenuNet.toLocaleString('fr-CH')}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-white/90">
                {stats.factures.montantTotal.toLocaleString('fr-CH')} CHF facturé
              </span>
            </div>
          </div>
        </Card>

        {/* Factures */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 hover:shadow-2xl transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <FileText className="w-8 h-8" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{Math.round(tauxPaiement)}%</div>
                <div className="text-xs text-white/70">payées</div>
              </div>
            </div>
            <h3 className="text-sm font-semibold mb-2 text-white/90">Factures</h3>
            <div className="text-4xl font-bold mb-2">{stats.factures.total}</div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {stats.factures.payees}
              </span>
              {stats.factures.annulees > 0 && (
                <span className="flex items-center gap-1 text-red-200">
                  <AlertCircle className="w-4 h-4" />
                  {stats.factures.annulees} annulées
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Grille principale */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline - 2 colonnes */}
        <div className="lg:col-span-2">
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-orange/10 rounded-xl">
                  <Activity className="w-6 h-6 text-brand-orange" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Activité Récente</h2>
              </div>
            </div>

            <div className="space-y-4">
              {timelineItems.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Aucune activité récente</p>
                </div>
              ) : (
                timelineItems.map((item) => {
                  const Icon = item.icon;
                  const colorClasses = {
                    orange: 'bg-orange-100 text-orange-700 border-orange-200',
                    blue: 'bg-blue-100 text-blue-700 border-blue-200',
                    purple: 'bg-purple-100 text-purple-700 border-purple-200',
                    green: 'bg-green-100 text-green-700 border-green-200',
                  };

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-gray-200"
                    >
                      <div className={`p-2 rounded-xl ${colorClasses[item.color as keyof typeof colorClasses]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{item.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-1">{item.subtitle}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.date.toLocaleDateString('fr-FR')}
                          </span>
                          {item.amount && (
                            <span className="font-semibold text-gray-700">
                              {item.amount.toLocaleString('fr-CH')} CHF
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'actif' || item.status === 'en_cours' || item.status === 'payee'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'brouillon' || item.status === 'envoyee'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Actions Rapides - 1 colonne */}
        <div className="space-y-6">
          {/* Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Actions Rapides</h3>
            <div className="space-y-3">
              <Link
                href={`/clients/${client.id}/strategies/new`}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-brand-orange to-brand-orange-light text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <Plus className="w-5 h-5" />
                </div>
                <span>Nouvelle Stratégie</span>
              </Link>

              <Link
                href={`/mandats/new?client=${client.id}`}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span>Nouveau Mandat</span>
              </Link>

              <Link
                href={`/factures/new?client=${client.id}`}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <span>Nouvelle Facture</span>
              </Link>

              <Link
                href={`/expenses/new?client=${client.id}`}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <Receipt className="w-5 h-5" />
                </div>
                <span>Nouvelle Dépense</span>
              </Link>
            </div>
          </Card>

          {/* Statut général */}
          <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Statut Général</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 font-medium">Stratégies actives</span>
                  <span className="font-bold text-brand-orange">
                    {stats.strategies.active}/{stats.strategies.total}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-orange to-brand-orange-light transition-all"
                    style={{ width: `${stats.strategies.total > 0 ? (stats.strategies.active / stats.strategies.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 font-medium">Mandats en cours</span>
                  <span className="font-bold text-blue-600">
                    {stats.mandats.enCours}/{stats.mandats.total}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                    style={{ width: `${stats.mandats.total > 0 ? (stats.mandats.enCours / stats.mandats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 font-medium">Factures payées</span>
                  <span className="font-bold text-green-600">
                    {stats.factures.payees}/{stats.factures.total}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                    style={{ width: `${tauxPaiement}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Aperçus détaillés */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stratégies Récentes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Stratégies Actives</h3>
            <Link
              href={`/clients/${client.id}/strategies`}
              className="text-brand-orange font-semibold text-sm hover:underline"
            >
              Voir tout →
            </Link>
          </div>
          <div className="space-y-3">
            {data.strategies.slice(0, 3).length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune stratégie</p>
              </div>
            ) : (
              data.strategies.slice(0, 3).map((strategy) => (
                <Link
                  key={strategy.id}
                  href={`/clients/${client.id}/strategies`}
                  className="block p-4 bg-gray-50 rounded-xl hover:bg-brand-orange/10 hover:border-brand-orange border-2 border-transparent transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">Stratégie v{strategy.version}</h4>
                      <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                        {strategy.contexte_general || 'Stratégie social media'}
                      </p>
                      {strategy.plateformes && strategy.plateformes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {strategy.plateformes.slice(0, 3).map((platform, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${
                      strategy.status === 'actif'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {strategy.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Factures Récentes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Factures Récentes</h3>
            <Link
              href={`/factures?client=${client.id}`}
              className="text-purple-600 font-semibold text-sm hover:underline"
            >
              Voir tout →
            </Link>
          </div>
          <div className="space-y-3">
            {data.factures.slice(0, 3).length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune facture</p>
              </div>
            ) : (
              data.factures.slice(0, 3).map((facture) => (
                <div
                  key={facture.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-purple-50 border-2 border-transparent hover:border-purple-200 transition-all"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">Facture {facture.invoice_number}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(facture.issue_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {facture.total_ttc?.toLocaleString('fr-CH')} CHF
                    </div>
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                      facture.status === 'payee'
                        ? 'bg-green-100 text-green-700'
                        : facture.status === 'annulee'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {facture.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
