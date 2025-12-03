"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Target, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { PilierContenu, PilierContenuInsert } from '@/types/database';
import {
  getPiliers,
  createPilier,
  updatePilier,
  deletePilier,
  reorderPiliers,
} from '@/lib/strategyEntitiesApi';

interface PilierManagerProps {
  strategyId: number;
}

export function PilierManager({ strategyId }: PilierManagerProps) {
  const [piliers, setPiliers] = useState<PilierContenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPilier, setEditingPilier] = useState<PilierContenu | null>(null);

  useEffect(() => {
    loadPiliers();
  }, [strategyId]);

  const loadPiliers = async () => {
    setIsLoading(true);
    try {
      const data = await getPiliers(strategyId);
      setPiliers(data);
    } catch (error) {
      console.error('Erreur chargement piliers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPilier(null);
    setShowModal(true);
  };

  const handleEdit = (pilier: PilierContenu) => {
    setEditingPilier(pilier);
    setShowModal(true);
  };

  const handleDelete = async (pilierId: number) => {
    if (confirm('Supprimer ce pilier de contenu ?')) {
      const success = await deletePilier(pilierId);
      if (success) {
        await loadPiliers();
      }
    }
  };

  const handleSave = async (data: PilierContenuInsert) => {
    if (editingPilier) {
      await updatePilier(editingPilier.id, data);
    } else {
      await createPilier({
        ...data,
        strategy_id: strategyId,
        ordre: piliers.length,
      });
    }
    await loadPiliers();
    setShowModal(false);
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const newPiliers = [...piliers];
    const [moved] = newPiliers.splice(fromIndex, 1);
    newPiliers.splice(toIndex, 0, moved);
    
    setPiliers(newPiliers);
    
    const ids = newPiliers.map(p => p.id);
    await reorderPiliers(ids, strategyId);
  };

  const totalPourcentage = piliers.reduce((sum, p) => sum + (p.pourcentage_cible || 0), 0);

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
        <div>
          <p className="text-sm text-gray-600">
            {piliers.length} pilier{piliers.length > 1 ? 's' : ''} défini{piliers.length > 1 ? 's' : ''}
          </p>
          {piliers.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Total: {totalPourcentage}% {totalPourcentage !== 100 && (
                <span className="text-orange-600 font-semibold">
                  (devrait = 100%)
                </span>
              )}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleAdd}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un pilier
        </Button>
      </div>

      {piliers.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 font-medium mb-2">Aucun pilier de contenu défini</p>
          <p className="text-sm text-gray-500 mb-4">
            Les piliers structurent votre stratégie de contenu
          </p>
          <Button type="button" variant="ghost" onClick={handleAdd}>
            Créer le premier pilier
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {piliers.map((pilier, index) => (
            <div
              key={pilier.id}
              className="border-l-4"
              style={{ borderLeftColor: getColorForPilier(index) }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="mt-1 cursor-move hover:bg-gray-100 p-1 rounded"
                  title="Réorganiser"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </button>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{pilier.titre}</h4>
                      {pilier.pourcentage_cible !== null && (
                        <span className="px-2 py-0.5 bg-brand-orange/10 text-brand-orange text-xs font-bold rounded-full">
                          {pilier.pourcentage_cible}%
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(pilier)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pilier.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {pilier.description && (
                    <p className="text-sm text-gray-700 mb-2">{pilier.description}</p>
                  )}

                  {pilier.exemples && (
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Exemples:</span> {pilier.exemples}
                    </p>
                  )}

                  {/* Barre de progression */}
                  {pilier.pourcentage_cible !== null && (
                    <div className="mt-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-orange to-brand-orange-light transition-all"
                          style={{ width: `${pilier.pourcentage_cible}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PilierModal
          pilier={editingPilier}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// Couleurs pour les piliers
function getColorForPilier(index: number): string {
  const colors = [
    '#FF6B35', // Orange
    '#4ECDC4', // Turquoise
    '#FFD23F', // Jaune
    '#95E1D3', // Vert menthe
    '#F38181', // Rose
    '#AA96DA', // Violet
    '#FCBAD3', // Rose pâle
  ];
  return colors[index % colors.length];
}

// Modal pour créer/éditer un pilier
interface PilierModalProps {
  pilier: PilierContenu | null;
  onSave: (data: PilierContenuInsert) => Promise<void>;
  onClose: () => void;
}

function PilierModal({ pilier, onSave, onClose }: PilierModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    titre: pilier?.titre || '',
    description: pilier?.description || '',
    exemples: pilier?.exemples || '',
    pourcentage_cible: pilier?.pourcentage_cible?.toString() || '',
  });

  const handleSubmit = async () => {
    if (!formData.titre) {
      alert('Le titre est obligatoire');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        strategy_id: 0, // Sera défini par le parent
        titre: formData.titre,
        description: formData.description || null,
        exemples: formData.exemples || null,
        pourcentage_cible: formData.pourcentage_cible
          ? parseInt(formData.pourcentage_cible)
          : null,
        ordre: pilier?.ordre || 0,
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
            {pilier ? 'Éditer' : 'Nouveau'} Pilier de Contenu
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Titre du Pilier *
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Ex: Expertise & Conseil"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Objectif et rôle de ce pilier dans votre stratégie"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Exemples de contenus
            </label>
            <textarea
              value={formData.exemples}
              onChange={(e) => setFormData({ ...formData, exemples: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Ex: Tips, tutoriels, études de cas, infographies..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Pourcentage cible (0-100%)
              <span className="text-gray-500 font-normal text-xs ml-2">
                (recommandé: total = 100%)
              </span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.pourcentage_cible}
              onChange={(e) => setFormData({ ...formData, pourcentage_cible: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Ex: 40"
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
            {pilier ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
