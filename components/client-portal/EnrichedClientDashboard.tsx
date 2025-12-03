"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import {
  Target,
  FileText,
  Receipt,
  Briefcase,
  Calendar,
  LogOut,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  TrendingUp,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Zap,
  DollarSign,
  Users,
  MessageSquare,
  Bell,
  ChevronRight,
  ExternalLink,
  Info,
  TrendingDown,
  Filter,
  Search,
  Calendar as CalendarIcon,
  Globe,
  Hash,
  Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';
import type { SocialMediaStrategy, Invoice, Mandat } from '@/types/database';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  role_code: string;
  role_name: string;
  role_id: number; // 1 = admin, 2 = client, 3 = staff
  client_id?: number;
  client_name?: string;
}

interface ClientPortalDashboardProps {
  user: User;
}

interface ClientData {
  strategies: SocialMediaStrategy[];
  invoices: Invoice[];
  mandats: Mandat[];
  clientInfo?: any;
}

interface ActivityItem {
  id: string;
  type: 'strategy' | 'invoice' | 'mandat';
  action: string;
  date: string;
  description: string;
}

export function EnrichedClientDashboard({ user }: ClientPortalDashboardProps) {
  const [data, setData] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'strategies' | 'invoices' | 'mandats' | 'profile'>('overview');
  const { logout } = useAuth();

  useEffect(() => {
    if (user.client_id) {
      loadClientData();
    }
  }, [user.client_id]);

  const loadClientData = async () => {
    if (!user.client_id) return;

    setIsLoading(true);
    try {
      const [strategiesRes, invoicesRes, mandatsRes, clientRes] = await Promise.all([
        supabase
          .from('social_media_strategy')
          .select('*')
          .eq('client_id', user.client_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('invoice')
          .select('*')
          .eq('client_id', user.client_id)
          .order('issue_date', { ascending: false }),
        supabase
          .from('mandat')
          .select('*')
          .eq('client_id', user.client_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('client')
          .select('*')
          .eq('id', user.client_id)
          .single()
      ]);

      setData({
        strategies: strategiesRes.data || [],
        invoices: invoicesRes.data || [],
        mandats: mandatsRes.data || [],
        clientInfo: clientRes.data
      });
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // =========================================================
  // CALCULS STATISTIQUES
  // =========================================================

  const stats = {
    strategies: {
      total: data.strategies.length,
      active: data.strategies.filter(s => s.status === 'actif').length,
      brouillon: data.strategies.filter(s => s.status === 'brouillon').length,
      archive: data.strategies.filter(s => s.status === 'archive').length,
    },
    mandats: {
      total: data.mandats.length,
      enCours: data.mandats.filter(m => m.status === 'en_cours').length,
      termine: data.mandats.filter(m => m.status === 'termine').length,
      annule: data.mandats.filter(m => m.status === 'annule').length,
    },
    invoices: {
      total: data.invoices.length,
      montantTotal: data.invoices.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0),
      montantPaye: data.invoices
        .filter(inv => inv.status === 'payee')
        .reduce((sum, inv) => sum + (inv.total_ttc || 0), 0),
      montantEnAttente: data.invoices
        .filter(inv => inv.status === 'envoyee')
        .reduce((sum, inv) => sum + (inv.total_ttc || 0), 0),
      payees: data.invoices.filter(inv => inv.status === 'payee').length,
      enAttente: data.invoices.filter(inv => inv.status === 'envoyee').length,
      brouillon: data.invoices.filter(inv => inv.status === 'brouillon').length,
    }
  };

  // Timeline d'activité (simulation basée sur les dates)
  const generateActivityTimeline = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // Ajouter stratégies
    data.strategies.slice(0, 3).forEach(strat => {
      activities.push({
        id: `strat-${strat.id}`,
        type: 'strategy',
        action: 'Stratégie créée',
        date: strat.created_at,
        description: `Stratégie social media v${strat.version}`
      });
    });

    // Ajouter factures
    data.invoices.slice(0, 3).forEach(inv => {
      activities.push({
        id: `inv-${inv.id}`,
        type: 'invoice',
        action: inv.status === 'payee' ? 'Facture payée' : 'Facture émise',
        date: inv.issue_date,
        description: `Facture ${inv.invoice_number} - ${inv.total_ttc} CHF`
      });
    });

    // Ajouter mandats
    data.mandats.slice(0, 2).forEach(mandat => {
      activities.push({
        id: `mandat-${mandat.id}`,
        type: 'mandat',
        action: 'Mandat démarré',
        date: mandat.created_at,
        description: mandat.title
      });
    });

    // Trier par date décroissante
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
  };

  const activityTimeline = generateActivityTimeline();

  // Plateformes utilisées (depuis toutes les stratégies)
  const allPlatforms = data.strategies
    .filter(s => s.plateformes)
    .flatMap(s => s.plateformes);
  const uniquePlatforms = Array.from(new Set(allPlatforms)).filter(p => p !== null) as string[];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      {/* ========== HEADER ========== */}
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-50 shadow-md backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Espace Client
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {user.client_name || user.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
              { id: 'strategies', label: 'Stratégies', icon: Target },
              { id: 'invoices', label: 'Factures', icon: FileText },
              { id: 'mandats', label: 'Mandats', icon: Briefcase },
              { id: 'profile', label: 'Profil', icon: UserIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ========== TAB: VUE D'ENSEMBLE ========== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Bienvenue */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-xl">
              <h2 className="text-3xl font-bold mb-2">
                👋 Bienvenue, {user.client_name?.split(' ')[0] || 'Client'} !
              </h2>
              <p className="text-white/90 mb-4">
                Voici un aperçu complet de vos projets, factures et documents
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="text-xs text-white/80">Depuis</div>
                  <div className="font-bold">{data.clientInfo?.created_at ? new Date(data.clientInfo.created_at).toLocaleDateString('fr-FR') : 'N/A'}</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="text-xs text-white/80">Statut</div>
                  <div className="font-bold capitalize">{data.clientInfo?.status || 'Actif'}</div>
                </div>
              </div>
            </div>

            {/* Cartes statistiques - 4 colonnes */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Stratégies */}
              <Card className="p-6 bg-gradient-to-br from-orange-500 to-red-600 text-white hover:shadow-2xl transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold">{stats.strategies.total}</div>
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-2">Stratégies Social Media</h3>
                <div className="flex items-center gap-2 text-xs text-white/90">
                  <CheckCircle className="w-4 h-4" />
                  <span>{stats.strategies.active} active{stats.strategies.active > 1 ? 's' : ''}</span>
                </div>
              </Card>

              {/* Mandats */}
              <Card className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-2xl transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold">{stats.mandats.total}</div>
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-2">Mandats</h3>
                <div className="flex items-center gap-2 text-xs text-white/90">
                  <Clock className="w-4 h-4" />
                  <span>{stats.mandats.enCours} en cours</span>
                </div>
              </Card>

              {/* Factures */}
              <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:shadow-2xl transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold">{stats.invoices.total}</div>
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-2">Factures</h3>
                <div className="flex items-center gap-2 text-xs text-white/90">
                  <CheckCircle className="w-4 h-4" />
                  <span>{stats.invoices.payees} payée{stats.invoices.payees > 1 ? 's' : ''}</span>
                </div>
              </Card>

              {/* Montant Total */}
              <Card className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:shadow-2xl transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-2">Montant Total Facturé</h3>
                <div className="text-3xl font-bold mb-1">
                  {stats.invoices.montantTotal.toLocaleString('fr-CH')}
                </div>
                <p className="text-xs text-white/90">CHF TTC</p>
              </Card>
            </div>

            {/* Statistiques détaillées */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Répartition Factures */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  Répartition Factures
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Payées</span>
                    </div>
                    <div className="font-bold text-gray-900">{stats.invoices.payees}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">En attente</span>
                    </div>
                    <div className="font-bold text-gray-900">{stats.invoices.enAttente}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">Brouillon</span>
                    </div>
                    <div className="font-bold text-gray-900">{stats.invoices.brouillon}</div>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Montant payé</span>
                      <span className="font-bold text-green-600">{stats.invoices.montantPaye.toLocaleString('fr-CH')} CHF</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Montant en attente</span>
                      <span className="font-bold text-yellow-600">{stats.invoices.montantEnAttente.toLocaleString('fr-CH')} CHF</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Plateformes Sociales */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Plateformes Utilisées
                </h3>
                {uniquePlatforms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {uniquePlatforms.map((platform, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucune plateforme configurée</p>
                )}
              </Card>

              {/* Aperçu Rapide */}
              <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Aperçu Rapide
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Stratégies archivées</span>
                    <span className="font-bold text-gray-900">{stats.strategies.archive}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Mandats terminés</span>
                    <span className="font-bold text-gray-900">{stats.mandats.termine}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Projets en cours</span>
                    <span className="font-bold text-green-600">{stats.mandats.enCours + stats.strategies.active}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Timeline d'activité */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Timeline (2/3) */}
              <Card className="p-6 lg:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-orange" />
                  Activité Récente
                </h3>
                <div className="space-y-4">
                  {activityTimeline.length > 0 ? (
                    activityTimeline.map((activity) => (
                      <div key={activity.id} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'strategy' ? 'bg-orange-100 text-orange-600' :
                            activity.type === 'invoice' ? 'bg-purple-100 text-purple-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {activity.type === 'strategy' && <Target className="w-5 h-5" />}
                            {activity.type === 'invoice' && <FileText className="w-5 h-5" />}
                            {activity.type === 'mandat' && <Briefcase className="w-5 h-5" />}
                          </div>
                        </div>
                        <div className="flex-1 bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{activity.action}</h4>
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {new Date(activity.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Aucune activité récente</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Actions Rapides (1/3) */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Actions Rapides
                </h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all">
                    <Target className="w-5 h-5" />
                    <span className="font-semibold text-sm">Voir mes stratégies</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all">
                    <FileText className="w-5 h-5" />
                    <span className="font-semibold text-sm">Télécharger factures</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all">
                    <Mail className="w-5 h-5" />
                    <span className="font-semibold text-sm">Contacter l'équipe</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
                    <UserIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm">Mon profil</span>
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ========== TAB: STRATÉGIES ========== */}
        {activeTab === 'strategies' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Vos Stratégies Social Media</h2>
              <p className="text-gray-600">Consultez toutes vos stratégies de communication</p>
            </div>

            {data.strategies.length === 0 ? (
              <Card className="p-12 text-center">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune stratégie</h3>
                <p className="text-gray-600">Vos stratégies social media apparaîtront ici</p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {data.strategies.map((strategy) => (
                  <Card key={strategy.id} className="p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Stratégie v{strategy.version}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {strategy.contexte_general || 'Stratégie social media complète'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-3 ${
                        strategy.status === 'actif' ? 'bg-green-100 text-green-700' :
                        strategy.status === 'brouillon' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {strategy.status}
                      </span>
                    </div>

                    {/* Plateformes */}
                    {strategy.plateformes && strategy.plateformes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Plateformes</h4>
                        <div className="flex flex-wrap gap-2">
                          {strategy.plateformes.map((platform, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-200">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date(strategy.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      {strategy.updated_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Mis à jour {new Date(strategy.updated_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>

                    <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold">
                      <Eye className="w-4 h-4" />
                      Voir les détails
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== TAB: FACTURES ========== */}
        {activeTab === 'invoices' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Vos Factures</h2>
              <p className="text-gray-600">Consultez et téléchargez vos factures</p>
            </div>

            {data.invoices.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune facture</h3>
                <p className="text-gray-600">Vos factures apparaîtront ici</p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Facture
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Montant TTC
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-purple-600 mr-3" />
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {invoice.invoice_number}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900">
                              {invoice.total_ttc?.toLocaleString('fr-CH')} CHF
                            </div>
                            <div className="text-xs text-gray-500">
                              HT: {invoice.total_ht?.toLocaleString('fr-CH')} CHF
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${
                              invoice.status === 'payee' ? 'bg-green-100 text-green-700' :
                              invoice.status === 'envoyee' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {invoice.status === 'payee' && <CheckCircle className="w-3 h-3" />}
                              {invoice.status === 'envoyee' && <Clock className="w-3 h-3" />}
                              {invoice.status === 'payee' ? 'Payée' : 
                               invoice.status === 'envoyee' ? 'En attente' : 
                               invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Télécharger PDF">
                                <Download className="w-4 h-4 text-gray-600" />
                              </button>
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Voir">
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ========== TAB: MANDATS ========== */}
        {activeTab === 'mandats' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Vos Mandats</h2>
              <p className="text-gray-600">Suivez l'avancement de vos projets</p>
            </div>

            {data.mandats.length === 0 ? (
              <Card className="p-12 text-center">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun mandat</h3>
                <p className="text-gray-600">Vos mandats apparaîtront ici</p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.mandats.map((mandat) => (
                  <Card key={mandat.id} className="p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        mandat.status === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                        mandat.status === 'termine' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {mandat.status === 'en_cours' ? 'En cours' : 
                         mandat.status === 'termine' ? 'Terminé' : 
                         mandat.status}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{mandat.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {mandat.description || 'Aucune description disponible'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date(mandat.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== TAB: PROFIL ========== */}
        {activeTab === 'profile' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Mon Profil</h2>
              <p className="text-gray-600">Informations de votre compte</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Informations principales */}
              <Card className="p-6 lg:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-gray-600" />
                  Informations Client
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Nom</label>
                    <div className="mt-1 text-gray-900 font-semibold">{data.clientInfo?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                    <div className="mt-1 text-gray-900 font-semibold">{data.clientInfo?.email || user.email}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Téléphone</label>
                    <div className="mt-1 text-gray-900 font-semibold">{data.clientInfo?.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Entreprise</label>
                    <div className="mt-1 text-gray-900 font-semibold">{data.clientInfo?.company_name || 'N/A'}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Type de Client</label>
                    <div className="mt-1">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full capitalize">
                        {data.clientInfo?.type || 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Statut */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Statut
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Statut Compte</label>
                    <div className="mt-1">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full capitalize">
                        {data.clientInfo?.status || 'Actif'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Membre depuis</label>
                    <div className="mt-1 text-gray-900 font-semibold">
                      {data.clientInfo?.created_at ? new Date(data.clientInfo.created_at).toLocaleDateString('fr-FR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact */}
            <Card className="p-6 mt-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-600" />
                Besoin d'Aide ?
              </h3>
              <p className="text-gray-700 mb-4">
                Notre équipe est à votre disposition pour répondre à toutes vos questions
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="mailto:contact@yourstory.ch"
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  <Mail className="w-4 h-4" />
                  contact@yourstory.ch
                </a>
                <a
                  href="tel:+41000000000"
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  <Phone className="w-4 h-4" />
                  +41 (0) XX XXX XX XX
                </a>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* ========== FOOTER ========== */}
      <footer className="bg-white border-t-2 border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            © 2024 YourStory Agency. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
