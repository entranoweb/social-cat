import OpenAI from 'openai';
import { createCircuitBreaker } from '@/lib/resilience';
import { createRateLimiter, withRateLimit } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

/**
 * OpenAI Module
 *
 * Generate text, chat, analyze content, and build AI workflows with GPT models
 * - Text generation with multiple models
 * - Multi-turn conversations
 * - Function calling (tools)
 * - Vision capabilities (GPT-4 Vision)
 * - Built-in resilience
 *
 * Perfect for:
 * - Content generation
 * - Code generation
 * - Data analysis
 * - Intelligent automation
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  logger.warn('⚠️  OPENAI_API_KEY not set. OpenAI features will not work.');
}

const openaiClient = OPENAI_API_KEY
  ? new OpenAI({
      apiKey: OPENAI_API_KEY,
      timeout: 60000, // 60 second timeout
    })
  : null;

// Rate limiter: Conservative limits for API usage
const openaiRateLimiter = createRateLimiter({
  maxConcurrent: 5,
  minTime: 200, // 200ms between requests
  reservoir: 500,
  reservoirRefreshAmount: 500,
  reservoirRefreshInterval: 60 * 1000,
  id: 'openai',
});

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAICompletionOptions {
  messages: OpenAIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  stream?: boolean;
}

export interface OpenAICompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
}

/**
 * Internal create completion function (unprotected)
 */
async function createCompletionInternal(
  options: OpenAICompletionOptions
): Promise<OpenAICompletionResponse> {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY.');
  }

  const model = options.model || 'gpt-4o-mini';

  logger.info(
    {
      model,
      messageCount: options.messages.length,
      hasTools: !!options.tools,
    },
    'Creating OpenAI completion'
  );

  // GPT-5/o1/o3 models don't support temperature, max_tokens, etc.
  const isGPT5 = model.startsWith('gpt-5') || model.startsWith('o1') || model.startsWith('o3');

  const completionParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages: options.messages,
    tools: options.tools,
    ...(isGPT5
      ? {} // No optional parameters for GPT-5/o1/o3
      : {
          max_tokens: options.maxTokens,
          temperature: options.temperature,
        }
    ),
  };

  const response = await openaiClient.chat.completions.create(completionParams);

  const message = response.choices[0]?.message;

  logger.info(
    {
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
      finishReason: response.choices[0]?.finish_reason,
    },
    'OpenAI completion created'
  );

  // Extract tool calls if present
  const toolCalls = message?.tool_calls?.map(tc => {
    if ('function' in tc) {
      return {
        id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments,
      };
    }
    return null;
  }).filter((tc): tc is { id: string; name: string; arguments: string } => tc !== null);

  return {
    content: message?.content || '',
    usage: response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : undefined,
    finishReason: response.choices[0]?.finish_reason || 'stop',
    toolCalls,
  };
}

/**
 * Create completion (protected)
 */
const createCompletionWithBreaker = createCircuitBreaker(createCompletionInternal, {
  timeout: 60000, // 60 seconds for AI generation
  name: 'openai-completion',
});

const createCompletionRateLimited = withRateLimit(
  async (options: OpenAICompletionOptions) =>
    createCompletionWithBreaker.fire(options),
  openaiRateLimiter
);

export async function createCompletion(
  options: OpenAICompletionOptions
): Promise<OpenAICompletionResponse> {
  return (await createCompletionRateLimited(
    options
  )) as unknown as OpenAICompletionResponse;
}

/**
 * Simple text generation
 * For workflows: Pass apiKey from user credentials via {{user.openai}}
 */
export async function generateText(params: {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  apiKey?: string;
}): Promise<string> {
  const { prompt, systemPrompt, model, maxTokens, temperature, apiKey } = params;

  // Use provided API key or fall back to system key
  const client = apiKey
    ? new OpenAI({ apiKey, timeout: 60000 })
    : openaiClient;

  if (!client) {
    throw new Error('OpenAI API key required. Set OPENAI_API_KEY or provide apiKey parameter.');
  }

  const messages: OpenAIMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  logger.info({ model: model || 'gpt-4o-mini', promptLength: prompt.length }, 'Generating text with OpenAI');

  const isGPT5 = (model || 'gpt-4o-mini').startsWith('gpt-5') ||
                 (model || '').startsWith('o1') ||
                 (model || '').startsWith('o3');

  const response = await client.chat.completions.create({
    model: model || 'gpt-4o-mini',
    messages,
    ...(isGPT5 ? {} : { max_tokens: maxTokens, temperature }),
  });

  const content = response.choices[0]?.message?.content || '';
  logger.info({ responseLength: content.length }, 'Text generated');

  return content;
}

/**
 * Chat with conversation history (convenience)
 */
export async function chat(
  messages: OpenAIMessage[],
  model?: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const response = await createCompletion({
    messages,
    model: model || 'gpt-4o-mini',
    maxTokens: options?.maxTokens,
    temperature: options?.temperature,
  });

  return response.content;
}

/**
 * Fast generation with GPT-4o-mini (convenience)
 */
export async function generateFast(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  return generateText({ prompt, systemPrompt, model: 'gpt-4o-mini', temperature: 0.8 });
}

/**
 * High quality generation with GPT-4o (convenience)
 */
export async function generateQuality(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  return generateText({ prompt, systemPrompt, model: 'gpt-4o', temperature: 0.7 });
}

/**
 * Analyze image with vision
 */
export async function analyzeImage(
  imageUrl: string,
  prompt: string,
  model?: string
): Promise<string> {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY.');
  }

  logger.info({ prompt, hasImage: true }, 'Analyzing image with GPT-4 Vision');

  const response = await openaiClient.chat.completions.create({
    model: model || 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
    max_tokens: 4096,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Streaming completion (for real-time applications)
 */
export async function* streamCompletion(
  options: OpenAICompletionOptions
): AsyncGenerator<string> {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY.');
  }

  const model = options.model || 'gpt-4o-mini';

  logger.info(
    {
      model,
      messageCount: options.messages.length,
    },
    'Starting OpenAI stream'
  );

  // GPT-5/o1/o3 models don't support temperature, max_tokens, etc.
  const isGPT5 = model.startsWith('gpt-5') || model.startsWith('o1') || model.startsWith('o3');

  const stream = await openaiClient.chat.completions.create({
    model,
    messages: options.messages,
    stream: true,
    ...(isGPT5
      ? {} // No optional parameters for GPT-5/o1/o3
      : {
          max_tokens: options.maxTokens,
          temperature: options.temperature,
        }
    ),
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }

  logger.info('OpenAI stream completed');
}

/**
 * Generate structured JSON output
 */
export async function generateJSON<T = unknown>(
  prompt: string,
  systemPrompt?: string,
  model?: string
): Promise<T> {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY.');
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await openaiClient.chat.completions.create({
    model: model || 'gpt-4o-mini',
    messages,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '{}';
  return JSON.parse(content) as T;
}
