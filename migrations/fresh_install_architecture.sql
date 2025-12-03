-- Migration: Installation propre (NOUVELLE BASE, sans données existantes)
-- Date: 2024-12-03
-- Description: Architecture relationnelle propre avec entités séparées
-- À UTILISER UNIQUEMENT si vous n'avez PAS de données existantes

-- =========================================================
-- 1. TABLE SOCIAL_MEDIA_STRATEGY (version propre)
-- =========================================================

CREATE TABLE IF NOT EXISTS social_media_strategy (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'actif', 'archive')),
  
  -- 1. Contexte & objectifs business
  contexte_general TEXT,
  objectifs_business TEXT,
  objectifs_reseaux TEXT,
  
  -- 2. Audience & Personas
  cibles TEXT,
  personas JSONB,
  plateformes TEXT[],
  
  -- 3. Positionnement & identité
  ton_voix TEXT,
  guidelines_visuelles TEXT,
  valeurs_messages TEXT,
  
  -- 4. Piliers de contenu
  piliers_contenu JSONB,
  
  -- 5. Formats & rythme
  formats_envisages TEXT[],
  frequence_calendrier TEXT,
  workflow_roles TEXT,
  
  -- 6. Audit & concurrence
  audit_profils TEXT,
  benchmark_concurrents TEXT,
  
  -- 7. KPIs & suivi
  kpis JSONB,
  cadre_suivi TEXT,
  
  -- 8. Canaux & mix média (PESO)
  owned_media TEXT,
  shared_media TEXT,
  paid_media TEXT,
  earned_media TEXT,
  
  -- 9. Budget & ressources
  temps_humain TEXT,
  outils TEXT,
  budget_pub TEXT,
  
  -- 10. Planning & optimisation
  planning_global TEXT,
  processus_iteration TEXT,
  mise_a_jour TEXT,
  
  -- Métadonnées
  notes_internes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_social_media_strategy_client_id 
ON social_media_strategy(client_id);

CREATE INDEX IF NOT EXISTS idx_social_media_strategy_status 
ON social_media_strategy(status);

-- =========================================================
-- 2. TABLE EDITORIAL_CALENDAR
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

-- =========================================================
-- 3. TABLE EDITORIAL_POST
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
  
  -- Métriques
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

CREATE INDEX IF NOT EXISTS idx_editorial_post_calendar_date 
ON editorial_post(calendar_id, publication_date);

-- =========================================================
-- 4. TRIGGERS
-- =========================================================

-- Trigger pour updated_at sur social_media_strategy
CREATE OR REPLACE FUNCTION update_social_media_strategy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS social_media_strategy_updated_at ON social_media_strategy;
CREATE TRIGGER social_media_strategy_updated_at
  BEFORE UPDATE ON social_media_strategy
  FOR EACH ROW
  EXECUTE FUNCTION update_social_media_strategy_updated_at();

-- Trigger pour updated_at sur editorial_calendar
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

-- Trigger pour updated_at sur editorial_post
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

-- Trigger pour créer automatiquement un calendrier lors de la création d'une stratégie
CREATE OR REPLACE FUNCTION create_editorial_calendar_for_strategy()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO editorial_calendar (strategy_id, name)
  VALUES (NEW.id, 'Calendrier éditorial - Stratégie ' || NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_create_editorial_calendar ON social_media_strategy;
CREATE TRIGGER auto_create_editorial_calendar
  AFTER INSERT ON social_media_strategy
  FOR EACH ROW
  EXECUTE FUNCTION create_editorial_calendar_for_strategy();

-- =========================================================
-- 5. VUES
-- =========================================================

-- Vue: Posts avec informations complètes
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

-- =========================================================
-- 6. RLS (Row Level Security)
-- =========================================================

ALTER TABLE editorial_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_post ENABLE ROW LEVEL SECURITY;

-- Policies pour editorial_calendar
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

-- Policies pour editorial_post
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
-- ✅ TERMINÉ - Installation propre complète
-- =========================================================
