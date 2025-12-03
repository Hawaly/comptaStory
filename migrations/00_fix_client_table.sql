-- =========================================================
-- ÉTAPE 0: CORRECTION TABLE CLIENT
-- =========================================================
-- À EXÉCUTER EN PREMIER avant create_auth_system_safe.sql
-- Ce script ajoute les colonnes manquantes à la table client
-- =========================================================

-- Vérifier que la table client existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client') THEN
    RAISE EXCEPTION 'ERREUR: La table public.client n''existe pas! Créez-la d''abord.';
  END IF;
  
  RAISE NOTICE '✅ Table public.client trouvée';
END $$;

-- Ajouter colonne email si manquante
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'client' AND column_name = 'email'
  ) THEN
    EXECUTE 'ALTER TABLE public.client ADD COLUMN email TEXT';
    RAISE NOTICE '✅ Colonne email ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne email existe déjà';
  END IF;
END $$;

-- Ajouter colonne phone si manquante
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'client' AND column_name = 'phone'
  ) THEN
    EXECUTE 'ALTER TABLE public.client ADD COLUMN phone TEXT';
    RAISE NOTICE '✅ Colonne phone ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne phone existe déjà';
  END IF;
END $$;

-- Ajouter colonne company_name si manquante
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'client' AND column_name = 'company_name'
  ) THEN
    EXECUTE 'ALTER TABLE public.client ADD COLUMN company_name TEXT';
    RAISE NOTICE '✅ Colonne company_name ajoutée';
  ELSE
    RAISE NOTICE '⏭️  Colonne company_name existe déjà';
  END IF;
END $$;

-- Vérification finale
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VÉRIFICATION FINALE';
  RAISE NOTICE '========================================';
  
  -- Vérifier email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'client' AND column_name = 'email'
  ) THEN
    missing_columns := array_append(missing_columns, 'email');
  END IF;
  
  -- Vérifier phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'client' AND column_name = 'phone'
  ) THEN
    missing_columns := array_append(missing_columns, 'phone');
  END IF;
  
  -- Vérifier company_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'client' AND column_name = 'company_name'
  ) THEN
    missing_columns := array_append(missing_columns, 'company_name');
  END IF;
  
  -- Afficher résultat
  IF array_length(missing_columns, 1) IS NULL THEN
    RAISE NOTICE '✅ SUCCÈS: Toutes les colonnes requises sont présentes!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '➡️  Vous pouvez maintenant exécuter:';
    RAISE NOTICE '   migrations/01_create_auth_system.sql';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION 'ERREUR: Colonnes toujours manquantes: %', array_to_string(missing_columns, ', ');
  END IF;
END $$;
