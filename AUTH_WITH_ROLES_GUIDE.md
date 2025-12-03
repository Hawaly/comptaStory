# 🎭 Système d'Authentification avec Table Role

## 🎯 Architecture

### Structure de Base de Données

```
┌─────────────┐
│    role     │
├─────────────┤
│ id          │──┐
│ code        │  │
│ name        │  │
│ description │  │
│ redirect_   │  │
│   path      │  │
└─────────────┘  │
                 │
                 │ FK
                 │
┌─────────────┐  │      ┌─────────────┐
│  app_user   │──┘      │   client    │
├─────────────┤         ├─────────────┤
│ id          │         │ id          │──┐
│ email       │         │ name        │  │
│ password_   │         │ email       │  │
│   hash      │         │ company_    │  │
│ role_id     │         │   name      │  │
│ client_id   │─────────│             │  │
│ is_active   │         └─────────────┘  │
│ last_login  │                          │ FK
│ created_at  │                          │
└─────────────┘                          │
       │                                 │
       └─────────────────────────────────┘
```

---

## 📊 Table Role

### Structure

```sql
CREATE TABLE public.role (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  redirect_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Données Initiales

| ID | Code   | Name          | Redirect Path   |
|----|--------|---------------|-----------------|
| 1  | admin  | Administrateur| /dashboard      |
| 2  | client | Client        | /client-portal  |
| 3  | staff  | Employé       | /dashboard      |

---

## 👤 Table App_User

### Structure

```sql
CREATE TABLE public.app_user (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES role(id),
  client_id BIGINT REFERENCES client(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Règles de Liaison

- **Admin** : `role_id = 1`, `client_id = NULL`
- **Client** : `role_id = 2`, `client_id = [ID du client]`
- **Staff** : `role_id = 3`, `client_id = NULL`

---

## 🔍 Vue user_with_details

Vue enrichie qui combine user, role et client :

```sql
CREATE VIEW user_with_details AS
SELECT 
  u.id as user_id,
  u.email,
  u.is_active,
  u.last_login,
  r.id as role_id,
  r.code as role_code,
  r.name as role_name,
  r.redirect_path,
  u.client_id,
  c.name as client_name,
  c.company_name
FROM app_user u
INNER JOIN role r ON u.role_id = r.id
LEFT JOIN client c ON u.client_id = c.id;
```

---

## 🔄 Flux de Login avec Redirection Automatique

### 1. Requête Login

```typescript
POST /api/login
{
  "username": "admin@yourstory.ch",
  "password": "admin123"
}
```

### 2. Backend - Récupération User + Role

```typescript
// Récupère user avec son rôle via la vue
const { data } = await supabase
  .from('user_with_details')
  .select('user_id, email, role_code, role_name, redirect_path, ...')
  .eq('email', email)
  .eq('is_active', true)
  .single();
```

### 3. Backend - Vérification Password

```typescript
// Récupère le hash séparément (sécurité)
const { data: authData } = await supabase
  .from('app_user')
  .select('password_hash')
  .eq('id', user.user_id)
  .single();

const isValid = await bcrypt.compare(password, authData.password_hash);
```

### 4. Backend - Réponse avec Redirect

```typescript
return {
  success: true,
  user: {
    id: user.user_id,
    email: user.email,
    role_code: user.role_code,
    role_name: user.role_name,
    client_id: user.client_id
  },
  redirect_path: user.redirect_path  // "/dashboard" ou "/client-portal"
}
```

### 5. Frontend - Redirection Automatique

```typescript
const data = await response.json();
const redirectPath = data.redirect_path || "/dashboard";
router.push(redirectPath);  // Redirige selon le rôle !
```

---

## 🚀 Installation

### Étape 1: Exécuter le Script Principal

**Dans Supabase SQL Editor**, copier/coller :

```sql
-- migrations/create_auth_with_roles.sql
```

✅ **Crée** :
- Table `role` avec 3 rôles
- Table `app_user` avec FK vers `role`
- Vue `user_with_details`
- Admin : `admin@yourstory.ch` / `admin123`

### Étape 2: Créer Utilisateur Client

**Dans Supabase SQL Editor**, copier/coller :

```sql
-- migrations/create_client_user_with_role.sql
```

✅ **Crée** :
- Client user : `client1@example.com` / `client123`
- Lié au client ID 1
- Rôle `client`

### Étape 3: Configurer .env.local

```env
JWT_SECRET=your_secret_key_minimum_32_chars
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Étape 4: Redémarrer

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

---

## ✅ Tests

### Test 1: Login Admin → Dashboard

1. **URL** : http://localhost:3000/login
2. **Email** : `admin@yourstory.ch`
3. **Password** : `admin123`
4. **✅ Redirection** : `/dashboard`

### Test 2: Login Client → Client Portal

1. **URL** : http://localhost:3000/login
2. **Email** : `client1@example.com`
3. **Password** : `client123`
4. **✅ Redirection** : `/client-portal`

---

## 🎨 Personnaliser les Redirections

### Modifier le Path pour un Rôle

```sql
UPDATE public.role 
SET redirect_path = '/custom-dashboard'
WHERE code = 'client';
```

### Ajouter un Nouveau Rôle

```sql
INSERT INTO public.role (code, name, description, redirect_path)
VALUES (
  'manager',
  'Manager',
  'Gestion intermédiaire',
  '/manager-dashboard'
);
```

Puis créer un user avec ce rôle :

```sql
INSERT INTO public.app_user (email, password_hash, role_id, client_id, is_active)
VALUES (
  'manager@example.com',
  '$2a$10$HASH_HERE',
  (SELECT id FROM public.role WHERE code = 'manager'),
  NULL,
  true
);
```

---

## 🔐 Avantages de cette Architecture

### ✅ Flexibilité

- **Facile d'ajouter** de nouveaux rôles
- **Modifier les redirections** sans toucher au code
- **Permissions personnalisables** par rôle

### ✅ Maintenabilité

- **Centralisé** : Tous les rôles dans une table
- **Normalisé** : Pas de duplication de code/nom de rôle
- **Évolutif** : Ajouter colonnes (permissions, priorité, etc.)

### ✅ Sécurité

- **FK constraints** : Intégrité des données garantie
- **Cascade rules** : Impossible de supprimer un rôle utilisé
- **Séparation** : password_hash jamais dans la vue

### ✅ UX Optimale

- **Redirection automatique** selon le rôle
- **Pas de code côté front** pour gérer les rôles
- **Facile à tester** : Un user, un rôle, une redirection

---

## 📋 Requêtes Utiles

### Voir tous les users avec leur rôle

```sql
SELECT 
  u.id,
  u.email,
  r.code as role,
  r.redirect_path,
  u.client_id,
  c.name as client_name
FROM app_user u
INNER JOIN role r ON u.role_id = r.id
LEFT JOIN client c ON u.client_id = c.id
ORDER BY r.code, u.id;
```

### Compter users par rôle

```sql
SELECT 
  r.code as role,
  r.name,
  COUNT(u.id) as user_count
FROM role r
LEFT JOIN app_user u ON u.role_id = r.id
GROUP BY r.id, r.code, r.name
ORDER BY r.code;
```

### Users actifs des 7 derniers jours

```sql
SELECT 
  u.email,
  r.code as role,
  u.last_login
FROM app_user u
INNER JOIN role r ON u.role_id = r.id
WHERE u.last_login > NOW() - INTERVAL '7 days'
ORDER BY u.last_login DESC;
```

---

## 🔄 Migration depuis l'Ancien Système

Si vous aviez `role VARCHAR(50)` dans `app_user` :

```sql
-- 1. Créer la table role
-- Exécuter: create_auth_with_roles.sql

-- 2. Migrer les données
UPDATE app_user 
SET role_id = (
  SELECT id FROM role WHERE code = app_user.role
);

-- 3. Supprimer l'ancienne colonne
ALTER TABLE app_user DROP COLUMN role;
```

---

## 🎯 Prochaines Étapes Suggérées

1. **Permissions granulaires** : Ajouter table `permission` liée à `role`
2. **Audit log** : Logger les changements de rôle
3. **Role hierarchy** : Ajouter colonne `parent_role_id`
4. **Multi-roles** : Table de liaison `user_role` (many-to-many)
5. **Dashboard dynamique** : Charger composants selon `role_code`

---

## ✅ Checklist Complète

- [ ] Table `role` créée avec 3 rôles
- [ ] Table `app_user` avec `role_id` (FK)
- [ ] Vue `user_with_details` créée
- [ ] Admin créé et testé
- [ ] Client user créé et testé
- [ ] API login retourne `redirect_path`
- [ ] Page login redirige automatiquement
- [ ] Admin → `/dashboard` ✅
- [ ] Client → `/client-portal` ✅

---

**Votre système d'authentification avec table role est opérationnel !** 🎉

**Fichiers modifiés** :
- ✅ `migrations/create_auth_with_roles.sql`
- ✅ `migrations/create_client_user_with_role.sql`
- ✅ `app/api/login/route.ts`
- ✅ `app/(auth)/login/page.tsx`
