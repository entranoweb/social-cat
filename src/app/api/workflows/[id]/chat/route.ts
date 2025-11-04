import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { postgresDb } from '@/lib/db';
import { workflowsTablePostgres } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { executeWorkflowConfig } from '@/lib/workflows/executor';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/workflows/[id]/chat
 * Chat with AI to execute workflow with natural language
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workflowId } = await params;
  try {
    const { messages } = await request.json();

    if (!postgresDb) {
      throw new Error('Database not initialized');
    }

    logger.info({ workflowId }, 'Chat request received');

    // Fetch workflow
    const workflows = await postgresDb
      .select()
      .from(workflowsTablePostgres)
      .where(eq(workflowsTablePostgres.id, workflowId))
      .limit(1);

    if (workflows.length === 0) {
      logger.warn({ workflowId }, 'Workflow not found');
      return new Response('Workflow not found', { status: 404 });
    }

    const workflow = workflows[0];
    const config = typeof workflow.config === 'string'
      ? JSON.parse(workflow.config)
      : workflow.config;

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const userInput = lastMessage?.content || '';

    logger.info({ workflowId, messageCount: messages.length }, 'Starting chat stream');

    // System prompt for the AI
    const systemPrompt = `You are a helpful AI assistant that executes workflows based on user input.

Workflow: ${workflow.name}
Description: ${workflow.description || 'No description'}

Your job is to:
1. Understand the user's request
2. Execute the workflow with appropriate parameters
3. Present the results in a clear, conversational way

Be friendly, concise, and helpful. If the workflow produces data, explain it clearly to the user.`;

    // Stream the AI response using AI SDK
    // Note: This uses the AI SDK directly (not the module system) because:
    // - It's UI-specific streaming (not a workflow action)
    // - It requires special streaming format for React components
    // - The actual workflow execution uses the module system via executeWorkflowConfig
    const result = streamText({
      model: openai('gpt-4-turbo'),
      system: systemPrompt,
      messages,
      async onFinish({ text }) {
        logger.info({ workflowId, responseLength: text.length }, 'AI response completed, executing workflow');

        // Execute the workflow using the workflow execution engine
        // This properly uses the module system and all workflow infrastructure
        try {
          await executeWorkflowConfig(config, workflow.userId, {
            workflowId: workflow.id,
            userInput,
          });
          logger.info({ workflowId }, 'Workflow executed successfully');
        } catch (error) {
          logger.error({ workflowId, error }, 'Error executing workflow');
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    logger.error({ workflowId, error }, 'Chat error');
    return new Response('Internal server error', { status: 500 });
  }
}
