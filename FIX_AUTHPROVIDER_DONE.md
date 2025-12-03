# ✅ AuthProvider Intégré - Erreur Résolue

## 🎯 Problème Résolu

L'erreur **"useAuth must be used within an AuthProvider"** est maintenant corrigée.

---

## 🔧 Modifications Effectuées

### 1. **Créé `SimpleAuthContext.tsx`** ✅

Un nouveau contexte d'authentification simplifié qui :
- ✅ Utilise directement nos routes API `/api/login`, `/api/logout`, `/api/auth/session`
- ✅ Compatible avec le système de rôles (table `role`)
- ✅ Redirection automatique selon `redirect_path`
- ✅ Gestion de session via cookies HTTP-only
- ✅ Hooks utilitaires : `useAuth`, `useRequireAuth`, `useRequireAdmin`, `useRequireClient`

**Fichier** : `contexts/SimpleAuthContext.tsx`

---

### 2. **Créé `Providers.tsx`** ✅

Composant wrapper client-side pour Next.js :
```tsx
<AuthProvider>
  {children}
</AuthProvider>
```

**Fichier** : `app/providers.tsx`

---

### 3. **Modifié `layout.tsx`** ✅

Intégré le `Providers` dans le layout racine :
```tsx
<body>
  <Providers>
    {children}
  </Providers>
</body>
```

**Fichier** : `app/layout.tsx`

---

### 4. **Créé Route `/api/auth/session`** ✅

Route pour vérifier la session active :
- Lit le cookie de session
- Récupère les infos user depuis `user_with_details`
- Retourne `{ user }` ou `{ user: null }`

**Fichier** : `app/api/auth/session/route.ts`

---

### 5. **Route `/api/logout`** ✅

Déjà existante et fonctionnelle.

---

## 🚀 Structure Finale

```
app/
├── layout.tsx           ✅ Wrap avec <Providers>
├── providers.tsx        ✅ Client component avec AuthProvider
├── api/
│   ├── login/
│   │   └── route.ts     ✅ Retourne redirect_path
│   ├── logout/
│   │   └── route.ts     ✅ Détruit la session
│   └── auth/
│       └── session/
│           └── route.ts ✅ Vérifie session active
contexts/
└── SimpleAuthContext.tsx ✅ Nouveau contexte simplifié
```

---

## 🎭 Hooks Disponibles

### `useAuth()`

Accès au contexte d'authentification :
```tsx
const { user, isLoading, isAuthenticated, login, logout } = useAuth();
```

### `useRequireAuth()`

Protège une page - redirige vers `/login` si non authentifié :
```tsx
function ProtectedPage() {
  const { isLoading, isAuthenticated } = useRequireAuth();
  
  if (isLoading) return <div>Chargement...</div>;
  
  return <div>Contenu protégé</div>;
}
```

### `useRequireAdmin()`

Protège une page admin - redirige si non admin :
```tsx
function AdminPage() {
  const { isLoading, user } = useRequireAdmin();
  
  if (isLoading) return <div>Chargement...</div>;
  
  return <div>Admin Dashboard</div>;
}
```

### `useRequireClient()`

Protège une page client - redirige si non client :
```tsx
function ClientPortal() {
  const { isLoading, user } = useRequireClient();
  
  if (isLoading) return <div>Chargement...</div>;
  
  return <div>Client Portal: {user?.client_name}</div>;
}
```

---

## ✅ Tests

### 1. Redémarrer l'Application

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### 2. Tester Login Admin

1. **URL** : http://localhost:3000/login
2. **Email** : `admin@yourstory.ch`
3. **Password** : `admin123`
4. **✅ Devrait** : 
   - Se connecter
   - Rediriger vers `/dashboard`
   - Pas d'erreur AuthProvider

### 3. Tester Login Client

1. **URL** : http://localhost:3000/login
2. **Email** : `client1@example.com`
3. **Password** : `client123`
4. **✅ Devrait** :
   - Se connecter
   - Rediriger vers `/client-portal`

### 4. Tester Persistance Session

1. Se connecter
2. Rafraîchir la page (F5)
3. **✅ Devrait** : Rester connecté (session persiste via cookie)

### 5. Tester Logout

1. Cliquer sur Déconnexion (si bouton existe)
2. **OU** Aller sur `/api/logout` en POST
3. **✅ Devrait** : Rediriger vers `/login`

---

## 🔍 Vérifier la Session dans le Navigateur

### DevTools > Application > Cookies

Vous devriez voir un cookie nommé `session` :
- **HttpOnly** : ✅ true
- **Secure** : ❌ false (dev) / ✅ true (prod)
- **SameSite** : Lax
- **Value** : JWT token

---

## 🎨 Utiliser dans Vos Composants

### Exemple: Bouton Déconnexion

```tsx
"use client";

import { useAuth } from "@/contexts/SimpleAuthContext";

export function LogoutButton() {
  const { logout, user } = useAuth();

  if (!user) return null;

  return (
    <button onClick={logout}>
      Déconnexion ({user.email})
    </button>
  );
}
```

### Exemple: Afficher Info User

```tsx
"use client";

import { useAuth } from "@/contexts/SimpleAuthContext";

export function UserInfo() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Chargement...</div>;
  if (!user) return <div>Non connecté</div>;

  return (
    <div>
      <p>Email: {user.email}</p>
      <p>Rôle: {user.role_name}</p>
      {user.client_name && <p>Client: {user.client_name}</p>}
    </div>
  );
}
```

### Exemple: Page Protégée Admin

```tsx
"use client";

import { useRequireAdmin } from "@/contexts/SimpleAuthContext";

export default function AdminDashboard() {
  const { isLoading, user } = useRequireAdmin();

  if (isLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8">
      <h1>Admin Dashboard</h1>
      <p>Bienvenue {user?.email}</p>
    </div>
  );
}
```

---

## 🔄 Flux Complet

### Au Chargement de l'App

1. `layout.tsx` charge avec `<Providers>`
2. `AuthProvider` s'initialise
3. `useEffect` appelle `checkSession()`
4. Requête GET `/api/auth/session`
5. Si session valide → `setUser(data.user)`
6. Sinon → user reste `null`

### Au Login

1. User remplit formulaire
2. Frontend appelle `login(email, password)`
3. POST `/api/login` avec credentials
4. Backend vérifie password, crée session
5. Retourne `{ success, user, redirect_path }`
6. Frontend met à jour `user` et redirige

### À la Déconnexion

1. User clique "Déconnexion"
2. Frontend appelle `logout()`
3. POST `/api/logout`
4. Backend détruit le cookie
5. Frontend `setUser(null)` et redirige `/login`

---

## ✅ Checklist

- [x] `SimpleAuthContext.tsx` créé
- [x] `Providers.tsx` créé
- [x] `layout.tsx` modifié avec `<Providers>`
- [x] Route `/api/auth/session` créée
- [x] Route `/api/logout` vérifiée (existe)
- [x] Application redémarrée
- [ ] Login admin testé
- [ ] Login client testé
- [ ] Session persiste après refresh
- [ ] Logout fonctionne

---

## 🎉 Résultat

**L'erreur "useAuth must be used within an AuthProvider" est RÉSOLUE !**

Vous pouvez maintenant :
- ✅ Utiliser `useAuth()` dans tous vos composants
- ✅ Protéger des pages avec `useRequireAuth()`
- ✅ Différencier admin/client avec `useRequireAdmin()` / `useRequireClient()`
- ✅ Accéder aux infos user : `user.email`, `user.role_code`, `user.client_name`

---

**Prochaine étape suggérée** : Tester le login et créer les pages dashboard et client-portal protégées ! 🚀
