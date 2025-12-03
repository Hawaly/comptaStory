# 🔐 Système d'Authentification Client - Guide Complet

## ✅ Système Créé !

Un système d'authentification complet avec gestion des utilisateurs clients et dashboard dédié !

---

## 🎯 Architecture Créée

### 1. 📊 Base de Données (SQL)
**`migrations/create_auth_system.sql`** (300+ lignes)

**Tables** :
- ✅ `app_user` - Utilisateurs avec rôles (admin, client, staff)
- ✅ `user_session` - Sessions actives avec tokens
- ✅ `activity_log` - Journal d'activité

**Vues** :
- ✅ `user_with_client` - Utilisateurs enrichis avec infos client
- ✅ `user_statistics` - Statistiques d'utilisation

**Fonctions** :
- ✅ `cleanup_expired_sessions()` - Nettoyage sessions
- ✅ `log_activity()` - Logger une action
- ✅ `check_user_permission()` - Vérifier permissions

**RLS (Row Level Security)** :
- ✅ Politiques pour les clients (accès limité à leurs données)
- ✅ Politiques pour les admins (accès complet)

### 2. 🔧 API TypeScript
**`lib/authApi.ts`** (600+ lignes)

**Fonctions d'authentification** :
- `login()` - Connexion utilisateur
- `logout()` - Déconnexion
- `register()` - Inscription
- `verifySession()` - Vérifier session active
- `hashPassword()` - Hasher mot de passe (bcrypt)
- `verifyPassword()` - Vérifier mot de passe

**Gestion utilisateurs** :
- `getUserById()` - Récupérer un utilisateur
- `getAllUsers()` - Liste des utilisateurs
- `updateUser()` - Modifier un utilisateur
- `activateUser()` / `deactivateUser()` - Activer/désactiver
- `changePassword()` - Changer mot de passe

**Permissions** :
- `checkPermission()` - Vérifier rôle
- `isAdmin()` - Vérifier si admin
- `canAccessClient()` - Vérifier accès client

**Activité** :
- `logActivity()` - Logger action
- `getUserActivity()` - Historique actions

### 3. ⚛️ Contexte React
**`contexts/AuthContext.tsx`**

**Provider** : `<AuthProvider>`
**Hook** : `useAuth()`

**Fonctions** :
- `login()` - Connexion
- `logout()` - Déconnexion
- `register()` - Inscription
- `refreshUser()` - Rafraîchir données
- `isAuthenticated` - État authentification
- `user` - Utilisateur actuel

**Hooks de protection** :
- `useRequireAuth()` - Protéger page (tous rôles)
- `useRequireAdmin()` - Protéger page admin
- `useRequireClient()` - Protéger page client

### 4. 🎨 Composants UI
**`components/auth/LoginForm.tsx`**
- Formulaire de connexion élégant
- Validation
- Gestion erreurs
- Toggle mot de passe
- Lien inscription

### 5. 📄 Pages

**`app/client-portal/page.tsx`**
- Page portail client
- Protection avec `useRequireClient()`
- Affiche dashboard client

**`components/client-portal/ClientPortalDashboard.tsx`** (400+ lignes)
- Dashboard complet pour clients
- Vue limitée aux données du client
- 4 cartes statistiques
- Factures récentes
- Stratégies
- Mandats
- Contact support

---

## 🏗️ Schéma de Tables

### app_user
```sql
id              SERIAL PRIMARY KEY
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
role            VARCHAR(50) CHECK (admin, client, staff)
client_id       INTEGER → client(id)
is_active       BOOLEAN DEFAULT true
last_login      TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### user_session
```sql
id            UUID PRIMARY KEY
user_id       INTEGER → app_user(id)
token         VARCHAR(500) UNIQUE
expires_at    TIMESTAMP
ip_address    VARCHAR(45)
user_agent    TEXT
created_at    TIMESTAMP
```

### activity_log
```sql
id           SERIAL PRIMARY KEY
user_id      INTEGER → app_user(id)
action       VARCHAR(100)
entity_type  VARCHAR(50)
entity_id    INTEGER
details      JSONB
ip_address   VARCHAR(45)
created_at   TIMESTAMP
```

---

## 🔐 Flow d'Authentification

### 1. Inscription Client

```typescript
// 1. Client s'inscrit
const response = await register({
  email: 'client@example.com',
  password: 'motdepasse123',
  role: 'client',
  client_id: 5 // Lien vers la table client
});

