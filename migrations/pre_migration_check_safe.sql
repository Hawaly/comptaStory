-- Script de vérification AVANT migration (VERSION SÉCURISÉE)
-- À exécuter pour vérifier l'état de vos données
-- Gère automatiquement les colonnes manquantes

-- =========================================================
-- 0. DIAGNOSTIC COMPLET DE LA STRUCTURE
-- =========================================================

\echo '=== DIAGNOSTIC DE LA BASE DE DONNÉES ==='
\echo ''

-- Vérifier quelles tables existent
SELECT 
  '--- TABLES EXISTANTES ---' AS info;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('social_media_strategy', 'mandat', 'client', 'editorial_calendar', 'editorial_post')
ORDER BY table_name;

\echo ''
SELECT 
  '--- STRUCTURE social_media_strategy ---' AS info;

-- Vérifier les colonnes de social_media_strategy
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'social_media_strategy'
AND column_name IN ('id', 'mandat_id', 'client_id')
ORDER BY ordinal_position;

-- =========================================================
-- 1. DÉTERMINER LE SCÉNARIO
-- =========================================================

\echo ''
SELECT 
  '--- SCÉNARIO DE MIGRATION ---' AS info;

DO $$
DECLARE
  has_mandat_id BOOLEAN;
  has_client_id BOOLEAN;
  has_mandat_table BOOLEAN;
  has_editorial_calendar BOOLEAN;
  scenario TEXT;
BEGIN
  -- Vérifier les colonnes
  has_mandat_id := EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_strategy' AND column_name = 'mandat_id'
  );
  
  has_client_id := EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_strategy' AND column_name = 'client_id'
  );
  
  has_mandat_table := EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'mandat'
  );
  
  has_editorial_calendar := EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'editorial_calendar'
  );
  
  -- Déterminer le scénario
  IF has_client_id AND has_editorial_calendar THEN
    scenario := '✅ MIGRATION DÉJÀ EFFECTUÉE - Nouvelle architecture en place';
  ELSIF has_mandat_id AND NOT has_client_id THEN
    scenario := '🔄 MIGRATION NÉCESSAIRE - Ancienne architecture détectée';
  ELSIF NOT has_mandat_id AND NOT has_client_id THEN
    scenario := '🆕 NOUVELLE INSTALLATION - Aucune architecture détectée';
  ELSE
    scenario := '⚠️ ÉTAT INTERMÉDIAIRE - Migration partielle?';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'SCÉNARIO: %', scenario;
  RAISE NOTICE '====================================';
  RAISE NOTICE 'mandat_id exists: %', has_mandat_id;
  RAISE NOTICE 'client_id exists: %', has_client_id;
  RAISE NOTICE 'table mandat exists: %', has_mandat_table;
  RAISE NOTICE 'table editorial_calendar exists: %', has_editorial_calendar;
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;

-- =========================================================
-- 2. STATISTIQUES SELON ARCHITECTURE ACTUELLE
-- =========================================================

\echo ''
SELECT 
  '--- STATISTIQUES ---' AS info;

-- Nombre total de stratégies
SELECT 
  'Total stratégies' AS metric,
  COUNT(*) AS count
FROM social_media_strategy;

-- Si mandat_id existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_strategy' AND column_name = 'mandat_id'
  ) THEN
    RAISE NOTICE 'Stratégies avec mandat_id: %', (
      SELECT COUNT(*) FROM social_media_strategy WHERE mandat_id IS NOT NULL
    );
  END IF;
END $$;

-- Si client_id existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_strategy' AND column_name = 'client_id'
  ) THEN
    RAISE NOTICE 'Stratégies avec client_id: %', (
      SELECT COUNT(*) FROM social_media_strategy WHERE client_id IS NOT NULL
    );
  END IF;
END $$;

-- Si editorial_calendar existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'editorial_calendar') THEN
    RAISE NOTICE 'Calendriers éditoriaux: %', (SELECT COUNT(*) FROM editorial_calendar);
  END IF;
END $$;

-- Si editorial_post existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'editorial_post') THEN
    RAISE NOTICE 'Posts planifiés: %', (SELECT COUNT(*) FROM editorial_post);
  END IF;
END $$;

