---
name: agent-generator
description: "YOU MUST USE THIS SKILL when the user wants to create an AI agent workflow. Activate for requests like: 'create an agent', 'build an AI agent', 'make a chat agent', 'agent that can...', 'AI that does...', 'conversational workflow'. This skill creates workflows with AI agents that can use tools, have conversations, and perform complex multi-step reasoning."
---

# AI Agent Workflow Generator

## When to Use This Skill

Use this skill when the user wants to create workflows featuring AI agents that can:
- Have conversations (chat workflows)
- Use tools autonomously (web search, calculations, API calls, etc.)
- Perform multi-step reasoning
- Access 1282+ available tools across 140+ modules

## AI Agent Modules Available

### Primary Agent Functions

**ai.ai-agent.runAgent** - Standard agent (non-streaming)
```json
{
  "module": "ai.ai-agent.runAgent",
  "inputs": {
    "options": {
      "prompt": "{{trigger.userMessage}}",
      "model": "gpt-4o-mini",
      "maxSteps": 10,
      "temperature": 0.7,
      "systemPrompt": "You are a helpful assistant...",
      "toolOptions": { "useAll": true }
    }
  }
}
```

**ai.ai-agent-stream.streamAgent** - Streaming agent with real-time updates
```json
{
  "module": "ai.ai-agent-stream.streamAgent",
  "inputs": {
    "options": {
      "prompt": "{{trigger.userMessage}}",
      "model": "claude-haiku-4-5-20251001",
      "maxSteps": 10,
      "systemPrompt": "You are a helpful assistant..."
    }
  }
}
```

### Convenience Functions

- **ai.ai-agent.runWebAgent** - Pre-configured for web research
- **ai.ai-agent.runCreativeAgent** - Pre-configured for creative tasks
- **ai.ai-agent.runCommunicationAgent** - Pre-configured for messaging

## Current Model Names (November 2025 - Cheap Models Only)

### Claude Models (Anthropic)
- `claude-haiku-4-5-20251001` - Fastest & cheapest ($1/$5 per MTok) (**RECOMMENDED**)
- `claude-sonnet-4-5-20250929` - Best balance ($3/$15 per MTok)

### OpenAI Models
- `gpt-4o-mini` - Fast and cost-effective (**RECOMMENDED**)
- `gpt-4-1-mini` - Latest GPT-4.1 mini
- `gpt-4-1-nano` - Cheapest and fastest

**These are the November 2025 cheap models validated in auto-fix script. Auto-fix will correct old model names. NO EXPENSIVE MODELS ALLOWED.**

## Critical Agent-Specific Rules

### 1. Options Wrapper (NON-NEGOTIABLE)

✅ **ALWAYS use `{ "options": { ... } }` for ALL AI agent functions**

```json
// ✅ CORRECT
"inputs": {
  "options": {
    "prompt": "...",
    "model": "gpt-4o-mini"
  }
}

// ❌ WRONG - Will fail validation
"inputs": {
  "prompt": "...",
  "model": "gpt-4o-mini"
}
```

### 2. API Keys (AUTO-INJECTED - DO NOT INCLUDE)

**SECURITY: Never include apiKey in workflow JSON!**

The system automatically:
- Detects model name (gpt-* or claude-*)
- Determines provider (OpenAI or Anthropic)
- Injects correct API key from credentials page at runtime

```json
// ✅ CORRECT - No apiKey field
{
  "options": {
    "model": "gpt-4o-mini",
    "prompt": "..."
  }
}

// ❌ WRONG - Security risk, unnecessary
{
  "options": {
    "apiKey": "{{credential.openai_api_key}}",  // DON'T DO THIS
    "model": "gpt-4o-mini"
  }
}
```

### 3. Agent Parameters

**Required:**
- `prompt` - The user's input/goal

**Optional (with defaults):**
- `model` - Default: `claude-haiku-4-5-20251001` (cheapest)
- `maxSteps` - Default: 10, Range: 1-50
- `temperature` - Default: 0.7, Range: 0-2
- `systemPrompt` - Defines agent behavior
- `conversationHistory` - For multi-turn conversations
- `toolOptions` - Configure which tools agent can use

### 4. Tool Options

**Give agent ALL tools (recommended):**
```json
"toolOptions": {
  "useAll": true
}
```

**Filter by category:**
```json
"toolOptions": {
  "categories": ["web", "ai", "communication", "utilities"]
}
```

