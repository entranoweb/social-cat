import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, useSQLite } from '@/lib/db';
import { tweetsTable, youtubeCommentsTable, tweetRepliesTable, appSettingsTable } from '@/lib/schema';
import { eq, count, and, like } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all stats in parallel for better performance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbAny = db as any;
    const [
      twitterPosted,
      twitterReplies,
      youtubeReplied,
      enabledJobs,
    ] = await Promise.all([
      // Count tweets with status 'posted'
      dbAny.select({ count: count() })
        .from(tweetsTable)
        .where(eq(tweetsTable.status, 'posted')) as Promise<Array<{ count: number }>>,

      // Count tweet replies with status 'posted'
      dbAny.select({ count: count() })
        .from(tweetRepliesTable)
        .where(eq(tweetRepliesTable.status, 'posted')) as Promise<Array<{ count: number }>>,

      // Count YouTube comments that have been replied to
      dbAny.select({ count: count() })
        .from(youtubeCommentsTable)
        .where(eq(youtubeCommentsTable.status, 'replied')) as Promise<Array<{ count: number }>>,

      // Count enabled automations (efficient database COUNT)
      dbAny.select({ count: count() })
        .from(appSettingsTable)
        .where(and(
          like(appSettingsTable.key, '%_enabled'),
          eq(appSettingsTable.value, 'true')
        )) as Promise<Array<{ count: number }>>,
    ]);

    const activeJobsCount = enabledJobs[0]?.count || 0;

    // Calculate total executions (tweets posted + replies posted + YouTube replies)
    const totalExecutions =
      (twitterPosted[0]?.count || 0) +
      (twitterReplies[0]?.count || 0) +
      (youtubeReplied[0]?.count || 0);

    return NextResponse.json({
      twitter: {
        tweetsPosted: twitterPosted[0]?.count || 0,
        repliesPosted: twitterReplies[0]?.count || 0,
      },
      youtube: {
        commentsReplied: youtubeReplied[0]?.count || 0,
      },
      system: {
        activeJobs: activeJobsCount,
        totalExecutions,
        database: useSQLite ? 'SQLite' : 'PostgreSQL',
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
