-- =========================================================
-- CRÉATION RAPIDE D'UN UTILISATEUR ADMIN
-- =========================================================
-- Email: admin@yourstory.ch
-- Mot de passe: admin123
-- =========================================================

-- Supprimer l'ancien admin si existant
DELETE FROM public.app_user WHERE email = 'admin@yourstory.ch';

-- Créer l'admin avec mot de passe hashé
-- Hash pour "admin123" avec bcrypt (10 rounds)
INSERT INTO public.app_user (
  email,
  password_hash,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'admin@yourstory.ch',
  '$2a$10$5vJqMhmYLZCxJzPe5wDmzOjKwDVoGUaXMsJXtmLbJqGqPckZ3Y3Aq', -- Hash de "admin123"
  'admin',
  true,
  NOW(),
  NOW()
);

-- Vérification
SELECT id, email, role, is_active 
FROM public.app_user 
WHERE email = 'admin@yourstory.ch';

-- =========================================================
-- RÉSULTAT
-- =========================================================
-- ✅ Admin créé avec:
--    Email: admin@yourstory.ch
--    Mot de passe: admin123
-- =========================================================