// 2. Mot de passe hashé avec bcrypt
// 3. Utilisateur créé dans app_user
// 4. Session créée automatiquement
// 5. Redirect vers /client-portal
```

### 2. Connexion

```typescript
// 1. Client se connecte
const response = await login({
  email: 'client@example.com',
  password: 'motdepasse123'
});

// 2. Vérification email + mot de passe
// 3. Vérification compte actif
// 4. Mise à jour last_login
// 5. Création session (token + expiry 7 jours)
// 6. Stockage token dans localStorage
// 7. Redirect selon rôle:
//    - admin → /dashboard
//    - client → /client-portal
```

### 3. Vérification Session

```typescript
// À chaque chargement de page
const token = localStorage.getItem('session_token');
const response = await verifySession(token);

// 1. Vérifier token existe
// 2. Vérifier non expiré
// 3. Récupérer utilisateur
// 4. Vérifier compte actif
// 5. Retourner user + session
```

### 4. Déconnexion

```typescript
const token = localStorage.getItem('session_token');
await logout(token);

// 1. Supprimer session de la DB
// 2. Logger activité
// 3. Supprimer de localStorage
// 4. Redirect vers /login
```

---

## 🎨 Dashboard Client vs Dashboard Admin

### Dashboard Client (`/client-portal`)
**Accès** : Utilisateurs avec role='client'

**Fonctionnalités** :
- ✅ Vue **limitée** à leurs propres données
- ✅ Voir **leurs factures**
- ✅ Voir **leurs stratégies**
- ✅ Voir **leurs mandats**
- ✅ Statistiques personnelles
- ✅ Contact support
- ❌ Pas d'édition
- ❌ Pas de création
- ❌ Pas d'accès autres clients

### Dashboard Admin (`/dashboard` ou `/clients/[id]`)
**Accès** : Utilisateurs avec role='admin'

**Fonctionnalités** :
- ✅ Vue **complète** de tous les clients
- ✅ Créer/Éditer/Supprimer
- ✅ Gérer utilisateurs
- ✅ Accès toutes les données
- ✅ Statistiques globales

---

## 🔒 Row Level Security (RLS)

### Politiques Créées

```sql
-- Clients voient uniquement leurs données
CREATE POLICY client_view_own_strategies ON social_media_strategy
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM app_user 
      WHERE id = current_setting('app.user_id')::INTEGER
    )
  );

-- Admins voient tout
CREATE POLICY admin_view_all_strategies ON social_media_strategy
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_user 
      WHERE id = current_setting('app.user_id')::INTEGER 
      AND role = 'admin'
    )
  );
```

### Tables Protégées
- `social_media_strategy`
- `mandat`
- `invoice`
- `expense`

---

## 🚀 Installation & Configuration

### 1. Installer Dépendances

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### 2. Exécuter Migration SQL

```sql
-- Dans Supabase SQL Editor ou psql
\i migrations/create_auth_system.sql
```

### 3. Créer Utilisateur Admin

```typescript
import { register } from '@/lib/authApi';

await register({
  email: 'admin@yourstory.ch',
  password: 'VotreMotDePasseSecurisé',
  role: 'admin'
});
```

### 4. Créer Utilisateur Client

```typescript
// Depuis l'interface admin ou via API
await register({
  email: 'client@example.com',
  password: 'motdepasse123',
  role: 'client',
  client_id: 5 // ID du client dans la table client
});
```

### 5. Intégrer AuthProvider

**`app/layout.tsx`** :
```typescript
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

---

## 📝 Utilisation

### Protéger une Page (Client)

```typescript
"use client";

import { useRequireClient } from '@/contexts/AuthContext';

export default function ClientPage() {
  const { user, isLoading } = useRequireClient();

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      <h1>Bienvenue {user?.client_name}</h1>
    </div>
  );
}
```

### Protéger une Page (Admin)

```typescript
"use client";

import { useRequireAdmin } from '@/contexts/AuthContext';

export default function AdminPage() {
  const { user, isLoading } = useRequireAdmin();

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
    </div>
  );
}
```

### Utiliser useAuth

```typescript
"use client";

import { useAuth } from '@/contexts/AuthContext';

export function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div>
      <p>Connecté en tant que {user.email}</p>
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}
```

---

## 🧪 Tests Suggérés

### 1. Inscription Client
- [ ] Créer compte client
- [ ] Vérifier hash mot de passe
- [ ] Vérifier lien client_id
- [ ] Vérifier session créée
- [ ] Vérifier redirect /client-portal

