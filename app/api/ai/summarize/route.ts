import { NextRequest, NextResponse } from 'next/server';
import { summarizeForUPSC } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const result = await summarizeForUPSC(text);

    return NextResponse.json({
      summary: result.text,
      tokensUsed: result.tokensUsed,
      model: result.model
    });

  } catch (error: any) {
    console.error('Summarize API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to summarize text' },
      { status: 500 }
    );
  }
}
