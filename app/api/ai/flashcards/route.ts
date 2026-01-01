// API Route: AI Flashcard Generation
// POST /api/ai/flashcards

import { NextRequest, NextResponse } from 'next/server';
import { generateFlashcards } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, count = 10 } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text content is required' },
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
      flashcards = [];
    }

    return NextResponse.json({
      success: true,
      flashcards,
      tokensUsed: response.tokensUsed,
      model: response.model,
    });
  } catch (error) {
    console.error('Flashcards API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate flashcards' },
      { status: 500 }
    );
  }
}
