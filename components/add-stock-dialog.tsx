'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { addStock } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Stock } from '@/lib/db/schema';

export function AddStockDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (stock: Stock) => void;
}) {
  const [name, setName] = useState('');
  const [nseSymbol, setNseSymbol] = useState('');
  const [sector, setSector] = useState('');
  const [marketCap, setMarketCap] = useState<'Large' | 'Mid' | 'Small'>('Mid');
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName('');
    setNseSymbol('');
    setSector('');
    setMarketCap('Mid');
  }

  function handleSubmit() {
    if (!name.trim() || !nseSymbol.trim()) {
      toast.error('Name and NSE symbol are required');
      return;
    }
    startTransition(async () => {
      try {
        const stock = await addStock({ name, nseSymbol, sector, marketCap });
        if (!stock) throw new Error('Could not create stock');
        toast.success(`${stock.name} added`);
        onCreated(stock);
        onOpenChange(false);
        reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to add stock');
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a stock</DialogTitle>
          <DialogDescription>
            Not in the default portfolio? Add its NSE symbol here.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-name">Company name</Label>
            <Input
              id="stock-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tata Motors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-symbol">NSE symbol</Label>
            <Input
              id="stock-symbol"
              value={nseSymbol}
              onChange={(e) => setNseSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. TATAMOTORS"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-sector">Sector (optional)</Label>
            <Input
              id="stock-sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Market cap</Label>
            <Select value={marketCap} onValueChange={(v) => setMarketCap(v as typeof marketCap)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Large">Large</SelectItem>
                <SelectItem value="Mid">Mid</SelectItem>
                <SelectItem value="Small">Small</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Adding...' : 'Add stock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