### 2. Connexion
- [ ] Login avec email/password valide
- [ ] Login avec email invalide → erreur
- [ ] Login avec password incorrect → erreur
- [ ] Login avec compte désactivé → erreur
- [ ] Vérifier last_login mis à jour
- [ ] Vérifier session créée

### 3. Dashboard Client
- [ ] Voir uniquement ses propres factures
- [ ] Voir uniquement ses propres stratégies
- [ ] Voir uniquement ses propres mandats
- [ ] Ne pas voir données autres clients
- [ ] Stats calculées correctement

### 4. Dashboard Admin
- [ ] Voir tous les clients
- [ ] Accès complet aux données
- [ ] Créer/Éditer/Supprimer

### 5. Permissions
- [ ] Client ne peut pas accéder /dashboard
- [ ] Admin peut accéder /client-portal (view as)
- [ ] RLS bloque accès cross-client
- [ ] Sessions expirées sont nettoyées

---

## 📋 Routes Créées

### Public
```
/login → Page de connexion
/register → Page d'inscription (optionnelle)
/forgot-password → Réinitialisation (à créer)
```

### Client
```
/client-portal → Dashboard client principal
/client-portal/invoices → Factures détaillées (à créer)
/client-portal/strategies → Stratégies détaillées (à créer)
/client-portal/profile → Profil utilisateur (à créer)
```

### Admin
```
/dashboard → Dashboard admin (existant)
/clients/[id] → Vue client détaillée (existant)
/users → Gestion utilisateurs (à créer)
```

---

## 🔧 Configuration Additionnelle

### Variables d'Environnement

```env
# Session
SESSION_EXPIRY_DAYS=7
SESSION_SECRET=your-secret-key

# Bcrypt
BCRYPT_ROUNDS=10

# Email (pour reset password)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@yourstory.ch
SMTP_PASS=password
```

### Sécurité

**Bonnes Pratiques** :
- ✅ Mots de passe hashés avec bcrypt (10 rounds)
- ✅ Sessions avec expiration (7 jours)
- ✅ Tokens UUID sécurisés
- ✅ RLS activé sur tables sensibles
- ✅ Validation email/password côté client et serveur
- ✅ Logs d'activité pour audit

**À Ajouter (Optionnel)** :
- ⏳ Rate limiting sur login
- ⏳ 2FA (Two-Factor Authentication)
- ⏳ Reset password par email
- ⏳ Email verification
- ⏳ Remember me (sessions longues)

---

## 📊 Logs d'Activité

### Actions Trackées

```typescript
// Connexion
await logActivity(userId, 'login');

// Déconnexion
await logActivity(userId, 'logout');

// Inscription
await logActivity(userId, 'register');

// Changement password
await logActivity(userId, 'change_password');

// Actions entités
await logActivity(userId, 'view', 'strategy', strategyId);
await logActivity(userId, 'create', 'invoice', invoiceId);
await logActivity(userId, 'update', 'mandat', mandatId);
await logActivity(userId, 'delete', 'client', clientId);
```

### Consulter Logs

```typescript
// Récupérer activité utilisateur
const logs = await getUserActivity(userId, 50);

logs.forEach(log => {
  console.log(`${log.created_at}: ${log.action} on ${log.entity_type}`);
});
```

---

## 🎉 Résultat Final

### Ce Qui a Été Créé
- ✅ **Table app_user** avec rôles (admin, client, staff)
- ✅ **Système de sessions** sécurisé
- ✅ **API d'authentification** complète (TypeScript)
- ✅ **AuthContext React** pour gestion état
- ✅ **Hooks de protection** de routes
- ✅ **Dashboard client** dédié et élégant
- ✅ **RLS** pour sécurité données
- ✅ **Logs d'activité** pour audit
- ✅ **Formulaire login** moderne

### Prochaines Étapes Suggérées
1. **Créer interface gestion utilisateurs** (admin)
2. **Ajouter reset password** par email
3. **Créer pages détaillées** client-portal
4. **Ajouter 2FA** (optionnel)
5. **Implémenter rate limiting**
6. **Email verification** à l'inscription

---

**Système d'authentification complet et sécurisé prêt à l'emploi !** 🔐✨

---

**Date** : 3 décembre 2024  
**Tables** : 3 (app_user, user_session, activity_log)  
**API** : 20+ fonctions  
**Composants** : 2 (LoginForm, ClientPortalDashboard)  
**Sécurité** : bcrypt + RLS + sessions  

🔐 **Les clients peuvent maintenant se connecter et accéder à leur espace personnel !** 🔐
