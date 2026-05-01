# LubeRight - Guide d installation general (FR)

Application full-stack pour le suivi de graissage/lubrification.
Le projet contient 3 services:

- `remote-api` (Spring Boot): lit la base source SQL Server (`Admin`, `Calender`).
- `Backend` (Spring Boot): met en cache les donnees et expose `GET /api/lubrication/latest/{name}`.
- `frontend/App_Marsa` (React + Vite): interface utilisateur.

## 1) Prerequis

- Java 17
- Maven 3.9+
- Node.js 18+
- npm 9+
- SQL Server accessible

## 2) Ce que vous devez configurer

### 2.1 `remote-api/.env`

Creer le fichier `remote-api/.env`:

```properties
DB_URL=jdbc:sqlserver://<HOST_SQL>;databaseName=<DB_SOURCE>;encrypt=true;trustServerCertificate=true
DB_USERNAME=<USER_SQL>
DB_PASSWORD=<PASSWORD_SQL>

BACKEND_API_BASE_URL=http://localhost:8081
REMOTE_SYNC_INTERVAL_MS=10800000
REMOTE_SYNC_RETRY_MS=5000
BACKEND_CONNECT_TIMEOUT_MS=3000
BACKEND_READ_TIMEOUT_MS=3000
DB_MAX_POOL_SIZE=2
DB_MIN_IDLE=0
```

`remote-api` tourne par defaut sur `http://localhost:8082`.

`REMOTE_SYNC_INTERVAL_MS=10800000` correspond a 3 heures.
`REMOTE_SYNC_RETRY_MS=5000` permet a `remote-api` de retester la connexion backend toutes les 5 secondes si le backend n est pas encore disponible.
Les valeurs `DB_MAX_POOL_SIZE` et `DB_MIN_IDLE` limitent les connexions SQL gardees par `remote-api`.

### 2.2 `Backend/.env`

Creer le fichier `Backend/.env`:

```properties
DB_URL=jdbc:sqlserver://<HOST_SQL>;databaseName=<DB_CACHE>;encrypt=true;trustServerCertificate=true
DB_USERNAME=<USER_SQL>
DB_PASSWORD=<PASSWORD_SQL>
```

Important:

- `DB_CACHE` est la base locale de cache (pas la base source).
- Le backend ne lit plus directement `remote-api` en boucle. Il reste disponible et recoit les batchs envoyes par `remote-api`.

### 2.3 Frontend Vite proxy

Verifier `frontend/App_Marsa/vite.config.ts`:

```ts
proxy: {
  '/api': {
    target: 'http://localhost:8081',
    changeOrigin: true,
  },
},
```

Si le backend ne tourne pas sur `8081`, modifier `target`.

### 2.4 CORS backend

Verifier `Backend/src/main/java/com/marsa/luberight/config/WebConfig.java`.
Par defaut:

- `http://localhost:5173`
- `http://localhost:4173`

Si votre frontend utilise une autre URL, ajouter cette URL dans `allowedOrigins(...)`.

### 2.5 HMR/ngrok (optionnel)

Dans `frontend/App_Marsa/vite.config.ts`, la section:

```ts
hmr: {
  host: '...',
  protocol: 'wss',
},
```

est utile pour un acces externe (ngrok).
En local pur, vous pouvez retirer ou adapter cette section.

## 3) Initialisation SQL

### 3.1 Base cache (obligatoire)

Executer:

- `Backend/sql/local_cache_tables.sql`

sur la base `DB_CACHE`.
Ce script cree:

- `lubrication_point_snapshot`
- `calender_snapshot`
- `sync_metadata`

### 3.2 Base source (optionnel recommande)

Executer:

- `Backend/sql/index_latest_lubrication.sql`

sur la base source (`DB_SOURCE`) pour ameliorer les performances de lecture.

## 4) Ordre de demarrage

### 4.1 Demarrer `Backend`

```bash
cd Backend
mvn spring-boot:run
```

Test rapide:

```bash
curl "http://localhost:8081/actuator/health"
```

