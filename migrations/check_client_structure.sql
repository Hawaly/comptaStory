-- =========================================================
-- VÉRIFICATION STRUCTURE TABLE CLIENT
-- =========================================================
-- Script pour vérifier si la table client a toutes les colonnes nécessaires
-- =========================================================

-- 1. Vérifier si la table client existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client') THEN
    RAISE NOTICE '❌ ERREUR: La table public.client n''existe pas!';
  ELSE
    RAISE NOTICE '✅ La table public.client existe';
  END IF;
END $$;

-- 2. Lister toutes les colonnes de la table client
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'client'
ORDER BY ordinal_position;

-- 3. Vérifier spécifiquement la colonne email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'client' 
      AND column_name = 'email'
  ) THEN
    RAISE NOTICE '❌ ERREUR: La colonne "email" n''existe pas dans la table client!';
    RAISE NOTICE '➡️  Il faut ajouter la colonne email à la table client';
  ELSE
    RAISE NOTICE '✅ La colonne "email" existe dans la table client';
  END IF;
END $$;

-- 4. Vérifier la colonne phone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'client' 
      AND column_name = 'phone'
  ) THEN
    RAISE NOTICE '❌ ERREUR: La colonne "phone" n''existe pas dans la table client!';
  ELSE
    RAISE NOTICE '✅ La colonne "phone" existe dans la table client';
  END IF;
END $$;

-- 5. Vérifier la colonne company_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'client' 
      AND column_name = 'company_name'
  ) THEN
    RAISE NOTICE '❌ ERREUR: La colonne "company_name" n''existe pas dans la table client!';
  ELSE
    RAISE NOTICE '✅ La colonne "company_name" existe dans la table client';
  END IF;
END $$;

-- =========================================================
-- RÉSUMÉ
-- =========================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VÉRIFICATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Consultez les messages ci-dessus pour voir quelles colonnes manquent.';
END $$;
