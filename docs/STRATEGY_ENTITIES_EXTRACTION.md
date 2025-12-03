# 🎯 Extraction des Entités de Stratégie

## Vue d'ensemble

Transformation de la table `social_media_strategy` pour extraire les champs JSONB (`personas`, `piliers_contenu`, `kpis`) en **tables relationnelles séparées**.

---

## 🏗️ Nouvelle Architecture

### Avant (JSONB)
```
social_media_strategy
├── personas JSONB        ❌ Non queryable facilement
├── piliers_contenu JSONB ❌ Pas de relations
└── kpis JSONB            ❌ Pas de tracking
```

### Après (Tables Relationnelles)
```
social_media_strategy
  ↓
  ├── persona (1-to-many)           ✅ Table séparée
  ├── pilier_contenu (1-to-many)    ✅ Table séparée  
  └── kpi (1-to-many)                ✅ Table séparée
        ↓
        kpi_mesure (1-to-many)      ✅ Tracking dans le temps

editorial_post
  ↓
  pilier_contenu (FK optionnelle)   ✅ Lier posts aux piliers
```

---

## 📊 Tables Créées

### 1. **`persona`**
```sql
CREATE TABLE persona (
  id SERIAL PRIMARY KEY,
  strategy_id INTEGER NOT NULL,
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
```

**Exemple de données** :
```json
{
  "id": 1,
  "strategy_id": 1,
  "nom": "Marie, Responsable Marketing",
  "age_range": "30-40 ans",
  "profession": "Marketing Manager",
  "besoins": "Outils de gestion de contenu efficaces",
  "problemes": "Manque de temps, équipe réduite",
  "attentes": "Solution simple et rapide",
  "comportements": "Active sur LinkedIn, recherche de conseils",
  "canaux_preferes": ["LinkedIn", "Email", "Webinaires"]
}
```

---