### 4.2 Demarrer `remote-api`

```bash
cd remote-api
mvn spring-boot:run
```

Test rapide:

```bash
curl "http://localhost:8082/api/data"
```

Verifier ensuite que le cache backend est alimente:

```bash
curl "http://localhost:8081/api/lubrication/latest/K3-STR-D02"
```

### 4.3 Demarrer `frontend`

```bash
cd frontend/App_Marsa
npm install
npm run dev
```

UI dispo sur `http://localhost:5173`.

## 5) Comportement de sync (important)

Le backend reste lance normalement et expose:

- `GET /api/sync/state`: etat persiste du dernier timestamp synchronise.
- `POST /api/sync/batch`: reception des donnees envoyees par `remote-api`.

Le `remote-api` reste lance normalement, mais le job de lecture SQL Server ne s execute pas en continu:

- au demarrage, il demande l etat au backend et effectue la premiere synchronisation necessaire.
- si le backend n est pas disponible, `remote-api` reste lance et affiche `Backend is not available yet. Waiting for connection...`.
- pendant cette attente, `remote-api` reteste seulement la connexion backend toutes les `REMOTE_SYNC_RETRY_MS` millisecondes, par defaut 5 secondes.
- quand le backend redevient disponible, `remote-api` reprend automatiquement et lance la synchronisation sans redemarrage manuel.
- ensuite, il attend `REMOTE_SYNC_INTERVAL_MS` avant chaque nouveau cycle. La valeur par defaut est `10800000` ms, soit 3 heures.
- apres la premiere synchronisation, les requetes SQL utilisent `updatedAfter` pour lire seulement les nouvelles lignes `Calender` et les snapshots dont le timestamp source est plus recent.
- le processus `remote-api` ne s arrete pas et ne redemarre pas toutes les 3 heures; seul le job de synchronisation est planifie.

Le flux historique renseigne toutes les colonnes actuellement definies dans `calender_snapshot`:
`name`, `timestamp_value`, `actual_interval`, `lubricator`, `planned_amount`, `actual_amount`.

## 6) Verification fonctionnelle conseillee

### Cas A: changement planifie

1. Ajouter ou mettre a jour une ligne `dbo.Calender` avec un `TimeStamp` plus recent.
2. Attendre un cycle (`REMOTE_SYNC_INTERVAL_MS`) ou redemarrer `remote-api` pour forcer un cycle de demarrage.
3. Appeler `GET /api/lubrication/latest/{name}` sur le backend.
4. Verifier que `plannedAmount`/`interval` sont mis a jour.

Note: la synchronisation incrementale actuelle utilise `dbo.Calender.TimeStamp` comme repere. Si la base source contient des mises a jour importantes dans d autres tables sans changement de `TimeStamp`, il faut ajouter une colonne de suivi equivalent dans la requete source.

### Cas B: changement reel

1. Inserer une ligne dans `dbo.Calender` avec `ActualAmount` et `TimeStamp` recent.
2. Verifier la mise a jour de `actualAmount` et `timestamp` via le backend.

## 7) Build production

Backend:

```bash
cd Backend
mvn -DskipTests clean package
```

Remote API:

```bash
cd remote-api
mvn -DskipTests clean package
```

Frontend:

```bash
cd frontend/App_Marsa
npm run build
```


## 8) Workflow Overview

# Data Source (SQL Server)
   -Stores the main lubrication data.

# remote-api Service
   -Reads data from SQL Server.
   -Runs one sync at startup, then one sync every 3 hours by default.
   -Sends new data to the backend through /api/sync/batch.

# Backend Service (with Local DB)
   -Receives sync batches from remote-api.
   -Stores this data in its own local cache database (DB_CACHE).
   -Exposes REST endpoints (e.g., /api/lubrication/latest/{name}) for the frontend.
   -Serves data to the frontend from its local cache, not directly from remote-api or SQL Server.

# Frontend (React/Vite)
   -Requests lubrication data from the backend.
   -Displays up-to-date lubrication information to users.
