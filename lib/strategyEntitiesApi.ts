/**
 * API pour gérer les entités de la stratégie social media
 * - Personas
 * - Piliers de contenu
 * - KPIs et mesures
 */

import { supabase } from './supabaseClient';
import type {
  Persona,
  PersonaInsert,
  PersonaUpdate,
  PilierContenu,
  PilierContenuInsert,
  PilierContenuUpdate,
  KPI,
  KPIInsert,
  KPIUpdate,
  KPIMesure,
  KPIMesureInsert,
} from '@/types/database';

// =========================================================
// PERSONAS
// =========================================================

/**
 * Récupérer tous les personas d'une stratégie
 */
export async function getPersonas(strategyId: number): Promise<Persona[]> {
  const { data, error } = await supabase
    .from('persona')
    .select('*')
    .eq('strategy_id', strategyId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des personas:', error);
    throw error;
  }

  return data || [];
}

/**
 * Créer un nouveau persona
 */
export async function createPersona(persona: PersonaInsert): Promise<Persona> {
  const { data, error } = await supabase
    .from('persona')
    .insert([persona])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du persona:', error);
    throw error;
  }

  return data;
}

/**
 * Mettre à jour un persona
 */
export async function updatePersona(
  personaId: number,
  updates: PersonaUpdate
): Promise<Persona> {
  const { data, error } = await supabase
    .from('persona')
    .update(updates)
    .eq('id', personaId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour du persona:', error);
    throw error;
  }

  return data;
}

/**
 * Supprimer un persona
 */
export async function deletePersona(personaId: number): Promise<boolean> {
  const { error } = await supabase.from('persona').delete().eq('id', personaId);

  if (error) {
    console.error('Erreur lors de la suppression du persona:', error);
    return false;
  }

  return true;
}

// =========================================================
// PILIERS DE CONTENU
// =========================================================

/**
 * Récupérer tous les piliers de contenu d'une stratégie
 */
export async function getPiliers(strategyId: number): Promise<PilierContenu[]> {
  const { data, error } = await supabase
    .from('pilier_contenu')
    .select('*')
    .eq('strategy_id', strategyId)
    .order('ordre', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des piliers:', error);
    throw error;
  }

  return data || [];
}

/**
 * Créer un nouveau pilier de contenu
 */
export async function createPilier(
  pilier: PilierContenuInsert
): Promise<PilierContenu> {
  const { data, error } = await supabase
    .from('pilier_contenu')
    .insert([pilier])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du pilier:', error);
    throw error;
  }

  return data;
}

/**
 * Mettre à jour un pilier de contenu
 */
export async function updatePilier(
  pilierId: number,
  updates: PilierContenuUpdate
): Promise<PilierContenu> {
  const { data, error } = await supabase
    .from('pilier_contenu')
    .update(updates)
    .eq('id', pilierId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour du pilier:', error);
    throw error;
  }

  return data;
}

/**
 * Supprimer un pilier de contenu
 */
export async function deletePilier(pilierId: number): Promise<boolean> {
  const { error } = await supabase
    .from('pilier_contenu')
    .delete()
    .eq('id', pilierId);

  if (error) {
    console.error('Erreur lors de la suppression du pilier:', error);
    return false;
  }

  return true;
}

/**
 * Réordonner les piliers
 */
