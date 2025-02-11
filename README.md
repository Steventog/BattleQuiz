# BattleQuiz

Un jeu de quiz multijoueur compétitif où les joueurs s'affrontent en temps réel.

## Description

BattleQuiz est un jeu multijoueur (2-4 joueurs) où les participants s'affrontent dans une course de quiz. Les joueurs doivent répondre rapidement et correctement aux questions pour progresser à travers 20 niveaux. Des bonus et des attaques peuvent être utilisés pour gagner l'avantage sur les adversaires.

## Technologies utilisées

- Frontend : Vue.js 3
- Backend : Node.js avec Express
- Communication temps réel : Socket.io
- Base de données : MongoDB

## Installation

### Prérequis

- Node.js (v14 ou supérieur)
- MongoDB

### Installation du serveur

```bash
cd server
npm install
```

### Installation du client

```bash
cd client
npm install
```

## Démarrage

### Serveur

```bash
cd server
npm run dev
```

### Client

```bash
cd client
npm run serve
```

## Fonctionnalités

- Système de lobby pour créer et rejoindre des parties
- 20 niveaux de quiz par partie
- Bonus et attaques stratégiques
- Interface visuelle avec progression des personnages
- Mode multijoueur en temps réel
