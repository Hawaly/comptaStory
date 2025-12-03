# 🔄 Guide de Migration - Nouvelle Architecture

## 🚨 L'Erreur que Vous Avez Rencontrée

```
ERROR: 23502: column "client_id" of relation "social_media_strategy" contains null values
```

**Cause** : Vous avez des stratégies existantes. On ne peut pas ajouter directement une colonne `NOT NULL` sur des données existantes.

**Solution** : Migration progressive (corrigée) ✅

## 📋 Quelle Migration Utiliser ?

### Scénario 1 : Vous avez des données existantes
➡️ **Utilisez** : `migrations/restructure_strategy_architecture.sql` (CORRIGÉ)

### Scénario 2 : Nouvelle installation (DB vide)
➡️ **Utilisez** : `migrations/fresh_install_architecture.sql`

## 🔍 Étape 1 : Diagnostic Rapide

### Option A : Quick Check (Recommandé - 5 secondes)

```bash
psql -U postgres -d yourdb -f migrations/quick_check.sql
```

**Affiche instantanément** :
- ✅ Architecture actuelle (ancienne ou nouvelle)
- ✅ Colonnes présentes (mandat_id ou client_id)
- ✅ Tables nouvelles (editorial_calendar, editorial_post)
- ✅ Recommandation claire

**Résultat possible** :
```
✅ NOUVELLE ARCHITECTURE ACTIVE - Migration déjà effectuée!
🔄 ANCIENNE ARCHITECTURE - Migration nécessaire
⚠️ MIGRATION PARTIELLE - Exécuter restructure_strategy_architecture.sql
```

### Option B : Diagnostic Complet (Plus détaillé)

```bash
psql -U postgres -d yourdb -f migrations/pre_migration_check_safe.sql
```

**Vérifie en détail** :
- Nombre de stratégies, mandats, calendriers, posts
- Problèmes potentiels (mandats orphelins, etc.)
- État de chaque table
- Recommandation précise

## 🚀 Étape 2 : Exécuter la Migration

### Option A : Avec Données Existantes (RECOMMANDÉ)

```bash
psql -U postgres -d yourdb -f migrations/restructure_strategy_architecture.sql
```

**Ou via Supabase Dashboard** :
1. Ouvrir **SQL Editor**
2. Copier le contenu de `restructure_strategy_architecture.sql`
3. Exécuter

