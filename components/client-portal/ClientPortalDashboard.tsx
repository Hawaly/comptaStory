"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import {
  Target,
  FileText,
  Receipt,
  Briefcase,
  Calendar,
  LogOut,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  TrendingUp,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';
import type { SocialMediaStrategy, Invoice, Mandat } from '@/types/database';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  role_code: string;
  role_name: string;
  client_id?: number;
  client_name?: string;
}

interface ClientPortalDashboardProps {
  user: User;
}

interface ClientData {
  strategies: SocialMediaStrategy[];
  invoices: Invoice[];
  mandats: Mandat[];
}

export function ClientPortalDashboard({ user }: ClientPortalDashboardProps) {
  const [data, setData] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    if (user.client_id) {
      loadClientData();
    }
  }, [user.client_id]);

  const loadClientData = async () => {
    if (!user.client_id) return;

    setIsLoading(true);
    try {
      const [strategiesRes, invoicesRes, mandatsRes] = await Promise.all([
        supabase
          .from('social_media_strategy')
          .select('*')
          .eq('client_id', user.client_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('invoice')
          .select('*')
          .eq('client_id', user.client_id)
          .order('issue_date', { ascending: false }),
        supabase
          .from('mandat')
          .select('*')
          .eq('client_id', user.client_id)
          .order('created_at', { ascending: false })
      ]);

      setData({
        strategies: strategiesRes.data || [],
        invoices: invoicesRes.data || [],
        mandats: mandatsRes.data || []
      });
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!data) return null;

  // Calculs statistiques
  const stats = {
    strategies: {
      total: data.strategies.length,
      active: data.strategies.filter(s => s.status === 'actif').length
    },
    mandats: {
      total: data.mandats.length,
      enCours: data.mandats.filter(m => m.status === 'en_cours').length
    },
    invoices: {
      total: data.invoices.length,
      montantTotal: data.invoices.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0),
      payees: data.invoices.filter(inv => inv.status === 'payee').length,
      enAttente: data.invoices.filter(inv => inv.status === 'envoyee').length
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-orange to-red-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">YS</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Espace Client</h1>
                <p className="text-sm text-gray-600">{user.client_name || user.email}</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 font-semibold transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bienvenue */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue, {user.client_name?.split(' ')[0] || 'Client'} !
          </h2>
          <p className="text-gray-600">
            Voici un aperçu de vos projets et documents
          </p>
        </div>

        {/* Cartes statistiques */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Stratégies */}
          <Card className="p-6 bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Target className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.strategies.total}</div>
              </div>
            </div>
            <h3 className="text-sm font-semibold mb-1">Stratégies</h3>
            <p className="text-xs text-white/80">
              {stats.strategies.active} active{stats.strategies.active > 1 ? 's' : ''}
            </p>
          </Card>

          {/* Mandats */}
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.mandats.total}</div>
              </div>
            </div>
            <h3 className="text-sm font-semibold mb-1">Mandats</h3>
            <p className="text-xs text-white/80">
              {stats.mandats.enCours} en cours
            </p>
          </Card>

          {/* Factures */}
          <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.invoices.total}</div>
              </div>
            </div>
            <h3 className="text-sm font-semibold mb-1">Factures</h3>
            <p className="text-xs text-white/80">
              {stats.invoices.payees} payée{stats.invoices.payees > 1 ? 's' : ''}
            </p>
          </Card>

          {/* Montant Total */}
          <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-sm font-semibold mb-1">Montant Total</h3>
            <div className="text-3xl font-bold">
              {stats.invoices.montantTotal.toLocaleString('fr-CH')}
            </div>
            <p className="text-xs text-white/80">CHF</p>
          </Card>
        </div>

        {/* Contenu Principal */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Factures Récentes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Factures Récentes
              </h3>
            </div>

            <div className="space-y-3">
              {data.invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune facture</p>
                </div>
              ) : (
                data.invoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">
                        Facture {invoice.invoice_number}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {invoice.total_ttc?.toLocaleString('fr-CH')} CHF
                      </div>
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === 'payee'
                          ? 'bg-green-100 text-green-700'
                          : invoice.status === 'envoyee'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {invoice.status === 'payee' ? '✓ Payée' : 
                         invoice.status === 'envoyee' ? '⏳ En attente' : 
                         invoice.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Stratégies */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-orange" />
                Stratégies Social Media
              </h3>
            </div>

            <div className="space-y-3">
              {data.strategies.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune stratégie</p>
                </div>
              ) : (
                data.strategies.slice(0, 5).map((strategy) => (
                  <div
                    key={strategy.id}
                    className="p-4 bg-gray-50 rounded-xl hover:bg-brand-orange/10 transition-colors border-2 border-transparent hover:border-brand-orange"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">
                          Stratégie v{strategy.version}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                          {strategy.contexte_general || 'Stratégie social media'}
                        </p>
                        {strategy.plateformes && strategy.plateformes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {strategy.plateformes.slice(0, 3).map((platform, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full"
                              >
                                {platform}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${
                        strategy.status === 'actif'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {strategy.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Mandats */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Mandats
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {data.mandats.length === 0 ? (
                <div className="text-center py-8 col-span-2">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun mandat</p>
                </div>
              ) : (
                data.mandats.slice(0, 4).map((mandat) => (
                  <div
                    key={mandat.id}
                    className="p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200"
                  >
                    <h4 className="font-bold text-gray-900 mb-2">{mandat.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {mandat.description || 'Aucune description'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        mandat.status === 'en_cours'
                          ? 'bg-blue-100 text-blue-700'
                          : mandat.status === 'termine'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {mandat.status === 'en_cours' ? 'En cours' : 
                         mandat.status === 'termine' ? 'Terminé' : 
                         mandat.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(mandat.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Informations de contact */}
        <Card className="p-6 mt-6 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Besoin d'aide ?
          </h3>
          <p className="text-gray-600 mb-4">
            Notre équipe est à votre disposition pour toute question
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:contact@yourstory.ch"
              className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-dark transition-colors font-semibold"
            >
              <Mail className="w-4 h-4" />
              contact@yourstory.ch
            </a>
            <a
              href="tel:+41000000000"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Phone className="w-4 h-4" />
              +41 (0) XX XXX XX XX
            </a>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            © 2024 YourStory Agency. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
