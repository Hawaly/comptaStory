# 🚨 FIX LOGIN URGENT - À FAIRE MAINTENANT

## ⚡ Solution Rapide (5 Minutes)

### Étape 1: Arrêter Next.js

Dans le terminal où `npm run dev` tourne :
```bash
Ctrl + C
```

### Étape 2: Nettoyer le Cache Next.js

```bash
# Dans le terminal
rm -rf .next
# OU sur Windows
rmdir /s .next
```

**OU** supprimez simplement le dossier `.next` manuellement.

---

### Étape 3: Exécuter le Script SQL de Fix

**Dans Supabase SQL Editor**, copier/coller **TOUT** le contenu de :

```sql
migrations/fix_login_now.sql
```

**✅ Résultat attendu** :
Vous devriez voir deux SELECTs qui retournent :
```
id | email              | role  | is_active | hash_preview
1  | admin@yourstory.ch | admin | true      | $2a$10$5vJqMhm
```

---

### Étape 4: Vérifier JWT_SECRET

Ouvrez `.env.local` (à la racine du projet) et ajoutez si absent :

```env
JWT_SECRET=this_is_a_development_secret_key_minimum_32_chars

# Si vous avez déjà Supabase configuré, gardez ces lignes aussi
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Si le fichier `.env.local` n'existe pas**, créez-le !

---

### Étape 5: Redémarrer Next.js

```bash
npm run dev
```

Attendez que ça compile complètement (environ 5-10 secondes).

---

### Étape 6: Tester

1. Allez sur : http://localhost:3000/login
2. Entrez :
   - **Email** : `admin@yourstory.ch`
   - **Mot de passe** : `admin123`
3. Cliquez "Se connecter"

---

## 🔍 Si Ça Ne Marche Toujours Pas

### Test Manuel dans Supabase

Dans Supabase SQL Editor :

```sql
-- Test 1: La table existe ?
SELECT COUNT(*) FROM public.app_user;

-- Test 2: L'admin existe ?
SELECT id, email, role, is_active 
FROM public.app_user 
WHERE email = 'admin@yourstory.ch';

-- Test 3: La requête exacte de l'API
SELECT id, email, password_hash, role, is_active
FROM public.app_user
WHERE email = 'admin@yourstory.ch'
  AND is_active = true
LIMIT 1;
```

**Tous les 3 devraient retourner des données !**

---

### Activer le Debug de l'API

Remplacez temporairement la route API :

1. **Renommer** : `app/api/login/route.ts` → `route.ts.backup`
2. **Renommer** : `app/api/login/route-debug.ts` → `route.ts`
3. **Redémarrer** : `npm run dev`
4. **Tester** le login

La version debug affiche TOUS les détails dans la console :
- Connection Supabase
- Requête SQL exacte
- Utilisateur trouvé ou non
- Validation mot de passe
- Création session

Regardez les logs dans le terminal.

---

### Si l'Erreur "username does not exist" Persiste

Cela signifie qu'il y a une **politique RLS** ou un **trigger** qui cherche encore `username`.

**Solution** : Supprimer TOUTES les policies RLS sur app_user

```sql
-- Voir les policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'app_user';

-- Supprimer toutes les policies
DROP POLICY IF EXISTS client_view_own ON public.app_user;
DROP POLICY IF EXISTS admin_view_all ON public.app_user;
-- Etc pour toutes les policies listées

-- Désactiver RLS complètement
ALTER TABLE public.app_user DISABLE ROW LEVEL SECURITY;
```

---

## ✅ Checklist de Vérification

- [ ] Serveur arrêté
- [ ] `.next` supprimé
- [ ] Script `fix_login_now.sql` exécuté avec succès
- [ ] `JWT_SECRET` dans `.env.local`
- [ ] Serveur redémarré
- [ ] Login testé avec `admin@yourstory.ch` / `admin123`

---

## 🎯 Structure de la Table Finale

```sql
CREATE TABLE public.app_user (
  id SERIAL PRIMARY KEY,              -- Clé primaire
  email VARCHAR(255) UNIQUE NOT NULL, -- Email (login)
  password_hash VARCHAR(255) NOT NULL,-- Hash bcrypt
  role VARCHAR(50) DEFAULT 'client',  -- Role: admin/client
  is_active BOOLEAN DEFAULT true,     -- Actif ou non
  created_at TIMESTAMP DEFAULT NOW()  -- Date création
);
```

**PAS de colonne `username` !** Seulement `email`.

---

## 🆘 Si Toujours Bloqué

Testez directement avec curl :

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@yourstory.ch","password":"admin123"}'
```

**Résultat attendu** :
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "admin@yourstory.ch",
    "role": "admin"
  }
}
```

---

**Après ces étapes, le login DOIT fonctionner !** 🚀

Si vous voyez encore "column username does not exist", envoyez-moi :
1. Le résultat du SELECT sur app_user
2. Les logs complets du terminal
3. Le résultat de `SELECT * FROM pg_policies WHERE tablename='app_user'`
