-- Migration: Ajout du calendrier éditorial à social_media_strategy
-- Date: 2024-12-03
-- Description: Ajoute une colonne JSON pour stocker le calendrier éditorial

-- Ajouter la colonne editorial_calendar
ALTER TABLE social_media_strategy 
ADD COLUMN IF NOT EXISTS editorial_calendar JSONB DEFAULT '[]'::jsonb;

-- Commentaire sur la colonne
COMMENT ON COLUMN social_media_strategy.editorial_calendar IS 
'Calendrier éditorial avec posts planifiés par date et plateforme (format: [{id, date, platform, contentType, title, description, status}])';

-- Créer un index GIN pour la recherche dans le JSON
CREATE INDEX IF NOT EXISTS idx_social_media_strategy_editorial_calendar 
ON social_media_strategy USING GIN (editorial_calendar);

-- Vérification
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'social_media_strategy' 
AND column_name = 'editorial_calendar';
