import { db } from './client';
import { stocks } from './schema';
import { PORTFOLIO_STOCKS } from '@/lib/portfolio';

/** Inserts the default portfolio stocks that aren't already in the DB. Safe to call on every startup. */
export async function ensureSeeded() {
  for (const stock of PORTFOLIO_STOCKS) {
    await db
      .insert(stocks)
      .values({
        name: stock.name,
        market: 'NSE',
        nseSymbol: stock.nseSymbol,
        bseCode: stock.bseCode,
        sector: stock.sector,
        marketCap: stock.marketCap,
      })
      .onConflictDoNothing({ target: stocks.nseSymbol });
  }
}
