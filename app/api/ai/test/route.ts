// API Test Endpoint - Check Gemini API configuration
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  const results: any = {
    timestamp: new Date().toISOString(),
    apiKeyPresent: !!GEMINI_API_KEY,
    apiKeyLength: GEMINI_API_KEY?.length || 0,
    apiKeyPrefix: GEMINI_API_KEY?.substring(0, 10) + '...' || 'NOT SET',
    models: {},
  };

  if (!GEMINI_API_KEY) {
    return NextResponse.json({
      ...results,
      error: 'GEMINI_API_KEY is not set in environment variables',
      fix: 'Go to Vercel Dashboard → Settings → Environment Variables → Add GEMINI_API_KEY'
    });
  }

  // Test different models
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-pro', 
    'gemini-1.0-pro',
    'gemini-pro',
  ];

  for (const model of modelsToTest) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say "Hello" in one word' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        results.models[model] = { 
          status: 'SUCCESS', 
          response: text.substring(0, 50),
          httpStatus: response.status 
        };
      } else {
        results.models[model] = { 
          status: 'FAILED', 
          error: data.error?.message || response.statusText,
          httpStatus: response.status,
          code: data.error?.code
        };
      }
    } catch (error: any) {
      results.models[model] = { 
        status: 'ERROR', 
        error: error.message 
      };
    }
  }

  // Determine overall status and recommendation
  const workingModels = Object.entries(results.models)
    .filter(([_, v]: any) => v.status === 'SUCCESS')
    .map(([k]) => k);

  if (workingModels.length > 0) {
    results.overallStatus = 'WORKING';
    results.workingModels = workingModels;
    results.recommendation = `Use model: ${workingModels[0]}`;
  } else {
    results.overallStatus = 'ALL_FAILED';
    results.recommendation = 'Create a NEW API key from https://aistudio.google.com/app/apikey';
    
    // Check specific error patterns
    const errors = Object.values(results.models).map((m: any) => m.error || '').join(' ');
    if (errors.includes('API key not valid')) {
      results.issue = 'Invalid API key';
    } else if (errors.includes('quota') || errors.includes('rate')) {
      results.issue = 'Quota exhausted - wait or create new key';
    } else if (errors.includes('not found') || errors.includes('does not exist')) {
      results.issue = 'API not enabled on project';
    }
  }

  return NextResponse.json(results, { 
    status: workingModels.length > 0 ? 200 : 500 
  });
}
