import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ubike-api.onrender.com/api/v1';

// Proxy all /api/proxy/* requests to the backend
// e.g. /api/proxy/auth/register → https://ubike-api.onrender.com/api/v1/auth/register
// This runs server-side so CORS never applies

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const url = `${API_URL}/${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Forward Authorization header if present
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.text();
  }

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'API is waking up, please try again in 30 seconds.' },
      { status: 503 }
    );
  }
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;
