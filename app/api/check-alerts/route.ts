import { NextRequest, NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/db/seed';
import { checkAlerts } from '@/lib/check-alerts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  await ensureSeeded();
  const result = await checkAlerts();

  return NextResponse.json(result);
}
