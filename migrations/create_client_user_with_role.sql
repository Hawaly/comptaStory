-- =========================================================
-- CRÉATION UTILISATEUR CLIENT (AVEC TABLE ROLE)
-- =========================================================
-- Utilisateur client lié au client ID 1
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
  '=== CLIENT ID 1 ===' as info,
  id,
  name,
  email,
  company_name
FROM public.client 
WHERE id = 1;

-- 3. Supprimer l'utilisateur s'il existe déjà
DELETE FROM public.app_user WHERE email = 'client1@example.com';

-- 4. Créer l'utilisateur client
-- Email: client1@example.com
-- Mot de passe: client123
-- Rôle: client
-- Lié au client ID 1
INSERT INTO public.app_user (email, password_hash, role_id, client_id, is_active)
VALUES (
  'client1@example.com',
  '$2a$10$5vJqMhmYLZCxJzPe5wDmzOjKwDVoGUaXMsJXtmLbJqGqPckZ3Y3Aq', -- Hash de "client123"
  (SELECT id FROM public.role WHERE code = 'client'),
  1,
  true
);

-- 5. VÉRIFICATIONS

-- Voir l'utilisateur créé avec tous les détails
SELECT 
  '=== CLIENT USER CRÉÉ ===' as info,
  u.id as user_id,
  u.email,
  r.code as role_code,
  r.name as role_name,
  r.redirect_path,
  u.client_id,
  c.name as client_name,
  c.company_name,
  u.is_active
FROM public.app_user u
INNER JOIN public.role r ON u.role_id = r.id
LEFT JOIN public.client c ON u.client_id = c.id
WHERE u.email = 'client1@example.com';

-- Utiliser la vue
SELECT 
  '=== VIA VUE user_with_details ===' as info,
  user_id,
  email,
  role_code,
  role_name,
  redirect_path,
  client_id,
  client_name,
  company_name
FROM public.user_with_details
WHERE email = 'client1@example.com';

-- Voir tous les utilisateurs
SELECT 
  '=== TOUS LES UTILISATEURS ===' as info,
  u.id,
  u.email,
  r.code as role,
  u.client_id,
  c.name as client_name,
  r.redirect_path
FROM public.app_user u
INNER JOIN public.role r ON u.role_id = r.id
LEFT JOIN public.client c ON u.client_id = c.id
ORDER BY r.code, u.id;

-- Test de la requête login pour ce client
SELECT 
  '=== TEST LOGIN CLIENT ===' as info,
  u.id,
  u.email,
  u.password_hash,
  u.is_active,
  u.client_id,
  r.id as role_id,
  r.code as role_code,
  r.name as role_name,
  r.redirect_path
FROM public.app_user u
INNER JOIN public.role r ON u.role_id = r.id
WHERE u.email = 'client1@example.com'
  AND u.is_active = true
LIMIT 1;

-- =========================================================
-- RÉSULTAT
-- =========================================================
-- ✅ Utilisateur client créé:
--    Email: client1@example.com
--    Mot de passe: client123
--    Rôle: client
--    Client ID: 1
--    Redirection: /client-portal
-- =========================================================
