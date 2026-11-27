# Architecture de DataShare

## Vue d'ensemble

```mermaid
flowchart LR
    U(["👤 Utilisateur<br/>(navigateur)"])

    subgraph Docker["Docker Compose"]
        direction LR
        FE["<b>Front-end</b><br/>React + Vite<br/>(SPA servie par Nginx)"]
        BE["<b>Back-end</b><br/>API REST NestJS<br/>(Node.js)"]
        DB[("<b>PostgreSQL</b><br/>utilisateurs,<br/>métadonnées fichiers")]
        FS[/"<b>Stockage fichiers</b><br/>volume Docker<br/>/data/uploads"/]
        CRON["<b>Tâche planifiée</b><br/>@nestjs/schedule, dans le<br/>processus de l'API<br/>purge quotidienne"]
    end

    U -- "HTTPS<br/>pages HTML/JS" --> FE
    U -- "HTTPS · JSON / multipart<br/>Authorization: Bearer JWT" --> BE
    BE -- "SQL (TypeORM)<br/>réseau Docker interne" --> DB
    BE -- "lecture / écriture<br/>flux (streams)" --> FS
    CRON -. "supprime les fichiers expirés" .-> DB
    CRON -. "supprime les fichiers expirés" .-> FS
```

### Légende

| Symbole | Signification |
|---|---|
| Rectangle | Application ou service |
| Cylindre | Base de données |
| Parallélogramme | Stockage de fichiers |
| Flèche pleine | Requête synchrone |
| Flèche pointillée | Traitement planifié (asynchrone) |
| Cadre « Docker Compose » | Services lancés ensemble, sur un réseau interne |

## Rôle de chaque brique

| Brique | Rôle |
|---|---|
| **Front-end React** | Interface de l'application (maquettes Figma) : envoi, téléchargement, connexion, « Mon espace ». Stocke le JWT et l'envoie dans l'en-tête `Authorization`. Valide les saisies avant envoi. |
| **API NestJS** | Toute la logique métier : authentification, contrôle des droits, validation des entrées (taille, extensions, mots de passe, expiration), génération des tokens de téléchargement. Organisée en modules : `AuthModule`, `UsersModule`, `FilesModule`, `DownloadModule`, `StorageModule`. |
| **PostgreSQL** | Stocke les utilisateurs et les **métadonnées** des fichiers (nom, taille, token, expiration…), pas leur contenu. |
| **Stockage fichiers** | Contenu binaire des fichiers, sur disque (volume Docker). L'accès passe par une interface `StorageService` : on pourra la remplacer par AWS S3 sans toucher au reste du code. |
| **Tâche planifiée** | Exécutée par l'API elle-même (pas de service séparé). Une fois par jour, supprime les fichiers expirés (contenu + métadonnées) — US10. |

## Flux principaux

### Envoi d'un fichier (US01)

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant FE as React
    participant BE as API NestJS
    participant FS as Stockage
    participant DB as PostgreSQL

    U->>FE: choisit un fichier, expiration, mot de passe (option)
    FE->>FE: vérifie taille ≤ 1 Go, extension autorisée
    FE->>BE: POST /api/files (multipart) + JWT
    BE->>BE: vérifie JWT, taille, extension, expiration ≤ 7 j
    BE->>FS: écrit le fichier (nom interne = UUID)
    BE->>DB: INSERT métadonnées + token aléatoire + hash du mot de passe
    BE-->>FE: 201 { id, token, downloadUrl, expiresAt }
    FE-->>U: affiche le lien à copier
```

### Téléchargement via lien (US02)

```mermaid
sequenceDiagram
    actor D as Destinataire
    participant FE as React
    participant BE as API NestJS
    participant DB as PostgreSQL
    participant FS as Stockage

    D->>FE: ouvre /download/{token}
    FE->>BE: GET /api/download/{token}
    BE->>DB: cherche le fichier par token
    alt token inconnu ou expiré
        BE-->>FE: 404 / 410 + message explicite
    else valide
        BE-->>FE: 200 { nom, type, taille, expiration, protégé }
        D->>FE: clique « Télécharger » (+ mot de passe si protégé)
        FE->>BE: POST /api/download/{token} { password }
        BE->>BE: compare le mot de passe au hash
        BE->>FS: lit le fichier en flux
        BE-->>FE: 200 contenu binaire (Content-Disposition: attachment)
    end
```

## Sécurisation des échanges

- **HTTPS** entre le navigateur et l'application (terminé par un reverse proxy en production ; HTTP en local).
- **JWT** signé (HS256), durée de vie courte, envoyé dans `Authorization: Bearer …`.
- Mots de passe utilisateurs et fichiers **hashés avec bcrypt** (jamais stockés en clair).
- Token de téléchargement **aléatoire et non prévisible** (32 octets, `crypto.randomBytes`), distinct de l'identifiant en base.
- Base de données et stockage **non exposés** hors du réseau Docker : seule l'API y accède.
- **CORS** limité à l'origine du front-end.
