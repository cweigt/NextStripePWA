import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://zenquotes.io/api/random', { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`ZenQuotes responded with ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 502 });
  }
}
