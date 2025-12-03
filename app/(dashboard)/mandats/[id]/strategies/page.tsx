"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { StrategyForm } from "@/components/strategies/StrategyForm";
import { StrategyView } from "@/components/strategies/StrategyView";
import { 
  ArrowLeft, 
  Plus, 
  Loader2,
  FileText,
  Calendar,
  Eye,
  Trash2
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Mandat,
  Client,
  SocialMediaStrategy,
  SocialMediaStrategyInsert,
  STRATEGY_STATUS_LABELS,
  STRATEGY_STATUS_COLORS
} from "@/types/database";

export default function MandatStrategiesPage() {
  const params = useParams();
  const router = useRouter();
  const mandatId = params.id as string;

  const [mandat, setMandat] = useState<Mandat | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [strategies, setStrategies] = useState<SocialMediaStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<SocialMediaStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'form' | 'view'>('list');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mandatId]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);

      // Charger le mandat
      const { data: mandatData, error: mandatError } = await supabase
        .from("mandat")
        .select("*")
        .eq("id", mandatId)
        .single();

      if (mandatError) throw mandatError;
      if (!mandatData) throw new Error("Mandat non trouvé");

      setMandat(mandatData);

      // Charger le client
      const { data: clientData, error: clientError } = await supabase
        .from("client")
        .select("*")
        .eq("id", mandatData.client_id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Charger les stratégies
      await loadStrategies();

    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadStrategies() {
    try {
      if (!client) return;
      
      const { data, error } = await supabase
        .from("social_media_strategy")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStrategies(data || []);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Erreur lors du chargement des stratégies:", error);
    }
  }

  async function handleSaveStrategy(data: Partial<SocialMediaStrategyInsert>) {
    try {
      if (selectedStrategy) {
        // Mise à jour
        const { error } = await supabase
          .from("social_media_strategy")
          .update(data)
          .eq("id", selectedStrategy.id);

        if (error) throw error;
      } else {
        // Création
        const { error } = await supabase
          .from("social_media_strategy")
          .insert([data]);

        if (error) throw error;
      }

      await loadStrategies();
      setView('list');
      setSelectedStrategy(null);
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(error.message || "Erreur lors de la sauvegarde");
    }
  }

  async function handleDeleteStrategy(strategyId: number) {
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return;

    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer cette stratégie (version ${strategy.version}) ?\n\nCette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(strategyId);

      const { error } = await supabase
        .from("social_media_strategy")
        .delete()
        .eq("id", strategyId);

      if (error) throw error;

      await loadStrategies();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Erreur lors de la suppression");
    } finally {
      setIsDeleting(null);
    }
  }

  function handleNewStrategy() {
    setSelectedStrategy(null);
    setView('form');
  }

  function handleEditStrategy(strategy: SocialMediaStrategy) {
    setSelectedStrategy(strategy);
    setView('form');
  }

  function handleViewStrategy(strategy: SocialMediaStrategy) {
    setSelectedStrategy(strategy);
    setView('view');
  }

  function handleCancel() {
    setSelectedStrategy(null);
    setView('list');
  }

  if (isLoading) {
    return (
      <>
        <Header title="Chargement..." />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold">Chargement...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !mandat || !client) {
    return (
      <>
        <Header title="Erreur" />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <p className="text-red-900 font-semibold">{error || "Données non trouvées"}</p>
            <Link
              href="/mandats"
              className="inline-block mt-4 text-red-700 hover:text-red-900 font-bold"
            >
              Retour à la liste
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Vue formulaire
  if (view === 'form') {
    return (
      <>
        <Header title={selectedStrategy ? "Modifier la stratégie" : "Nouvelle stratégie"} />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <button
              onClick={handleCancel}
              className="flex items-center text-gray-900 hover:text-blue-700 transition-colors font-semibold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">{mandat.title}</h2>
            <p className="text-gray-700 font-medium">Client: {client.name}</p>
          </div>

          <StrategyForm
            clientId={client.id}
            strategy={selectedStrategy}
            onSave={handleSaveStrategy}
            onCancel={handleCancel}
          />
        </main>
      </>
    );
  }

  // Vue présentation
  if (view === 'view' && selectedStrategy) {
    return (
      <>
        <Header title="Stratégie Social Media" />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="mb-6">
            <button
              onClick={handleCancel}
              className="flex items-center text-gray-900 hover:text-blue-700 transition-colors font-semibold no-print"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </button>
          </div>

          <StrategyView
            strategy={selectedStrategy}
            mandatTitle={mandat.title}
            clientName={client.name}
            onEdit={() => handleEditStrategy(selectedStrategy)}
          />
        </main>
      </>
    );
  }

  // Vue liste
  return (
    <>
      <Header title="Stratégies Social Media" />
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Breadcrumb */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <Link
            href={`/mandats/${mandatId}`}
            className="flex items-center text-gray-900 hover:text-blue-700 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au mandat
          </Link>

          <button
            onClick={handleNewStrategy}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle stratégie</span>
          </button>
        </div>

        {/* Info mandat */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{mandat.title}</h1>
          <p className="text-gray-700 font-medium">Client: {client.name}</p>
        </div>

        {/* Liste des stratégies */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Stratégies ({strategies.length})
          </h2>

          {strategies.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-4">
                Aucune stratégie social media définie pour ce mandat
              </p>
              <button
                onClick={handleNewStrategy}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer la première stratégie
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          Stratégie v{strategy.version}
                        </h3>
                        <span className={`px-3 py-1 text-sm rounded-full ${STRATEGY_STATUS_COLORS[strategy.status]}`}>
                          {STRATEGY_STATUS_LABELS[strategy.status]}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Créée: {new Date(strategy.created_at).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Modifiée: {new Date(strategy.updated_at).toLocaleDateString("fr-FR")}
                        </div>
                      </div>

                      {/* Aperçu du contenu */}
                      {strategy.contexte_general && (
                        <p className="text-sm text-gray-700 mt-3 line-clamp-2">
                          {strategy.contexte_general}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleViewStrategy(strategy)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditStrategy(strategy)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStrategy(strategy.id)}
                        disabled={isDeleting === strategy.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        {isDeleting === strategy.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
