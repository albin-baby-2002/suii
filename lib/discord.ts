import type { Stock } from '@/lib/db/schema';

export async function sendDiscordAlert(params: {
  stock: Stock;
  currentPrice: number;
  targetPrice: number;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL is not set, skipping Discord notification');
    return;
  }

  const { stock, currentPrice, targetPrice } = params;
  const diffPercent = ((currentPrice - targetPrice) / targetPrice) * 100;
  const direction = diffPercent >= 0 ? 'above' : 'below';

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: `📈 Price Alert: ${stock.name} (${stock.nseSymbol})`,
          color: 0x2563eb,
          fields: [
            { name: 'Current Price', value: `₹${currentPrice.toFixed(2)}`, inline: true },
            { name: 'Target Price', value: `₹${targetPrice.toFixed(2)}`, inline: true },
            {
              name: 'Difference',
              value: `${Math.abs(diffPercent).toFixed(2)}% ${direction} target`,
              inline: true,
            },
          ],
          footer: { text: stock.sector },
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error(`Discord webhook failed: HTTP ${res.status} ${await res.text()}`);
  }
}
