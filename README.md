# TontinePlus 🌿

Application mobile de gestion de tontines (groupes d'épargne solidaire) pour l'Afrique francophone. Développée avec React Native / Expo, entièrement **hors ligne** — vos données ne quittent jamais votre appareil.

---

## Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Installation](#installation)
- [Structure du projet](#structure-du-projet)
- [Écrans](#écrans)
- [Base de données](#base-de-données)
- [Design system](#design-system)
- [Sauvegarde & restauration](#sauvegarde--restauration)
- [Roadmap backend](#roadmap-backend)

---

## Aperçu

Une **tontine** est un système d'épargne rotatif où chaque membre cotise régulièrement et reçoit la cagnotte à tour de rôle. TontinePlus digitalise ce processus traditionnel avec :

- Suivi des cotisations en temps réel
- Gestion multi-groupes
- Calendrier de rotation des bénéficiaires
- Rapports et statistiques
- Sécurité PIN + biométrie
- Fonctionne sans connexion internet

---

## Fonctionnalités

### Gestion des groupes
- Créer plusieurs tontines avec fréquences différentes (quotidienne, hebdomadaire, mensuelle, personnalisée)
- Devises multiples : XOF, XAF, EUR, USD, GNF, MRU
- 3 modes de sélection des bénéficiaires : **Manuel**, **Automatique** (ordre d'inscription), **Aléatoire** (tirage au sort)
- Suivi du taux de collecte par cycle

### Gestion des membres
- Fiche membre : photo, téléphone, profession, adresse
- Statut de cotisation en temps réel (payé / partiel / impayé / en attente)
- Historique complet des paiements par membre

### Enregistrement des paiements
- Paiement complet ou partiel
- Clavier numérique intégré pour montants personnalisés
- Barre de progression pour paiements partiels
- Reçu automatique généré (numéro REC-XXXXX)
- Accessible depuis le dashboard (sélection groupe → membre → cotisation) ou depuis un groupe

### Rotation des bénéficiaires
- Calendrier automatique selon la fréquence du groupe
- Montant distribué = cotisation × nombre de membres (figé à la création)
- Gestion des cycles : avance automatique, marquage du bénéficiaire payé
- Protection : fin de tontine détectée (statut → `completed`)

### Dashboard
- Solde du mois, taux de collecte global
- Graphe mensuel interactif (6 derniers mois, tooltip tactile)
- Prochain bénéficiaire et activité récente
- Actions rapides

### Rapports & export
- Statistiques par période (mois / trimestre / année)
- Export **JSON** (sauvegarde complète restaurable)
- Export **CSV** (cotisations pour tableur)
- Taux de collecte par groupe avec code couleur

### Sécurité
- Code PIN à 4 chiffres (hashé, stocké dans SecureStore)
- Authentification biométrique (Face ID / empreinte)
- Verrouillage de l'application (données conservées)
- Changement de PIN avec vérification de l'ancien

---

## Stack technique

| Catégorie | Technologie | Version |
|---|---|---|
| Framework | Expo | 54.0.4 |
| Navigation | Expo Router (file-based) | 4.0.22 |
| UI | React Native | 0.76.9 |
| Base de données | expo-sqlite | 15.2.14 |
| État global | Zustand | 4.5.2 |
| Formulaires | React Hook Form + Zod | 7.54 / 3.24 |
| Stockage sécurisé | expo-secure-store | 14.2.4 |
| Authentification | expo-local-authentication | 15.0.2 |
| Notifications | expo-notifications | 0.29.14 |
| Icônes | @expo/vector-icons (Ionicons) | 14.0.4 |
| Dates | date-fns | 4.1.0 |
| TypeScript | strict mode | 5.6 |

---

## Architecture

```
TontinePlus/
├── app/                          # Écrans (Expo Router file-based)
│   ├── _layout.tsx               # Root layout (init DB + auth)
│   ├── index.tsx                 # Redirecteur (onboarding/login/tabs)
│   ├── (auth)/                   # Flux authentification
│   │   ├── onboarding.tsx
│   │   ├── register.tsx
│   │   └── login.tsx
│   ├── (tabs)/                   # Navigation principale
│   │   ├── index.tsx             # Dashboard
│   │   ├── groups.tsx            # Liste des groupes
│   │   ├── calendar.tsx          # Agenda
│   │   ├── reports.tsx           # Rapports
│   │   └── settings.tsx          # Paramètres
│   ├── group/
│   │   ├── [id].tsx              # Détail groupe (membres / cotisations / bénéficiaires)
│   │   └── create.tsx
│   ├── member/
│   │   ├── [id].tsx
│   │   └── create.tsx
│   ├── payment/
│   │   └── record.tsx            # Enregistrement paiement
│   ├── settings/
│   │   ├── backup.tsx
│   │   ├── change-pin.tsx
│   │   └── profile.tsx
│   └── notifications.tsx
│
└── src/                          # Logique métier
    ├── types/index.ts            # Tous les types TypeScript
    ├── constants/theme.ts        # Design system (couleurs, espacements)
    ├── database/database.ts      # Init SQLite + migrations
    ├── repositories/index.ts     # Accès données (CRUD)
    ├── services/
    │   ├── auth.service.ts       # PIN, biométrie, session
    │   ├── contribution.service.ts # Cycles, rotation, paiements
    │   ├── backup.service.ts     # Export/import JSON & CSV
    │   └── notification.service.ts # Notifications planifiées
    ├── stores/index.ts           # Stores Zustand (état global)
    ├── hooks/
    │   ├── useTheme.ts           # Thème light/dark
    │   └── useCurrency.ts        # Formatage montants
    └── components/common/        # Composants réutilisables
        ├── AppButton.tsx
        ├── AppInput.tsx          # Accepte string (Ionicons) ou ReactNode
        ├── AppCard.tsx
        ├── AppText.tsx
        ├── Avatar.tsx
        ├── Badge.tsx
        ├── EmptyState.tsx
        ├── LoadingSpinner.tsx
        ├── ProgressBar.tsx
        ├── ScreenHeader.tsx
        ├── SectionTitle.tsx
        └── StatusPill.tsx        # paid / partial / unpaid / pending
```

### Pattern de données

```
Local First — tout écrit en SQLite d'abord
     ↓
Zustand stores — état réactif en mémoire
     ↓
Composants React Native — UI
```

Les repositories parlent à SQLite. Les stores appellent les repositories et exposent l'état aux composants. Aucune dépendance réseau.

---

## Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Expo CLI : `npm install -g expo-cli`
- iOS : Xcode 15+ ou simulateur
- Android : Android Studio ou émulateur

### Démarrage rapide

```bash
# 1. Cloner / décompresser le projet
cd TontinePlus

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npx expo start

# 4. Choisir la plateforme
#    → Appuyer sur  i  pour iOS
#    → Appuyer sur  a  pour Android
#    → Scanner le QR code avec Expo Go
```

### Build natif (recommandé pour la production)

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

> **Note :** `npx expo start` suffit pour le développement. Le build natif est requis pour les fonctionnalités comme la biométrie et les notifications en production.

---

## Écrans

| Écran | Chemin | Description |
|---|---|---|
| Onboarding | `/(auth)/onboarding` | 4 slides de présentation |
| Inscription | `/(auth)/register` | Nom, téléphone, PIN |
| Connexion | `/(auth)/login` | PIN + biométrie |
| Dashboard | `/(tabs)/` | Vue globale, graphe mensuel |
| Groupes | `/(tabs)/groups` | Liste avec recherche |
| Agenda | `/(tabs)/calendar` | Réunions, bénéficiaires, cotisations |
| Rapports | `/(tabs)/reports` | Stats par période + export |
| Paramètres | `/(tabs)/settings` | Thème, devise, sécurité |
| Détail groupe | `/group/[id]` | Membres / Cotisations / Bénéficiaires |
| Créer groupe | `/group/create` | Formulaire complet |
| Fiche membre | `/member/[id]` | Stats + historique |
| Ajouter membre | `/member/create` | Formulaire + photo |
| Paiement | `/payment/record` | Flux en 3-4 étapes |
| Notifications | `/notifications` | Centre de notifications |
| Sauvegarde | `/settings/backup` | Export JSON/CSV + import |
| Changer PIN | `/settings/change-pin` | 3 étapes avec shake animation |
| Profil | `/settings/profile` | Modifier nom, téléphone, photo |

---

## Base de données

SQLite local via `expo-sqlite` v15. Schéma en migrations versionnées.

### Tables

| Table | Description |
|---|---|
| `users` | Profil unique de l'utilisateur |
| `settings` | Préférences (devise, langue, thème) |
| `groups` | Groupes de tontine |
| `members` | Membres par groupe |
| `contributions` | Cotisations avec contrainte UNIQUE (group_id, member_id, cycle) |
| `beneficiaries` | Calendrier de rotation |
| `meetings` | Réunions planifiées |
| `app_notifications` | Centre de notifications local |
| `backups` | Historique des sauvegardes |
| `migrations` | Versionnage du schéma |

### Migrations

| Version | Contenu |
|---|---|
| V1 | Schéma complet + index |
| V2 | Table backups |
| V3 | Contrainte UNIQUE sur contributions + nettoyage doublons |

---

## Design system

Palette inspirée de l'Afrique de l'Ouest :

| Rôle | Couleur | Usage |
|---|---|---|
| Primary | `#0A3D2E` Vert émeraude | Headers, actions principales |
| Accent | `#D4AF37` Or africain | Montants, bénéficiaires, accents |
| Success | `#10B981` | Cotisations payées |
| Warning | `#F59E0B` | Cotisations partielles |
| Error | `#EF4444` | Retards, suppressions |
| Neutral | `#6B7280` | Textes secondaires |

Modes **Light** et **Dark** supportés, basculement automatique ou manuel.

---

## Sauvegarde & restauration

### Export JSON
Sauvegarde complète chiffrée de toutes les données (utilisateur, groupes, membres, cotisations, bénéficiaires, paramètres). Partageable via AirDrop, WhatsApp, email, etc.

```bash
# Format du fichier
tontineplus_backup_YYYY-MM-DD.json
```

### Export CSV
Cotisations uniquement, compatible Excel / Google Sheets.

### Import
Restauration depuis un fichier `.json` — remplace toutes les données actuelles après confirmation.

> ⚠️ Sauvegardez régulièrement. En l'absence de backend, la sauvegarde JSON est le seul moyen de récupérer vos données en cas de perte du téléphone.

---

## Roadmap backend

L'app est conçue **Local First** et fonctionne sans serveur. Une couche backend est prévue pour ajouter :

- **Synchronisation multi-appareils** — accès depuis plusieurs téléphones
- **Notifications push** — alertes pour tous les membres du groupe
- **Paiements Mobile Money** — Orange Money, MTN, Wave (intégration CinetPay)
- **Rapports PDF** — génération serveur-side
- **Invitations membres** — rejoindre un groupe via lien ou code
- **Backup cloud automatique** — chiffré, quotidien

Le code mobile ne changera pas en profondeur : un `SyncService` sera ajouté pour envoyer les mutations locales vers l'API dès que le réseau est disponible.

---

## Contribuer

```bash
# TypeScript strict — pas d'any non justifié
# Imports relatifs uniquement (pas d'alias @/)
# Composants : StyleSheet.create() hors du render
# Stores Zustand : create<State>((set, get) => ...)
# Toute mutation DB passe par les repositories
```

---

## Licence

MIT — Fait avec ❤️ pour l'Afrique francophone.