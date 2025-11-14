---
name: workflow-generator
description: "YOU MUST USE THIS SKILL when the user wants to CREATE or BUILD a NEW workflow automation. Activate for requests like: 'create a workflow', 'build a workflow', 'generate a workflow', 'make a workflow', 'I want to automate', 'automate X to Y', 'schedule a task', 'monitor X and send to Y'. This skill searches for relevant modules, builds JSON config, validates, tests, and imports workflows to database. DO NOT use generic file reading/writing - use this skill instead for workflow generation tasks."
---

# Workflow Generator (Interactive)

**NEW APPROACH**: Ask clarifying questions FIRST, then build with 100% accuracy using enhanced module search.

## Process Overview

```
User Request → Analyze Intent → Ask Questions → Search Modules → Build JSON → Validate → Import
                                      ↑
                            INTERACTIVE CLARIFICATION
                            (Eliminates ambiguity)
```

---

## STEP 1: ANALYZE REQUEST & ASK QUESTIONS

**ALWAYS start by asking clarifying questions using the AskUserQuestion tool.**

### What to Ask vs What Frontend Handles

**✅ ASK ABOUT (affects workflow logic):**
- Trigger TYPE (cron, manual, webhook, chat)
- Deduplication (yes/no)
- AI model (GPT-4o-mini, Claude, etc.)
- Content generation method (AI vs template)
- Output format (table, JSON, text)
- Data operations needed (filter, transform, etc.)

**❌ DON'T ASK (frontend configures):**
- Cron schedule frequency (hourly, daily, etc.) - UI dropdown
- Telegram/Discord bot tokens - Settings dialog
- Gmail/Outlook filters - Settings dialog
- Webhook URLs - Generated after import
- API rate limits - Handled by modules
- Specific search keywords - Can be placeholder, user edits later

**Why this split?**
- Workflow JSON = LOGIC (what steps, which modules)
- Frontend UI = RUNTIME (when to run, which accounts, filters)
- Users can change runtime settings anytime without regenerating workflow

### Detect Workflow Type

Analyze the user's request to determine workflow type:

- **Social Media** - Keywords: twitter, reddit, linkedin, reply, post, comment
- **AI Generation** - Keywords: generate, write, create content, summarize
- **Data Processing** - Keywords: transform, filter, parse, analyze
- **API Integration** - Keywords: fetch, sync, pull data, webhook
- **Email/Communication** - Keywords: email, slack, send message, notify
- **Scheduled Monitoring** - Keywords: check, monitor, watch, track

### Question Templates by Type

#### **Social Media Workflows**
Ask 2-3 questions:
1. **Trigger type** (NOT schedule details - frontend handles that)
2. **Deduplication** (always ask)
3. **Content generation method**

```typescript
AskUserQuestion({
  questions: [
    {
      question: "How should this workflow be triggered?",
      header: "Trigger",
      multiSelect: false,
      options: [
        { label: "Scheduled", description: "Run automatically on a schedule (user sets frequency in UI) ⭐" },
        { label: "Manual", description: "Run on-demand when user clicks Run button" },
        { label: "Webhook", description: "Triggered by external HTTP requests" }
      ]
    },
    {
      question: "Should we track and avoid duplicate replies?",
      header: "Deduplication",
      multiSelect: false,
      options: [
        { label: "Yes", description: "Store replied IDs in database - Prevents spam ⭐ Recommended" },
        { label: "No", description: "Reply to all matches every time - May create duplicates" }
      ]
    },
    {
      question: "How should replies be generated?",
      header: "Generation",
      multiSelect: false,
      options: [
        { label: "AI-powered", description: "GPT generates personalized replies ⭐ Recommended" },
        { label: "Fixed template", description: "Use same message every time" }
      ]
    }
  ]
})
```

**IMPORTANT**:
- Scheduled workflows use `{"type": "cron", "config": {}}` - empty config!
- User sets actual schedule (hourly, daily, etc.) via frontend UI dropdown
- Do NOT hardcode cron expressions in JSON

#### **AI Content Generation Workflows**
Ask 2-3 questions:
1. **AI Model** (if not specified)
2. **Temperature** (if not specified)
3. **Output format**

