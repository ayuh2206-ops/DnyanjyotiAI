import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { topic, subject } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const prompt = `Create a comprehensive hierarchical mind map for the UPSC topic: "${topic}" (Subject: ${subject || 'General'}).

Generate a JSON structure with the following format:
{
  "name": "${topic}",
  "children": [
    {
      "name": "Main Subtopic 1",
      "children": [
        { "name": "Detail 1.1" },
        { "name": "Detail 1.2" },
        { "name": "Detail 1.3" }
      ]
    },
    {
      "name": "Main Subtopic 2",
      "children": [
        { "name": "Detail 2.1" },
        { "name": "Detail 2.2" }
      ]
    }
  ]
}

Requirements:
1. Include 4-6 main subtopics
2. Each subtopic should have 2-4 children with key details
3. Focus on UPSC-relevant points
4. Keep names concise but informative
5. Return ONLY valid JSON, no markdown or explanation

Generate the mind map structure now:`;

    const response = await generateContent(prompt, 'smart');

    // Parse the response to extract JSON
    let mindMapData;
    try {
      // Try to parse directly
      mindMapData = JSON.parse(response);
    } catch {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        mindMapData = JSON.parse(jsonMatch[0]);
      } else {
        // Create a simple fallback structure
        mindMapData = {
          name: topic,
          children: [
            { name: 'Introduction', children: [{ name: 'Overview' }, { name: 'Key concepts' }] },
            { name: 'Main aspects', children: [{ name: 'Important points' }, { name: 'Details' }] },
            { name: 'UPSC relevance', children: [{ name: 'Previous year questions' }, { name: 'Expected questions' }] },
          ]
        };
      }
    }

    return NextResponse.json({ mindMap: mindMapData });

  } catch (error: any) {
    console.error('Mind map generation error:', error);
    
    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      return NextResponse.json(
        { error: 'AI is busy right now. Please wait 30 seconds and try again.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate mind map' },
      { status: 500 }
    );
  }
}
