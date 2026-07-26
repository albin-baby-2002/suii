'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { addAlert } from '@/lib/actions';
import { StockCombobox, type StockOption } from '@/components/stock-combobox';
import { AddStockDialog } from '@/components/add-stock-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Stock } from '@/lib/db/schema';

export function AddAlertCard({ initialStocks }: { initialStocks: StockOption[] }) {
  const [stocks, setStocks] = useState(initialStocks);
  const [stockId, setStockId] = useState<number | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleStockCreated(stock: Stock) {
    setStocks((prev) => [...prev, { id: stock.id, name: stock.name, nseSymbol: stock.nseSymbol }]);
    setStockId(stock.id);
  }

  function handleSubmit() {
    if (!stockId) {
      toast.error('Pick a stock first');
      return;
    }
    const price = Number(targetPrice);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Enter a valid target price');
      return;
    }
    startTransition(async () => {
      try {
        await addAlert(stockId, price);
        toast.success('Alert added');
        setTargetPrice('');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to add alert');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a price alert</CardTitle>
        <CardDescription>
          Get a Discord ping (once a day, max) when a stock trades within 1.5% of the target.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>Stock</Label>
          <StockCombobox
            stocks={stocks}
            value={stockId}
            onChange={setStockId}
            onAddNew={() => setDialogOpen(true)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="target-price">Target price (₹)</Label>
          <Input
            id="target-price"
            type="number"
            min="0"
            step="0.05"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            className="sm:w-36"
            placeholder="e.g. 1450"
          />
        </div>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Adding...' : 'Add alert'}
        </Button>
      </CardContent>
      <AddStockDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={handleStockCreated} />
    </Card>
  );
}
