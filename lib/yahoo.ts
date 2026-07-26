const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

interface YahooChartResponse {
  chart: {
    result:
      | [
          {
            meta: {
              regularMarketPrice?: number;
              previousClose?: number;
              currency?: string;
            };
          },
        ]
      | null;
    error: { code: string; description: string } | null;
  };
}

/** Fetches the latest quoted price for an exact Yahoo Finance symbol (e.g. "RELIANCE.NS" or "AAPL"). */
export async function fetchStockPrice(symbol: string): Promise<number | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`Yahoo fetch failed for ${symbol}: HTTP ${res.status}`);
      return null;
    }

    const data: YahooChartResponse = await res.json();
    const price = data.chart.result?.[0]?.meta.regularMarketPrice;

    return typeof price === 'number' ? price : null;
  } catch (err) {
    console.error(`Yahoo fetch error for ${symbol}:`, err);
    return null;
  }
}

export interface StockSearchResult {
  /** Bare ticker for NSE (e.g. "RELIANCE") or full ticker for US (e.g. "AAPL"). */
  symbol: string;
  name: string;
  exchangeDisplay: string;
  market: 'NSE' | 'US';
}

interface YahooSearchResponse {
  quotes?: Array<{
    symbol?: string;
    shortname?: string;
    longname?: string;
    exchange?: string;
    exchDisp?: string;
    quoteType?: string;
  }>;
}

const INDIA_EXCHANGES = new Set(['NSI', 'BSE']);
// Yahoo's search spans every global exchange; restrict results to NSE + US markets
// (per the app's scope) instead of showing Frankfurt/Buenos Aires/Bangkok listings etc.
const US_EXCHANGES = new Set(['NMS', 'NYQ', 'NGM', 'NCM', 'ASE', 'PCX', 'BATS', 'PNK']);

/** Searches Yahoo Finance for equity tickers across NSE (India) and US exchanges. */
export async function searchYahooSymbols(query: string): Promise<StockSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(trimmed)}&quotesCount=10&newsCount=0&lang=en-US&region=US`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`Yahoo search failed for "${query}": HTTP ${res.status}`);
      return [];
    }

    const data: YahooSearchResponse = await res.json();

    return (data.quotes ?? [])
      .filter(
        (q): q is Required<Pick<typeof q, 'symbol'>> & typeof q =>
          q.quoteType === 'EQUITY' &&
          typeof q.symbol === 'string' &&
          (INDIA_EXCHANGES.has(q.exchange ?? '') || US_EXCHANGES.has(q.exchange ?? ''))
      )
      .map((q) => {
        const isIndia = INDIA_EXCHANGES.has(q.exchange ?? '');
        const market: 'NSE' | 'US' = isIndia ? 'NSE' : 'US';
        // Yahoo's own symbol already carries the exchange suffix for India (".NS"/".BO");
        // we store the bare ticker for NSE and re-append ".NS" when fetching quotes.
        const symbol = isIndia ? q.symbol.replace(/\.(NS|BO)$/i, '') : q.symbol;

        return {
          symbol,
          name: q.longname || q.shortname || q.symbol,
          exchangeDisplay: q.exchDisp || q.exchange || '',
          market,
        };
      });
  } catch (err) {
    console.error(`Yahoo search error for "${query}":`, err);
    return [];
  }
}
