---
name: workflow-builder
description: "YOU MUST USE THIS SKILL when the user wants to CREATE or BUILD a NEW workflow automation. Activate for requests like: 'create a workflow', 'build a workflow', 'generate a workflow', 'make a workflow', 'I want to automate', 'automate X to Y', 'schedule a task', 'monitor X and send to Y'. This skill focuses on workflow creation, module discovery, and JSON generation."
---

# Workflow Builder

## BEFORE YOU START

⚠️ **For complex workflows (8+ steps, database operations, or advanced features), you MUST read:**
```bash
Read ../workflow-generator/examples.md
```

Examples show:
- Database deduplication patterns (examples #4, #5)
- Parallel AI calls and complex transformations
- zipToObjects with arrays (NOT strings)
- AI SDK .content extraction for text operations
- Dynamic table creation patterns

**Simple workflows (1-7 steps)** with common modules can skip examples.md and use this guide only.

---

## Process

### 1. Parse Request
Identify: **What data** → **Transform** → **When to run**

### 2. Search Modules
```bash
npm run search <keyword> -- --limit 5
```
**For JSON output (machine-readable):**
```bash
npm run search <keyword> -- --format json --limit 5
```

Only use modules from search results. Verify exact names.

**Verify file exists:**
```bash
ls src/modules/{category}/ | grep {modulename}
```

### 3. Detect Parameters
Check function signature in search results:
- **AI SDK** → ALWAYS `{ "options": { ... } }`
- `(params: ...)` → `{ "params": { ... } }`
- `(options: ...)` → `{ "options": { ... } }`
- `(arg1, arg2)` → `{ "arg1": ..., "arg2": ... }`

**Top modules (73% of workflows use these):**
- `utilities.javascript.execute` - Transform data
- `ai.ai-sdk.generateText` - AI generation
- `utilities.array-utils.*` - Array operations
- `utilities.json-transform.parseJson` - Parse JSON

**Array Function Parameters (CRITICAL - Different patterns):**

**REST parameters** (single `arrays` parameter):
```json
// intersection, union, zip
"module": "utilities.array-utils.intersection",
"inputs": {
  "arrays": ["{{array1}}", "{{array2}}"]
}
```
Note: Each array variable is already an array, don't wrap in extra brackets.

**SEPARATE parameters** (distinct parameter names):
```json
// difference uses arr1, arr2
"module": "utilities.array-utils.difference",
"inputs": {
  "arr1": "{{firstArray}}",
  "arr2": "{{secondArray}}"
}
```

**Single array operations** (use `arr` NOT `array`):
```json
// pluck, sortBy, first, last
"module": "utilities.array-utils.pluck",
"inputs": {
  "arr": "{{items}}",
  "key": "name"
}
```

**Always verify** parameter names in search results before using.

### 4. Build JSON

**Minimal structure:**
```json
{
  "version": "1.0",
  "name": "Workflow Name",
  "description": "What it does",
  "trigger": {
    "type": "manual",
    "config": {}
  },
  "config": {
    "steps": [
      {
        "id": "step1",
        "module": "category.module.function",
        "inputs": {},
        "outputAs": "result"
      }
    ],
    "returnValue": "{{result}}",
    "outputDisplay": {
      "type": "table",
      "columns": [
        {"key": "field", "label": "Label", "type": "text"}
      ]
    }
  },
  "metadata": {
    "requiresCredentials": []
  }
}
```

See `examples.md` for complete working examples with annotations.

### 5. Validate & Import

**REQUIRED - run in order:**
```bash
# 1. Validate structure, modules, and workflow correctness (with AJV)
npm run validate workflow/{name}.json

# 2. Test execution
npx tsx scripts/test-workflow.ts workflow/{name}.json

# 3. Import to database
npx tsx scripts/import-workflow.ts workflow/{name}.json
```

**If validation errors occur:**
- Read the detailed error messages with suggestions
- Apply fixes to the workflow JSON
- Use JSON Patch for incremental fixes:
  ```bash
  npm run patch workflow/{name}.json fix-patch.json --write
  ```
- Re-run validation after fixes

**If errors persist**: Review the auto-fix output and manually correct remaining issues.

---

## Critical Rules (Top 5 Mistakes)

1. **returnValue and outputDisplay at `config` level** (NOT inside outputDisplay)
   ```json
   "config": {
     "steps": [...],
     "returnValue": "{{var}}",
     "outputDisplay": {...}
   }
   ```

2. **AI SDK requires options wrapper + .content for text**
   ```json
   "inputs": { "options": { "prompt": "...", "model": "gpt-4o-mini" } }
   ```
   Access text: `{{aiOutput.content}}`

3. **zipToObjects: ALL fields must be arrays of equal length**
   ❌ `"fields": "{{text}}"`
   ✅ `"fields": ["{{item1}}", "{{item2}}"]`

4. **chat-input: fields array REQUIRED**
   Must have: `id`, `label`, `key`, `type`, `required`

5. **Variables: Use `{{outputAs}}` NOT `{{stepId.outputAs}}`**

---

## Trigger Configurations (Complete)

### Manual (testing/on-demand - 47% usage)
```json
"trigger": { "type": "manual", "config": {} }
```

### Cron (scheduled - 13% usage)
```json
"trigger": {
  "type": "cron",
  "config": {
    "schedule": "0 9 * * *"
  }
}
```
**schedule**: Use a sensible default based on workflow purpose:
- Daily workflows: `"0 9 * * *"` (9 AM daily)
- Hourly checks: `"0 * * * *"` (every hour)
- Frequent updates: `"*/15 * * * *"` (every 15 min)

**Users never see cron syntax** - they select from easy presets in UI:
- "Every 5 minutes", "Every hour", "Daily at 9 AM", "Weekly (Monday 9 AM)", etc.

**After import**: Users click workflow Settings → Choose schedule from dropdown with human-readable options.

### Chat (simple message trigger)
```json
"trigger": {
  "type": "chat",
  "config": { "inputVariable": "userMessage" }
}
```
Access message: `{{trigger.userMessage}}`

### Chat-input (forms with validation)
```json
"trigger": {
  "type": "chat-input",
  "config": {
    "fields": [
      {
        "id": "1",
        "label": "Topic",
        "key": "topic",
        "type": "text",
        "required": true
      }
    ]
  }
}
```
**Field types**: text, textarea, number, date, select, checkbox
**Select type requires**: `"options": ["Option 1", "Option 2"]`
**Checkbox type**: Returns boolean true/false
**Required properties**: id, label, key, type, required
Access: `{{trigger.topic}}`

### Gmail/Outlook (email monitoring)
```json
"trigger": {
  "type": "gmail",
  "config": {
    "filters": {
      "label": "inbox",
      "isUnread": true
    },
    "pollInterval": 60
  }
}
```
**Filters** (all optional): label, from, to, subject, hasAttachment, isUnread
**pollInterval**: seconds (60 = 1 min, 300 = 5 min, 3600 = 1 hour)
Access trigger data: `{{trigger.userId}}`, `{{trigger.email.id}}`
Use gmail/outlook modules to fetch full email details with these IDs.

### Webhook (HTTP trigger)
```json
"trigger": { "type": "webhook", "config": {} }
```
Access: `{{trigger.body}}`, `{{trigger.headers}}`, `{{trigger.query}}`

### Telegram/Discord (bot messages)
```json
"trigger": { "type": "telegram", "config": {} }
"trigger": { "type": "discord", "config": {} }
```
Access: `{{trigger.message}}`, `{{trigger.chatId}}`, `{{trigger.userId}}`

---

## AI Agents (Autonomous Tools)

**When to use:** User wants AI to autonomously select and execute tools instead of manually defining each step.

**Available agents:**
- `ai.ai-agent.runAgent` - General (choose categories)
- `ai.ai-agent.runSocialAgent` - Social media (35 tools)
- `ai.ai-agent.runCommunicationAgent` - Messaging (94 tools)
- `ai.ai-agent.runDataAgent` - Data analysis (88 tools)

**Example:**
```json
{
  "id": "agent",
  "module": "ai.ai-agent.runAgent",
  "inputs": {
    "prompt": "{{trigger.userMessage}}",
    "toolOptions": {
      "categories": ["social", "ai"]
    }
  },
  "outputAs": "result"
}
```
Access: `{{result.text}}`

**Parameters:**
- `prompt` (required) - User's goal
- `toolOptions.categories` (array) - `["social", "ai", "data"]`
- `model` (optional) - Default: claude-haiku-4-5-20251001 (November 2025 cheap model)
- `temperature` (optional) - 0-2, default: 0.7

---

## Workflow Storage (Persistent Data Across Runs)

**When to use:** Workflow needs to remember data between executions (deduplication, state tracking, caching).

**Common use cases:**
- Track replied tweets/comments (avoid duplicates)
- Store processed item IDs
- Cache API responses temporarily
- Maintain counters across runs

**Available functions:**
- `data.drizzle-utils.insertRecord` - Store data
- `data.drizzle-utils.queryWhereIn` - Check for duplicates (batch)
- `data.drizzle-utils.queryRecords` - Query with filters
- `data.drizzle-utils.updateRecord` - Update existing records
- `data.drizzle-utils.deleteRecord` - Delete records

**CRITICAL: Always pass `workflowId: "{{workflowId}}"` for automatic table namespacing**

### Example: Tweet Reply Deduplication

```json
{
  "version": "1.0",
  "name": "Reply to Tweets (No Duplicates)",
  "description": "Find tweets, check if already replied, reply to new ones only",
  "trigger": { "type": "cron", "config": { "schedule": "0 * * * *" } },
  "config": {
    "steps": [
      {
        "id": "fetch",
        "module": "social.twitter.searchTweets",
        "inputs": { "query": "AI automation", "maxResults": 10 },
        "outputAs": "tweets"
      },
      {
        "id": "extract_ids",
        "module": "utilities.array-utils.pluck",
        "inputs": { "arr": "{{tweets}}", "key": "id" },
        "outputAs": "tweetIds"
      },
      {
        "id": "check_duplicates",
        "module": "data.drizzle-utils.queryWhereIn",
        "inputs": {
          "params": {
            "workflowId": "{{workflowId}}",
            "tableName": "replied_tweets",
            "column": "tweet_id",
            "values": "{{tweetIds}}"
          }
        },
        "outputAs": "alreadyReplied"
      },
      {
        "id": "filter_new",
        "module": "utilities.javascript.execute",
        "inputs": {
          "code": "return tweets.filter(t => !alreadyReplied.includes(t.id))"
        },
        "outputAs": "newTweets"
      },
      {
        "id": "reply_loop",
        "type": "forEach",
        "array": "{{newTweets}}",
        "itemAs": "tweet",
        "steps": [
          {
            "id": "generate_reply",
            "module": "ai.ai-sdk.generateText",
            "inputs": {
              "options": {
                "model": "gpt-4o-mini",
                "prompt": "Write a helpful reply to: {{tweet.text}}"
              }
            },
            "outputAs": "reply"
          },
          {
            "id": "post_reply",
            "module": "social.twitter.replyToTweet",
            "inputs": {
              "tweetId": "{{tweet.id}}",
              "text": "{{reply.content}}"
            },
            "outputAs": "posted"
          },
          {
            "id": "store_replied",
            "module": "data.drizzle-utils.insertRecord",
            "inputs": {
              "params": {
                "workflowId": "{{workflowId}}",
                "tableName": "replied_tweets",
                "data": {
                  "tweet_id": "{{tweet.id}}",
                  "reply_text": "{{reply.content}}",
                  "replied_at": "{{posted.createdAt}}"
                },
                "expiresInDays": 7
              }
            },
            "outputAs": "stored"
          }
        ]
      }
    ],
    "returnValue": "{{newTweets}}"
  }
}
```

**Key Features:**

1. **Automatic table creation** - No schema needed, columns inferred from data
2. **Workflow-scoped** - Tables named `workflow_storage_{workflowId}_{tableName}`
3. **Auto-expiration** - Use `expiresInDays` for TTL (optional)
4. **Dynamic schema** - Add new fields anytime, columns auto-add

**Parameters (ALL require `params` wrapper):**

**insertRecord:**
```json
"inputs": {
  "params": {
    "workflowId": "{{workflowId}}",
    "tableName": "replied_tweets",
    "data": { "tweet_id": "123", "status": "replied" },
    "expiresInDays": 7
  }
}
```
- `workflowId`: `"{{workflowId}}"` (required for scoping)
- `tableName`: Your table name (e.g., "replied_tweets")
- `data`: Object with any fields
- `expiresInDays`: Optional auto-delete after N days

**queryWhereIn (batch duplicate check):**
```json
"inputs": {
  "params": {
    "workflowId": "{{workflowId}}",
    "tableName": "replied_tweets",
    "column": "tweet_id",
    "values": "{{tweetIds}}"
  }
}
```
- Returns: Array of values that exist in the table

**queryRecords:**
```json
"inputs": {
  "params": {
    "workflowId": "{{workflowId}}",
    "tableName": "replied_tweets",
    "where": {"status": "pending"},
    "limit": 100
  }
}
```
- `where`: Optional filters
- `limit`: Max records to return

---

## Quick Reference

**Variable syntax:**
- Step output: `{{varName}}`
- Trigger data: `{{trigger.field}}`
- Nested: `{{var.property}}`, `{{array[0].field}}`
- Inline: `"Found {{count}} items"`

**Credentials:**
- Explicit: `{{credential.openai_api_key}}`
- Legacy: `{{user.openai}}`
- Short: `{{openai}}`

**Output displays (47% use table):**
- `table`: Needs `columns` array
- `text`: Plain text
- `list`: Array items
- `markdown`: Rich text
- `json`: Raw data

**Output Display Type Compatibility (CRITICAL):**

| Display Type | Return Type Required | Common Mistake | Fix |
|--------------|---------------------|----------------|-----|
| table | Array of objects | AI SDK returns object | Use array wrapper or forEach |
| text/markdown | String | AI SDK returns object | Use `{{ai.content}}` |
| list | Array | Single object | Wrap in array: `[{{item}}]` |
| json | Any | N/A | Always works |

**AI SDK Type Mismatch** (most common error):
```json
// ❌ WRONG - AI returns {content: "...", usage: {...}}
"returnValue": "{{aiOutput}}",
"outputDisplay": { "type": "text" }

// ✅ CORRECT - Extract .content for text
"returnValue": "{{aiOutput.content}}",
"outputDisplay": { "type": "text" }

// ✅ CORRECT - For table, need array
"returnValue": "[{{aiOutput}}]",  // Wrap in array
"outputDisplay": {
  "type": "table",
  "columns": [
    {"key": "content", "label": "Generated Text", "type": "text"}
  ]
}
```

**Table Column Validation:**
- Required: `key`, `label`, `type`
- Valid types: text, number, date, link, boolean
- Key must exist in returned objects

**Common patterns (from examples.md):**
1. Fetch → Transform → Display (53%)
2. AI Generate → Format → Display (40%)
3. Complex Multi-Step (7%)

---

## Troubleshooting

**Module not found**: Re-search with different keywords using `npm run search <keyword> -- --limit 5`
**AI SDK errors**: Check options wrapper and .content access
**Variable undefined**: Check outputAs in previous steps
**Credential error**: `grep "credential\." workflow/*.json` for exact names

**For detailed debugging**: Review auto-fix output and validation errors

**For complete examples**: Read `examples.md` (512 lines of annotated workflows)
