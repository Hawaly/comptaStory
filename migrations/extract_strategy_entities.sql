-- Migration: Extraction des entités JSONB en tables séparées
-- Date: 2024-12-03
-- Description: Transformer personas, piliers_contenu et kpis en tables relationnelles

-- =========================================================
-- 1. TABLE PERSONA
-- =========================================================

CREATE TABLE IF NOT EXISTS persona (
  id SERIAL PRIMARY KEY,
  strategy_id INTEGER NOT NULL REFERENCES social_media_strategy(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  age_range VARCHAR(50),
  profession VARCHAR(255),
  besoins TEXT,
  problemes TEXT,
  attentes TEXT,
  comportements TEXT,
  canaux_preferes TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_persona_strategy_id ON persona(strategy_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_persona_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS persona_updated_at ON persona;
CREATE TRIGGER persona_updated_at
  BEFORE UPDATE ON persona
  FOR EACH ROW
  EXECUTE FUNCTION update_persona_updated_at();

-- Commentaires
COMMENT ON TABLE persona IS 'Personas cibles pour les stratégies social media';
COMMENT ON COLUMN persona.strategy_id IS 'ID de la stratégie à laquelle appartient ce persona';
COMMENT ON COLUMN persona.nom IS 'Nom ou titre du persona';
COMMENT ON COLUMN persona.age_range IS 'Tranche d''âge du persona (ex: 25-35 ans)';
COMMENT ON COLUMN persona.canaux_preferes IS 'Canaux de communication préférés du persona';

-- =========================================================
-- 2. TABLE PILIER_CONTENU
-- =========================================================

CREATE TABLE IF NOT EXISTS pilier_contenu (
  id SERIAL PRIMARY KEY,
  strategy_id INTEGER NOT NULL REFERENCES social_media_strategy(id) ON DELETE CASCADE,
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  exemples TEXT,
  pourcentage_cible INTEGER CHECK (pourcentage_cible >= 0 AND pourcentage_cible <= 100),
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_pilier_contenu_strategy_id ON pilier_contenu(strategy_id);
CREATE INDEX IF NOT EXISTS idx_pilier_contenu_ordre ON pilier_contenu(strategy_id, ordre);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_pilier_contenu_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pilier_contenu_updated_at ON pilier_contenu;
CREATE TRIGGER pilier_contenu_updated_at
  BEFORE UPDATE ON pilier_contenu
  FOR EACH ROW
  EXECUTE FUNCTION update_pilier_contenu_updated_at();

-- Commentaires
COMMENT ON TABLE pilier_contenu IS 'Piliers de contenu des stratégies social media';
COMMENT ON COLUMN pilier_contenu.titre IS 'Titre du pilier de contenu';
COMMENT ON COLUMN pilier_contenu.pourcentage_cible IS 'Pourcentage cible du contenu pour ce pilier (0-100)';
COMMENT ON COLUMN pilier_contenu.ordre IS 'Ordre d''affichage du pilier';

-- =========================================================
-- 3. TABLE KPI
-- =========================================================

CREATE TABLE IF NOT EXISTS kpi (
  id SERIAL PRIMARY KEY,
  strategy_id INTEGER NOT NULL REFERENCES social_media_strategy(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  objectif TEXT,
  valeur_cible DECIMAL(10,2),
  unite VARCHAR(50),
  periodicite VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_kpi_strategy_id ON kpi(strategy_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_kpi_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kpi_updated_at ON kpi;
CREATE TRIGGER kpi_updated_at
  BEFORE UPDATE ON kpi
  FOR EACH ROW
  EXECUTE FUNCTION update_kpi_updated_at();

-- Commentaires
COMMENT ON TABLE kpi IS 'KPIs (Indicateurs de Performance) des stratégies social media';
COMMENT ON COLUMN kpi.nom IS 'Nom du KPI (ex: Followers Instagram, Taux d''engagement)';
COMMENT ON COLUMN kpi.valeur_cible IS 'Valeur cible à atteindre';
COMMENT ON COLUMN kpi.unite IS 'Unité de mesure (followers, %, CHF, etc.)';
COMMENT ON COLUMN kpi.periodicite IS 'Périodicité de mesure (mensuel, hebdomadaire, annuel)';

-- =========================================================
-- 4. TABLE KPI_MESURE (BONUS - Tracking dans le temps)
-- =========================================================

CREATE TABLE IF NOT EXISTS kpi_mesure (
  id SERIAL PRIMARY KEY,
  kpi_id INTEGER NOT NULL REFERENCES kpi(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  valeur_mesuree DECIMAL(10,2) NOT NULL,
  commentaire TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_kpi_mesure_kpi_id ON kpi_mesure(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_mesure_date ON kpi_mesure(kpi_id, date DESC);

-- Commentaires
COMMENT ON TABLE kpi_mesure IS 'Mesures historiques des KPIs';
COMMENT ON COLUMN kpi_mesure.valeur_mesuree IS 'Valeur mesurée à cette date';
COMMENT ON COLUMN kpi_mesure.commentaire IS 'Commentaire ou note sur cette mesure';

-- =========================================================
-- 5. LIEN OPTIONNEL: Post → Pilier de Contenu
-- =========================================================

-- Ajouter une FK optionnelle dans editorial_post pour lier au pilier
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'editorial_post' AND column_name = 'pilier_id'
  ) THEN
    ALTER TABLE editorial_post 
    ADD COLUMN pilier_id INTEGER REFERENCES pilier_contenu(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_editorial_post_pilier_id ON editorial_post(pilier_id);
    
    COMMENT ON COLUMN editorial_post.pilier_id IS 'Pilier de contenu associé à ce post';
  END IF;
END $$;

-- =========================================================
-- 6. MIGRATION DES DONNÉES EXISTANTES (optionnel)
-- =========================================================

-- Migrer les personas depuis JSONB vers la table
DO $$
DECLARE
  strategy_record RECORD;
  persona_item JSONB;
BEGIN
  FOR strategy_record IN 
    SELECT id, personas FROM social_media_strategy WHERE personas IS NOT NULL
  LOOP
    FOR persona_item IN SELECT * FROM jsonb_array_elements(strategy_record.personas)
    LOOP
      INSERT INTO persona (
        strategy_id,
        nom,
        besoins,
        problemes,
        attentes
      ) VALUES (
        strategy_record.id,
        persona_item->>'nom',
        persona_item->>'besoins',
        persona_item->>'problemes',
        persona_item->>'attentes'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Personas migrés avec succès';
END $$;

-- Migrer les piliers de contenu depuis JSONB vers la table
DO $$
DECLARE
  strategy_record RECORD;
  pilier_item JSONB;
  pilier_ordre INTEGER;
BEGIN
  FOR strategy_record IN 
    SELECT id, piliers_contenu FROM social_media_strategy WHERE piliers_contenu IS NOT NULL
  LOOP
    pilier_ordre := 0;
    FOR pilier_item IN SELECT * FROM jsonb_array_elements(strategy_record.piliers_contenu)
    LOOP
      INSERT INTO pilier_contenu (
        strategy_id,
        titre,
        description,
        exemples,
        ordre
      ) VALUES (
        strategy_record.id,
        pilier_item->>'titre',
        pilier_item->>'description',
        pilier_item->>'exemples',
        pilier_ordre
      )
      ON CONFLICT DO NOTHING;
      
      pilier_ordre := pilier_ordre + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Piliers de contenu migrés avec succès';
END $$;

-- Migrer les KPIs depuis JSONB vers la table
DO $$
DECLARE
  strategy_record RECORD;
  kpi_item JSONB;
BEGIN
  FOR strategy_record IN 
    SELECT id, kpis FROM social_media_strategy WHERE kpis IS NOT NULL
  LOOP
    FOR kpi_item IN SELECT * FROM jsonb_array_elements(strategy_record.kpis)
    LOOP
      INSERT INTO kpi (
        strategy_id,
        nom,
        objectif,
        periodicite
      ) VALUES (
        strategy_record.id,
        kpi_item->>'nom',
        kpi_item->>'objectif',
        kpi_item->>'periodicite'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'KPIs migrés avec succès';
END $$;

-- =========================================================
-- 7. SUPPRIMER LES COLONNES JSONB (optionnel - à décommenter si souhaité)
-- =========================================================

-- ATTENTION: Ne pas exécuter avant d'avoir vérifié que la migration fonctionne !
-- ALTER TABLE social_media_strategy DROP COLUMN IF EXISTS personas;
-- ALTER TABLE social_media_strategy DROP COLUMN IF EXISTS piliers_contenu;
-- ALTER TABLE social_media_strategy DROP COLUMN IF EXISTS kpis;

-- =========================================================
-- 8. VUES UTILES
-- =========================================================

-- Vue: Stratégie avec le nombre d'entités liées
CREATE OR REPLACE VIEW v_strategy_summary AS
SELECT 
  sms.id,
  sms.client_id,
  sms.status,
  sms.created_at,
  COUNT(DISTINCT p.id) AS nombre_personas,
  COUNT(DISTINCT pc.id) AS nombre_piliers,
  COUNT(DISTINCT k.id) AS nombre_kpis,
  COUNT(DISTINCT ec.id) AS has_calendar
FROM social_media_strategy sms
LEFT JOIN persona p ON sms.id = p.strategy_id
LEFT JOIN pilier_contenu pc ON sms.id = pc.strategy_id
LEFT JOIN kpi k ON sms.id = k.strategy_id
LEFT JOIN editorial_calendar ec ON sms.id = ec.strategy_id
GROUP BY sms.id, sms.client_id, sms.status, sms.created_at;

-- Vue: Posts par pilier de contenu
CREATE OR REPLACE VIEW v_posts_by_pilier AS
SELECT 
  pc.id AS pilier_id,
  pc.strategy_id,
  pc.titre AS pilier_titre,
  COUNT(ep.id) AS nombre_posts,
  COUNT(CASE WHEN ep.status = 'published' THEN 1 END) AS posts_publies,
  COUNT(CASE WHEN ep.status = 'scheduled' THEN 1 END) AS posts_programmes
FROM pilier_contenu pc
LEFT JOIN editorial_post ep ON pc.id = ep.pilier_id
GROUP BY pc.id, pc.strategy_id, pc.titre;

-- =========================================================
-- 9. RLS (Row Level Security)
-- =========================================================

ALTER TABLE persona ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilier_contenu ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_mesure ENABLE ROW LEVEL SECURITY;

-- Policies pour persona
CREATE POLICY "Users can view all personas" 
ON persona FOR SELECT USING (true);

CREATE POLICY "Users can insert personas" 
ON persona FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update personas" 
ON persona FOR UPDATE USING (true);

CREATE POLICY "Users can delete personas" 
ON persona FOR DELETE USING (true);

-- Policies pour pilier_contenu
CREATE POLICY "Users can view all piliers" 
ON pilier_contenu FOR SELECT USING (true);

CREATE POLICY "Users can insert piliers" 
ON pilier_contenu FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update piliers" 
ON pilier_contenu FOR UPDATE USING (true);

CREATE POLICY "Users can delete piliers" 
ON pilier_contenu FOR DELETE USING (true);

-- Policies pour kpi
CREATE POLICY "Users can view all kpis" 
ON kpi FOR SELECT USING (true);

CREATE POLICY "Users can insert kpis" 
ON kpi FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update kpis" 
ON kpi FOR UPDATE USING (true);

CREATE POLICY "Users can delete kpis" 
ON kpi FOR DELETE USING (true);

-- Policies pour kpi_mesure
CREATE POLICY "Users can view all kpi measures" 
ON kpi_mesure FOR SELECT USING (true);

CREATE POLICY "Users can insert kpi measures" 
ON kpi_mesure FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update kpi measures" 
ON kpi_mesure FOR UPDATE USING (true);

CREATE POLICY "Users can delete kpi measures" 
ON kpi_mesure FOR DELETE USING (true);

-- =========================================================
-- ✅ TERMINÉ
-- =========================================================

-- Vérifier les résultats
SELECT 
  'Personas' AS table_name,
  COUNT(*) AS total_records
FROM persona
UNION ALL
SELECT 
  'Piliers de contenu' AS table_name,
  COUNT(*) AS total_records
FROM pilier_contenu
UNION ALL
SELECT 
  'KPIs' AS table_name,
  COUNT(*) AS total_records
FROM kpi;
