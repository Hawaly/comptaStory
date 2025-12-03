-- =========================================================
-- FIX LOGIN IMMÉDIAT - VERSION ULTRA SIMPLE
-- =========================================================

-- 1. NETTOYER TOUT
DROP TABLE IF EXISTS public.app_user CASCADE;
DROP VIEW IF EXISTS public.user_with_client CASCADE;
DROP FUNCTION IF EXISTS update_app_user_updated_at() CASCADE;

-- 2. CRÉER TABLE SIMPLE
CREATE TABLE public.app_user (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'client',
  client_id BIGINT REFERENCES public.client(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. CRÉER INDEX
CREATE INDEX idx_app_user_email ON public.app_user(email);

-- 4. CRÉER ADMIN (mot de passe: admin123)
INSERT INTO public.app_user (email, password_hash, role, client_id, is_active)
VALUES (
  'admin@yourstory.ch',
  '$2a$10$5vJqMhmYLZCxJzPe5wDmzOjKwDVoGUaXMsJXtmLbJqGqPckZ3Y3Aq',
  'admin',
  NULL, -- Admin n'est pas lié à un client
  true
);

-- 5. VÉRIFICATION
SELECT 
  id, 
  email, 
  role,
  client_id,
  is_active,
  LEFT(password_hash, 15) as hash_preview
FROM public.app_user;

-- 6. TEST DE LA REQUÊTE QUE L'API VA FAIRE
SELECT id, email, password_hash, role, is_active
FROM public.app_user
WHERE email = 'admin@yourstory.ch'
  AND is_active = true
LIMIT 1;

-- =========================================================
-- RÉSULTAT ATTENDU
-- =========================================================
-- ✅ Deux SELECTs devraient retourner les données de l'admin
-- ✅ Email: admin@yourstory.ch
-- ✅ Role: admin
-- ✅ is_active: true
-- =========================================================
