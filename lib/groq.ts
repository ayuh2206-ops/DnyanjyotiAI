// Groq AI Integration
// Server-side only - use in API routes

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Groq models - all free tier friendly
const MODELS = {
  // Best for complex tasks
  large: {
    name: 'llama-3.3-70b-versatile',
    maxTokens: 4096,
  },
  // Fast responses
  fast: {
    name: 'llama-3.1-8b-instant',
    maxTokens: 2048,
  },
  // Balanced
  medium: {
    name: 'llama3-70b-8192',
    maxTokens: 4096,
  },
};

export type AIMode = 'fast' | 'smart';

interface GenerateOptions {
  mode?: AIMode;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface GroqResponse {
  text: string;
  tokensUsed: number;
  model: string;
}

/**
 * Generate content using Groq AI
 */
export async function generateContent(
  prompt: string,
  options: GenerateOptions = {}
): Promise<GroqResponse> {
  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set');
    throw new Error('AI service not configured. Please add GROQ_API_KEY in Vercel Settings → Environment Variables.');
  }

  const {
    mode = 'fast',
    temperature = 0.7,
    maxTokens,
    systemPrompt,
  } = options;

  // Select model based on mode
  const model = mode === 'smart' ? MODELS.large : MODELS.fast;

  const messages: any[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: model.name,
        messages,
        temperature,
        max_tokens: maxTokens ?? model.maxTokens,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', data);
      const errorMessage = data.error?.message || 'Unknown error';
      
      if (response.status === 429) {
        throw new Error('AI is busy. Please wait a moment and try again.');
      }
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check GROQ_API_KEY.');
      }
      throw new Error(`AI error: ${errorMessage}`);
    }

    const text = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || 0;

    if (!text) {
      throw new Error('Empty response from AI');
    }

    return {
      text,
      tokensUsed,
      model: model.name,
    };
  } catch (error: any) {
    console.error('Groq API exception:', error);
    throw error;
  }
}

/**
 * Generate quiz questions
 */
export async function generateQuiz(
  subject: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  count: number = 5,
  topics?: string[]
): Promise<GroqResponse> {
  const topicsText = topics?.length ? `Focus on these topics: ${topics.join(', ')}` : '';
  
  const prompt = `Generate ${count} UPSC Prelims style MCQs for ${subject}.
Difficulty: ${difficulty}
${topicsText}

Format each question EXACTLY as:
Q1. [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct: [A/B/C/D]
Explanation: [Brief explanation]

Requirements:
- Questions should be factual and UPSC-relevant
- All options should be plausible
- Explanations should be concise but educational
- Cover diverse aspects of the subject`;

  const systemPrompt = `You are an expert UPSC question paper setter. Create high-quality, exam-standard MCQs that test factual knowledge and conceptual understanding. Ensure questions are accurate and align with UPSC syllabus.`;

  return generateContent(prompt, { mode: 'fast', systemPrompt });
}

/**
 * Grade essay/answer
 */
export async function gradeEssay(
  question: string,
  answer: string,
  wordLimit: number = 250
): Promise<GroqResponse> {
  const prompt = `Grade this UPSC Mains answer.

Question: ${question}
Word Limit: ${wordLimit} words
Student's Answer: ${answer}

Evaluate strictly on:
1. Content Relevance (0-3 marks): Does it address the question directly?
2. Structure & Presentation (0-2 marks): Introduction, body, conclusion, flow
3. Factual Accuracy (0-3 marks): Are facts, dates, provisions correct?
4. Examples & Data (0-2 marks): Use of relevant examples, statistics, case studies

Provide response in this EXACT JSON format:
{
  "totalScore": <number 0-10>,
  "breakdown": {
    "content": <0-3>,
    "structure": <0-2>,
    "accuracy": <0-3>,
    "examples": <0-2>
  },
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "suggestions": ["<suggestion1>", "<suggestion2>"],
  "modelAnswer": "<A brief model answer outline in 50 words>"
}`;

  const systemPrompt = `You are an experienced UPSC Mains examiner with 20 years of experience. Be fair but strict. Provide constructive feedback that helps students improve. Always respond with valid JSON only, no other text.`;

  return generateContent(prompt, { mode: 'smart', systemPrompt, temperature: 0.5 });
}

/**
 * Socratic chat mode
 */
export async function socraticChat(
  message: string,
  subject: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<GroqResponse> {
  const historyText = conversationHistory
    .slice(-10)
    .map(msg => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`)
    .join('\n');

  const prompt = `${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}Student's new message: ${message}`;

  const systemPrompt = `You are a UPSC Socratic Tutor specializing in ${subject}. Your teaching philosophy:

1. NEVER give direct answers immediately
2. First, ask what the student already knows about the topic
3. Probe their understanding with 1-2 clarifying questions
4. Guide them to discover the answer through hints
5. Only provide direct information after 2-3 question cycles
6. Be encouraging, patient, and concise
7. Use examples from Indian context when possible
8. If the student is clearly stuck, provide gentle hints

Remember: Your goal is to make them THINK, not to show off your knowledge. Keep responses concise.`;

  return generateContent(prompt, { mode: 'fast', systemPrompt, temperature: 0.8 });
}

/**
 * Direct answer mode
 */
export async function directAnswer(
  question: string,
  subject?: string
): Promise<GroqResponse> {
  const systemPrompt = `You are a UPSC subject expert${subject ? ` specializing in ${subject}` : ''}. Provide clear, accurate, and concise answers suitable for UPSC preparation. Include relevant facts, constitutional provisions, or data where applicable. Keep answers focused and exam-oriented.`;

  return generateContent(question, { mode: 'fast', systemPrompt, temperature: 0.5 });
}

/**
 * Generate flashcards from text
 */
export async function generateFlashcards(
  text: string,
  count: number = 10
): Promise<GroqResponse> {
  const prompt = `Extract ${count} key concepts from this text and create flashcards.

Text: ${text}

Create flashcards in this EXACT JSON format:
{
  "flashcards": [
    {
      "front": "<Question or term>",
      "back": "<Answer or definition>",
      "topic": "<Topic/Subject>"
    }
  ]
}

Requirements:
- Focus on UPSC-relevant facts
- Questions should be specific and testable
- Answers should be concise (under 50 words)
- Return ONLY valid JSON, no other text`;

  const systemPrompt = `You are a UPSC preparation expert creating study materials. Extract the most important, exam-relevant information. Always respond with valid JSON only.`;

  return generateContent(prompt, { mode: 'fast', systemPrompt, temperature: 0.3 });
}

/**
 * Summarize for UPSC
 */
export async function summarizeForUPSC(
  article: string,
  maxWords: number = 60
): Promise<GroqResponse> {
  const prompt = `Summarize this article in exactly ${maxWords} words for UPSC preparation.

Article: ${article}

Focus on:
1. Main argument or news point
2. Government policy angle (if any)
3. UPSC relevance (which GS paper/topic)

Also identify:
- Primary GS Paper: [1/2/3/4]
- Topics: [comma-separated relevant topics]`;

  const systemPrompt = `You are a UPSC current affairs expert. Create concise, exam-focused summaries that capture the essence for aspirants.`;

  return generateContent(prompt, { mode: 'fast', systemPrompt });
}

export default {
  generateContent,
  generateQuiz,
  gradeEssay,
  socraticChat,
  directAnswer,
  generateFlashcards,
  summarizeForUPSC,
};
