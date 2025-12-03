# 🎨 Guide d'Implémentation UI - Entités de Stratégie

## ✅ Ce Qui a Été Créé

### 1. Composants UI (4 fichiers)

#### **PersonaManager.tsx** ✅
- Interface complète pour gérer les personas
- Affichage en cartes avec toutes les informations
- Modal de création/édition avec tous les champs
- Suppression avec confirmation
- Design moderne avec icons Lucide

#### **PilierManager.tsx** ✅
- Gestion des piliers de contenu
- Barres de progression par pourcentage
- Couleurs différentes par pilier
- Réorganisation drag & drop (prévu)
- Validation 100% total

#### **KPIManager.tsx** ✅
- Gestion des KPIs
- Modal d'ajout de mesures
- Affichage valeur cible vs actuelle
- Bouton rapide pour ajouter une mesure

#### **KPIDashboard.tsx** ✅
- Dashboard visuel avec graphiques
- Mini-charts en barres pour chaque KPI
- Indicateurs de tendance (↑ ↓ →)
- Barres de progression vers objectif
- Insights automatiques
- Filtres de période (7j, 30j, 90j, tout)
- **Sans dépendance externe** (pas de Chart.js)

---

## 🔧 Intégration dans StrategyForm

### Étape 1 : Imports Déjà Ajoutés ✅

```typescript
import { PersonaManager } from "./PersonaManager";
import { PilierManager } from "./PilierManager";
import { KPIManager } from "./KPIManager";
```

### Étape 2 : Remplacer les Sections (À FAIRE)

#### Section Personas (ligne ~335)

**Ancien code (JSONB):**
```typescript
<div className="flex justify-between items-center mb-3">
  <label className="block text-sm font-bold text-gray-900">
    Personas marketing (1 à 3 profils types)
  </label>
  <button onClick={addPersona}>...</button>
</div>
{(formData.personas || []).map((persona, index) => (
  // Gestion JSONB inline
))}
```

**Nouveau code (Tables):**
```typescript
{strategy?.id ? (
  // Stratégie existante -> Utiliser le nouveau composant
  <PersonaManager strategyId={strategy.id} />
) : (
  // Nouvelle stratégie -> Message d'info
  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
    <p className="text-blue-800 font-medium">
      💡 Les personas seront disponibles après la création de la stratégie
    </p>
  </div>
)}
```

#### Section Piliers (ligne ~487)

**Remplacer par:**
```typescript
{strategy?.id ? (
  <PilierManager strategyId={strategy.id} />
) : (
  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
    <p className="text-blue-800 font-medium">
      💡 Les piliers de contenu seront disponibles après la création de la stratégie
    </p>
  </div>
)}
```

#### Section KPIs (ligne ~645)

**Remplacer par:**
```typescript
{strategy?.id ? (
  <div className="space-y-6">
    <KPIManager strategyId={strategy.id} />
    <hr className="border-gray-200" />
    <KPIDashboard strategyId={strategy.id} />
  </div>
) : (
  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
    <p className="text-blue-800 font-medium">
      💡 Les KPIs seront disponibles après la création de la stratégie
    </p>
  </div>
)}
```

---

## ⚠️ Erreurs TypeScript à Corriger

### Problème : Types Incompatibles

Les interfaces `Persona`, `PilierContenu` et `KPI` sont maintenant des **entités complètes** :

**Avant (JSONB):**
```typescript
interface Persona {
  nom: string;
  besoins: string;
  problemes: string;
  attentes: string;
}
```

**Après (Table):**
```typescript
interface Persona {
  id: number;
  strategy_id: number;
  nom: string;
  age_range: string | null;
  profession: string | null;
  besoins: string | null;
  problemes: string | null;
  attentes: string | null;
  comportements: string | null;
  canaux_preferes: string[] | null;
  created_at: string;
  updated_at: string;
}
```

### Solution : Utiliser les Legacy Types

Dans `types/database.ts`, j'ai créé des types legacy pour la compatibilité JSONB :

