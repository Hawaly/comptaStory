# 🏗️ Nouvelle Architecture - Stratégie Social Media

## 🎯 Objectif

Restructuration complète de l'architecture pour une **vraie structure relationnelle** avec des entités séparées et des relations propres.

## ❌ Ancien Problème

**Architecture incorrecte** :
```
Mandat → Stratégie (avec editorial_calendar en JSONB)
```

**Problèmes** :
- ❌ Stratégie liée à un mandat (pas logique)
- ❌ Calendrier éditorial stocké en JSON dans la stratégie
- ❌ Posts pas des entités (juste des objets dans un array)
- ❌ Impossible de faire des requêtes SQL sur les posts
- ❌ Pas de relations propres
- ❌ Pas de métriques individuelles par post

## ✅ Nouvelle Architecture

### Structure Relationnelle

```
Client
  ↓ (1-to-1)
SocialMediaStrategy
  ↓ (1-to-1)
EditorialCalendar
  ↓ (1-to-many)
EditorialPost (entité)
```

**Relations** :
1. **Client → Stratégie** : Un client a UNE stratégie
2. **Stratégie → Calendrier** : Une stratégie a UN calendrier (créé automatiquement)
3. **Calendrier → Posts** : Un calendrier a PLUSIEURS posts

### Tables

#### 1. `social_media_strategy`
```sql
- id (PK)
- client_id (FK → client.id)  ← Changé de mandat_id
- version
- status
- [tous les champs de stratégie...]
- created_at, updated_at
```

#### 2. `editorial_calendar` (nouvelle table)
```sql
- id (PK)
- strategy_id (FK UNIQUE → social_media_strategy.id)
- name
- description
- start_date, end_date
- created_at, updated_at
```

#### 3. `editorial_post` (nouvelle table - entité complète)
```sql
- id (PK)
- calendar_id (FK → editorial_calendar.id)

-- Informations du post
- publication_date
- platform
- content_type
- title
- description

-- Contenu
- caption
- hashtags (text[])
- mentions (text[])
- media_urls (text[])

-- Statut
- status (draft | scheduled | published | cancelled)
- scheduled_time
- published_at

-- Métriques (après publication)
- likes, comments, shares, views, reach
- engagement_rate

-- Métadonnées
- notes
- created_at, updated_at, created_by
```

## 🚀 Installation

### 1. Exécuter la Migration

```bash
# Dans psql ou votre outil SQL
psql -U postgres -d yourdb -f migrations/restructure_strategy_architecture.sql
```

**Contenu de la migration** :
- ✅ Supprime `mandat_id`, ajoute `client_id`
- ✅ Supprime colonne `editorial_calendar` (JSONB)
- ✅ Crée table `editorial_calendar`
- ✅ Crée table `editorial_post`
- ✅ Crée trigger auto-création calendrier
- ✅ Crée vues utiles (`v_editorial_posts_full`, `v_calendar_statistics`)
- ✅ Configure RLS (Row Level Security)
- ✅ Crée index pour performance

### 2. Mettre à Jour les Données Existantes

Si vous avez déjà des stratégies liées à des mandats :

```sql
-- Associer les stratégies aux clients via les mandats
UPDATE social_media_strategy sms
SET client_id = m.client_id
FROM mandat m
WHERE sms.mandat_id = m.id;

-- Vérifier
SELECT 
  sms.id,
  sms.client_id,
  c.name as client_name
FROM social_media_strategy sms
JOIN client c ON sms.client_id = c.id;
```

### 3. Importer les Fichiers TypeScript

```typescript
// Dans votre code
import { 
  EditorialCalendar, 
  EditorialPost, 
  EditorialPostInsert,
  EditorialPostUpdate 
} from '@/types/database';

import {
  getEditorialCalendar,
  getCalendarPosts,
  createPost,
  updatePost,
  deletePost,
  getCalendarStatistics
} from '@/lib/editorialCalendarApi';
```

### 4. Utiliser le Nouveau Composant

```tsx
import { EditorialCalendarNew } from '@/components/strategies/EditorialCalendarNew';

// Dans votre page
<EditorialCalendarNew
  calendarId={calendar.id}
  platforms={strategy.plateformes || []}
/>
```

## 📊 API Functions

### Calendrier

```typescript
// Récupérer le calendrier d'une stratégie
const calendar = await getEditorialCalendar(strategyId);

// Créer un calendrier (si besoin manuel)
const calendar = await createEditorialCalendar(strategyId, "Mon calendrier");
```

### Posts

