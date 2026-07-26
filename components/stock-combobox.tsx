'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface StockOption {
  id: number;
  name: string;
  nseSymbol: string;
}

export function StockCombobox({
  stocks,
  value,
  onChange,
  onAddNew,
}: {
  stocks: StockOption[];
  value: number | null;
  onChange: (id: number) => void;
  onAddNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = stocks.find((s) => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" className="w-full justify-between font-normal" />}
      >
        <span className="truncate">
          {selected ? `${selected.name} (${selected.nseSymbol})` : 'Select a stock...'}
        </span>
        <ChevronsUpDown className="opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search stocks..." />
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-2">
                <span>No stock found.</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    onAddNew();
                  }}
                >
                  <Plus /> Add a stock
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {stocks.map((stock) => (
                <CommandItem
                  key={stock.id}
                  value={`${stock.name} ${stock.nseSymbol}`}
                  data-checked={value === stock.id}
                  onSelect={() => {
                    onChange(stock.id);
                    setOpen(false);
                  }}
                >
                  {stock.name}
                  <span className="ml-auto text-xs text-muted-foreground">{stock.nseSymbol}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onAddNew();
                }}
              >
                <Plus /> Add a stock not listed
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
