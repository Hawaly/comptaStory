# 🚀 Quick Start - Entités de Stratégie

Extraction rapide de `personas`, `piliers_contenu` et `kpis` en tables séparées.

---

## ⚡ Installation (2 min)

### 1. Exécuter la Migration

**Supabase Dashboard** :
1. SQL Editor → New query
2. Copier le contenu de `migrations/extract_strategy_entities.sql`
3. Run

**Ou via psql** :
```bash
psql -U <user> -d <db> -f migrations/extract_strategy_entities.sql
```

### 2. Vérifier

```sql
SELECT * FROM persona LIMIT 3;
SELECT * FROM pilier_contenu LIMIT 3;
SELECT * FROM kpi LIMIT 3;
```

✅ **Tables créées + données migrées automatiquement !**

---

## 📊 Ce Qui Change

### Avant
```typescript
// JSONB - Complexe
strategy.personas = [
  { nom: 'Marie', besoins: '...' },
  { nom: 'Jean', besoins: '...' }
];
```

### Après
```typescript
// Table relationnelle - Simple
const personas = await getPersonas(strategyId);
// → Persona[] avec ID, FK, timestamps
```

---

## 💻 Utilisation Rapide

### Import
```typescript
import {
  getPersonas, createPersona, updatePersona, deletePersona,
  getPiliers, createPilier, updatePilier, deletePilier,
  getKPIs, createKPI, updateKPI, deleteKPI,
  getStrategyEntities, // Tout récupérer en 1 fois
} from '@/lib/strategyEntitiesApi';
```

### Exemples

#### Récupérer tout
```typescript
const { personas, piliers, kpis } = await getStrategyEntities(strategyId);
```

#### Créer un persona
```typescript
await createPersona({
  strategy_id: 1,
  nom: 'Sophie, CEO',
  age_range: '35-45 ans',
  profession: 'Entrepreneure',
  besoins: 'Outils de croissance',
});
```

#### Créer un pilier
```typescript
await createPilier({
  strategy_id: 1,
  titre: 'Expertise',
  description: 'Contenu expert',
  pourcentage_cible: 40,
  ordre: 0,
});
```

#### Créer un KPI + mesure
```typescript
const kpi = await createKPI({
  strategy_id: 1,
  nom: 'Followers Instagram',
  valeur_cible: 10000,
  unite: 'followers',
});

await addKPIMesure({
  kpi_id: kpi.id,
  date: '2024-12-03',
  valeur_mesuree: 8543,
});
```

---

## 🎯 Prochaines Étapes

### 1. Adapter le StrategyForm

**Au lieu de** :
```typescript
const [formData, setFormData] = useState({
  personas: [], // JSONB
});
```

**Faire** :
```typescript
const [personas, setPersonas] = useState<Persona[]>([]);

useEffect(() => {
  if (strategy?.id) {
    getPersonas(strategy.id).then(setPersonas);
  }
}, [strategy]);
```

### 2. Lier les Posts aux Piliers

```typescript
// Dans EditorialCalendarNew
<select value={post.pilier_id}>
  {piliers.map(p => (
    <option value={p.id}>{p.titre}</option>
  ))}
</select>
```

### 3. Dashboard KPIs (Optionnel)

```typescript
const mesures = await getKPIMesures(kpiId);
// → Afficher graphique d'évolution
```

---

## ✅ Avantages Immédiats

- ✅ **Requêtes simples** : `SELECT * FROM persona WHERE strategy_id = 1`
- ✅ **Relations** : Lier posts aux piliers
- ✅ **Tracking** : Historique des KPIs dans `kpi_mesure`
- ✅ **Performance** : Index optimisés
- ✅ **Scalable** : Pas de limite JSONB 1MB

---

## 📚 Documentation Complète

Voir `docs/STRATEGY_ENTITIES_EXTRACTION.md` pour :
- Architecture détaillée
- Tous les exemples d'API
- Vues SQL utiles
- Migration des données
- Checklist complète

---

**Prêt en 2 minutes !** 🚀
