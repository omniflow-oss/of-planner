Parfait 👌 Voici le **PRD complet v2.9** — consolidé et prêt pour développement — incluant **toutes les fonctionnalités précédentes** (double vue, snap journalier, allocations, superpositions) **et la nouvelle fonctionnalité d’ajout par clic sur zone vide avec choix du nombre de jours**.
Il est structuré pour être directement exploitable dans une implémentation **Nuxt + Nuxt UI + Pinia**.

---

# Capacity Planner — PRD v2.9

*(Vue People / Vue Projects, allocation fractionnaire, snap journalier, superpositions, création par clic)*

---

## 1. 🎯 Objectif

Créer un **planificateur visuel** pour organiser les **assignations entre personnes et projets**, jour par jour.
Le système doit permettre :

* De visualiser les disponibilités et allocations (pleines ou partielles),
* De créer des assignations directement depuis la timeline (clic ou bouton),
* De déplacer/redimensionner les barres par **pas de jour complet**,
* D’afficher les deux perspectives : **People View** et **Project View**.

---

## 2. 🧭 Modes de visualisation

| Vue              | Ligne principale | Sous-lignes         | Ligne spéciale           |
| ---------------- | ---------------- | ------------------- | ------------------------ |
| **People View**  | Personne         | Projets assignés    | ➕ “Ajouter un projet”    |
| **Project View** | Projet           | Personnes assignées | ➕ “Ajouter une personne” |

* Le clic sur l’onglet **People** ↔ **Projects** change la hiérarchie, tout en gardant **zoom, Today, scroll**.
* Les deux vues utilisent le **même store** (`assignments[]`) : aucune duplication.

---

## 3. ⚙️ Modèle de données

```ts
export type Allocation = 1 | 0.75 | 0.5 | 0.25;

export type Person = { id: string; name: string; avatar?: string | null };
export type Project = { id: string; name: string; color?: string | null; emoji?: string | null };

export type Assignment = {
  id: string;
  person_id: string;
  project_id: string;
  start: string; // ISO UTC 00:00
  end: string;   // ISO UTC 00:00, inclusif
  allocation: Allocation; // par jour
  subtitle?: string | null;
};

export type ViewMode = 'person' | 'project';

export type ViewState = {
  mode: ViewMode;
  start: string;
  days: number;
  px_per_day: number; // 24–64
  selected_id: string | null;
};

export type PlannerState = {
  people: Person[];
  projects: Project[];
  assignments: Assignment[];
  view: ViewState;
  meta: { version: '2.9.0' };
};
```

---

## 4. ✏️ Création d’une assignation

### 4.1 Depuis la ligne “➕ Ajouter …”

* Clic sur la **dernière sous-ligne** :

  * **People View** → “➕ Ajouter un projet”
  * **Project View** → “➕ Ajouter une personne”
* Ouvre une **modal complète** :

  ```
  [Sélection projet/personne existant(e)] ou [Créer nouveau/elle]
  [Date début]  [Date fin]
  [Allocation ▼ 1 | 0.75 | 0.5 | 0.25]
  [Sous-titre optionnel]
  [Valider]
  ```

### 4.2 Clic sur une **zone vide** de la timeline

* **Détecte le jour cliqué** (snap au jour) :

  ```ts
  dayIndex = Math.round((x - trackLeft) / px_per_day);
  start = addDays(view.start, dayIndex);
  ```
* **Quick-Create Popover** :

  * `Durée (jours)` → champ numérique (min 1, défaut 5)
  * `Allocation` → radio (1 / 0.75 / 0.5 / 0.25)
  * Si hors sous-ligne → demande **entité complémentaire** :

    * People View → sélectionner ou créer projet
    * Project View → sélectionner ou créer personne
  * Boutons : **Créer**, **Annuler**

**Calcul automatique :**

```ts
end = addDays(start, duration_days - 1);
createAssignment({ person_id, project_id, start, end, allocation });
```

### 4.3 Validation

