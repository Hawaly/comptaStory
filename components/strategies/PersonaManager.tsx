"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Persona, PersonaInsert } from '@/types/database';
import {
  getPersonas,
  createPersona,
  updatePersona,
  deletePersona,
} from '@/lib/strategyEntitiesApi';

interface PersonaManagerProps {
  strategyId: number;
}

export function PersonaManager({ strategyId }: PersonaManagerProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  useEffect(() => {
    loadPersonas();
  }, [strategyId]);

  const loadPersonas = async () => {
    setIsLoading(true);
    try {
      const data = await getPersonas(strategyId);
      setPersonas(data);
    } catch (error) {
      console.error('Erreur chargement personas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPersona(null);
    setShowModal(true);
  };

  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona);
    setShowModal(true);
  };

  const handleDelete = async (personaId: number) => {
    if (confirm('Supprimer ce persona ?')) {
      const success = await deletePersona(personaId);
      if (success) {
        await loadPersonas();
      }
    }
  };

  const handleSave = async (data: PersonaInsert) => {
    if (editingPersona) {
      await updatePersona(editingPersona.id, data);
    } else {
      await createPersona({ ...data, strategy_id: strategyId });
    }
    await loadPersonas();
    setShowModal(false);
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
          {personas.length} persona{personas.length > 1 ? 's' : ''} défini{personas.length > 1 ? 's' : ''}
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleAdd}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un persona
        </Button>
      </div>

      {personas.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50">
          <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 font-medium mb-2">Aucun persona défini</p>
          <p className="text-sm text-gray-500 mb-4">
            Définissez vos personas cibles pour mieux comprendre votre audience
          </p>
          <Button type="button" variant="ghost" onClick={handleAdd}>
            Créer le premier persona
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {personas.map((persona) => (
            <Card key={persona.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-orange" />
                  <h4 className="font-bold text-gray-900">{persona.nom}</h4>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(persona)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(persona.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {persona.age_range && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">Âge:</span> {persona.age_range}
                </p>
              )}
              {persona.profession && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">Profession:</span> {persona.profession}
                </p>
              )}
              {persona.besoins && (
                <p className="text-sm text-gray-700 mt-2">
                  <span className="font-semibold">Besoins:</span> {persona.besoins}
                </p>
              )}
              {persona.canaux_preferes && persona.canaux_preferes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {persona.canaux_preferes.map((canal, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {canal}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <PersonaModal
          persona={editingPersona}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// Modal pour créer/éditer un persona
interface PersonaModalProps {
  persona: Persona | null;
  onSave: (data: PersonaInsert) => Promise<void>;
  onClose: () => void;
}

function PersonaModal({ persona, onSave, onClose }: PersonaModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nom: persona?.nom || '',
    age_range: persona?.age_range || '',
    profession: persona?.profession || '',
    besoins: persona?.besoins || '',
    problemes: persona?.problemes || '',
    attentes: persona?.attentes || '',
    comportements: persona?.comportements || '',
    canaux_preferes: persona?.canaux_preferes?.join(', ') || '',
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
        age_range: formData.age_range || null,
        profession: formData.profession || null,
        besoins: formData.besoins || null,
        problemes: formData.problemes || null,
        attentes: formData.attentes || null,
        comportements: formData.comportements || null,
        canaux_preferes: formData.canaux_preferes
          ? formData.canaux_preferes.split(',').map((c) => c.trim())
          : null,
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
            {persona ? 'Éditer' : 'Nouveau'} Persona
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Nom du Persona *
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Ex: Sophie, Responsable Marketing"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Tranche d'âge
              </label>
              <input
                type="text"
                value={formData.age_range}
                onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                placeholder="Ex: 30-40 ans"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Profession
              </label>
              <input
                type="text"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                placeholder="Ex: Marketing Manager"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Besoins
            </label>
            <textarea
              value={formData.besoins}
              onChange={(e) => setFormData({ ...formData, besoins: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Quels sont ses besoins ?"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Problèmes / Points de douleur
            </label>
            <textarea
              value={formData.problemes}
              onChange={(e) => setFormData({ ...formData, problemes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Quels problèmes rencontre-t-il ?"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Attentes
            </label>
            <textarea
              value={formData.attentes}
              onChange={(e) => setFormData({ ...formData, attentes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Qu'attend-il de votre marque ?"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Comportements
            </label>
            <textarea
              value={formData.comportements}
              onChange={(e) => setFormData({ ...formData, comportements: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="Comment se comporte-t-il en ligne ?"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Canaux Préférés
              <span className="text-gray-500 font-normal text-xs ml-2">
                (séparez par des virgules)
              </span>
            </label>
            <input
              type="text"
              value={formData.canaux_preferes}
              onChange={(e) => setFormData({ ...formData, canaux_preferes: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              placeholder="LinkedIn, Instagram, Email..."
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
            {persona ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
