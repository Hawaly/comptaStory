# Fonctionnalité : Stratégies Social Media

## 📋 Vue d'ensemble

Cette fonctionnalité permet de créer, gérer et visualiser des stratégies social-media structurées pour chaque mandat client. Elle offre un template complet couvrant tous les aspects d'une stratégie social-media professionnelle.

## 🗂️ Structure de la stratégie

La stratégie est organisée en 10 sections principales :

### 1. Contexte & Objectifs Business
- **Contexte général** : Description de l'entreprise, positionnement, ressources, marché
- **Objectifs business** : Objectifs moyen/long terme (CA, notoriété, acquisition, fidélisation)
- **Objectifs réseaux sociaux** : Objectifs SMART (Spécifiques, Mesurables, Atteignables, Réalistes, Temporellement définis)

### 2. Audience & Personas
- **Cibles principales** : Âge, sexe, localisation, centres d'intérêt, comportements
- **Personas marketing** : 1 à 3 profils types avec besoins, problèmes, attentes
- **Plateformes sociales** : Sélection des réseaux pertinents (Facebook, Instagram, LinkedIn, TikTok, etc.)

### 3. Positionnement & Identité de Communication
- **Ton / Voix de la marque** : Style de communication (professionnel, bienveillant, fun, etc.)
- **Guidelines visuelles** : Couleurs, typographies, style visuel, cohérence graphique
- **Valeurs & messages clés** : Ce que la marque défend, promet, son histoire

### 4. Piliers de Contenu (Content Pillars)
- Définition de 3 à 6 thèmes principaux pour le contenu
- Chaque pilier comprend : titre, description, exemples de contenus

### 5. Formats & Rythme de Publication
- **Formats envisagés** : Photos, carrousels, vidéos, Reels/Shorts, Stories, etc.
- **Fréquence & calendrier éditorial** : Quand publier, à quelle fréquence, sur quels canaux
- **Workflow & rôles** : Qui crée, valide, publie, modère, analyse

### 6. Audit & Analyse Concurrentielle
- **Audit des profils existants** : Ce qui fonctionne ou pas, lacunes identifiées
- **Veille / Benchmark concurrents** : Analyse de la concurrence, opportunités, bonnes pratiques

### 7. KPIs & Suivi
- **Indicateurs de performance** : Portée, engagement, croissance audience, conversions, etc.
- **Cadre de suivi** : Périodicité des analyses et ajustements

### 8. Canaux & Mix Média (Modèle PESO)
- **Owned Media** : Site web, blog, comptes réseaux sociaux propres
- **Shared Media** : Communauté, partage, contenu généré par utilisateurs
- **Paid Media** : Publicité, posts sponsorisés, boost, ads
- **Earned Media** : Relations presse, influenceurs, partenariats

### 9. Budget & Ressources
- **Temps humain** : Création, modération, community management, validation
- **Outils** : Logiciels pour édition média, planification, analyse, veille
- **Budget pub** : Montant, délais, priorisation

### 10. Planning, Itération & Optimisation
- **Planning global** : Contenu, publication, analyse, campagnes, événements
- **Processus d'itération** : Tester, mesurer, ajuster ce qui marche ou non
- **Mise à jour & réévaluation** : Fréquence et processus de mise à jour

## 🚀 Installation et Configuration

### 1. Migration de la base de données

Exécutez le script SQL de migration pour créer la table `social_media_strategy` :

```bash
# Avec psql (PostgreSQL)
psql -U votre_utilisateur -d votre_base -f migrations/add_social_media_strategy.sql

# Ou via Supabase Dashboard
# Copiez le contenu de migrations/add_social_media_strategy.sql
# et exécutez-le dans SQL Editor
```

### 2. Vérification des types TypeScript

Les types TypeScript ont été ajoutés dans `types/database.ts`. Assurez-vous qu'ils sont correctement importés :

```typescript
import {
  SocialMediaStrategy,
  SocialMediaStrategyInsert,
  SocialMediaStrategyUpdate,
  Persona,
  PilierContenu,
  KPI,
  STRATEGY_STATUS_LABELS,
  STRATEGY_STATUS_COLORS,
  SOCIAL_PLATFORMS,
  CONTENT_FORMATS
} from "@/types/database";
```

## 📖 Utilisation

### Accéder aux stratégies d'un mandat

1. Ouvrez la page de détail d'un mandat
2. Cliquez sur le bouton **"Stratégies Social Media"** (violet avec icône Share2)
3. Vous accédez à la liste des stratégies pour ce mandat

### Créer une nouvelle stratégie

1. Dans la page des stratégies, cliquez sur **"Nouvelle stratégie"**
2. Remplissez les sections du formulaire (utilisez les accordéons pour naviguer)
3. Les sections sont organisées de manière logique pour guider la réflexion
4. Utilisez les boutons :
   - **"Enregistrer en brouillon"** : Sauvegarde avec statut "brouillon"
   - **"Enregistrer et activer"** : Sauvegarde avec statut "actif"

### Modifier une stratégie existante

1. Dans la liste des stratégies, cliquez sur l'icône **édition** (FileText)
2. Modifiez les champs nécessaires
3. Sauvegardez les modifications

### Visualiser une stratégie (vue présentation client)

