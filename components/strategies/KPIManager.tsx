"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, Loader2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { KPI, KPIInsert, KPIMesure, KPIMesureInsert } from '@/types/database';
import {
  getKPIs,
  createKPI,
  updateKPI,
  deleteKPI,
  getKPIMesures,
  addKPIMesure,
  deleteKPIMesure,
} from '@/lib/strategyEntitiesApi';

interface KPIManagerProps {
  strategyId: number;
}

export function KPIManager({ strategyId }: KPIManagerProps) {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | null>(null);
  const [showMesureModal, setShowMesureModal] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);

  useEffect(() => {
    loadKPIs();
  }, [strategyId]);

  const loadKPIs = async () => {
    setIsLoading(true);
    try {
      const data = await getKPIs(strategyId);
      setKpis(data);
    } catch (error) {
      console.error('Erreur chargement KPIs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingKPI(null);
    setShowModal(true);
  };

  const handleEdit = (kpi: KPI) => {
    setEditingKPI(kpi);
    setShowModal(true);
  };

  const handleDelete = async (kpiId: number) => {
    if (confirm('Supprimer ce KPI et toutes ses mesures ?')) {
      const success = await deleteKPI(kpiId);
      if (success) {
        await loadKPIs();
      }
    }
  };

  const handleSave = async (data: KPIInsert) => {
    if (editingKPI) {
      await updateKPI(editingKPI.id, data);
    } else {
      await createKPI({ ...data, strategy_id: strategyId });
    }
    await loadKPIs();
    setShowModal(false);
  };

  const handleAddMesure = (kpi: KPI) => {
    setSelectedKPI(kpi);
    setShowMesureModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {kpis.length} KPI{kpis.length > 1 ? 's' : ''} défini{kpis.length > 1 ? 's' : ''}
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleAdd}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un KPI
        </Button>
      </div>

      {kpis.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 font-medium mb-2">Aucun KPI défini</p>
          <p className="text-sm text-gray-500 mb-4">
            Définissez les indicateurs clés de performance à suivre
          </p>
          <Button type="button" variant="ghost" onClick={handleAdd}>
            Créer le premier KPI
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {kpis.map((kpi) => (
            <Card key={kpi.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-orange" />
                  <h4 className="font-bold text-gray-900">{kpi.nom}</h4>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(kpi)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(kpi.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {kpi.objectif && (
                <p className="text-sm text-gray-700 mb-2">{kpi.objectif}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                {kpi.valeur_cible !== null && (
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Cible</p>
                    <p className="font-bold text-blue-700">
                      {kpi.valeur_cible} {kpi.unite}
                    </p>
                  </div>
                )}
                {kpi.periodicite && (
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Fréquence</p>
                    <p className="font-semibold text-purple-700 capitalize">
                      {kpi.periodicite}
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAddMesure(kpi)}
                className="w-full mt-3 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Ajouter une mesure
              </Button>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <KPIModal
          kpi={editingKPI}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {showMesureModal && selectedKPI && (
        <MesureModal
          kpi={selectedKPI}
          onSave={async (mesure) => {
            await addKPIMesure({ ...mesure, kpi_id: selectedKPI.id });
            setShowMesureModal(false);
          }}
          onClose={() => setShowMesureModal(false)}
        />
      )}
    </div>
  );
}

// Modal pour créer/éditer un KPI
interface KPIModalProps {
  kpi: KPI | null;
  onSave: (data: KPIInsert) => Promise<void>;
  onClose: () => void;
}

function KPIModal({ kpi, onSave, onClose }: KPIModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nom: kpi?.nom || '',
    objectif: kpi?.objectif || '',
    valeur_cible: kpi?.valeur_cible?.toString() || '',
    unite: kpi?.unite || '',
    periodicite: kpi?.periodicite || '',
  });

  const handleSubmit = async () => {
    if (!formData.nom) {
      alert('Le nom est obligatoire');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        strategy_id: 0, // Sera défini par le parent
        nom: formData.nom,
        objectif: formData.objectif || null,
        valeur_cible: formData.valeur_cible ? parseFloat(formData.valeur_cible) : null,
        unite: formData.unite || null,
        periodicite: formData.periodicite || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-brand-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">
            {kpi ? 'Éditer' : 'Nouveau'} KPI
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Nom du KPI *
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Ex: Followers Instagram"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Objectif
            </label>
            <textarea
              value={formData.objectif}
              onChange={(e) => setFormData({ ...formData, objectif: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Pourquoi mesurer ce KPI ?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Valeur Cible
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valeur_cible}
                onChange={(e) => setFormData({ ...formData, valeur_cible: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                placeholder="Ex: 10000"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Unité
              </label>
              <input
                type="text"
                value={formData.unite}
                onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                placeholder="followers, %, CHF..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Périodicité
            </label>
            <select
              value={formData.periodicite}
              onChange={(e) => setFormData({ ...formData, periodicite: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
            >
              <option value="">Sélectionner...</option>
              <option value="quotidien">Quotidien</option>
              <option value="hebdomadaire">Hebdomadaire</option>
              <option value="mensuel">Mensuel</option>
              <option value="trimestriel">Trimestriel</option>
              <option value="annuel">Annuel</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1"
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            className="flex-1"
            isLoading={isSaving}
          >
            {kpi ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Modal pour ajouter une mesure
interface MesureModalProps {
  kpi: KPI;
  onSave: (mesure: Omit<KPIMesureInsert, 'kpi_id'>) => Promise<void>;
  onClose: () => void;
}

function MesureModal({ kpi, onSave, onClose }: MesureModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    valeur_mesuree: '',
    commentaire: '',
  });

  const handleSubmit = async () => {
    if (!formData.valeur_mesuree) {
      alert('La valeur mesurée est obligatoire');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        date: formData.date,
        valeur_mesuree: parseFloat(formData.valeur_mesuree),
        commentaire: formData.commentaire || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-brand-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">Nouvelle Mesure</h3>
          <p className="text-sm text-gray-600 mt-1">{kpi.nom}</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Valeur Mesurée * {kpi.unite && `(${kpi.unite})`}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.valeur_mesuree}
              onChange={(e) => setFormData({ ...formData, valeur_mesuree: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Ex: 8543"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Commentaire
            </label>
            <textarea
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Notes sur cette mesure..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1"
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            className="flex-1"
            isLoading={isSaving}
          >
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}
