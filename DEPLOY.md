# B0T Platform - Coolify Deployment Guide

## Quick Start

**Status:** ✅ Ready for Coolify deployment
- Build verified: No TypeScript errors
- Standalone output: Generated and tested
- Docker image: Multi-stage, production-ready
- Worker process: Configurable and scalable

---

## Git Workflow

### Branch Strategy

Your deployment uses two branches:

```
upstream/main (public b0t repository)
    ↓
origin/main (your fork - always synced)
    ↓
origin/deploy/bot (production branch - Coolify deploys from here)
```

### Syncing with Upstream Updates

```bash
# Pull latest from upstream b0t repository
git fetch upstream
git checkout main
git merge upstream/main
git push origin main

# Update your production branch
git checkout deploy/bot
git merge main
git push origin deploy/bot
```

Coolify will automatically detect the push to `deploy/bot` and trigger a new deployment.

### Local Workflow

1. **Author workflows locally** - Use Claude Code on your machine
2. **Export workflow** - Save the workflow configuration
3. **Deploy on production** - Import the workflow via Coolify UI or API

---

## Deployment Architecture

### Services

| Service | Purpose | Replicas |
|---------|---------|----------|
| `app` | Next.js server + API | 1+ (configurable in Coolify) |
| `worker` | BullMQ workflow processor | 1-5 (configurable) |
| `postgres` | Database | 1 (managed by Coolify) |
| `redis` | Queue & cache | 1 (managed by Coolify) |

### How It Works

1. **App receives request** → Stores in PostgreSQL, queues in Redis
2. **Worker processes workflows** → Executes tasks, updates database
3. **Multiple workers** → Process 50+ workflows concurrently
4. **Graceful shutdown** → Waits 30s for active workflows to finish

---

## Coolify Setup

### 1. Configure Secrets in Coolify

Set these in Coolify's secrets management:

```
DATABASE_URL=postgresql://postgres:{{DB_PASSWORD}}@postgres:5432/b0t_prod
REDIS_URL=redis://redis:6379

AUTH_SECRET={{GENERATE_RANDOM_32_BYTES}}
ENCRYPTION_KEY={{GENERATE_RANDOM_32_BYTES}}

OPENAI_API_KEY=sk-{{YOUR_KEY}}
ANTHROPIC_FOUNDRY_API_KEY={{YOUR_KEY}}
ANTHROPIC_FOUNDRY_BASE_URL=https://{{RESOURCE}}.services.ai.azure.com/anthropic/
```

**Generate random secrets:**
```bash
openssl rand -base64 32
```

### 2. Create Docker Build

In Coolify:
- **Repository:** Your fork URL (`https://github.com/entranoweb/social-cat.git`)
- **Branch:** `deploy/bot` (NOT main)
- **Dockerfile:** `Dockerfile` (in root)
- **Build context:** `/`

### 3. Configure Services

**App Service:**
- **Build:** From Dockerfile
- **Command:** `node server.js` (default)
- **Port:** 3123
- **Health check:** `GET /api/health` (built-in)
- **Replicas:** 1 (or more for high availability)

**Worker Service:**
- **Build:** From Dockerfile
- **Command:** `node dist/worker.js`
- **No port exposed** (internal service)
- **Replicas:** 1-5 (based on workflow load)
- **Environment:** `WORKFLOW_CONCURRENCY=50`

### 4. Database Initialization

Run once before first deployment:

```bash
npm run db:push
npm run db:seed
```

In Coolify, add as **pre-deployment command** or **init container**:
```
npm run db:push && npm run db:seed
```

---

## Testing Deployment

### 1. Build Locally

```bash
npm run build

# Verify standalone output exists
ls -la .next/standalone/server.js
```

### 2. Test with Docker

```bash
# Build image
docker build -t b0t:latest .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up
```

### 3. Test Services

**App:**
```bash
curl http://localhost:3123
curl http://localhost:3123/api/health
```

**Database:**
```bash
psql postgresql://postgres:postgres@localhost:5432/b0t_prod
```

### 4. Monitor Logs

```bash
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f worker
```

---

## Production Monitoring

