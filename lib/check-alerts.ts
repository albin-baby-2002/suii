import { db } from '@/lib/db/client';
import { alerts, stocks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { fetchStockPrice } from '@/lib/yahoo';
import { sendDiscordAlert } from '@/lib/discord';

/** Proximity band: an alert fires when price is within this % of its target, either side. */
const TOLERANCE_PERCENT = 1.5;

/** Today's date in IST (NSE's timezone) as YYYY-MM-DD, used to gate each alert to once per day. */
function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

/**
 * Checks all alerts against live prices and fires Discord notifications for
 * any that are within the tolerance band and haven't already fired today.
 */
export async function checkAlerts() {
  const today = todayIST();

  const rows = await db
    .select({ alert: alerts, stock: stocks })
    .from(alerts)
    .innerJoin(stocks, eq(alerts.stockId, stocks.id));

  const byStock = new Map<number, { stock: (typeof rows)[number]['stock']; pending: (typeof rows)[number]['alert'][] }>();
  for (const { alert, stock } of rows) {
    if (alert.lastAlertedDate === today) continue;
    if (!byStock.has(stock.id)) byStock.set(stock.id, { stock, pending: [] });
    byStock.get(stock.id)!.pending.push(alert);
  }

  let firedCount = 0;

  for (const { stock, pending } of byStock.values()) {
    if (pending.length === 0) continue;

    const price = await fetchStockPrice(stock.nseSymbol);
    if (price === null) continue;

    for (const alert of pending) {
      const diffPercent = (Math.abs(price - alert.targetPrice) / alert.targetPrice) * 100;
      if (diffPercent > TOLERANCE_PERCENT) continue;

      await sendDiscordAlert({ stock, currentPrice: price, targetPrice: alert.targetPrice });
      await db.update(alerts).set({ lastAlertedDate: today }).where(eq(alerts.id, alert.id));
      firedCount++;
    }
  }

  return { checkedStocks: byStock.size, firedCount };
}
