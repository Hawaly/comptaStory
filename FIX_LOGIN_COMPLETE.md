# 🔐 Guide Complet: Faire Fonctionner le Login

## 🎯 Problème Identifié

L'erreur 500 sur `/api/login` est causée par :
1. ❌ La table `app_user` n'existe pas ou n'a pas la bonne structure
2. ❌ Pas d'utilisateur admin créé avec mot de passe hashé
3. ❌ JWT_SECRET non défini dans `.env.local`
4. ❌ La route cherchait `username` au lieu de `email`

---

## ✅ Solution Complète (5 Étapes)

### Étape 1: Configurer l'Environnement

Créez ou modifiez `.env.local` :

```env
# Supabase (récupérez depuis votre dashboard Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon

# JWT Secret (générez une clé aléatoire)
JWT_SECRET=une_cle_secrete_de_minimum_32_caracteres_pour_jwt
```

**Pour générer un JWT_SECRET** :
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Utiliser temporairement (DEV SEULEMENT)
JWT_SECRET=this_is_a_development_secret_key_minimum_32_chars
```

---

### Étape 2: Créer les Tables Auth

**Dans Supabase SQL Editor**, exécutez dans l'ordre :

#### 2.1 Préparer la table client
```sql
-- Copier/coller: migrations/00_fix_client_table.sql
```

#### 2.2 Créer le système auth
```sql
-- Copier/coller: migrations/01_create_auth_system.sql
```

**✅ Résultat attendu** :
```
✅ MIGRATION TERMINÉE AVEC SUCCÈS!
Tables créées: app_user, user_session, activity_log
```

---

### Étape 3: Créer un Utilisateur Admin

**Dans Supabase SQL Editor** :

```sql
-- Copier/coller: migrations/create_admin_simple.sql
```

Ce script crée :
- **Email** : `admin@yourstory.ch`
- **Mot de passe** : `admin123`
- **Rôle** : `admin`

**✅ Vérification** :
```sql
SELECT id, email, role, password_hash 
FROM public.app_user 
WHERE email = 'admin@yourstory.ch';
```

Vous devriez voir l'utilisateur avec un hash commençant par `$2a$10$...`

---

### Étape 4: Redémarrer l'Application

```bash
# Arrêter l'application (Ctrl+C)
# Puis redémarrer
npm run dev
```

**Important** : Le redémarrage est nécessaire pour charger les nouvelles variables d'environnement.

---

### Étape 5: Tester le Login

1. Allez sur : http://localhost:3000/login
2. Entrez :
   - **Email** : `admin@yourstory.ch`
   - **Mot de passe** : `admin123`
3. Cliquez "Se connecter"

**✅ Succès** : Vous serez redirigé vers `/dashboard`

---

## 🔍 Vérifications et Débogage

### Vérifier les Tables

```sql
-- 1. Table app_user existe ?
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'app_user'
);

-- 2. Structure correcte ?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_user' 
ORDER BY ordinal_position;

-- Colonnes attendues:
-- id, email, password_hash, role, client_id, is_active, last_login, created_at, updated_at
```

### Vérifier l'Utilisateur

```sql
-- L'admin existe ?
SELECT id, email, role, is_active,
       LEFT(password_hash, 10) as hash_preview
FROM public.app_user 
WHERE email = 'admin@yourstory.ch';

-- Résultat attendu:
-- id | email | role | is_active | hash_preview
-- 1  | admin@yourstory.ch | admin | true | $2a$10$5vJ
```

### Vérifier les Logs Console

Ouvrez la console du navigateur (F12) et vérifiez :

**Si erreur 500** :
```javascript
// Regardez l'onglet Network
// Cliquez sur la requête "login" rouge
// Onglet Response pour voir l'erreur détaillée
```

**Si erreur "JWT_SECRET"** :
- `.env.local` n'est pas configuré
- Redémarrez l'application après modification

**Si erreur "Identifiants incorrects"** :
- L'utilisateur n'existe pas
- Le mot de passe est incorrect
- L'utilisateur n'est pas actif

---

## 📝 Structure Finale

### Route API: `/api/login/route.ts`
```typescript
// ✅ Accepte username (qui contient l'email)
// ✅ Cherche par email dans app_user
// ✅ Compare avec bcrypt
// ✅ Crée une session JWT
```

### Page Login: `/(auth)/login/page.tsx`
```typescript
// ✅ Champ "Email" (mais variable username)
// ✅ Placeholder: admin@yourstory.ch
// ✅ Type: email
```

### Table: `app_user`
```sql
CREATE TABLE public.app_user (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,  -- ✅ Login par email
  password_hash VARCHAR(255) NOT NULL,  -- ✅ Hash bcrypt
  role VARCHAR(50),                     -- ✅ admin/client/staff
  client_id BIGINT,
  is_active BOOLEAN DEFAULT true,
  ...
);
```

---

## 🚀 Script Tout-en-Un (Alternative)

Si vous voulez tout faire d'un coup, créez ce script SQL :

```sql
-- migrations/setup_login_complete.sql

-- 1. Nettoyer
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.user_session CASCADE;
DROP TABLE IF EXISTS public.app_user CASCADE;

-- 2. Créer app_user
CREATE TABLE public.app_user (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'client',
  client_id BIGINT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Créer admin
INSERT INTO public.app_user (email, password_hash, role, is_active)
VALUES (
  'admin@yourstory.ch',
  '$2a$10$5vJqMhmYLZCxJzPe5wDmzOjKwDVoGUaXMsJXtmLbJqGqPckZ3Y3Aq',
  'admin',
  true
);

-- 4. Vérifier
SELECT 'Admin créé:' as message, email, role 
FROM public.app_user 
WHERE email = 'admin@yourstory.ch';
```

---

## ✅ Checklist Finale

- [ ] `.env.local` configuré avec JWT_SECRET
- [ ] Tables créées (app_user, user_session, activity_log)
- [ ] Admin créé (admin@yourstory.ch / admin123)
- [ ] Application redémarrée
- [ ] Page login affiche "Email" comme label
- [ ] Login fonctionne et redirige vers /dashboard

---

## 🆘 Toujours des Problèmes ?

### Erreur: "Cannot read properties of undefined"
➡️ Supabase n'est pas configuré. Vérifiez `.env.local`

### Erreur: "relation app_user does not exist"
➡️ Les tables n'ont pas été créées. Exécutez les migrations.

### Erreur: "JWT_SECRET must be defined"
➡️ Ajoutez JWT_SECRET dans `.env.local` et redémarrez

### Erreur: "Identifiants incorrects"
➡️ L'utilisateur n'existe pas. Exécutez `create_admin_simple.sql`

---

## 📞 Support

Si le problème persiste :

1. **Vérifiez les logs serveur** : Terminal où `npm run dev` tourne
2. **Vérifiez les logs navigateur** : Console (F12) > Network > login
3. **Testez la connexion Supabase** :
   ```javascript
   // Dans la console du navigateur
   fetch('/api/login', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       username: 'admin@yourstory.ch',
       password: 'admin123'
     })
   }).then(r => r.json()).then(console.log)
   ```

---

**Le login devrait maintenant fonctionner !** 🎉✅

**Credentials de test** :
- Email: `admin@yourstory.ch`
- Mot de passe: `admin123`