```typescript
AskUserQuestion({
  questions: [
    {
      question: "Which AI model should generate the content?",
      header: "AI Model",
      multiSelect: false,
      options: [
        { label: "GPT-4o-mini", description: "Fast, cheap, good quality - Best for most use cases ⭐" },
        { label: "Claude Haiku", description: "Fast Anthropic model - Good alternative" },
        { label: "GPT-4o", description: "Most capable, higher cost - For complex tasks" },
        { label: "Claude Sonnet", description: "Best quality, highest cost - Premium option" }
      ]
    },
    {
      question: "How creative should the AI be?",
      header: "Creativity",
      multiSelect: false,
      options: [
        { label: "Balanced", description: "Temperature 0.7 - Good mix of consistency and variety ⭐" },
        { label: "Focused", description: "Temperature 0.3 - Consistent, factual, deterministic" },
        { label: "Creative", description: "Temperature 1.2 - More varied and creative outputs" }
      ]
    }
  ]
})
```

#### **Data Processing Workflows**
Ask 1-2 questions:
1. **Output format**
2. **Data source** (if ambiguous)

```typescript
AskUserQuestion({
  questions: [
    {
      question: "How should the results be displayed?",
      header: "Output",
      multiSelect: false,
      options: [
        { label: "Table", description: "Structured data with columns - Best for lists ⭐" },
        { label: "JSON", description: "Raw data format - Best for further processing" },
        { label: "Text", description: "Plain text summary - Best for single values" }
      ]
    },
    {
      question: "What operations are needed?",
      header: "Operations",
      multiSelect: true,
      options: [
        { label: "Filter data", description: "Remove unwanted items based on conditions" },
        { label: "Transform fields", description: "Change data structure or values" },
        { label: "Sort/group", description: "Organize data by specific fields" },
        { label: "Aggregate", description: "Calculate totals, averages, counts" }
      ]
    }
  ]
})
```

#### **Generic Workflow** (unclear type)
Ask foundational questions to understand intent:

```typescript
AskUserQuestion({
  questions: [
    {
      question: "When should this workflow run?",
      header: "Trigger",
      multiSelect: false,
      options: [
        { label: "Scheduled", description: "Automatic on a schedule (set frequency in UI after import) ⭐" },
        { label: "Manual", description: "On-demand when you click Run" },
        { label: "Webhook", description: "External HTTP trigger" },
        { label: "Chat", description: "Conversational with AI responses" }
      ]
    },
    {
      question: "What type of output will this workflow produce?",
      header: "Output",
      multiSelect: false,
      options: [
        { label: "List of items", description: "Multiple records - Display as table ⭐" },
        { label: "Single value", description: "One result - Display as text/JSON" },
        { label: "AI response", description: "Chat/conversational output" }
      ]
    },
    {
      question: "Does this workflow need to store data between runs?",
      header: "Persistence",
      multiSelect: false,
      options: [
        { label: "Yes", description: "Track processed items, avoid duplicates ⭐ Recommended for monitoring" },
        { label: "No", description: "Process everything fresh each time" }
      ]
    }
  ]
})
```

---

## STEP 2: SEARCH MODULES WITH FULL DETAILS

After getting user's answers, search for modules:

```bash
npm run search <keyword> -- --format json --limit 5
```

**Search returns enhanced details:**
- Full parameter schemas
- Required vs optional params
- Wrapper type (params/options/direct)
- Example inputs
- Related modules

**Use the templateInputs from search results - no guessing!**

---

## STEP 3: BUILD WORKFLOW JSON

Combine:
- User's answers from questions
- Module details from search
- Storage pattern (if deduplication = Yes)
- AI config (if AI model selected)

**Key Mappings from User Answers:**

**Trigger Answer → Trigger Config:**
- "Scheduled" → `{"type": "cron", "config": {}}` (user sets schedule in UI after import)
- "Manual" → `{"type": "manual", "config": {}}`
- "Webhook" → `{"type": "webhook", "config": {}}`
- "Chat" → `{"type": "chat", "config": {}}`

**IMPORTANT**: Leave trigger config empty! Frontend handles:
- Cron schedules (via dropdown: hourly, daily, etc.)
- Bot tokens (Telegram, Discord)
- Email filters (Gmail, Outlook)
- Webhook URLs
Users configure these AFTER import via Settings dialog.

