"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Client, ClientInsert, ClientType, ClientStatus } from "@/types/database";

interface ClientFormProps {
  client?: Client;
  mode: "create" | "edit";
}

export function ClientForm({ client, mode }: ClientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État du formulaire
  const [formData, setFormData] = useState({
    name: client?.name || "",
    type: client?.type || ("oneshot" as ClientType),
    status: client?.status || ("potentiel" as ClientStatus),
    email: client?.email || "",
    phone: client?.phone || "",
    company_name: client?.company_name || "",
    address: client?.address || "",
    zip_code: client?.zip_code || "",
    locality: client?.locality || "",
    represented_by: client?.represented_by || "",
    notes: client?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error("Le nom du client est obligatoire");
      }

      // Préparer les données (convertir les strings vides en null)
      const dataToSave: ClientInsert = {
        name: formData.name.trim(),
        type: formData.type,
        status: formData.status,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        company_name: formData.company_name.trim() || null,
        address: formData.address.trim() || null,
        zip_code: formData.zip_code.trim() || null,
        locality: formData.locality.trim() || null,
        represented_by: formData.represented_by.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (mode === "create") {
        // Création
        const { data, error: insertError } = await supabase
          .from("client")
          .insert([dataToSave])
          .select()
          .single();

        if (insertError) throw insertError;

        // Redirection vers la page du client
        router.push(`/clients/${data.id}`);
      } else {
        // Modification
        if (!client) throw new Error("Client non défini");

        const { error: updateError } = await supabase
          .from("client")
          .update(dataToSave)
          .eq("id", client.id);

        if (updateError) throw updateError;

        // Redirection vers la page du client
        router.push(`/clients/${client.id}`);
      }

      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Une erreur est survenue");
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (mode === "edit" && client) {
      router.push(`/clients/${client.id}`);
    } else {
      router.push("/clients");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <p className="text-red-900 font-semibold text-base">{error}</p>
        </div>
      )}

      {/* Section informations de base */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informations de base
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nom */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du client <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Ex: Jean Dupont"
              required
              disabled={isLoading}
            />
          </div>

          {/* Entreprise */}
          <div className="md:col-span-2">
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l&apos;entreprise
            </label>
            <input
              type="text"
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Ex: Entreprise SA"
              disabled={isLoading}
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ClientType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
              disabled={isLoading}
            >
              <option value="oneshot">One-shot</option>
              <option value="mensuel">Mensuel</option>
            </select>
          </div>

          {/* Statut */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Statut <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
              disabled={isLoading}
            >
              <option value="potentiel">Potentiel</option>
              <option value="actif">Actif</option>
              <option value="pause">Pause</option>
              <option value="termine">Terminé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section adresse */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Adresse
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Adresse */}
          <div className="md:col-span-3">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse complète
            </label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Rue de la Paix 15"
              disabled={isLoading}
            />
          </div>

          {/* Code postal */}
          <div>
            <label htmlFor="zip_code" className="block text-sm font-bold text-gray-900 mb-2">
              Code postal
            </label>
            <input
              type="text"
              id="zip_code"
              value={formData.zip_code}
              onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              placeholder="2000"
              disabled={isLoading}
            />
          </div>

          {/* Localité / Ville */}
          <div className="md:col-span-3">
            <label htmlFor="locality" className="block text-sm font-bold text-gray-900 mb-2">
              Localité / Ville
            </label>
            <input
              type="text"
              id="locality"
              value={formData.locality}
              onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              placeholder="Neuchâtel"
              disabled={isLoading}
            />
          </div>

          {/* Représenté par */}
          <div className="md:col-span-4">
            <label htmlFor="represented_by" className="block text-sm font-bold text-gray-900 mb-2">
              Représenté par
            </label>
            <input
              type="text"
              id="represented_by"
              value={formData.represented_by}
              onChange={(e) => setFormData({ ...formData, represented_by: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              placeholder="Nom du représentant"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Section contact */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informations de contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="exemple@email.com"
              disabled={isLoading}
            />
          </div>

          {/* Téléphone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="+41 79 000 00 00"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Section notes */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Notes
        </h3>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="Notes supplémentaires..."
          disabled={isLoading}
        />
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isLoading}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>Annuler</span>
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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

