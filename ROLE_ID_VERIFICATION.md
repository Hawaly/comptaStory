# 🔐 Vérification par Role ID - Documentation

## 🎯 Objectif

La vérification des permissions se fait maintenant par **`role_id`** au lieu de **`role_code`**.

**Admin** = `role_id = 1`  
**Client** = `role_id = 2`  
**Staff** = `role_id = 3`

---

## ✅ Modifications Effectuées

### 1. Session JWT (`lib/auth.ts`)

**Interface SessionData** :
```typescript
export interface SessionData {
  userId: string;
  username: string;
  role?: string;      // Code du rôle (admin, client, staff)
  roleId?: number;    // ✅ ID du rôle (1, 2, 3)
}
```

**Vérification du token** :
```typescript
export async function verifyToken(token: string) {
  return {
    userId: payload.userId as string,
    username: payload.username as string,
    role: payload.role as string | undefined,
    roleId: payload.roleId as number | undefined, // ✅ Extrait roleId
  };
}
```

---

### 2. Login API (`app/api/login/route.ts`)

**Création de session** :
```typescript
await createSession({
  userId: String(user.user_id),
  username: user.email,
  role: user.role_code,
  roleId: user.role_id, // ✅ Ajoute role_id dans le JWT
});
```

**Réponse** :
```typescript
return NextResponse.json({
  success: true,
  user: {
    id: user.user_id,
    email: user.email,
    role_code: user.role_code,
    role_name: user.role_name,
    role_id: user.role_id, // ✅ Retourne role_id
    client_id: user.client_id,
    client_name: user.client_name,
  },
  redirect_path: user.redirect_path,
});
```

---

### 3. Middleware (`middleware.ts`)

**Vérification Admin** :
```typescript
// ✅ Vérifier si l'utilisateur est admin (role_id = 1)
const isAdmin = session.roleId === 1;

// Si route dashboard et pas admin (role_id !== 1)
if (isDashboardRoute && !isAdmin) {
  return NextResponse.redirect('/client-portal');
}

// Si route client-portal et admin (role_id === 1)
if (pathname.startsWith('/client-portal') && isAdmin) {
  return NextResponse.redirect('/dashboard');
}

// Redirection après login selon role_id
if (pathname === '/login') {
  if (isAdmin) {
    return NextResponse.redirect('/dashboard');
  } else {
    return NextResponse.redirect('/client-portal');
  }
}
```

---

### 4. Auth Context (`contexts/SimpleAuthContext.tsx`)

**Interface User** :
```typescript
interface User {
  id: number;
  email: string;
  role_code: string;
  role_name: string;
  role_id: number; // ✅ 1 = admin, 2 = client, 3 = staff
  client_id?: number;
  client_name?: string;
}
```

**Hook useRequireAdmin** :
```typescript
export function useRequireAdmin() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role_id !== 1) { // ✅ Vérifier role_id === 1
        router.push('/client-portal');
      }
    }
  }, [user, isLoading, router]);

  return { isLoading, user };
}
```

**Hook useRequireClient** :
```typescript
export function useRequireClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role_id !== 2) { // ✅ Vérifier role_id === 2
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  return { isLoading, user };
}
```

---

### 5. Dashboard Layout (`app/(dashboard)/DashboardLayoutClient.tsx`)

**Vérification Admin** :
```typescript
if (!user || user.role_id !== 1) { // ✅ Vérifier role_id === 1
  return (
    <div className="text-center">
      <h2>Accès Refusé</h2>
      <p>Cette page est réservée aux administrateurs (role_id = 1).</p>
    </div>
  );
}
```

---

### 6. Session API (`app/api/auth/session/route.ts`)

**Réponse** :
```typescript
return NextResponse.json({
  user: {
    id: userData.user_id,
    email: userData.email,
    role_code: userData.role_code,
    role_name: userData.role_name,
    role_id: userData.role_id, // ✅ Retourne role_id
    client_id: userData.client_id,
    client_name: userData.client_name,
  },
});
```

---

### 7. Dashboards (`components/client-portal/EnrichedClientDashboard.tsx`)

**Interface User** :
```typescript
interface User {
  id: number;
  email: string;
  role_code: string;
  role_name: string;
  role_id: number; // ✅ 1 = admin, 2 = client, 3 = staff
  client_id?: number;
  client_name?: string;
}
```

---

## 📊 Mapping Role ID

| Role ID | Code   | Nom            | Accès            |
|---------|--------|----------------|------------------|
| **1**   | admin  | Administrateur | Dashboard admin  |
| **2**   | client | Client         | Client portal    |
| **3**   | staff  | Employé        | Dashboard admin  |

---

## 🔄 Flux de Vérification

### 1. Login
```
User se connecte
└─> API récupère role_id depuis DB (via vue user_with_details)
    └─> Crée JWT avec { userId, username, role, roleId }
        └─> Retourne user avec role_id
```

### 2. Middleware (chaque requête)
```
Requête vers /dashboard
└─> Middleware extrait JWT du cookie
    └─> Décode JWT et récupère roleId
        └─> Vérifie roleId === 1 ?
            ├─> OUI → Autorise l'accès ✅
            └─> NON → Redirige vers /client-portal ❌
```

