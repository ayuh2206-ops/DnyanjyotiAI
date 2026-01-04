// API Test Endpoint - Check Groq API configuration
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  const results: any = {
    timestamp: new Date().toISOString(),
    provider: 'Groq',
    apiKeyPresent: !!GROQ_API_KEY,
    apiKeyLength: GROQ_API_KEY?.length || 0,
    apiKeyPrefix: GROQ_API_KEY?.substring(0, 10) + '...' || 'NOT SET',
    models: {},
  };

  if (!GROQ_API_KEY) {
    return NextResponse.json({
      ...results,
      error: 'GROQ_API_KEY is not set in environment variables',
      fix: 'Go to Vercel Dashboard → Settings → Environment Variables → Add GROQ_API_KEY',
      getKey: 'Get your free API key from https://console.groq.com/keys'
    });
  }

  // Test Groq models
  const modelsToTest = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama3-70b-8192',
    'mixtral-8x7b-32768',
  ];

  for (const model of modelsToTest) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Say "Hello" in one word' }],
          max_tokens: 10,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const text = data.choices?.[0]?.message?.content || '';
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
        };
      }
    } catch (error: any) {
      results.models[model] = { 
        status: 'ERROR', 
        error: error.message 
      };
    }
  }

  // Determine overall status
  const workingModels = Object.entries(results.models)
    .filter(([_, v]: any) => v.status === 'SUCCESS')
    .map(([k]) => k);

  if (workingModels.length > 0) {
    results.overallStatus = 'WORKING';
    results.workingModels = workingModels;
    results.recommendation = `Your Groq API key works! Using model: ${workingModels[0]}`;
  } else {
    results.overallStatus = 'ALL_FAILED';
    
    const allErrors = Object.values(results.models).map((m: any) => m.error || '').join(' ');
    
    if (allErrors.includes('Invalid API Key') || allErrors.includes('401')) {
      results.issue = 'Invalid API key';
      results.recommendation = 'Your API key is invalid. Get a new one from https://console.groq.com/keys';
    } else if (allErrors.includes('rate') || allErrors.includes('429')) {
      results.issue = 'Rate limit exceeded';
      results.recommendation = 'Wait a minute and try again';
    } else {
      results.issue = 'Unknown error';
      results.recommendation = 'Check your API key at https://console.groq.com/keys';
    }
  }

  return NextResponse.json(results, { 
    status: workingModels.length > 0 ? 200 : 500 
  });
}
