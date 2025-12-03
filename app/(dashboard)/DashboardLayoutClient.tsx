"use client";

import { useRequireAdmin } from "@/contexts/SimpleAuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Loader2 } from "lucide-react";

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, user } = useRequireAdmin();

  // Afficher loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  // Si pas admin (role_id !== 1), useRequireAdmin() redirige automatiquement
  // Mais on ajoute une sécurité supplémentaire ici
  if (!user || user.role_id !== 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès Refusé</h2>
          <p className="text-gray-600">Cette page est réservée aux administrateurs (role_id = 1).</p>
        </div>
      </div>
    );
  }

  // Utilisateur admin confirmé, afficher le dashboard
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area - responsive margin */}
      <div className="flex-1 lg:ml-72 ml-0">
        {children}
      </div>
    </div>
  );
}
