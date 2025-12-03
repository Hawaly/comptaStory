-- Migration: Restructuration complète de l'architecture Social Media Strategy
-- Date: 2024-12-03
-- Description: Architecture relationnelle propre avec entités séparées

-- =========================================================
-- 1. MODIFICATION SOCIAL_MEDIA_STRATEGY
-- =========================================================

-- Étape 1: Ajouter client_id comme NULLABLE d'abord
ALTER TABLE social_media_strategy 
ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES client(id) ON DELETE CASCADE;

-- Étape 2: Migrer les données existantes (mandat_id → client_id)
-- Si la table mandat existe et a une colonne client_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'mandat'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_strategy' 
    AND column_name = 'mandat_id'
  ) THEN
    -- Remplir client_id depuis mandat
    UPDATE social_media_strategy sms
    SET client_id = m.client_id
    FROM mandat m
    WHERE sms.mandat_id = m.id AND sms.client_id IS NULL;
  END IF;
END $$;

-- Étape 3: Rendre client_id NOT NULL (maintenant que les données sont migrées)
ALTER TABLE social_media_strategy 
ALTER COLUMN client_id SET NOT NULL;

-- Étape 4: Supprimer mandat_id (maintenant que client_id est rempli)
ALTER TABLE social_media_strategy 
DROP COLUMN IF EXISTS mandat_id CASCADE;

-- Étape 5: Supprimer la colonne editorial_calendar (sera une table séparée)
ALTER TABLE social_media_strategy 
DROP COLUMN IF EXISTS editorial_calendar;

-- Index sur client_id
CREATE INDEX IF NOT EXISTS idx_social_media_strategy_client_id 
ON social_media_strategy(client_id);

-- Commentaire
COMMENT ON COLUMN social_media_strategy.client_id IS 
'ID du client auquel appartient cette stratégie';

-- =========================================================
-- 2. TABLE EDITORIAL_CALENDAR (un par stratégie)
-- =========================================================

