'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

import { runManualCheck } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CheckNowButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            const { checkedStocks, firedCount } = await runManualCheck();
            toast.success(`Checked ${checkedStocks} stock(s), ${firedCount} alert(s) fired`);
          } catch {
            toast.error('Check failed');
          }
        })
      }
    >
      <RefreshCw className={cn(isPending && 'animate-spin')} />
      Check now
    </Button>
  );
}