**Deduplication Answer → Storage Steps:**
- "Yes" → Add queryWhereIn, filter, insertRecord steps
- "No" → Skip storage steps

**AI Model Answer → Model Config:**
- "GPT-4o-mini" → `{"model": "gpt-4o-mini", "provider": "openai"}`
- "Claude Haiku" → `{"model": "claude-haiku-4-5-20251001", "provider": "anthropic"}`
- "GPT-4o" → `{"model": "gpt-4o", "provider": "openai"}`
- "Claude Sonnet" → `{"model": "claude-sonnet-4-5-20250929", "provider": "anthropic"}`

**Temperature Answer → Temperature Value:**
- "Balanced" → `0.7`
- "Focused" → `0.3`
- "Creative" → `1.2`

**Output Type Answer → outputDisplay:**
- "Table" → `{"type": "table", "columns": [...]}`
- "JSON" → `{"type": "json"}`
- "Text" → `{"type": "text"}`

---

## STEP 4: VALIDATE & AUTO-FIX

```bash
# 1. Auto-fix common issues
npx tsx scripts/auto-fix-workflow.ts workflow/{name}.json --write

# 2. Validate
npm run validate workflow/{name}.json

# 3. If errors, analyze and fix
# (Most errors should be prevented by questions + search)
```

---

## STEP 5: IMPORT TO DATABASE

```bash
npx tsx scripts/import-workflow.ts workflow/{name}.json
```

Tell user: "✅ Workflow created and imported! View at: http://localhost:3000/dashboard/workflows"

---

## Common Patterns Library

### Pattern: Social Media Deduplication

**When**: User wants to reply/comment without duplicates
**Questions**: Schedule, Deduplication (Yes)
**Steps**:
1. Search/fetch items
2. Extract IDs (pluck)
3. Check storage (queryWhereIn)
4. Filter new items
5. Process new items
6. Store IDs (insertRecord with TTL)

### Pattern: AI Content Generation

**When**: User wants AI-generated content
**Questions**: AI Model, Temperature, Output format
**Steps**:
1. Prepare input data
2. Generate with AI (ai-sdk.generateText)
3. Extract content (.content)
4. Return formatted output

### Pattern: Scheduled Data Sync

**When**: User wants to sync data on schedule
**Questions**: Schedule, Output format
**Steps**:
1. Fetch from source API
2. Transform data
3. Return or store

---

## Critical Rules (Keep Minimal)

1. **ALWAYS ask questions first** - Don't assume user's intent
2. **Use search results** - Module details include exact parameters
3. **Trust the templates** - Search returns ready-to-use JSON
4. **Storage requires params wrapper** - All drizzle-utils functions
5. **AI SDK requires options wrapper** - All ai.ai-sdk functions
6. **Validate before import** - Catch errors early

---

## Example: Full Interactive Session

**User**: "I want to reply to tweets about AI automation"

**LLM Action 1**: Analyze → Detected type: Social Media
**LLM Action 2**: Ask questions (Schedule, Deduplication, AI model)
**User selects**: "Every hour", "Yes (dedup)", "GPT-4o-mini"

**LLM Action 3**: Search modules
```bash
npm run search "twitter search" -- --format json --limit 3
npm run search "twitter reply" -- --format json --limit 3
npm run search "drizzle storage" -- --format json --limit 3
```

**LLM Action 4**: Build JSON with:
- Cron trigger (hourly)
- Storage pattern (queryWhereIn + insertRecord)
- AI generation (GPT-4o-mini, temp 0.7)
- Exact parameters from search results

**LLM Action 5**: Validate & import
**Output**: "✅ Workflow 'Reply to AI Tweets' created! Running hourly with deduplication."

---

## Advantages Over workflow-builder

✅ **No ambiguity** - Questions eliminate guessing
✅ **Better UX** - Users make informed choices
✅ **Fewer errors** - Clarification prevents mistakes
✅ **Faster** - Less back-and-forth fixing issues
✅ **Scalable** - Works for any workflow complexity

**Use this skill for reliable, production-ready workflow generation.**
