import { NextRequest, NextResponse } from 'next/server';
import { setCredential } from '@/lib/credentials';

// Map credential keys to their platform
const PLATFORM_MAP: Record<string, string> = {
  OPENAI_API_KEY: 'openai',
  TWITTER_API_KEY: 'twitter',
  TWITTER_API_SECRET: 'twitter',
  TWITTER_ACCESS_TOKEN: 'twitter',
  TWITTER_ACCESS_SECRET: 'twitter',
  YOUTUBE_CLIENT_ID: 'youtube',
  YOUTUBE_CLIENT_SECRET: 'youtube',
  YOUTUBE_REDIRECT_URI: 'youtube',
  INSTAGRAM_ACCESS_TOKEN: 'instagram',
  INSTAGRAM_BUSINESS_ACCOUNT_ID: 'instagram',
};

export async function POST(request: NextRequest) {
  try {
    const credentials = await request.json();

    // Save each credential to encrypted database
    const savePromises = [];

    for (const [key, value] of Object.entries(credentials)) {
      if (value && typeof value === 'string' && value.trim()) {
        const platform = PLATFORM_MAP[key] || 'other';
        savePromises.push(setCredential(key, value.trim(), platform));
      }
    }

    await Promise.all(savePromises);

    return NextResponse.json({
      success: true,
      message: 'Credentials saved successfully and encrypted in database. Ready to use!'
    });
  } catch (error) {
    console.error('Error saving setup:', error);
    return NextResponse.json(
      { error: 'Failed to save credentials' },
      { status: 500 }
    );
  }
}
