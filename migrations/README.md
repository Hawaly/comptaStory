# 📁 Scripts de Migration - Guide d'Utilisation

## 🎯 Quel Script Utiliser ?

### 1️⃣ Commencez TOUJOURS par le Diagnostic

```bash
psql -U postgres -d yourdb -f quick_check.sql
```

**Ce script vous dira exactement quoi faire ensuite !**

---

## 📊 Scripts de Diagnostic

### `quick_check.sql` ⚡ (RECOMMANDÉ)
**Durée** : 5 secondes  
**Usage** : Diagnostic rapide de votre situation

```bash
psql -U postgres -d yourdb -f quick_check.sql
```

**Affiche** :
- Architecture actuelle (ancienne/nouvelle)
- Colonnes présentes
- Tables créées
- **Recommandation claire sur quoi faire**

---

### `pre_migration_check_safe.sql` 🔍 (Détaillé)
**Durée** : 10 secondes  
**Usage** : Diagnostic complet avant migration

```bash
psql -U postgres -d yourdb -f pre_migration_check_safe.sql
```

**Vérifie** :
- Toutes les tables et colonnes
- Nombre de stratégies, mandats, posts
- Problèmes potentiels
- Stratégies migrables
- Recommandation détaillée

---

## 🔄 Scripts de Migration

### `restructure_strategy_architecture.sql` (Données Existantes)
**À utiliser si** : Vous avez déjà des stratégies avec `mandat_id`

```bash
psql -U postgres -d yourdb -f restructure_strategy_architecture.sql
```

**Actions** :
1. ✅ Ajoute `client_id` (nullable)
2. ✅ Migre données : `mandat.client_id` → `strategy.client_id`
3. ✅ Rend `client_id` NOT NULL
4. ✅ Supprime `mandat_id`
5. ✅ Crée `editorial_calendar`
6. ✅ Crée `editorial_post`
7. ✅ Crée triggers, index, vues

**Gère automatiquement** :
- Données existantes
- Migration progressive
- Erreur "column contains null values"

---

### `fresh_install_architecture.sql` (Nouvelle Installation)
**À utiliser si** : Base de données vide OU aucune colonne `mandat_id`

```bash
psql -U postgres -d yourdb -f fresh_install_architecture.sql
```

**Actions** :
- ✅ Crée `social_media_strategy` avec `client_id` directement
- ✅ Crée `editorial_calendar`
- ✅ Crée `editorial_post`
- ✅ Crée tous les triggers et index

**Pas de migration de données** - Installation propre.

---

## 🌊 Workflow Recommandé

### Étape 1 : Diagnostic
```bash
psql -U postgres -d yourdb -f quick_check.sql
```

### Étape 2 : Suivre la Recommandation

**Si le diagnostic dit** :

#### ✅ "Nouvelle architecture active"
→ **Rien à faire !** Vous pouvez utiliser `EditorialCalendarNew`

#### 🔄 "Ancienne architecture"
→ Exécuter :
```bash
psql -U postgres -d yourdb -f restructure_strategy_architecture.sql
```

#### 🆕 "Nouvelle installation"
→ Exécuter :
```bash
psql -U postgres -d yourdb -f fresh_install_architecture.sql
```

#### ⚠️ "Migration partielle"
→ Relancer :
```bash
psql -U postgres -d yourdb -f restructure_strategy_architecture.sql
```

### Étape 3 : Vérifier
```bash
psql -U postgres -d yourdb -f quick_check.sql
```

Devrait maintenant afficher : ✅ "Nouvelle architecture active"

---

## 🚨 Gestion des Erreurs

### Erreur : "column mandat_id does not exist"
**Dans** : `pre_migration_check.sql` (ancien script)  
**Solution** : Utiliser `quick_check.sql` ou `pre_migration_check_safe.sql`

### Erreur : "column client_id contains null values"
**Dans** : Migration  
**Solution** : La migration `restructure_strategy_architecture.sql` a été corrigée pour gérer ce cas

### Erreur : "relation mandat does not exist"
**Diagnostic** : Vous n'avez jamais eu de table `mandat`  
**Solution** : Utiliser `fresh_install_architecture.sql`

---

## 📋 Liste Complète des Scripts

| Script | Type | Usage | Durée |
|--------|------|-------|-------|
| `quick_check.sql` | Diagnostic | Vérification rapide | 5s |
| `pre_migration_check_safe.sql` | Diagnostic | Vérification détaillée | 10s |
| `restructure_strategy_architecture.sql` | Migration | Avec données existantes | 30s |
| `fresh_install_architecture.sql` | Migration | Nouvelle installation | 20s |
| `pre_migration_check.sql` | ❌ Obsolète | Ne plus utiliser | - |
| `add_editorial_calendar.sql` | ❌ Obsolète | Ancienne approche | - |

---

## ✅ Checklist

Avant migration :
- [ ] Sauvegarde DB effectuée
- [ ] `quick_check.sql` exécuté
- [ ] Recommandation notée

Pendant migration :
- [ ] Script approprié choisi
- [ ] Aucune erreur SQL
- [ ] Toutes les tables créées

Après migration :
- [ ] `quick_check.sql` → "Nouvelle architecture active"
- [ ] Test de création de stratégie
- [ ] Test de création de post
- [ ] Code mis à jour

---

## 📚 Documentation

- **Guide complet** : `../MIGRATION_GUIDE.md`
- **Démarrage rapide** : `../QUICK_START_NEW_ARCHITECTURE.md`
- **Architecture** : `../ARCHITECTURE_COMPLETE.md`
- **Utilisation** : `../docs/NEW_STRATEGY_ARCHITECTURE.md`

---

## 🆘 Support

**En cas de problème** :
1. Exécuter `quick_check.sql` pour diagnostic
2. Consulter `MIGRATION_GUIDE.md` section "En Cas de Problème"
3. Vérifier les erreurs SQL exactes
4. Restaurer la sauvegarde si nécessaire

---

**Dernière mise à jour** : 3 décembre 2024  
**Version** : 2.1 (corrigée pour gérer tous les cas)
