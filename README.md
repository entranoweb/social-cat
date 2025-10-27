# 🐱 Social Cat

AI-powered social media automation platform for Twitter, YouTube, and Instagram. Set it and forget it - let AI handle your social media presence 24/7.

## ✨ Features

- 🤖 **AI-Powered Replies** - Automatically reply to tweets, comments, and DMs with contextual AI responses
- 📅 **Smart Scheduling** - Set custom cron schedules for automated posting
- 🎯 **Advanced Filtering** - Target tweets by engagement, keywords, and more
- 📊 **Analytics Dashboard** - Track your automation performance in real-time
- 🔄 **Multi-Platform** - Works with Twitter/X, YouTube, and Instagram
- 💾 **Persistent Jobs** - Optional Redis integration for job persistence
- 🎨 **Modern UI** - Clean, responsive dashboard with real-time updates

## 🚀 Deploy to Railway (5 Minutes)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/social-cat)

**That's it!** Railway handles everything:
- ✅ Automatic PostgreSQL database
- ✅ Automatic deployments
- ✅ Free $5/month credit
- ✅ Custom domain support

**[📖 See full deployment guide →](DEPLOYMENT.md)**

---

## 🔧 Local Development

### Prerequisites

- Node.js 18+ and npm
- Optional: OpenAI API key for AI features
- Optional: Twitter API credentials for Twitter features

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/social-cat.git
cd social-cat

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials (only AUTH_SECRET required)

# Generate AUTH_SECRET
openssl rand -base64 32

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with:
- Email: `admin@socialcat.com`
- Password: (whatever you set in `.env.local`)

---

## 📚 Setup Guides

After deployment, connect services for full functionality:

- **[Twitter Setup](docs/setup/TWITTER.md)** - Get Twitter API credentials (10 min)
- **[OpenAI Setup](docs/setup/OPENAI.md)** - Get your OpenAI API key (2 min)
- **[YouTube Setup](docs/setup/YOUTUBE.md)** - Connect YouTube (optional)
- **[Instagram Setup](docs/setup/INSTAGRAM.md)** - Connect Instagram (optional)

**Each guide includes screenshots and assumes you're a complete beginner.**

---

## 🎯 How It Works

1. **Deploy** - One-click deploy to Railway
2. **Connect Services** - Follow in-app alerts with setup links
3. **Configure Workflows** - Set schedules and prompts in the UI
4. **Toggle ON** - Activate automations with a switch
5. **Close Your Laptop** - Everything runs 24/7 on the server

---

## 🛠️ Built With

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL (production) / SQLite (local)
- **ORM:** Drizzle ORM
- **Auth:** NextAuth.js v5
- **UI:** shadcn/ui + Tailwind CSS 4
- **Scheduling:** node-cron (or BullMQ with Redis)
- **AI:** OpenAI GPT-4o-mini
- **Deployment:** Railway

---

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Railway deployment (5 min)
- [Development Guide](CLAUDE.md) - Full project architecture
- [Twitter Setup](docs/setup/TWITTER.md) - Twitter API credentials
- [OpenAI Setup](docs/setup/OPENAI.md) - OpenAI API key

---

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

---

## 📄 License

MIT License - feel free to use this for your own projects!

---

## 🆘 Need Help?

- **In-App Alerts** - Dashboard shows setup guides when services aren't connected
- **GitHub Issues** - Open an issue for bugs or questions
- **Documentation** - Check DEPLOYMENT.md and setup guides

---

## ⚡ Quick Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm test             # Run tests

# Database
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
```

---

**Made with ❤️ by the Social Cat team**
