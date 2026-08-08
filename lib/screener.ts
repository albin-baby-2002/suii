const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/** Delay between every single HTTP request made to screener.in — keep this generous, we don't own the data. */
export const SCREENER_DELAY_MS = 3000;

/** ~10 years — screener.in has no true "IPO to date" endpoint, so this is the longest practical proxy for an all-time-high P/E. */
const LONG_WINDOW_DAYS = 3652;
/** 5 years — matches what was asked for the median/"close to median" comparison. */
const MEDIAN_WINDOW_DAYS = 1825;
/** 3 years — shown alongside the 5yr median since a shorter window is more representative for recently re-rated/listed businesses. */
const SHORT_MEDIAN_WINDOW_DAYS = 1095;
const MS_PER_DAY = 86_400_000;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type PeSignal = 'AT_HIGH' | 'NEAR_HIGH' | 'NEAR_MEDIAN' | 'BELOW_MEDIAN' | 'NORMAL';

export interface PeAnalysis {
  symbol: string;
  currentPE: number;
  currentPEDate: string;
  allTimeHighPE: number;
  allTimeHighDate: string;
  fiveYearMedianPE: number;
  fiveYearHighPE: number;
  threeYearMedianPE: number;
  threeYearHighPE: number;
  /** <= 0. How far the current P/E sits below the (proxy) all-time high, in percent. */
  percentFromAllTimeHigh: number;
  /** Can be positive or negative. How far the current P/E sits from the 5yr median, in percent. */
  percentFromMedian: number;
  /** Can be positive or negative. How far the current P/E sits from the 3yr median, in percent. */
  percentFromThreeYearMedian: number;
  signal: PeSignal;
}

interface CompanyMeta {
  companyId: string;
  consolidated: boolean;
  pageUrl: string;
}

async function fetchText(url: string, referer?: string): Promise<{ ok: boolean; text: string }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/json',
      ...(referer ? { Referer: referer } : {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  return { ok: res.ok, text: res.ok ? await res.text() : '' };
}

/** Screener.in's chart API is keyed by an internal numeric company id, not the ticker — this resolves it from the company page. */
async function resolveCompanyMeta(symbol: string): Promise<CompanyMeta | null> {
  const encoded = encodeURIComponent(symbol);
  // Not every company has consolidated financials — screener.in 404s /consolidated/ for those instead of redirecting.
  for (const path of [`/company/${encoded}/consolidated/`, `/company/${encoded}/`]) {
    const pageUrl = `https://www.screener.in${path}`;
    const { ok, text } = await fetchText(pageUrl);
    if (!ok) continue;

    const idMatch = text.match(/data-company-id="(\d+)"/);
    const consolidatedMatch = text.match(/data-consolidated="(true|false)"/);
    if (!idMatch) continue;

    return { companyId: idMatch[1], consolidated: consolidatedMatch?.[1] === 'true', pageUrl };
  }
  return null;
}

interface ChartResponse {
  datasets: Array<{ metric: string; values: Array<[string, number]> }>;
}

async function fetchPeSeries(meta: CompanyMeta, days: number): Promise<Array<[string, number]>> {
  const params = new URLSearchParams({ q: 'Price to Earning-Median PE-EPS', days: String(days) });
  if (meta.consolidated) params.set('consolidated', 'true');

  const url = `https://www.screener.in/api/company/${meta.companyId}/chart/?${params.toString()}`;
  const { ok, text } = await fetchText(url, meta.pageUrl);
  if (!ok) return [];

  const data: ChartResponse = JSON.parse(text);
  const values = data.datasets.find((d) => d.metric === 'Price to Earning')?.values ?? [];
  // screener.in emits a null P/E for periods of negative/undefined TTM earnings (e.g. a loss-making stretch).
  return values.filter((v): v is [string, number] => typeof v[1] === 'number');
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function windowStats(values: Array<[string, number]>, lastDateMs: number, windowDays: number) {
  const inWindow = values
    .filter(([date]) => lastDateMs - new Date(date).getTime() <= windowDays * MS_PER_DAY)
    .map(([, pe]) => pe);
  return { medianPE: median(inWindow), highPE: Math.max(...inWindow) };
}

function classify(percentFromAllTimeHigh: number, percentFromMedian: number): PeSignal {
  if (percentFromAllTimeHigh >= -0.5) return 'AT_HIGH';
  if (percentFromAllTimeHigh >= -15) return 'NEAR_HIGH';
  if (percentFromMedian <= -10) return 'BELOW_MEDIAN';
  if (Math.abs(percentFromMedian) <= 10) return 'NEAR_MEDIAN';
  return 'NORMAL';
}

/**
 * Fetches P/E history for an NSE ticker from screener.in and checks it against its own
 * ~10yr high and 5yr median. Makes 2 requests, spaced SCREENER_DELAY_MS apart — callers
 * looping over multiple stocks must also sleep(SCREENER_DELAY_MS) between calls.
 */
export async function analyzeStockPe(symbol: string): Promise<PeAnalysis | 'NOT_FOUND'> {
  const meta = await resolveCompanyMeta(symbol);
  if (!meta) return 'NOT_FOUND';

  await sleep(SCREENER_DELAY_MS);

  const values = await fetchPeSeries(meta, LONG_WINDOW_DAYS);
  if (values.length === 0) return 'NOT_FOUND';

  const [currentPEDate, currentPE] = values[values.length - 1];
  const lastDateMs = new Date(currentPEDate).getTime();

  let allTimeHighPE = -Infinity;
  let allTimeHighDate = '';
  for (const [date, pe] of values) {
    if (pe > allTimeHighPE) {
      allTimeHighPE = pe;
      allTimeHighDate = date;
    }
  }

  const { medianPE: fiveYearMedianPE, highPE: fiveYearHighPE } = windowStats(values, lastDateMs, MEDIAN_WINDOW_DAYS);
  const { medianPE: threeYearMedianPE, highPE: threeYearHighPE } = windowStats(
    values,
    lastDateMs,
    SHORT_MEDIAN_WINDOW_DAYS
  );

  const percentFromAllTimeHigh = ((currentPE - allTimeHighPE) / allTimeHighPE) * 100;
  const percentFromMedian = ((currentPE - fiveYearMedianPE) / fiveYearMedianPE) * 100;
  const percentFromThreeYearMedian = ((currentPE - threeYearMedianPE) / threeYearMedianPE) * 100;

  return {
    symbol,
    currentPE,
    currentPEDate,
    allTimeHighPE,
    allTimeHighDate,
    fiveYearMedianPE,
    fiveYearHighPE,
    threeYearMedianPE,
    threeYearHighPE,
    percentFromAllTimeHigh,
    percentFromMedian,
    percentFromThreeYearMedian,
    signal: classify(percentFromAllTimeHigh, percentFromMedian),
  };
}
