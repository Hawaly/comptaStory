import { supabase } from './supabaseClient';
import { CompanySettings } from '@/types/database';

// Cache en mémoire pour éviter de requêter à chaque fois
let cachedSettings: CompanySettings | null = null;

/**
 * Récupère les paramètres de l'agence depuis la base de données
 * Utilise un cache pour éviter les requêtes répétées
 */
export async function getCompanySettings(): Promise<CompanySettings> {
  // Retourner le cache si disponible
  if (cachedSettings) {
    return cachedSettings;
  }

  // Récupérer depuis la DB
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    // Valeurs par défaut si erreur
    console.warn('Impossible de récupérer company_settings, utilisation des valeurs par défaut');
    return {
      id: 1,
      agency_name: 'YourStory Agency',
      address: 'Rue de la Paix 15',
      zip_code: '2000',
      city: 'Neuchâtel',
      country: 'Suisse',
      phone: '078 202 33 09',
      email: 'contact@yourstory.ch',
      tva_number: null,
      represented_by: 'Mohamad Hawaley',
      iban: 'CH00 0000 0000 0000 0000 0',
      qr_iban: 'CH44 3199 9123 0008 8901 2',
    };
  }

  // Mettre en cache
  cachedSettings = data as CompanySettings;
  return cachedSettings;
}

/**
 * Invalide le cache (à appeler après modification des settings)
 */
export function clearCompanySettingsCache() {
  cachedSettings = null;
}

/**
 * Formate l'adresse complète de l'agence
 */
export function formatCompanyAddress(settings: CompanySettings): string {
  const parts: string[] = [];
  
  if (settings.address) parts.push(settings.address);
  
  const location: string[] = [];
  if (settings.zip_code) location.push(settings.zip_code);
  if (settings.city) location.push(settings.city);
  if (location.length > 0) parts.push(location.join(' '));
  
  if (settings.country) parts.push(settings.country);
  
  return parts.join(', ');
}

