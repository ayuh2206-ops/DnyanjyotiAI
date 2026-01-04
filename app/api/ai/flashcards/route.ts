// API Route: AI Flashcard Generation
// POST /api/ai/flashcards

import { NextRequest, NextResponse } from 'next/server';
import { generateFlashcards } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, count = 10 } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text content is required', success: false },
        { status: 400 }
      );
    }

    const response = await generateFlashcards(text, count);

    // Parse flashcards from response
    let flashcards;
    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        flashcards = parsed.flashcards || [];
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Error parsing flashcards:', parseError);
      // Return sample flashcards if parsing fails
      flashcards = [
        {
          front: 'Sample flashcard - parsing failed',
          back: 'Please try again with different content',
          topic: 'System'
        }
      ];
    }

    return NextResponse.json({
      success: true,
      flashcards,
      tokensUsed: response.tokensUsed,
      model: response.model,
    });
  } catch (error: any) {
    console.error('Flashcards API error:', error);
    
    let errorMessage = 'Failed to generate flashcards. Please try again.';
    let statusCode = 500;
    
    if (error.message?.includes('GROQ_API_KEY') || error.message?.includes('not configured')) {
      errorMessage = 'AI service not configured. Admin needs to add GROQ_API_KEY in Vercel settings.';
    } else if (error.message?.includes('busy') || error.message?.includes('429')) {
      errorMessage = 'AI is busy right now. Please wait a moment and try again.';
      statusCode = 429;
    }
    
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: statusCode }
    );
  }
}
