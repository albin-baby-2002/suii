'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronsUpDown, Loader2 } from 'lucide-react';

import { searchStocks } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import type { StockSearchResult } from '@/lib/yahoo';

export interface StockOption {
  id: number;
  name: string;
  ticker: string;
  market: 'NSE' | 'US';
}

export function StockCombobox({
  stocks,
  value,
  onChange,
  onSelectSearchResult,
}: {
  stocks: StockOption[];
  value: number | null;
  onChange: (id: number) => void;
  onSelectSearchResult: (result: StockSearchResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const requestId = useRef(0);
  const selected = stocks.find((s) => s.id === value);

  const trimmedQuery = query.trim().toLowerCase();
  const matchingStocks = trimmedQuery
    ? stocks.filter((s) => `${s.name} ${s.ticker}`.toLowerCase().includes(trimmedQuery))
    : stocks;

  function handleQueryChange(next: string) {
    setQuery(next);
    if (!next.trim()) {
      requestId.current++;
      setResults([]);
      setSearching(false);
    }
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const id = ++requestId.current;
    const timeout = setTimeout(() => {
      setSearching(true);
      searchStocks(trimmed)
        .then((found) => {
          if (requestId.current === id) setResults(found);
        })
        .finally(() => {
          if (requestId.current === id) setSearching(false);
        });
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const newResults = results.filter(
    (r) => !stocks.some((s) => s.ticker === r.symbol && s.market === r.market)
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger
        render={<Button variant="outline" className="w-full justify-between font-normal" />}
      >
        <span className="truncate">
          {selected ? `${selected.name} (${selected.ticker})` : 'Select a stock'}
        </span>
        <ChevronsUpDown className="opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search stocks or a ticker..."
            value={query}
            onValueChange={handleQueryChange}
          />
          <CommandList>
            {matchingStocks.length === 0 && newResults.length === 0 && !searching && (
              <CommandEmpty>No stock found.</CommandEmpty>
            )}
            {matchingStocks.length > 0 && (
              <CommandGroup heading="Your stocks">
                {matchingStocks.map((stock) => (
                  <CommandItem
                    key={stock.id}
                    value={`${stock.name} ${stock.ticker}`}
                    data-checked={value === stock.id}
                    onSelect={() => {
                      onChange(stock.id);
                      setOpen(false);
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">{stock.name}</span>
                    <span className="shrink-0 text-right text-xs text-muted-foreground">
                      {stock.ticker}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {(newResults.length > 0 || searching) && trimmedQuery && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Search results">
                  {searching && newResults.length === 0 && (
                    <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" /> Searching Yahoo Finance...
                    </div>
                  )}
                  {newResults.map((r) => (
                    <CommandItem
                      key={`${r.market}:${r.symbol}`}
                      value={`${r.name} ${r.symbol}`}
                      onSelect={() => {
                        onSelectSearchResult(r);
                        setOpen(false);
                      }}
                    >
                      <span className="min-w-0 flex-1 truncate">{r.name}</span>
                      <Badge variant="outline" className="shrink-0">
                        {r.market}
                      </Badge>
                      <span className="shrink-0 text-right text-xs text-muted-foreground">
                        {r.symbol}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
