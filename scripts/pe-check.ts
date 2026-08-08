import 'dotenv/config';
import { inArray } from 'drizzle-orm';
import { db } from '../lib/db/client';
import { stocks, alerts } from '../lib/db/schema';
import { analyzeStockPe, sleep, SCREENER_DELAY_MS, type PeAnalysis } from '../lib/screener';
import { sendPeAlert } from '../lib/discord';
import type { Stock } from '../lib/db/schema';

/** Weekday in IST (NSE's timezone), e.g. "Sunday" — matches the day-gating convention in lib/check-alerts.ts. */
function todayWeekdayIST(): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long' }).format(new Date());
}

async function main() {
  const today = todayWeekdayIST();
  if (today !== 'Sunday') {
    console.log(`Today is ${today} (IST) — P/E check only runs on Sundays, skipping.`);
    return;
  }

  const alertRows = await db.select({ stockId: alerts.stockId }).from(alerts);
  const stockIds = [...new Set(alertRows.map((r) => r.stockId))];

  if (stockIds.length === 0) {
    console.log('No alerts configured yet — nothing to check.');
    return;
  }

  const allTargets = await db.select().from(stocks).where(inArray(stocks.id, stockIds));
  const targets = allTargets.filter((s) => s.market === 'NSE');
  if (allTargets.length > targets.length) {
    console.log(`Skipping ${allTargets.length - targets.length} US stock(s) — screener.in only covers NSE/BSE.`);
  }

  console.log(
    `Checking P/E for ${targets.length} stock(s) on screener.in (rate-limited, ~${SCREENER_DELAY_MS / 1000}s between requests)...\n`
  );

  const flagged: Array<{ stock: Stock; analysis: PeAnalysis }> = [];

  for (const [i, stock] of targets.entries()) {
    process.stdout.write(`${stock.nseSymbol}... `);
    try {
      const analysis = await analyzeStockPe(stock.nseSymbol);
      if (analysis === 'NOT_FOUND') {
        console.log('not found on screener.in, skipping');
      } else {
        console.log(
          `PE ${analysis.currentPE} (~10yr high ${analysis.allTimeHighPE.toFixed(1)}, 5yr median ${analysis.fiveYearMedianPE.toFixed(1)}) -> ${analysis.signal}`
        );
        if (analysis.signal !== 'NORMAL') {
          flagged.push({ stock, analysis });
          await sendPeAlert({ stock, analysis });
        }
      }
    } catch (err) {
      console.log(`error: ${(err as Error).message}`);
    }

    if (i < targets.length - 1) await sleep(SCREENER_DELAY_MS);
  }

  console.log('\n--- Summary ---');
  if (flagged.length === 0) {
    console.log('No stocks are near their P/E high or median band.');
    return;
  }
  for (const { stock, analysis } of flagged) {
    console.log(
      `${stock.nseSymbol}: ${analysis.signal} — PE ${analysis.currentPE} vs ~10yr high ${analysis.allTimeHighPE.toFixed(1)} (${analysis.percentFromAllTimeHigh.toFixed(1)}%) / 5yr median ${analysis.fiveYearMedianPE.toFixed(1)} (${analysis.percentFromMedian >= 0 ? '+' : ''}${analysis.percentFromMedian.toFixed(1)}%)`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
