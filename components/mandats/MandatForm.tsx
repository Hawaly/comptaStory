"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Mandat, MandatInsert, MandatStatus } from "@/types/database";

interface MandatFormProps {
  mandat?: Mandat;
  clientId: number;
  mode: "create" | "edit";
}

export function MandatForm({ mandat, clientId, mode }: MandatFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: mandat?.title || "",
    mandat_type: mandat?.mandat_type || "",
    description: mandat?.description || "",
    status: mandat?.status || ("en_cours" as MandatStatus),
    start_date: mandat?.start_date || "",
    end_date: mandat?.end_date || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!formData.title.trim()) {
        throw new Error("Le titre du mandat est obligatoire");
      }

      const dataToSave: MandatInsert = {
        client_id: clientId,
        title: formData.title.trim(),
        mandat_type: formData.mandat_type.trim() || null,
        description: formData.description.trim() || null,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (mode === "create") {
        const { data, error: insertError } = await supabase
          .from("mandat")
          .insert([dataToSave])
          .select()
          .single();

        if (insertError) throw insertError;

        router.push(`/mandats/${data.id}`);
      } else {
        if (!mandat) throw new Error("Mandat non défini");

        const { error: updateError } = await supabase
          .from("mandat")
          .update(dataToSave)
          .eq("id", mandat.id);

        if (updateError) throw updateError;

        router.push(`/mandats/${mandat.id}`);
      }

      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Une erreur est survenue");
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (mode === "edit" && mandat) {
      router.push(`/mandats/${mandat.id}`);
    } else {
      router.push(`/clients/${clientId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <p className="text-red-900 font-semibold text-base">{error}</p>
        </div>
      )}

      {/* Informations principales */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informations du mandat
        </h3>
        <div className="space-y-4">
          {/* Titre */}
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-gray-900 mb-2">
              Titre du mandat <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              placeholder="Ex: Campagne marketing Q1 2024"
              required
              disabled={isLoading}
            />
          </div>

          {/* Type de mandat */}
          <div>
            <label htmlFor="mandat_type" className="block text-sm font-bold text-gray-900 mb-2">
              Type de mandat
            </label>
            <input
              type="text"
              id="mandat_type"
              value={formData.mandat_type}
              onChange={(e) => setFormData({ ...formData, mandat_type: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              placeholder="Ex: Marketing digital, Réseaux sociaux, SEO..."
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-bold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              placeholder="Détails du mandat..."
              disabled={isLoading}
            />
          </div>

          {/* Statut */}
          <div>
            <label htmlFor="status" className="block text-sm font-bold text-gray-900 mb-2">
              Statut <span className="text-red-600">*</span>
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as MandatStatus })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
              required
              disabled={isLoading}
            >
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Période du mandat
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date de début */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-bold text-gray-900 mb-2">
              Date de début
            </label>
            <input
              type="date"
              id="start_date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              disabled={isLoading}
            />
          </div>

          {/* Date de fin */}
          <div>
            <label htmlFor="end_date" className="block text-sm font-bold text-gray-900 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              id="end_date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isLoading}
          className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-900 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>Annuler</span>
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-bold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{mode === "create" ? "Créer" : "Enregistrer"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

