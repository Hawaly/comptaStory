# 🎨 YourStory Design System

## 📐 Charte Graphique

### Couleurs

#### Couleurs Principales
- **Willpower Orange** : `#fd5f04` - "Trust/Confidence"
  - Utilisé pour les CTAs, éléments d'action, et points focaux
- **Black** : `#000000` - "Strength"
  - Textes principaux, navigation, éléments structurels
- **White** : `#ffffff` - "Clarity"
  - Arrière-plans, cartes, espaces de respiration

#### Palette Étendue
```css
brand-orange: #fd5f04      /* Orange principal */
brand-orange-light: #fe7d33 /* Orange clair (hover, accents) */
brand-orange-dark: #dc5203  /* Orange foncé (états actifs) */
brand-black: #000000        /* Noir pur */
brand-white: #ffffff        /* Blanc pur */
brand-gray-light: #f5f5f5   /* Gris clair (backgrounds) */
brand-gray-medium: #e0e0e0  /* Gris moyen (bordures) */
brand-gray-dark: #333333    /* Gris foncé (textes secondaires) */
```

### Typographie

**Police Principale** : **Lama Sans**
- Weights disponibles : Thin, Ultra-Light, Light, Medium, Semi-Bold, Bold, Heavy
- Usage : Titres ET texte courant

#### Hiérarchie Typographique
```css
/* Titres */
h1: 36-48px, Bold/Heavy
h2: 30-36px, Semi-Bold/Bold
h3: 24-30px, Semi-Bold
h4: 20-24px, Medium/Semi-Bold
h5: 18-20px, Medium

/* Corps de texte */
body: 16px, Light/Regular
small: 14px, Light
caption: 12px, Light
```

## 🎯 Composants UI

### Card (Carte)
Conteneur principal pour grouper du contenu.

**Variants** :
- `default` : Ombre légère, fond blanc
- `elevated` : Ombre prononcée, effet surélevé
- `bordered` : Bordure visible sans ombre
- `gradient` : Fond dégradé subtil

**Usage** :
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

<Card variant="elevated" hover>
  <CardHeader>
    <CardTitle>Titre de la carte</CardTitle>
  </CardHeader>
  <CardContent>
    Contenu de la carte
  </CardContent>
</Card>
```

### Button (Bouton)
Élément d'action interactif.

**Variants** :
- `primary` : Orange, pour actions principales
- `secondary` : Noir, pour actions secondaires
- `outline` : Bordure orange, fond transparent
- `ghost` : Transparent, pour actions tertiaires
- `danger` : Rouge, pour actions destructives

**Sizes** : `sm`, `md`, `lg`

**Usage** :
```tsx
import { Button } from '@/components/ui';
import { Plus } from 'lucide-react';

<Button variant="primary" size="md" icon={<Plus />}>
  Nouvelle facture
</Button>
```

### Badge (Badge)
Étiquette pour statuts et catégories.

**Variants** :
- `default` : Gris
- `success` : Vert
- `warning` : Jaune
- `danger` : Rouge
- `info` : Bleu
- `brand` : Orange

**Usage** :
```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Actif</Badge>
```

### StatCard (Carte de Statistique)
Affichage de métriques avec icône.

**Variants** : `default`, `brand`, `success`, `warning`, `info`

**Usage** :
```tsx
import { StatCard } from '@/components/ui';
import { Users } from 'lucide-react';

<StatCard
  title="Total Clients"
  value="48"
  icon={Users}
  variant="brand"
  trend={{ value: "+12%", isPositive: true }}
/>
```

### PageHeader (En-tête de Page)
En-tête standardisé pour toutes les pages.

**Usage** :
```tsx
import { PageHeader } from '@/components/ui';
import { Button } from '@/components/ui';

<PageHeader
  title="Factures"
  subtitle="Gérez toutes vos factures clients"
  action={
    <Button variant="primary">
      Nouvelle facture
    </Button>
  }
