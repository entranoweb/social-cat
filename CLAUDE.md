# Social Cat

AI-powered social media automation platform that handles Twitter/X, YouTube, and Instagram engagement 24/7 with intelligent replies and scheduled posts.

## Project Structure

```
src/
  ├── app/                 # Next.js 15 App Router
  │   ├── api/            # REST API endpoints
  │   │   ├── auth/       # NextAuth.js + Twitter OAuth
  │   │   ├── twitter/    # Twitter operations & tracking
  │   │   ├── jobs/       # Job control & triggering
  │   │   ├── services/   # Service status checks
  │   │   ├── automation/ # Automation config
  │   │   └── scheduler/  # Cron scheduling
  │   ├── dashboard/      # Main dashboard pages
  │   ├── setup/          # Initial onboarding
  │   ├── settings/       # User settings
  │   └── [platform]/     # twitter, youtube, instagram
  ├── components/         # React components
  │   ├── ui/            # Shadcn/ui components
  │   ├── ai-elements/   # AI streaming UI
  │   ├── automation/    # Automation controls
  │   ├── dashboard/     # Dashboard widgets
  │   └── layout/        # Navbar, layouts
  ├── lib/               # Core business logic
  │   ├── jobs/          # BullMQ & cron jobs
  │   ├── workflows/     # Automation pipelines
  │   ├── rapidapi/      # External API wrappers
  │   ├── config/        # Tier configs
  │   ├── schema.ts      # Drizzle ORM models
  │   ├── db.ts          # Database connection
  │   ├── auth.ts        # Authentication
  │   ├── scheduler.ts   # Job scheduling
  │   └── [platform].ts  # API clients
docs/                    # Setup guides
drizzle/                 # Database migrations
```

## Organization Rules

**Keep code organized and modularized:**
- API routes → `/app/api`, one file per endpoint
- Components → `/components/[category]`, one component per file
- Business logic → `/lib`, grouped by domain (jobs, workflows, integrations)
- Database models → `/lib/schema.ts`
- Tests → Co-located with code as `*.test.ts`

**Modularity principles:**
- Single responsibility per file
- Clear, descriptive file names
- Group related functionality (jobs, workflows, API clients)
- Avoid monolithic files

## Code Quality - Zero Tolerance

After editing ANY file, run:

```bash
npm run lint
npx tsc --noEmit
```

Fix ALL errors/warnings before continuing.

If changes require server restart (not hot-reloadable):
1. Restart: `npm run dev`
2. Read server output/logs
3. Fix ALL warnings/errors before continuing
