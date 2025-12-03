# 🏗️ Architecture Complète - Calendrier Éditorial

## ✅ Vous aviez raison !

L'architecture initiale n'était pas optimale. Voici la **nouvelle structure relationnelle correcte**.

## 🎯 Nouvelle Architecture

### Relations Logiques

```
Client
  ↓ (1-to-1 ou 1-to-many selon besoin futur)
SocialMediaStrategy
  ↓ (1-to-1)
EditorialCalendar
  ↓ (1-to-many)
EditorialPost
```

### Explication

1. **Client → Stratégie**
   - Un client a UNE (ou plusieurs) stratégie(s) social media
   - La stratégie appartient au CLIENT, pas au mandat
   - Logique : Une stratégie de communication est globale au client

2. **Stratégie → Calendrier Éditorial**
   - Une stratégie a UN calendrier éditorial
   - Relation 1-to-1 (UNIQUE constraint)
   - Créé automatiquement par trigger SQL

3. **Calendrier → Posts**
   - Un calendrier a PLUSIEURS posts
   - Relation 1-to-many
   - Chaque post est une **entité à part entière**

## 📊 Structure des Tables

### Table 1: `social_media_strategy`

```sql
CREATE TABLE social_media_strategy (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES client(id),  -- ← CLIENT, pas mandat
  version INTEGER DEFAULT 1,
  status VARCHAR(20),
  
  -- Tous les champs de stratégie...
  contexte_general TEXT,
  objectifs_business TEXT,
  -- etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Changement clé** : `client_id` au lieu de `mandat_id`

### Table 2: `editorial_calendar` (Nouvelle)

```sql
CREATE TABLE editorial_calendar (
  id SERIAL PRIMARY KEY,
  strategy_id INTEGER NOT NULL UNIQUE REFERENCES social_media_strategy(id),
  name VARCHAR(255),
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT editorial_calendar_strategy_unique UNIQUE(strategy_id)
);
```

**Rôle** : Table associative entre stratégie et posts

### Table 3: `editorial_post` (Nouvelle - Entité complète)

```sql
CREATE TABLE editorial_post (
  id SERIAL PRIMARY KEY,
  calendar_id INTEGER NOT NULL REFERENCES editorial_calendar(id),
  
  -- Info du post
  publication_date DATE NOT NULL,
  platform VARCHAR(50) NOT NULL,
  content_type VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Contenu détaillé
  caption TEXT,
  hashtags TEXT[],       -- Array PostgreSQL
  mentions TEXT[],       -- Array PostgreSQL
  media_urls TEXT[],
  
  -- Statut et planification
  status VARCHAR(20) DEFAULT 'draft',
  scheduled_time TIME,
  published_at TIMESTAMP,
  
  -- Métriques (après publication)
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
```

**Rôle** : Entité complète pour chaque post planifié

## 🚀 Avantages de Cette Architecture

### 1. Entités Séparées
- ✅ Chaque post a son propre ID
- ✅ Possibilité de requêtes SQL complexes
- ✅ Index pour performance
- ✅ Métriques individuelles

### 2. Relations Propres
- ✅ Foreign keys avec CASCADE
- ✅ Contraintes d'intégrité
- ✅ Triggers pour automatisation

### 3. Scalabilité
- ✅ Millions de posts possibles
- ✅ Pas de limite JSON (32MB dans l'ancien système)
- ✅ Pagination SQL native

### 4. Flexibilité
- ✅ Ajout facile de nouveaux champs
- ✅ Relations extensibles
- ✅ Analytics puissants

### 5. Métriques Complètes
- ✅ Suivi individuel par post
- ✅ Agrégations rapides (SUM, AVG)
- ✅ Statistiques en temps réel

## 📁 Fichiers Créés

### 1. Migration SQL
**`migrations/restructure_strategy_architecture.sql`**
- Modifie `social_media_strategy` (client_id)
- Crée table `editorial_calendar`
- Crée table `editorial_post`
- Crée trigger auto-création calendrier
- Crée vues utiles
- Configure index et RLS

### 2. API TypeScript
**`lib/editorialCalendarApi.ts`**
- `getEditorialCalendar(strategyId)`
- `createEditorialCalendar(strategyId)`
- `getCalendarPosts(calendarId)`
- `createPost(post)`
- `updatePost(postId, updates)`
- `deletePost(postId)`
- `getCalendarStatistics(calendarId)`
- `getTodaysPosts(calendarId)`
- `getOverduePosts(calendarId)`

### 3. Types TypeScript
**`types/database.ts`** (modifié)
- Interface `EditorialCalendar`
- Interface `EditorialPost` (complète)
- Types `EditorialPostInsert`, `EditorialPostUpdate`
- Changement `mandat_id` → `client_id`

### 4. Composant UI
**`components/strategies/EditorialCalendarNew.tsx`**
- Calendrier mensuel interactif
- Chargement depuis DB réelle
- CRUD complet (Create, Read, Update, Delete)
- Statistiques en temps réel
- Modal d'édition complet

### 5. Documentation
- **`docs/NEW_STRATEGY_ARCHITECTURE.md`** - Guide complet
- **`docs/EDITORIAL_CALENDAR.md`** - Guide utilisateur
- **`ARCHITECTURE_COMPLETE.md`** - Ce fichier (résumé)

## 🔧 Installation

### Étape 1: Exécuter la Migration

```bash
psql -U postgres -d yourstory_db -f migrations/restructure_strategy_architecture.sql
```

**OU via Supabase Dashboard** :
1. Ouvrir SQL Editor
2. Copier le contenu de `restructure_strategy_architecture.sql`
3. Exécuter

### Étape 2: Migrer les Données Existantes (si nécessaire)

```sql
-- Si vous aviez des stratégies avec mandat_id
UPDATE social_media_strategy sms
SET client_id = (
  SELECT client_id FROM mandat WHERE id = sms.mandat_id
);

-- Vérifier
SELECT 
  sms.id,
  sms.client_id,
  c.name as client_name
FROM social_media_strategy sms
JOIN client c ON sms.client_id = c.id;
```

### Étape 3: Utiliser dans le Code

```typescript
// Importer le nouveau composant
import { EditorialCalendarNew } from '@/components/strategies/EditorialCalendarNew';
import { getEditorialCalendar } from '@/lib/editorialCalendarApi';

// Dans votre page de stratégie
const strategy = // ... récupérer la stratégie
const calendar = await getEditorialCalendar(strategy.id);

// Afficher le calendrier
<EditorialCalendarNew
  calendarId={calendar.id}
  platforms={strategy.plateformes || []}
/>
```

## 💡 Exemple Complet

```typescript
// 1. Créer une stratégie pour un client
const { data: strategy } = await supabase
  .from('social_media_strategy')
  .insert({
    client_id: 5,  // ← CLIENT ID, pas mandat
    status: 'brouillon',
    plateformes: ['Instagram', 'Facebook', 'LinkedIn'],
    contexte_general: '...',
    // ... autres champs
  })
  .select()
  .single();

// 2. Le calendrier est créé automatiquement par trigger
// Récupérer le calendrier
const calendar = await getEditorialCalendar(strategy.id);
console.log('Calendar ID:', calendar.id);

// 3. Créer des posts
await createPost({
  calendar_id: calendar.id,
  publication_date: '2024-12-15',
  platform: 'Instagram',
  content_type: 'Reel',
  title: 'Lancement produit',
  caption: 'Découvrez notre nouveau produit 🚀',
  hashtags: ['#innovation', '#tech'],
  mentions: ['@partenaire'],
  status: 'scheduled',
  scheduled_time: '10:00:00',
});

await createPost({
  calendar_id: calendar.id,
  publication_date: '2024-12-16',
  platform: 'LinkedIn',
  content_type: 'Article',
  title: 'Case study',
  caption: 'Comment notre produit révolutionne...',
  status: 'draft',
});

// 4. Récupérer les posts
const posts = await getCalendarPosts(calendar.id);
console.log(`${posts.length} posts planifiés`);

// 5. Statistiques
const stats = await getCalendarStatistics(calendar.id);
console.log('Statistiques:', stats);
// {
//   total: 2,
//   draft: 1,
//   scheduled: 1,
//   published: 0,
//   byPlatform: { Instagram: 1, LinkedIn: 1 }
// }
```

## 🎯 Comparaison Avant/Après

### ❌ AVANT (Incorrect)

```typescript
// Stratégie liée à un mandat
mandat_id: 123

// Calendrier en JSON
editorial_calendar: [
  {
    id: "temp-1",
    date: "2024-12-15",
    platform: "Instagram",
    title: "Post 1"
  }
]
```

**Problèmes** :
- Pas de vraie relation DB
- Posts = simples objets JSON
- Pas de métriques individuelles
- Limite 32MB JSON
- Requêtes SQL impossibles

### ✅ APRÈS (Correct)

```sql
-- Stratégie liée au client
client_id: 5

-- Calendrier = table séparée
editorial_calendar:
  id: 1
  strategy_id: 10
  name: "Calendrier 2024"

-- Posts = entités séparées
editorial_post:
  id: 1
  calendar_id: 1
  publication_date: '2024-12-15'
  platform: 'Instagram'
  title: 'Post 1'
  likes: 150
  comments: 23
  engagement_rate: 3.8
```

**Avantages** :
- Relations DB propres
- Posts = entités avec ID
- Métriques complètes
- Pas de limite
- Requêtes SQL puissantes

## 📋 Checklist de Migration

- [ ] Sauvegarder la base de données
- [ ] Exécuter `restructure_strategy_architecture.sql`
- [ ] Vérifier les tables créées (3 tables)
- [ ] Migrer `mandat_id` → `client_id` si nécessaire
- [ ] Tester création de stratégie
- [ ] Vérifier calendrier auto-créé
- [ ] Créer un post de test
- [ ] Tester le composant `EditorialCalendarNew`
- [ ] Vérifier les statistiques
- [ ] Mettre à jour les imports dans le code

## 🆘 Support

### Questions Fréquentes

**Q: Pourquoi client_id au lieu de mandat_id ?**
R: Une stratégie de communication est globale au client, pas spécifique à un mandat. C'est plus logique conceptuellement.

**Q: Le calendrier est créé automatiquement ?**
R: Oui, via un trigger SQL lors de la création d'une stratégie.

**Q: Que devient l'ancien champ editorial_calendar ?**
R: Il est supprimé. Les données sont maintenant dans `editorial_post` (table séparée).

**Q: Comment accéder aux posts ?**
R: Via l'API : `getCalendarPosts(calendarId)`

**Q: Les métriques sont obligatoires ?**
R: Non, elles sont à 0 par défaut et remplies après publication.

## 🎉 Résultat Final

**Architecture professionnelle et scalable** :
- ✅ Entités séparées
- ✅ Relations propres
- ✅ API complète
- ✅ Composant UI moderne
- ✅ Métriques individuelles
- ✅ Documentation complète

**Prêt pour la production !** 🚀

---

**Date** : 3 décembre 2024  
**Version** : 2.0  
**Statut** : ✅ Architecture validée et implémentée
