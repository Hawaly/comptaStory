# 🚀 Quick Start - Système d'Authentification Client

## ✅ Installation en 5 Minutes

---

## 📋 Prérequis

- PostgreSQL / Supabase
- Node.js + npm
- Application Next.js existante

---

## 🔧 Étape 1 : Installer Dépendances

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

---

## 🗄️ Étape 2 : Exécuter Migration SQL

### Option A : Supabase SQL Editor

1. Ouvrir Supabase Dashboard
2. Aller dans **SQL Editor**
3. Copier le contenu de `migrations/create_auth_system.sql`
4. Cliquer **Run**

### Option B : psql

```bash
psql -h localhost -U postgres -d yourstory_db -f migrations/create_auth_system.sql
```

**Vérification** :
```sql
-- Vérifier que les tables sont créées
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%user%';

-- Résultat attendu:
-- app_user
-- user_session
-- activity_log
```

---

## ⚛️ Étape 3 : Intégrer AuthProvider

**`app/layout.tsx`** :

```typescript
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## 👤 Étape 4 : Créer Utilisateur Admin

### Option A : Via Script Node.js

Créer `scripts/create-admin.ts` :

```typescript
import { register } from '@/lib/authApi';

async function createAdmin() {
  const response = await register({
    email: 'admin@yourstory.ch',
    password: 'ChangeMeNow123!',
    role: 'admin'
  });

  if (response.success) {
    console.log('✅ Admin créé avec succès!');
    console.log('Email:', response.user?.email);
    console.log('⚠️  Changez le mot de passe après la première connexion!');
  } else {
    console.error('❌ Erreur:', response.error);
  }
}

createAdmin();
```

Exécuter :
```bash
npx ts-node scripts/create-admin.ts
```

### Option B : Via SQL Direct

```sql
-- Générer un hash bcrypt de votre mot de passe
-- Utilisez: https://bcrypt-generator.com/
-- Rounds: 10

INSERT INTO app_user (email, password_hash, role, is_active)
VALUES (
  'admin@yourstory.ch',
  '$2a$10$VotreHashBcryptIci',
  'admin',
  true
);
```

---

## 🎨 Étape 5 : Tester Connexion

### 1. Démarrer l'Application

```bash
npm run dev
```

### 2. Accéder à la Page Login

```
http://localhost:3000/login
```

OU

Utiliser le composant `LoginForm` :

**`app/login/page.tsx`** :

```typescript
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return <LoginForm />;
}
```

### 3. Se Connecter

- **Email** : `admin@yourstory.ch`
- **Password** : Celui que vous avez créé

### 4. Vérifier Redirection

- **Admin** → Redirect vers `/dashboard`
- **Client** → Redirect vers `/client-portal`

---

## 👥 Étape 6 : Créer Utilisateur Client

### Via Interface Admin (À Créer)

```typescript
// Page admin/users/new

import { register } from '@/lib/authApi';

const handleCreateClientUser = async () => {
  const response = await register({
    email: 'client@example.com',
    password: 'MotDePasseClient123',
    role: 'client',
    client_id: 5 // ID du client dans la table client
  });

  if (response.success) {
    alert('Utilisateur client créé!');
  }
};
```

### Via SQL Direct

```sql
-- 1. Créer un hash bcrypt du mot de passe
-- 2. Insérer l'utilisateur

INSERT INTO app_user (email, password_hash, role, client_id, is_active)
VALUES (
  'client@example.com',
  '$2a$10$HashBcryptDuMotDePasse',
  'client',
  5,  -- ID du client
  true
);
```

---

## 🔒 Étape 7 : Protéger vos Routes

### Protéger Page Client

**`app/client-portal/page.tsx`** (Déjà créé) :

```typescript
"use client";

import { useRequireClient } from '@/contexts/AuthContext';

export default function ClientPortalPage() {
  const { user, isLoading } = useRequireClient();

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      <h1>Bienvenue {user?.client_name}</h1>
    </div>
  );
}
```

### Protéger Page Admin

```typescript
"use client";

import { useRequireAdmin } from '@/contexts/AuthContext';

export default function AdminPage() {
  const { user, isLoading } = useRequireAdmin();

  if (isLoading) return <div>Chargement...</div>;

  return <div>Admin Dashboard</div>;
}
```

---

## 🧪 Tests

### Test 1 : Login Admin

1. Aller sur `/login`
2. Email: `admin@yourstory.ch`
3. Password: Votre mot de passe
4. **Vérifier** : Redirect vers `/dashboard`

### Test 2 : Login Client

1. Créer un utilisateur client (étape 6)
2. Se déconnecter de l'admin
3. Se connecter avec le compte client
4. **Vérifier** : Redirect vers `/client-portal`

### Test 3 : Dashboard Client

1. Connecté en tant que client
2. Aller sur `/client-portal`
3. **Vérifier** :
   - ✅ Voir uniquement ses propres factures
   - ✅ Voir uniquement ses propres stratégies
   - ✅ Voir uniquement ses propres mandats
   - ❌ Ne pas pouvoir accéder aux autres clients

### Test 4 : RLS (Row Level Security)

1. Connecté en tant que client ID=5
2. Ouvrir la console du navigateur
3. Exécuter :

```javascript
// Essayer d'accéder aux factures d'un autre client
const { data } = await supabase
  .from('invoice')
  .select('*')
  .eq('client_id', 10); // Autre client