**Available categories:**
- `web` - Search, fetch, scrape
- `ai` - Text/image generation
- `communication` - Email, Slack, Discord
- `social` - Twitter, Reddit, etc.
- `data` - Database, spreadsheets
- `utilities` - Math, time, JSON, etc.

**Specific tools only:**
```json
"toolOptions": {
  "tools": ["fetchWebPage", "getCurrentDateTime", "calculate"]
}
```

**With MCP servers:**
```json
"toolOptions": {
  "useAll": true,
  "useMCP": true,
  "mcpServers": ["tavily-search", "brave-search"]
}
```

### 5. Agent Return Value

**Non-streaming agents** return `AgentRunResponse`:
```json
{
  "returnValue": "{{agentResponse.text}}"  // Use .text for final answer
}
```

**Streaming agents** return step-by-step data:
```json
{
  "returnValue": "{{streamResponse}}"  // Contains full trace
}
```

## Complete Agent Workflow Structure

```json
{
  "version": "1.0",
  "name": "AI Agent Workflow Name",
  "description": "What the agent does",

  "trigger": {
    "type": "chat",  // For conversational agents
    "config": {
      "inputVariable": "userMessage"  // Required for chat trigger
    }
  },

  "config": {
    "steps": [
      {
        "id": "run_agent",
        "module": "ai.ai-agent.runAgent",
        "inputs": {
          "options": {
            "prompt": "{{trigger.userMessage}}",
            "model": "gpt-4o-mini",
            "maxSteps": 10,
            "temperature": 0.7,
            "systemPrompt": "You are a helpful AI assistant with access to various tools. Use tools when needed to accomplish tasks.",
            "toolOptions": {
              "useAll": true
            }
          }
        },
        "outputAs": "agentResponse"
      }
    ],
    "returnValue": "{{agentResponse.text}}",
    "outputDisplay": {
      "type": "markdown"  // For chat workflows
    }
  },

  "metadata": {
    "requiresCredentials": [
      "openai_api_key"  // or "anthropic_api_key" depending on model
    ]
  }
}
```

## Common Agent Workflow Patterns

### Pattern 1: Simple Chat Agent

```json
{
  "version": "1.0",
  "name": "General Purpose AI Assistant",
  "description": "Chat with an AI that can use tools",
  "trigger": {
    "type": "chat",
    "config": { "inputVariable": "userMessage" }
  },
  "config": {
    "steps": [{
      "id": "chat",
      "module": "ai.ai-agent.runAgent",
      "inputs": {
        "options": {
          "prompt": "{{trigger.userMessage}}",
          "model": "gpt-4o-mini",
          "toolOptions": { "useAll": true }
        }
      },
      "outputAs": "response"
    }],
    "returnValue": "{{response.text}}",
    "outputDisplay": { "type": "markdown" }
  },
  "metadata": {
    "requiresCredentials": ["openai_api_key"]
  }
}
```

### Pattern 2: Specialized Research Agent

```json
{
  "version": "1.0",
  "name": "Web Research Assistant",
  "description": "AI agent specialized in web research and analysis",
  "trigger": {
    "type": "chat",
    "config": { "inputVariable": "userMessage" }
  },
  "config": {
    "steps": [{
      "id": "research",
      "module": "ai.ai-agent.runAgent",
      "inputs": {
        "options": {
          "prompt": "{{trigger.userMessage}}",
          "model": "claude-sonnet-4-5-20250929",
          "maxSteps": 15,
          "systemPrompt": "You are a research assistant. Search the web, analyze information, and provide comprehensive answers with sources.",
          "toolOptions": {
            "categories": ["web", "utilities"]
          }
        }
      },
      "outputAs": "research"
    }],
    "returnValue": "{{research.text}}",
    "outputDisplay": { "type": "markdown" }
  },
  "metadata": {
    "requiresCredentials": ["anthropic_api_key"]
  }
}
```

### Pattern 3: Agent with Data Processing