```typescript
// Récupérer tous les posts
const posts = await getCalendarPosts(calendarId);

// Créer un post
const newPost = await createPost({
  calendar_id: calendarId,
  publication_date: '2024-12-15',
  platform: 'Instagram',
  content_type: 'Reel',
  title: 'Tutoriel produit',
  description: 'Comment utiliser...',
  caption: 'Découvrez notre produit 🔥',
  hashtags: ['#produit', '#tutoriel'],
  mentions: ['@partner'],
  status: 'draft',
});

// Mettre à jour un post
const updated = await updatePost(postId, {
  status: 'published',
  published_at: new Date().toISOString(),
});

// Supprimer un post
await deletePost(postId);

// Statistiques
const stats = await getCalendarStatistics(calendarId);
// {
//   total: 45,
//   draft: 12,
//   scheduled: 20,
//   published: 13,
//   totalLikes: 2500,
//   avgEngagementRate: 3.5,
//   byPlatform: { Instagram: 20, Facebook: 15, ... }
// }
```

## 🔄 Workflow Typique

### Création Stratégie → Calendrier → Posts

```typescript
// 1. Créer une stratégie (trigger crée le calendrier auto)
const { data: strategy } = await supabase
  .from('social_media_strategy')
  .insert({
    client_id: clientId,
    status: 'brouillon',
    // ... autres champs
  })
  .select()
  .single();

// 2. Récupérer le calendrier (créé automatiquement)
const calendar = await getEditorialCalendar(strategy.id);

// 3. Ajouter des posts
await createPost({
  calendar_id: calendar.id,
  publication_date: '2024-12-15',
  platform: 'Instagram',
  title: 'Lancement produit',
  status: 'scheduled',
});

// 4. Visualiser avec le composant
<EditorialCalendarNew
  calendarId={calendar.id}
  platforms={['Instagram', 'Facebook']}
/>
```

## 🎨 Composant UI

### Fonctionnalités

**EditorialCalendarNew** :
- ✅ Chargement depuis la vraie DB
- ✅ Création/édition/suppression de posts
- ✅ Vue calendrier mensuel
- ✅ Statistiques en temps réel
- ✅ Codes couleur par plateforme
- ✅ Modal complet pour posts (caption, hashtags, mentions)
- ✅ États de chargement
- ✅ Confirmation suppression

**Champs du Formulaire Post** :
- Plateforme (requis)
- Type de contenu (Reel, Carrousel, etc.)
- Titre (requis)
- Description courte
- Caption (texte complet du post)
- Hashtags (array)
- Mentions (array)
- Statut (draft/scheduled/published/cancelled)
- Notes internes

## 📈 Métriques et Suivi

### Champs Métriques (remplis après publication)

```typescript
{
  likes: 150,
  comments: 23,
  shares: 12,
  views: 3500,
  reach: 2800,
  engagement_rate: 3.8 // %
}
```

### Mise à Jour des Métriques

```typescript
// Après publication, mettre à jour les stats
await updatePost(postId, {
  likes: 150,
  comments: 23,
  shares: 12,
  views: 3500,
  reach: 2800,
  engagement_rate: 3.8,
});
```

## 🔍 Requêtes Utiles

### Posts du Jour

```typescript
const todayPosts = await getTodaysPosts(calendarId);
```

### Posts en Retard

```typescript
const overduePosts = await getOverduePosts(calendarId);
```

### Posts par Période

```typescript
const posts = await getCalendarPostsByDateRange(
  calendarId,
  '2024-12-01',
  '2024-12-31'
);
```

### Statistiques Globales

```sql
-- Via la vue créée
SELECT * FROM v_calendar_statistics WHERE calendar_id = 1;
```

## 🎯 Avantages de la Nouvelle Architecture

### 1. **Scalabilité**
- Posts en tant qu'entités → millions de posts possibles
- Index SQL pour requêtes rapides
- Pas de limite JSON (32MB)

### 2. **Performance**
- Index sur dates, plateformes, statuts
- Requêtes SQL optimisées
- Pagination facile

### 3. **Flexibilité**
- Ajout facile de nouveaux champs
- Relations propres
- Triggers et contraintes SQL

### 4. **Métriques**
- Suivi individuel par post
- Agrégations SQL rapides
- Statistiques en temps réel

### 5. **Maintenance**
- Code plus propre
- Types TypeScript stricts
- API claire et documentée

## 📝 Checklist Migration

### Avant Migration

- [ ] Sauvegarder la base de données
- [ ] Noter les stratégies existantes
- [ ] Vérifier les liens mandat ↔ client

