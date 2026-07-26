'use server';

import { db } from '@/lib/db/client';
import { alerts, stocks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { checkAlerts } from '@/lib/check-alerts';

export async function addAlert(stockId: number, targetPrice: number) {
  if (!Number.isFinite(stockId) || !Number.isFinite(targetPrice) || targetPrice <= 0) {
    throw new Error('Invalid stock or target price');
  }

  await db.insert(alerts).values({ stockId, targetPrice });
  revalidatePath('/');
}

export async function deleteAlert(alertId: number) {
  await db.delete(alerts).where(eq(alerts.id, alertId));
  revalidatePath('/');
}

export async function addStock(input: {
  name: string;
  nseSymbol: string;
  bseCode?: string;
  sector?: string;
  marketCap: 'Large' | 'Mid' | 'Small';
}) {
  const name = input.name.trim();
  const nseSymbol = input.nseSymbol.trim().toUpperCase();

  if (!name || !nseSymbol) {
    throw new Error('Name and NSE symbol are required');
  }

  const [stock] = await db
    .insert(stocks)
    .values({
      name,
      nseSymbol,
      bseCode: input.bseCode?.trim() ?? '',
      sector: input.sector?.trim() ?? '',
      marketCap: input.marketCap,
    })
    .onConflictDoNothing({ target: stocks.nseSymbol })
    .returning();

  revalidatePath('/');

  return stock ?? (await db.query.stocks.findFirst({ where: eq(stocks.nseSymbol, nseSymbol) }));
}

/** Manually trigger a price check outside the scheduler, e.g. from a "Check now" button. */
export async function runManualCheck() {
  const result = await checkAlerts();
  revalidatePath('/');
  return result;
}