```typescript
// Pour le StrategyForm qui gère encore du JSONB (nouvelles stratégies)
export interface PersonaLegacy {
  nom: string;
  besoins: string;
  problemes: string;
  attentes: string;
}

export interface PilierContenuLegacy {
  titre: string;
  description: string;
  exemples: string;
}

export interface KPILegacy {
  nom: string;
  objectif: string;
  periodicite: string;
}
```

**Modifier le StrategyForm :**
```typescript
import type { 
  PersonaLegacy,
  PilierContenuLegacy,
  KPILegacy
} from "@/types/database";

// Dans formData
const [formData, setFormData] = useState<Partial<SocialMediaStrategyInsert>>({
  // ...
  personas: [] as PersonaLegacy[], // Au lieu de Persona[]
  piliers_contenu: [] as PilierContenuLegacy[],
  kpis: [] as KPILegacy[],
  // ...
});
```

---

## 📋 Workflow de Migration UI

### Phase 1 : Migration SQL ✅
```bash
psql -f migrations/extract_strategy_entities.sql
```

### Phase 2 : Tester les Composants sur une Stratégie Existante

1. Ouvrir une stratégie existante en édition
2. Les sections Personas, Piliers et KPIs afficheront les nouveaux composants
3. Tester : ajouter, éditer, supprimer

### Phase 3 : Adapter le Flux de Création

**Option A : Création en 2 étapes (Recommandé)**
1. Créer la stratégie avec les infos de base
2. Puis ajouter Personas/Piliers/KPIs avec les nouveaux composants

**Option B : Garder JSONB pour la création**
- Utiliser PersonaLegacy, PilierContenuLegacy, KPILegacy
- Migrer vers les tables lors de la sauvegarde

### Phase 4 : Supprimer les Colonnes JSONB (Optionnel)

Après validation complète :
```sql
ALTER TABLE social_media_strategy 
DROP COLUMN personas,
DROP COLUMN piliers_contenu,
DROP COLUMN kpis;
```

---

## 🎯 Exemple Complet d'Intégration

### Fichier : `StrategyForm.tsx` (sections modifiées)

```typescript
// Section 2: Audience & Personas
<div className="bg-white rounded-lg shadow-md overflow-hidden">
  <SectionHeader title="2. Audience & Personas" section="audience" />
  {expandedSections.audience && (
    <div className="p-6 space-y-4">
      {/* Cibles (inchangé) */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Cibles
        </label>
        <textarea
          value={formData.cibles || ''}
          onChange={(e) => setFormData({ ...formData, cibles: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
          placeholder="Définir les cibles..."
        />
      </div>

      {/* Plateformes (inchangé) */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Plateformes sociales
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SOCIAL_PLATFORMS.map((platform) => (
            <label key={platform} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={(formData.plateformes || []).includes(platform)}
                onChange={() => togglePlatform(platform)}
              />
              <span>{platform}</span>
            </label>
          ))}
        </div>
      </div>

      {/* PERSONAS - NOUVEAU COMPOSANT */}
      <div className="border-t-2 border-gray-200 pt-4">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Personas Marketing
        </label>
        {strategy?.id ? (
          <PersonaManager strategyId={strategy.id} />
        ) : (
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 text-center">
            <p className="text-blue-800 font-medium">
              💡 Les personas détaillés seront disponibles après la création de la stratégie
            </p>
            <p className="text-sm text-blue-600 mt-2">
              Sauvegardez d'abord la stratégie, puis vous pourrez ajouter des personas complets.
            </p>
          </div>
        )}
      </div>
    </div>
  )}
</div>

// Section 4: Piliers de Contenu
<div className="bg-white rounded-lg shadow-md overflow-hidden">
  <SectionHeader title="4. Piliers de Contenu" section="piliers" />
  {expandedSections.piliers && (
    <div className="p-6">
      {strategy?.id ? (
        <PilierManager strategyId={strategy.id} />
      ) : (
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 text-center">
          <p className="text-blue-800 font-medium">
            💡 Les piliers de contenu seront disponibles après la création de la stratégie
          </p>
        </div>
      )}
    </div>
  )}
</div>

// Section 7: KPIs
<div className="bg-white rounded-lg shadow-md overflow-hidden">
  <SectionHeader title="7. KPIs & Suivi" section="kpis" />
  {expandedSections.kpis && (
    <div className="p-6 space-y-6">
      {strategy?.id ? (
        <>
          {/* Manager de KPIs */}
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Gestion des KPIs</h4>
            <KPIManager strategyId={strategy.id} />
          </div>

          {/* Dashboard */}
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Tableau de Bord</h4>
            <KPIDashboard strategyId={strategy.id} />
          </div>
        </>
      ) : (
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 text-center">
          <p className="text-blue-800 font-medium">
            💡 Les KPIs et le dashboard seront disponibles après la création de la stratégie
          </p>
        </div>
      )}

      {/* Cadre de suivi (inchangé) */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Cadre de suivi
        </label>
        <textarea
          value={formData.cadre_suivi || ''}
          onChange={(e) => setFormData({ ...formData, cadre_suivi: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
        />
      </div>
    </div>
  )}
</div>
```

