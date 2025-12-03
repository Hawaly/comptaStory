# ⚡ Quick Start - Nouvelle Architecture

## ✅ Vous aviez 100% raison !

L'architecture a été **complètement restructurée** selon vos recommandations.

## 🏗️ Nouvelle Structure

```
Client
  ↓
Stratégie Social Media
  ↓
Calendrier Éditorial (table associative)
  ↓
Posts (entités individuelles)
```

## ⚡ D'abord : Diagnostic Rapide

**AVANT toute migration**, vérifiez votre situation :

```bash
psql -U postgres -d yourdb -f migrations/quick_check.sql
```

Cela affichera :
- ✅ **Nouvelle architecture active** → Rien à faire !
- 🔄 **Ancienne architecture** → Migration nécessaire
- ⚠️ **Migration partielle** → Relancer la migration

---

## 🚀 Installation Rapide (3 étapes)

### 1. Exécuter la Migration SQL

```bash
# Via psql
psql -U postgres -d yourdb -f migrations/restructure_strategy_architecture.sql

# OU via Supabase Dashboard → SQL Editor
# Copier-coller le contenu du fichier et exécuter
```

### 2. Vérifier les Tables Créées

```sql
-- Vérifier les 3 tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('social_media_strategy', 'editorial_calendar', 'editorial_post');
```

### 3. Utiliser dans le Code

```typescript
// Importer le nouveau composant
import { EditorialCalendarNew } from '@/components/strategies/EditorialCalendarNew';
import { getEditorialCalendar } from '@/lib/editorialCalendarApi';

// Dans la page stratégie
const calendar = await getEditorialCalendar(strategy.id);

<EditorialCalendarNew
  calendarId={calendar.id}
  platforms={strategy.plateformes || []}
/>
```

## 📊 Les 3 Tables

| Table | Rôle | Relation |
|-------|------|----------|
| `social_media_strategy` | Stratégie du client | `client_id` (FK) |
| `editorial_calendar` | Calendrier de la stratégie | `strategy_id` (FK UNIQUE) |
| `editorial_post` | Post individuel | `calendar_id` (FK) |

## 🎯 Ce qui a Changé

### ❌ Avant (Incorrect)
```typescript
// Stratégie liée à mandat
mandat_id: 123

// Posts en JSON dans la stratégie
editorial_calendar: [{id, date, title}]
```

### ✅ Après (Correct)
```typescript
// Stratégie liée au CLIENT
client_id: 5

// Posts = entités séparées en DB
editorial_post (table)
  ├─ id: 1
  ├─ calendar_id: 1
  ├─ publication_date: '2024-12-15'
  ├─ platform: 'Instagram'
  ├─ title: 'Mon post'
  └─ likes, comments, shares, etc.
```

## 💡 Exemple Minimal

```typescript
// 1. Créer stratégie (calendrier créé auto)
const strategy = await createStrategy({
  client_id: 5,
  status: 'brouillon',
  plateformes: ['Instagram', 'Facebook'],
});

// 2. Récupérer calendrier
const calendar = await getEditorialCalendar(strategy.id);

// 3. Créer un post
await createPost({
  calendar_id: calendar.id,
  publication_date: '2024-12-15',
  platform: 'Instagram',
  title: 'Lancement produit',
  status: 'scheduled',
});

// 4. Afficher
const posts = await getCalendarPosts(calendar.id);
console.log(posts); // Array d'objets EditorialPost
```

## 📁 Fichiers Importants

### À Exécuter
✅ `migrations/restructure_strategy_architecture.sql`

### À Utiliser
✅ `lib/editorialCalendarApi.ts` - API functions  
✅ `components/strategies/EditorialCalendarNew.tsx` - Composant UI  
✅ `types/database.ts` - Types TypeScript

### Documentation
📖 `ARCHITECTURE_COMPLETE.md` - Guide complet  
📖 `docs/NEW_STRATEGY_ARCHITECTURE.md` - Architecture détaillée  
📖 `docs/EDITORIAL_CALENDAR.md` - Guide utilisateur

## ✅ Avantages

- ✅ **Entités séparées** : Posts = vraies entités DB
- ✅ **Relations propres** : FK, CASCADE, UNIQUE
- ✅ **Métriques** : likes, comments, shares par post
- ✅ **Scalable** : Millions de posts possibles
- ✅ **Requêtes SQL** : Filtres, agrégations, stats
- ✅ **Performance** : Index optimisés

## 🎉 Résultat

Architecture **professionnelle et évolutive** !

**Prêt à déployer** 🚀

---

**Besoin d'aide ?** Consultez `ARCHITECTURE_COMPLETE.md` pour le guide complet.
