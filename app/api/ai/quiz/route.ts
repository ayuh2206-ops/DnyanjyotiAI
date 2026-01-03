// API Route: AI Quiz Generation
// POST /api/ai/quiz

import { NextRequest, NextResponse } from 'next/server';
import { generateQuiz } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      subject, 
      difficulty = 'Medium', 
      count = 5, 
      topics = [] 
    } = body;

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required', success: false },
        { status: 400 }
      );
    }

    const response = await generateQuiz(subject, difficulty, count, topics);

    // Parse the quiz questions from the response
    const questions = parseQuizQuestions(response.text);

    if (questions.length === 0) {
      // If parsing failed, generate fallback questions
      console.warn('Quiz parsing failed, generating fallback questions');
      return NextResponse.json({
        success: true,
        questions: generateFallbackQuestions(subject, count),
        rawResponse: response.text,
        tokensUsed: response.tokensUsed,
        model: response.model,
        warning: 'Generated questions may need review',
      });
    }

    return NextResponse.json({
      success: true,
      questions,
      rawResponse: response.text,
      tokensUsed: response.tokensUsed,
      model: response.model,
    });
  } catch (error: any) {
    console.error('Quiz API error:', error);
    
    let errorMessage = 'Failed to generate quiz. Please try again.';
    let statusCode = 500;
    
    if (error.message?.includes('GEMINI_API_KEY') || error.message?.includes('not configured')) {
      errorMessage = 'AI service not configured. Admin needs to add GEMINI_API_KEY in Vercel settings.';
    } else if (error.message?.includes('Rate limit') || error.message?.includes('429') || error.message?.includes('quota')) {
      errorMessage = 'AI is busy right now. Please wait 30 seconds and try again.';
      statusCode = 429;
    }
    
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: statusCode }
    );
  }
}

interface ParsedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

function parseQuizQuestions(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  // Split by question patterns (Q1., Q2., etc.)
  const questionBlocks = text.split(/Q\d+\.\s+/).filter(Boolean);
  
  for (const block of questionBlocks) {
    try {
      const lines = block.trim().split('\n').filter(line => line.trim());
      
      if (lines.length < 6) continue;
      
      // First line is the question
      const questionText = lines[0].trim();
      
      // Find options
      const options: string[] = [];
      let correctAnswer = '';
      let explanation = '';
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.match(/^[A-D]\)/)) {
          options.push(line.substring(2).trim());
        } else if (line.toLowerCase().startsWith('correct:')) {
          correctAnswer = line.split(':')[1].trim().toUpperCase();
        } else if (line.toLowerCase().startsWith('explanation:')) {
          explanation = line.substring(12).trim();
        }
      }
      
      if (questionText && options.length === 4 && correctAnswer) {
        questions.push({
          question: questionText,
          options,
          correctAnswer,
          explanation: explanation || 'No explanation provided.',
        });
      }
    } catch (e) {
      console.error('Error parsing question block:', e);
      continue;
    }
  }
  
  return questions;
}

// Generate fallback questions if AI parsing fails
function generateFallbackQuestions(subject: string, count: number): ParsedQuestion[] {
  const fallbackQuestions: ParsedQuestion[] = [
    {
      question: `Which of the following is a key concept in ${subject}?`,
      options: ['Constitutional provision', 'Economic theory', 'Scientific principle', 'Historical event'],
      correctAnswer: 'A',
      explanation: 'This is a sample question. Please regenerate for accurate content.',
    },
  ];
  
  return fallbackQuestions.slice(0, count);
}
