# Firestore Emulator Integration - Development Plan

## Overview
Implement a fully local development environment using Firestore Emulator to enable offline development, reduce cloud costs, and speed up the feedback loop.

---

## Phase 1: Docker Compose Setup

### Update `docker-compose.yaml`

Add the following services and configuration:

```yaml
services:
  firestore-emulator:
    image: google/cloud-sdk:alpine
    command: >
      gcloud emulators firestore start 
      --host-port=0.0.0.0:8080
      --project=kebab-local-dev
    ports:
      - "8080:8080"    # Firestore emulator API
      - "4000:4000"    # Emulator UI
    volumes:
      - firestore-data:/data
    environment:
      - FIRESTORE_EMULATOR_PROJECT_ID=kebab-local-dev

  kebab-app:
    build: .
    image: kebab-order-app
    ports:
      - "8000:8000"
    environment:
      - FIRESTORE_EMULATOR_HOST=firestore-emulator:8080
      - GOOGLE_CLOUD_PROJECT=kebab-local-dev
      - PORT=8000
    depends_on:
      - firestore-emulator
    restart: unless-stopped

volumes:
  firestore-data:
    driver: local
```

**Key Changes:**
- Add `firestore-emulator` service using Google Cloud SDK
- Configure ports: `8080` (emulator API), `4000` (emulator UI)
- Add named volume `firestore-data` for persistence
- Update `kebab-app` to depend on emulator and use correct env vars

---

## Phase 2: Backend Modifications

### Update `main.py`

Modify the Firestore client initialization to support emulator:

```python
# --- Firestore Client ---
# Initialize Firestore client
# When FIRESTORE_EMULATOR_HOST is set, the client automatically connects to emulator
db = firestore.Client(project=os.environ.get('GOOGLE_CLOUD_PROJECT', 'kebab-local-dev'))
orders_collection = db.collection('orders')
```

**Current code (lines 36-37):**
```python
db = firestore.Client()
orders_collection = db.collection('orders')
```

**New code:**
```python
project_id = os.environ.get('GOOGLE_CLOUD_PROJECT', 'kebab-local-dev')
db = firestore.Client(project=project_id)
orders_collection = db.collection('orders')
```

**Note:** The Firestore Python client automatically detects `FIRESTORE_EMULATOR_HOST` environment variable and connects to the emulator instead of production Firestore.

---

## Phase 3: Environment Configuration

### Create `.env.local`

```bash
# Local Development Settings
# These settings are used when running locally with docker-compose

# Firestore Emulator Configuration
FIRESTORE_EMULATOR_HOST=firestore-emulator:8080
GOOGLE_CLOUD_PROJECT=kebab-local-dev

# Application Port
PORT=8000
```

### Update `.gitignore`

Add to existing `.gitignore`:
```
# Local environment files
.env.local
.env.*.local

# Firestore emulator data (if not using named volumes)
.firestore/
```

---

## Phase 4: Documentation Updates

### Update `AGENTS.md`

Add new section after "Environment Setup" (Section 10):

```markdown
### 10.4 Local Development with Firestore Emulator

For fully local development without cloud dependencies:

**Prerequisites:**
- Docker and Docker Compose installed

**Start the development environment:**
\`\`\`bash
docker-compose up
\`\`\`

This starts three services:
1. **Firestore Emulator** (port 8080) - Local Firestore database
2. **Emulator UI** (port 4000) - Web interface to view/edit data
3. **Kebab App** (port 8000) - Full application stack

**Access points:**
- Application: http://localhost:8000
- Emulator UI: http://localhost:4000
- Firestore API: http://localhost:8080

**Data Persistence:**
- Emulator data persists in Docker volume `firestore-data`
- Data survives container restarts
- To reset data: \`docker-compose down -v\`

**Environment Variables:**
The emulator is activated automatically via \`FIRESTORE_EMULATOR_HOST\` env var.
When this variable is NOT set (production), the app uses real Firestore.
```

---

## What You'll Get

### New Development Workflow

```bash
# Start everything (app + backend + Firestore emulator)
docker-compose up

# Access:
# - App: http://localhost:8000
# - Emulator UI: http://localhost:4000 (view/edit data directly)
```

### Benefits

- ✅ **Works offline** - No internet required after initial Docker image pull
- ✅ **No cloud costs** during development
- ✅ **Fast feedback loop** - Local data operations are instant
- ✅ **Data persists** between restarts (saved to Docker volume)
- ✅ **Zero production impact** - Cloud Build deployment unaffected
- ✅ **Easy debugging** - View raw data via Emulator UI

### Safety Guards

1. **Emulator isolation**: Only activates when `FIRESTORE_EMULATOR_HOST` is set
2. **Production safety**: Cloud Run won't have this env var, so it uses real Firestore
3. **Git safety**: `.env.local` is git-ignored to prevent committing local settings
4. **Project isolation**: Uses separate project ID (`kebab-local-dev`) to avoid conflicts

---

## Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `docker-compose.yaml` | Add emulator service + update app config | ~25 lines |
| `main.py` | Update Firestore initialization | 2 lines |
| `.env.local` | Create new file | 8 lines |
| `.gitignore` | Add env files | 5 lines |
| `AGENTS.md` | Add emulator documentation | ~30 lines |

---

## Verification Steps

After implementation, verify:

1. [ ] `docker-compose up` starts all services without errors
2. [ ] App accessible at http://localhost:8000
3. [ ] Emulator UI accessible at http://localhost:4000
4. [ ] Orders created in app appear in Emulator UI
5. [ ] Data persists after `docker-compose down` and `docker-compose up`
6. [ ] Production deployment (via Cloud Build) still uses real Firestore

---

## Rollback Plan

If issues occur:

1. Revert `docker-compose.yaml` to previous version
2. Revert `main.py` Firestore initialization
3. Delete `.env.local` and `.gitignore` changes
4. Remove Docker volume: `docker volume rm kebabmanager_firestore-data`

---

**Status:** Ready for implementation  
**Estimated Time:** 15 minutes  
**Risk Level:** Low (isolated to local development)