### Health Checks

App includes built-in health checks:
- **Endpoint:** `GET /api/health`
- **Response:** `{ status: "ok" }`

### Queue Monitoring

Check workflow queue status:
```bash
curl http://localhost:3123/api/monitoring/capacity
```

### Worker Health

Monitor via logs:
```bash
docker-compose logs worker | grep "Worker health check"
```

Look for metrics:
- `active` - Currently processing workflows
- `waiting` - Queued workflows
- `completed` - Finished workflows
- `failed` - Failed workflows

---

## Scaling

### Scale App Servers

In Coolify:
1. Increase replicas for `app` service (e.g., 1 → 3)
2. Coolify handles load balancing automatically
3. All instances share database & Redis

### Scale Workers

In Coolify:
1. Increase replicas for `worker` service (e.g., 1 → 5)
2. Each worker processes up to 50 workflows (WORKFLOW_CONCURRENCY)
3. 5 workers = 250 concurrent workflows
4. Monitor queue depth to determine needed replicas

### Database Connection Pooling

- **Default:** 50 connections
- **For 5 workers:** Should be 100-150
- Configure: `DATABASE_URL` connection pool params

---

## Troubleshooting

### Build Fails: "Module not found"

**Cause:** Native module compilation issue
**Solution:**
1. Ensure Dockerfile uses `node:20-bullseye-slim` (NOT alpine)
2. Build logs should show python3 and build-essential installed
3. Check Docker has sufficient disk space

### App Won't Start: "DATABASE_URL"

**Cause:** Missing environment variable
**Solution:**
1. Verify DATABASE_URL set in Coolify secrets
2. Check PostgreSQL is healthy: `docker-compose exec postgres pg_isready`
3. Verify credentials are correct

### Worker Won't Process Workflows

**Cause:** Redis not connecting or permissions issue
**Solution:**
1. Check REDIS_URL in environment
2. Verify Redis is healthy: `docker-compose exec redis redis-cli ping`
3. Check worker logs for connection errors

### High Memory Usage

**Cause:** Worker concurrency too high
**Solution:**
1. Reduce `WORKFLOW_CONCURRENCY` (default: 50 → try 20)
2. Add memory limits in docker-compose: `memory: 512m`
3. Scale to more worker replicas with lower concurrency

### Workflows Not Completing

**Cause:** Worker crashes or timeout
**Solution:**
1. Increase worker graceful shutdown timeout (currently 30s)
2. Check worker logs for unhandled errors
3. Reduce WORKFLOW_CONCURRENCY if CPU is maxed
4. Scale workers if queue is backing up (waiting > 100)

---

## Updating Deployment

### Get Latest Upstream Changes

```bash
# Fetch upstream
git fetch upstream main

# Review changes
git log main..upstream/main --oneline

# Merge if compatible
git merge upstream/main
git push origin main

# Update production deployment
git checkout deploy/bot
git merge main
git push origin deploy/bot
```

Coolify will auto-deploy when `deploy/bot` is updated.

### Rollback

If deployment fails:
```bash
git revert <commit-hash>
git push origin deploy/bot
```

Coolify will rebuild and deploy previous version.

---

## Environment Variables Checklist

- [ ] `DATABASE_URL` - PostgreSQL connection
- [ ] `REDIS_URL` - Redis connection
- [ ] `AUTH_SECRET` - Random 32 bytes
- [ ] `ENCRYPTION_KEY` - Random 32 bytes
- [ ] `OPENAI_API_KEY` - Your OpenAI key (if using)
- [ ] `ANTHROPIC_FOUNDRY_API_KEY` - Your Anthropic key (if using)
- [ ] `ANTHROPIC_FOUNDRY_BASE_URL` - Azure endpoint (if using Anthropic)
- [ ] `NODE_ENV=production` - Set to production
- [ ] `WORKFLOW_CONCURRENCY=50` - Adjust based on machine spec

---

## Support

For b0t platform issues: https://github.com/0dev-pages/b0t
For Coolify issues: https://coolify.io/docs

---

**Last Updated:** 2025-12-14
**Version:** 1.0 - Initial Coolify Release