* Dates valides, `end ≥ start`
* Entités connues ou créées
* Durée ≥ 1
* Allocation ∈ {1, 0.75, 0.5, 0.25}

---

## 5. 🎛️ Interaction sur les barres

### Déplacement

* **Granularité** : 1 jour → snap horizontal au jour le plus proche.
* **Durée** et **allocation** inchangées.

### Redimensionnement

* **Granularité** : 1 jour.
* **Clamp** : `start ≤ end`.

### Allocation

* Menu contextuel ou dialog :

  ```
  Changer allocation :
  • 1 jour plein
  • 0,75 j
  • 0,5 j
  • 0,25 j
  ```
* Mise à jour immédiate + autosave.

### Superposition

* **Autorisée** (plusieurs barres peuvent se recouvrir le même jour / sous-ligne).
* Gestion visuelle par **empilement vertical** (“lanes”).
* Option future : alerte si somme allocations > 1.

---

## 6. 🧩 Rendu visuel (timeline)

| Élément                     | Détails                                                                         |
| --------------------------- | ------------------------------------------------------------------------------- |
| **En‑tête timeline**        | Deux lignes: `Mois Année` (haut), `D MMM` (bas). Collant et synchronisé au scroll. |
| **Grille jour**             | Colonne = 1 jour; lignes subtiles `slate-100`, semaine `slate-200`.             |
| **Today marker**            | Ligne verticale accentuée `amber-500/90`.                                       |
| **Barres (Assignments)**    | Couleur = projet; nom + badge d’allocation; hauteur 28px; bords arrondis.       |
| **Subrows**                 | Encadrées, fond léger, hauteur minimale 44px; empilement lanes 30px.            |
| **Dernière sous-ligne**     | “➕ Ajouter …” visible, fond gris clair, icône ➕ à gauche.                       |
| **Popover création rapide** | Flèche ancrée à la cellule, form compact, focus sur durée.                      |
| **Stacking**                | Lanes superposées avec léger décalage vertical.                                 |
| **Colonne gauche collante** | Colonne des libellés/actions (240px) est `sticky left-0` pendant le scroll.     |
| **Header collant**          | Barre d’entête de l’app `sticky top-0` avec flou discret.                       |

Design condensé (slick & pro)
- Typo compacte par défaut: base ~13.5px; éléments UI en `text-xs`/`[11px]`.
- Contrôles compacts: `px-2 py-1` pour inputs/boutons; puces de jour réduites.
- Zoom par défaut: `56 px/jour`.
- Ombres légères sur les barres (`.bar-shadow`) et conteneurs importants.

---

## 7. 🧠 UX globale

### Comportement global

| Action                | Effet                         |
| --------------------- | ----------------------------- |
| Clic vide dans subrow | Popover création rapide       |
| Clic sur “Ajouter …”  | Modal complète                |
| Déplacement / Resize  | Snap au jour                  |
| Clic sur barre        | Ouvre modal d’édition         |
| Double-clic           | Mode édition rapide           |
| Flèches clavier       | Déplace d’un jour             |
| Shift + flèches       | Déplace de 5 jours            |
| Suppr                 | Supprime                      |
| Tab People / Projects | Change vue, garde zoom/scroll |
| Ouverture par défaut  | Affiche semaine‑2, semaine‑1, semaine courante, 4 prochaines semaines |

---

## 8. 🔒 Règles métier

| Règle                                         | Détail |
| --------------------------------------------- | ------ |
| Une personne ↔ plusieurs projets (OK)         |        |
| Un projet ↔ plusieurs personnes (OK)          |        |
| Overlaps OK, empilés en lanes                 |        |
| Allocation fractionnaire (1, 0.75, 0.5, 0.25) |        |
| Snap = 1 jour                                 |        |
| Durée minimale = 1 jour                       |        |
| Données persistées dans localStorage          |        |
| Import/export JSON complet (avec allocation)  |        |

---

## 9. 💾 Persistance

