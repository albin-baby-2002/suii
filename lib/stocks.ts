import type { Stock } from '@/lib/db/schema';

type MarketFields = Pick<Stock, 'market' | 'nseSymbol' | 'usSymbol'>;

/** The exact symbol to query on Yahoo Finance for this stock, or null if it has none set. */
export function getYahooQuoteSymbol(stock: MarketFields): string | null {
  if (stock.market === 'US') return stock.usSymbol;
  return stock.nseSymbol ? `${stock.nseSymbol}.NS` : null;
}

/** The ticker to show in the UI — never the internal US-market placeholder in nseSymbol. */
export function getTickerLabel(stock: MarketFields): string {
  return stock.market === 'US' ? (stock.usSymbol ?? '') : stock.nseSymbol;
}

/** Deterministic unique placeholder stored in the (NOT NULL) nseSymbol column for US stocks. */
export function usPlaceholderSymbol(usSymbol: string): string {
  return `__US__${usSymbol}`;
}
