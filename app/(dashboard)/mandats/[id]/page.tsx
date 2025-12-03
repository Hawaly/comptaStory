"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { TasksList } from "@/components/mandats/TasksList";
import { ExpensesList } from "@/components/expenses/ExpensesList";
import { 
  ArrowLeft, 
  Edit, 
  Trash2,
  Calendar,
  Loader2,
  User,
  Share2
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Mandat,
  Client,
  MANDAT_STATUS_LABELS,
  MANDAT_STATUS_COLORS
} from "@/types/database";

export default function MandatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mandatId = params.id as string;

  const [mandat, setMandat] = useState<Mandat | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadMandat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mandatId]);

  async function loadMandat() {
    try {
      setIsLoading(true);
      setError(null);

      // Charger le mandat avec les infos du client
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

    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Erreur lors du chargement du mandat");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!mandat || !client) return;

    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer le mandat "${mandat.title}" ?\n\nCette action est irréversible et supprimera également toutes les tâches associées.`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);

      const { error: deleteError } = await supabase
        .from("mandat")
        .delete()
        .eq("id", mandatId);

      if (deleteError) throw deleteError;

      router.push(`/clients/${client.id}`);
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Erreur lors de la suppression");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <Header title="Chargement..." />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold">Chargement du mandat...</p>
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
            <p className="text-red-900 font-semibold">{error || "Mandat non trouvé"}</p>
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

  return (
    <>
      <Header title={mandat.title} />
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Breadcrumb */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <Link
            href={`/clients/${client.id}`}
            className="flex items-center text-gray-900 hover:text-blue-700 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à {client.name}
          </Link>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href={`/mandats/${mandatId}/strategies`}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-bold"
            >
              <Share2 className="w-4 h-4" />
              <span>Stratégies Social Media</span>
            </Link>
            <Link
              href={`/mandats/${mandatId}/edit`}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
            >
              <Edit className="w-4 h-4" />
              <span>Modifier</span>
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Suppression...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Infos du mandat */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{mandat.title}</h1>

              {/* Client */}
              <Link
                href={`/clients/${client.id}`}
                className="flex items-center text-gray-900 hover:text-blue-700 mb-4 font-semibold"
              >
                <User className="w-4 h-4 mr-2" />
                Client : {client.name}
              </Link>

              {/* Badge statut */}
              <div className="mb-4">
                <span className={`inline-flex px-4 py-2 text-base rounded-full ${MANDAT_STATUS_COLORS[mandat.status]}`}>
                  {MANDAT_STATUS_LABELS[mandat.status]}
                </span>
              </div>

              {/* Type de mandat */}
              {mandat.mandat_type && (
                <div className="mb-3">
                  <span className="text-sm font-bold text-gray-700">Type : </span>
                  <span className="text-sm text-gray-900 font-semibold">{mandat.mandat_type}</span>
                </div>
              )}

              {/* Dates */}
              {(mandat.start_date || mandat.end_date) && (
                <div className="flex items-center text-sm text-gray-900 space-x-4 font-medium">
                  {mandat.start_date && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>
                        Début : {new Date(mandat.start_date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  )}
                  {mandat.end_date && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>
                        Fin : {new Date(mandat.end_date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {mandat.description && (
            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-900 whitespace-pre-wrap font-medium">{mandat.description}</p>
            </div>
          )}
        </div>

        {/* Tâches du mandat */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <TasksList mandatId={parseInt(mandatId)} />
        </div>

        {/* Dépenses du mandat */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <ExpensesList mandatId={parseInt(mandatId)} />
        </div>
      </main>
    </>
  );
}