export async function reorderPiliers(
  pilierIds: number[],
  strategyId: number
): Promise<boolean> {
  try {
    // Mettre à jour l'ordre de chaque pilier
    const updates = pilierIds.map((id, index) => ({
      id,
      ordre: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('pilier_contenu')
        .update({ ordre: update.ordre })
        .eq('id', update.id)
        .eq('strategy_id', strategyId);

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors du réordonnancement des piliers:', error);
    return false;
  }
}

// =========================================================
// KPIs
// =========================================================

/**
 * Récupérer tous les KPIs d'une stratégie
 */
export async function getKPIs(strategyId: number): Promise<KPI[]> {
  const { data, error } = await supabase
    .from('kpi')
    .select('*')
    .eq('strategy_id', strategyId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des KPIs:', error);
    throw error;
  }

  return data || [];
}

/**
 * Créer un nouveau KPI
 */
export async function createKPI(kpi: KPIInsert): Promise<KPI> {
  const { data, error } = await supabase
    .from('kpi')
    .insert([kpi])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du KPI:', error);
    throw error;
  }

  return data;
}

/**
 * Mettre à jour un KPI
 */
export async function updateKPI(
  kpiId: number,
  updates: KPIUpdate
): Promise<KPI> {
  const { data, error } = await supabase
    .from('kpi')
    .update(updates)
    .eq('id', kpiId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour du KPI:', error);
    throw error;
  }

  return data;
}

/**
 * Supprimer un KPI
 */
export async function deleteKPI(kpiId: number): Promise<boolean> {
  const { error } = await supabase.from('kpi').delete().eq('id', kpiId);

  if (error) {
    console.error('Erreur lors de la suppression du KPI:', error);
    return false;
  }

  return true;
}

// =========================================================
// KPI MESURES
// =========================================================

/**
 * Récupérer toutes les mesures d'un KPI
 */
export async function getKPIMesures(kpiId: number): Promise<KPIMesure[]> {
  const { data, error } = await supabase
    .from('kpi_mesure')
    .select('*')
    .eq('kpi_id', kpiId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des mesures KPI:', error);
    throw error;
  }

  return data || [];
}

/**
 * Ajouter une mesure à un KPI
 */
export async function addKPIMesure(mesure: KPIMesureInsert): Promise<KPIMesure> {
  const { data, error } = await supabase
    .from('kpi_mesure')
    .insert([mesure])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de l\'ajout de la mesure KPI:', error);
    throw error;
  }

  return data;
}

/**
 * Supprimer une mesure KPI
 */
export async function deleteKPIMesure(mesureId: number): Promise<boolean> {
  const { error } = await supabase
    .from('kpi_mesure')
    .delete()
    .eq('id', mesureId);

  if (error) {
    console.error('Erreur lors de la suppression de la mesure KPI:', error);
    return false;
  }

  return true;
}

/**
 * Récupérer les dernières mesures pour tous les KPIs d'une stratégie
 */
export async function getLatestKPIMesures(strategyId: number): Promise<{
  kpi: KPI;
  latestMesure: KPIMesure | null;
}[]> {
  try {
    // Récupérer tous les KPIs
    const kpis = await getKPIs(strategyId);

    // Pour chaque KPI, récupérer la dernière mesure
    const results = await Promise.all(
      kpis.map(async (kpi) => {
        const mesures = await getKPIMesures(kpi.id);
        return {
          kpi,
          latestMesure: mesures.length > 0 ? mesures[0] : null,
        };
      })
    );

    return results;
  } catch (error) {
    console.error('Erreur lors de la récupération des dernières mesures:', error);
    return [];
  }
}

// =========================================================
// FONCTIONS UTILITAIRES
// =========================================================

/**
 * Récupérer toutes les entités d'une stratégie en une seule fois
 */
export async function getStrategyEntities(strategyId: number): Promise<{
  personas: Persona[];
  piliers: PilierContenu[];
  kpis: KPI[];
}> {
  const [personas, piliers, kpis] = await Promise.all([
    getPersonas(strategyId),
    getPiliers(strategyId),
    getKPIs(strategyId),
  ]);

  return { personas, piliers, kpis };
}

/**
 * Compter les entités d'une stratégie
 */
export async function countStrategyEntities(strategyId: number): Promise<{
  personas: number;
  piliers: number;
  kpis: number;
}> {
  const entities = await getStrategyEntities(strategyId);

  return {
    personas: entities.personas.length,
    piliers: entities.piliers.length,
    kpis: entities.kpis.length,
  };
}
