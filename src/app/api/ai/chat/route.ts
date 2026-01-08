import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai, isAIConfigured } from '@/lib/ai/openai-client';
import { SYSTEM_PROMPT, ACTIVITY_SCHEMA, FACILITY_SCHEMA, STAFF_SCHEMA, TEMPLATE_SCHEMA } from '@/lib/ai/prompts';
import {
  createActivities,
  createFacilities,
  createStaff,
  createDayTemplate,
  ActivityInput,
  FacilityInput,
  StaffInput,
  TemplateInput,
} from '@/lib/ai/entity-creators';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
  organizationId: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if AI is configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          error: 'AI not configured',
          message: 'Το AI δεν είναι ρυθμισμένο. Παρακαλώ προσθέστε το OPENAI_API_KEY στο .env.local'
        },
        { status: 503 }
      );
    }

    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ChatRequest = await request.json();
    const { message, history, organizationId, sessionId } = body;

    if (!message || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build conversation history
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\n## Schemas\n${ACTIVITY_SCHEMA}\n${FACILITY_SCHEMA}\n${STAFF_SCHEMA}\n${TEMPLATE_SCHEMA}\n\n## Context\nOrganization ID: ${organizationId}${sessionId ? `\nSession ID: ${sessionId}` : ''}`,
      },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const assistantMessage = completion.choices[0]?.message?.content || '';

    // Check if the response contains a creation request
    const jsonMatch = assistantMessage.match(/```json\n([\s\S]*?)\n```/);
    let creationResult = null;
    let actionData = null;

    if (jsonMatch) {
      try {
        actionData = JSON.parse(jsonMatch[1]);
      } catch {
        // JSON parsing failed
      }
    }

    // Check if user wants to create (either confirming or initial request with action words)
    const wantsToCreate = message.toLowerCase().match(/(δημιούργησε|φτιάξε|κάντο|θέλω|έχω|πρόσθεσε|βάλε|ναι|yes|ok|οκ|σωστά|εντάξει|proceed|confirm)/);

    // Execute action if we have action data AND user intent
    if (actionData?.action && wantsToCreate) {
      creationResult = await executeAction(actionData, organizationId, sessionId);
    }

    return NextResponse.json({
      message: assistantMessage,
      creationResult,
      actionData: actionData, // Send action data to frontend for preview
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Κάτι πήγε στραβά. Δοκίμασε ξανά.' },
      { status: 500 }
    );
  }
}

async function executeAction(
  actionData: {
    action: string;
    items?: ActivityInput[] | FacilityInput[] | StaffInput[];
    template?: TemplateInput;
  },
  organizationId: string,
  sessionId?: string
) {
  switch (actionData.action) {
    case 'create_activities':
      if (actionData.items) {
        return await createActivities(organizationId, actionData.items as ActivityInput[]);
      }
      break;
    case 'create_facilities':
      if (actionData.items) {
        return await createFacilities(organizationId, actionData.items as FacilityInput[]);
      }
      break;
    case 'create_staff':
      if (actionData.items) {
        return await createStaff(organizationId, actionData.items as StaffInput[]);
      }
      break;
    case 'create_template':
      if (actionData.template) {
        return await createDayTemplate(organizationId, actionData.template);
      }
      break;
  }
  return null;
}
