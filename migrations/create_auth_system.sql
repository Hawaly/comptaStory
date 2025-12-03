-- =========================================================
-- SYSTÈME D'AUTHENTIFICATION CLIENT
-- =========================================================
-- Date: 2024-12-03
-- Description: Tables et fonctions pour l'authentification des clients
-- =========================================================

-- 1. Table app_user (utilisateurs de l'application)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.app_user (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client', 'staff')),
  client_id BIGINT REFERENCES public.client(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_app_user_email ON public.app_user(email);
CREATE INDEX IF NOT EXISTS idx_app_user_client ON public.app_user(client_id);
CREATE INDEX IF NOT EXISTS idx_app_user_role ON public.app_user(role);

-- Commentaires
COMMENT ON TABLE public.app_user IS 'Utilisateurs de l''application avec authentification';
COMMENT ON COLUMN public.app_user.role IS 'Rôle: admin (agence), client (client final), staff (employé)';
COMMENT ON COLUMN public.app_user.client_id IS 'Lien vers la table client si rôle=client';
COMMENT ON COLUMN public.app_user.is_active IS 'Compte actif ou désactivé';

-- =========================================================
-- 2. Table session (sessions utilisateur)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.user_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_session_user ON public.user_session(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token ON public.user_session(token);
CREATE INDEX IF NOT EXISTS idx_session_expires ON public.user_session(expires_at);

-- Commentaires
COMMENT ON TABLE public.user_session IS 'Sessions actives des utilisateurs';
COMMENT ON COLUMN public.user_session.token IS 'Token JWT ou session token';
COMMENT ON COLUMN public.user_session.expires_at IS 'Date d''expiration de la session';

-- =========================================================
-- 3. Table activity_log (journal d'activité)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.app_user(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON public.activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_log(created_at);

-- Commentaires
COMMENT ON TABLE public.activity_log IS 'Journal de toutes les actions des utilisateurs';
COMMENT ON COLUMN public.activity_log.action IS 'Type d''action: login, logout, view, create, update, delete';
COMMENT ON COLUMN public.activity_log.entity_type IS 'Type d''entité: strategy, invoice, mandat, etc.';

-- =========================================================
-- 4. Trigger pour updated_at
-- =========================================================

CREATE OR REPLACE FUNCTION update_app_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_user_updated_at
BEFORE UPDATE ON public.app_user
FOR EACH ROW
EXECUTE FUNCTION update_app_user_updated_at();

-- =========================================================
-- 5. Fonction pour nettoyer les sessions expirées
-- =========================================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_session
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaire
COMMENT ON FUNCTION cleanup_expired_sessions IS 'Supprime les sessions expirées (à exécuter via cron)';

-- =========================================================
-- 6. Vue pour les utilisateurs clients avec infos client
-- =========================================================

CREATE OR REPLACE VIEW public.user_with_client AS
SELECT 
  u.id,
  u.email,
  u.role,
  u.client_id,
  u.is_active,
  u.last_login,
  u.created_at,
  c.name as client_name,
  c.company_name as client_company,
  c.email as client_email,
  c.phone as client_phone
FROM public.app_user u
LEFT JOIN public.client c ON u.client_id = c.id;

-- Commentaire
COMMENT ON VIEW public.user_with_client IS 'Vue enrichie des utilisateurs avec infos client';

-- =========================================================
-- 7. Fonction pour logger une activité
-- =========================================================

CREATE OR REPLACE FUNCTION log_activity(
  p_user_id INTEGER,
  p_action VARCHAR(100),
  p_entity_type VARCHAR(50) DEFAULT NULL,
  p_entity_id INTEGER DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address VARCHAR(45) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  new_id INTEGER;
BEGIN
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, details, ip_address)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details, p_ip_address)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Commentaire
COMMENT ON FUNCTION log_activity IS 'Enregistre une action utilisateur dans le journal';

-- =========================================================
-- 8. RLS (Row Level Security) pour les clients
-- =========================================================

-- Activer RLS sur les tables sensibles
ALTER TABLE public.social_media_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mandat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense ENABLE ROW LEVEL SECURITY;

-- Politique: Les clients ne voient que leurs propres données
CREATE POLICY client_view_own_strategies ON public.social_media_strategy
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM public.app_user WHERE id = current_setting('app.user_id')::INTEGER
    )
  );

CREATE POLICY client_view_own_mandats ON public.mandat
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM public.app_user WHERE id = current_setting('app.user_id')::INTEGER
    )
  );

CREATE POLICY client_view_own_invoices ON public.invoice
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM public.app_user WHERE id = current_setting('app.user_id')::INTEGER
    )
  );

-- Politique: Les admins voient tout
CREATE POLICY admin_view_all_strategies ON public.social_media_strategy
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user WHERE id = current_setting('app.user_id')::INTEGER AND role = 'admin'
    )
  );

CREATE POLICY admin_view_all_mandats ON public.mandat
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user WHERE id = current_setting('app.user_id')::INTEGER AND role = 'admin'
    )
  );

CREATE POLICY admin_view_all_invoices ON public.invoice
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user WHERE id = current_setting('app.user_id')::INTEGER AND role = 'admin'
    )
  );

-- =========================================================
-- 9. Données initiales (utilisateur admin)
-- =========================================================

-- Note: Le mot de passe doit être hashé côté application
-- Ceci est juste un exemple, à adapter selon votre système de hash

INSERT INTO public.app_user (email, password_hash, role, is_active)
VALUES ('admin@yourstory.ch', '$2a$10$placeholder', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Commentaire
COMMENT ON TABLE public.app_user IS 'Utilisateurs système - mot de passe hashé avec bcrypt';

-- =========================================================
-- 10. Fonction pour vérifier les permissions
-- =========================================================

CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id INTEGER,
  p_required_role VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role VARCHAR(50);
BEGIN
  SELECT role INTO user_role FROM public.app_user WHERE id = p_user_id AND is_active = true;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Admin a tous les droits
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Vérifier le rôle spécifique
  RETURN user_role = p_required_role;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 11. Statistiques d'utilisation
-- =========================================================

CREATE OR REPLACE VIEW public.user_statistics AS
SELECT 
  role,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_active = true) as active_users,
  COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '30 days') as active_last_month,
  COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '7 days') as active_last_week
FROM public.app_user
GROUP BY role;

-- Commentaire
COMMENT ON VIEW public.user_statistics IS 'Statistiques d''utilisation par rôle';

-- =========================================================
-- RÉSUMÉ
-- =========================================================

-- Tables créées:
-- 1. app_user          - Utilisateurs avec authentification
-- 2. user_session      - Sessions actives
-- 3. activity_log      - Journal d'activité

-- Vues créées:
-- 1. user_with_client  - Utilisateurs avec infos client
-- 2. user_statistics   - Stats d'utilisation

-- Fonctions créées:
-- 1. cleanup_expired_sessions()  - Nettoyage sessions
-- 2. log_activity()              - Logger une action
-- 3. check_user_permission()     - Vérifier permissions

-- RLS activé sur:
-- - social_media_strategy
-- - mandat
-- - invoice
-- - expense

-- =========================================================
-- VÉRIFICATION
-- =========================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration système d''authentification terminée avec succès!';
  RAISE NOTICE 'Tables créées: app_user, user_session, activity_log';
  RAISE NOTICE 'RLS activé sur les tables sensibles';
  RAISE NOTICE 'Utilisateur admin créé: admin@yourstory.ch';
END $$;
