import { Header } from "@/components/layout/Header";
import { ClientForm } from "@/components/clients/ClientForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewClientPage() {
  return (
    <>
      <Header title="Nouveau client" />
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/clients"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste des clients
          </Link>
        </div>

        {/* Formulaire */}
        <div className="max-w-4xl">
          <ClientForm mode="create" />
        </div>
      </main>
    </>
  );
}

