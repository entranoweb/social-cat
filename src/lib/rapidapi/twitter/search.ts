import { rapidApiAxios } from '../../axios-config';
import { logger } from '../../logger';

/**
 * Twitter Search API via RapidAPI
 *
 * Host: twitter-aio.p.rapidapi.com
 * Endpoint: /search/{query}
 *
 * Updated to use:
 * - Automatic retries with exponential backoff (4 retries)
 * - Handles 429 rate limit errors intelligently
 * - Structured logging
 * - Query result caching (30 minutes TTL)
 */

// Query cache with 30-minute TTL
interface CacheEntry {
  results: SearchResponse;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Cleanup expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, entry] of queryCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      queryCache.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    logger.debug({ cleanedCount }, 'Cleaned up expired Twitter search cache entries');
  }
}, 10 * 60 * 1000);

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const API_HOST = 'twitter-aio.p.rapidapi.com';

interface SearchParams {
  query: string;
  category?: 'Top' | 'Latest' | 'People' | 'Photos' | 'Videos';
  count?: number;
  since?: string; // Format: YYYY-MM-DD
  until?: string; // Format: YYYY-MM-DD
  removePostsWithLinks?: boolean;
  removePostsWithMedia?: boolean;
  // Engagement filters (for finding best performing tweets)
  minimumLikesCount?: number;
  minimumRetweetsCount?: number;
  minimumRepliesCount?: number;
}

interface Tweet {
  tweet_id: string;
  text: string;
  user_name: string;
  user_screen_name: string;
  created_at: string;
  likes?: number;
  retweets?: number;
  replies?: number;
  views?: number;
  media?: unknown[];
  [key: string]: unknown;
}

interface SearchResponse {
  results: Tweet[];
  next_cursor?: string;
}

export async function searchTwitter(params: SearchParams): Promise<SearchResponse> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY not set in environment variables');
  }

  // Generate cache key from params
  const cacheKey = JSON.stringify(params);
  const cached = queryCache.get(cacheKey);

  // Return cached results if not expired
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.info({ query: params.query, cacheHit: true }, 'Using cached Twitter search results');
    return cached.results;
  }

  // Build filters object for date range and engagement thresholds
  const filters: Record<string, string | number | boolean> = {};
  if (params.since) filters.since = params.since;
  if (params.until) filters.until = params.until;
  if (params.minimumLikesCount !== undefined) filters.minimumLikesCount = params.minimumLikesCount;
  if (params.minimumRetweetsCount !== undefined) filters.minimumRetweetsCount = params.minimumRetweetsCount;
  if (params.minimumRepliesCount !== undefined) filters.minimumRepliesCount = params.minimumRepliesCount;
  if (params.removePostsWithLinks) filters.removePostsWithLinks = params.removePostsWithLinks;
  if (params.removePostsWithMedia) filters.removePostsWithMedia = params.removePostsWithMedia;

  const options = {
    method: 'GET',
    url: `https://${API_HOST}/search/${encodeURIComponent(params.query)}`,
    params: {
      count: String(params.count || 20),
      category: params.category || 'Latest',
      ...(Object.keys(filters).length > 0 && { filters: JSON.stringify(filters) }),
      includeTimestamp: 'true',
    },
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': API_HOST,
    },
  };

  try {
    logger.info({ query: params.query, count: params.count }, 'Searching Twitter via RapidAPI');
    const response = await rapidApiAxios.request(options);

    // Parse the complex Twitter AIO response structure
    let results: Tweet[] = [];

    if (response.data.entries && response.data.entries[0]?.entries) {
      const entries = response.data.entries[0].entries;

      for (const entry of entries) {
        try {
          let tweetResult = entry.content?.itemContent?.tweet_results?.result;
          if (!tweetResult) continue;

          // Handle TweetWithVisibilityResults wrapper
          if (tweetResult.__typename === 'TweetWithVisibilityResults') {
            tweetResult = tweetResult.tweet;
          }

          // Now it should be a Tweet
          if (!tweetResult || tweetResult.__typename !== 'Tweet') continue;

          const legacy = tweetResult.legacy;
          const user = tweetResult.core?.user_results?.result?.legacy;

          if (!legacy || !user) continue;

          const tweet: Tweet = {
            tweet_id: tweetResult.rest_id,
            text: legacy.full_text || '',
            user_name: user.name || '',
            user_screen_name: user.screen_name || '',
            created_at: legacy.created_at || '',
            likes: legacy.favorite_count || 0,
            retweets: legacy.retweet_count || 0,
            replies: legacy.reply_count || 0,
            views: tweetResult.views?.count ? parseInt(tweetResult.views.count) : 0,
            media: legacy.entities?.media || [],
          };

          results.push(tweet);
        } catch {
          // Skip malformed tweets
          continue;
        }
      }
    }

    // Filter out tweets with links if requested
    if (params.removePostsWithLinks) {
      results = results.filter(tweet => {
        const text = tweet.text || '';
        // Check for URLs in the text (http, https, or t.co links)
        return !text.match(/https?:\/\/[^\s]+/);
      });
    }

    // Filter out tweets with media if requested
    if (params.removePostsWithMedia) {
      results = results.filter(tweet => {
        return !tweet.media || tweet.media.length === 0;
      });
    }

    logger.info(
      { resultsCount: results.length, query: params.query },
      'Twitter search completed'
    );

    const searchResponse = {
      results,
      next_cursor: response.data.next_cursor,
    };

    // Cache the results
    queryCache.set(cacheKey, {
      results: searchResponse,
      timestamp: Date.now(),
    });

    return searchResponse;
  } catch (error) {
    const axiosError = error as {
      response?: {
        status?: number;
        data?: { message?: string; error?: string };
        headers?: Record<string, string>
      };
      message?: string;
    };

    const status = axiosError.response?.status;
    const responseData = axiosError.response?.data;

    // Create user-friendly error message
    let userMessage = 'Twitter search failed';

    if (status === 429) {
      const rateLimitReset = axiosError.response?.headers?.['x-ratelimit-reset'];
      userMessage = '🚫 RapidAPI quota exhausted or rate limited. ';

      if (rateLimitReset) {
        const resetDate = new Date(parseInt(rateLimitReset) * 1000);
        userMessage += `Resets at: ${resetDate.toLocaleString()}`;
      } else {
        userMessage += 'Check your RapidAPI dashboard for quota status.';
      }
    } else if (status === 401 || status === 403) {
      userMessage = '🔑 RapidAPI authentication failed. Check your RAPIDAPI_KEY environment variable.';
    } else if (status && status >= 500) {
      userMessage = '⚠️ RapidAPI server error. Their service might be down. Try again later.';
    } else if (responseData?.message || responseData?.error) {
      userMessage = `❌ ${responseData.message || responseData.error}`;
    }

    logger.error(
      {
        query: params.query,
        status,
        responseData,
        userMessage,
        headers: axiosError.response?.headers,
      },
      'Twitter Search API Error'
    );

    // Throw error with clear message
    const enhancedError = new Error(userMessage);
    (enhancedError as Error & { originalError: unknown; status?: number }).originalError = error;
    (enhancedError as Error & { status?: number }).status = status;
    throw enhancedError;
  }
}

// Export the Tweet type for use in other modules
export type { Tweet, SearchParams, SearchResponse };
