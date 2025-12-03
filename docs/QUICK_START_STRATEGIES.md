# 🚀 Guide de Démarrage Rapide - Stratégies Social Media

## ✅ Checklist de mise en place

### 1️⃣ Exécuter la migration SQL

La première étape est de créer la table dans votre base de données Supabase.

**Option A : Via Supabase Dashboard (Recommandé)**

1. Ouvrez votre projet Supabase
2. Allez dans **SQL Editor**
3. Créez une nouvelle query
4. Copiez le contenu de `migrations/add_social_media_strategy.sql`
5. Cliquez sur **Run**

**Option B : Via psql**

```bash
psql -U votre_utilisateur -d votre_base -f migrations/add_social_media_strategy.sql
```

**Vérification :**
```sql
-- Exécutez cette requête pour vérifier que la table existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'social_media_strategy';
```

### 2️⃣ Configurer les permissions Supabase (Row Level Security)

Si vous utilisez RLS (Row Level Security), ajoutez ces politiques dans Supabase :

```sql
-- Politique de lecture (tous les utilisateurs authentifiés)
CREATE POLICY "Allow authenticated users to read strategies"
ON public.social_media_strategy
FOR SELECT
TO authenticated
USING (true);

-- Politique d'insertion (tous les utilisateurs authentifiés)
CREATE POLICY "Allow authenticated users to insert strategies"
ON public.social_media_strategy
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique de mise à jour (tous les utilisateurs authentifiés)
CREATE POLICY "Allow authenticated users to update strategies"
ON public.social_media_strategy
FOR UPDATE
TO authenticated
USING (true);

-- Politique de suppression (tous les utilisateurs authentifiés)
CREATE POLICY "Allow authenticated users to delete strategies"
ON public.social_media_strategy
FOR DELETE
TO authenticated
USING (true);

-- Activer RLS sur la table
ALTER TABLE public.social_media_strategy ENABLE ROW LEVEL SECURITY;
```

### 3️⃣ Vérifier que l'application compile

```bash
npm run build
```

Si vous voyez des erreurs TypeScript, vérifiez que `types/database.ts` contient bien les nouveaux types.

### 4️⃣ Lancer l'application

```bash
npm run dev
```

### 5️⃣ Tester la fonctionnalité

1. **Ouvrez un mandat existant**
   - Naviguez vers : `/mandats/[id]`
   - Vous devriez voir un nouveau bouton violet **"Stratégies Social Media"**

2. **Créez votre première stratégie**
   - Cliquez sur **"Stratégies Social Media"**
   - Cliquez sur **"Nouvelle stratégie"**
   - Remplissez au moins la première section (Contexte & Objectifs)
   - Cliquez sur **"Enregistrer en brouillon"**

3. **Visualisez la stratégie**
   - Retournez à la liste
   - Cliquez sur l'icône **œil** pour voir la présentation
   - Testez l'export PDF avec Ctrl+P (Cmd+P sur Mac)

4. **Modifiez la stratégie**
   - Cliquez sur l'icône **édition**
   - Ajoutez du contenu dans d'autres sections
   - Sauvegardez

## 🎯 Workflow typique

### Pour créer une stratégie complète :

1. **Préparation** (avant de remplir le formulaire)
   - Faites un brief client
   - Collectez les informations nécessaires
   - Définissez les personas avec le client
   - Analysez la concurrence

2. **Remplissage du formulaire** (45-90 minutes)
   - Commencez par le contexte (section 1)
   - Définissez l'audience (section 2)
   - Définissez l'identité (section 3)
   - Créez les piliers de contenu (section 4)
   - Remplissez les sections restantes
   - **Astuce :** Sauvegardez en brouillon régulièrement !

3. **Révision interne**
   - Passez en vue présentation
   - Vérifiez la cohérence
   - Corrigez les fautes
   - Complétez les sections manquantes

4. **Présentation client**
   - Exportez en PDF
   - Présentez en réunion
   - Récoltez les feedbacks
   - Ajustez si nécessaire

5. **Activation**
   - Une fois validée, passez le statut à **"actif"**
   - Utilisez-la comme référence pour la création de contenu

## 🔍 Points de vérification

### ✓ La migration a réussi si :
- Vous pouvez exécuter : `SELECT * FROM social_media_strategy LIMIT 1;` sans erreur
- La table apparaît dans Supabase Dashboard → Table Editor

### ✓ L'interface fonctionne si :
- Le bouton "Stratégies Social Media" est visible sur la page mandat
- Vous pouvez créer une stratégie sans erreur 500
- Le formulaire sauvegarde correctement

### ✓ L'export PDF fonctionne si :
- Ctrl+P / Cmd+P ouvre bien la boîte de dialogue d'impression
- La mise en page est propre (pas de boutons, fond blanc)
- Les couleurs sont préservées

## 🐛 Problèmes courants

### "Table does not exist"
→ La migration n'a pas été exécutée. Retournez à l'étape 1.

### "Permission denied"
→ Les politiques RLS ne sont pas configurées. Voir étape 2.

### Erreurs TypeScript au build
→ Vérifiez que tous les types sont bien importés dans les composants.

### Le formulaire est lent
→ Normal pour les grandes stratégies. Les accordéons permettent de gérer cela.

### L'export PDF coupe le contenu
→ Utilisez "Enregistrer en PDF" dans la boîte de dialogue d'impression, pas "Imprimer".

## 📚 Ressources supplémentaires

- **Documentation complète :** `docs/SOCIAL_MEDIA_STRATEGY.md`
- **Schéma SQL :** `migrations/add_social_media_strategy.sql`
- **Types TypeScript :** `types/database.ts`
- **Composants :** `components/strategies/`
- **Pages :** `app/(dashboard)/mandats/[id]/strategies/`

## 💬 Questions fréquentes

**Q : Peut-on avoir plusieurs stratégies actives pour un mandat ?**  
R : Oui, la contrainte unique a été retirée pour permettre les tests et évolutions.

**Q : Comment archiver une stratégie ?**  
R : Modifiez-la et changez le statut en "archive".

**Q : Les clients peuvent-ils voir les stratégies ?**  
R : Non, c'est un outil interne. Pour les clients, exportez en PDF.

**Q : Peut-on dupliquer une stratégie ?**  
R : Pas encore, mais vous pouvez la modifier et l'enregistrer avec un nouveau statut.

**Q : Les stratégies sont-elles liées aux tâches du mandat ?**  
R : Pas directement, mais elles fournissent le cadre pour définir les tâches de contenu.

---

**Prêt à démarrer ?** Suivez les étapes 1 à 5 ci-dessus ! 🚀

Pour toute question : consultez `docs/SOCIAL_MEDIA_STRATEGY.md` ou contactez l'équipe dev.