* Autosave (`localStorage["planner_state_v2_9"]`, throttle 300 ms)
* Import/export JSON via boutons header
* Zod schema validation et migration automatique (ajout `allocation` et `duration`)

---

## 10. 📊 Insights Drawer

* Vue **People** : total jours assignés, moyenne d’allocation, nb. projets actifs.
* Vue **Projects** : total jours actifs, moyenne d’allocation, nb. personnes actives.
* Export CSV.
* Calcul temps réel sur viewport visible.

---

## 11. ⚙️ Performance & Architecture

### Stack

* **Nuxt 3 SPA**
* **Nuxt UI** (popover, dialog, tabs, inputs)
* **Pinia** (store principal)
* **dayjs** (dates)
* **@vueuse/core** (autosave, event listeners)
* **zod** (validation)

### Structure

```
/types/domain.ts
/stores/planner.ts
/composables/
  useLanes.ts
  useDate.ts
  useCreatePopover.ts
/components/
  PlannerHeader.vue
  SidebarPeople.vue
  SidebarProjects.vue
  TimelineGrid.vue
  PersonRow.vue
  ProjectRow.vue
  AssignmentBar.vue
  CreatePopover.vue
  CreateModal.vue
  EditDialog.vue
  InsightsDrawer.vue
/pages/planner.vue
```

### Performance

* Virtualisation des rows (vueuse/useVirtualList)
* Scroll synchronisé par transform (GPU)
* contain: layout paint
* rAF pour déplacements

---

## 12. ✅ Critères d’acceptation

| # | Critère                                                                   |
| - | ------------------------------------------------------------------------- |
| 1 | Clic sur zone vide → popover création rapide (jour cliqué, durée saisie). |
| 2 | Clic sur “Ajouter …” → modal complète.                                    |
| 3 | Déplacement / resize par pas de 1 jour.                                   |
| 4 | Allocation fractionnaire 1/0.75/0.5/0.25.                                 |
| 5 | Superpositions autorisées.                                                |
| 6 | Bascule People / Projects garde le contexte.                              |
| 7 | Export / Import conserve tout.                                            |
| 8 | Aucune erreur console.                                                    |
| 9 | Colonne gauche collante visible pendant le scroll horizontal.             |
| 10 | En‑têtes collants (app + timeline) synchronisés avec le scroll horizontal. |
| 11 | Style condensé appliqué (largeur colonne 240px, barres 28px, lanes 30px, zoom 56 px/jour). |
| 12 | Au chargement: semaine‑2 → semaine courante → 4 semaines suivantes visibles. |

---

## 13. 🔬 Scénarios de test

| Test                     | Action                                       | Résultat attendu        |
| ------------------------ | -------------------------------------------- | ----------------------- |
| Création rapide          | Clic jour N (People View, Projet B), durée=4 | Barre [N..N+3], alloc 1 |
| Création hors sous-ligne | Clic main row → choix projet, durée=2        | Assignation créée       |
| Fractionnaire            | Allocation=0.5                               | Badge “½” visible       |
| Déplacement              | Drag barre → +2 jours                        | Start +2, End +2        |
| Resize                   | Étire droite → +1 jour                       | End +1                  |
| Superposition            | Deux barres même jour                        | Empilées verticalement  |
| Switch view              | Project View affiche même résultat           |                         |
| Export/Import            | Données identiques rechargées                |                         |
| Performance              | 50 personnes × 365 jours fluide              |                         |

---

## 14. 📍 Roadmap

| Version | Feature                 | Description                            |
| ------- | ----------------------- | -------------------------------------- |
| 3.0     | Multi-select            | Déplacer plusieurs barres              |
| 3.1     | Undo/Redo               | Historique local                       |
| 3.2     | Surcharges visuelles    | Couleur d’avertissement si > 1 j total |
| 3.3     | Calendrier ouvré        | Weekends non assignables               |
| 3.4     | Hauteur proportionnelle | Représente allocation visuellement     |
| 3.5     | Liaisons dépendantes    | Liens visuels entre barres liées       |
