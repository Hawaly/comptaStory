"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { FullClientDashboard } from "@/components/clients/FullClientDashboard";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Loader2,
  Settings
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Client } from "@/types/database";

export default function ClientDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function loadClient() {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("client")
        .select("*")
        .eq("id", clientId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error("Client non trouvé");

      setClient(data);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Erreur lors du chargement du client");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!client) return;

    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer le client "${client.name}" ?\n\n` +
      "Cette action est irréversible et supprimera également tous les mandats, contrats, factures et dépenses associés."
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from("client")
        .delete()
        .eq("id", clientId);

      if (error) throw error;

      router.push("/clients");
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <Header title="Chargement..." />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-brand-orange mx-auto mb-4" />
            <p className="text-gray-900 font-semibold">Chargement du dashboard...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !client) {
    return (
      <>
        <Header title="Erreur" />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <p className="text-red-900 font-semibold">{error || "Client non trouvé"}</p>
            <Link
              href="/clients"
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
      <Header title={`Dashboard - ${client.name}`} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Barre d'actions supérieure */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Link
            href="/clients"
            className="flex items-center text-gray-900 hover:text-brand-orange transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux clients
          </Link>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/clients/${clientId}/edit`)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
            >
              <Edit className="w-4 h-4" />
              <span>Modifier</span>
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold disabled:opacity-50"
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

        {/* Dashboard complet */}
        <FullClientDashboard client={client} />
      </main>
    </>
  );
}