```json
{
  "version": "1.0",
  "name": "Data Analysis Agent",
  "description": "Fetch data and analyze with AI",
  "trigger": { "type": "manual", "config": {} },
  "config": {
    "steps": [
      {
        "id": "fetch_data",
        "module": "web.http.get",
        "inputs": {
          "url": "https://api.example.com/data"
        },
        "outputAs": "apiData"
      },
      {
        "id": "analyze",
        "module": "ai.ai-agent.runAgent",
        "inputs": {
          "options": {
            "prompt": "Analyze this data and provide insights: {{apiData}}",
            "model": "gpt-4o-mini",
            "temperature": 0.3,
            "systemPrompt": "You are a data analyst. Analyze the provided data and generate actionable insights.",
            "toolOptions": {
              "categories": ["utilities"]
            }
          }
        },
        "outputAs": "analysis"
      }
    ],
    "returnValue": "{{analysis.text}}",
    "outputDisplay": { "type": "markdown" }
  },
  "metadata": {
    "requiresCredentials": ["openai_api_key"]
  }
}
```

### Pattern 4: Multi-Step Agent Workflow

```json
{
  "version": "1.0",
  "name": "Research and Summarize",
  "description": "Research a topic, then create a summary",
  "trigger": {
    "type": "chat-input",
    "config": {
      "fields": [{
        "id": "topic",
        "label": "Topic to Research",
        "key": "topic",
        "type": "text",
        "required": true
      }]
    }
  },
  "config": {
    "steps": [
      {
        "id": "research",
        "module": "ai.ai-agent.runAgent",
        "inputs": {
          "options": {
            "prompt": "Research this topic thoroughly: {{trigger.topic}}",
            "model": "claude-sonnet-4-5-20250929",
            "maxSteps": 20,
            "systemPrompt": "You are a researcher. Use web search and other tools to gather comprehensive information.",
            "toolOptions": { "useAll": true }
          }
        },
        "outputAs": "researchResults"
      },
      {
        "id": "summarize",
        "module": "ai.ai-sdk.generateText",
        "inputs": {
          "options": {
            "prompt": "Create a concise summary of this research:\n\n{{researchResults.text}}",
            "model": "gpt-4o-mini",
            "maxTokens": 500
          }
        },
        "outputAs": "summary"
      }
    ],
    "returnValue": "{{summary.content}}",
    "outputDisplay": { "type": "markdown" }
  },
  "metadata": {
    "requiresCredentials": ["anthropic_api_key", "openai_api_key"]
  }
}
```

## Validation & Import Process

**REQUIRED STEPS - Run in order:**

```bash
# 1. Auto-fix common issues
npx tsx scripts/auto-fix-workflow.ts workflow/{name}.json --write

# 2. Validate structure
npm run validate workflow/{name}.json

# 3. Test execution
npx tsx scripts/test-workflow.ts workflow/{name}.json

# 4. Import to database
npx tsx scripts/import-workflow.ts workflow/{name}.json
```

## Auto-Fix Capabilities for Agents

The auto-fix script handles these agent-specific issues:

1. **Options wrapper** - Adds missing `{ "options": { ... } }` wrapper
2. **Model names** - Fixes old model names (e.g., "claude-3-5-sonnet" → "claude-sonnet-4-5-20250929")
3. **Temperature range** - Clamps to 0-2
4. **maxSteps validation** - Ensures 1-50 range
5. **toolOptions format** - Converts invalid formats to correct structure
6. **Return value** - Adds `.text` accessor for agent responses
7. **Credential detection** - Adds required credentials to metadata

## Common Mistakes & Fixes

| Mistake | Fix |
|---------|-----|
| No options wrapper | Auto-fix adds it automatically |
| Old model name | Auto-fix suggests current models |
| Including apiKey | Remove it - auto-injected at runtime |
| Wrong temperature | Auto-fix clamps to 0-2 range |
| Missing systemPrompt | Optional, but recommended for better results |
| Wrong toolOptions format | Auto-fix converts to correct structure |
| Missing .text accessor | Auto-fix adds it to returnValue |

## Tips for Great Agent Workflows

### 1. System Prompts Matter

Good system prompts define:
- Agent's role and expertise
- When to use tools vs. direct answers
- Output format preferences
- Constraints and guidelines

```json
"systemPrompt": "You are a helpful research assistant. When users ask questions, search the web for current information before answering. Cite your sources and be concise."
```

### 2. Choose the Right Model

- **Quick tasks, cost-sensitive**: `gpt-4o-mini` (RECOMMENDED) or `claude-haiku-4-5-20251001`
- **Complex reasoning**: `claude-sonnet-4-5-20250929`
- **Cheapest option**: `gpt-4-1-nano` or `claude-haiku-4-5-20251001`

### 3. Tool Selection Strategy