CREATE TABLE IF NOT EXISTS editorial_calendar (
  id SERIAL PRIMARY KEY,
  strategy_id INTEGER NOT NULL UNIQUE REFERENCES social_media_strategy(id) ON DELETE CASCADE,
  name VARCHAR(255),
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT editorial_calendar_strategy_unique UNIQUE(strategy_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_editorial_calendar_strategy_id 
ON editorial_calendar(strategy_id);

-- Commentaires
COMMENT ON TABLE editorial_calendar IS 
'Calendrier éditorial associé à une stratégie social media';

COMMENT ON COLUMN editorial_calendar.strategy_id IS 
'ID de la stratégie à laquelle appartient ce calendrier (relation 1-to-1)';

-- =========================================================
-- 3. TABLE EDITORIAL_POST (entité post)
-- =========================================================

CREATE TABLE IF NOT EXISTS editorial_post (
  id SERIAL PRIMARY KEY,
  calendar_id INTEGER NOT NULL REFERENCES editorial_calendar(id) ON DELETE CASCADE,
  
  -- Informations du post
  publication_date DATE NOT NULL,
  platform VARCHAR(50) NOT NULL,
  content_type VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Contenu
  caption TEXT,
  hashtags TEXT[],
  mentions TEXT[],
  media_urls TEXT[],
  
  -- Statut et suivi
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'cancelled')),
  scheduled_time TIME,
  published_at TIMESTAMP,
  
  -- Métriques (optionnel, pour suivi après publication)
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  
  -- Métadonnées
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_editorial_post_calendar_id 
ON editorial_post(calendar_id);

CREATE INDEX IF NOT EXISTS idx_editorial_post_publication_date 
ON editorial_post(publication_date);

CREATE INDEX IF NOT EXISTS idx_editorial_post_platform 
ON editorial_post(platform);

CREATE INDEX IF NOT EXISTS idx_editorial_post_status 
ON editorial_post(status);

-- Index composé pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_editorial_post_calendar_date 
ON editorial_post(calendar_id, publication_date);

-- Commentaires
COMMENT ON TABLE editorial_post IS 
'Posts planifiés dans le calendrier éditorial';

COMMENT ON COLUMN editorial_post.calendar_id IS 
'ID du calendrier éditorial auquel appartient ce post';

COMMENT ON COLUMN editorial_post.platform IS 
'Plateforme de publication (Instagram, Facebook, LinkedIn, TikTok, Twitter, YouTube)';

COMMENT ON COLUMN editorial_post.content_type IS 
'Type de contenu (Reel, Carrousel, Story, Post, Article, Video, etc.)';

COMMENT ON COLUMN editorial_post.status IS 
'Statut du post: draft (brouillon), scheduled (programmé), published (publié), cancelled (annulé)';

-- =========================================================
-- 4. TRIGGERS POUR UPDATED_AT
-- =========================================================

-- Trigger pour editorial_calendar
CREATE OR REPLACE FUNCTION update_editorial_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS editorial_calendar_updated_at ON editorial_calendar;
CREATE TRIGGER editorial_calendar_updated_at
  BEFORE UPDATE ON editorial_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_editorial_calendar_updated_at();

-- Trigger pour editorial_post
CREATE OR REPLACE FUNCTION update_editorial_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS editorial_post_updated_at ON editorial_post;
CREATE TRIGGER editorial_post_updated_at
  BEFORE UPDATE ON editorial_post
  FOR EACH ROW
  EXECUTE FUNCTION update_editorial_post_updated_at();

-- =========================================================
-- 5. FONCTION HELPER: Créer calendrier automatiquement
-- =========================================================

-- Fonction pour créer automatiquement un calendrier lors de la création d'une stratégie
CREATE OR REPLACE FUNCTION create_editorial_calendar_for_strategy()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO editorial_calendar (strategy_id, name)
  VALUES (NEW.id, 'Calendrier ' || NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_create_editorial_calendar ON social_media_strategy;
CREATE TRIGGER auto_create_editorial_calendar
  AFTER INSERT ON social_media_strategy
  FOR EACH ROW
  EXECUTE FUNCTION create_editorial_calendar_for_strategy();

-- =========================================================
-- 6. VUES UTILES
-- =========================================================

-- Vue: Posts avec informations du calendrier et stratégie
CREATE OR REPLACE VIEW v_editorial_posts_full AS
SELECT 
  ep.*,
  ec.strategy_id,
  ec.name AS calendar_name,
  sms.client_id,
  c.name AS client_name,
  c.company_name AS client_company
FROM editorial_post ep
JOIN editorial_calendar ec ON ep.calendar_id = ec.id
JOIN social_media_strategy sms ON ec.strategy_id = sms.id
JOIN client c ON sms.client_id = c.id;

COMMENT ON VIEW v_editorial_posts_full IS 
'Vue complète des posts avec toutes les informations liées (calendrier, stratégie, client)';

-- Vue: Statistiques par calendrier
CREATE OR REPLACE VIEW v_calendar_statistics AS
SELECT 
  ec.id AS calendar_id,
  ec.strategy_id,
  sms.client_id,
  COUNT(ep.id) AS total_posts,
  COUNT(CASE WHEN ep.status = 'draft' THEN 1 END) AS draft_posts,
  COUNT(CASE WHEN ep.status = 'scheduled' THEN 1 END) AS scheduled_posts,
  COUNT(CASE WHEN ep.status = 'published' THEN 1 END) AS published_posts,
  COUNT(CASE WHEN ep.status = 'cancelled' THEN 1 END) AS cancelled_posts,
  SUM(ep.likes) AS total_likes,
  SUM(ep.comments) AS total_comments,
  SUM(ep.shares) AS total_shares,
  SUM(ep.views) AS total_views,
  AVG(ep.engagement_rate) AS avg_engagement_rate
FROM editorial_calendar ec
LEFT JOIN editorial_post ep ON ec.id = ep.calendar_id
JOIN social_media_strategy sms ON ec.strategy_id = sms.id
GROUP BY ec.id, ec.strategy_id, sms.client_id;

COMMENT ON VIEW v_calendar_statistics IS 
'Statistiques agrégées par calendrier éditorial';

-- =========================================================
-- 7. POLICIES RLS (Row Level Security) - Optionnel
-- =========================================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE editorial_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_post ENABLE ROW LEVEL SECURITY;

-- Policy: Utilisateurs authentifiés peuvent tout voir/modifier
CREATE POLICY "Users can view all calendars" 
ON editorial_calendar FOR SELECT 
USING (true);

CREATE POLICY "Users can insert calendars" 
ON editorial_calendar FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update calendars" 
ON editorial_calendar FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete calendars" 
ON editorial_calendar FOR DELETE 
USING (true);

CREATE POLICY "Users can view all posts" 
ON editorial_post FOR SELECT 
USING (true);

CREATE POLICY "Users can insert posts" 
ON editorial_post FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update posts" 
ON editorial_post FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete posts" 
ON editorial_post FOR DELETE 
USING (true);

-- =========================================================
-- 8. DONNÉES DE TEST (optionnel, à commenter si non souhaité)
-- =========================================================

-- Exemple: Si vous avez déjà des stratégies, créer leurs calendriers
-- INSERT INTO editorial_calendar (strategy_id, name)
-- SELECT id, 'Calendrier éditorial ' || id 
-- FROM social_media_strategy 
-- WHERE NOT EXISTS (
--   SELECT 1 FROM editorial_calendar WHERE strategy_id = social_media_strategy.id
-- );

-- =========================================================
-- 9. VÉRIFICATIONS
-- =========================================================

-- Vérifier la structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('social_media_strategy', 'editorial_calendar', 'editorial_post')
ORDER BY table_name, ordinal_position;

-- Vérifier les contraintes
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('social_media_strategy', 'editorial_calendar', 'editorial_post');

-- =========================================================
-- FIN DE LA MIGRATION
-- =========================================================

-- NOTES:
-- 1. Cette migration supprime mandat_id et utilise client_id
-- 2. Les calendriers sont créés automatiquement lors de la création d'une stratégie
-- 3. Les posts sont des entités à part entière avec métriques
-- 4. Architecture scalable et propre