console.log(data); // Devrait être vide ou erreur
```

**Attendu** : Aucune donnée retournée (RLS bloque l'accès)

### Test 5 : Protection Routes

1. Se déconnecter
2. Essayer d'accéder à `/client-portal`
3. **Vérifier** : Redirect automatique vers `/login`

---

## 📊 Vérifications SQL

### Vérifier Tables Créées

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('app_user', 'user_session', 'activity_log');
```

### Vérifier Utilisateurs

```sql
SELECT id, email, role, is_active, client_id, created_at
FROM app_user;
```

### Vérifier RLS Activé

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('social_media_strategy', 'invoice', 'mandat');
```

### Vérifier Politiques RLS

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('social_media_strategy', 'invoice', 'mandat');
```

---

## 🔧 Configuration Avancée

### Variables d'Environnement (Optionnel)

Créer `.env.local` :

```env
# Session
NEXT_PUBLIC_SESSION_EXPIRY_DAYS=7

# Bcrypt
BCRYPT_ROUNDS=10

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Nettoyer Sessions Expirées (Cron)

Créer `scripts/cleanup-sessions.ts` :

```typescript
import { cleanupExpiredSessions } from '@/lib/authApi';

async function cleanup() {
  const deleted = await cleanupExpiredSessions();
  console.log(`${deleted} sessions expirées supprimées`);
}

cleanup();
```

Ajouter à `package.json` :

```json
{
  "scripts": {
    "cleanup:sessions": "ts-node scripts/cleanup-sessions.ts"
  }
}
```

Exécuter manuellement ou via cron :

```bash
npm run cleanup:sessions
```

---

## 📱 Routes Disponibles

### Public
- `/login` - Page de connexion
- `/register` - Inscription (à créer)

### Client
- `/client-portal` - Dashboard client

### Admin
- `/dashboard` - Dashboard admin
- `/clients` - Liste clients
- `/clients/[id]` - Détail client

---

## ⚠️ Sécurité

### Checklist

- [x] Mots de passe hashés avec bcrypt
- [x] Sessions avec expiration (7 jours)
- [x] RLS activé sur tables sensibles
- [x] Tokens sécurisés (UUID)
- [x] Logs d'activité
- [ ] Rate limiting (à ajouter)
- [ ] 2FA (optionnel)
- [ ] Email verification (optionnel)

### Bonnes Pratiques

✅ **Faire** :
- Changer le mot de passe admin par défaut
- Utiliser HTTPS en production
- Définir expiration sessions appropriée
- Logger toutes les actions sensibles
- Valider côté client ET serveur

❌ **Ne Pas Faire** :
- Stocker mots de passe en clair
- Partager tokens de session
- Désactiver RLS
- Logger mots de passe

---

## 🎉 C'est Prêt !

Votre système d'authentification est maintenant fonctionnel :

✅ **Admins** peuvent se connecter et gérer l'application  
✅ **Clients** peuvent se connecter et voir leurs données  
✅ **Sécurité** : RLS, bcrypt, sessions  
✅ **Logs** : Toutes les actions trackées  

---

## 📚 Documentation Complète

- **`AUTH_SYSTEM_GUIDE.md`** - Guide complet du système
- **`migrations/create_auth_system.sql`** - Migration SQL
- **`lib/authApi.ts`** - API d'authentification
- **`contexts/AuthContext.tsx`** - Context React

---

## 🆘 Troubleshooting

### Erreur : "Cannot find module 'bcryptjs'"

```bash
npm install bcryptjs @types/bcryptjs
```

### Erreur : "Session invalid"

1. Vérifier que la table `user_session` existe
2. Vérifier que le token est stocké dans localStorage
3. Nettoyer localStorage et reconnecter

```javascript
localStorage.clear();
```

### Erreur : "Permission denied"

1. Vérifier que RLS est bien configuré
2. Vérifier que `current_setting('app.user_id')` est défini
3. Tester sans RLS temporairement :

```sql
ALTER TABLE social_media_strategy DISABLE ROW LEVEL SECURITY;
```

### Client ne voit aucune donnée

1. Vérifier que `client_id` est bien renseigné dans `app_user`
2. Vérifier que les données existent pour ce client
3. Vérifier les politiques RLS

```sql
SELECT * FROM app_user WHERE id = 1;
SELECT * FROM invoice WHERE client_id = (SELECT client_id FROM app_user WHERE id = 1);
```

---

**Système prêt à l'emploi !** 🚀🔐
