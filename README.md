# EcoleApp — Monorepo

## Structure
```
EcoleApp/
├── apps/
│   ├── MonNouveauProjet/   ← App étudiant/parent
│   └── teacher/            ← App professeur
└── package.json
```

## Lancer les apps

### App étudiant/parent
```bash
npm run student
```

### App professeur
```bash
npm run teacher
```

### Android
```bash
npm run student:android
npm run teacher:android
```

## Setup initial

1. Déplace `MonNouveauProjet` dans `apps/`
2. Crée l'app prof : `cd apps && npx create-expo-app teacher`
3. Depuis la racine `EcoleApp/`, utilise les commandes `npm run` ci-dessus
