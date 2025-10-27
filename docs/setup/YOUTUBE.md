# 📺 YouTube Setup Guide

Connect YouTube to automatically reply to comments on your videos.

**(Optional - only needed if you want YouTube features)**

---

## Coming Soon

Full step-by-step guide with screenshots will be added here.

For now, you need:
- YouTube Data API v3 enabled in Google Cloud Console
- OAuth 2.0 credentials
- Refresh token from OAuth flow

---

## Quick Setup (Advanced Users)

1. Go to https://console.cloud.google.com
2. Create new project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Get refresh token using OAuth flow
6. Add to Railway variables:
   ```
   YOUTUBE_CLIENT_ID=your_client_id
   YOUTUBE_CLIENT_SECRET=your_client_secret
   YOUTUBE_REFRESH_TOKEN=your_refresh_token
   ```

---

## Need Help?

Open an issue: https://github.com/yourusername/social-cat/issues