### Pendant Migration

- [ ] Exécuter `restructure_strategy_architecture.sql`
- [ ] Vérifier les tables créées
- [ ] Associer stratégies aux clients
- [ ] Tester création de posts

### Après Migration

- [ ] Mettre à jour les imports TypeScript
- [ ] Utiliser `EditorialCalendarNew` au lieu de l'ancien
- [ ] Tester CRUD complet des posts
- [ ] Vérifier les statistiques
- [ ] Documenter pour l'équipe

## ⚠️ Points d'Attention

### 1. **Client_ID Obligatoire**

Les stratégies sont maintenant liées aux clients, pas aux mandats :

```typescript
// ❌ Ancien
mandat_id: mandatId

// ✅ Nouveau
client_id: clientId
```

### 2. **Calendrier Auto-Créé**

Un calendrier est créé automatiquement lors de la création d'une stratégie via un trigger SQL.

### 3. **Posts = Entités**

Les posts ne sont plus des objets JSON mais des lignes en DB avec ID unique.

### 4. **Métriques Optionnelles**

Les métriques (likes, views, etc.) sont à 0 par défaut et remplies après publication.

## 🚀 Prochaines Évolutions

### Phase 2 - Automatisation
- [ ] Import depuis APIs (Meta, LinkedIn, etc.)
- [ ] Auto-remplissage métriques
- [ ] Publication automatique programmée
- [ ] Notifications posts à publier

### Phase 3 - Analytics
- [ ] Tableaux de bord analytics
- [ ] Graphiques d'engagement
- [ ] Comparaisons plateformes
- [ ] ROI par post

### Phase 4 - Collaboration
- [ ] Workflow d'approbation
- [ ] Commentaires sur posts
- [ ] Assignation de posts
- [ ] Historique des modifications

## 📚 Fichiers Créés/Modifiés

### Nouveaux Fichiers

1. **`migrations/restructure_strategy_architecture.sql`**
   - Migration complète SQL
   
2. **`lib/editorialCalendarApi.ts`**
   - API functions pour calendrier et posts
   
3. **`components/strategies/EditorialCalendarNew.tsx`**
   - Nouveau composant utilisant vraie DB

4. **`docs/NEW_STRATEGY_ARCHITECTURE.md`**
   - Cette documentation

### Fichiers Modifiés

1. **`types/database.ts`**
   - Ajout `EditorialCalendar` interface
   - Ajout `EditorialPost` interface complète
   - Changement `mandat_id` → `client_id`
   - Suppression `editorial_calendar` de SocialMediaStrategy

## 💡 Exemple Complet

```typescript
// 1. Créer stratégie pour un client
const strategy = await createStrategy({
  client_id: 5,
  status: 'brouillon',
  plateformes: ['Instagram', 'Facebook', 'LinkedIn'],
  // ... autres champs
});

// 2. Récupérer le calendrier (auto-créé)
const calendar = await getEditorialCalendar(strategy.id);

// 3. Planifier des posts
await createPost({
  calendar_id: calendar.id,
  publication_date: '2024-12-15',
  platform: 'Instagram',
  content_type: 'Reel',
  title: 'Lancement produit A',
  caption: 'Découvrez notre nouveau produit révolutionnaire 🚀',
  hashtags: ['#innovation', '#tech', '#produitA'],
  mentions: ['@partenaire'],
  status: 'scheduled',
  scheduled_time: '10:00:00',
});

await createPost({
  calendar_id: calendar.id,
  publication_date: '2024-12-16',
  platform: 'LinkedIn',
  content_type: 'Article',
  title: 'Case study produit A',
  caption: 'Comment notre produit A révolutionne l\'industrie...',
  hashtags: ['#casestudy', '#innovation'],
  status: 'draft',
});

// 4. Récupérer et afficher
const posts = await getCalendarPosts(calendar.id);
const stats = await getCalendarStatistics(calendar.id);

console.log(`Total posts: ${stats.total}`);
console.log(`Programmés: ${stats.scheduled}`);
```

---

## ✅ Résumé

La nouvelle architecture est :
- ✨ **Propre** : Entités séparées avec relations claires
- 🚀 **Performante** : Index SQL optimisés
- 📈 **Scalable** : Millions de posts possibles
- 🎯 **Complète** : Métriques individuelles par post
- 🔧 **Maintenable** : Code clair, types stricts

**Migration recommandée dès que possible !**

---

**Date** : 3 décembre 2024  
**Version** : 2.0  
**Auteur** : YourStory Development Team
