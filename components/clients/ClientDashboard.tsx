"use client";

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  FileText, 
  Receipt, 
  Briefcase,
  Calendar,
  Euro,
  Activity,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface ClientDashboardProps {
  clientId: number;
}

interface DashboardStats {
  strategies: {
    total: number;
    active: number;
    draft: number;
  };
  mandats: {
    total: number;
    enCours: number;
  };
  factures: {
    total: number;
    montantTotal: number;
    enAttente: number;
  };
  depenses: {
    total: number;
    montantTotal: number;
  };
}

export function ClientDashboard({ clientId }: ClientDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [clientId]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      // Strategies
      const { data: strategies } = await supabase
        .from('social_media_strategy')
        .select('id, status')
        .eq('client_id', clientId);

      // Mandats
      const { data: mandats } = await supabase
        .from('mandat')
        .select('id, status')
        .eq('client_id', clientId);

      // Factures
      const { data: factures } = await supabase
        .from('invoice')
        .select('id, total_ttc, status')
        .eq('client_id', clientId);

      // Dépenses
      const { data: depenses } = await supabase
        .from('expense')
        .select('id, amount')
        .eq('client_id', clientId);

      setStats({
        strategies: {
          total: strategies?.length || 0,
          active: strategies?.filter(s => s.status === 'actif').length || 0,
          draft: strategies?.filter(s => s.status === 'brouillon').length || 0,
        },
        mandats: {
          total: mandats?.length || 0,
          enCours: mandats?.filter(m => m.status === 'en_cours').length || 0,
        },
        factures: {
          total: factures?.length || 0,
          montantTotal: factures?.reduce((sum, f) => sum + (f.total_ttc || 0), 0) || 0,
          enAttente: factures?.filter(f => f.status === 'envoyee').length || 0,
        },
        depenses: {
          total: depenses?.length || 0,
          montantTotal: depenses?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0,
        },
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tableau de Bord</h2>
        <p className="text-gray-600">Vue d'ensemble de l'activité du client</p>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stratégies */}
        <Link href={`/clients/${clientId}/strategies`}>
          <Card className="p-6 hover:shadow-xl transition-shadow cursor-pointer bg-gradient-to-br from-brand-orange/5 to-brand-orange/10 border-2 border-brand-orange/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-brand-orange/20 rounded-xl">
                <Target className="w-6 h-6 text-brand-orange" />
              </div>
              <span className="text-3xl font-bold text-brand-orange">
                {stats.strategies.total}
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-700 mb-1">Stratégies Social Media</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-green-600 font-semibold">
                ✓ {stats.strategies.active} actives
              </span>
              <span className="text-gray-500">
                {stats.strategies.draft} brouillons
              </span>
            </div>
          </Card>
        </Link>

        {/* Mandats */}
        <Link href={`/clients/${clientId}?tab=mandats`}>
          <Card className="p-6 hover:shadow-xl transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-200 rounded-xl">
                <Briefcase className="w-6 h-6 text-blue-700" />
              </div>
              <span className="text-3xl font-bold text-blue-700">
                {stats.mandats.total}
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-700 mb-1">Mandats</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-green-600 font-semibold">
                ⚡ {stats.mandats.enCours} en cours
              </span>
            </div>
          </Card>
        </Link>

        {/* Factures */}
        <Link href={`/clients/${clientId}?tab=factures`}>
          <Card className="p-6 hover:shadow-xl transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-200 rounded-xl">
                <FileText className="w-6 h-6 text-purple-700" />
              </div>
              <span className="text-3xl font-bold text-purple-700">
                {stats.factures.total}
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-700 mb-1">Factures</h3>
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-green-600 font-semibold">
                {stats.factures.montantTotal.toLocaleString('fr-CH')} CHF
              </span>
              {stats.factures.enAttente > 0 && (
                <span className="text-orange-600">
                  {stats.factures.enAttente} en attente
                </span>
              )}
            </div>
          </Card>
        </Link>

        {/* Dépenses */}
        <Link href={`/clients/${clientId}?tab=depenses`}>
          <Card className="p-6 hover:shadow-xl transition-shadow cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-200 rounded-xl">
                <Receipt className="w-6 h-6 text-orange-700" />
              </div>
              <span className="text-3xl font-bold text-orange-700">
                {stats.depenses.total}
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-700 mb-1">Dépenses</h3>
            <div className="text-xs">
              <span className="text-red-600 font-semibold">
                {stats.depenses.montantTotal.toLocaleString('fr-CH')} CHF
              </span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Activité récente */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-brand-orange" />
          <h3 className="text-lg font-bold text-gray-900">Activité Récente</h3>
        </div>
        
        <div className="space-y-3">
          <RecentActivity 
            clientId={clientId}
            strategiesCount={stats.strategies.total}
            mandatsCount={stats.mandats.total}
          />
        </div>
      </Card>

      {/* Actions rapides */}
      <Card className="p-6 bg-gradient-to-r from-brand-orange/5 to-brand-orange/10">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/clients/${clientId}/strategies/new`}
            className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-shadow border-2 border-gray-200 hover:border-brand-orange"
          >
            <div className="p-2 bg-brand-orange/10 rounded-lg">
              <Target className="w-5 h-5 text-brand-orange" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Nouvelle Stratégie</p>
              <p className="text-xs text-gray-600">Créer une stratégie social media</p>
            </div>
          </Link>

          <Link
            href={`/mandats/new?client=${clientId}`}
            className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-shadow border-2 border-gray-200 hover:border-blue-500"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Nouveau Mandat</p>
              <p className="text-xs text-gray-600">Créer un nouveau mandat</p>
            </div>
          </Link>

          <Link
            href={`/factures/new?client=${clientId}`}
            className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-shadow border-2 border-gray-200 hover:border-purple-500"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Nouvelle Facture</p>
              <p className="text-xs text-gray-600">Créer une facture</p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}

// Composant pour l'activité récente
function RecentActivity({ clientId, strategiesCount, mandatsCount }: { 
  clientId: number; 
  strategiesCount: number;
  mandatsCount: number;
}) {
  return (
    <div className="space-y-2">
      {strategiesCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {strategiesCount} stratégie{strategiesCount > 1 ? 's' : ''} social media
            </p>
            <p className="text-xs text-gray-600">Gérez vos stratégies de contenu</p>
          </div>
          <Link
            href={`/clients/${clientId}/strategies`}
            className="text-xs font-semibold text-brand-orange hover:underline"
          >
            Voir →
          </Link>
        </div>
      )}

      {mandatsCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {mandatsCount} mandat{mandatsCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-600">Projets et missions en cours</p>
          </div>
        </div>
      )}

      {strategiesCount === 0 && mandatsCount === 0 && (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune activité récente</p>
          <p className="text-sm text-gray-400 mt-1">
            Commencez par créer une stratégie ou un mandat
          </p>
        </div>
      )}
    </div>
  );
}
