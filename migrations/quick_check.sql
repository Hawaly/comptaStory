-- Quick Check - Diagnostic rapide de votre architecture actuelle

\echo '========================================='
\echo 'DIAGNOSTIC RAPIDE'
\echo '========================================='
\echo ''

-- 1. Vérifier les colonnes de social_media_strategy
\echo '1. Colonnes de social_media_strategy:'
SELECT 
  column_name,
  CASE 
    WHEN column_name = 'mandat_id' THEN '  [ANCIENNE ARCHITECTURE]'
    WHEN column_name = 'client_id' THEN '  [NOUVELLE ARCHITECTURE]'
    ELSE ''
  END as note
FROM information_schema.columns
WHERE table_name = 'social_media_strategy'
AND column_name IN ('id', 'mandat_id', 'client_id')
ORDER BY column_name;

\echo ''
\echo '2. Tables nouvelles:'
-- 2. Vérifier les nouvelles tables
SELECT 
  table_name,
  CASE table_name
    WHEN 'editorial_calendar' THEN '  [✓ Calendrier éditorial]'
    WHEN 'editorial_post' THEN '  [✓ Posts individuels]'
  END as description
FROM information_schema.tables
WHERE table_name IN ('editorial_calendar', 'editorial_post');

\echo ''
\echo '3. Nombre de stratégies:'
-- 3. Compter les stratégies
SELECT COUNT(*) as total_strategies FROM social_media_strategy;

\echo ''
\echo '========================================='
\echo 'CONCLUSION:'
\echo '========================================='

-- Conclusion automatique
DO $$
DECLARE
  has_client_id BOOLEAN;
  has_editorial BOOLEAN;
BEGIN
  has_client_id := EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_strategy' AND column_name = 'client_id'
  );
  
  has_editorial := EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'editorial_calendar'
  );
  
  IF has_client_id AND has_editorial THEN
    RAISE NOTICE '✅ NOUVELLE ARCHITECTURE ACTIVE';
    RAISE NOTICE '   Migration déjà effectuée!';
  ELSIF has_client_id AND NOT has_editorial THEN
    RAISE NOTICE '⚠️ MIGRATION PARTIELLE';
    RAISE NOTICE '   client_id existe mais pas editorial_calendar';
    RAISE NOTICE '   → Exécuter: restructure_strategy_architecture.sql';
  ELSIF NOT has_client_id THEN
    RAISE NOTICE '🔄 ANCIENNE ARCHITECTURE';
    RAISE NOTICE '   Migration nécessaire';
    RAISE NOTICE '   → Exécuter: restructure_strategy_architecture.sql';
  END IF;
END $$;

\echo ''