### 2. **`pilier_contenu`**
```sql
CREATE TABLE pilier_contenu (
  id SERIAL PRIMARY KEY,
  strategy_id INTEGER NOT NULL,
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  exemples TEXT,
  pourcentage_cible INTEGER, -- 0-100
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Exemple de données** :
```json
{
  "id": 1,
  "strategy_id": 1,
  "titre": "Expertise & Conseil",
  "description": "Positionner la marque comme experte",
  "exemples": "Tips, tutoriels, études de cas",
  "pourcentage_cible": 40,
  "ordre": 0
}
```

**Bonus** : Les posts peuvent maintenant être liés à un pilier !
```sql
ALTER TABLE editorial_post ADD COLUMN pilier_id INTEGER;
```

---

### 3. **`kpi`**
```sql
CREATE TABLE kpi (
  id SERIAL PRIMARY KEY,
  strategy_id INTEGER NOT NULL,
  nom VARCHAR(255) NOT NULL,
  objectif TEXT,
  valeur_cible DECIMAL(10,2),
  unite VARCHAR(50),
  periodicite VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Exemple de données** :
```json
{
  "id": 1,
  "strategy_id": 1,
  "nom": "Followers Instagram",
  "objectif": "Augmenter la visibilité de la marque",
  "valeur_cible": 10000,
  "unite": "followers",
  "periodicite": "mensuel"
}
```

---

### 4. **`kpi_mesure`** (Bonus - Tracking)
```sql
CREATE TABLE kpi_mesure (
  id SERIAL PRIMARY KEY,
  kpi_id INTEGER NOT NULL,
  date DATE NOT NULL,
  valeur_mesuree DECIMAL(10,2) NOT NULL,
  commentaire TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Exemple de données** :
```json
{
  "id": 1,
  "kpi_id": 1,
  "date": "2024-12-01",
  "valeur_mesuree": 8543,
  "commentaire": "Croissance +12% grâce à la campagne de décembre"
}
```

---

## 🚀 Installation

### Étape 1 : Exécuter la Migration

```bash
psql -U postgres -d yourdb -f migrations/extract_strategy_entities.sql
```

**Ou via Supabase Dashboard** :
1. SQL Editor
2. Copier le contenu de `extract_strategy_entities.sql`
3. Exécuter

### Étape 2 : Vérifier

```sql
-- Vérifier que les tables existent
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('persona', 'pilier_contenu', 'kpi', 'kpi_mesure');

-- Vérifier la migration des données
SELECT * FROM persona LIMIT 5;
SELECT * FROM pilier_contenu LIMIT 5;
SELECT * FROM kpi LIMIT 5;
```

---

## 💻 Utilisation dans le Code

### Import de l'API

```typescript
import {
  // Personas
  getPersonas,
  createPersona,
  updatePersona,
  deletePersona,
  
  // Piliers
  getPiliers,
  createPilier,
  updatePilier,
  deletePilier,
  reorderPiliers,
  
  // KPIs
  getKPIs,
  createKPI,
  updateKPI,
  deleteKPI,
  
  // KPI Mesures
  getKPIMesures,
  addKPIMesure,
  getLatestKPIMesures,
  
  // Utilitaires
  getStrategyEntities,
  countStrategyEntities,
} from '@/lib/strategyEntitiesApi';
```

---

### Exemples d'Utilisation

#### 1. Récupérer toutes les entités d'une stratégie

```typescript
const entities = await getStrategyEntities(strategyId);

console.log(entities.personas);  // Persona[]
console.log(entities.piliers);   // PilierContenu[]
console.log(entities.kpis);      // KPI[]
```

#### 2. Créer un persona

```typescript
const newPersona = await createPersona({
  strategy_id: 1,
  nom: 'Sophie, Entrepreneure',
  age_range: '35-45 ans',
  profession: 'CEO Startup',
  besoins: 'Outils de croissance rapide',
  problemes: 'Budget limité',
  attentes: 'ROI mesurable',
  comportements: 'Très active sur LinkedIn',
  canaux_preferes: ['LinkedIn', 'Twitter/X'],
});
```

#### 3. Créer un pilier de contenu

```typescript
const newPilier = await createPilier({
  strategy_id: 1,
  titre: 'Inspiration & Motivation',
  description: 'Contenu inspirant pour engager la communauté',
  exemples: 'Citations, success stories, behind the scenes',
  pourcentage_cible: 30,
  ordre: 1,
});
```

#### 4. Créer un KPI avec suivi

```typescript
// Créer le KPI
const kpi = await createKPI({
  strategy_id: 1,
  nom: 'Taux d\'engagement Instagram',
  objectif: 'Améliorer l\'interaction avec la communauté',
  valeur_cible: 5.5,
  unite: '%',
  periodicite: 'hebdomadaire',
});

// Ajouter une mesure
const mesure = await addKPIMesure({
  kpi_id: kpi.id,
  date: '2024-12-03',
  valeur_mesuree: 4.2,
  commentaire: 'En progression grâce aux Reels',
});
```

#### 5. Lier un post à un pilier

```typescript
await updatePost(postId, {
  pilier_id: 1, // ID du pilier "Expertise & Conseil"
});
```

#### 6. Statistiques par pilier

```sql
-- Nombre de posts par pilier
SELECT 
  pc.titre AS pilier,
  COUNT(ep.id) AS nombre_posts,
  COUNT(CASE WHEN ep.status = 'published' THEN 1 END) AS posts_publies
FROM pilier_contenu pc
LEFT JOIN editorial_post ep ON pc.id = ep.pilier_id
WHERE pc.strategy_id = 1
GROUP BY pc.id, pc.titre;
```

---

## 📈 Avantages

### ✅ Avant vs Après

| Aspect | JSONB (Avant) | Tables (Après) |
|--------|---------------|----------------|
| **Requêtes** | ❌ Complexes, lentes | ✅ Simples, rapides |
| **Relations** | ❌ Impossible | ✅ FKs, CASCADE |
| **Indexation** | ❌ GIN (limité) | ✅ Index classiques |
| **Tracking** | ❌ Pas d'historique | ✅ kpi_mesure |
| **Scalabilité** | ❌ 1MB limite JSONB | ✅ Illimité |
| **Validation** | ❌ Application seulement | ✅ Contraintes DB |
| **Analytics** | ❌ Difficile | ✅ JOINs, agrégations |

---

## 🎨 Prochaines Étapes UI

### 1. Adapter le StrategyForm

**Section "Personas"** : Utiliser l'API au lieu de JSONB
```typescript
// Charger les personas
const [personas, setPersonas] = useState<Persona[]>([]);

useEffect(() => {
  if (strategy?.id) {
    getPersonas(strategy.id).then(setPersonas);
  }
}, [strategy]);

// Ajouter un persona
const handleAddPersona = async (data) => {
  const newPersona = await createPersona({
    strategy_id: strategy.id,
    ...data,
  });
  setPersonas([...personas, newPersona]);
};
```

**Section "Piliers de Contenu"** : Idem
```typescript
const [piliers, setPiliers] = useState<PilierContenu[]>([]);

useEffect(() => {
  if (strategy?.id) {
    getPiliers(strategy.id).then(setPiliers);
  }
}, [strategy]);
```

**Section "KPIs"** : Avec tracking
```typescript
const [kpis, setKpis] = useState<KPI[]>([]);
const [kpiMesures, setKpiMesures] = useState<Record<number, KPIMesure[]>>({});

useEffect(() => {
  if (strategy?.id) {
    getLatestKPIMesures(strategy.id).then((data) => {
      setKpis(data.map(d => d.kpi));
      // Afficher dernière valeur pour chaque KPI
    });
  }
}, [strategy]);
```

---

### 2. Améliorer le Calendrier Éditorial

**Lier les posts aux piliers** :
```typescript
<select
  value={formData.pilier_id || ''}
  onChange={(e) => setFormData({ 
    ...formData, 
    pilier_id: e.target.value ? parseInt(e.target.value) : null 
  })}
>
  <option value="">Aucun pilier</option>
  {piliers.map(p => (
    <option key={p.id} value={p.id}>{p.titre}</option>
  ))}
</select>
```

**Afficher le pilier dans la vue calendrier** :
```typescript
{post.pilier_id && (
  <Badge variant="info">{getPilierTitre(post.pilier_id)}</Badge>
)}
```

---

### 3. Créer un Dashboard KPIs

**Graphiques d'évolution** :
```typescript
const [kpiEvolution, setKpiEvolution] = useState<{
  labels: string[];
  values: number[];
}>({ labels: [], values: [] });

useEffect(() => {
  getKPIMesures(kpiId).then((mesures) => {
    setKpiEvolution({
      labels: mesures.map(m => m.date),
      values: mesures.map(m => m.valeur_mesuree),
    });
  });
}, [kpiId]);

// Utiliser Chart.js ou Recharts
<LineChart data={kpiEvolution} />
```

---

## 🔄 Migration des Données Existantes

La migration SQL **copie automatiquement** les données JSONB vers les nouvelles tables :

```sql
-- Exécuté automatiquement par la migration
DO $$
BEGIN
  -- Migrer personas
  INSERT INTO persona (strategy_id, nom, besoins, problemes, attentes)
  SELECT ...

  -- Migrer piliers
  INSERT INTO pilier_contenu (strategy_id, titre, description, exemples)
  SELECT ...

  -- Migrer KPIs
  INSERT INTO kpi (strategy_id, nom, objectif, periodicite)
  SELECT ...
END $$;
```

**Après vérification**, tu peux supprimer les colonnes JSONB :
```sql
ALTER TABLE social_media_strategy DROP COLUMN personas;
ALTER TABLE social_media_strategy DROP COLUMN piliers_contenu;
ALTER TABLE social_media_strategy DROP COLUMN kpis;
```

---

## 📝 Checklist

- [ ] Migration SQL exécutée
- [ ] Tables créées (4 tables)
- [ ] Données migrées
- [ ] API testée
- [ ] Types TypeScript à jour
- [ ] StrategyForm adapté (Personas)
- [ ] StrategyForm adapté (Piliers)
- [ ] StrategyForm adapté (KPIs)
- [ ] EditorialCalendar lié aux piliers
- [ ] Dashboard KPIs créé (optionnel)
- [ ] Colonnes JSONB supprimées (après validation)

---

## 🆘 Support

**Fichiers de référence** :
- `migrations/extract_strategy_entities.sql` - Migration complète
- `lib/strategyEntitiesApi.ts` - API TypeScript
- `types/database.ts` - Interfaces TypeScript
- `docs/STRATEGY_ENTITIES_EXTRACTION.md` - Ce document

**Commandes utiles** :
```sql
-- Compter les entités
SELECT 
  (SELECT COUNT(*) FROM persona) AS personas,
  (SELECT COUNT(*) FROM pilier_contenu) AS piliers,
  (SELECT COUNT(*) FROM kpi) AS kpis;

-- Voir les entités d'une stratégie
SELECT * FROM persona WHERE strategy_id = 1;
SELECT * FROM pilier_contenu WHERE strategy_id = 1;
SELECT * FROM kpi WHERE strategy_id = 1;
```

---

**Date** : 3 décembre 2024  
**Version** : 1.0  
**Statut** : ✅ Prêt pour migration
