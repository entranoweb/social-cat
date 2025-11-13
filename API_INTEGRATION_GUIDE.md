# 🚀 **b0t API Integration Guide**
## **How to Expose Workflows as REST APIs & Webhooks**

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [Webhook/REST API Endpoints](#webhook-rest-api-endpoints)
3. [Other Trigger Types](#other-trigger-types)
4. [Authentication & Security](#authentication--security)
5. [Required APIs & Costs](#required-apis--costs)
6. [Complete Integration Examples](#complete-integration-examples)
7. [Rate Limits & Production Considerations](#rate-limits--production-considerations)

---

## 🎯 **Overview**

**YES! b0t workflows can be exposed as REST API endpoints!**

Every workflow in b0t can be triggered via:
- ✅ **Webhook (REST API)** - HTTP POST/GET endpoints
- ✅ **Cron Schedule** - Automated recurring execution
- ✅ **Manual Trigger** - On-demand execution via UI/API
- ✅ **Telegram Bot** - `/command` triggers
- ✅ **Discord Bot** - Slash command triggers
- ✅ **Email Triggers** - Gmail/Outlook integration
- ✅ **Chat Interface** - AI-powered conversational triggers

---

## 🔌 **Webhook/REST API Endpoints**

### **How It Works**

1. **Create a workflow** with trigger type set to `webhook`
2. **Activate the workflow** (status: `active`)
3. **Get your webhook URL**: 
   ```
   https://your-b0t-instance.com/api/workflows/{workflow-id}/webhook
   ```

### **REST API Specification**

#### **POST /api/workflows/{id}/webhook**
Trigger workflow execution with custom data

**Request:**
```bash
curl -X POST https://your-b0t.com/api/workflows/abc123/webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=YOUR_HMAC_SIGNATURE" \
  -d '{
    "brand": "YourCompany",
    "keywords": ["feature", "pricing", "competitor"],
    "timeframe": "24h"
  }'
```

**Response:**
```json
{
  "success": true,
  "workflowId": "abc123",
  "workflowName": "Brand Monitoring",
  "queued": true
}
```

**Available Data in Workflow:**
- `{{webhook.body}}` - Request body (JSON)
- `{{webhook.headers}}` - Request headers
- `{{webhook.query}}` - URL query parameters
- `{{webhook.method}}` - HTTP method (POST/GET)
- `{{webhook.url}}` - Request path

#### **GET /api/workflows/{id}/webhook**
Get webhook URL and workflow status

**Response:**
```json
{
  "workflowId": "abc123",
  "workflowName": "Brand Monitoring",
  "webhookUrl": "https://your-b0t.com/api/workflows/abc123/webhook",
  "status": "active",
  "active": true,
  "triggerType": "webhook"
}
```

---

## 🔐 **Authentication & Security**

### **Webhook Signature Verification (HMAC-SHA256)**

Protect your webhooks from unauthorized access:

**1. Configure webhook secret in workflow:**
```json
{
  "trigger": {
    "type": "webhook",
    "config": {
      "webhookSecret": "your-secret-key-here"
    }
  }
}
```

**2. Client sends signature:**
```javascript
// Node.js example
const crypto = require('crypto');

const payload = JSON.stringify({
  brand: "YourCompany",
  keywords: ["pricing"]
});

const signature = 'sha256=' + 
  crypto.createHmac('sha256', 'your-secret-key-here')
    .update(payload)
    .digest('hex');

fetch('https://your-b0t.com/api/workflows/abc123/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-signature': signature
  },
  body: payload
});
```

**3. b0t verifies signature automatically**
- Uses timing-safe comparison (prevents timing attacks)
- Returns 401 if signature invalid or missing
- Supports both `x-webhook-signature` and `x-hub-signature-256` headers

### **Rate Limiting**

Built-in protection: **3 requests per minute per IP/workflow**

```javascript
// Rate limit response (429)
{
  "error": "Too many requests",
  "limit": 3,
  "window": "1 minute"
}
```

---

## ⏰ **Other Trigger Types**

### **1. Cron Schedule (Automated Recurring)**

Run workflows automatically on a schedule:

```json
{
  "trigger": {
    "type": "cron",
    "config": {
      "schedule": "0 9 * * *",  // Daily at 9 AM
      "timezone": "America/New_York"
    }
  }
}
```

**Common Schedules:**
- `0 * * * *` - Every hour
- `*/15 * * * *` - Every 15 minutes
- `0 9,17 * * 1-5` - 9 AM and 5 PM, weekdays only
- `0 0 1 * *` - First day of every month

### **2. Manual Trigger**

Execute via UI or API endpoint:

```bash
POST /api/workflows/{id}/execute
Content-Type: application/json

{
  "inputs": {
    "brand": "YourCompany"
  }
}
```

### **3. Telegram Bot**

Trigger workflows via Telegram commands:

```json
{
  "trigger": {
    "type": "telegram",
    "config": {
      "botToken": "YOUR_BOT_TOKEN",
      "command": "/monitor",
      "allowedUsers": ["@username1", "@username2"]
    }
  }
}
```

**Usage:**
```
/monitor YourCompany pricing
```

### **4. Discord Bot**

Trigger workflows via Discord slash commands:

```json
{
  "trigger": {
    "type": "discord",
    "config": {
      "botToken": "YOUR_BOT_TOKEN",
      "command": "/analyze",
      "guildId": "YOUR_SERVER_ID"
    }
  }
}
```

### **5. Email Triggers (Gmail/Outlook)**

Auto-trigger on incoming emails:

```json
{
  "trigger": {
    "type": "gmail",
    "config": {
      "filters": {
        "from": "support@competitor.com",
        "subject": "newsletter"
      },
      "pollInterval": 300  // Check every 5 minutes
    }
  }
}
```

---

## 💰 **Required APIs & Costs**

### **Social Media Listening APIs**

#### **1. Twitter API (X)**
**Cost:** $100-42,000/month

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 1,500 tweets/month (NOT viable) |
| **Basic** | $100/mo | 10K tweets/month, search, post |
| **Pro** | $5,000/mo | 1M tweets/month, full archive search |
| **Enterprise** | $42,000/mo | Unlimited, firehose access |

**Recommendation:** Start with **Basic ($100/mo)** for brand monitoring

**What you get:**
- Real-time tweet search (`social.twitter.searchTweets`)
- User timeline access (`social.twitter.getUserTweets`)
- Tweet posting (`social.twitter.postTweet`)
- User lookup, followers, engagement metrics

---

#### **2. Reddit API**
**Cost:** **FREE** (with rate limits)

| Feature | Rate Limit | Cost |
|---------|----------|------|
| **Public Access** | 60 requests/min | FREE |
| **OAuth App** | 100 requests/min | FREE |
| **Posts & Comments** | Unlimited reads | FREE |

**What you get:**
- Subreddit monitoring (`social.reddit.getSubredditPosts`)
- Keyword search (`social.reddit.searchPosts`)
- Post comments (`social.reddit.postComment`)
- User profiles, karma tracking

**No authentication required for reading public data!**

---

#### **3. YouTube API**
**Cost:** **FREE** (with quotas)

| Feature | Daily Quota | Cost |
|---------|------------|------|
| **Search** | 10,000 units/day | FREE |
| **Video Details** | Unlimited | FREE |
| **Comments** | 50 requests/min | FREE |

**What you get:**
- Video search (`social.youtube.searchVideos`)
- Channel tracking (`social.youtube.getChannelVideos`)
- Comment analysis (`social.youtube.getVideoComments`)
- View counts, engagement metrics

**Quota:** 10,000 units/day = ~100 searches or 1,000 video details

---

#### **4. LinkedIn API (Proxycurl)**
**Cost:** $49-499/month

| Plan | Price | Credits | Use Case |
|------|-------|---------|----------|
| **Starter** | $49/mo | 100 credits | Small-scale monitoring |
| **Growth** | $249/mo | 1,000 credits | Medium business |
| **Scale** | $499/mo | 3,000 credits | Enterprise monitoring |

**Credit Costs:**
- Profile lookup: 1 credit
- Company data: 1 credit
- Employee list: 3 credits
- Company posts: 5 credits
- Contact info: 3 credits

**What you get:**
- Profile scraping (`leads.proxycurl.getProfile`)
- Company tracking (`leads.proxycurl.getCompany`)
- Employee monitoring (`leads.proxycurl.searchEmployees`)
- Job postings tracking (`leads.proxycurl.getJobs`)
- Company posts scraping (`leads.proxycurl.getCompanyPosts`)

**Alternative:** LinkedIn official API (free but very limited)

---

### **AI & Sentiment Analysis**

#### **5. OpenAI API**
**Cost:** Pay-per-token

| Model | Input | Output | Best For |
|-------|--------|--------|----------|
| **GPT-4o** | $2.50/1M tokens | $10/1M tokens | High accuracy |
| **GPT-4o-mini** | $0.15/1M tokens | $0.60/1M tokens | Fast/cheap |
| **o1-mini** | $3/1M tokens | $12/1M tokens | Complex reasoning |

**Monthly Estimates:**
- 1,000 sentiment analyses: ~$5-20
- 10,000 summaries: ~$50-100
- 100,000 classifications: ~$300-500

**What you get:**
- Sentiment analysis (`ai.ai-sdk.generateJSON`)
- Content summarization
- Brand mention classification
- Competitive analysis
- Trend detection

---

#### **6. Anthropic Claude API**
**Cost:** Pay-per-token

| Model | Input | Output | Best For |
|-------|--------|--------|----------|
| **Claude 3.5 Sonnet** | $3/1M tokens | $15/1M tokens | Best quality |
| **Claude 3.5 Haiku** | $0.80/1M tokens | $4/1M tokens | Fast/cheap |

**Monthly Estimates:**
- Similar to OpenAI pricing
- Better for long-form analysis
- Excellent for competitive intelligence

---

### **Web Scraping & Data Collection**

#### **7. Apify**
**Cost:** $49-499/month

| Plan | Price | Credits | Use Case |
|------|-------|---------|----------|
| **Starter** | $49/mo | $49 credits | Small projects |
| **Scale** | $149/mo | $149 credits | Growing needs |
| **Business** | $499/mo | $499 credits | Heavy scraping |

**Credit Usage:**
- Instagram scraper: $0.50/1K posts
- LinkedIn scraper: $1/100 profiles
- Google Maps: $0.25/1K results
- Amazon products: $0.30/1K items

**900+ pre-built scrapers:**
- Social media (Instagram, TikTok, Facebook)
- E-commerce (Amazon, eBay, Shopify)
- Job boards (LinkedIn, Indeed)
- Review sites (Trustpilot, G2, Yelp)

**What you get:**
- Any website scraping (`leads.apify.runActor`)
- Pre-built scrapers (`leads.apify.runTask`)
- JavaScript rendering
- Proxy rotation
- CAPTCHA solving

---

#### **8. Bright Data (Proxy Services)**
**Cost:** $0.60-2.40 per GB

| Type | Price | Use Case |
|------|-------|----------|
| **Residential** | $2.40/GB | High success rate |
| **Datacenter** | $0.60/GB | Fast, cheaper |
| **Mobile** | $3.00/GB | Mobile-only content |

**Monthly Estimates:**
- Light scraping: 10 GB = $6-24
- Medium scraping: 100 GB = $60-240
- Heavy scraping: 500 GB = $300-1,200

**Alternative:** Free proxies (lower success rate)

---

### **News & RSS Monitoring**

#### **9. NewsAPI**
**Cost:** $0-449/month

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | 100 requests/day, 1-month archive |
| **Developer** | $49/mo | 1,000 requests/day, full archive |
| **Business** | $449/mo | 25,000 requests/day, priority |

**What you get:**
- 80,000+ news sources
- Keyword-based news search
- Real-time news alerts
- Historical news archive

---

#### **10. RSS Feeds**
**Cost:** **FREE**

No API needed! Built-in RSS parser:
- Company blogs
- Industry news sites
- Press releases
- Product updates
- Competitor announcements

**What you get:**
- RSS/Atom feed parsing (`utilities.rss.parseFeed`)
- Automatic updates
- No rate limits
- No API keys

---

### **Version Control & Developer Intelligence**

#### **11. GitHub API**
**Cost:** **FREE** (with rate limits)

| Feature | Rate Limit | Cost |
|---------|----------|------|
| **Public repos** | 60 requests/hour (unauth) | FREE |
| **Authenticated** | 5,000 requests/hour | FREE |
| **GraphQL** | 5,000 points/hour | FREE |

**What you get:**
- Repository tracking (`devtools.github.getRepository`)
- Commit monitoring (`devtools.github.getCommits`)
- Release tracking (`devtools.github.getReleases`)
- Issue/PR monitoring
- Contributor activity

---

### **Analytics & Tracking**

#### **12. Google Analytics (GA4)**
**Cost:** **FREE**

| Feature | Limit | Cost |
|---------|-------|------|
| **Standard** | 10M events/month | FREE |
| **360** | Unlimited | $150K/year |

**What you get:**
- Website traffic analysis
- User behavior tracking
- Conversion monitoring
- Custom event tracking

---

### **Communication & Alerts**

#### **13. Slack API**
**Cost:** **FREE**

Webhook-based alerts (no API key needed for incoming webhooks)

**What you get:**
- Real-time notifications (`communication.slack.sendMessage`)
- Channel/DM posting
- Rich message formatting
- File attachments

---

#### **14. Discord API**
**Cost:** **FREE**

Webhook-based alerts (unlimited)

**What you get:**
- Real-time notifications (`communication.discord.sendMessage`)
- Embeds and rich formatting
- File attachments
- Bot commands

---

#### **15. Telegram API**
**Cost:** **FREE**

Unlimited messaging via bot

**What you get:**
- Real-time alerts (`communication.telegram.sendMessage`)
- Group notifications
- Bot commands
- File sharing

---

#### **16. Email (Gmail/SMTP)**
**Cost:** **FREE** (with limits)

| Provider | Limit | Cost |
|----------|-------|------|
| **Gmail** | 500 emails/day | FREE |
| **SendGrid** | 100 emails/day | FREE ($15/mo for 40K) |
| **AWS SES** | 62K emails/month | FREE ($0.10/1K after) |

---

### **Database & Storage**

#### **17. PostgreSQL/MongoDB**
**Cost:** **FREE** (self-hosted) or $0-200/month (cloud)

| Provider | Plan | Price | Storage |
|----------|------|-------|---------|
| **Self-hosted** | - | FREE | Unlimited |
| **Supabase** | Free | $0 | 500 MB |
| **Supabase** | Pro | $25/mo | 8 GB |
| **MongoDB Atlas** | Free | $0 | 512 MB |
| **MongoDB Atlas** | Shared | $9/mo | 10 GB |

---

#### **18. Airtable**
**Cost:** $0-54/user/month

| Plan | Price | Records | API Calls |
|------|-------|---------|-----------|
| **Free** | $0 | 1,000/base | 5/sec |
| **Plus** | $10/user | 50,000/base | 5/sec |
| **Pro** | $20/user | 250,000/base | 10/sec |
| **Enterprise** | $54/user | 500,000/base | Custom |

---

#### **19. Google Sheets**
**Cost:** **FREE**

| Feature | Limit | Cost |
|---------|-------|------|
| **Sheets API** | 300 requests/min | FREE |
| **Storage** | 15 GB (Google Drive) | FREE |

---

#### **20. Notion API**
**Cost:** **FREE** (with workspace)

| Feature | Limit | Cost |
|---------|-------|------|
| **API Access** | 3 requests/sec | FREE |
| **Storage** | Unlimited blocks | FREE (with plan) |

---

## 💵 **Total Cost Estimates**

### **Minimum Viable Setup (FREE - $200/mo)**

✅ **FREE Tier:**
- Reddit (FREE)
- YouTube (FREE)
- GitHub (FREE)
- RSS feeds (FREE)
- Slack/Discord/Telegram (FREE)
- Gmail (FREE)
- Google Sheets (FREE)
- Self-hosted database (FREE)

**Total: $0/month**

---

### **Starter Setup ($200-500/mo)**

- Twitter Basic: $100/mo
- OpenAI GPT-4o-mini: $50/mo
- Proxycurl Starter: $49/mo
- Apify Starter: $49/mo
- All FREE APIs above

**Total: ~$250/month**

**What this enables:**
- ✅ Twitter brand monitoring (10K tweets/mo)
- ✅ Reddit unlimited tracking
- ✅ LinkedIn competitor intelligence (100 lookups)
- ✅ AI sentiment analysis (5,000+ analyses)
- ✅ Web scraping (light usage)
- ✅ Real-time alerts
- ✅ Complete social listening

---

### **Growth Setup ($500-1,500/mo)**

- Twitter Pro: $5,000/mo (OR stay with Basic)
- OpenAI GPT-4: $100/mo
- Claude 3.5: $50/mo
- Proxycurl Growth: $249/mo
- Apify Scale: $149/mo
- NewsAPI Developer: $49/mo
- Bright Data: $100/mo (proxies)

**Total: ~$700/month (without Twitter Pro)**
**OR ~$5,700/month (with Twitter Pro)**

**What this enables:**
- ✅ Enterprise-grade Twitter monitoring (1M tweets/mo)
- ✅ Advanced LinkedIn tracking (1,000 profiles)
- ✅ Heavy web scraping
- ✅ News aggregation from 80K sources
- ✅ High-volume AI analysis
- ✅ Production-ready competitive intelligence

---

### **Enterprise Setup ($2,000-10,000/mo)**

- Twitter Enterprise: $42,000/mo (OR Pro: $5,000/mo)
- OpenAI GPT-4: $500/mo
- Claude 3.5: $200/mo
- Proxycurl Scale: $499/mo
- Apify Business: $499/mo
- NewsAPI Business: $449/mo
- Bright Data: $500/mo
- Airtable Pro: $20/user
- MongoDB Atlas: $57/mo

**Total: ~$3,000-45,000/month**

**What this enables:**
- ✅ Unlimited Twitter firehose access
- ✅ Enterprise LinkedIn intelligence
- ✅ Heavy-duty web scraping
- ✅ Massive AI processing
- ✅ Multi-platform monitoring at scale
- ✅ Real-time competitive intelligence

---

## 🏗️ **Complete Integration Examples**

### **Example 1: Brand Monitoring REST API**

**Workflow Configuration:**
```json
{
  "name": "Brand Monitoring API",
  "trigger": {
    "type": "webhook",
    "config": {
      "webhookSecret": "your-secret-key"
    }
  },
  "steps": [
    {
      "id": "searchTwitter",
      "module": "social.twitter.searchTweets",
      "inputs": {
        "query": "{{webhook.body.brand}}",
        "maxResults": 100
      }
    },
    {
      "id": "searchReddit",
      "module": "social.reddit.searchPosts",
      "inputs": {
        "query": "{{webhook.body.brand}}",
        "limit": 50
      }
    },
    {
      "id": "analyzeSentiment",
      "module": "ai.ai-sdk.generateJSON",
      "inputs": {
        "prompt": "Analyze sentiment of these mentions: {{tweets}} {{posts}}",
        "schema": {
          "overall_sentiment": "positive|neutral|negative",
          "score": "number",
          "key_topics": "array",
          "urgent_issues": "array"
        }
      }
    },
    {
      "id": "saveToDatabase",
      "module": "data.postgresql.insert",
      "inputs": {
        "table": "brand_mentions",
        "data": "{{sentiment}}"
      }
    },
    {
      "id": "alertIfUrgent",
      "module": "communication.slack.sendMessage",
      "inputs": {
        "channel": "#alerts",
        "text": "🚨 Urgent brand mention detected: {{sentiment.urgent_issues}}"
      },
      "condition": "{{sentiment.urgent_issues.length > 0}}"
    }
  ],
  "returnValue": {
    "sentiment": "{{sentiment}}",
    "mentions_found": "{{tweets.length + posts.length}}",
    "timestamp": "{{now}}"
  }
}
```

**API Call from Your App:**
```javascript
// Node.js/Express integration
const crypto = require('crypto');

async function monitorBrand(brand) {
  const payload = JSON.stringify({ brand });
  
  const signature = 'sha256=' + 
    crypto.createHmac('sha256', process.env.B0T_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
  
  const response = await fetch(
    'https://your-b0t.com/api/workflows/brand-monitor-id/webhook',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature
      },
      body: payload
    }
  );
  
  const result = await response.json();
  
  return {
    sentiment: result.sentiment,
    mentions: result.mentions_found,
    timestamp: result.timestamp
  };
}

// Use in your Express route
app.post('/api/monitor', async (req, res) => {
  const { brand } = req.body;
  const analysis = await monitorBrand(brand);
  res.json(analysis);
});
```

---

### **Example 2: Competitor Intelligence Dashboard API**

**Workflow Configuration:**
```json
{
  "name": "Competitor Intelligence API",
  "trigger": {
    "type": "webhook"
  },
  "steps": [
    {
      "id": "getCompanyLinkedIn",
      "module": "leads.proxycurl.getCompany",
      "inputs": {
        "linkedinUrl": "{{webhook.body.competitor_linkedin}}"
      }
    },
    {
      "id": "getRecentPosts",
      "module": "leads.proxycurl.getCompanyPosts",
      "inputs": {
        "companyId": "{{company.id}}",
        "count": 20
      }
    },
    {
      "id": "getEmployeeCount",
      "module": "leads.proxycurl.searchEmployees",
      "inputs": {
        "companyId": "{{company.id}}"
      }
    },
    {
      "id": "scrapeWebsite",
      "module": "utilities.scraper.extractData",
      "inputs": {
        "url": "{{webhook.body.competitor_website}}",
        "selectors": {
          "pricing": ".pricing-section",
          "features": ".features-list"
        }
      }
    },
    {
      "id": "analyzeChanges",
      "module": "ai.ai-sdk.generateJSON",
      "inputs": {
        "prompt": "Compare this competitor data to historical: {{company}} {{posts}} {{website}}",
        "schema": {
          "hiring_trend": "string",
          "new_features": "array",
          "pricing_changes": "array",
          "market_positioning": "string"
        }
      }
    },
    {
      "id": "saveIntelligence",
      "module": "data.airtable.createRecord",
      "inputs": {
        "base": "Intelligence",
        "table": "Competitors",
        "fields": {
          "Company": "{{company.name}}",
          "Employee Count": "{{employees.length}}",
          "Analysis": "{{analysis}}",
          "Last Updated": "{{now}}"
        }
      }
    }
  ],
  "returnValue": "{{analysis}}"
}
```

**React/Next.js Integration:**
```typescript
// app/api/competitor/route.ts
export async function POST(req: Request) {
  const { competitorLinkedIn, competitorWebsite } = await req.json();
  
  const response = await fetch(
    `${process.env.B0T_URL}/api/workflows/${process.env.COMPETITOR_WORKFLOW_ID}/webhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitor_linkedin: competitorLinkedIn,
        competitor_website: competitorWebsite
      })
    }
  );
  
  const intelligence = await response.json();
  
  return Response.json(intelligence);
}

// components/CompetitorDashboard.tsx
export function CompetitorDashboard() {
  const [analysis, setAnalysis] = useState(null);
  
  const analyzeCompetitor = async (competitor: string) => {
    const response = await fetch('/api/competitor', {
      method: 'POST',
      body: JSON.stringify({ 
        competitorLinkedIn: `https://linkedin.com/company/${competitor}`,
        competitorWebsite: `https://${competitor}.com`
      })
    });
    
    const data = await response.json();
    setAnalysis(data);
  };
  
  return (
    <div>
      <CompetitorSelect onSelect={analyzeCompetitor} />
      {analysis && <IntelligenceView data={analysis} />}
    </div>
  );
}
```

---

### **Example 3: Real-Time Crisis Monitoring (Scheduled + Webhook)**

**Workflow 1: Scheduled Monitor (every 15 minutes)**
```json
{
  "name": "Crisis Monitor - Scheduled",
  "trigger": {
    "type": "cron",
    "config": {
      "schedule": "*/15 * * * *",
      "timezone": "UTC"
    }
  },
  "steps": [
    {
      "id": "monitorTwitter",
      "module": "social.twitter.searchTweets",
      "inputs": {
        "query": "YourBrand (urgent OR issue OR problem OR bug OR outage)",
        "maxResults": 100
      }
    },
    {
      "id": "checkSentiment",
      "module": "ai.ai-sdk.generateJSON",
      "inputs": {
        "prompt": "Detect crisis indicators: {{tweets}}",
        "schema": {
          "is_crisis": "boolean",
          "severity": "low|medium|high|critical",
          "affected_users": "number",
          "main_issue": "string"
        }
      }
    },
    {
      "id": "triggerWebhookIfCrisis",
      "module": "utilities.http.post",
      "inputs": {
        "url": "https://your-app.com/api/crisis-alert",
        "body": "{{sentiment}}",
        "headers": {
          "Authorization": "Bearer {{env.APP_API_KEY}}"
        }
      },
      "condition": "{{sentiment.is_crisis === true}}"
    }
  ]
}
```

**Your App Receives Crisis Alert:**
```javascript
// Your Express/Next.js API
app.post('/api/crisis-alert', async (req, res) => {
  const { is_crisis, severity, affected_users, main_issue } = req.body;
  
  // Trigger your internal crisis response
  await notifyTeam(severity, main_issue);
  await updateStatusPage(main_issue);
  await escalateToManager(affected_users);
  
  res.json({ acknowledged: true });
});
```

---

## ⚡ **Rate Limits & Production Considerations**

### **Built-In Protection**

1. **Webhook Rate Limiting**: 3 requests/minute per IP/workflow
2. **Queue System**: Automatic queuing with BullMQ
3. **Circuit Breakers**: Fail-safe for external API failures
4. **Retry Logic**: Exponential backoff for failed steps

### **Scaling Considerations**

**Horizontal Scaling:**
- Run multiple b0t workers
- Distribute workflows across instances
- Use Redis for shared queue

**Vertical Scaling:**
- Increase worker memory for heavy AI workloads
- Optimize database queries
- Cache frequent API calls

**Cost Optimization:**
- Start with FREE tier APIs
- Use GPT-4o-mini instead of GPT-4
- Implement caching for repeated queries
- Use scheduled workflows instead of real-time (lower API usage)

---

## 🎯 **Recommended Starter Configuration**

**For Social Listening & Competitive Intelligence:**

### **Minimum APIs (FREE tier):**
1. ✅ Reddit API - FREE (unlimited reading)
2. ✅ YouTube API - FREE (10K units/day)
3. ✅ GitHub API - FREE (5K requests/hour)
4. ✅ RSS Feeds - FREE (unlimited)
5. ✅ Slack/Discord - FREE (webhooks)
6. ✅ Google Sheets - FREE (storage)

**Total: $0/month**

### **Recommended Paid Upgrade (~$250/mo):**
7. ✅ Twitter Basic - $100/mo (10K tweets/month)
8. ✅ OpenAI GPT-4o-mini - $50/mo (sentiment analysis)
9. ✅ Proxycurl Starter - $49/mo (LinkedIn intelligence)
10. ✅ Apify Starter - $49/mo (web scraping)

**Total: ~$250/month**

**This gives you:**
- ✅ Multi-platform social listening (Twitter, Reddit, YouTube)
- ✅ AI-powered sentiment analysis
- ✅ LinkedIn competitive intelligence
- ✅ Web scraping capabilities
- ✅ Real-time alerts
- ✅ REST API endpoints for integration
- ✅ Scheduled automation

---

## 🚀 **Next Steps**

1. **Set up b0t instance** (self-hosted or cloud)
2. **Configure environment variables** with API keys
3. **Create workflows** using the webhook trigger
4. **Test webhooks** with sample data
5. **Integrate into your app** using REST API calls
6. **Monitor usage** and scale as needed

---

## 📚 **Additional Resources**

- **Webhook Security:** HMAC-SHA256 signature verification
- **Rate Limiting:** Built-in 3 req/min protection
- **Queue System:** BullMQ for reliable execution
- **Database Storage:** PostgreSQL, MongoDB, Airtable, Sheets
- **Real-time Alerts:** Slack, Discord, Telegram, Email

---

**Questions? Need help integrating?**

Let me know which specific integration you want to implement first! 🚀
