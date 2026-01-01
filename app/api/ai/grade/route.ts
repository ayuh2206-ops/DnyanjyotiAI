// API Route: AI Essay Grading
// POST /api/ai/grade

import { NextRequest, NextResponse } from 'next/server';
import { gradeEssay } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, answer, wordLimit = 250 } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const response = await gradeEssay(question, answer, wordLimit);

    // Parse the grading response
    let gradingResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        gradingResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing grading response:', parseError);
      // Return a default structure if parsing fails
      gradingResult = {
        totalScore: 5,
        breakdown: {
          content: 1.5,
          structure: 1,
          accuracy: 1.5,
          examples: 1,
        },
        strengths: ['Attempted all aspects of the question'],
        weaknesses: ['Could not fully parse AI response'],
        suggestions: ['Please try again for detailed feedback'],
        modelAnswer: 'Model answer not available',
      };
    }

    return NextResponse.json({
      success: true,
      grading: gradingResult,
      tokensUsed: response.tokensUsed,
      model: response.model,
    });
  } catch (error) {
    console.error('Grading API error:', error);
    return NextResponse.json(
      { error: 'Failed to grade essay' },
      { status: 500 }
    );
  }
}