---

## 🚀 Tests Recommandés

### 1. Test Composants Individuels
```typescript
// Test PersonaManager
<PersonaManager strategyId={1} />

// Test PilierManager
<PilierManager strategyId={1} />

// Test KPIManager
<KPIManager strategyId={1} />

// Test Dashboard
<KPIDashboard strategyId={1} />
```

### 2. Test Intégration StrategyForm

1. **Créer nouvelle stratégie** :
   - Vérifier messages "disponible après création"
   - Sauvegarder stratégie de base

2. **Éditer stratégie existante** :
   - Vérifier affichage des nouveaux composants
   - Ajouter 2-3 personas
   - Ajouter 3-4 piliers (total 100%)
   - Ajouter 2-3 KPIs
   - Ajouter des mesures aux KPIs

3. **Dashboard KPIs** :
   - Vérifier graphiques
   - Tester filtres de période
   - Vérifier calculs de tendance
   - Vérifier barres de progression

---

## 📊 Checklist Complète

- [x] Migration SQL exécutée
- [x] Tables créées (persona, pilier_contenu, kpi, kpi_mesure)
- [x] API créée (strategyEntitiesApi.ts)
- [x] Types mis à jour (database.ts)
- [x] PersonaManager créé
- [x] PilierManager créé
- [x] KPIManager créé
- [x] KPIDashboard créé
- [ ] StrategyForm adapté (sections Personas, Piliers, KPIs)
- [ ] Types Legacy utilisés pour formData
- [ ] Tests création nouvelle stratégie
- [ ] Tests édition stratégie existante
- [ ] Tests dashboard KPIs
- [ ] Validation complète avant suppression colonnes JSONB

---

## 💡 Conseils

1. **Ne pas tout casser d'un coup** : Testez d'abord les nouveaux composants sur une stratégie test

2. **Garder JSONB temporairement** : Permet une transition progressive

3. **Utiliser Legacy Types** : Évite les erreurs TypeScript pendant la migration

4. **Tester Dashboard KPIs** : Ajoutez plusieurs mesures pour voir les graphiques

5. **Personnaliser** : Les composants sont modulaires, faciles à personnaliser

---

## 📚 Fichiers de Référence

- `components/strategies/PersonaManager.tsx`
- `components/strategies/PilierManager.tsx`
- `components/strategies/KPIManager.tsx`
- `components/strategies/KPIDashboard.tsx`
- `lib/strategyEntitiesApi.ts`
- `types/database.ts`
- `migrations/extract_strategy_entities.sql`

---

**Prêt pour l'intégration !** 🎉  
Commence par tester les composants individuels, puis intègre-les progressivement dans le StrategyForm.
