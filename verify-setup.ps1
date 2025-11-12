# b0t Post-Restart Verification Script
Write-Host "🔍 Verifying b0t setup after Node.js update..." -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "1. Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "   Node.js: $nodeVersion" -ForegroundColor Green
if ($nodeVersion -lt "v20.18.0") {
    Write-Host "   ⚠️  Warning: Node.js version is below recommended v20.18.1" -ForegroundColor Red
} else {
    Write-Host "   ✅ Node.js version is good" -ForegroundColor Green
}
Write-Host ""

# Check npm version
Write-Host "2. Checking npm version..." -ForegroundColor Yellow
$npmVersion = npm --version
Write-Host "   npm: v$npmVersion" -ForegroundColor Green
Write-Host ""

# Check git status
Write-Host "3. Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "   ⚠️  Uncommitted changes detected" -ForegroundColor Red
    git status --short
} else {
    Write-Host "   ✅ Working tree clean" -ForegroundColor Green
}
Write-Host ""

# Check current branch and commits
Write-Host "4. Checking git branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   Branch: $currentBranch" -ForegroundColor Green
Write-Host "   Latest commits:" -ForegroundColor Gray
git --no-pager log --oneline -3
Write-Host ""

# Reinstall dependencies
Write-Host "5. Reinstalling dependencies..." -ForegroundColor Yellow
Write-Host "   Running: npm install" -ForegroundColor Gray
npm install --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Run TypeScript check
Write-Host "6. Running TypeScript check..." -ForegroundColor Yellow
npm run typecheck --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ TypeScript check passed" -ForegroundColor Green
} else {
    Write-Host "   ❌ TypeScript errors found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Run ESLint
Write-Host "7. Running ESLint..." -ForegroundColor Yellow
npm run lint --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ ESLint check passed" -ForegroundColor Green
} else {
    Write-Host "   ❌ ESLint errors found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check for PostgreSQL
Write-Host "8. Checking PostgreSQL (port 5433)..." -ForegroundColor Yellow
$pgRunning = netstat -an | Select-String ":5433"
if ($pgRunning) {
    Write-Host "   ✅ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  PostgreSQL not detected on port 5433" -ForegroundColor Yellow
    Write-Host "   Run: docker compose up -d postgres" -ForegroundColor Gray
}
Write-Host ""

# Check for Redis
Write-Host "9. Checking Redis (port 6379)..." -ForegroundColor Yellow
$redisRunning = netstat -an | Select-String ":6379"
if ($redisRunning) {
    Write-Host "   ✅ Redis is running" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Redis not detected on port 6379" -ForegroundColor Yellow
    Write-Host "   Run: docker compose up -d redis" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ VERIFICATION COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start services: docker compose up -d postgres redis" -ForegroundColor Gray
Write-Host "  2. Run migrations: npm run db:push" -ForegroundColor Gray
Write-Host "  3. Start dev server: npm run dev" -ForegroundColor Gray
Write-Host "  4. Open browser: http://localhost:3000" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
