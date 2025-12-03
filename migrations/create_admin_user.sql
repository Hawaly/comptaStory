-- =========================================================
-- CRÉATION D'UN UTILISATEUR ADMIN DE TEST
-- =========================================================
-- Ce script crée un utilisateur admin avec un mot de passe simple pour tester
-- =========================================================

-- 1. Vérifier la structure de la table app_user
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_user' 
ORDER BY ordinal_position;

-- 2. Supprimer l'admin existant si présent
DELETE FROM public.app_user WHERE email = 'admin@yourstory.ch';

-- 3. Créer un utilisateur admin avec mot de passe simple
-- Mot de passe: admin123
-- Hash bcrypt généré avec: https://bcrypt-generator.com/ ou bcryptjs
-- Le hash ci-dessous correspond à "admin123" avec 10 rounds
INSERT INTO public.app_user (
  email,
  password_hash,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'admin@yourstory.ch',
  '$2a$10$YourHashHere', -- À remplacer avec le vrai hash
  'admin',
  true,
  NOW(),
  NOW()
);

-- 4. Vérifier que l'utilisateur a été créé
SELECT id, email, role, is_active 
FROM public.app_user 
WHERE email = 'admin@yourstory.ch';

-- =========================================================
-- RÉSULTAT ATTENDU
-- =========================================================
-- L'utilisateur admin@yourstory.ch devrait être créé avec:
-- - Email: admin@yourstory.ch
-- - Mot de passe: admin123 (hashé)
-- - Rôle: admin
-- - Actif: true
