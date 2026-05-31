import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ubike.onrender.com/api/v1';

// Server-side proxy — eliminates all CORS issues
// /api/proxy/auth/register → https://ubike-api.onrender.com/api/v1/auth/register

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const url = `${API_URL}/${path}`;

  const headers: Record<string, string> = {};

  const ct = req.headers.get('content-type');
  if (ct) headers['Content-Type'] = ct;

  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const paystack = req.headers.get('x-paystack-signature');
  if (paystack) headers['X-Paystack-Signature'] = paystack;

  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.text();
  }

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body,
      // @ts-ignore — Next.js fetch supports this
      signal: AbortSignal.timeout(55000), // 55s — Render cold start can take up to 50s
    });

    // Try to parse as JSON, fall back to text
    const text = await upstream.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { success: false, error: text }; }

    return NextResponse.json(data, { status: upstream.status });
  } catch (err: any) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return NextResponse.json(
      {
        success: false,
        error: isTimeout
          ? 'API took too long to respond (Render cold start). Please try again.'
          : 'API unreachable. Please try again.',
      },
      { status: 503 }
    );
  }
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;

// Allow 60s max execution on Vercel
export const maxDuration = 60;
