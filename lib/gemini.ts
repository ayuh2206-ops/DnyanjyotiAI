// Gemini AI Integration
// Server-side only - use in API routes

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Model configurations - using stable models
const MODELS = {
  flash: {
    name: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 2048,
  },
  pro: {
    name: 'gemini-1.5-pro',
    temperature: 0.9,
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

interface GeminiResponse {
  text: string;
  tokensUsed: number;
  model: string;
}

/**
 * Generate content using Gemini AI
 * @param prompt - User prompt
 * @param options - Generation options
 * @returns Generated text and metadata
 */
export async function generateContent(
  prompt: string,
  options: GenerateOptions = {}
): Promise<GeminiResponse> {
  // Check for API key
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    throw new Error('AI service not configured. Please set GEMINI_API_KEY in Vercel environment variables.');
  }

  const {
    mode = 'fast',
    temperature,
    maxTokens,
    systemPrompt,
  } = options;

  const modelConfig = mode === 'smart' ? MODELS.pro : MODELS.flash;
  const modelName = modelConfig.name;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody: any = {
    contents: [{
      parts: [{
        text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
      }],
    }],
    generationConfig: {
      temperature: temperature ?? modelConfig.temperature,
      maxOutputTokens: maxTokens ?? modelConfig.maxTokens,
    },
  };

  try {
    console.log(`Calling Gemini API with model: ${modelName}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Gemini API error response:', JSON.stringify(responseData, null, 2));
      throw new Error(`Gemini API error: ${responseData.error?.message || response.statusText}`);
    }

    const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed = responseData.usageMetadata?.totalTokenCount || 0;

    if (!text) {
      console.error('Empty response from Gemini:', JSON.stringify(responseData, null, 2));
      throw new Error('Empty response from Gemini API');
    }

    console.log(`Gemini response received: ${text.substring(0, 100)}...`);

    return {
      text,
      tokensUsed,
      model: modelName,
    };
  } catch (error: any) {
    console.error('Gemini API error:', error.message);
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
): Promise<GeminiResponse> {
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
 * Generate essay grading
 */
export async function gradeEssay(
  question: string,
  answer: string,
  wordLimit: number = 250
): Promise<GeminiResponse> {
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

  const systemPrompt = `You are an experienced UPSC Mains examiner with 20 years of experience. Be fair but strict. Provide constructive feedback that helps students improve. Always respond with valid JSON.`;

  return generateContent(prompt, { mode: 'smart', systemPrompt });
}

/**
 * Socratic chat mode
 */
export async function socraticChat(
  message: string,
  subject: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<GeminiResponse> {
  const historyText = conversationHistory
    .slice(-10) // Last 10 messages for context
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

Remember: Your goal is to make them THINK, not to show off your knowledge.`;

  return generateContent(prompt, { mode: 'fast', systemPrompt, temperature: 0.8 });
}

/**
 * Direct answer mode (faster responses)
 */
export async function directAnswer(
  question: string,
  subject?: string
): Promise<GeminiResponse> {
  const systemPrompt = `You are a UPSC subject expert${subject ? ` specializing in ${subject}` : ''}. Provide clear, accurate, and concise answers suitable for UPSC preparation. Include relevant facts, constitutional provisions, or data where applicable. Keep answers focused and exam-oriented.`;

  return generateContent(question, { mode: 'fast', systemPrompt, temperature: 0.5 });
}

/**
 * Generate flashcards from text
 */
export async function generateFlashcards(
  text: string,
  count: number = 10
): Promise<GeminiResponse> {
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
- Answers should be concise (under 50 words)`;

  const systemPrompt = `You are a UPSC preparation expert creating study materials. Extract the most important, exam-relevant information. Always respond with valid JSON.`;

  return generateContent(prompt, { mode: 'fast', systemPrompt });
}

/**
 * Summarize news/article for UPSC
 */
export async function summarizeForUPSC(
  article: string,
  maxWords: number = 60
): Promise<GeminiResponse> {
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