-- =========================================================
-- 3. VÉRIFICATIONS SI ANCIENNE ARCHITECTURE (mandat_id)
-- =========================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_strategy' AND column_name = 'mandat_id'
  ) THEN
    RAISE NOTICE '';
    RAISE NOTICE '--- VÉRIFICATIONS ANCIENNE ARCHITECTURE ---';
    
    -- Vérifier table mandat
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mandat') THEN
      RAISE NOTICE 'Mandats totaux: %', (SELECT COUNT(*) FROM mandat);
      RAISE NOTICE 'Mandats avec client_id: %', (
        SELECT COUNT(*) FROM mandat WHERE client_id IS NOT NULL
      );
      
      -- Stratégies migrables
      RAISE NOTICE 'Stratégies migrables vers client_id: %', (
        SELECT COUNT(*)
        FROM social_media_strategy sms
        INNER JOIN mandat m ON sms.mandat_id = m.id
        WHERE m.client_id IS NOT NULL
      );
      
      -- Problèmes potentiels
      RAISE NOTICE '⚠️ Stratégies avec mandat inexistant: %', (
        SELECT COUNT(*)
        FROM social_media_strategy sms
        WHERE mandat_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM mandat WHERE id = sms.mandat_id)
      );
      
      RAISE NOTICE '⚠️ Stratégies avec mandat sans client: %', (
        SELECT COUNT(*)
        FROM social_media_strategy sms
        INNER JOIN mandat m ON sms.mandat_id = m.id
        WHERE m.client_id IS NULL
      );
    ELSE
      RAISE NOTICE '⚠️ Table mandat n''existe pas - Migration impossible!';
    END IF;
  END IF;
END $$;

-- =========================================================
-- 4. VÉRIFICATIONS SI NOUVELLE ARCHITECTURE (client_id)
-- =========================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_strategy' AND column_name = 'client_id'
  ) THEN
    RAISE NOTICE '';
    RAISE NOTICE '--- VÉRIFICATIONS NOUVELLE ARCHITECTURE ---';
    
    RAISE NOTICE 'Stratégies avec client_id valide: %', (
      SELECT COUNT(*)
      FROM social_media_strategy sms
      INNER JOIN client c ON sms.client_id = c.id
    );
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'editorial_calendar') THEN
      RAISE NOTICE 'Calendriers créés: %', (SELECT COUNT(*) FROM editorial_calendar);
      
      -- Vérifier que toutes les stratégies ont un calendrier
      RAISE NOTICE 'Stratégies SANS calendrier: %', (
        SELECT COUNT(*)
        FROM social_media_strategy sms
        WHERE NOT EXISTS (
          SELECT 1 FROM editorial_calendar WHERE strategy_id = sms.id
        )
      );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'editorial_post') THEN
      RAISE NOTICE 'Posts planifiés totaux: %', (SELECT COUNT(*) FROM editorial_post);
      RAISE NOTICE 'Posts par statut:';
      RAISE NOTICE '  - Draft: %', (SELECT COUNT(*) FROM editorial_post WHERE status = 'draft');
      RAISE NOTICE '  - Scheduled: %', (SELECT COUNT(*) FROM editorial_post WHERE status = 'scheduled');
      RAISE NOTICE '  - Published: %', (SELECT COUNT(*) FROM editorial_post WHERE status = 'published');
    END IF;
  END IF;
END $$;

-- =========================================================
-- 5. RECOMMANDATION
-- =========================================================

\echo ''
SELECT 
  '--- RECOMMANDATION ---' AS info;

DO $$
DECLARE
  has_mandat_id BOOLEAN;
  has_client_id BOOLEAN;
  has_editorial_calendar BOOLEAN;
  recommendation TEXT;
BEGIN
  has_mandat_id := EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_strategy' AND column_name = 'mandat_id'
  );
  
  has_client_id := EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_strategy' AND column_name = 'client_id'
  );
  
  has_editorial_calendar := EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'editorial_calendar'
  );
  
  IF has_client_id AND has_editorial_calendar THEN
    recommendation := '✅ Rien à faire - Migration déjà effectuée! Vous pouvez utiliser EditorialCalendarNew.';
  ELSIF has_mandat_id AND NOT has_client_id THEN
    recommendation := '🔄 Exécuter: restructure_strategy_architecture.sql';
  ELSIF NOT has_mandat_id AND NOT has_client_id THEN
    recommendation := '🆕 Exécuter: fresh_install_architecture.sql (nouvelle installation)';
  ELSE
    recommendation := '⚠️ État incohérent - Vérifier manuellement ou restaurer une sauvegarde';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║ RECOMMANDATION                         ║';
  RAISE NOTICE '╠════════════════════════════════════════╣';
  RAISE NOTICE '║ %', rpad(recommendation, 38);
  RAISE NOTICE '╚════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- =========================================================
-- FIN DU DIAGNOSTIC
-- =========================================================
