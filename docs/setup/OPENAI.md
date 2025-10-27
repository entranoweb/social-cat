# 🤖 OpenAI Setup Guide

Get your OpenAI API key in 2 minutes.

---

## Step 1: Go to OpenAI Platform

1. Open https://platform.openai.com/api-keys
2. Log in (or create account if you don't have one)

---

## Step 2: Create API Key

1. Click **"+ Create new secret key"**
2. Name: `Social Cat` (or whatever)
3. Click **"Create secret key"**
4. **COPY THE KEY NOW!** (starts with `sk-`)
   - You won't see it again after you close this dialog

---

## Step 3: Add to Railway

1. Go to Railway dashboard
2. Click your app → **"Variables"**
3. Add new variable:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```
4. Railway auto-redeploys

---

## Step 4: Test It

1. Go to your app URL
2. The "OpenAI Not Connected" alert should disappear
3. Try the "Test" button on any workflow
4. You should see AI-generated content!

**🎉 Done!**

---

## 💰 Pricing

OpenAI charges per API call:
- **GPT-4o-mini**: ~$0.15 per 1M input tokens (recommended, cheap)
- **GPT-4o**: ~$2.50 per 1M input tokens (more expensive)

A typical reply costs **< $0.001** (less than a tenth of a cent).

**Add credits:** https://platform.openai.com/settings/organization/billing/overview

---

## 🆘 Troubleshooting

### "Insufficient quota"
- You need to add billing info to OpenAI
- Go to: https://platform.openai.com/settings/organization/billing/overview
- Add payment method and buy $5-10 credits

### "Invalid API key"
- Make sure you copied the WHOLE key (starts with `sk-`)
- Check for extra spaces
- Regenerate a new key and try again

### Still stuck?
Open an issue: https://github.com/yourusername/social-cat/issues