**Ce que fait la migration corrigée** :
1. ✅ Ajoute `client_id` comme **NULLABLE** d'abord
2. ✅ **Migre** les données : `mandat.client_id` → `strategy.client_id`
3. ✅ Rend `client_id` **NOT NULL** (maintenant c'est rempli)
4. ✅ Supprime `mandat_id`
5. ✅ Crée tables `editorial_calendar` et `editorial_post`
6. ✅ Crée triggers, index, vues

### Option B : Nouvelle Installation (DB vide)

```bash
psql -U postgres -d yourdb -f migrations/fresh_install_architecture.sql
```

## ✅ Étape 3 : Vérifier la Migration

```sql
-- Vérifier que client_id est bien rempli
SELECT 
  id,
  client_id,
  status,
  created_at
FROM social_media_strategy
LIMIT 5;

-- Vérifier les calendriers auto-créés
SELECT 
  ec.id AS calendar_id,
  ec.strategy_id,
  sms.client_id,
  c.name AS client_name
FROM editorial_calendar ec
JOIN social_media_strategy sms ON ec.strategy_id = sms.id
JOIN client c ON sms.client_id = c.id
LIMIT 5;

-- Vérifier les tables créées
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('social_media_strategy', 'editorial_calendar', 'editorial_post');
```

**Résultat attendu** :
```
social_media_strategy   ✓
editorial_calendar      ✓
editorial_post          ✓
```

## 🔧 Étape 4 : Cas Spéciaux

### Cas A : Stratégies sans mandat

Si certaines stratégies n'ont pas de `mandat_id` :

```sql
-- Assigner directement à un client
UPDATE social_media_strategy
SET client_id = 1  -- ID du client par défaut
WHERE client_id IS NULL;
```

### Cas B : Mandats sans client

Si certains mandats n'ont pas de `client_id` :

```sql
-- Créer un client "Non assigné"
INSERT INTO client (name, company_name, email)
VALUES ('Non assigné', 'Client par défaut', 'noreply@yourstory.ch')
RETURNING id;

-- Assigner les mandats orphelins
UPDATE mandat
SET client_id = [ID_DU_CLIENT_CRÉÉ]
WHERE client_id IS NULL;

-- Puis relancer la migration
```

### Cas C : Rollback (annuler la migration)

Si vous devez annuler :

```sql
-- 1. Restaurer mandat_id
ALTER TABLE social_media_strategy 
ADD COLUMN mandat_id INTEGER;

-- 2. Si vous avez une sauvegarde de la correspondance
UPDATE social_media_strategy sms
SET mandat_id = m.id
FROM mandat m
WHERE sms.client_id = m.client_id;

-- 3. Supprimer les nouvelles tables
DROP TABLE IF EXISTS editorial_post CASCADE;
DROP TABLE IF EXISTS editorial_calendar CASCADE;

-- 4. Supprimer client_id
ALTER TABLE social_media_strategy DROP COLUMN client_id;
```

## 📊 Étape 5 : Tester

### Test 1 : Créer une stratégie

```sql
-- Créer une stratégie (calendrier auto-créé)
INSERT INTO social_media_strategy (client_id, status, plateformes)
VALUES (1, 'brouillon', ARRAY['Instagram', 'Facebook'])
RETURNING id;
```

### Test 2 : Vérifier le calendrier

```sql
-- Vérifier que le calendrier a été créé automatiquement
SELECT * FROM editorial_calendar 
WHERE strategy_id = [ID_DE_LA_STRATÉGIE];
```

### Test 3 : Créer un post

```sql
-- Créer un post de test
INSERT INTO editorial_post (
  calendar_id, 
  publication_date, 
  platform, 
  title, 
  status
) VALUES (
  1,  -- ID du calendrier
  '2024-12-15',
  'Instagram',
  'Post de test',
  'draft'
)
RETURNING *;
```

## 🎯 Étape 6 : Utiliser dans le Code

```typescript
// Importer l'API
import { getEditorialCalendar, createPost } from '@/lib/editorialCalendarApi';
import { EditorialCalendarNew } from '@/components/strategies/EditorialCalendarNew';

// Récupérer le calendrier
const calendar = await getEditorialCalendar(strategyId);

// Créer un post
await createPost({
  calendar_id: calendar.id,
  publication_date: '2024-12-15',
  platform: 'Instagram',
  title: 'Mon premier post',
  status: 'draft',
});

// Afficher le calendrier
<EditorialCalendarNew
  calendarId={calendar.id}
  platforms={['Instagram', 'Facebook']}
/>
```

## 📝 Checklist Finale

- [ ] Sauvegarde de la DB faite
- [ ] Script de vérification exécuté
- [ ] Aucun problème détecté
- [ ] Migration exécutée avec succès
- [ ] Tables créées (3 tables)
- [ ] `client_id` rempli pour toutes les stratégies
- [ ] Calendriers auto-créés
- [ ] Post de test créé
- [ ] Composant UI testé
- [ ] Code mis à jour

## 🆘 En Cas de Problème

### Erreur : "column client_id contains null values"
✅ **Solution** : Le fichier `restructure_strategy_architecture.sql` a été corrigé pour gérer ce cas.

### Erreur : "column mandat_id does not exist"
**Diagnostic** : Vous n'avez pas `mandat_id` dans votre table
➡️ **2 possibilités** :
1. **Migration déjà faite** : Exécutez `quick_check.sql` pour vérifier
2. **Nouvelle installation** : Utilisez `fresh_install_architecture.sql`

```bash
# Vérifier rapidement
psql -U postgres -d yourdb -f migrations/quick_check.sql
```

### Erreur : "relation mandat does not exist"
**Diagnostic** : Vous n'avez jamais eu de table `mandat`
➡️ **Action** : Utiliser `fresh_install_architecture.sql` (nouvelle installation)

### Erreur : "foreign key violation"
➡️ **Action** : Vérifier que tous les `client_id` existent dans la table `client`

### Stratégies orphelines
```sql
-- Trouver les stratégies sans client valide
SELECT sms.* 
FROM social_media_strategy sms
LEFT JOIN client c ON sms.client_id = c.id
WHERE c.id IS NULL;
```

## 📞 Support

**Fichiers de référence** :
- `ARCHITECTURE_COMPLETE.md` - Architecture complète
- `QUICK_START_NEW_ARCHITECTURE.md` - Démarrage rapide
- `docs/NEW_STRATEGY_ARCHITECTURE.md` - Documentation technique

**Migrations disponibles** :
- ✅ `restructure_strategy_architecture.sql` - Avec données (CORRIGÉ)
- ✅ `fresh_install_architecture.sql` - Nouvelle installation
- ✅ `pre_migration_check.sql` - Vérifications préalables

---

## ✨ Résumé

**La migration a été corrigée pour** :
1. Gérer les données existantes progressivement
2. Migrer automatiquement `mandat_id` → `client_id`
3. Éviter l'erreur "null values"

**Vous pouvez maintenant relancer la migration !** 🚀

---

**Date** : 3 décembre 2024  
**Version** : 2.1 (corrigée)  
**Statut** : ✅ Prêt pour production
