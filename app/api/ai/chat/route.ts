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
        { error: 'Message is required', success: false },
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
  } catch (error: any) {
    console.error('Chat API error:', error.message);
    
    // Provide specific error messages
    let errorMessage = 'Failed to generate response. Please try again.';
    let statusCode = 500;
    
    if (error.message?.includes('GEMINI_API_KEY') || error.message?.includes('not configured')) {
      errorMessage = 'AI service not configured. Admin needs to add GEMINI_API_KEY in Vercel settings.';
    } else if (error.message?.includes('Rate limit') || error.message?.includes('429') || error.message?.includes('quota')) {
      errorMessage = 'AI is busy right now. Please wait 30 seconds and try again.';
      statusCode = 429;
    } else if (error.message?.includes('API key')) {
      errorMessage = 'Invalid API key. Please check GEMINI_API_KEY configuration.';
    }
    
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: statusCode }
    );
  }
}
