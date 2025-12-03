"use client";

import { useRequireClient } from '@/contexts/SimpleAuthContext';
import { EnrichedClientDashboard } from '@/components/client-portal/EnrichedClientDashboard';
import { Loader2 } from 'lucide-react';

export default function ClientPortalPage() {
  const { user, isLoading } = useRequireClient();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.client_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Erreur: Aucun client associé</p>
        </div>
      </div>
    );
  }

  return <EnrichedClientDashboard user={user} />;
}
