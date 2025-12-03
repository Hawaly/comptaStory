-- =========================================================
-- SYSTÈME D'AUTHENTIFICATION AVEC TABLE ROLE
-- =========================================================
-- Architecture propre avec table role séparée
-- =========================================================

-- 1. NETTOYER
DROP TABLE IF EXISTS public.app_user CASCADE;
DROP TABLE IF EXISTS public.role CASCADE;
DROP VIEW IF EXISTS public.user_with_client CASCADE;
DROP FUNCTION IF EXISTS update_app_user_updated_at() CASCADE;

-- 2. CRÉER TABLE ROLE
CREATE TABLE public.role (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  redirect_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Commentaire
COMMENT ON TABLE public.role IS 'Rôles utilisateurs avec redirections personnalisées';
COMMENT ON COLUMN public.role.code IS 'Code unique du rôle (admin, client, staff)';
COMMENT ON COLUMN public.role.redirect_path IS 'Chemin de redirection après login';

-- 3. INSÉRER LES RÔLES
INSERT INTO public.role (code, name, description, redirect_path) VALUES
  ('admin', 'Administrateur', 'Accès complet à l''application', '/dashboard'),
  ('client', 'Client', 'Accès limité aux données client', '/client-portal'),
  ('staff', 'Employé', 'Accès intermédiaire', '/dashboard');

-- Vérification
SELECT * FROM public.role ORDER BY id;

-- 4. CRÉER TABLE APP_USER
CREATE TABLE public.app_user (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES public.role(id) ON DELETE RESTRICT,
  client_id BIGINT REFERENCES public.client(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_app_user_email ON public.app_user(email);
CREATE INDEX idx_app_user_role ON public.app_user(role_id);
CREATE INDEX idx_app_user_client ON public.app_user(client_id);

-- Commentaires
COMMENT ON TABLE public.app_user IS 'Utilisateurs de l''application';
COMMENT ON COLUMN public.app_user.role_id IS 'Référence vers la table role';
COMMENT ON COLUMN public.app_user.client_id IS 'Référence vers client (NULL pour admin/staff)';

-- 5. CRÉER VUE ENRICHIE
CREATE OR REPLACE VIEW public.user_with_details AS
SELECT 
  u.id as user_id,
  u.email,
  u.is_active,
  u.last_login,
  u.created_at,
  r.id as role_id,
  r.code as role_code,
  r.name as role_name,
  r.redirect_path,
  u.client_id,
  c.name as client_name,
  c.company_name,
  c.email as client_email
FROM public.app_user u
INNER JOIN public.role r ON u.role_id = r.id
LEFT JOIN public.client c ON u.client_id = c.id;

-- Commentaire
COMMENT ON VIEW public.user_with_details IS 'Vue complète utilisateur avec rôle et client';

-- 6. CRÉER ADMIN (mot de passe: admin123)
INSERT INTO public.app_user (email, password_hash, role_id, client_id, is_active)
VALUES (
  'admin@yourstory.ch',
  '$2a$10$5vJqMhmYLZCxJzPe5wDmzOjKwDVoGUaXMsJXtmLbJqGqPckZ3Y3Aq',
  (SELECT id FROM public.role WHERE code = 'admin'),
  NULL,
  true
);

-- 7. VÉRIFICATIONS
-- Voir tous les rôles
SELECT 
  '=== RÔLES CRÉÉS ===' as info,
  id, code, name, redirect_path 
FROM public.role 
ORDER BY id;

-- Voir l'admin créé
SELECT 
  '=== ADMIN CRÉÉ ===' as info,
  u.id,
  u.email,
  r.code as role_code,
  r.name as role_name,
  r.redirect_path,
  u.is_active
FROM public.app_user u
INNER JOIN public.role r ON u.role_id = r.id
WHERE u.email = 'admin@yourstory.ch';

-- Tester la vue
SELECT 
  '=== VUE USER_WITH_DETAILS ===' as info,
  user_id,
  email,
  role_code,
  role_name,
  redirect_path,
  client_id,
  client_name
FROM public.user_with_details;

-- 8. TEST REQUÊTE LOGIN
-- C'est la requête que l'API va exécuter
SELECT 
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
WHERE u.email = 'admin@yourstory.ch'
  AND u.is_active = true
LIMIT 1;

-- =========================================================
-- RÉSULTAT
-- =========================================================
-- ✅ Table role créée avec 3 rôles (admin, client, staff)
-- ✅ Table app_user créée avec FK vers role
-- ✅ Admin créé: admin@yourstory.ch / admin123
-- ✅ Redirection: admin → /dashboard
-- =========================================================
