# 🐦 Twitter Setup Guide

This guide shows you **EXACTLY** how to get Twitter API credentials. Takes about 10 minutes.

---

## What You Need

Twitter API credentials to post tweets and replies automatically.

---

## Step 1: Go to Twitter Developer Portal

1. Open https://developer.twitter.com/en/portal/dashboard
2. Log in with your Twitter account
3. If asked "What's your use case?", select **"Making a bot"**

---

## Step 2: Create a New Project & App

1. Click **"+ Create Project"**
2. Name your project: `Social Cat` (or whatever you want)
3. Click **"Next"**
4. Select use case: **"Making a bot"**
5. Click **"Next"**
6. Project description: `Automated social media posting` (or whatever)
7. Click **"Next"**
8. App name: `social-cat-bot` (must be unique)
9. Click **"Complete"**

---

## Step 3: Get Your API Keys

After creating the app, you'll see a screen with keys. **COPY THESE NOW!**

You need to copy 4 things:

1. **API Key** (looks like: `abc123xyz`)
2. **API Key Secret** (looks like: `xyz456abc`)
3. **Bearer Token** (long string starting with `AAAA`)
4. Click **"Generate"** next to Access Token & Secret:
   - **Access Token** (looks like: `123-abc`)
   - **Access Token Secret** (looks like: `xyz789`)

**⚠️ IMPORTANT:** Save these somewhere safe! You won't see them again.

---

## Step 4: Enable OAuth 2.0 (For Settings Page Login)

1. In your app dashboard, click **"Settings"** tab
2. Scroll to **"User authentication settings"**
3. Click **"Set up"**
4. Select: **"OAuth 2.0"**
5. Type of App: **"Web App"**
6. Callback URL: `https://your-app.railway.app/api/auth/callback/twitter`
   - Replace `your-app.railway.app` with your actual Railway URL
7. Website URL: `https://your-app.railway.app`
8. Click **"Save"**

You'll get:
- **Client ID** (looks like: `abc123`)
- **Client Secret** (looks like: `xyz456`)

**⚠️ Save these too!**

---

## Step 5: Add Keys to Railway

1. Go to your Railway dashboard
2. Click on your app
3. Click **"Variables"** tab
4. Add these one by one:

```
TWITTER_API_KEY=<paste your API Key here>
TWITTER_API_SECRET=<paste your API Key Secret>
TWITTER_ACCESS_TOKEN=<paste your Access Token>
TWITTER_ACCESS_SECRET=<paste your Access Token Secret>
TWITTER_BEARER_TOKEN=<paste your Bearer Token>
TWITTER_CLIENT_ID=<paste your Client ID>
TWITTER_CLIENT_SECRET=<paste your Client Secret>
```

5. Railway will auto-redeploy your app

---

## Step 6: Test It

1. Go to your app URL
2. The yellow "Twitter Not Connected" alert should be **GONE**
3. Go to `/twitter` page
4. Toggle ON "Reply to Tweets"
5. Wait 5 minutes and check the History tab

**🎉 You're done!** Your app can now post to Twitter automatically.

---

## 🆘 Troubleshooting

### "403 Forbidden" errors
- Your app doesn't have **Read and Write** permissions
- Go to Developer Portal → Your App → Settings → Permissions
- Change to "Read and Write"
- Regenerate your Access Token & Secret
- Update them in Railway

### "Invalid or expired token"
- You need to regenerate your tokens
- Go through Step 3 again
- Update all keys in Railway

### Still stuck?
Open an issue: https://github.com/yourusername/social-cat/issues
