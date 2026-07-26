'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

import { deleteAlert } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Alert, Stock } from '@/lib/db/schema';

export interface StockWithAlerts {
  stock: Stock;
  currentPrice: number | null;
  alerts: Alert[];
}

const TOLERANCE_PERCENT = 1.5;

function AlertRow({ alert, currentPrice }: { alert: Alert; currentPrice: number | null }) {
  const [isPending, startTransition] = useTransition();
  const diffPercent =
    currentPrice !== null ? ((currentPrice - alert.targetPrice) / alert.targetPrice) * 100 : null;
  const withinBand = diffPercent !== null && Math.abs(diffPercent) <= TOLERANCE_PERCENT;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">₹{alert.targetPrice.toFixed(2)}</span>
        {diffPercent !== null && (
          <Badge variant={withinBand ? 'default' : 'outline'}>
            {diffPercent >= 0 ? '+' : ''}
            {diffPercent.toFixed(1)}%
          </Badge>
        )}
        {alert.lastAlertedDate && (
          <span className="text-xs text-muted-foreground">alerted {alert.lastAlertedDate}</span>
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
      {items.map(({ stock, currentPrice, alerts }) => (
        <Card key={stock.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>
                {stock.name} <span className="text-muted-foreground">({stock.nseSymbol})</span>
              </span>
              <span className="text-base font-normal">
                {currentPrice !== null ? `₹${currentPrice.toFixed(2)}` : 'price unavailable'}
              </span>
            </CardTitle>
            {stock.sector && <CardDescription>{stock.sector}</CardDescription>}
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {alerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} currentPrice={currentPrice} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
