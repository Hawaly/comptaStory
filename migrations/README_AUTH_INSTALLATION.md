# 🔐 Installation Système d'Authentification

## ⚠️ IMPORTANT: Ordre d'Exécution

Le système d'authentification nécessite **2 scripts exécutés dans l'ordre** :

```
1️⃣ 00_fix_client_table.sql     (Prépare la table client)
2️⃣ 01_create_auth_system.sql   (Crée le système auth avec BIGINT)
```

**Note** : Les scripts utilisent `client_id BIGINT` pour correspondre au type `id BIGINT` de votre table `client`.

---

## 🚀 Installation Rapide

### Dans Supabase SQL Editor

#### Étape 1: Corriger la Table Client

1. Ouvrir **SQL Editor**
2. Copier/coller **tout le contenu** de :
   ```
   migrations/00_fix_client_table.sql
   ```
3. Cliquer **Run**

**Sortie attendue** :
```
✅ Table public.client trouvée
✅ Colonne email ajoutée
✅ Colonne phone ajoutée
✅ Colonne company_name ajoutée
========================================
✅ SUCCÈS: Toutes les colonnes requises sont présentes!
========================================
➡️  Vous pouvez maintenant exécuter:
   migrations/01_create_auth_system.sql
========================================
```

---

#### Étape 2: Créer le Système Auth

1. **Après le succès de l'étape 1**
2. Copier/coller **tout le contenu** de :
   ```
   migrations/01_create_auth_system.sql
   ```
3. Cliquer **Run**

**Sortie attendue** :
```
========================================
✅ MIGRATION TERMINÉE AVEC SUCCÈS!
========================================
Tables créées:
  • public.app_user
  • public.user_session
  • public.activity_log

Vues créées:
  • public.user_with_client
  • public.user_statistics

Fonctions créées:
  • cleanup_expired_sessions()
  • log_activity()
  • check_user_permission()

Utilisateur admin créé: admin@yourstory.ch
⚠️  Changez le mot de passe avec bcrypt!
========================================
```

---

## 📋 Pourquoi 2 Scripts ?

### Problème Technique

PostgreSQL ne rend pas immédiatement visibles les modifications DDL (comme `ALTER TABLE`) effectuées dans un bloc `DO $$` pour les commandes suivantes dans le même script.

### Solution

**Script 1** : Modifie la structure de la table `client` (ajout colonnes)
- Utilise `EXECUTE` pour forcer l'exécution immédiate
- Chaque `ALTER TABLE` dans son propre bloc
- Vérification finale

**Script 2** : Crée le système auth
- Suppose que la table `client` est correcte
- Vérifie les prérequis au début
- Crée tables, vues, fonctions

---

## 🔍 En Cas d'Erreur

### Erreur sur Script 1

#### "La table public.client n'existe pas"

```sql
-- Vérifier que la table existe
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'client';
```

**Si vide** : Créez d'abord la table client avec `databaseScript.sql`

---

#### "Colonne toujours manquante"

Exécutez manuellement :
```sql
ALTER TABLE public.client ADD COLUMN email TEXT;
ALTER TABLE public.client ADD COLUMN phone TEXT;
ALTER TABLE public.client ADD COLUMN company_name TEXT;
```

---

### Erreur sur Script 2

#### "Colonne email manquante"

Le script 1 n'a pas réussi. Retournez à l'**Étape 1**.

---

#### "Table app_user existe déjà"

Le système auth est déjà créé. Pour réinstaller :

```sql
-- ATTENTION: Ceci supprime tout!
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.user_session CASCADE;
DROP TABLE IF EXISTS public.app_user CASCADE;
DROP VIEW IF EXISTS public.user_with_client CASCADE;
DROP VIEW IF EXISTS public.user_statistics CASCADE;

-- Puis ré-exécuter 01_create_auth_system.sql
```

---

## ✅ Vérification Post-Installation

```sql
-- 1. Vérifier les tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('app_user', 'user_session', 'activity_log');
-- Résultat: 3 lignes

-- 2. Vérifier les vues
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('user_with_client', 'user_statistics');
-- Résultat: 2 lignes

-- 3. Tester la vue
SELECT * FROM public.user_with_client LIMIT 5;
-- Devrait fonctionner sans erreur

-- 4. Vérifier l'admin
SELECT id, email, role FROM public.app_user WHERE role = 'admin';
-- Résultat: admin@yourstory.ch
```

---

## 📦 Prochaines Étapes

### 1. Installer Dépendances Node.js

```bash
npm install bcryptjs @types/bcryptjs
```

### 2. Créer Utilisateur Admin avec Vrai Mot de Passe

```typescript
// scripts/create-admin.ts
import { hashPassword } from '@/lib/authApi';
import { supabase } from '@/lib/supabaseClient';

async function createAdmin() {
  const hash = await hashPassword('VotreMotDePasseSecurisé');
  
  await supabase
    .from('app_user')
    .update({ password_hash: hash })
    .eq('email', 'admin@yourstory.ch');
  
  console.log('✅ Mot de passe admin mis à jour!');
}

createAdmin();
```

```bash
npx ts-node scripts/create-admin.ts
```

### 3. Intégrer AuthProvider

```typescript
// app/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 4. Tester Connexion

```
http://localhost:3000/login
```

Credentials:
- **Email**: admin@yourstory.ch
- **Password**: Celui que vous avez défini à l'étape 2

---

## 📚 Documentation

- **`AUTH_SYSTEM_GUIDE.md`** - Guide complet du système
- **`QUICK_START_AUTH.md`** - Quick start
- **`FIX_AUTH_ERROR.md`** - Résolution erreurs

---

## 🔄 Réinstallation Complète

Si vous voulez tout recommencer :

```sql
-- 1. Supprimer le système auth
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.user_session CASCADE;
DROP TABLE IF EXISTS public.app_user CASCADE;
DROP VIEW IF EXISTS public.user_with_client CASCADE;
DROP VIEW IF EXISTS public.user_statistics CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS log_activity(INTEGER, VARCHAR, VARCHAR, INTEGER, JSONB, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS check_user_permission(INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_app_user_updated_at() CASCADE;

-- 2. (Optionnel) Supprimer colonnes ajoutées
-- ATTENTION: Ne faites ceci que si ces colonnes n'existaient pas avant
ALTER TABLE public.client DROP COLUMN IF EXISTS email;
ALTER TABLE public.client DROP COLUMN IF EXISTS phone;
ALTER TABLE public.client DROP COLUMN IF EXISTS company_name;

-- 3. Réexécuter les 2 scripts dans l'ordre
-- 00_fix_client_table.sql
-- 01_create_auth_system.sql
```

---

## ✅ Checklist Installation

- [ ] Exécuté `00_fix_client_table.sql` avec succès
- [ ] Message "✅ SUCCÈS: Toutes les colonnes requises sont présentes!"
- [ ] Exécuté `01_create_auth_system.sql` avec succès
- [ ] 3 tables créées (app_user, user_session, activity_log)
- [ ] 2 vues créées (user_with_client, user_statistics)
- [ ] Test `SELECT * FROM public.user_with_client` fonctionne
- [ ] Installé bcryptjs (`npm install bcryptjs`)
- [ ] Créé admin avec vrai mot de passe hashé
- [ ] Intégré AuthProvider dans layout
- [ ] Testé login sur /login

---

**Installation complète en 2 étapes simples !** 🚀✅
