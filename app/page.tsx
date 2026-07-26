import { eq, asc } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { alerts, stocks, type Alert, type Stock } from '@/lib/db/schema';
import { fetchStockPrice } from '@/lib/yahoo';
import { getYahooQuoteSymbol, getTickerLabel } from '@/lib/stocks';
import { AddAlertCard } from '@/components/add-alert-card';
import { StockAlertsList, type StockWithAlerts } from '@/components/stock-alerts-list';
import { CheckNowButton } from '@/components/check-now-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [allStocks, alertRows] = await Promise.all([
    db.select().from(stocks).orderBy(asc(stocks.name)),
    db
      .select({ alert: alerts, stock: stocks })
      .from(alerts)
      .innerJoin(stocks, eq(alerts.stockId, stocks.id)),
  ]);

  const grouped = new Map<number, { stock: Stock; alerts: Alert[] }>();
  for (const { alert, stock } of alertRows) {
    if (!grouped.has(stock.id)) grouped.set(stock.id, { stock, alerts: [] });
    grouped.get(stock.id)!.alerts.push(alert);
  }

  const stocksWithAlerts: StockWithAlerts[] = await Promise.all(
    Array.from(grouped.values()).map(async ({ stock, alerts: stockAlerts }) => {
      const symbol = getYahooQuoteSymbol(stock);
      return {
        stock,
        alerts: stockAlerts,
        currentPrice: symbol ? await fetchStockPrice(symbol) : null,
      };
    })
  );
  stocksWithAlerts.sort((a, b) => a.stock.name.localeCompare(b.stock.name));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="pl-2 text-2xl font-semibold">Stock Alerts</h1>
        <CheckNowButton />
      </div>

      <Tabs defaultValue="alerts">
        <TabsList className="w-full">
          <TabsTrigger value="alerts">Current Alerts</TabsTrigger>
          <TabsTrigger value="add">Add Alert</TabsTrigger>
        </TabsList>
        <TabsContent value="add">
          <AddAlertCard
            initialStocks={allStocks.map((s) => ({
              id: s.id,
              name: s.name,
              ticker: getTickerLabel(s),
              market: s.market,
            }))}
          />
        </TabsContent>
        <TabsContent value="alerts">
          <StockAlertsList items={stocksWithAlerts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
