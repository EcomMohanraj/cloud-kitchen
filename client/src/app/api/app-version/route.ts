import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const buildId = process.env.NEXT_PUBLIC_APP_BUILD_ID || process.env.VERCEL_GIT_COMMIT_SHA || 'dev';
  return NextResponse.json(
    { buildId, timestamp: Date.now() },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    }
  );
}
