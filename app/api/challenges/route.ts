import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { context, count = 3 } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 500 });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a martial arts training coach AI. Generate personalized training challenges.
Return ONLY a valid JSON array with ${count} challenges in this exact format:
[
  {
    "title": "Challenge title",
    "description": "Detailed description",
    "difficulty": "beginner|intermediate|advanced",
    "focusAreas": ["tag1", "tag2"],
    "estimatedDuration": "X hours/days/weeks"
  }
]`,
          },
          {
            role: 'user',
            content: `Generate ${count} personalized challenges based on this training history:\n\n${context}`,
          },
        ],
      }),
    });

    if (!response.ok) return NextResponse.json({ error: 'OpenAI error' }, { status: 502 });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? '[]';
    const challenges = JSON.parse(content);
    return NextResponse.json({ challenges });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
