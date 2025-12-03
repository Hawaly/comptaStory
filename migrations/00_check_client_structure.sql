-- =========================================================
-- VÉRIFICATION COMPLÈTE STRUCTURE TABLE CLIENT
-- =========================================================

-- 1. Vérifier la structure complète de la table client
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'client'
ORDER BY ordinal_position;

-- 2. Vérifier le type de la colonne id
DO $$
DECLARE
  id_type TEXT;
BEGIN
  SELECT data_type INTO id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'client' 
    AND column_name = 'id';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TYPE DE LA COLONNE client.id: %', id_type;
  RAISE NOTICE '========================================';
  
  IF id_type = 'bigint' THEN
    RAISE NOTICE '⚠️  ATTENTION: client.id est BIGINT';
    RAISE NOTICE '➡️  Il faut utiliser BIGINT au lieu de INTEGER pour client_id dans app_user';
  ELSIF id_type = 'integer' THEN
    RAISE NOTICE '✅ client.id est INTEGER (OK)';
  ELSE
    RAISE NOTICE '❌ Type inattendu: %', id_type;
  END IF;
END $$;

-- 3. Afficher un exemple de structure recommandée
DO $$
DECLARE
  id_type TEXT;
BEGIN
  SELECT data_type INTO id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'client' 
    AND column_name = 'id';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STRUCTURE RECOMMANDÉE POUR app_user:';
  RAISE NOTICE '========================================';
  
  IF id_type = 'bigint' THEN
    RAISE NOTICE 'CREATE TABLE public.app_user (';
    RAISE NOTICE '  id SERIAL PRIMARY KEY,';
    RAISE NOTICE '  email VARCHAR(255) UNIQUE NOT NULL,';
    RAISE NOTICE '  password_hash VARCHAR(255) NOT NULL,';
    RAISE NOTICE '  role VARCHAR(50) NOT NULL DEFAULT ''client'',';
    RAISE NOTICE '  client_id BIGINT REFERENCES public.client(id),  -- ⚠️ BIGINT';
    RAISE NOTICE '  is_active BOOLEAN DEFAULT true,';
    RAISE NOTICE '  ...';
    RAISE NOTICE ');';
  ELSE
    RAISE NOTICE 'CREATE TABLE public.app_user (';
    RAISE NOTICE '  id SERIAL PRIMARY KEY,';
    RAISE NOTICE '  email VARCHAR(255) UNIQUE NOT NULL,';
    RAISE NOTICE '  password_hash VARCHAR(255) NOT NULL,';
    RAISE NOTICE '  role VARCHAR(50) NOT NULL DEFAULT ''client'',';
    RAISE NOTICE '  client_id INTEGER REFERENCES public.client(id),  -- ✅ INTEGER';
    RAISE NOTICE '  is_active BOOLEAN DEFAULT true,';
    RAISE NOTICE '  ...';
    RAISE NOTICE ');';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
