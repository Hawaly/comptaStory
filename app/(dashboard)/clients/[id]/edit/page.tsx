"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ClientForm } from "@/components/clients/ClientForm";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Client } from "@/types/database";

export default function EditClientPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      <Header title="Modifier le client" />
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/clients/${clientId}`}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la fiche client
          </Link>
        </div>

        {/* Contenu */}
        <div className="max-w-4xl">
          {isLoading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : error || !client ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800">{error || "Client non trouvé"}</p>
              <Link
                href="/clients"
                className="inline-block mt-4 text-red-600 hover:text-red-800"
              >
                Retour à la liste
              </Link>
            </div>
          ) : (
            <ClientForm client={client} mode="edit" />
          )}
        </div>
      </main>
    </>
  );
}

