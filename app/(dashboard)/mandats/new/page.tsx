"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { MandatForm } from "@/components/mandats/MandatForm";
import { ArrowLeft, Loader2 } from "lucide-react";

function NewMandatContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client_id");

  if (!clientId) {
    return (
      <>
        <Header title="Erreur" />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <p className="text-red-900 font-semibold">
              Client ID manquant. Veuillez créer le mandat depuis la fiche client.
            </p>
            <Link
              href="/clients"
              className="inline-block mt-4 text-red-700 hover:text-red-900 font-bold"
            >
              Retour aux clients
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Nouveau mandat" />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link
            href={`/clients/${clientId}`}
            className="flex items-center text-gray-900 hover:text-blue-700 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la fiche client
          </Link>
        </div>

        <div className="max-w-4xl">
          <MandatForm mode="create" clientId={parseInt(clientId)} />
        </div>
      </main>
    </>
  );
}

export default function NewMandatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    }>
      <NewMandatContent />
    </Suspense>
  );
}

