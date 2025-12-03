-- Script de vérification AVANT migration
-- À exécuter pour vérifier l'état de vos données

-- =========================================================
-- 0. VÉRIFIER LA STRUCTURE ACTUELLE
-- =========================================================

-- Vérifier quelles colonnes existent dans social_media_strategy
SELECT 
  '=== COLONNES EXISTANTES ===' AS info;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'social_media_strategy'
AND column_name IN ('id', 'mandat_id', 'client_id')
ORDER BY column_name;

-- =========================================================
-- 1. VÉRIFIER LES DONNÉES EXISTANTES
-- =========================================================

-- Compter les stratégies existantes
SELECT 
  'Total stratégies' AS check_name,
  COUNT(*) AS count
FROM social_media_strategy;

-- Vérifier si mandat_id existe (avec gestion d'erreur)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_strategy' 
    AND column_name = 'mandat_id'
  ) THEN
    RAISE NOTICE 'Column mandat_id EXISTS';
    PERFORM COUNT(*) FROM social_media_strategy WHERE mandat_id IS NOT NULL;
  ELSE
    RAISE NOTICE 'Column mandat_id DOES NOT EXIST - Migration peut-être déjà faite?';
  END IF;
END $$;

-- Vérifier si client_id existe déjà
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_strategy' 
    AND column_name = 'client_id'
  ) THEN
    RAISE NOTICE 'Column client_id EXISTS - Migration déjà effectuée?';
  ELSE
    RAISE NOTICE 'Column client_id DOES NOT EXIST - Migration nécessaire';
  END IF;
END $$;

-- Vérifier la table mandat (si elle existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mandat') THEN
    RAISE NOTICE 'Table mandat EXISTS';
  ELSE
    RAISE NOTICE 'Table mandat DOES NOT EXIST';
  END IF;
END $$;

-- =========================================================
-- 2. VÉRIFIER LA CORRESPONDANCE MANDAT → CLIENT
-- =========================================================

-- Vérifier que tous les mandats ont un client_id
SELECT 
  'Mandats avec client_id' AS check_name,
  COUNT(*) AS count
FROM mandat
WHERE client_id IS NOT NULL;

-- Vérifier les stratégies qui PEUVENT être migrées
SELECT 
  'Stratégies migrables' AS check_name,
  COUNT(*) AS count
FROM social_media_strategy sms
INNER JOIN mandat m ON sms.mandat_id = m.id
WHERE m.client_id IS NOT NULL;

-- =========================================================
-- 3. IDENTIFIER LES PROBLÈMES POTENTIELS
-- =========================================================

-- Stratégies avec mandat_id qui n'existe plus
SELECT 
  'Stratégies avec mandat inexistant' AS probleme,
  COUNT(*) AS count
FROM social_media_strategy sms
WHERE mandat_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM mandat WHERE id = sms.mandat_id);

-- Stratégies avec mandat qui n'a pas de client
SELECT 
  'Stratégies avec mandat sans client' AS probleme,
  COUNT(*) AS count
FROM social_media_strategy sms
INNER JOIN mandat m ON sms.mandat_id = m.id
WHERE m.client_id IS NULL;

-- =========================================================
-- 4. APERÇU DES DONNÉES À MIGRER
-- =========================================================

-- Voir les 10 premières stratégies à migrer
SELECT 
  sms.id AS strategy_id,
  sms.mandat_id,
  m.client_id,
  c.name AS client_name,
  sms.status,
  sms.created_at
FROM social_media_strategy sms
LEFT JOIN mandat m ON sms.mandat_id = m.id
LEFT JOIN client c ON m.client_id = c.id
ORDER BY sms.id
LIMIT 10;

-- =========================================================
-- 5. RÉSUMÉ
-- =========================================================

SELECT 
  '=== RÉSUMÉ ===' AS info;

SELECT 
  COUNT(*) AS total_strategies,
  COUNT(CASE WHEN mandat_id IS NOT NULL THEN 1 END) AS with_mandat,
  COUNT(CASE WHEN mandat_id IS NULL THEN 1 END) AS without_mandat
FROM social_media_strategy;

-- =========================================================
-- ✅ SI TOUT EST OK, VOUS POUVEZ EXÉCUTER LA MIGRATION
-- ❌ SI DES PROBLÈMES, CORRIGER D'ABORD
-- =========================================================
