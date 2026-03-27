import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { notes } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    if (!notes?.trim()) return NextResponse.json({ error: 'No notes provided' }, { status: 400 });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a martial arts training assistant. Summarize the user\'s session notes into 2-3 concise sentences with an additional 2-3 bullet points, preserving the key techniques, observations, and takeaways. Keep the tone first-person.',
          },
          { role: 'user', content: notes },
        ],
        temperature: 0.4,
        max_tokens: 120,
      }),
    });

    if (!response.ok) return NextResponse.json({ error: 'OpenAI error' }, { status: 502 });

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
