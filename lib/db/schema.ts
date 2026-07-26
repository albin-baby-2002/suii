import { sqliteTable, text, real, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const stocks = sqliteTable(
  'stocks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    /** Which market this stock trades on — determines how its symbol is queried on Yahoo Finance. */
    market: text('market', { enum: ['NSE', 'US'] })
      .notNull()
      .default('NSE'),
    /**
     * Bare NSE ticker (no ".NS" suffix), e.g. "ICICIBANK". For US-only stocks
     * this holds a unique placeholder ("__US__" + usSymbol) rather than being
     * left blank or null — kept NOT NULL/unchanged from the original schema
     * so adding US-market support only ever *adds* columns/indexes and never
     * rewrites this one, which is the safest possible migration for an
     * already-seeded production database. Never display this directly for a
     * US stock — use getTickerLabel()/getYahooQuoteSymbol() from lib/stocks.ts.
     */
    nseSymbol: text('nse_symbol').notNull(),
    /** US ticker as quoted on Yahoo Finance, e.g. "AAPL". Null for NSE stocks. */
    usSymbol: text('us_symbol'),
    bseCode: text('bse_code').notNull().default(''),
    sector: text('sector').notNull().default(''),
    marketCap: text('market_cap', { enum: ['Large', 'Mid', 'Small'] })
      .notNull()
      .default('Mid'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    uniqueIndex('stocks_nse_symbol_unique').on(table.nseSymbol),
    // usSymbol is nullable and SQLite treats every NULL as distinct, so
    // multiple NSE-only rows (usSymbol = null) never collide with each other.
    uniqueIndex('stocks_us_symbol_unique').on(table.usSymbol),
  ]
);

export const alerts = sqliteTable('alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id, { onDelete: 'cascade' }),
  targetPrice: real('target_price').notNull(),
  /** ISO date (YYYY-MM-DD) the alert last fired on — gates it to once per day. */
  lastAlertedDate: text('last_alerted_date'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export type Stock = typeof stocks.$inferSelect;
export type NewStock = typeof stocks.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
