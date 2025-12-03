"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { MandatForm } from "@/components/mandats/MandatForm";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Mandat } from "@/types/database";

export default function EditMandatPage() {
  const params = useParams();
  const mandatId = params.id as string;

  const [mandat, setMandat] = useState<Mandat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMandat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mandatId]);

  async function loadMandat() {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("mandat")
        .select("*")
        .eq("id", mandatId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error("Mandat non trouvé");

      setMandat(data);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Erreur lors du chargement du mandat");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Header title="Modifier le mandat" />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link
            href={`/mandats/${mandatId}`}
            className="flex items-center text-gray-900 hover:text-blue-700 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au mandat
          </Link>
        </div>

        <div className="max-w-4xl">
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-900 font-semibold">Chargement...</p>
            </div>
          ) : error || !mandat ? (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
              <p className="text-red-900 font-semibold">{error || "Mandat non trouvé"}</p>
              <Link
                href="/mandats"
                className="inline-block mt-4 text-red-700 hover:text-red-900 font-bold"
              >
                Retour à la liste
              </Link>
            </div>
          ) : (
            <MandatForm mandat={mandat} clientId={mandat.client_id} mode="edit" />
          )}
        </div>
      </main>
    </>
  );
}

