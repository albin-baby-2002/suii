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

/** Fetches the latest quoted price for an NSE symbol from Yahoo Finance. Returns null on any failure. */
export async function fetchStockPrice(nseSymbol: string): Promise<number | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(nseSymbol)}.NS`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`Yahoo fetch failed for ${nseSymbol}: HTTP ${res.status}`);
      return null;
    }

    const data: YahooChartResponse = await res.json();
    const price = data.chart.result?.[0]?.meta.regularMarketPrice;

    return typeof price === 'number' ? price : null;
  } catch (err) {
    console.error(`Yahoo fetch error for ${nseSymbol}:`, err);
    return null;
  }
}
