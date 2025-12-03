-- =========================================================
-- CRÉATION D'UN UTILISATEUR CLIENT
-- =========================================================
-- Cet utilisateur sera lié au client avec ID = 1
-- =========================================================

-- 1. Vérifier que le client ID 1 existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.client WHERE id = 1) THEN
    RAISE EXCEPTION 'Le client avec ID 1 n''existe pas! Créez-le d''abord.';
  END IF;
  RAISE NOTICE '✅ Client ID 1 trouvé';
END $$;

-- 2. Afficher les infos du client
SELECT 
  id,
  name,
  email,
  company_name
FROM public.client 
WHERE id = 1;

-- 3. Supprimer l'utilisateur client s'il existe déjà
DELETE FROM public.app_user 
WHERE email = 'client1@example.com';

-- 4. Créer l'utilisateur client
-- Email: client1@example.com
-- Mot de passe: client123
-- Lié au client ID 1
INSERT INTO public.app_user (
  email,
  password_hash,
  role,
  client_id,
  is_active,
  created_at
) VALUES (
  'client1@example.com',
  '$2a$10$5vJqMhmYLZCxJzPe5wDmzOjKwDVoGUaXMsJXtmLbJqGqPckZ3Y3Aq', -- Hash de "client123"
  'client',
  1, -- Lié au client ID 1
  true,
  NOW()
);

-- 5. Vérification
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  u.client_id,
  u.is_active,
  c.name as client_name,
  c.company_name,
  LEFT(u.password_hash, 15) as hash_preview
FROM public.app_user u
LEFT JOIN public.client c ON u.client_id = c.id
WHERE u.email = 'client1@example.com';

-- 6. Afficher tous les utilisateurs
SELECT 
  u.id,
  u.email,
  u.role,
  u.client_id,
  c.name as client_name
FROM public.app_user u
LEFT JOIN public.client c ON u.client_id = c.id
ORDER BY u.role, u.id;

-- =========================================================
-- RÉSULTAT
-- =========================================================
-- ✅ Utilisateur client créé:
--    Email: client1@example.com
--    Mot de passe: client123
--    Lié au client ID: 1
-- =========================================================
-- 
-- Pour vous connecter en tant que ce client:
-- 1. Allez sur http://localhost:3000/login
-- 2. Email: client1@example.com
-- 3. Mot de passe: client123
-- =========================================================
