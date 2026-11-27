# DataShare

Prototype (MVP) d'une plateforme de transfert de fichiers par lien temporaire,
destinée aux freelances et aux petites entreprises.

> README provisoire : il sera complété (fonctionnalités, tests, déploiement) au fil du projet.

## Stack

| Partie | Technologie |
|---|---|
| Front-end | React 19 + Vite + TypeScript, React Router |
| Back-end | NestJS 11 (Node.js 24) + TypeScript |
| Base de données | PostgreSQL 17 (TypeORM) |
| Stockage des fichiers | Système de fichiers local |

## Structure

```
backend/    API REST NestJS
frontend/   application React
docs/       architecture, modèle de données, contrat OpenAPI
```

## Prérequis

- Node.js 24 (`nvm use` lit le fichier `.nvmrc`)
- Docker et Docker Compose

## Lancer en développement

```bash
cp .env.example .env          # puis adapter les valeurs
docker compose up -d db       # base PostgreSQL

cd backend && npm install && npm run start:dev    # API sur http://localhost:3000/api
cd frontend && npm install && npm run dev         # front sur http://localhost:5173
```

- Documentation interactive de l'API : http://localhost:3000/api/docs
- État de l'API : http://localhost:3000/api/health

## Documentation

- [Architecture](docs/architecture.md)
- [Modèle de données](docs/modele-de-donnees.md)
- [Contrat d'interface OpenAPI](docs/openapi.yaml)
