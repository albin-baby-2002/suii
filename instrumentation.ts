export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { ensureSeeded } = await import('@/lib/db/seed');
  await ensureSeeded();

  // On Vercel (and other serverless platforms) the process is frozen between
  // requests, so a setInterval here never fires. Use Vercel Cron -> /api/check-alerts
  // instead (see vercel.json). This in-process scheduler is only for
  // long-running deployments (next start / a VPS / Docker).
  if (process.env.VERCEL) return;

  const globalForScheduler = globalThis as unknown as { __alertSchedulerStarted?: boolean };
  if (globalForScheduler.__alertSchedulerStarted) return;
  globalForScheduler.__alertSchedulerStarted = true;

  const { checkAlerts } = await import('@/lib/check-alerts');

  const intervalMinutes = Number(process.env.CHECK_INTERVAL_MINUTES) || 60;

  const runCheck = async () => {
    try {
      const { checkedStocks, firedCount } = await checkAlerts();
      console.log(`[alerts] checked ${checkedStocks} stock(s), fired ${firedCount} alert(s)`);
    } catch (err) {
      console.error('[alerts] check failed:', err);
    }
  };

  await runCheck();
  setInterval(runCheck, intervalMinutes * 60 * 1000);
}
