import { NextRequest, NextResponse } from 'next/server';
import { getStanceById } from '@/lib/definition';
import { compileStance } from '@/lib/prompt-compiler';
import { ChatMessage } from '@/types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-3.5-haiku';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stanceId, message, history } = body as {
      stanceId: string;
      message: string;
      history: ChatMessage[];
    };

    if (!stanceId || !message) {
      return NextResponse.json(
        { error: 'Missing stanceId or message' },
        { status: 400 }
      );
    }

    const stance = getStanceById(stanceId);
    if (!stance) {
      return NextResponse.json(
        { error: 'Stance not found' },
        { status: 404 }
      );
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = compileStance(stance);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'Definition Chat',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.7,
        max_tokens: 512,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', errorData);

      if (response.status === 429) {
        return NextResponse.json(
          { error: '此刻拥堵，请稍候' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: '这位思想家此刻沉默' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    if (!content) {
      return NextResponse.json(
        { error: '这位思想家此刻沉默' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content,
      stance: stance.name,
    });
  } catch (error) {
    console.error('API error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: '此刻沉默' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: '这位思想家此刻沉默' },
      { status: 500 }
    );
  }
}
