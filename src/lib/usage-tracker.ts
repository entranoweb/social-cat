/**
 * Client-side and server-side usage tracking helper
 *
 * Tracks Twitter API usage for rate limit monitoring using atomic SQL operations
 */

import { logger } from './logger';
import { db, useSQLite } from './db';
import { sql, eq } from 'drizzle-orm';

export async function trackTwitterUsage(type: 'post' | 'read'): Promise<void> {
  try {
    // Server-side: Update database directly (more reliable)
    if (typeof window === 'undefined') {
      await trackUsageDirectly(type);
      return;
    }

    // Client-side: Call API endpoint
    await fetch('/api/twitter/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    });

    logger.debug({ type }, 'Tracked Twitter API usage');
  } catch (error) {
    // Don't throw - usage tracking should never break the main flow
    logger.error({ error, type }, 'Failed to track Twitter API usage');
  }
}

/**
 * Direct database tracking (server-side only) using atomic SQL operations
 */
async function trackUsageDirectly(type: 'post' | 'read'): Promise<void> {
  try {
    if (useSQLite) {
      // SQLite path - use new twitter_usage table
      const { twitterUsageTableSQLite } = await import('./schema');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typedDb = db as any;

      const now = new Date();
      const columnToIncrement = type === 'post' ? 'postsCount' : 'readsCount';

      // Window durations in ms
      const windows = [
        { type: 'last_15_minutes', duration: 15 * 60 * 1000 },
        { type: 'last_hour', duration: 60 * 60 * 1000 },
        { type: 'last_24_hours', duration: 24 * 60 * 60 * 1000 },
        { type: 'last_month', duration: 30 * 24 * 60 * 60 * 1000 },
      ];

      for (const window of windows) {
        // Check if window exists and is expired
        const existing = await typedDb
          .select()
          .from(twitterUsageTableSQLite)
          .where(eq(twitterUsageTableSQLite.windowType, window.type))
          .limit(1);

        if (existing.length === 0) {
          // Create new window
          await typedDb.insert(twitterUsageTableSQLite).values({
            windowType: window.type,
            postsCount: type === 'post' ? 1 : 0,
            readsCount: type === 'read' ? 1 : 0,
            windowStart: now,
            updatedAt: now,
          });
        } else {
          const record = existing[0];
          const windowStart = new Date(record.windowStart);
          const elapsed = now.getTime() - windowStart.getTime();

          if (elapsed > window.duration) {
            // Reset expired window
            await typedDb
              .update(twitterUsageTableSQLite)
              .set({
                postsCount: type === 'post' ? 1 : 0,
                readsCount: type === 'read' ? 1 : 0,
                windowStart: now,
                updatedAt: now,
              })
              .where(eq(twitterUsageTableSQLite.windowType, window.type));
          } else {
            // Atomic increment
            await typedDb
              .update(twitterUsageTableSQLite)
              .set({
                [columnToIncrement]: sql`${twitterUsageTableSQLite[columnToIncrement]} + 1`,
                updatedAt: now,
              })
              .where(eq(twitterUsageTableSQLite.windowType, window.type));
          }
        }
      }

      logger.debug({ type }, 'Tracked Twitter API usage (direct, atomic)');
    } else {
      // PostgreSQL path - use new twitter_usage table
      const { twitterUsageTablePostgres } = await import('./schema');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typedDb = db as any;

      const now = new Date();
      const columnToIncrement = type === 'post' ? 'postsCount' : 'readsCount';

      // Window durations in ms
      const windows = [
        { type: 'last_15_minutes', duration: 15 * 60 * 1000 },
        { type: 'last_hour', duration: 60 * 60 * 1000 },
        { type: 'last_24_hours', duration: 24 * 60 * 60 * 1000 },
        { type: 'last_month', duration: 30 * 24 * 60 * 60 * 1000 },
      ];

      for (const window of windows) {
        // Check if window exists and is expired
        const existing = await typedDb
          .select()
          .from(twitterUsageTablePostgres)
          .where(eq(twitterUsageTablePostgres.windowType, window.type))
          .limit(1);

        if (existing.length === 0) {
          // Create new window
          await typedDb.insert(twitterUsageTablePostgres).values({
            windowType: window.type,
            postsCount: type === 'post' ? 1 : 0,
            readsCount: type === 'read' ? 1 : 0,
            windowStart: now,
            updatedAt: now,
          });
        } else {
          const record = existing[0];
          const windowStart = new Date(record.windowStart);
          const elapsed = now.getTime() - windowStart.getTime();

          if (elapsed > window.duration) {
            // Reset expired window
            await typedDb
              .update(twitterUsageTablePostgres)
              .set({
                postsCount: type === 'post' ? 1 : 0,
                readsCount: type === 'read' ? 1 : 0,
                windowStart: now,
                updatedAt: now,
              })
              .where(eq(twitterUsageTablePostgres.windowType, window.type));
          } else {
            // Atomic increment
            await typedDb
              .update(twitterUsageTablePostgres)
              .set({
                [columnToIncrement]: sql`${twitterUsageTablePostgres[columnToIncrement]} + 1`,
                updatedAt: now,
              })
              .where(eq(twitterUsageTablePostgres.windowType, window.type));
          }
        }
      }

      logger.debug({ type }, 'Tracked Twitter API usage (direct, atomic)');
    }
  } catch (error) {
    logger.error({ error, type }, 'Failed to track usage directly');
  }
}

/**
 * Track a post (tweet, reply, retweet, etc.)
 */
export function trackPost(): Promise<void> {
  return trackTwitterUsage('post');
}

/**
 * Track a read operation (search, fetch tweets, etc.)
 */
export function trackRead(): Promise<void> {
  return trackTwitterUsage('read');
}
