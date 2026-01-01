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
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    const response = await generateQuiz(subject, difficulty, count, topics);

    // Parse the quiz questions from the response
    const questions = parseQuizQuestions(response.text);

    return NextResponse.json({
      success: true,
      questions,
      rawResponse: response.text,
      tokensUsed: response.tokensUsed,
      model: response.model,
    });
  } catch (error) {
    console.error('Quiz API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
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
