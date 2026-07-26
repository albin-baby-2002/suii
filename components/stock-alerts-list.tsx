'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Search, Trash2 } from 'lucide-react';

import { deleteAlert } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { getTickerLabel } from '@/lib/stocks';
import { cn } from '@/lib/utils';
import type { Alert, Stock } from '@/lib/db/schema';

export interface StockWithAlerts {
  stock: Stock;
  currentPrice: number | null;
  alerts: Alert[];
}

const TOLERANCE_PERCENT = 1.5;

function AlertRow({
  alert,
  currentPrice,
  currencySymbol,
}: {
  alert: Alert;
  currentPrice: number | null;
  currencySymbol: string;
}) {
  const [isPending, startTransition] = useTransition();
  const diffPercent =
    currentPrice !== null
      ? ((currentPrice - alert.targetPrice) / alert.targetPrice) * 100
      : null;
  const withinBand =
    diffPercent !== null && Math.abs(diffPercent) <= TOLERANCE_PERCENT;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">
          {currencySymbol}
          {alert.targetPrice.toFixed(2)}
        </span>
        {diffPercent !== null && (
          <Badge
            variant="outline"
            className={cn(
              diffPercent >= 0
                ? 'border-green-600/30 text-green-700 dark:text-green-400'
                : 'border-red-600/30 text-red-700 dark:text-red-400',
              withinBand &&
                (diffPercent >= 0 ? 'bg-green-500/15' : 'bg-red-500/15'),
            )}
          >
            {diffPercent >= 0 ? '+' : ''}
            {diffPercent.toFixed(1)}%
          </Badge>
        )}
        {alert.lastAlertedDate && (
          <span className="text-xs text-muted-foreground">
            alerted {alert.lastAlertedDate}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await deleteAlert(alert.id);
              toast.success('Alert deleted');
            } catch {
              toast.error('Failed to delete alert');
            }
          })
        }
      >
        <Trash2 />
        <span className="sr-only">Delete alert</span>
      </Button>
    </div>
  );
}

export function StockAlertsList({ items }: { items: StockWithAlerts[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return items;
    return items.filter(({ stock }) => {
      const haystack =
        `${stock.name} ${getTickerLabel(stock)} ${stock.sector}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [items, query]);

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No alerts yet. Add one above to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 pt-4 pb-2">
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No stocks match &quot;{query}&quot;.
          </CardContent>
        </Card>
      )}

      {filtered.map(({ stock, currentPrice, alerts }) => {
        const currencySymbol = stock.market === 'US' ? '$' : '₹';
        return (
          <Card key={stock.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center gap-2">
                <div className="flex">
                  <span className="min-w-0 truncate text-ellipsis overflow-hidden max-w-50">{stock.name} </span>
                </div>
                <span className="shrink-0 text-base font-normal">
                  {currentPrice !== null
                    ? `${currencySymbol}${currentPrice.toFixed(2)}`
                    : 'price unavailable'}
                </span>
              </CardTitle>
              {stock.sector && (
                <CardDescription>{stock.sector}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {alerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  currentPrice={currentPrice}
                  currencySymbol={currencySymbol}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
