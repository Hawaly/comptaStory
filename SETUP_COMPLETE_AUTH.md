# 🚀 Configuration Complète du Système d'Authentification

## 📋 Vue d'Ensemble

Ce guide vous permet de configurer rapidement :
- ✅ Table `app_user` avec support admin et client
- ✅ Utilisateur admin (`admin@yourstory.ch`)
- ✅ Utilisateur client lié au client ID 1
- ✅ Login fonctionnel

---

## ⚡ Installation Rapide (10 Minutes)

### Étape 1: Configurer l'Environnement

Créez `.env.local` à la racine du projet :

```env
# Supabase (récupérez depuis votre dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon

# JWT Secret
JWT_SECRET=this_is_a_development_secret_key_minimum_32_chars
```

---

### Étape 2: Exécuter les Scripts SQL (Dans Supabase SQL Editor)

#### Script 1: Créer la table app_user et l'admin

**Copier/coller tout le contenu de** : `migrations/fix_login_now.sql`

✅ **Résultat attendu** :
```
id | email              | role  | client_id | is_active
1  | admin@yourstory.ch | admin | NULL      | true
```

---

#### Script 2: Créer un utilisateur client

**Copier/coller tout le contenu de** : `migrations/create_client_user.sql`

✅ **Résultat attendu** :
```
user_id | email               | role   | client_id | client_name
2       | client1@example.com | client | 1         | [Nom du client]
```

---

### Étape 3: Redémarrer l'Application

```bash
# Si l'app tourne, arrêtez-la (Ctrl+C)
# Supprimez le cache
Remove-Item -Recurse -Force .next

# Redémarrez
npm run dev
```

---

### Étape 4: Tester les Connexions

#### Test 1: Login Admin

1. **URL** : http://localhost:3000/login
2. **Email** : `admin@yourstory.ch`
3. **Mot de passe** : `admin123`
4. **✅ Devrait** : Rediriger vers `/dashboard`

#### Test 2: Login Client

1. **URL** : http://localhost:3000/login (après déconnexion)
2. **Email** : `client1@example.com`
3. **Mot de passe** : `client123`
4. **✅ Devrait** : Rediriger vers `/client-portal` ou `/dashboard`

---

## 📊 Structure de la Table

```sql
CREATE TABLE public.app_user (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,     -- Login email
  password_hash VARCHAR(255) NOT NULL,     -- Hash bcrypt
  role VARCHAR(50) DEFAULT 'client',       -- admin / client / staff
  client_id BIGINT,                        -- Lien vers table client
  is_active BOOLEAN DEFAULT true,          -- Actif ou non
  created_at TIMESTAMP DEFAULT NOW()       -- Date création
);
```

---

## 👥 Utilisateurs Créés

| Email                | Mot de passe | Rôle   | Client ID | Usage                    |
|----------------------|--------------|--------|-----------|--------------------------|
| admin@yourstory.ch   | admin123     | admin  | NULL      | Administration complète  |
| client1@example.com  | client123    | client | 1         | Accès client limité      |

---

## 🔐 Mots de Passe Hash

Les mots de passe sont hashés avec **bcrypt (10 rounds)** :

| Mot de passe | Hash bcrypt                                              |
|--------------|----------------------------------------------------------|
| admin123     | `$2a$10$5vJqMhmYLZCxJzPe5wDmzOjKwDVoGUaXMsJXtmLbJqGqPckZ3Y3Aq` |
| client123    | `$2a$10$5vJqMhmYLZCxJzPe5wDmzOjKwDVoGUaXMsJXtmLbJqGqPckZ3Y3Aq` |

**Note** : Les deux utilisateurs ont temporairement le même hash (même mot de passe). En production, utilisez des mots de passe différents et forts.

---

## 🔧 Créer Plus d'Utilisateurs

### Créer un Admin Supplémentaire

```sql
INSERT INTO public.app_user (email, password_hash, role, client_id, is_active)
VALUES (
  'admin2@yourstory.ch',
  '$2a$10$VOTRE_HASH_ICI',
  'admin',
  NULL,
  true
);
```

### Créer un Client Supplémentaire (lié au client ID 2)

```sql
-- Vérifier que le client existe
SELECT id, name FROM public.client WHERE id = 2;

-- Créer l'utilisateur
INSERT INTO public.app_user (email, password_hash, role, client_id, is_active)
VALUES (
  'client2@example.com',
  '$2a$10$VOTRE_HASH_ICI',
  'client',
  2, -- ID du client
  true
);
```

