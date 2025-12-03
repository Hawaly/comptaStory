# ✅ Corrections des Factures

## 📋 Modifications Effectuées

### 1. Numéro de Téléphone Corrigé
**Avant** : `+41 79 000 00 00`  
**Après** : `078 202 33 09`

**Fichier modifié** : `lib/companySettings.ts`

Le nouveau numéro de téléphone s'affichera sur toutes les factures générées.

### 2. Numéro TVA Supprimé
**Avant** : `TVA: CHE-000.000.000` (affiché sur les factures)  
**Après** : Aucun affichage du numéro TVA

**Fichiers modifiés** :
- `lib/companySettings.ts` - `tva_number: null`
- `lib/invoicePdfGenerator.ts` - Code d'affichage commenté

### 3. Adresse sur Deux Lignes
**Avant** : `Rue des Poudrières 69, 2000 Neuchâtel` (tout sur une ligne)  
**Après** : 
```
Rue des Poudrières 69
2000 Neuchâtel
```

**Fichier modifié** : `lib/invoicePdfGenerator.ts`

L'adresse de l'émetteur (YourStory) est maintenant affichée sur deux lignes distinctes pour plus de clarté.

### 4. Correction Orthographique
**Avant** : `Facturer à`  
**Après** : `Facturé à`

**Fichier modifié** : `lib/invoicePdfGenerator.ts`

Correction de la section destinataire avec la bonne orthographe.

Le numéro TVA ne s'affichera plus sur les factures PDF générées.

## 🔄 Impact

### Factures Futures
Toutes les **nouvelles factures** générées afficheront :
- ✅ Le bon numéro de téléphone : `078 202 33 09`
- ✅ Pas de numéro TVA (ligne supprimée)
- ✅ Adresse sur deux lignes (rue, puis ville)
- ✅ "Facturé à" correctement orthographié

### Factures Existantes
Les factures PDF déjà générées **ne seront pas modifiées** automatiquement. Elles gardent l'ancien format.

Si vous souhaitez régénérer une facture existante :
1. Ouvrir la facture concernée
2. Cliquer sur "Regénérer PDF" ou "Télécharger PDF"
3. Le nouveau PDF sera créé avec les bonnes informations

## 📝 Détails Techniques

### Structure des Informations de l'Entreprise

Les informations de l'agence sont stockées dans deux endroits :

#### 1. Base de données (`company_settings`)
Table Supabase contenant toutes les informations de l'entreprise.

#### 2. Valeurs par défaut (`lib/companySettings.ts`)
Utilisées si la base de données n'est pas accessible.

**Modifications apportées** :
```typescript
// Avant
phone: '+41 79 000 00 00',
tva_number: 'CHE-000.000.000',

// Après
phone: '078 202 33 09',
tva_number: null,
```

### Générateur de PDF

Le fichier `lib/invoicePdfGenerator.ts` génère les factures PDF.

**Section modifiée** (ligne 122-126) :
```typescript
// Code commenté - ne s'affiche plus
// if (settings.tva_number) {
//   page.drawText('TVA: ' + settings.tva_number, ...);
//   emitterY -= 20;
// }
```

## 🎯 Vérification

Pour vérifier que tout fonctionne :

1. **Créer une nouvelle facture de test**
   - Aller dans Factures → Nouvelle facture
   - Remplir les informations
   - Sauvegarder

2. **Télécharger le PDF**
   - Cliquer sur "Télécharger PDF"
   - Ouvrir le fichier

3. **Vérifier**
   - Le téléphone doit être : `078 202 33 09`
   - Aucune ligne "TVA: CHE-..." ne doit apparaître

## Informations de Contact Actuelles

Voici les informations qui s'affichent maintenant sur les factures :

```
YourStory Agency
Rue des Poudrières 69
2000 Neuchâtel
Suisse

contact@yourstory.ch
078 202 33 09

[Aucun numéro TVA]

Représenté par: Mohamad Hawaley
```

## Mise à Jour de la Base de Données

Si vous souhaitez mettre à jour les valeurs directement dans la base de données :

```sql
UPDATE company_settings 
SET 
  phone = '078 202 33 09',
  tva_number = NULL
WHERE id = 1;
```

**Note** : Les valeurs par défaut dans `companySettings.ts` servent uniquement de fallback si la DB est inaccessible.

## ✨ Autres Informations Modifiables

Si vous souhaitez modifier d'autres informations sur les factures à l'avenir, voici les champs disponibles :

| Champ | Actuel | Modifiable dans |
|-------|--------|-----------------|
| Nom agence | YourStory Agency | `company_settings` DB |
| Adresse | Rue de la Paix 15 | `company_settings` DB |
| Code postal | 2000 | `company_settings` DB |
| Ville | Neuchâtel | `company_settings` DB |
| Pays | Suisse | `company_settings` DB |
| Email | contact@yourstory.ch | `company_settings` DB |
| **Téléphone** | **078 202 33 09** | **✅ Modifié** |
| **TVA** | **NULL (supprimé)** | **✅ Modifié** |
| Représenté par | Mohamad Hawaley | `company_settings` DB |
| IBAN | CH00... | `company_settings` DB |
| QR-IBAN | CH44... | `company_settings` DB |

---

**Date de modification** : 3 décembre 2024  
**Fichiers modifiés** : 2  
**Impact** : Factures futures uniquement
