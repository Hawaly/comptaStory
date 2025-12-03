"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Expense, 
  ExpenseCategory,
  Client,
  Mandat,
  ExpenseType,
  RecurrenceType 
} from "@/types/database";
import { uploadReceipt } from "@/lib/expenseHelpers";

interface ExpenseFormProps {
  expense?: Expense;
  mode: "create" | "edit";
}

export function ExpenseForm({ expense, mode }: ExpenseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [mandats, setMandats] = useState<Mandat[]>([]);

  const [formData, setFormData] = useState({
    label: expense?.label || "",
    amount: expense?.amount?.toString() || "",
    date: expense?.date || new Date().toISOString().split('T')[0],
    type: expense?.type || ("yourstory" as ExpenseType),
    is_recurring: expense?.is_recurring || ("oneshot" as RecurrenceType),
    client_id: expense?.client_id?.toString() || "",
    mandat_id: expense?.mandat_id?.toString() || "",
    category_id: expense?.category_id?.toString() || "",
    notes: expense?.notes || "",
    receipt_path: expense?.receipt_path || "",
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    loadCategories();
    loadClients();
  }, []);

  useEffect(() => {
    if (formData.client_id) {
      loadMandats(parseInt(formData.client_id));
    } else {
      setMandats([]);
      setFormData(prev => ({ ...prev, mandat_id: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.client_id]);

  async function loadCategories() {
    const { data } = await supabase
      .from("expense_category")
      .select("*")
      .order("name");
    setCategories(data || []);
  }

  async function loadClients() {
    const { data } = await supabase
      .from("client")
      .select("*")
      .order("name");
    setClients(data || []);
  }

  async function loadMandats(clientId: number) {
    const { data } = await supabase
      .from("mandat")
      .select("*")
      .eq("client_id", clientId)
      .order("title");
    setMandats(data || []);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Le fichier est trop volumineux (max 10 MB)");
        return;
      }
      setReceiptFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!formData.label.trim()) {
        throw new Error("Le libellé est obligatoire");
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error("Le montant doit être supérieur à 0");
      }

      let receiptPath = formData.receipt_path;

      // Upload du fichier si présent
      if (receiptFile) {
        setUploadingFile(true);
        receiptPath = await uploadReceipt(receiptFile);
        setUploadingFile(false);
      }

      const dataToSave = {
        label: formData.label.trim(),
        amount: parseFloat(formData.amount),
        date: formData.date,
        type: formData.type,
        is_recurring: formData.is_recurring,
        client_id: formData.type === 'client_mandat' && formData.client_id 
          ? parseInt(formData.client_id) 
          : null,
        mandat_id: formData.type === 'client_mandat' && formData.mandat_id 
          ? parseInt(formData.mandat_id) 
          : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        notes: formData.notes.trim() || null,
        receipt_path: receiptPath || null,
      };

      if (mode === "create") {
        const { error: insertError } = await supabase
          .from("expense")
          .insert([dataToSave]);

        if (insertError) throw insertError;

        router.push("/depenses");
      } else {
        if (!expense) throw new Error("Dépense non définie");

        const { error: updateError } = await supabase
          .from("expense")
          .update(dataToSave)
          .eq("id", expense.id);

        if (updateError) throw updateError;

        router.push("/depenses");
      }

      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Une erreur est survenue");
      setIsLoading(false);
      setUploadingFile(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <p className="text-red-900 font-semibold">{error}</p>
        </div>
      )}

      {/* Informations de base */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Informations de la dépense
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Label */}
          <div className="md:col-span-2">
            <label htmlFor="label" className="block text-sm font-bold text-gray-900 mb-2">
              Libellé <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              placeholder="Ex: Abonnement Adobe Creative Cloud"
              required
              disabled={isLoading}
            />
          </div>

          {/* Montant */}
          <div>
            <label htmlFor="amount" className="block text-sm font-bold text-gray-900 mb-2">
              Montant (CHF) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-black text-lg"
              placeholder="0.00"
              required
              disabled={isLoading}
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-bold text-gray-900 mb-2">
              Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
              required
              disabled={isLoading}
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-bold text-gray-900 mb-2">
              Type <span className="text-red-600">*</span>
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ExpenseType })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
              required
              disabled={isLoading}
            >
              <option value="yourstory">YourStory (général)</option>
              <option value="client_mandat">Client/Mandat</option>
            </select>
          </div>

          {/* Récurrence */}
          <div>
            <label htmlFor="is_recurring" className="block text-sm font-bold text-gray-900 mb-2">
              Récurrence <span className="text-red-600">*</span>
            </label>
            <select
              id="is_recurring"
              value={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.value as RecurrenceType })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
              required
              disabled={isLoading}
            >
              <option value="oneshot">Ponctuelle</option>
              <option value="mensuel">Mensuelle</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client/Mandat (si type = client_mandat) */}
      {formData.type === 'client_mandat' && (
        <div className="bg-blue-50 rounded-lg border-2 border-blue-300 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Association client/mandat
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client */}
            <div>
              <label htmlFor="client_id" className="block text-sm font-bold text-gray-900 mb-2">
                Client
              </label>
              <select
                id="client_id"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
                disabled={isLoading}
              >
                <option value="">Aucun client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mandat */}
            <div>
              <label htmlFor="mandat_id" className="block text-sm font-bold text-gray-900 mb-2">
                Mandat
              </label>
              <select
                id="mandat_id"
                value={formData.mandat_id}
                onChange={(e) => setFormData({ ...formData, mandat_id: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
                disabled={!formData.client_id || isLoading}
              >
                <option value="">Aucun mandat</option>
                {mandats.map((mandat) => (
                  <option key={mandat.id} value={mandat.id}>
                    {mandat.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Catégorie */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Catégorie
        </h3>
        <select
          id="category_id"
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
          disabled={isLoading}
        >
          <option value="">Aucune catégorie</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} {category.is_recurring && '(récurrente)'}
            </option>
          ))}
        </select>
      </div>

      {/* Upload justificatif */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Justificatif (PDF/Image)
        </h3>

        {formData.receipt_path && !receiptFile && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-center justify-between">
            <div className="flex items-center text-green-900 font-semibold">
              <FileText className="w-5 h-5 mr-2" />
              Justificatif existant
            </div>
            <a
              href={`/api/expenses/receipt/${expense?.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 hover:text-green-900 font-bold hover:underline"
            >
              Voir le fichier
            </a>
          </div>
        )}

        {receiptFile && (
          <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg flex items-center justify-between">
            <div className="flex items-center text-blue-900 font-semibold">
              <FileText className="w-5 h-5 mr-2" />
              {receiptFile.name}
            </div>
            <button
              type="button"
              onClick={() => setReceiptFile(null)}
              className="text-red-700 hover:text-red-900 font-bold"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <div>
          <label htmlFor="receipt" className="block text-sm font-bold text-gray-900 mb-2">
            {formData.receipt_path || receiptFile ? "Remplacer le fichier" : "Ajouter un fichier"}
          </label>
          <input
            type="file"
            id="receipt"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-700 mt-2 font-medium">
            Formats acceptés : PDF, PNG, JPG (max 10 MB)
          </p>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Notes
        </h3>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
          placeholder="Notes supplémentaires..."
          disabled={isLoading}
        />
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4">
        <button
          type="button"
          onClick={() => router.push("/depenses")}
          disabled={isLoading || uploadingFile}
          className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-900 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>Annuler</span>
        </button>
        <button
          type="submit"
          disabled={isLoading || uploadingFile}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-bold"
        >
          {isLoading || uploadingFile ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{uploadingFile ? "Upload..." : "Enregistrement..."}</span>
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

