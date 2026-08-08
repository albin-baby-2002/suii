import type { Stock } from '@/lib/db/schema';
import type { PeAnalysis } from '@/lib/screener';

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

const PE_SIGNAL_LABELS: Record<PeAnalysis['signal'], string> = {
  AT_HIGH: '🔴 At all-time-high P/E',
  NEAR_HIGH: '🟠 Near all-time-high P/E',
  NEAR_MEDIAN: '🟡 Near 5yr median P/E',
  BELOW_MEDIAN: '🟢 Below 5yr median P/E',
  NORMAL: 'Normal',
};

export async function sendPeAlert(params: { stock: Stock; analysis: PeAnalysis }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL is not set, skipping Discord notification');
    return;
  }

  const { stock, analysis } = params;
  const isHighSide = analysis.signal === 'AT_HIGH' || analysis.signal === 'NEAR_HIGH';

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: `${PE_SIGNAL_LABELS[analysis.signal]}: ${stock.name} (${stock.nseSymbol})`,
          color: isHighSide ? 0xdc2626 : 0x16a34a,
          fields: [
            { name: 'Current P/E', value: analysis.currentPE.toFixed(1), inline: true },
            {
              name: '~10yr High P/E',
              value: `${analysis.allTimeHighPE.toFixed(1)} (${analysis.percentFromAllTimeHigh.toFixed(1)}%)`,
              inline: true,
            },
            {
              name: '5yr Median P/E',
              value: `${analysis.fiveYearMedianPE.toFixed(1)} (${analysis.percentFromMedian >= 0 ? '+' : ''}${analysis.percentFromMedian.toFixed(1)}%)`,
              inline: true,
            },
            {
              name: '3yr Median P/E',
              value: `${analysis.threeYearMedianPE.toFixed(1)} (${analysis.percentFromThreeYearMedian >= 0 ? '+' : ''}${analysis.percentFromThreeYearMedian.toFixed(1)}%)`,
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
