-- =========================================================
-- AJOUT DES COLONNES MANQUANTES À LA TABLE CLIENT
-- =========================================================
-- Ce script ajoute les colonnes email, phone et company_name si elles n'existent pas
-- =========================================================

-- 1. Ajouter la colonne email si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'client' 
      AND column_name = 'email'
  ) THEN
    ALTER TABLE public.client ADD COLUMN email TEXT;
    RAISE NOTICE '✅ Colonne "email" ajoutée à la table client';
  ELSE
    RAISE NOTICE '⏭️  Colonne "email" existe déjà';
  END IF;
END $$;

-- 2. Ajouter la colonne phone si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'client' 
      AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.client ADD COLUMN phone TEXT;
    RAISE NOTICE '✅ Colonne "phone" ajoutée à la table client';
  ELSE
    RAISE NOTICE '⏭️  Colonne "phone" existe déjà';
  END IF;
END $$;

-- 3. Ajouter la colonne company_name si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'client' 
      AND column_name = 'company_name'
  ) THEN
    ALTER TABLE public.client ADD COLUMN company_name TEXT;
    RAISE NOTICE '✅ Colonne "company_name" ajoutée à la table client';
  ELSE
    RAISE NOTICE '⏭️  Colonne "company_name" existe déjà';
  END IF;
END $$;

-- =========================================================
-- VÉRIFICATION FINALE
-- =========================================================

DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
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
  
  -- Afficher le résultat
  IF array_length(missing_columns, 1) IS NULL THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SUCCÈS: Toutes les colonnes sont présentes!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Vous pouvez maintenant exécuter create_auth_system.sql';
  ELSE
    RAISE NOTICE '========================================';
    RAISE NOTICE '❌ ERREUR: Colonnes manquantes: %', array_to_string(missing_columns, ', ');
    RAISE NOTICE '========================================';
  END IF;
END $$;
