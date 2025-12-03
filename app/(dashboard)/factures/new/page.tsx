"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { InvoiceItemsForm } from "@/components/invoices/InvoiceItemsForm";
import { ArrowLeft, Save, Loader2, Info } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Client, Mandat, InvoiceStatus, InvoiceItemInsert } from "@/types/database";
import { generateInvoiceNumber, calculateInvoiceTotals, formatCurrency, DEFAULT_TVA_RATE } from "@/lib/invoiceHelpers";

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [mandats, setMandats] = useState<Mandat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    client_id: "",
    mandat_id: "",
    issue_date: new Date().toISOString().split('T')[0],
    due_date: "",
    status: "brouillon" as InvoiceStatus,
    qr_additional_info: "",
    tva_applicable: true, // Par défaut, TVA applicable
  });

  const [items, setItems] = useState<Omit<InvoiceItemInsert, 'invoice_id'>[]>([
    { description: "", quantity: 1, unit_price: 0, total: 0 },
  ]);

  useEffect(() => {
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
      .order("created_at", { ascending: false });
    
    setMandats(data || []);
  }

  // Calculer les totaux avec ou sans TVA selon l'option
  const tvaRate = formData.tva_applicable ? DEFAULT_TVA_RATE : 0;
  const totals = calculateInvoiceTotals(items, tvaRate);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!formData.client_id) {
        throw new Error("Veuillez sélectionner un client");
      }

      if (items.length === 0 || items.every(item => !item.description)) {
        throw new Error("Ajoutez au moins une ligne de facturation");
      }

      // Générer le numéro de facture
      const invoiceNumber = await generateInvoiceNumber();

      // Créer la facture
      // Préparer les données d'insertion de base (sans qr_additional_info)
      const baseInvoiceData = {
        client_id: parseInt(formData.client_id),
        mandat_id: formData.mandat_id ? parseInt(formData.mandat_id) : null,
        invoice_number: invoiceNumber,
        issue_date: formData.issue_date,
        due_date: formData.due_date || null,
        total_ht: totals.total_ht,
        total_tva: totals.total_tva,
        total_ttc: totals.total_ttc,
        status: formData.status,
        pdf_path: null,
      };
      
      // Essayer d'insérer avec qr_additional_info si on a une valeur
      // Si la colonne n'existe pas, on réessaie sans ce champ
      let invoice;
      let invoiceError;
      
      if (formData.qr_additional_info?.trim()) {
        // Essayer avec qr_additional_info
        const { data, error } = await supabase
          .from("invoice")
          .insert([{
            ...baseInvoiceData,
            qr_additional_info: formData.qr_additional_info.trim(),
          }])
          .select('id, client_id, mandat_id, invoice_number, issue_date, due_date, total_ht, total_tva, total_ttc, status, pdf_path, created_at')
          .single();
        
        invoice = data;
        invoiceError = error;
        
        // Si l'erreur concerne qr_additional_info, réessayer sans ce champ
        if (error && error.message?.includes('qr_additional_info')) {
          console.warn('Colonne qr_additional_info non trouvée, insertion sans ce champ');
          const { data: retryData, error: retryError } = await supabase
            .from("invoice")
            .insert([baseInvoiceData])
            .select('id, client_id, mandat_id, invoice_number, issue_date, due_date, total_ht, total_tva, total_ttc, status, pdf_path, created_at')
            .single();
          
          invoice = retryData;
          invoiceError = retryError;
        }
      } else {
        // Insérer sans qr_additional_info
        const { data, error } = await supabase
          .from("invoice")
          .insert([baseInvoiceData])
          .select('id, client_id, mandat_id, invoice_number, issue_date, due_date, total_ht, total_tva, total_ttc, status, pdf_path, created_at')
          .single();
        
        invoice = data;
        invoiceError = error;
      }

      if (invoiceError || !invoice) {
        throw invoiceError || new Error('Erreur lors de la création de la facture');
      }

      // Créer les lignes de facture
      const validItems = items.filter(item => item.description.trim());
      
      if (validItems.length > 0) {
        const itemsToInsert = validItems.map(item => ({
          invoice_id: invoice.id,
          ...item,
        }));

        const { error: itemsError } = await supabase
          .from("invoice_item")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Redirection vers la facture
      router.push(`/factures/${invoice.id}`);
      router.refresh();

    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Erreur lors de la création de la facture");
      setIsLoading(false);
    }
  }

  return (
    <>
      <Header title="Nouvelle facture" />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link
            href="/factures"
            className="flex items-center text-gray-900 hover:text-blue-700 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux factures
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="max-w-6xl space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-red-900 font-semibold">{error}</p>
            </div>
          )}

          {/* Informations principales */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Informations de la facture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client */}
              <div>
                <label htmlFor="client_id" className="block text-sm font-bold text-gray-900 mb-2">
                  Client <span className="text-red-600">*</span>
                </label>
                <select
                  id="client_id"
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
                  required
                  disabled={isLoading}
                >
                  <option value="">Sélectionner un client</option>
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
                  Mandat (optionnel)
                </label>
                <select
                  id="mandat_id"
                  value={formData.mandat_id}
                  onChange={(e) => setFormData({ ...formData, mandat_id: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
                  disabled={!formData.client_id || isLoading}
                >
                  <option value="">Sans mandat</option>
                  {mandats.map((mandat) => (
                    <option key={mandat.id} value={mandat.id}>
                      {mandat.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date d'émission */}
              <div>
                <label htmlFor="issue_date" className="block text-sm font-bold text-gray-900 mb-2">
                  Date d&apos;émission <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  id="issue_date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Date d'échéance */}
              <div>
                <label htmlFor="due_date" className="block text-sm font-bold text-gray-900 mb-2">
                  Date d&apos;échéance
                </label>
                <input
                  type="date"
                  id="due_date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
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
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
                  required
                  disabled={isLoading}
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="envoyee">Envoyée</option>
                  <option value="payee">Payée</option>
                </select>
              </div>

              {/* TVA Applicable */}
              <div>
                <label htmlFor="tva_applicable" className="block text-sm font-bold text-gray-900 mb-2">
                  TVA applicable
                </label>
                <select
                  id="tva_applicable"
                  value={formData.tva_applicable ? "oui" : "non"}
                  onChange={(e) => setFormData({ ...formData, tva_applicable: e.target.value === "oui" })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
                  disabled={isLoading}
                >
                  <option value="oui">Oui - TVA 8.1%</option>
                  <option value="non">Non - Exonéré de TVA</option>
                </select>
                {!formData.tva_applicable && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                      En Suisse, les entreprises avec un CA annuel inférieur à CHF 100&apos;000 ne sont pas assujetties à la TVA.
                    </p>
                  </div>
                )}
              </div>

              {/* Information supplémentaire QR-Bill */}
              <div>
                <label htmlFor="qr_additional_info" className="block text-sm font-bold text-gray-900 mb-2">
                  Information supplémentaire QR-Bill
                </label>
                <input
                  type="text"
                  id="qr_additional_info"
                  value={formData.qr_additional_info}
                  onChange={(e) => setFormData({ ...formData, qr_additional_info: e.target.value })}
                  placeholder="Ex: Paiement dans les 30 jours"
                  maxLength={140}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.qr_additional_info.length}/140 caractères (sera ajouté au message QR-Bill)
                </p>
              </div>
            </div>
          </div>

          {/* Lignes de facturation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <InvoiceItemsForm items={items} onChange={setItems} />
          </div>

          {/* Totaux */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Totaux</h3>
            <div className="space-y-3 max-w-md ml-auto">
              <div className="flex justify-between items-center pb-2">
                <span className="text-gray-900 font-bold">Total HT :</span>
                <span className="text-xl font-black text-gray-900">{formatCurrency(totals.total_ht)}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-gray-900 font-bold">
                  TVA ({formData.tva_applicable ? `${(DEFAULT_TVA_RATE * 100).toFixed(1)}%` : 'Exonéré'}) :
                </span>
                <span className={`text-xl font-black ${formData.tva_applicable ? 'text-gray-900' : 'text-gray-400'}`}>
                  {formatCurrency(totals.total_tva)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-[3px] border-gray-900">
                <span className="text-lg font-black text-gray-900">Total TTC :</span>
                <span className="text-2xl font-black text-blue-700">{formatCurrency(totals.total_ttc)}</span>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/factures"
              className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-900 font-bold hover:bg-gray-50 transition-colors text-center"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Créer la facture</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

