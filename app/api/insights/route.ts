import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { context } = await req.json();
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
            content:
              "You are a martial arts coach. Provide a brief, encouraging insight about the user's training patterns in 2-3 sentences.",
          },
          { role: 'user', content: `Provide a brief insight:\n\n${context}` },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) return NextResponse.json({ error: 'OpenAI error' }, { status: 502 });

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ insight });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
