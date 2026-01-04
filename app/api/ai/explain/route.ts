import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { question, answer, subject } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const prompt = `You are a UPSC expert. Provide a clear, concise explanation for this question.

Question: ${question}
${answer ? `Correct Answer: ${answer}` : ''}
${subject ? `Subject: ${subject}` : ''}

Provide an explanation that:
1. Explains WHY this is the correct answer
2. Clarifies common misconceptions
3. Provides relevant context for UPSC preparation
4. Mentions any related topics students should study

Keep the explanation under 200 words but ensure it's comprehensive and helpful.`;

    const explanation = await generateContent(prompt, 'smart');

    return NextResponse.json({ explanation });

  } catch (error: any) {
    console.error('Explanation generation error:', error);
    
    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      return NextResponse.json(
        { error: 'AI is busy right now. Please wait 30 seconds and try again.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