/>
```

## 🎨 Effets Visuels

### Ombres
```css
shadow-elegant       /* Ombre légère et raffinée */
shadow-elegant-lg    /* Ombre moyenne */
shadow-brand         /* Ombre orange subtile */
shadow-brand-lg      /* Ombre orange prononcée */
shadow-brand-xl      /* Ombre orange majeure */
```

### Animations
```css
animate-fade-in      /* Apparition en fondu */
animate-slide-up     /* Glissement vers le haut */
animate-scale-in     /* Zoom progressif */
animate-float        /* Flottement subtil */
animate-pulse-subtle /* Pulsation douce */
```

### Dégradés
```css
bg-brand-gradient    /* Dégradé orange (#fd5f04 → #fe7d33) */
```

## 📏 Espacements

**Système 8px** : Tous les espacements sont des multiples de 8px

```css
Très petit : 4px  (0.5)
Petit      : 8px  (2)
Moyen      : 16px (4)
Grand      : 24px (6)
Très grand : 32px (8)
Énorme     : 48px (12)
```

## 🎯 Bordures & Arrondis

**Arrondis** :
```css
sm  : 8px   (rounded-lg)
md  : 12px  (rounded-xl)
lg  : 16px  (rounded-2xl)
xl  : 24px  (rounded-3xl)
full: 9999px (rounded-full)
```

**Bordures** :
```css
Thin   : 1px  (border)
Medium : 2px  (border-2)
Thick  : 4px  (border-4)
```

## 🎨 Patterns de Design

### Cards avec hover
Toutes les cartes interactives doivent avoir un effet hover :
```tsx
<Card hover className="cursor-pointer">
  {/* Contenu */}
</Card>
```

### Gradients de texte
Pour les titres importants :
```tsx
<h1 className="bg-gradient-to-r from-black via-gray-800 to-gray-600 bg-clip-text text-transparent">
  Titre Important
</h1>
```

### Bordures accentuées
Pour les cartes de statistiques :
```tsx
<div className="border-l-4 border-l-brand-orange">
  {/* Contenu */}
</div>
```

## 🎯 Principes de Design

### 1. Hiérarchie Visuelle
- Titres imposants et espacés
- Utiliser les poids de police (Semi-Bold, Bold)
- Contraste élevé entre niveaux d'information

### 2. Espacement Généreux
- Padding important dans les cartes (p-6)
- Marges entre sections (mb-8, mt-8)
- Respiration visuelle

### 3. Cohérence
- Toujours utiliser les composants UI standardisés
- Respecter les variants définis
- Maintenir les espacements uniformes

### 4. Feedback Visuel
- Transitions fluides (duration-200, duration-300)
- États hover clairs
- Animations subtiles

### 5. Accessibilité
- Contraste de texte suffisant
- Tailles de police lisibles (min 14px)
- Focus states visibles

## 🚀 Exemples de Pages

### Page Liste Standard
```tsx
<main className="p-4 sm:p-6 lg:p-8 bg-brand-gray-light min-h-screen">
  <PageHeader 
    title="Titre de la page"
    subtitle="Description"
    action={<Button variant="primary">Action</Button>}
  />
  
  {/* Statistiques */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <StatCard title="Metric 1" value="42" icon={Icon} variant="brand" />
    {/* ... */}
  </div>
  
  {/* Contenu principal */}
  <Card variant="elevated">
    <CardHeader>
      <CardTitle>Section</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Liste ou contenu */}
    </CardContent>
  </Card>
</main>
```

### Page Détail
```tsx
<main className="p-4 sm:p-6 lg:p-8 bg-brand-gray-light min-h-screen">
  <PageHeader 
    title="Détail"
    breadcrumb={<Breadcrumb />}
    action={<Button variant="outline">Modifier</Button>}
  />
  
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Colonne principale */}
    <div className="lg:col-span-2 space-y-6">
      <Card variant="elevated">
        {/* Contenu principal */}
      </Card>
    </div>
    
    {/* Sidebar */}
    <div className="space-y-6">
      <Card>
        {/* Informations complémentaires */}
      </Card>
    </div>
  </div>
</main>
```

## 📱 Responsive Design

### Breakpoints
```css
sm: 640px   /* Mobile paysage */
md: 768px   /* Tablette */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Très grand écran */
```

### Grilles Adaptatives
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* 1 col mobile, 2 tablette, 4 desktop */}
</div>
```

## 🎯 Checklist Qualité

Avant de considérer une page "premium" :

- [ ] Utilise les composants UI standardisés
- [ ] Respect de la charte graphique (orange #fd5f04)
- [ ] Ombres élégantes (shadow-elegant, shadow-brand)
- [ ] Animations fluides sur les interactions
- [ ] Hover states sur tous les éléments cliquables
- [ ] Typographie hiérarchisée (titres clairs)
- [ ] Espacements généreux et cohérents
- [ ] Bordures arrondies (rounded-xl, rounded-2xl)
- [ ] Responsive sur tous les écrans
- [ ] Feedback visuel immédiat

## 📚 Ressources

- **Tailwind Config** : `tailwind.config.ts`
- **Composants UI** : `components/ui/`
- **Exemples** : Voir pages rénovées (dashboard, clients, mandats)

---

**Version** : 1.0  
**Date** : Décembre 2024  
**Auteur** : YourStory Agency Development Team
