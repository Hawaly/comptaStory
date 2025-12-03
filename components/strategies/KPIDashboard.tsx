"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Calendar, Loader2, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { KPI, KPIMesure } from '@/types/database';
import { getLatestKPIMesures, getKPIMesures, addKPIMesure } from '@/lib/strategyEntitiesApi';

interface KPIDashboardProps {
  strategyId: number;
}

export function KPIDashboard({ strategyId }: KPIDashboardProps) {
  const [kpiData, setKpiData] = useState<{
    kpi: KPI;
    latestMesure: KPIMesure | null;
    mesures: KPIMesure[];
    trend: 'up' | 'down' | 'stable' | null;
    progressPercentage: number | null;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days' | 'all'>('30days');

  useEffect(() => {
    loadKPIData();
  }, [strategyId, selectedPeriod]);

  const loadKPIData = async () => {
    setIsLoading(true);
    try {
      const data = await getLatestKPIMesures(strategyId);

      const enrichedData = await Promise.all(
        data.map(async ({ kpi, latestMesure }) => {
          // Charger toutes les mesures pour le graphique
          const allMesures = await getKPIMesures(kpi.id);
          
          // Filtrer par période
          const filteredMesures = filterByPeriod(allMesures, selectedPeriod);

          // Calculer la tendance
          const trend = calculateTrend(filteredMesures);

          // Calculer le pourcentage de progression
          const progressPercentage = kpi.valeur_cible && latestMesure
            ? (latestMesure.valeur_mesuree / kpi.valeur_cible) * 100
            : null;

          return {
            kpi,
            latestMesure,
            mesures: filteredMesures,
            trend,
            progressPercentage,
          };
        })
      );

      setKpiData(enrichedData);
    } catch (error) {
      console.error('Erreur chargement dashboard KPI:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterByPeriod = (mesures: KPIMesure[], period: string): KPIMesure[] => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (period) {
      case '7days':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        return mesures;
    }

    return mesures.filter(m => new Date(m.date) >= cutoffDate);
  };

  const calculateTrend = (mesures: KPIMesure[]): 'up' | 'down' | 'stable' | null => {
    if (mesures.length < 2) return null;

    const sorted = [...mesures].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latest = sorted[sorted.length - 1].valeur_mesuree;
    const previous = sorted[sorted.length - 2].valeur_mesuree;

    const diff = latest - previous;
    const threshold = previous * 0.05; // 5% de changement

    if (Math.abs(diff) < threshold) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (kpiData.length === 0) {
    return (
      <Card className="p-8 text-center bg-gray-50">
        <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600 font-medium mb-2">Aucune donnée KPI</p>
        <p className="text-sm text-gray-500">
          Ajoutez des KPIs et des mesures pour voir le dashboard
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres de période */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Tableau de Bord KPIs</h3>
        <div className="flex gap-2">
          {[
            { value: '7days', label: '7 jours' },
            { value: '30days', label: '30 jours' },
            { value: '90days', label: '90 jours' },
            { value: 'all', label: 'Tout' },
          ].map((period) => (
            <button
              key={period.value}
              type="button"
              onClick={() => setSelectedPeriod(period.value as any)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-brand-orange text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {kpiData.map(({ kpi, latestMesure, mesures, trend, progressPercentage }) => (
          <Card key={kpi.id} className="p-6 hover:shadow-xl transition-shadow">
            {/* En-tête */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-gray-900 text-lg">{kpi.nom}</h4>
                {kpi.periodicite && (
                  <p className="text-xs text-gray-500 capitalize flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {kpi.periodicite}
                  </p>
                )}
              </div>
              {trend && (
                <div
                  className={`p-2 rounded-lg ${
                    trend === 'up'
                      ? 'bg-green-100 text-green-700'
                      : trend === 'down'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {trend === 'up' ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="w-5 h-5" />
                  ) : (
                    <Activity className="w-5 h-5" />
                  )}
                </div>
              )}
            </div>

            {/* Valeur actuelle */}
            {latestMesure ? (
              <div className="mb-4">
                <p className="text-3xl font-bold text-gray-900">
                  {latestMesure.valeur_mesuree.toLocaleString()}
                  {kpi.unite && <span className="text-lg text-gray-600 ml-1">{kpi.unite}</span>}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Dernière mesure : {new Date(latestMesure.date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-gray-500 italic">Aucune mesure</p>
              </div>
            )}

            {/* Barre de progression */}
            {kpi.valeur_cible && latestMesure && progressPercentage !== null && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Objectif: {kpi.valeur_cible} {kpi.unite}</span>
                  <span
                    className={`font-bold ${
                      progressPercentage >= 100
                        ? 'text-green-600'
                        : progressPercentage >= 75
                        ? 'text-blue-600'
                        : progressPercentage >= 50
                        ? 'text-orange-600'
                        : 'text-red-600'
                    }`}
                  >
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      progressPercentage >= 100
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : progressPercentage >= 75
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                        : progressPercentage >= 50
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Mini graphique (simplifié) */}
            {mesures.length > 1 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Évolution</p>
                <div className="h-16 flex items-end gap-1">
                  {mesures.slice(-10).map((mesure, idx) => {
                    const maxValue = Math.max(...mesures.map(m => m.valeur_mesuree));
                    const height = (mesure.valeur_mesuree / maxValue) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-brand-orange/70 hover:bg-brand-orange rounded-t transition-colors relative group"
                        style={{ height: `${height}%` }}
                        title={`${new Date(mesure.date).toLocaleDateString('fr-FR')}: ${mesure.valeur_mesuree}`}
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {mesure.valeur_mesuree} {kpi.unite}
                          <br />
                          {new Date(mesure.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{new Date(mesures[0].date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}</span>
                  <span>{new Date(mesures[mesures.length - 1].date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            )}

            {/* Dernière note */}
            {latestMesure?.commentaire && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-700 italic">
                  "{latestMesure.commentaire}"
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Insights */}
      <Card className="p-6 bg-gradient-to-r from-brand-orange/5 to-brand-orange/10 border-2 border-brand-orange/20">
        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-orange" />
          Insights
        </h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {kpiData.map(({ kpi, latestMesure, trend, progressPercentage }) => {
            if (!latestMesure) return null;

            let insight = '';
            let color = 'text-gray-700';

            if (progressPercentage !== null && progressPercentage >= 100) {
              insight = `🎉 Objectif atteint pour ${kpi.nom}!`;
              color = 'text-green-700';
            } else if (trend === 'up') {
              insight = `📈 ${kpi.nom} en croissance`;
              color = 'text-blue-700';
            } else if (trend === 'down') {
              insight = `📉 ${kpi.nom} en baisse - à surveiller`;
              color = 'text-orange-700';
            }

            if (!insight) return null;

            return (
              <p key={kpi.id} className={`text-sm font-medium ${color}`}>
                {insight}
              </p>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