1. Dans la liste des stratégies, cliquez sur l'icône **œil** (Eye)
2. La stratégie s'affiche dans un format propre et professionnel
3. Utilisez le bouton **"Exporter PDF"** pour imprimer ou sauvegarder en PDF
4. Le bouton **"Modifier"** permet de passer en mode édition

### Supprimer une stratégie

1. Dans la liste des stratégies, cliquez sur l'icône **poubelle** (Trash2)
2. Confirmez la suppression (action irréversible)

## 🎨 Interface utilisateur

### Formulaire
- **Accordéons** : Les sections peuvent être repliées/dépliées pour faciliter la navigation
- **Champs dynamiques** : Ajout/suppression de personas, piliers de contenu, KPIs
- **Checkboxes** : Sélection multiple pour plateformes et formats
- **Auto-sauvegarde** : Recommandé de sauvegarder régulièrement en brouillon

### Vue présentation
- **Design professionnel** : Mise en page soignée pour présentation client
- **Codes couleur** : Sections visuellement distinctes
- **Impression optimisée** : CSS print pour un export PDF propre
- **Responsive** : Adapté aux différentes tailles d'écran

## 📊 Statuts des stratégies

| Statut | Description | Badge |
|--------|-------------|-------|
| **brouillon** | Stratégie en cours de rédaction | Gris |
| **actif** | Stratégie active et utilisée | Vert |
| **archive** | Stratégie archivée (ancienne version) | Orange |

## 🔄 Versionning

Chaque stratégie a un numéro de version qui s'incrémente automatiquement. Cela permet de :
- Garder un historique des stratégies
- Comparer les évolutions
- Archiver les anciennes versions

## 💡 Bonnes pratiques

### Remplissage du formulaire
1. **Commencez par le contexte** : Une bonne compréhension du client facilite le reste
2. **Définissez des personas précis** : 2-3 personas bien définis valent mieux que 5 vagues
3. **Soyez SMART pour les objectifs** : Évitez les objectifs flous
4. **Limitez les piliers** : 4-5 piliers bien définis sont plus efficaces que 10 vagues
5. **KPIs mesurables** : Définissez des KPIs que vous pourrez réellement suivre

### Présentation client
1. **Revoyez avant d'exporter** : Vérifiez que toutes les sections sont complètes
2. **Personnalisez le ton** : Adaptez le niveau de détail selon le client
3. **Exportez en PDF** : Plus professionnel qu'un partage d'écran
4. **Présentez en personne** : La stratégie est un support, pas un remplacement du dialogue

### Maintenance
1. **Mettez à jour régulièrement** : Créez une nouvelle version trimestriellement
2. **Analysez les résultats** : Comparez objectifs vs. réalité
3. **Archivez les anciennes** : Ne supprimez pas, archivez pour garder l'historique
4. **Partagez en interne** : Les stratégies peuvent inspirer d'autres mandats

## 🛠️ Composants techniques

### Fichiers créés
```
migrations/
  └── add_social_media_strategy.sql

types/
  └── database.ts (ajouts)

components/
  └── strategies/
      ├── StrategyForm.tsx
      └── StrategyView.tsx

app/(dashboard)/mandats/[id]/
  ├── page.tsx (modifié)
  └── strategies/
      └── page.tsx
```

### Base de données

**Table :** `social_media_strategy`

**Champs principaux :**
- `id` : Identifiant unique
- `mandat_id` : Lien vers le mandat
- `version` : Numéro de version
- `status` : brouillon | actif | archive
- 30+ champs pour stocker toutes les sections
- `created_at`, `updated_at` : Timestamps automatiques

**Relations :**
- `mandat_id` → `mandat(id)` avec CASCADE DELETE

**Index :**
- `mandat_id` : Pour requêtes par mandat
- `status` : Pour filtrer par statut

## 🐛 Dépannage

### La migration SQL échoue
- Vérifiez que la fonction `set_timestamp()` existe déjà (elle devrait, créée avec la première migration)
- Vérifiez les permissions de votre utilisateur PostgreSQL

### Erreur TypeScript
- Exécutez `npm install` pour s'assurer que toutes les dépendances sont à jour
- Vérifiez que `types/database.ts` contient bien les nouveaux types

### Le formulaire ne se sauvegarde pas
- Vérifiez les logs dans la console navigateur
- Vérifiez que la table existe bien dans Supabase
- Vérifiez les permissions RLS (Row Level Security) dans Supabase

### L'export PDF ne fonctionne pas
- Utilisez la fonction d'impression du navigateur (Ctrl+P / Cmd+P)
- Sélectionnez "Enregistrer en PDF" comme destination
- Les styles d'impression sont optimisés via CSS `@media print`

## 📝 Évolutions futures possibles

1. **Export PDF automatique** : Génération côté serveur avec bibliothèque comme Puppeteer
2. **Templates pré-remplis** : Templates par industrie (e-commerce, B2B, etc.)
3. **Collaboration** : Commentaires et annotations sur les stratégies
4. **Suivi des KPIs** : Intégration avec analytics pour suivre les résultats réels
5. **Calendrier éditorial** : Vue calendrier pour planifier les publications
6. **Suggestions IA** : Suggestions de contenu basées sur les piliers définis

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement ou consultez la documentation Supabase.

---

**Version :** 1.0  
**Date :** Décembre 2024  
**Auteur :** YourStory Agency Development Team
