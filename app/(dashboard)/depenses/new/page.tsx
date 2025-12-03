import { Header } from "@/components/layout/Header";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewExpensePage() {
  return (
    <>
      <Header title="Nouvelle dépense" />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link
            href="/depenses"
            className="flex items-center text-gray-900 hover:text-blue-700 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux dépenses
          </Link>
        </div>

        <div className="max-w-4xl">
          <ExpenseForm mode="create" />
        </div>
      </main>
    </>
  );
}

