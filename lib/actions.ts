'use server';

import { db } from '@/lib/db/client';
import { alerts, stocks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { checkAlerts } from '@/lib/check-alerts';
import { searchYahooSymbols, type StockSearchResult } from '@/lib/yahoo';
import { usPlaceholderSymbol } from '@/lib/stocks';

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

/** Searches Yahoo Finance for tickers across NSE (India) and US exchanges. */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  return searchYahooSymbols(query);
}

export async function addStock(input: {
  name: string;
  market: 'NSE' | 'US';
  /** Bare NSE ticker (e.g. "TATAMOTORS") or US ticker (e.g. "AAPL"), depending on market. */
  symbol: string;
  sector?: string;
  marketCap: 'Large' | 'Mid' | 'Small';
}) {
  const name = input.name.trim();
  const symbol = input.symbol.trim().toUpperCase();

  if (!name || !symbol) {
    throw new Error('Name and ticker symbol are required');
  }

  const nseSymbol = input.market === 'NSE' ? symbol : usPlaceholderSymbol(symbol);
  const usSymbol = input.market === 'US' ? symbol : null;
  const conflictTarget = input.market === 'NSE' ? stocks.nseSymbol : stocks.usSymbol;

  const [inserted] = await db
    .insert(stocks)
    .values({
      name,
      market: input.market,
      nseSymbol,
      usSymbol,
      sector: input.sector?.trim() ?? '',
      marketCap: input.marketCap,
    })
    .onConflictDoNothing({ target: conflictTarget })
    .returning();

  revalidatePath('/');

  return (
    inserted ??
    (await db.query.stocks.findFirst({
      where: input.market === 'NSE' ? eq(stocks.nseSymbol, nseSymbol) : eq(stocks.usSymbol, usSymbol!),
    }))
  );
}

/** Manually trigger a price check outside the scheduler, e.g. from a "Check now" button. */
export async function runManualCheck() {
  const result = await checkAlerts();
  revalidatePath('/');
  return result;
}
