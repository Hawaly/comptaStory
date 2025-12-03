# 🔧 Fix: Erreur "column client_id does not exist"

## 🎯 Problème Identifié

L'erreur `ERROR: 42703: column "client_id" does not exist` est causée par un **conflit de types de données** :

- Votre table `client` utilise : `id BIGINT`
- L'ancien script utilisait : `client_id INTEGER`

PostgreSQL refuse la foreign key car les types ne correspondent pas.

---

## ✅ Solution Appliquée

J'ai corrigé tous les scripts pour utiliser **BIGINT** au lieu de INTEGER :

```sql
CREATE TABLE public.app_user (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  client_id BIGINT REFERENCES public.client(id),  -- ✅ BIGINT maintenant
  ...
);
```

---

## 📋 Fichiers Corrigés

### Scripts SQL Mis à Jour
- ✅ `00_fix_client_table.sql` (inchangé, OK)
- ✅ `01_create_auth_system.sql` - client_id: INTEGER → BIGINT
- ✅ `create_auth_system.sql` - client_id: INTEGER → BIGINT  
- ✅ `create_auth_system_safe.sql` - client_id: INTEGER → BIGINT

### Scripts TypeScript
- ✅ `lib/authApi.ts` - Utilise déjà `number` (compatible BIGINT)
- ✅ `types/database.ts` - Utilise déjà `number` (compatible BIGINT)

---

## 🚀 Installation Maintenant

### Étape 1: Vérifier Structure Client (Optionnel)

```sql
-- Copier/coller: migrations/00_check_client_structure.sql
-- Ce script affiche le type de client.id et la structure recommandée
```

### Étape 2: Corriger Table Client

```sql
-- Copier/coller: migrations/00_fix_client_table.sql
```

**Sortie attendue** :
```
✅ Table public.client trouvée
✅ Colonne email ajoutée (ou existe déjà)
✅ Colonne phone ajoutée (ou existe déjà)
✅ Colonne company_name ajoutée (ou existe déjà)
✅ SUCCÈS: Toutes les colonnes requises sont présentes!
```

### Étape 3: Créer Système Auth

```sql
-- Copier/coller: migrations/01_create_auth_system.sql
```

**Sortie attendue** :
```
✅ Prérequis validés
✅ MIGRATION TERMINÉE AVEC SUCCÈS!
Tables créées: app_user, user_session, activity_log
```

---

## 🔍 Vérification du Type client.id

Si vous voulez vérifier le type de votre colonne `client.id` :

```sql
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'client' 
  AND column_name = 'id';
```

**Résultats possibles** :
- `bigint` → Utilisez BIGINT pour client_id ✅ (corrigé)
- `integer` → INTEGER suffit (rare)

---

## 📊 Structure Complète de app_user

```sql
CREATE TABLE public.app_user (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(50) NOT NULL DEFAULT 'client' 
                  CHECK (role IN ('admin', 'client', 'staff')),
  client_id       BIGINT REFERENCES public.client(id) ON DELETE CASCADE,
  is_active       BOOLEAN DEFAULT true,
  last_login      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

---

## ⚠️ Si Erreur Persiste

### Erreur: "relation app_user already exists"

La table existe déjà avec l'ancien type. Supprimez-la :

```sql
-- ATTENTION: Supprime les données existantes!
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.user_session CASCADE;
DROP TABLE IF EXISTS public.app_user CASCADE;

-- Puis ré-exécutez 01_create_auth_system.sql
```

### Erreur: "foreign key constraint violation"

Des données existent déjà. Option 1: Supprimer les données ou Option 2: Migrer les données.

**Option 1 - Suppression** (si c'est un environnement de test) :
```sql
TRUNCATE TABLE public.app_user CASCADE;
```

**Option 2 - Migration** (si données importantes) :
```sql
-- Créer nouvelle table avec bon type
CREATE TABLE public.app_user_new (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'client',
  client_id BIGINT REFERENCES public.client(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Copier données (convertir INTEGER → BIGINT)
INSERT INTO public.app_user_new
SELECT 
  id,
  email,
  password_hash,
  role,
  client_id::BIGINT,  -- Conversion
  is_active,
  last_login,
  created_at,
  updated_at
FROM public.app_user;

-- Remplacer ancienne table
DROP TABLE public.app_user CASCADE;
ALTER TABLE public.app_user_new RENAME TO app_user;
```

---

## ✅ Vérification Post-Installation

```sql
-- 1. Vérifier le type de client_id
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'app_user' 
  AND column_name = 'client_id';

-- Résultat attendu: bigint

-- 2. Vérifier la foreign key
SELECT 
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
  AND tc.table_name = 'app_user'
  AND kcu.column_name = 'client_id';

-- Résultat attendu: foreign_table_name = client, foreign_column_name = id

-- 3. Tester la vue
SELECT * FROM public.user_with_client LIMIT 1;
-- Devrait fonctionner sans erreur
```

---

## 📚 Récapitulatif des Changements

### Avant (❌ Erreur)
```sql
client_id INTEGER REFERENCES public.client(id)
-- Type mismatch: INTEGER ≠ BIGINT
```

### Après (✅ Correct)
```sql
client_id BIGINT REFERENCES public.client(id)
-- Types compatibles: BIGINT = BIGINT
```

---

## 🎯 Checklist Complète

- [ ] Exécuté `00_fix_client_table.sql` avec succès
- [ ] Vérifié type de `client.id` (bigint)
- [ ] Si `app_user` existe, supprimé avec DROP TABLE
- [ ] Exécuté `01_create_auth_system.sql` avec succès
- [ ] Vérifié `client_id` est BIGINT
- [ ] Testé `SELECT * FROM user_with_client`
- [ ] Aucune erreur "column does not exist"

---

**Tous les scripts sont maintenant corrigés avec BIGINT !** ✅

**Prochaine étape** : Exécuter dans l'ordre :
1. `00_fix_client_table.sql`
2. `01_create_auth_system.sql`