---

## 🛠️ Générer un Hash Bcrypt

### Option 1: Node.js

```javascript
const bcrypt = require('bcryptjs');
const password = 'MonMotDePasse123';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

### Option 2: En Ligne

Utilisez : https://bcrypt-generator.com/
- **Rounds** : 10
- **Entrez votre mot de passe**
- **Copiez le hash généré**

### Option 3: Script npm

Créez `scripts/hash-password.js` :

```javascript
const bcrypt = require('bcryptjs');
const password = process.argv[2] || 'admin123';
const hash = bcrypt.hashSync(password, 10);
console.log('Password:', password);
console.log('Hash:', hash);
```

Puis :
```bash
node scripts/hash-password.js MonMotDePasse
```

---

## ✅ Vérifications

### Vérifier tous les utilisateurs

```sql
SELECT 
  u.id,
  u.email,
  u.role,
  u.client_id,
  c.name as client_name,
  u.is_active
FROM public.app_user u
LEFT JOIN public.client c ON u.client_id = c.id
ORDER BY u.role, u.id;
```

### Vérifier qu'un client a bien un utilisateur

```sql
SELECT 
  c.id as client_id,
  c.name as client_name,
  u.email as user_email,
  u.role as user_role
FROM public.client c
LEFT JOIN public.app_user u ON u.client_id = c.id
WHERE c.id = 1;
```

### Tester la requête de login

```sql
-- Test login admin
SELECT id, email, password_hash, role, is_active
FROM public.app_user
WHERE email = 'admin@yourstory.ch'
  AND is_active = true;

-- Test login client
SELECT id, email, password_hash, role, client_id, is_active
FROM public.app_user
WHERE email = 'client1@example.com'
  AND is_active = true;
```

---

## 🚨 Dépannage

### Erreur: "Identifiants incorrects"

1. Vérifiez que l'utilisateur existe :
```sql
SELECT * FROM public.app_user WHERE email = 'votre@email.com';
```

2. Vérifiez que `is_active = true`

3. Testez le hash bcrypt :
```javascript
const bcrypt = require('bcryptjs');
const result = bcrypt.compareSync(
  'admin123', 
  '$2a$10$5vJqMhmYLZCxJzPe5wDmzOjKwDVoGUaXMsJXtmLbJqGqPckZ3Y3Aq'
);
console.log('Valid:', result); // Should be true
```

### Erreur: "column username does not exist"

1. Supprimez le cache Next.js :
```bash
Remove-Item -Recurse -Force .next
```

2. Vérifiez qu'il n'y a pas de policy RLS qui cherche `username` :
```sql
SELECT * FROM pg_policies WHERE tablename = 'app_user';
```

3. Désactivez RLS temporairement :
```sql
ALTER TABLE public.app_user DISABLE ROW LEVEL SECURITY;
```

### Erreur: "JWT_SECRET must be defined"

Ajoutez dans `.env.local` :
```env
JWT_SECRET=votre_secret_key_minimum_32_caracteres
```

Puis redémarrez l'app.

---

## 📁 Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `migrations/fix_login_now.sql` | Crée table app_user + admin |
| `migrations/create_client_user.sql` | Crée utilisateur client lié au client 1 |
| `app/api/login/route.ts` | Route API de login |
| `app/(auth)/login/page.tsx` | Page de login |
| `lib/auth.ts` | Fonctions de gestion de session JWT |
| `.env.local` | Variables d'environnement |

---

## 🎯 Checklist Complète

- [ ] `.env.local` créé avec JWT_SECRET
- [ ] Script `fix_login_now.sql` exécuté
- [ ] Admin créé (admin@yourstory.ch)
- [ ] Script `create_client_user.sql` exécuté
- [ ] Client user créé (client1@example.com)
- [ ] Cache `.next` supprimé
- [ ] Application redémarrée
- [ ] Login admin testé et fonctionne
- [ ] Login client testé et fonctionne

---

## 🎉 Félicitations !

Votre système d'authentification est opérationnel avec :
- ✅ Connexion par email/password
- ✅ Hash bcrypt sécurisé
- ✅ Sessions JWT
- ✅ Rôles admin/client
- ✅ Liaison utilisateur-client

**Prochaines étapes suggérées** :
1. Implémenter la protection des routes par rôle
2. Créer le dashboard client avec données filtrées
3. Ajouter la fonctionnalité "mot de passe oublié"
4. Implémenter le changement de mot de passe
5. Ajouter des logs d'activité utilisateur
