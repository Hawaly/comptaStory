# 📅 Calendrier Éditorial - Stratégie Social Media

## 🎯 Vue d'ensemble

Le **Calendrier Éditorial** est un outil graphique interactif intégré dans le formulaire de stratégie social media. Il permet de planifier, visualiser et gérer vos publications sur toutes vos plateformes sociales.

## ✨ Fonctionnalités

### 1. **Vue Calendrier Mensuel**
- Visualisation claire de tous les posts du mois
- Navigation facile entre les mois (boutons ← →)
- Mise en évidence du jour actuel (bordure orange)

### 2. **Gestion des Posts**
- **Ajouter** : Cliquez sur le "+" dans une journée
- **Éditer** : Cliquez sur un post existant
- **Supprimer** : Cliquez sur le "x" qui apparaît au survol

### 3. **Codes Couleur par Plateforme**
Chaque plateforme a sa propre couleur :
- 🎨 **Instagram** : Rose
- 📘 **Facebook** : Bleu
- 💼 **LinkedIn** : Indigo
- 🎵 **TikTok** : Violet
- 🐦 **Twitter** : Bleu ciel
- 📺 **YouTube** : Rouge

### 4. **Informations par Post**
Pour chaque post planifié, vous pouvez définir :
- **Date** : Jour de publication
- **Plateforme** : Instagram, Facebook, LinkedIn, etc.
- **Type de contenu** : Carrousel, Reel, Story, Article, etc.
- **Titre/Sujet** : Description courte du post
- **Description** : Détails, hashtags, mentions, liens
- **Statut** : Brouillon, Programmé, Publié

## 🚀 Comment Utiliser

### Ajouter un Post

1. **Ouvrir le formulaire de stratégie** pour un mandat
2. **Naviguer** à la section "10. Planning, Itération & Optimisation"
3. **Sélectionner une date** en cliquant sur le bouton "+" dans une journée
4. **Remplir le formulaire** :
   - Choisir la plateforme
   - Définir le type de contenu
   - Écrire le titre
   - Ajouter des détails/notes
   - Définir le statut
5. **Cliquer sur "Ajouter"**

### Éditer un Post

1. **Cliquer directement** sur le post dans le calendrier
2. **Modifier** les informations
3. **Cliquer sur "Mettre à jour"**

### Supprimer un Post

1. **Survoler** le post dans le calendrier
2. **Cliquer sur le "x"** qui apparaît
3. Le post est supprimé immédiatement

### Naviguer entre les Mois

- **← Mois précédent**
- **→ Mois suivant**

## 📋 Cas d'Usage

### Planning de Lancement Produit

```
15 Mars - Instagram - Carrousel
  → Teaser produit (visuels + bénéfices)
  
18 Mars - Facebook - Post
  → Annonce officielle avec lien boutique
  
20 Mars - LinkedIn - Article
  → Case study détaillé
  
22 Mars - TikTok - Vidéo
  → Démo produit fun et dynamique
```

### Campagne Mensuelle

Planifiez toute votre campagne du mois :
- **Semaine 1** : Contenus de sensibilisation
- **Semaine 2** : Contenus éducatifs
- **Semaine 3** : Témoignages clients
- **Semaine 4** : Offres et CTA

### Événements et Saisons

Marquez les dates importantes :
- Soldes
- Jours fériés
- Événements sectoriels
- Lancements produits

## 🎨 Interface

### Calendrier
```
┌────────────────────────────────────────┐
│  ←    Décembre 2024    →               │
├─────┬─────┬─────┬─────┬─────┬─────┬────┤
│ Lun │ Mar │ Mer │ Jeu │ Ven │ Sam │ Dim│
├─────┼─────┼─────┼─────┼─────┼─────┼────┤
│     │     │  1  │  2+ │  3  │  4  │  5 │
│     │     │     │  📘 │     │     │    │
│     │     │     │ Post│     │     │    │
├─────┼─────┼─────┼─────┼─────┼─────┼────┤
│  6  │  7  │  8  │  9+ │ 10+ │ 11  │ 12 │
│     │     │     │  🎨 │  📘 │     │    │
│     │     │     │Reel │ Post│     │    │
└─────┴─────┴─────┴─────┴─────┴─────┴────┘
```

### Modal d'Ajout/Édition
```
┌──────────────────────────────────────┐
│  Nouveau Post                    ✕   │
│  Lundi 9 décembre 2024               │
├──────────────────────────────────────┤
│                                      │
│  Plateforme *                        │
│  [Instagram ▼]                       │
│                                      │
│  Type de contenu                     │
│  [Reel                         ]     │
│                                      │
│  Titre / Sujet *                     │
│  [Tutoriel makeup hivernal     ]     │
│                                      │
│  Description / Notes                 │
│  [#makeuptutorial #winter...   ]     │
│                                      │
│  Statut                              │
│  [Programmé ▼]                       │
│                                      │
│  [Annuler]  [Ajouter]                │
└──────────────────────────────────────┘
```

