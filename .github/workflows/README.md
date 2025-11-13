# 🔄 Automated Upstream Sync

This workflow automatically syncs your fork with the upstream b0t repository.

## 📅 Schedule

- **Automatic**: Runs daily at 2 AM UTC
- **Manual**: Can be triggered anytime from GitHub Actions tab

## 🚀 How It Works

1. **Fetches upstream changes** from `https://github.com/KenKaiii/b0t`
2. **Merges changes** into your main branch
3. **Pushes updates** to your fork automatically

## ✅ Features

- ✅ Fully automated daily sync
- ✅ No merge conflicts = automatic push
- ✅ Merge conflicts = workflow fails safely (no data loss)
- ✅ Manual trigger option available
- ✅ Execution summary with status

## 🔧 Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **"Sync Fork with Upstream"** workflow
3. Click **"Run workflow"** button
4. Select branch and click **"Run workflow"**

## ⚠️ If Merge Conflicts Occur

The workflow will:
1. Detect the conflict
2. Abort the merge safely
3. Fail the workflow (preserving your code)
4. Send you a notification

**To resolve manually:**
```bash
# Pull latest from your fork
git pull origin main

# Add upstream remote (if not already added)
git remote add upstream https://github.com/KenKaiii/b0t.git

# Fetch and merge
git fetch upstream
git merge upstream/main

# Resolve conflicts in your editor
# Then commit and push
git add .
git commit -m "Merge upstream changes"
git push origin main
```

## 📊 Monitoring

- Check the **Actions** tab to see sync status
- Green checkmark ✅ = successful sync
- Red X ❌ = merge conflict (manual intervention needed)

## 🛠️ Configuration

Current settings:
- **Upstream**: `https://github.com/KenKaiii/b0t`
- **Schedule**: Daily at 2 AM UTC (`0 2 * * *`)
- **Target branch**: `main`

To modify:
- Edit `.github/workflows/sync-upstream.yml`
- Change `cron` expression for different schedule
- Modify `upstream/main` if upstream uses different branch name

---

**Never miss an update from Ken's b0t development! 🚀**