- **Start with `useAll: true`** - Let agent decide
- **Filter by category** - If agent doesn't need all tools
- **Specific tools** - For highly focused tasks

### 4. maxSteps Guidance

- Simple queries: 5-10 steps
- Research tasks: 15-20 steps
- Complex workflows: 20-50 steps

More steps = more tool calls = longer execution time and higher cost

### 5. Temperature Settings

- **0.0-0.3** - Focused, deterministic (data analysis, code)
- **0.7** - Balanced (default, good for most tasks)
- **1.0-2.0** - Creative (writing, brainstorming)

## Debugging Agent Workflows

### Agent Not Using Tools

**Problem**: Agent answers directly without using tools

**Solutions**:
1. Make system prompt more explicit: "Always use tools when available"
2. Increase maxSteps
3. Use more capable model (Sonnet over Haiku)

### Agent Stops Early

**Problem**: Agent hits maxSteps limit

**Solutions**:
1. Increase maxSteps (default is 10)
2. Simplify the task
3. Break into multiple steps

### Wrong Model Error

**Problem**: "invalid x-api-key" or "model not found"

**Solutions**:
1. Check model name spelling
2. Verify correct credential is saved (check credentials page)
3. Run auto-fix to detect correct model name

### Tool Errors

**Problem**: Agent tries to use unavailable tools

**Solutions**:
1. Check toolOptions configuration
2. Verify required credentials are available
3. Check if MCP servers are running (if using MCP)

## Chat Trigger Special Behavior

Chat trigger workflows have automatic features:

1. **Auto-return** - Final step's text output auto-streams to UI
2. **Conversation history** - System maintains chat history automatically
3. **Streaming** - Use `ai-agent-stream.streamAgent` for real-time updates
4. **inputVariable** - Must be set to "userMessage" for trigger data

```json
"trigger": {
  "type": "chat",
  "config": {
    "inputVariable": "userMessage"  // Required!
  }
}
```

## File Organization

Save agent workflows in:
```
workflow/
  chat-agent-{name}.json       # Chat-triggered agents
  manual-agent-{name}.json     # Manual-triggered agents
  scheduled-agent-{name}.json  # Cron-triggered agents
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│ AI AGENT WORKFLOW QUICK REFERENCE                           │
├─────────────────────────────────────────────────────────────┤
│ Module: ai.ai-agent.runAgent                                │
│ Wrapper: { "options": { ... } }                             │
│ API Key: AUTO-INJECTED (don't include)                      │
│ Models: gpt-4o-mini, claude-haiku-4-5-20251001             │
│ Return: {{response.text}}                                   │
│ Tools: { "useAll": true } or categories                     │
│ Steps: 1-50 (default 10)                                    │
│ Temp: 0-2 (default 0.7)                                     │
├─────────────────────────────────────────────────────────────┤
│ VALIDATION PIPELINE                                         │
│ 1. npx tsx scripts/auto-fix-workflow.ts {file} --write     │
│ 2. npm run validate {file}                                  │
│ 3. npx tsx scripts/test-workflow.ts {file}                  │
│ 4. npx tsx scripts/import-workflow.ts {file}                │
└─────────────────────────────────────────────────────────────┘
```

## Example: Complete Chat Agent Workflow

Here's a complete, copy-paste ready chat agent:

```json
{
  "version": "1.0",
  "name": "Universal AI Assistant",
  "description": "Chat with an AI that can use 1282+ tools including web search, calculations, and more",
  "trigger": {
    "type": "chat",
    "config": {
      "inputVariable": "userMessage"
    }
  },
  "config": {
    "steps": [
      {
        "id": "run_agent",
        "module": "ai.ai-agent.runAgent",
        "inputs": {
          "options": {
            "prompt": "{{trigger.userMessage}}",
            "model": "gpt-4o-mini",
            "maxSteps": 15,
            "temperature": 0.7,
            "systemPrompt": "You are a helpful AI assistant with access to various tools. Use tools when needed to provide accurate, up-to-date information. Be concise but thorough.",
            "toolOptions": {
              "useAll": true
            }
          }
        },
        "outputAs": "agentResponse"
      }
    ],
    "returnValue": "{{agentResponse.text}}",
    "outputDisplay": {
      "type": "markdown"
    }
  },
  "metadata": {
    "requiresCredentials": [
      "openai_api_key"
    ]
  }
}
```

Save this as `workflow/chat-agent-universal.json` and run the validation pipeline!