### 3. Layout Dashboard (client-side)
```
Page dashboard charge
└─> useRequireAdmin() vérifie user.role_id
    └─> role_id === 1 ?
        ├─> OUI → Affiche le contenu ✅
        └─> NON → Affiche "Accès Refusé" ❌
```

---

## ✅ Avantages de role_id

### 1. **Performance** ⚡
- Pas besoin de comparer des strings (`'admin'` vs `role_code`)
- Comparaison d'entiers plus rapide (`1` vs `role_id`)

### 2. **Fiabilité** 🛡️
- L'ID ne change jamais (clé primaire)
- Le code peut être modifié dans la DB
- Pas de problème de casse (Admin vs admin vs ADMIN)

### 3. **Sécurité** 🔒
- Basé sur l'ID de la table `role`
- Impossible de tricher avec un code modifié
- JWT contient un nombre, pas une string

### 4. **Maintenabilité** 🔧
- Un seul endroit pour gérer les rôles (table `role`)
- Ajout de nouveaux rôles facile (ID 4, 5, etc.)
- Code plus lisible (`role_id === 1` vs `role_code === 'admin'`)

---

## 🧪 Tests

### Test 1: Admin Access

```typescript
// Login admin
POST /api/login
{
  "username": "admin@yourstory.ch",
  "password": "admin123"
}

// Réponse
{
  "success": true,
  "user": {
    "role_id": 1,  // ✅ role_id = 1
    "role_code": "admin"
  },
  "redirect_path": "/dashboard"
}

// JWT contient
{
  "userId": "1",
  "username": "admin@yourstory.ch",
  "role": "admin",
  "roleId": 1  // ✅
}

// Middleware
session.roleId === 1  // ✅ true → Accès dashboard
```

### Test 2: Client Access

```typescript
// Login client
POST /api/login
{
  "username": "client1@example.com",
  "password": "client123"
}

// Réponse
{
  "success": true,
  "user": {
    "role_id": 2,  // ✅ role_id = 2
    "role_code": "client"
  },
  "redirect_path": "/client-portal"
}

// JWT contient
{
  "userId": "2",
  "username": "client1@example.com",
  "role": "client",
  "roleId": 2  // ✅
}

// Middleware
session.roleId === 1  // ✅ false → Redirige vers /client-portal
```

---

## 🔍 Vérification Base de Données

### Voir les role_id

```sql
-- Table role
SELECT * FROM public.role ORDER BY id;

-- Résultat
id | code   | name           | redirect_path
1  | admin  | Administrateur | /dashboard
2  | client | Client         | /client-portal
3  | staff  | Employé        | /dashboard
```

### Voir les utilisateurs avec role_id

```sql
-- Vue user_with_details
SELECT 
  user_id, 
  email, 
  role_id, 
  role_code, 
  role_name 
FROM public.user_with_details;

-- Résultat
user_id | email               | role_id | role_code | role_name
1       | admin@yourstory.ch  | 1       | admin     | Administrateur
2       | client1@example.com | 2       | client    | Client
```

---

## 🎯 Cas d'Usage

### Ajouter un Nouveau Rôle

1. **Créer le rôle dans la DB** :
```sql
INSERT INTO public.role (code, name, description, redirect_path)
VALUES ('manager', 'Manager', 'Gestion intermédiaire', '/manager-dashboard');

-- Role créé avec id = 4
```

2. **Créer un utilisateur avec ce rôle** :
```sql
INSERT INTO public.app_user (email, password_hash, role_id, is_active)
VALUES (
  'manager@example.com',
  '$2a$10$HASH',
  4,  -- ✅ Nouveau role_id
  true
);
```

3. **Protéger les routes manager** :
```typescript
// Middleware
if (pathname.startsWith('/manager-dashboard') && session.roleId !== 4) {
  return NextResponse.redirect('/dashboard');
}

// Hook
export function useRequireManager() {
  useEffect(() => {
    if (!isLoading && user && user.role_id !== 4) {
      router.push('/dashboard');
    }
  }, [user, isLoading]);
}
```

---

## 📋 Checklist

- [x] SessionData inclut `roleId`
- [x] JWT encode `roleId`
- [x] JWT décode `roleId`
- [x] Login crée session avec `roleId`
- [x] Login retourne `role_id` dans user
- [x] Session API retourne `role_id`
- [x] Middleware vérifie `roleId === 1`
- [x] useRequireAdmin vérifie `role_id === 1`
- [x] useRequireClient vérifie `role_id === 2`
- [x] DashboardLayoutClient vérifie `role_id === 1`
- [x] User interface inclut `role_id`
- [x] EnrichedClientDashboard interface inclut `role_id`

---

## ✅ Résumé

**Avant** :
```typescript
if (session.role === 'admin') { ... }        // ❌ String comparison
if (user.role_code === 'admin') { ... }      // ❌ String comparison
```

**Maintenant** ✅ :
```typescript
if (session.roleId === 1) { ... }            // ✅ Integer comparison
if (user.role_id === 1) { ... }              // ✅ Integer comparison
```

**Avantages** :
- ⚡ Plus rapide (comparaison d'entiers)
- 🛡️ Plus fiable (ID ne change jamais)
- 🔒 Plus sécurisé (basé sur PK)
- 🔧 Plus maintenable (centralisé dans table `role`)

---

**Toutes les vérifications se font maintenant par `role_id` !** 🎉

**Admin = role_id = 1** ✅
