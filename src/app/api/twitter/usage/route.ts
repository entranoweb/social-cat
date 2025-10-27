import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { twitterUsageTable } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import {
  TwitterUsageTracking,
  createEmptyUsage,
} from '@/lib/config/twitter-tiers';

/**
 * GET /api/twitter/usage
 * Get current Twitter API usage data for both posts and reads from new twitter_usage table
 */
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedDb = db as any;

    // Fetch all windows at once
    const windows = await typedDb
      .select()
      .from(twitterUsageTable);

    // Map window types to usage tracking structure
    type UsageRecord = {
      id: number;
      windowType: string;
      postsCount: number;
      readsCount: number;
      windowStart: Date;
      updatedAt: Date;
    };
    const windowMap = new Map<string, UsageRecord>(windows.map((w: UsageRecord) => [w.windowType, w]));

    const now = Date.now();

    // Helper to create window data with expiry check
    const createWindowData = (windowType: string, duration: number) => {
      const record = windowMap.get(windowType);
      if (!record) {
        return { count: 0, windowStart: new Date(), windowDuration: duration };
      }

      const windowStart = new Date(record.windowStart);
      const elapsed = now - windowStart.getTime();

      // If expired, return reset data
      if (elapsed > duration) {
        return { count: 0, windowStart: new Date(), windowDuration: duration };
      }

      return {
        count: record.postsCount,
        windowStart,
        windowDuration: duration,
      };
    };

    const createReadWindowData = (windowType: string, duration: number) => {
      const record = windowMap.get(windowType);
      if (!record) {
        return { count: 0, windowStart: new Date(), windowDuration: duration };
      }

      const windowStart = new Date(record.windowStart);
      const elapsed = now - windowStart.getTime();

      // If expired, return reset data
      if (elapsed > duration) {
        return { count: 0, windowStart: new Date(), windowDuration: duration };
      }

      return {
        count: record.readsCount,
        windowStart,
        windowDuration: duration,
      };
    };

    const postUsage: TwitterUsageTracking = {
      last15Minutes: createWindowData('last_15_minutes', 15 * 60 * 1000),
      lastHour: createWindowData('last_hour', 60 * 60 * 1000),
      last24Hours: createWindowData('last_24_hours', 24 * 60 * 60 * 1000),
      lastMonth: createWindowData('last_month', 30 * 24 * 60 * 60 * 1000),
      lastUpdated: new Date(),
    };

    const readUsage: TwitterUsageTracking = {
      last15Minutes: createReadWindowData('last_15_minutes', 15 * 60 * 1000),
      lastHour: createReadWindowData('last_hour', 60 * 60 * 1000),
      last24Hours: createReadWindowData('last_24_hours', 24 * 60 * 60 * 1000),
      lastMonth: createReadWindowData('last_month', 30 * 24 * 60 * 60 * 1000),
      lastUpdated: new Date(),
    };

    return NextResponse.json({
      postUsage,
      readUsage,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch Twitter usage data');

    // Return empty usage on error
    return NextResponse.json({
      postUsage: createEmptyUsage(),
      readUsage: createEmptyUsage(),
    });
  }
}

/**
 * POST /api/twitter/usage
 * Increment usage counter for a specific operation type using atomic SQL operations
 *
 * Body: { type: 'post' | 'read' }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type !== 'post' && type !== 'read') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "post" or "read"' },
        { status: 400 }
      );
    }

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
        .from(twitterUsageTable)
        .where(eq(twitterUsageTable.windowType, window.type))
        .limit(1);

      if (existing.length === 0) {
        // Create new window
        await typedDb.insert(twitterUsageTable).values({
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
            .update(twitterUsageTable)
            .set({
              postsCount: type === 'post' ? 1 : 0,
              readsCount: type === 'read' ? 1 : 0,
              windowStart: now,
              updatedAt: now,
            })
            .where(eq(twitterUsageTable.windowType, window.type));
        } else {
          // Atomic increment
          await typedDb
            .update(twitterUsageTable)
            .set({
              [columnToIncrement]: sql`${twitterUsageTable[columnToIncrement]} + 1`,
              updatedAt: now,
            })
            .where(eq(twitterUsageTable.windowType, window.type));
        }
      }
    }

    logger.debug({ type }, 'Incremented Twitter API usage (atomic)');

    return NextResponse.json({
      success: true,
      message: 'Usage tracked successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Failed to increment Twitter usage');
    return NextResponse.json(
      { error: 'Failed to increment usage' },
      { status: 500 }
    );
  }
}