## 💾 Stockage

Les données du calendrier sont stockées :
- **Base de données** : Colonne `editorial_calendar` (JSONB)
- **Format** : Array d'objets CalendarPost
- **Synchronisation** : Automatique avec sauvegarde stratégie

### Structure de Données

```typescript
interface CalendarPost {
  id: string;              // ID unique
  date: string;            // "YYYY-MM-DD"
  platform: string;        // "Instagram", "Facebook"...
  contentType: string;     // "Reel", "Carrousel"...
  title: string;           // Sujet du post
  description?: string;    // Détails optionnels
  status?: 'draft' | 'scheduled' | 'published';
}
```

## 🔄 Workflow Recommandé

### 1. Planification Initiale (Début de mois)
- Brainstorming des contenus
- Ajout de tous les posts du mois
- Statut : **Brouillon**

### 2. Préparation (1 semaine avant)
- Créer les visuels/vidéos
- Rédiger les captions
- Statut : **Programmé**

### 3. Publication
- Publier selon planning
- Statut : **Publié**

### 4. Analyse et Ajustement
- Vérifier les performances
- Ajuster les prochains posts
- Répéter

## 📊 Bénéfices

### Pour l'Agence
- ✅ Vision globale du planning
- ✅ Coordination entre plateformes
- ✅ Respect des deadlines
- ✅ Historique des publications

### Pour le Client
- ✅ Transparence totale
- ✅ Aperçu du travail planifié
- ✅ Validation facilitée
- ✅ Anticipation des campagnes

## 🎓 Bonnes Pratiques

### 1. **Équilibrez vos Plateformes**
Ne négligez pas certaines plateformes au profit d'autres.

### 2. **Variez les Types de Contenu**
Alternez Reels, Carrousels, Stories, Posts...

### 3. **Planifiez à l'Avance**
Minimum 2 semaines d'avance pour la préparation.

### 4. **Restez Flexible**
Laissez de la place pour les contenus spontanés/actualité.

### 5. **Cohérence Visuelle**
Notez dans la description le style/couleurs à respecter.

### 6. **Incluez les Hashtags**
Préparez vos hashtags dans les notes.

## 🔧 Conseils Techniques

### Types de Contenu par Plateforme

**Instagram**
- Reel (15-90s)
- Carrousel (2-10 images)
- Story (24h)
- Post image

**Facebook**
- Post texte
- Vidéo
- Événement
- Live

**LinkedIn**
- Article long
- Post professionnel
- Document PDF
- Sondage

**TikTok**
- Vidéo courte (15-60s)
- Série
- Live

**Twitter**
- Tweet (280 caractères)
- Thread
- Sondage

**YouTube**
- Vidéo longue
- Short (60s)
- Live
- Premiere

## 🚨 Points d'Attention

### Vérifications Avant Publication
- [ ] Orthographe vérifiée
- [ ] Hashtags optimisés
- [ ] Mentions correctes
- [ ] Liens fonctionnels
- [ ] Visuels haute qualité
- [ ] Respect charte graphique
- [ ] Call-to-action clair

### Éviter
- ❌ Posts trop rapprochés (spam)
- ❌ Même contenu sur toutes plateformes
- ❌ Publication pendant heures creuses
- ❌ Oublier d'engager avec audience

## 📱 Responsive

Le calendrier s'adapte à tous les écrans :
- **Desktop** : Vue complète 7 jours
- **Tablette** : Vue optimisée
- **Mobile** : Scrolling horizontal si nécessaire

## 🔮 Évolutions Futures

Fonctionnalités à venir :
- 📊 Vue hebdomadaire
- 🔔 Rappels de publication
- 📈 Statistiques par plateforme
- 🎯 Suggestions de contenu
- 🔄 Duplication de posts
- 📤 Export PDF du planning

---

## 🆘 Support

### Questions Fréquentes

**Q : Les posts s'enregistrent automatiquement ?**
R : Non, pensez à sauvegarder la stratégie complète après modifications du calendrier.

**Q : Puis-je déplacer un post d'une date à l'autre ?**
R : Actuellement, il faut éditer le post et changer la date manuellement.

**Q : Combien de posts par jour maximum ?**
R : Aucune limite technique, mais 3-5 posts/jour maximum recommandé.

**Q : Les plateformes viennent d'où ?**
R : Elles proviennent de la section "Audience & Personas" de la stratégie.

---

**Documentation créée le** : 3 décembre 2024  
**Version** : 1.0  
**Composant** : `EditorialCalendar.tsx`
