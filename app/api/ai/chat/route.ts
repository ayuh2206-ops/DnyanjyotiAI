// API Route: AI Chat
// POST /api/ai/chat

import { NextRequest, NextResponse } from 'next/server';
import { socraticChat, directAnswer } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, subject, mode = 'socratic', conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    let response;
    
    if (mode === 'socratic') {
      response = await socraticChat(message, subject || 'General', conversationHistory);
    } else {
      response = await directAnswer(message, subject);
    }

    return NextResponse.json({
      success: true,
      response: response.text,
      tokensUsed: response.tokensUsed,
      model: response.model,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
